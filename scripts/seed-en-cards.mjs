// Seed du node `cards_en` : reprend cat/spicy du deck FR live et applique
// titre + gage anglais depuis deck-en-data.mjs (mêmes ids).
// Usage : node scripts/seed-en-cards.mjs
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get, set } from 'firebase/database';
import { DECK_EN } from './deck-en-data.mjs';

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

const snap = await get(ref(db, 'cards'));
if (!snap.exists()) throw new Error('Aucune carte FR trouvée');
const fr = snap.val();

// Contrôle de couverture : toute carte FR doit avoir une traduction, et vice versa.
const frIds = Object.keys(fr);
const enIds = Object.keys(DECK_EN);
const missing = frIds.filter((id) => !DECK_EN[id]);
const extra = enIds.filter((id) => !fr[id]);
if (missing.length) {
  console.log(`⚠️ ${missing.length} carte(s) FR SANS traduction :`);
  for (const id of missing) console.log('   - ' + id + ' :: ' + fr[id].t);
}
if (extra.length) {
  console.log(`⚠️ ${extra.length} id(s) traduits INEXISTANTS en FR :`);
  for (const id of extra) console.log('   - ' + id);
}
if (missing.length || extra.length) {
  console.log('❌ Corrige les écarts avant de seed. Rien écrit.');
  process.exit(1);
}

const out = {};
for (const [id, c] of Object.entries(fr)) {
  const en = DECK_EN[id];
  out[id] = {
    t: en.t,
    cat: c.cat,
    g: en.g,
    ...(c.spicy ? { spicy: true } : {}),
  };
}

await set(ref(db, 'cards_en'), out);
console.log(`✅ cards_en écrit : ${Object.keys(out).length} cartes`);
process.exit(0);
