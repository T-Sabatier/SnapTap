// Seed du node `categories_en` : reprend les catégories FR live et applique
// les libellés anglais validés (mêmes ids, emoji/pack/spicy/hidden conservés).
// Usage : node scripts/seed-en-categories.mjs
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get, set } from 'firebase/database';

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

// Libellés EN validés (mêmes ids que le deck FR).
const LABELS = {
  absurde: 'Absurd',
  boisson: 'Drinks',
  bouffe: 'Food',
  boulot: 'Work',
  bourre: 'Drunk',
  cartoons: 'Cartoons',
  celebrite: 'Celebrities',
  cine: 'Movies & TV',
  coquin: 'Spicy',
  culture: 'Pop Culture',
  gaming: 'Video Games',
  lifestyle: 'Lifestyle',
  mode: 'Fashion',
  musique: 'Music',
  nature: 'Nature',
  politique: 'Politics',
  relations: 'Relationships',
  sport: 'Sports',
  tech: 'Tech & Apps',
  voyages: 'Travel',
};
// Emojis plus « US » pour ces deux-là.
const EMOJI = { culture: '🇺🇸', sport: '🏈' };

const snap = await get(ref(db, 'categories'));
if (!snap.exists()) throw new Error('Aucune catégorie FR trouvée');
const src = snap.val();

const out = {};
for (const [id, c] of Object.entries(src)) {
  out[id] = {
    label: LABELS[id] || c.label,
    emoji: EMOJI[id] || c.emoji,
    ...(c.pack ? { pack: c.pack } : {}),
    ...(c.spicy ? { spicy: true } : {}),
    ...(c.hidden ? { hidden: true } : {}),
  };
}

await set(ref(db, 'categories_en'), out);
console.log(`✅ categories_en écrit : ${Object.keys(out).length} catégories`);
process.exit(0);
