/**
 * scripts/createParishAdmin.mjs
 *
 * Creates a Firebase Auth user and maps them as the primary parish admin
 * for a specific parish in the Archdiocese of Madras-Mylapore.
 *
 * Run:
 *   node scripts/createParishAdmin.mjs
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or Firebase Admin SDK credentials
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { getAdminAuth, getAdminFirestore } from './firebaseAdmin.mjs';

config({ path: '.env.local', override: false });

// ── Parish Admin Configuration ─────────────────────────────────────────────────
const ADMIN_EMAIL    = 'stjosephschoirambattur@gmail.com';
const ADMIN_PASSWORD = 'Admin@#Joseph';
const ADMIN_NAME     = 'St Joseph Choir Admin';
const PARISH_ID      = 'church-of-sts-joseph-the-worker-philip-ambattur-ot';
const PARISH_NAME    = 'Church of Sts Joseph the Worker & Philip';
const PARISH_PLACE   = 'Ambattur OT';
const ARCHDIOCESE_ID = 'madras-mylapore';
const CHOIR_ID       = 'church-of-sts-joseph-the-worker-philip-ambattur-ot-choir';

// ── Main ───────────────────────────────────────────────────────────────────────
async function createParishAdmin() {
  const auth = getAdminAuth();
  const db   = getAdminFirestore();

  console.log(`\n🔐 Creating parish admin account...`);
  console.log(`   Parish : ${PARISH_NAME} — ${PARISH_PLACE}`);
  console.log(`   Email  : ${ADMIN_EMAIL}`);
  console.log(`   Parish ID : ${PARISH_ID}\n`);

  // 1. Create (or fetch existing) Firebase Auth user
  let user;
  try {
    user = await auth.createUser({
      email:         ADMIN_EMAIL,
      password:      ADMIN_PASSWORD,
      displayName:   ADMIN_NAME,
      emailVerified: true,
      disabled:      false,
    });
    console.log(`✅ Firebase Auth user created — UID: ${user.uid}`);
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      user = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log(`ℹ️  User already exists — UID: ${user.uid}`);
    } else {
      throw err;
    }
  }

  // 2. Set custom claims — locks this user to this parish only
  const claims = {
    role:           'parish_admin',
    parishId:       PARISH_ID,
    archdioceseId:  ARCHDIOCESE_ID,
    choirId:        CHOIR_ID,
    isAdmin:        true,
    isPrimaryAdmin: true,
  };
  await auth.setCustomUserClaims(user.uid, claims);
  console.log(`✅ Custom claims set:`, claims);

  // 3. Write admin record to Firestore `admins` collection
  const adminRef = db.collection('admins').doc(user.uid);
  await adminRef.set({
    uid:            user.uid,
    email:          ADMIN_EMAIL,
    displayName:    ADMIN_NAME,
    role:           'parish_admin',
    parishId:       PARISH_ID,
    parishName:     PARISH_NAME,
    parishPlace:    PARISH_PLACE,
    archdioceseId:  ARCHDIOCESE_ID,
    choirId:        CHOIR_ID,
    isAdmin:        true,
    isPrimaryAdmin: true,
    createdAt:      new Date().toISOString(),
    updatedAt:      new Date().toISOString(),
  }, { merge: true });
  console.log(`✅ Admin record written to Firestore /admins/${user.uid}`);

  // 4. Write parish-admin mapping to `parishes/{parishId}/admins` subcollection
  const parishAdminRef = db
    .collection('parishes')
    .doc(PARISH_ID)
    .collection('admins')
    .doc(user.uid);
  await parishAdminRef.set({
    uid:            user.uid,
    email:          ADMIN_EMAIL,
    displayName:    ADMIN_NAME,
    role:           'parish_admin',
    isPrimaryAdmin: true,
    createdAt:      new Date().toISOString(),
  }, { merge: true });
  console.log(`✅ Parish admin mapping written to Firestore /parishes/${PARISH_ID}/admins/${user.uid}`);

  console.log(`\n🎉 Done! Parish admin account ready.`);
  console.log(`\n   Login URL : https://choir360x.web.app`);
  console.log(`   Email     : ${ADMIN_EMAIL}`);
  console.log(`   Password  : ${ADMIN_PASSWORD}`);
  console.log(`   Access    : ${PARISH_NAME} — ${PARISH_PLACE} only\n`);
}

createParishAdmin().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
