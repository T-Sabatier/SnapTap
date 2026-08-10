// Vérifie que les decks anglais (US + UK) sont bien seedés dans Firebase.
// Usage : node scripts/verify-en-decks.mjs
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';

const projectRoot = new URL('../', import.meta.url);
const env = {};
for (const line of readFileSync(new URL('.env', projectRoot), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
});
const creds = JSON.parse(readFileSync(new URL('scripts/.admin-credentials.json', projectRoot), 'utf8'));
await signInWithEmailAndPassword(getAuth(app), creds.email, creds.password);
const db = getDatabase(app);

const nodes = ['cards', 'categories', 'cards_en', 'categories_en', 'cards_en_gb', 'categories_en_gb', 'cards_en_au', 'categories_en_au'];
for (const n of nodes) {
  const snap = await get(ref(db, n));
  const count = snap.exists() ? Object.keys(snap.val()).length : 0;
  const flag = count > 0 ? '✅' : '❌ VIDE';
  console.log(`${flag}  ${n.padEnd(18)} : ${count}`);
}
process.exit(0);
