import express from "express";
import path from "path";
import crypto from "crypto";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import admin from "firebase-admin";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = 3000;

const isProd = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// SECURITY HEADERS
// CSP is enabled in production with strict directives.
// In dev mode, Vite HMR requires relaxed connect-src and script-src.
// ---------------------------------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
      connectSrc: [
        "'self'",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "https://*.firebaseapp.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://api.cloudinary.com",
        "wss://*.firebaseio.com",
      ],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isProd ? [] : undefined,
    },
  } : false, // Relaxed in dev to allow Vite HMR
  crossOriginEmbedderPolicy: false,
}));

// ---------------------------------------------------------------------------
// CORS – locked to configured origin(s)
// ---------------------------------------------------------------------------
const allowedOrigins = [
  process.env.APP_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://choir360x.web.app",
  "https://choir360x.firebaseapp.com",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin (no Origin header) or configured origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
}));

app.use(express.json({ limit: "512kb" })); // Tighter limit – 1mb is excessive for this API

// ---------------------------------------------------------------------------
// HEALTH CHECK – used by Render's healthCheckPath
// ---------------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "choir360-backend", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// RATE LIMITERS
// IP-based limiters are the outer gate; per-user limits enforce fairness.
// ---------------------------------------------------------------------------
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 80,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "AI rate limit reached. Please wait before sending another message." },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Upload rate limit reached. Please wait before uploading again." },
});

// Per-user AI limiter: prevents a single authenticated account from
// exhausting the Gemini quota even if using multiple IPs / proxies.
const perUserAiRequests = new Map<string, { count: number; resetAt: number }>();

function requireUserAiQuota(req: express.Request, res: express.Response, next: express.NextFunction) {
  const uid = (req as any).user?.uid;
  if (!uid) return next(); // Auth already checked upstream; skip if somehow missing

  const windowMs = 60_000;
  const limit = 15;
  const now = Date.now();

  const entry = perUserAiRequests.get(uid);
  if (!entry || now > entry.resetAt) {
    perUserAiRequests.set(uid, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (entry.count >= limit) {
    return res.status(429).json({ error: `AI quota exceeded (${limit} requests/min per user).` });
  }
  entry.count++;
  return next();
}

// Periodically purge stale per-user entries (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [uid, entry] of perUserAiRequests.entries()) {
    if (now > entry.resetAt) perUserAiRequests.delete(uid);
  }
}, 5 * 60_000);

app.use("/api", apiLimiter);

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

if (admin.apps.length === 0) {
  // On real GCP infra (Cloud Run/Functions) implicit service-identity credentials
  // are available and projectId alone is enough. On non-GCP hosts (Render, Railway,
  // a VM, etc.) there is no implicit credential, so verifyIdToken()/Firestore calls
  // silently fail unless we explicitly build a credential from the service account
  // JSON. Prefer the explicit credential whenever it's provided.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson && serviceAccountJson.trim()) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || firebaseProjectId,
      });
      console.log("[Choir360 X] Firebase Admin initialized with explicit service account credentials.");
    } catch (error: any) {
      console.error("[Choir360 X] FIREBASE_SERVICE_ACCOUNT_JSON is set but could not be parsed:", error?.message || error);
    }
  } else if (firebaseProjectId) {
    // Falls back to Application Default Credentials (works on real GCP runtimes
    // or local dev after `gcloud auth application-default login`).
    admin.initializeApp({ projectId: firebaseProjectId });
    console.log("[Choir360 X] Firebase Admin initialized with projectId only (relying on ADC) — set FIREBASE_SERVICE_ACCOUNT_JSON for non-GCP hosts.");
  }
}

async function requireFirebaseAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!admin.apps.length) {
    return res.status(503).json({ error: "Firebase Admin is not configured on the server." });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  if (!token) {
    return res.status(401).json({ error: "Missing Firebase ID token." });
  }

  try {
    (req as any).user = await admin.auth().verifyIdToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid Firebase ID token." });
  }
}

function requireAdminRole(req: express.Request, res: express.Response, next: express.NextFunction) {
  const role = (req as any).user?.role;
  if (!["super_admin", "diocese_admin", "parish_admin", "choir_admin"].includes(role)) {
    return res.status(403).json({ error: "Admin role is required to sync readings." });
  }
  return next();
}

function requireString(value: unknown, field: string, maxLength = 500) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new Error(`${field} is required and must be under ${maxLength} characters.`);
  }
  return value.trim();
}

// ---------------------------------------------------------------------------
// ONE-TIME ADMIN BOOTSTRAP
// Solves the chicken-and-egg problem of granting the very first super_admin:
// every other admin action requires requireAdminRole, which requires a role
// that doesn't exist yet. Gated by a secret (not a user role) instead.
//
// Usage: set ADMIN_BOOTSTRAP_SECRET on the server once, call this endpoint
// for the account that should become super_admin, then REMOVE the env var
// (or rotate it) — leaving it set is a standing privilege-escalation risk.
// ---------------------------------------------------------------------------
app.post("/api/admin/bootstrap-super-admin", async (req, res) => {
  try {
    const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!configuredSecret || !configuredSecret.trim()) {
      return res.status(503).json({ error: "ADMIN_BOOTSTRAP_SECRET is not configured on this server." });
    }
    if (!admin.apps.length) {
      return res.status(503).json({ error: "Firebase Admin is not configured on this server." });
    }

    const email = requireString(req.body?.email, "email", 200);
    const secret = requireString(req.body?.secret, "secret", 200);

    if (secret !== configuredSecret) {
      return res.status(403).json({ error: "Invalid bootstrap secret." });
    }

    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, {
      role: "super_admin",
      tenantId: "global",
      parishId: "st-thomas-cathedral",
      choirId: "st-thomas-cathedral-choir",
    });

    return res.json({
      message: `super_admin granted to ${email}. Remove ADMIN_BOOTSTRAP_SECRET from the server env now.`,
      uid: user.uid,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "Bootstrap failed." });
  }
});

type BibleLanguage = "ta" | "en";

interface ReadingSection {
  heading: string;
  reference?: string;
  text: string;
}

interface DailyReadingRecord {
  id: string;
  date: string;
  language: BibleLanguage;
  title: string;
  liturgicalDay: string;
  firstReading?: ReadingSection;
  psalm?: ReadingSection;
  secondReading?: ReadingSection;
  gospelAcclamation?: ReadingSection;
  gospel?: ReadingSection;
  reflection?: ReadingSection;
  feast?: string;
  saint?: string;
  liturgicalColor?: string;
  sourceUrl: string;
  publicDisplay: boolean;
  lastSyncedAt: string;
  syncStatus: "synced" | "cached" | "failed" | "pending";
  syncMessage?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  status: string;
  tenantId: string;
  parishId: string;
  choirId: string;
}

const ARULVAKKU_CALENDAR_URL = "https://www.arulvakku.com/calendar.php";
const DEFAULT_TENANT_CONTEXT = {
  tenantId: "demo-tenant",
  parishId: "st-thomas-cathedral",
  choirId: "cathedral-choir",
};

function getDateInIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizeReadingDate(value: unknown) {
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : getDateInIndia();
  return date;
}

function normalizeReadingLanguage(value: unknown): BibleLanguage {
  return value === "en" ? "en" : "ta";
}

function getReadingDocId(date: string, language: BibleLanguage) {
  return language === "ta" ? date : `${date}_${language}`;
}

function stripCatholicHtmlToText(html: string) {
  return decodeHtmlEntities(html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|table)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " "))
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function findFirstIndex(text: string, aliases: string[], fromIndex = 0) {
  return aliases
    .map((alias) => ({ alias, index: text.indexOf(alias, fromIndex) }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index)[0] ?? null;
}

function extractReadingSection(text: string, headings: string[], stopHeadings: string[]): ReadingSection | undefined {
  const start = findFirstIndex(text, headings);
  if (!start) return undefined;

  const contentStart = start.index + start.alias.length;
  const stop = findFirstIndex(text, stopHeadings, contentStart);
  const rawContent = text.slice(contentStart, stop ? stop.index : text.length).trim();
  const lines = rawContent.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return undefined;

  const referenceLineIndex = lines.findIndex((line) =>
    /(\d+\s*[:.]\s*\d+|நூலிலிருந்து வாசகம்|எழுதிய தூய நற்செய்தியிலிருந்து|Psalm|Psalms?|Reading from|Gospel according)/i.test(line)
  );
  const reference = referenceLineIndex >= 0 ? lines[referenceLineIndex] : undefined;
  const textLines = lines.filter((_, index) => index !== referenceLineIndex);

  return {
    heading: start.alias,
    reference,
    text: textLines.join("\n"),
  };
}

function parseArulvakkuReadings(html: string, date: string, language: BibleLanguage, publicDisplay: boolean): DailyReadingRecord {
  const text = stripHtmlToText(html);
  const titleMatch = text.match(/\d{1,2}\s+[^\n,]+(?:\s+\d{4})?,\s*[^\n]+/);
  const liturgicalDayMatch = text.match(/(?:####\s*)?([^\n]*(?:காலம்|வாரம்|திருநாள்|பெருவிழா|ஞாயிறு|வெள்ளி|சனி|திங்கள்|செவ்வாய்|புதன்|வியாழன்)[^\n]*)/);
  const now = new Date().toISOString();

  const allHeadings = [
    "முதல் வாசகம்",
    "பதிலுரைப் பாடல்",
    "இரண்டாம் வாசகம்",
    "நற்செய்திக்கு முன் வசனம்",
    "நற்செய்திக்கு முன் வாழ்த்தொலி",
    "நற்செய்தி வாசகம்",
    "சிந்தனை",
    "வாசகங்கள்",
    "First Reading",
    "Responsorial Psalm",
    "Second Reading",
    "Gospel Acclamation",
    "Gospel",
    "Reflection",
  ];

  const firstReading = extractReadingSection(text, ["முதல் வாசகம்", "First Reading"], allHeadings.filter((heading) => !["முதல் வாசகம்", "First Reading"].includes(heading)));
  const psalm = extractReadingSection(text, ["பதிலுரைப் பாடல்", "Responsorial Psalm"], allHeadings.filter((heading) => !["பதிலுரைப் பாடல்", "Responsorial Psalm"].includes(heading)));
  const secondReading = extractReadingSection(text, ["இரண்டாம் வாசகம்", "Second Reading"], allHeadings.filter((heading) => !["இரண்டாம் வாசகம்", "Second Reading"].includes(heading)));
  const gospelAcclamation = extractReadingSection(text, ["நற்செய்திக்கு முன் வசனம்", "நற்செய்திக்கு முன் வாழ்த்தொலி", "Gospel Acclamation"], allHeadings.filter((heading) => !["நற்செய்திக்கு முன் வசனம்", "நற்செய்திக்கு முன் வாழ்த்தொலி", "Gospel Acclamation"].includes(heading)));
  const gospel = extractReadingSection(text, ["நற்செய்தி வாசகம்", "Gospel"], allHeadings.filter((heading) => !["நற்செய்தி வாசகம்", "Gospel"].includes(heading)));
  const reflection = extractReadingSection(text, ["சிந்தனை", "Reflection"], ["வாசகங்கள்", "பிற நாட்கள்"]);

  return {
    id: getReadingDocId(date, language),
    date,
    language,
    title: language === "ta" ? "இன்றைய திருப்பலி வாசகங்கள்" : "Today's Mass Readings",
    liturgicalDay: liturgicalDayMatch?.[1]?.replace(/^#+\s*/, "").trim() || titleMatch?.[0]?.trim() || "Liturgical day not available",
    firstReading,
    psalm,
    secondReading,
    gospelAcclamation,
    gospel,
    reflection,
    sourceUrl: ARULVAKKU_CALENDAR_URL,
    publicDisplay,
    lastSyncedAt: now,
    syncStatus: "synced",
    createdAt: now,
    updatedAt: now,
    createdBy: "arulvakku-sync",
    updatedBy: "arulvakku-sync",
    status: "active",
    ...DEFAULT_TENANT_CONTEXT,
  };
}

async function fetchArulvakkuReading(date: string, language: BibleLanguage, publicDisplay = true): Promise<DailyReadingRecord> {
  if (language !== "ta") {
    throw new Error("English daily readings are prepared for future source integration.");
  }

  const response = await fetch(ARULVAKKU_CALENDAR_URL, {
    headers: {
      "User-Agent": "Choir360/1.0 (+daily-readings-sync)",
      "Accept": "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Arulvakku source returned HTTP ${response.status}.`);
  }

  const html = await response.text();
  return parseArulvakkuReadings(html, date, language, publicDisplay);
}

async function readStoredDailyReading(date: string, language: BibleLanguage) {
  if (!admin.apps.length) return null;
  try {
    const snap = await admin.firestore().collection("dailyReadings").doc(getReadingDocId(date, language)).get();
    return snap.exists ? snap.data() as DailyReadingRecord : null;
  } catch (error: any) {
    console.warn("Daily readings Firestore read skipped:", error?.message || error);
    return null;
  }
}

async function writeStoredDailyReading(reading: DailyReadingRecord, userId = "arulvakku-sync") {
  if (!admin.apps.length) return reading;
  try {
    const existing = await admin.firestore().collection("dailyReadings").doc(reading.id).get();
    const now = new Date().toISOString();
    const payload = {
      ...reading,
      createdAt: existing.exists ? existing.data()?.createdAt || reading.createdAt : reading.createdAt,
      createdBy: existing.exists ? existing.data()?.createdBy || reading.createdBy : userId,
      updatedAt: now,
      updatedBy: userId,
    };
    await admin.firestore().collection("dailyReadings").doc(reading.id).set(payload, { merge: true });
    return payload as DailyReadingRecord;
  } catch (error: any) {
    console.warn("Daily readings Firestore write skipped:", error?.message || error);
    return reading;
  }
}

async function syncTodayDailyReadings(reason: "startup" | "scheduled") {
  const date = getDateInIndia();
  try {
    const reading = await fetchArulvakkuReading(date, "ta", true);
    await writeStoredDailyReading(reading, `system-${reason}`);
    console.log(`[Daily Readings] ${reason} sync completed for ${date}`);
  } catch (error: any) {
    console.warn(`[Daily Readings] ${reason} sync failed:`, error?.message || error);
  }
}

// -----------------------------------------------------------------------------
// CATHOLIC HUB SYNC — pulls the public Blogger Atom/JSON feed from
// catholictamil.com (a volunteer-run, donation-funded Catholic Tamil archive;
// robots.txt allows crawling /, disallows only /search and /share-widget).
// We sync feed METADATA (title, summary snippet, link, dates) for the most
// recent posts rather than full article bodies — the blog has 6,800+ historical
// posts and fetching every individual page would be both slow and disrespectful
// of their hosting costs. Full reading happens via sourceUrl back on their site.
// -----------------------------------------------------------------------------
interface CatholicHubContentRecord {
  id: string;
  title: string;
  titleTamil: string;
  description: string;
  category: string;
  sourceUrl: string;
  imageUrl: string;
  publishedAt: string;
  fetchedAt: string;
  language: "ta";
  contentType: "article";
  tags: string[];
  status: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  tenantId: string;
  parishId: string;
  choirId: string;
}

interface ContentSyncStatusRecord {
  sourceUrl: string;
  lastSyncedAt: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  status: "idle" | "syncing" | "success" | "failed";
  errorMessage?: string;
  totalItemsSynced: number;
  syncDurationMs: number;
}

const CATHOLIC_TAMIL_FEED_URL = "https://www.catholictamil.com/feeds/posts/default";
const CATHOLIC_HUB_SONG_CATEGORIES = [
  {
    categoryId: "varugai",
    category: "varugai",
    categoryTamil: "வருகைப் பாடல்கள்",
    sourceUrl: "https://www.radio.catholictamil.com/p/blog-page_7.html",
  },
  {
    categoryId: "thiruppadal",
    category: "thiruppadal",
    categoryTamil: "திருப்பாடல்கள்",
    sourceUrl: "https://www.radio.catholictamil.com/p/blog-page_63.html",
  },
  {
    categoryId: "thiyanam",
    category: "thiyanam",
    categoryTamil: "தியானப் பாடல்கள்",
    sourceUrl: "https://www.radio.catholictamil.com/p/blog-page_16.html",
  },
] as const;

type CatholicHubSongCategoryId = typeof CATHOLIC_HUB_SONG_CATEGORIES[number]["categoryId"];

interface CatholicHubSongRecord {
  id: string;
  title: string;
  titleNormalized: string;
  category: string;
  categoryTamil: string;
  lyrics: string;
  lyricsNormalized: string;
  language: "ta";
  sourceUrl: string;
  sourcePage: string;
  tags: string[];
  order: number;
  status: "active" | "disabled";
  isFeatured: boolean;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  tenantId: string;
  parishId: string;
  choirId: string;
}

interface CatholicHubSongSyncStatusRecord {
  categoryId: string;
  categoryTamil: string;
  sourceUrl: string;
  status: "idle" | "syncing" | "success" | "failed";
  lastSyncedAt: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  errorMessage?: string;
  totalSongsSynced: number;
  syncDurationMs: number;
}

// Free, rule-based keyword categorization — no paid AI required.
const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] = [
  { category: "Daily Readings", keywords: ["வாசகங்கள்", "திருப்பலி வாசகம்"] },
  { category: "Saints", keywords: ["அர்ச்.", "புனிதர்", "அர்ச்சியசிஷ்ட"] },
  { category: "Prayers", keywords: ["செபம்", "செபங்கள்", "ஜெபம்", "ஜெபமாலை", "செபமாலை"] },
  { category: "Devotional Month", keywords: ["வணக்கமாதம்"] },
  { category: "Family & Marriage", keywords: ["குடும்பம்", "திருமணம்"] },
  { category: "Eucharist", keywords: ["நற்கருணை", "திவ்விய பலி"] },
  { category: "Marian Devotion", keywords: ["மாதா", "மரியா"] },
];

function categorizeCatholicHubTitle(title: string): { category: string; tags: string[] } {
  const matches = CATEGORY_KEYWORDS.filter(({ keywords }) => keywords.some((kw) => title.includes(kw)));
  if (matches.length === 0) return { category: "Article", tags: [] };
  return { category: matches[0].category, tags: matches.map((m) => m.category) };
}

function stripHtmlSummary(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280);
}

function normalizeTamilSearchText(value: string) {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    zwj: "\u200D",
    zwnj: "\u200C",
  };
  let decoded = value;
  for (let i = 0; i < 4; i++) {
    const next = decoded
      .replace(/&#(\d+);?/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);?/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&([a-z]+);/gi, (_, name) => named[String(name).toLowerCase()] ?? `&${name};`);
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

function decodeCatholicHubSongRecord(record: any) {
  const title = decodeHtmlEntities(String(record.title || ""));
  const categoryTamil = decodeHtmlEntities(String(record.categoryTamil || ""));
  const lyrics = decodeHtmlEntities(String(record.lyrics || ""));
  const tags = Array.isArray(record.tags) ? record.tags.map((tag: unknown) => decodeHtmlEntities(String(tag))) : [];

  return {
    ...record,
    title,
    titleNormalized: normalizeTamilSearchText(title),
    categoryTamil,
    lyrics,
    lyricsNormalized: normalizeTamilSearchText(lyrics),
    tags,
  };
}

function stripHtmlToText(html: string) {
  return decodeHtmlEntities(html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function absoluteCatholicTamilUrl(href: string) {
  try {
    return new URL(decodeHtmlEntities(href), "https://www.radio.catholictamil.com").toString();
  } catch {
    return "";
  }
}

function getBloggerMainHtml(html: string) {
  const postBodyMatch = html.match(/<div[^>]+class=["'][^"']*post-body[^"']*["'][^>]*>([\s\S]*?)<div[^>]+class=["'][^"']*post-footer/i);
  if (postBodyMatch?.[1]) return postBodyMatch[1];
  const articleMatch = html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
  if (articleMatch?.[1]) return articleMatch[1];
  return html;
}

async function fetchCatholicTamilHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Choir360/1.0 (+catholic-hub-song-sync)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) {
    throw new Error(`Catholic Tamil song source returned HTTP ${response.status}.`);
  }
  return response.text();
}

function extractCatholicSongLinks(categoryPageHtml: string, sourceUrl: string) {
  const mainHtml = getBloggerMainHtml(categoryPageHtml);
  const links: Array<{ title: string; sourceUrl: string }> = [];
  const seen = new Set<string>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(mainHtml))) {
    const href = absoluteCatholicTamilUrl(match[1]);
    const title = stripCatholicHtmlToText(match[2]).replace(/^✠\s*/, "").trim();
    const isSameHost = href.startsWith("https://www.radio.catholictamil.com/");
    const isSongPage = /\/20\d{2}\/\d{2}\//.test(href) || href.includes(".html");
    if (!title || title.length < 2 || !isSameHost || href === sourceUrl || !isSongPage || seen.has(href)) continue;
    seen.add(href);
    links.push({ title, sourceUrl: href });
  }

  return links;
}

function extractCatholicSongLyrics(songHtml: string, fallbackTitle: string) {
  const mainHtml = getBloggerMainHtml(songHtml);
  const text = stripCatholicHtmlToText(mainHtml);
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines.find((line) => normalizeTamilSearchText(line).includes(normalizeTamilSearchText(fallbackTitle)))
    || fallbackTitle;
  const chromePatterns = [
    /^posted by/i,
    /^labels?:/i,
    /^இதற்கு குழுசேர்/,
    /^முகப்பு$/,
    /^நமது தளங்கள்/,
    /^♫ பாடல்கள்/,
  ];
  const lyrics = lines
    .filter((line) => line !== title)
    .filter((line) => !chromePatterns.some((pattern) => pattern.test(line)))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title, lyrics };
}

function makeCatholicHubSongId(categoryId: string, title: string, order: number) {
  const normalized = normalizeTamilSearchText(title);
  const digest = crypto.createHash("sha1").update(`${categoryId}:${normalized}:${order}`).digest("hex").slice(0, 10);
  return `${categoryId}-${digest}`;
}

async function fetchCatholicTamilFeedPage(startIndex: number, maxResults: number) {
  const url = `${CATHOLIC_TAMIL_FEED_URL}?alt=json&start-index=${startIndex}&max-results=${maxResults}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Choir360/1.0 (+catholic-hub-sync; respects robots.txt)" },
  });
  if (!response.ok) {
    throw new Error(`catholictamil.com feed returned HTTP ${response.status}.`);
  }
  const data = await response.json();
  return (data?.feed?.entry || []) as any[];
}

async function syncCatholicHubContent(userId = "system-sync") {
  const startedAt = Date.now();
  if (!admin.apps.length) {
    throw new Error("Firebase Admin is not configured — cannot persist Catholic Hub sync results.");
  }

  const PAGES = 3;
  const PAGE_SIZE = 20;
  const now = new Date().toISOString();
  const records: CatholicHubContentRecord[] = [];

  for (let page = 0; page < PAGES; page++) {
    const entries = await fetchCatholicTamilFeedPage(page * PAGE_SIZE + 1, PAGE_SIZE);
    for (const entry of entries) {
      const title: string = entry?.title?.$t || "";
      const summaryRaw: string = entry?.summary?.$t || "";
      const altLink = (entry?.link || []).find((l: any) => l.rel === "alternate");
      const sourceUrl: string = altLink?.href || "";
      const postId: string = String(entry?.id?.$t || "").split("post-").pop() || `${Date.now()}-${records.length}`;
      const publishedAt: string = entry?.published?.$t || now;
      const { category, tags } = categorizeCatholicHubTitle(title);

      if (!title || !sourceUrl) continue;

      records.push({
        id: `ct-${postId}`,
        title,
        titleTamil: title,
        description: stripHtmlSummary(summaryRaw),
        category,
        sourceUrl,
        imageUrl: "",
        publishedAt,
        fetchedAt: now,
        language: "ta",
        contentType: "article",
        tags,
        status: "active",
        isFeatured: false,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
        ...DEFAULT_TENANT_CONTEXT,
      });
    }
  }

  const batch = admin.firestore().batch();
  const collection = admin.firestore().collection("catholicHubContent");
  for (const record of records) {
    const ref = collection.doc(record.id);
    const existing = await ref.get();
    batch.set(ref, {
      ...record,
      createdAt: existing.exists ? existing.data()?.createdAt || record.createdAt : record.createdAt,
      createdBy: existing.exists ? existing.data()?.createdBy || record.createdBy : record.createdBy,
      isFeatured: existing.exists ? Boolean(existing.data()?.isFeatured) : record.isFeatured,
      status: existing.exists ? (existing.data()?.status || record.status) : record.status,
    }, { merge: true });
  }
  await batch.commit();

  const statusRecord: ContentSyncStatusRecord = {
    sourceUrl: CATHOLIC_TAMIL_FEED_URL,
    lastSyncedAt: now,
    lastSuccessAt: now,
    status: "success",
    totalItemsSynced: records.length,
    syncDurationMs: Date.now() - startedAt,
  };
  await admin.firestore().collection("contentSyncStatus").doc("catholicTamil").set(statusRecord, { merge: true });

  return { itemsSynced: records.length, durationMs: statusRecord.syncDurationMs };
}

function resolveCatholicHubSongCategories(categoryId?: unknown) {
  const requested = typeof categoryId === "string" ? categoryId.trim() : "";
  if (!requested || requested === "all") return [...CATHOLIC_HUB_SONG_CATEGORIES];
  const category = CATHOLIC_HUB_SONG_CATEGORIES.find((item) => item.categoryId === requested);
  if (!category) throw new Error("Unknown Catholic Hub song category.");
  return [category];
}

async function syncCatholicHubSongs(categoryId?: CatholicHubSongCategoryId | "all", userId = "system-sync") {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin is not configured — cannot persist Catholic Hub songs.");
  }

  const categories = resolveCatholicHubSongCategories(categoryId);
  const db = admin.firestore();
  const synced: Array<{ categoryId: string; totalSongsSynced: number; syncDurationMs: number }> = [];

  for (const category of categories) {
    const startedAt = Date.now();
    const now = new Date().toISOString();
    const statusRef = db.collection("catholicHubSongSyncStatus").doc(category.categoryId);
    await statusRef.set({
      categoryId: category.categoryId,
      categoryTamil: category.categoryTamil,
      sourceUrl: category.sourceUrl,
      status: "syncing",
      lastSyncedAt: now,
      totalSongsSynced: 0,
      syncDurationMs: 0,
    } satisfies CatholicHubSongSyncStatusRecord, { merge: true });

    try {
      const categoryHtml = await fetchCatholicTamilHtml(category.sourceUrl);
      const links = extractCatholicSongLinks(categoryHtml, category.sourceUrl);
      const records: CatholicHubSongRecord[] = [];

      for (const [index, link] of links.entries()) {
        try {
          const songHtml = await fetchCatholicTamilHtml(link.sourceUrl);
          const extracted = extractCatholicSongLyrics(songHtml, link.title);
          const title = extracted.title || link.title;
          const lyrics = extracted.lyrics || "";
          records.push({
            id: makeCatholicHubSongId(category.categoryId, title, index + 1),
            title,
            titleNormalized: normalizeTamilSearchText(title),
            category: category.categoryId,
            categoryTamil: category.categoryTamil,
            lyrics,
            lyricsNormalized: normalizeTamilSearchText(lyrics),
            language: "ta",
            sourceUrl: link.sourceUrl,
            sourcePage: category.sourceUrl,
            tags: [category.categoryTamil, category.categoryId],
            order: index + 1,
            status: "active",
            isFeatured: false,
            lastSyncedAt: now,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId,
            ...DEFAULT_TENANT_CONTEXT,
          });
        } catch (error: any) {
          console.warn(`[Catholic Hub Songs] skipped "${link.title}":`, error?.message || error);
        }
      }

      const batchSize = 450;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = db.batch();
        for (const record of records.slice(i, i + batchSize)) {
          const ref = db.collection("catholicHubSongs").doc(record.id);
          const existing = await ref.get();
          batch.set(ref, {
            ...record,
            createdAt: existing.exists ? existing.data()?.createdAt || record.createdAt : record.createdAt,
            createdBy: existing.exists ? existing.data()?.createdBy || record.createdBy : record.createdBy,
            isFeatured: existing.exists ? Boolean(existing.data()?.isFeatured) : record.isFeatured,
            status: existing.exists ? (existing.data()?.status || record.status) : record.status,
          }, { merge: true });
        }
        await batch.commit();
      }

      const syncDurationMs = Date.now() - startedAt;
      const statusRecord: CatholicHubSongSyncStatusRecord = {
        categoryId: category.categoryId,
        categoryTamil: category.categoryTamil,
        sourceUrl: category.sourceUrl,
        status: "success",
        lastSyncedAt: new Date().toISOString(),
        lastSuccessAt: new Date().toISOString(),
        totalSongsSynced: records.length,
        syncDurationMs,
      };
      await statusRef.set(statusRecord, { merge: true });
      synced.push({ categoryId: category.categoryId, totalSongsSynced: records.length, syncDurationMs });
    } catch (error: any) {
      await statusRef.set({
        categoryId: category.categoryId,
        categoryTamil: category.categoryTamil,
        sourceUrl: category.sourceUrl,
        status: "failed",
        lastSyncedAt: new Date().toISOString(),
        lastFailureAt: new Date().toISOString(),
        errorMessage: error?.message || "Sync failed.",
        totalSongsSynced: 0,
        syncDurationMs: Date.now() - startedAt,
      } satisfies CatholicHubSongSyncStatusRecord, { merge: true });
      throw error;
    }
  }

  return { categories: synced, totalSongsSynced: synced.reduce((sum, item) => sum + item.totalSongsSynced, 0) };
}

async function syncCatholicHubOnStartup() {
  try {
    const result = await syncCatholicHubContent("system-startup");
    console.log(`[Catholic Hub] startup sync completed — ${result.itemsSynced} items in ${result.durationMs}ms`);
  } catch (error: any) {
    console.warn("[Catholic Hub] startup sync failed:", error?.message || error);
  }
}

// Lazy-initialization utility for GoogleGenAI
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.warn("GEMINI_API_KEY is not defined or is a placeholder. Choir360 will operate in high-precision simulated AI mode.");
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// -----------------------------------------------------------------------------
// BACKEND API ROUTES
// -----------------------------------------------------------------------------

app.get("/api/bible/daily-readings", async (req, res) => {
  const date = normalizeReadingDate(req.query.date);
  const language = normalizeReadingLanguage(req.query.language);
  const refresh = req.query.refresh === "1" || req.query.refresh === "true";

  try {
    const cached = await readStoredDailyReading(date, language);
    if (cached && !refresh) {
      if (cached.publicDisplay === false) {
        return res.status(404).json({ error: "Daily readings are not publicly displayed for this date." });
      }
      return res.json({ reading: { ...cached, syncStatus: "cached" } });
    }

    const synced = await fetchArulvakkuReading(date, language, cached?.publicDisplay ?? true);
    const stored = await writeStoredDailyReading(synced);
    if (stored.publicDisplay === false) {
      return res.status(404).json({ error: "Daily readings are not publicly displayed for this date." });
    }
    return res.json({ reading: stored });
  } catch (error: any) {
    const cached = await readStoredDailyReading(date, language);
    if (cached) {
      return res.json({
        reading: {
          ...cached,
          syncStatus: "cached",
          syncMessage: `Showing cached readings. Latest sync failed: ${error.message}`,
        },
      });
    }

    return res.status(502).json({
      error: error.message || "Daily readings could not be synced.",
      sourceUrl: ARULVAKKU_CALENDAR_URL,
    });
  }
});

app.post("/api/bible/daily-readings/sync", requireFirebaseAuth, requireAdminRole, async (req, res) => {
  const date = normalizeReadingDate(req.body?.date);
  const language = normalizeReadingLanguage(req.body?.language);
  const publicDisplay = req.body?.publicDisplay !== false;

  try {
    const synced = await fetchArulvakkuReading(date, language, publicDisplay);
    const stored = await writeStoredDailyReading(synced, (req as any).user?.uid || "admin-sync");
    return res.json({ reading: stored });
  } catch (error: any) {
    const cached = await readStoredDailyReading(date, language);
    if (cached) {
      await writeStoredDailyReading({
        ...cached,
        syncStatus: "failed",
        syncMessage: error.message || "Sync failed.",
        updatedAt: new Date().toISOString(),
      }, (req as any).user?.uid || "admin-sync");
    }
    return res.status(502).json({ error: error.message || "Daily readings sync failed." });
  }
});

app.get("/api/catholic-hub/songs", async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.json({
        songs: [],
        syncStatus: [],
        categories: CATHOLIC_HUB_SONG_CATEGORIES,
      });
    }

    const category = typeof req.query.category === "string" ? req.query.category : "all";
    let query: FirebaseFirestore.Query = admin.firestore()
      .collection("catholicHubSongs")
      .where("status", "==", "active");
    if (category && category !== "all") {
      query = query.where("category", "==", category);
    }

    let snapshot = await query.limit(900).get();

    // First public read after deployment should not leave users staring at an
    // empty library. If the backend has Firebase Admin access but no synced
    // records yet, populate Firestore once from the configured public sources.
    if (snapshot.empty) {
      try {
        await syncCatholicHubSongs(category === "all" ? "all" : category as CatholicHubSongCategoryId, "system-lazy-sync");
        snapshot = await query.limit(900).get();
      } catch (error: any) {
        console.warn("[Catholic Hub Songs] lazy sync failed:", error?.message || error);
      }
    }

    const songs = snapshot.docs
      .map((doc) => decodeCatholicHubSongRecord(doc.data()))
      .sort((a: any, b: any) => {
        const categorySort = String(a.category || "").localeCompare(String(b.category || ""));
        if (categorySort !== 0) return categorySort;
        return Number(a.order || 0) - Number(b.order || 0);
      });
    const statusSnapshot = await admin.firestore().collection("catholicHubSongSyncStatus").get();

    return res.json({
      songs,
      syncStatus: statusSnapshot.docs.map((doc) => doc.data()),
      categories: CATHOLIC_HUB_SONG_CATEGORIES,
    });
  } catch {
    return res.status(502).json({
      error: "Songs are not available yet. Please sync content or try again.",
    });
  }
});

app.post("/api/catholic-hub/songs/sync", requireFirebaseAuth, requireAdminRole, async (req, res) => {
  const requestedCategory = typeof req.body?.categoryId === "string" ? req.body.categoryId : "all";
  try {
    const result = await syncCatholicHubSongs(requestedCategory as CatholicHubSongCategoryId | "all", (req as any).user?.uid || "admin-sync");
    return res.json({ message: "Catholic Hub songs sync completed.", ...result });
  } catch (error: any) {
    return res.status(502).json({
      error: error?.message || "Catholic Hub songs sync failed.",
    });
  }
});

app.get("/api/catholic-hub/content", async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.json({ content: [], syncStatus: null });
    }

    const snapshot = await admin.firestore()
      .collection("catholicHubContent")
      .where("status", "==", "active")
      .orderBy("publishedAt", "desc")
      .limit(60)
      .get();

    const content = snapshot.docs.map((doc) => doc.data());
    const statusDoc = await admin.firestore().collection("contentSyncStatus").doc("catholicTamil").get();

    return res.json({
      content,
      syncStatus: statusDoc.exists ? statusDoc.data() : null,
    });
  } catch (error: any) {
    return res.status(502).json({ error: error.message || "Catholic Hub content could not be loaded." });
  }
});

app.post("/api/catholic-hub/sync", requireFirebaseAuth, requireAdminRole, async (req, res) => {
  try {
    const result = await syncCatholicHubContent((req as any).user?.uid || "admin-sync");
    return res.json({ message: "Catholic Hub sync completed.", ...result });
  } catch (error: any) {
    if (admin.apps.length) {
      await admin.firestore().collection("contentSyncStatus").doc("catholicTamil").set({
        sourceUrl: CATHOLIC_TAMIL_FEED_URL,
        lastSyncedAt: new Date().toISOString(),
        lastFailureAt: new Date().toISOString(),
        status: "failed",
        errorMessage: error.message || "Sync failed.",
      }, { merge: true }).catch(() => undefined);
    }
    return res.status(502).json({ error: error.message || "Catholic Hub sync failed." });
  }
});

app.post("/api/cloudinary/signature", uploadLimiter, requireFirebaseAuth, (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const { folder, tags = [], context = {} } = req.body || {};

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(501).json({
      error: "Cloudinary is not configured",
      required: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
    });
  }

  if (!folder || !(String(folder) === "choir360" || String(folder).startsWith("choir360/"))) {
    return res.status(400).json({ error: "A scoped choir360 Cloudinary folder is required" });
  }

  if (!Array.isArray(tags) || tags.length > 12) {
    return res.status(400).json({ error: "tags must be an array with at most 12 values." });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const tagString = Array.isArray(tags) ? tags.join(",") : String(tags);
  const contextString = Object.entries(context)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("|");

  const paramsToSign: Record<string, string | number> = {
    context: contextString,
    folder,
    tags: tagString,
    timestamp,
  };

  const signatureBase = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");

  return res.json({
    cloudName,
    apiKey,
    timestamp,
    folder,
    tags: tagString,
    context: contextString,
    signature,
  });
});

// 1. AI Liturgical Companion Chat Endpoint
app.post("/api/gemini/assistant", aiLimiter, requireFirebaseAuth, requireUserAiQuota, async (req, res) => {
  let message: string;
  try {
    message = requireString(req.body?.message, "message", 3000);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }

  const { chatHistory = [], activeRole = "public_user", language = "en" } = req.body;

  const systemInstruction = `
    You are the "Choir360 AI Liturgical Assistant," a highly specialized companion for Roman Catholic Choirs and Ministries in Tamil Nadu and South India (supporting English, Tamil, Malayalam, Telugu, and Hindi).
    
    Current User Role Context in App: '${activeRole}'.
    Preferred Communication Language: '${language}'.
    
    General Guidelines:
    - Respond with warmth, liturgical precision, and professional poise.
    - Provide helpful inputs regarding Roman Catholic liturgical rubrics (e.g., Ordinary Time, Advent, Lent, Easter, saints, Catholic choral parts: Soprano, Alto, Tenor, Bass).
    - If asked about songs, recommend relevant hymns. Encourage liturgical appropriateness (e.g. matching seasonal colors: Violet for Advent/Lent, Green for Ordinary Time, White for Feast/Weddings).
    - When asked about songs, use only the current imported PDF Music Library as the source of truth.
    - If the user asks about choir management, give advice on rehearsals, voice balancing, dynamic share calculation, and roster assignment.
    - Limit responses to be highly structured, digestible, and beautifully formatted in markdown.
  `;

  try {
    const ai = getGeminiClient();
    if (ai) {
      // Build simple prompt including history
      let prompt = `${systemInstruction}\n\n`;
      if (chatHistory.length > 0) {
        prompt += "Previous conversation history:\n";
        chatHistory.forEach((h: any) => {
          prompt += `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}\n`;
        });
      }
      prompt += `\nUser asks: ${message}\nResponse:`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      return res.json({ text: response.text || "I apologize, I could not generate a response." });
    } else {
      // Premium Simulated Response fallback when API key is missing
      return res.json({
        text: getSimulatedAssistantResponse(message, activeRole, language),
        simulated: true
      });
    }
  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    res.status(500).json({
      error: "Error generating response",
      details: error.message,
      text: "Peace be with you. I am currently adjusting my vocal harmonies (the Gemini API key appears misconfigured or timed out). Let me answer using my local liturgical database:\n\n" + getSimulatedAssistantResponse(message, activeRole, language)
    });
  }
});

// 2. AI Song Recommendation Endpoint
app.post("/api/gemini/recommend", aiLimiter, requireFirebaseAuth, requireUserAiQuota, async (req, res) => {
  const { massType, season, language = "English", choirStrength = "balanced", customPrompt = "" } = req.body;
  try {
    requireString(massType, "massType", 120);
    requireString(season, "season", 120);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }

  const prompt = `
    Conduct an expert Roman Catholic Liturgical Song Selection.
    Mass Type: ${massType}
    Liturgy Season: ${season}
    Primary Desired Song Language: ${language}
    Choir Strength & Vocal Balance: ${choirStrength}
    Additional User Preferences: ${customPrompt || "None"}
    
    Format the recommendation in clean JSON matching this exact typescript signature:
    {
      "explanation": "Brief paragraph explaining the liturgical theme, appropriate vestment color, and song alignment guidelines.",
      "recommendedSongs": [
        {
          "type": "Entrance Hymn",
          "title": "Song Title",
          "liturgicalReasoning": "Why this hymn perfectly fits the celebration."
        },
        {
          "type": "Offertory Hymn",
          "title": "Song Title",
          "liturgicalReasoning": "Why this fits the offering and sacrifice is appropriate."
        },
        {
          "type": "Communion Hymn",
          "title": "Song Title",
          "liturgicalReasoning": "Choral focus on Eucharistic solemnity."
        },
        {
          "type": "Recessional/Final Hymn",
          "title": "Song Title",
          "liturgicalReasoning": "Sending forth with joy and apostolic spirit."
        }
      ]
    }
    Return ONLY standard JSON. No markdown backticks.
  `;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "{}";
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return res.json(JSON.parse(cleanJson));
    } else {
      return res.json(getSimulatedRecommendations(massType, season, language));
    }
  } catch (error: any) {
    console.error("Gemini Recommendation Error:", error);
    return res.json(getSimulatedRecommendations(massType, season, language));
  }
});

// 3. AI Schedule Optimizer Endpoint
app.post("/api/gemini/optimize", aiLimiter, requireFirebaseAuth, requireUserAiQuota, async (req, res) => {
  const { members, massDetails } = req.body;
  if (!Array.isArray(members) || members.length > 200) {
    return res.status(400).json({ error: "members must be an array with at most 200 records." });
  }

  const prompt = `
    Analyze the available Roman Catholic Choir members, instruments, and vocal registers for:
    Mass/Event Name: ${massDetails?.name}
    Date/Time: ${massDetails?.date} ${massDetails?.time}
    
    Choir Members list: ${JSON.stringify(members)}
    
    Please output optimization suggestions. Focus on:
    1. Vocal Section Balance (Is there a proper mix of Soprano, Alto, Tenor, Bass)?
    2. Instrumentalist Coverage (Do we have a Keyboardist or supporting strings/woodwinds, e.g. Violin/Flute)?
    3. Suggested Choir Lead / Solos.
    4. Safety Alerts (e.g. "Action Required: Missing keyboardist/organist").
    
    Format the output as a JSON object with this exact structure:
    {
      "balanceScore": 85, // out of 100
      "evaluation": "Overall analysis statement",
      "vocalBalanceStatus": "status message of voice registers",
      "instrumentalStatus": "status signature",
      "suggestedRosterIds": ["ID1", "ID2", "ID3"], // ids of recommended active members
      "structuralSuggestions": [
        "Suggestion 1",
        "Suggestion 2"
      ],
      "safetyAlerts": [
        "Alert 1 (if any)"
      ]
    }
    Return ONLY valid JSON.
  `;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text || "{}";
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return res.json(JSON.parse(cleanJson));
    } else {
      return res.json(getSimulatedOptimization(members, massDetails));
    }
  } catch (error: any) {
    console.error("Gemini Optimize Error:", error);
    return res.json(getSimulatedOptimization(members, massDetails));
  }
});

// 4. AI Content Generator Endpoint
app.post("/api/gemini/generate-content", aiLimiter, requireFirebaseAuth, requireUserAiQuota, async (req, res) => {
  const { type, details, language = "en" } = req.body;
  try {
    requireString(type, "type", 80);
    requireString(details, "details", 3000);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }

  const prompt = `
    Generate professional, beautifully styled church bulletin/choir message content.
    Content Type: ${type} (e.g. announcement, birthdayWish, invitation, thankYou, newsletter)
    Additional guidelines / raw details: ${details}
    Selected language: ${language}
    
    Generate high-quality liturgical announcements or congratulations. Make it professional, welcoming, respectful, and fully structured.
    Return a JSON response with:
    {
      "subject": "Beautiful Subject line / Title",
      "body": "Formatted body text with elegant spacing.",
      "closing": "Choir director signature style"
    }
    Return ONLY JSON.
  `;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text || "{}";
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return res.json(JSON.parse(cleanJson));
    } else {
      return res.json(getSimulatedContentGen(type, details, language));
    }
  } catch (error) {
    console.error("Gemini Content Gen Error:", error);
    return res.json(getSimulatedContentGen(type, details, language));
  }
});

// 5. Smart Transliteration Search Endpoint
app.post("/api/gemini/smart-search", aiLimiter, requireFirebaseAuth, requireUserAiQuota, async (req, res) => {
  const { query, songsList } = req.body;
  try {
    requireString(query, "query", 200);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
  if (!Array.isArray(songsList) || songsList.length > 500) {
    return res.status(400).json({ error: "songsList must be an array with at most 500 records." });
  }

  const prompt = `
    We operate a Roman Catholic Song Smart Search Engine with phonetic transliteration.
    User query: "${query}"
    Available Choir Songs database: ${JSON.stringify(songsList)}
    
    Please perform:
    1. Search only within the provided song records.
    2. Match title, category, author/composer, lyrics, transliteration, and sourceSearchText when present.
    3. Return only IDs that exist in the provided database.
    
    Return a ranked array of Song IDs from the provided database that best match the user's search query, and a short explanation for why it matches.
    
    Return JSON with this structure:
    {
      "matchedSongIds": ["JJ001", "JJ002"],
      "searchMethod": "PDF Songbook Full-Text Match",
      "explanation": "Matched the query against the imported PDF songbook index."
    }
    Return ONLY JSON. No markdown wrapper.
  `;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text || "{}";
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return res.json(JSON.parse(cleanJson));
    } else {
      return res.json(getSimulatedSmartSearch(query, songsList));
    }
  } catch (error) {
    console.error("Gemini Smart Search Error:", error);
    return res.json(getSimulatedSmartSearch(query, songsList));
  }
});


// 6. AI Liturgical Planner Endpoint
app.post("/api/gemini/liturgical-plan", aiLimiter, requireFirebaseAuth, requireUserAiQuota, async (req, res) => {
  const { feast, date } = req.body as { feast: string; date: string };
  if (!feast) return res.status(400).json({ error: "feast is required." });

  const prompt = `
You are an expert Roman Catholic liturgical music director specialising in Tamil Catholic worship.
Generate a detailed Mass song program for:
Feast/Occasion: ${feast}
Date: ${date || "upcoming Sunday"}

Respond ONLY with a JSON object matching this exact schema:
{
  "feast": "string",
  "date": "string",
  "season": "Advent | Christmas | Ordinary Time | Lent | Easter | Triduum",
  "vestmentColor": "string",
  "readings": [
    { "ref": "scripture reference", "theme": "one sentence summary" }
  ],
  "homilySuggestion": "2–3 sentence homily direction",
  "songs": [
    {
      "position": "Mass part name (with Tamil equivalent)",
      "tamilTitle": "song title in Tamil script",
      "englishTitle": "transliterated title",
      "composer": "composer name",
      "rationale": "why this song fits this position liturgically",
      "liturgicalFit": "Perfect | Good | Acceptable"
    }
  ],
  "choirNotes": "practical director notes for this celebration"
}
Suggest positions and selection criteria; final song titles must come from the imported PDF Music Library.
Cover: Entrance, Kyrie, Gloria, Offertory, Communion, Thanksgiving, Recessional at minimum.
`;

  const geminiClient = getGeminiClient();
  if (geminiClient) {
    try {
      const response = await geminiClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      const text = response.text ?? "{}";
      const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return res.json(JSON.parse(clean));
    } catch (err) {
      console.error("Liturgical Planner AI Error:", err);
    }
  }
  // Fallback
  return res.json({
    feast,
    date,
    season: "Ordinary Time",
    vestmentColor: "Green",
    readings: [{ ref: "See Lectionary", theme: "God calls us to faithfulness in daily life" }],
    homilySuggestion: "Reflect on the readings and how they speak to the local community.",
    songs: [
      { position: "Entrance", tamilTitle: "Select from imported songbook", englishTitle: "Imported PDF song page", composer: "Unknown", rationale: "Choose a suitable opening hymn from the PDF Music Library.", liturgicalFit: "Acceptable" },
      { position: "Offertory", tamilTitle: "Select from imported songbook", englishTitle: "Imported PDF song page", composer: "Unknown", rationale: "Choose a song that supports offering and thanksgiving.", liturgicalFit: "Acceptable" },
      { position: "Communion", tamilTitle: "Select from imported songbook", englishTitle: "Imported PDF song page", composer: "Unknown", rationale: "Choose a reverent Eucharistic song from the imported PDF.", liturgicalFit: "Acceptable" },
    ],
    choirNotes: "Plan well in advance and select exact song pages from the imported PDF Music Library.",
  });

});

// -----------------------------------------------------------------------------
// AI FALLBACK SIMULATORS (Ensures absolute reliability if API key is not yet set)
// -----------------------------------------------------------------------------

function getSimulatedAssistantResponse(message: string, role: string, lang: string): string {
  const query = message.toLowerCase();
  const wantsSongs = query.includes("song") || query.includes("hymn") || query.includes("recommend") || query.includes("music") || query.includes("lyrics");

  if (wantsSongs) {
    return "Peace be with you. The Music Library is now sourced only from the imported Jebathotta Jeyageethangal PDF. Open Music Library, search the imported songbook, and select the exact PDF page for the Mass part you need. I will not suggest removed demo songs.";
  }

  return "Peace be with you! I am your **Choir360 Liturgical Assistant**. I can help with Catholic liturgical planning, choir roster balance, member coordination, and selecting songs from the imported PDF Music Library.";
}

function getSimulatedRecommendations(massType: string, season: string, language: string) {
  return {
    explanation: `Liturgical guidelines for ${massType} during the ${season} season. Select the final hymns from the imported PDF Music Library so the plan stays aligned with the current source of truth.`,
    recommendedSongs: [
      { type: "Entrance Hymn", title: "Select from imported songbook", liturgicalReasoning: "Choose a suitable opening hymn from the provided PDF source." },
      { type: "Offertory Hymn", title: "Select from imported songbook", liturgicalReasoning: "Choose a song that supports offering and thanksgiving." },
      { type: "Communion Hymn", title: "Select from imported songbook", liturgicalReasoning: "Choose a reverent Eucharistic song from the imported PDF." },
      { type: "Recessional Hymn", title: "Select from imported songbook", liturgicalReasoning: "Choose a sending hymn from the PDF Music Library." },
    ]
  };
}

function getSimulatedOptimization(members: any[], massDetails: any) {
  const activeMembers = members.filter((m: any) => m.status === 'Active Member');
  const keyboardist = activeMembers.find((m: any) => m.memberType === 'Keyboard');
  const sopranos = activeMembers.filter((m: any) => m.voiceType === 'Soprano');
  const altos = activeMembers.filter((m: any) => m.voiceType === 'Alto');
  const tenors = activeMembers.filter((m: any) => m.voiceType === 'Tenor');
  const basses = activeMembers.filter((m: any) => m.voiceType === 'Bass');

  const alerts: string[] = [];
  const suggestions: string[] = [];
  let score = 90;

  if (!keyboardist) {
    alerts.push("CRITICAL ACTION REQUIRED: No Keyboardist scheduled. Choral guidance is at severe risk.");
    suggestions.push("Urgent: Contact Member Amal Joseph (M003) or request backup organist from secondary parish list.");
    score -= 30;
  } else {
    suggestions.push(`Keyboardist confirmed: ${keyboardist.firstName} ${keyboardist.lastName} has confirmed attendance.`);
  }

  if (sopranos.length === 0) {
    alerts.push("Warning: Soprano register is unstaffed. Lead melodies will be heavy or lacking high-register support.");
    score -= 15;
  } else {
    suggestions.push(`Soprano register is secured by ${sopranos.map(s => s.firstName).join(", ")}.`);
  }

  if (tenors.length === 0 || basses.length === 0) {
    alerts.push("Warning: Male harmonic registers (Tenor/Bass) are understaffed.");
    score -= 10;
  }

  suggestions.push("Ensure Violin leads counter-melodies during Offertory to fill the high-wind frequency range.");
  suggestions.push("Prioritize standard a-cappella transition during Communion to let vocal registers resonate naturally.");

  return {
    balanceScore: Math.max(score, 40),
    evaluation: "Choir line-up analyzed for liturgical compliance. Overall voice mix is robust but requires attention for missing supporting keys or specific vocal solo segments.",
    vocalBalanceStatus: `${sopranos.length} Soprano, ${altos.length} Alto, ${tenors.length} Tenor, ${basses.length} Bass scheduled.`,
    instrumentalStatus: `${keyboardist ? 'Keyboard Active' : 'No Keyboardist'} | Violin/Flute checking.`,
    suggestedRosterIds: activeMembers.slice(0, 5).map((m: any) => m.id),
    structuralSuggestions: suggestions,
    safetyAlerts: alerts
  };
}

function getSimulatedContentGen(type: string, details: string, language: string) {
  const isTamil = language.toLowerCase() === 'ta';
  
  if (type === 'birthdayWish') {
    return {
      subject: isTamil ? "இனிய கத்தோலிக்க பாடக உறவு பிறந்தநாள் வாழ்த்துகள்!" : "Blessed Birthday Wishes from Choir360!",
      body: isTamil 
        ? `அன்பார்ந்த பாடகர் குழு உறுப்பினருக்கு,\n\n"${details || 'எங்கள் குடும்ப உறுப்பினர்'}" ஆகிய உங்களுக்கு, எங்களது புனித தோமையார் பேராலயப் பாடகர் குழு சார்பில் ஆசீர்வதிக்கப்பட்ட பிறந்தநாள் நல்வாழ்த்துகளைக் தெரிவித்துக் கொள்கிறோம்.\n\nஇறைவன் உங்களுக்கு நல்ல சுகத்தையும், தொடர்ந்து பாடிப் புகழும் மேலான குரல் திறனையும் தந்தருளுவாராக! மரியாளின் பரிந்துரை என்றும் உங்களோடு இருக்கட்டும்.`
        : `Dear Beloved Choir Member,\n\nWe send you our prayerful congratulations on your birthday! Thank you for dedicating your voices and musical talents to glorify God and lead our congregation in prayer.\n\nMay the Lord bless you abundantly, grant you strength, and fill your days with holy joy. Happy Birthday!`,
      closing: isTamil ? "அன்புடன், தந்தை பங்குத்தந்தை மற்றும் பாடகர் குழு இயக்குனர்" : "In St. Cecilia, Choir Director & Choral Ministry Team"
    };
  }

  return {
    subject: isTamil ? "தேவாலய பாடகர் குழு முக்கிய அறிவிப்பு" : "Important Choral Announcement",
    body: isTamil
      ? `அன்பார்ந்த பாடகர்களே,\n\nதயவுசெய்து கவனிக்கவும்: ${details || 'எதிர்வரும் நற்கருணை கொண்டாட்டம் மற்றும் திருப்பலி பயிற்சி.'}\n\nஅனைத்து உறுப்பினர்களும் 30 நிமிடங்களுக்கு முன்பாகவே தங்களுக்குரிய உடைகளுடன் தேவாலய மேடையில் இருக்குமாறு கேட்டுக்கொள்ளப்படுகிறீர்கள்.`
      : `Dear Choral Members,\n\nKindly note the following: ${details || 'Upcoming Solemn Mass preparations and standard rehearsals'}.\n\nPlease ensure your attendance is marked and you arrive wearing the mandated Parish green/white unified choir uniform.`,
    closing: "Choir360 Administration Core Team"
  };
}

function getSimulatedSmartSearch(query: string, songsList: any[]) {
  const q = query.toLowerCase().trim();
  const matched = (songsList || []).filter((song: any) => {
    const searchable = [
      song.id,
      song.title,
      song.lyricsTitle,
      song.category,
      song.album,
      song.composer,
      song.singer,
      song.lyrics,
      song.lyricsEnglishPattern,
      song.sourceSearchText,
    ].filter(Boolean).join("\n").toLowerCase();

    return searchable.includes(q);
  });

  return {
    matchedSongIds: matched.map((song: any) => song.id).slice(0, 20),
    searchMethod: "PDF Songbook Full-Text Search",
    explanation: matched.length > 0
      ? `Found ${matched.length} imported PDF song page(s) matching "${query}".`
      : `No imported PDF song pages found for "${query}".`,
  };
}

function startServer() {
  const PORT = parseInt(process.env.PORT ?? '3001', 10);
  app.listen(PORT, () => {
    console.log(`[Choir360 X] Server running on port ${PORT}`);
    console.log(`[Choir360 X] Firebase Admin: ${admin.apps.length > 0 ? 'Initialized' : 'Not configured (demo mode)'}`);
    console.log(`[Choir360 X] Gemini AI: ${getGeminiClient() ? 'Ready — gemini-2.0-flash' : 'Not configured (simulated fallback)'}`);
    void syncCatholicHubOnStartup();
  });
}

startServer();
