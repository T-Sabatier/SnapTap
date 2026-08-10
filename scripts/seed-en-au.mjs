// Seed du deck AU : `categories_en_au` (labels EN + 🇦🇺/🏏) et `cards_en_au`
// (= deck US hérité + overrides australiens, moins les cartes OMIT_AU).
// Usage : node scripts/seed-en-au.mjs
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get, set } from 'firebase/database';
import { DECK_EN } from './deck-en-data.mjs';
import { DECK_EN_AU, OMIT_AU } from './deck-en-au-data.mjs';

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

// --- Categories AU : mêmes labels EN, drapeau AU + cricket ---
const LABELS = {
  absurde: 'Absurd', boisson: 'Drinks', bouffe: 'Food', boulot: 'Work',
  bourre: 'Drunk', cartoons: 'Cartoons', celebrite: 'Celebrities',
  cine: 'Movies & TV', coquin: 'Spicy', culture: 'Pop Culture',
  gaming: 'Video Games', lifestyle: 'Lifestyle', mode: 'Fashion',
  musique: 'Music', nature: 'Nature', politique: 'Politics',
  relations: 'Relationships', sport: 'Sports', tech: 'Tech & Apps',
  voyages: 'Travel',
};
const EMOJI = { culture: '🇦🇺', sport: '🏏' };

const catSnap = await get(ref(db, 'categories'));
const catSrc = catSnap.val();
const catsOut = {};
for (const [id, c] of Object.entries(catSrc)) {
  catsOut[id] = {
    label: LABELS[id] || c.label,
    emoji: EMOJI[id] || c.emoji,
    ...(c.pack ? { pack: c.pack } : {}),
    ...(c.spicy ? { spicy: true } : {}),
    ...(c.hidden ? { hidden: true } : {}),
  };
}

// --- Cards AU : cat/spicy du deck FR live ; t/g = override AU sinon US ;
//     les cartes OMIT_AU sont ignorées (absentes du deck australien). ---
const cardSnap = await get(ref(db, 'cards'));
const fr = cardSnap.val();
const missing = Object.keys(fr).filter(
  (id) => !OMIT_AU.has(id) && !DECK_EN[id] && !DECK_EN_AU[id]
);
if (missing.length) {
  console.log(`❌ ${missing.length} carte(s) sans traduction US ni AU :`);
  for (const id of missing) console.log('   - ' + id + ' :: ' + fr[id].t);
  process.exit(1);
}
const cardsOut = {};
let omitted = 0;
for (const [id, c] of Object.entries(fr)) {
  if (OMIT_AU.has(id)) { omitted++; continue; }
  const en = DECK_EN_AU[id] || DECK_EN[id];
  cardsOut[id] = { t: en.t, cat: c.cat, g: en.g, ...(c.spicy ? { spicy: true } : {}) };
}

await set(ref(db, 'categories_en_au'), catsOut);
await set(ref(db, 'cards_en_au'), cardsOut);
console.log(
  `✅ categories_en_au : ${Object.keys(catsOut).length} · ` +
  `cards_en_au : ${Object.keys(cardsOut).length} ` +
  `(dont ${Object.keys(DECK_EN_AU).length} overrides AU, ${omitted} cartes retirées)`
);
process.exit(0);
