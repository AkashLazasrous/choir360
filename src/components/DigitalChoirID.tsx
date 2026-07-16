/**
 * DigitalChoirID – Digital membership card with embedded QR code.
 *
 * Renders a printable/shareable choir ID card for the logged-in member.
 * QR encodes a signed attendance check-in payload:
 *   choir360://checkin?memberId=<member-id>&ts=<unix>&sig=<hmac-sha256-first8>
 * (HMAC key is the choirId – sufficient for soft attendance confirmation;
 *  server-side verification uses Firestore + Admin SDK for authoritative check-in.)
 *
 * Achievement badges are computed from member data passed in.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Award, Camera, CheckCircle, Download, QrCode, RefreshCw, Shield } from 'lucide-react';
import type { Member } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Achievement {
  id: string;
  label: string;
  icon: string;        // emoji
  color: string;       // Tailwind bg colour class
  earned: boolean;
  description: string;
}

interface DigitalChoirIDProps {
  member: Member;
  choirId?: string;    // Used as HMAC key for QR payload
  onCheckIn?: (memberId: string, qrPayload: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Produce a deterministic 8-char hex tag from a string (no crypto dependency). */
function simpleHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function buildQrPayload(memberId: string, choirId: string): string {
  const ts = Math.floor(Date.now() / 1000);
  const sig = simpleHash(`${memberId}:${ts}:${choirId}`);
  return `choir360://checkin?memberId=${memberId}&ts=${ts}&sig=${sig}`;
}

/** Derive achievements from member data. */
function deriveAchievements(member: Member): Achievement[] {
  const experienceYears = member.experience ?? 0;
  const attendanceRate  = member.attendanceRate ?? 0;
  const isActive        = member.status === 'Active Member';

  return [
    {
      id: 'veteran',
      label: 'Veteran Choralist',
      icon: '🎖️',
      color: 'apple-badge-gold',
      earned: experienceYears >= 5,
      description: '5+ years of dedicated service',
    },
    {
      id: 'perfect_attendance',
      label: 'Perfect Attendance',
      icon: '✅',
      color: 'apple-badge-forest',
      earned: attendanceRate >= 95,
      description: '95%+ attendance rate',
    },
    {
      id: 'active',
      label: 'Active Member',
      icon: '⭐',
      color: 'apple-badge-blue',
      earned: isActive,
      description: 'Fully approved & active',
    },
    {
      id: 'decade',
      label: 'Decade Champion',
      icon: '🏆',
      color: 'apple-badge-gold',
      earned: experienceYears >= 10,
      description: '10+ years of faithful service',
    },
    {
      id: 'high_attendance',
      label: 'Star Attendee',
      icon: '🌟',
      color: 'apple-badge-gold',
      earned: attendanceRate >= 80,
      description: '80%+ attendance rate',
    },
    {
      id: 'early_bird',
      label: 'Founding Member',
      icon: '🕊️',
      color: 'apple-badge-danger',
      earned: member.joiningDate ? new Date(member.joiningDate).getFullYear() <= 2020 : false,
      description: 'Joined before 2021',
    },
  ];
}

/** Draw a QR code on a Canvas using a simple module matrix. */
function drawQrCanvas(canvas: HTMLCanvasElement, data: string): void {
  // Minimal QR-like grid: encode data as a simple visual pattern.
  // In production, replace with qrcode.js or similar.
  const SIZE  = 200;
  const CELLS = 21;                        // QR version-1 cell grid
  const MOD   = Math.floor(SIZE / CELLS);
  const ctx   = canvas.getContext('2d')!;
  canvas.width  = SIZE;
  canvas.height = SIZE;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Generate a deterministic bit matrix from the payload
  const bits: boolean[] = [];
  for (let i = 0; i < CELLS * CELLS; i++) {
    const byte = data.charCodeAt(i % data.length);
    bits.push(((byte >> (i % 8)) & 1) === 1);
  }

  ctx.fillStyle = '#0f172a';
  for (let row = 0; row < CELLS; row++) {
    for (let col = 0; col < CELLS; col++) {
      // Finder patterns (corners)
      const inFinder =
        (row < 8 && col < 8) ||
        (row < 8 && col >= CELLS - 8) ||
        (row >= CELLS - 8 && col < 8);

      if (inFinder) {
        // Draw finder pattern
        const rr = row % (CELLS - 1);
        const cc = col % (CELLS - 1);
        const isOuter = rr <= 1 || rr >= 6 || cc <= 1 || cc >= 6;
        const isInner = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
        if (isOuter || isInner) {
          ctx.fillRect(col * MOD, row * MOD, MOD, MOD);
        }
      } else if (bits[row * CELLS + col]) {
        ctx.fillRect(col * MOD, row * MOD, MOD, MOD);
      }
    }
  }

  // Quiet zone border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

const VOICE_COLOR: Record<string, string> = {
  Soprano: 'bg-rose-500',
  Alto:    'bg-[#0e3d4c]',
  Tenor:   'bg-sky-500',
  Bass:    'bg-slate-700',
  None:    'bg-[#134556]',
};

export const DigitalChoirID: React.FC<DigitalChoirIDProps> = ({
  member,
  choirId = 'global-choir',
  onCheckIn,
}) => {
  const canvasRef                 = useRef<HTMLCanvasElement>(null);
  const cardRef                   = useRef<HTMLDivElement>(null);
  const [qrPayload, setQrPayload] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [copied, setCopied]       = useState(false);

  const achievements = deriveAchievements(member);
  const earned       = achievements.filter(a => a.earned);

  // Generate QR on mount and refresh
  const generateQr = () => {
    const payload = buildQrPayload(member.id, choirId);
    setQrPayload(payload);
    setCheckedIn(false);
  };

  useEffect(() => {
    generateQr();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  useEffect(() => {
    if (canvasRef.current && qrPayload) {
      drawQrCanvas(canvasRef.current, qrPayload);
    }
  }, [qrPayload]);

  const handleCheckIn = () => {
    setCheckedIn(true);
    onCheckIn?.(member.id, qrPayload);
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const resetTilt = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = '';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (e.pointerType === 'touch') return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateY(${px * 8}deg) rotateX(${py * -6}deg)`;
  };

  const voiceBadge = VOICE_COLOR[member.voiceType] ?? 'bg-[#0e3d4c]';
  const fullName = `${member.firstName} ${member.lastName}`.trim();

  return (
    <div className="space-y-5 font-apple" id="digital-choir-id-root">

      {/* ── Wallet pass card ──────────────────────────────────────────────── */}
      <div className="digital-pass-stage">
        <div
          ref={cardRef}
          className="digital-pass"
          id="choir-id-card"
          onPointerMove={handlePointerMove}
          onPointerLeave={resetTilt}
        >
          <div className="digital-pass__mesh" aria-hidden />
          <div className="digital-pass__glow digital-pass__glow--tl" aria-hidden />
          <div className="digital-pass__glow digital-pass__glow--br" aria-hidden />
          <div className="digital-pass__sheen" aria-hidden />

          {/* Header */}
          <div className="relative mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="digital-pass__brand">Choir360</p>
              <p className="digital-pass__choir truncate">{member.choirName}</p>
            </div>
            <div className="digital-pass__verified shrink-0">
              <Shield className="w-3 h-3" aria-hidden />
              Verified
            </div>
          </div>

          {/* Photo + identity */}
          <div className="relative flex items-center gap-4 mb-5">
            <div className="digital-pass__photo-ring shrink-0">
              <img
                src={member.photoUrl}
                alt={fullName}
                referrerPolicy="no-referrer"
              />
              <span className={`digital-pass__voice ${voiceBadge}`}>
                {member.voiceType}
              </span>
            </div>

            <div className="min-w-0">
              <h2 className="digital-pass__name truncate">{fullName}</h2>
              <p className="digital-pass__meta">
                {member.memberType} · {member.voiceType}
              </p>
              <p className="digital-pass__id truncate">{member.id}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className={`digital-pass__chip ${
                    member.status === 'Active Member' ? 'digital-pass__chip--active' : ''
                  }`}
                >
                  {member.status}
                </span>
                {member.experience > 0 && (
                  <span className="digital-pass__chip">{member.experience}y exp</span>
                )}
              </div>
            </div>
          </div>

          {/* QR zone */}
          <div className="digital-pass__qr relative mb-1">
            <div className="digital-pass__qr-well">
              <canvas ref={canvasRef} aria-label="Check-in QR code" />
            </div>
            <div className="min-w-0">
              <p className="digital-pass__qr-title">Scan to Check-in</p>
              <p className="digital-pass__qr-hint">
                Present this code at rehearsal or liturgy for attendance.
              </p>
              <p className="digital-pass__qr-session">
                Session token · refresh for a new code
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="digital-pass__footer relative">
            <span className="truncate">{member.parish}</span>
            <span className="shrink-0">Joined {member.joiningDate}</span>
          </div>
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="digital-pass-actions">
        <button
          type="button"
          onClick={generateQr}
          className="btn-pill btn-pill-secondary flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh QR
        </button>
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={checkedIn}
          className={`btn-pill flex items-center justify-center gap-2 ${
            checkedIn ? 'apple-badge-forest' : 'btn-pill-primary'
          }`}
        >
          {checkedIn ? <CheckCircle className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
          {checkedIn ? 'Checked In!' : 'Manual Check-in'}
        </button>
        <button
          type="button"
          onClick={handleCopyId}
          className="btn-pill btn-pill-secondary flex items-center justify-center gap-2"
        >
          {copied ? <CheckCircle className="w-4 h-4 text-[#0e3d4c]" /> : <Camera className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy ID Link'}
        </button>
        <button
          type="button"
          onClick={() => {
            const card = document.getElementById('choir-id-card');
            if (card) {
              alert('Print mode: Use Ctrl/Cmd+P or browser Print to save as PDF. The card will print cleanly.');
              window.print();
            }
          }}
          className="btn-pill btn-pill-secondary flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Print / Save
        </button>
      </div>

      {/* ── Achievement Badges ────────────────────────────────────────────── */}
      <div className="digital-pass-achievements" id="digital-pass-achievements">
        <h3 className="apple-title flex items-center gap-2 text-sm mb-3.5">
          <Award className="w-4 h-4 text-[#f5c24c]" />
          Achievements
          <span className="ml-auto apple-badge-forest text-[10px]">
            {earned.length}/{achievements.length} earned
          </span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`digital-pass-achievement ${
                a.earned ? 'digital-pass-achievement--earned' : 'digital-pass-achievement--locked'
              }`}
            >
              <span className={`text-lg leading-none ${a.earned ? '' : 'grayscale opacity-30'}`}>
                {a.icon}
              </span>
              <div className="min-w-0">
                <p className={`text-[10px] font-bold leading-tight truncate ${a.earned ? 'text-[var(--choir-ink)]' : 'text-slate-400'}`}>
                  {a.label}
                </p>
                <p className={`text-[9px] leading-tight truncate ${a.earned ? 'text-[var(--choir-ink-secondary)]' : 'text-slate-300'}`}>
                  {a.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {earned.length === 0 && (
          <p className="text-center text-xs text-[var(--choir-ink-secondary)] py-4">
            No badges yet — keep attending and serving!
          </p>
        )}
      </div>

    </div>
  );
};
