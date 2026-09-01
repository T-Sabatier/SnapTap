// Regénère GAGES.md (la référence lisible des règles à boire du Mode Apéro)
// depuis la base Firebase (deck FR). À relancer après toute édition de gages.
// Usage : node scripts/gen-gages-md.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const env = {};
for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
});
const creds = JSON.parse(
  readFileSync(join(root, 'scripts', '.admin-credentials.json'), 'utf8')
);
const auth = getAuth(app);
await signInWithEmailAndPassword(auth, creds.email, creds.password);
const db = getDatabase(app);

const [cardsSnap, catsSnap] = await Promise.all([
  get(ref(db, 'cards')),
  get(ref(db, 'categories')),
]);
const cards = Object.values(cardsSnap.val() || {});
const cats = catsSnap.val() || {};

const withG = cards.filter((c) => c.g);
const nDefis = withG.filter((c) => c.g.startsWith('@')).length;
const today = new Date().toLocaleDateString('fr-FR');

let out = `# 🍺 Snap Tap — Règles à boire du Mode Apéro\n\n`;
out += `> La règle s'affiche quand la carte est CHOISIE. Les règles 🎯 sont des défis : l'app désigne au hasard le joueur qui s'y colle.\n`;
out += `> Généré le ${today} — ${withG.length} cartes, ${nDefis} défis.\n`;

const catList = Object.entries(cats).sort((a, b) =>
  a[1].label.localeCompare(b[1].label, 'fr')
);
for (const [catId, cat] of catList) {
  const catCards = withG
    .filter((c) => c.cat === catId)
    .sort((a, b) => a.t.localeCompare(b.t, 'fr'));
  if (!catCards.length) continue;
  const pack = cat.pack ? ` — pack ${cat.pack}` : '';
  out += `\n## ${cat.emoji} ${cat.label} (${catCards.length})${pack}\n\n`;
  out += `| Carte | Règle |\n|---|---|\n`;
  for (const c of catCards) {
    const g = c.g.startsWith('@') ? `🎯 ${c.g.slice(1)}` : c.g;
    out += `| **${c.t}** | ${g} |\n`;
  }
}

writeFileSync(join(root, 'GAGES.md'), out);
console.log(`✅ GAGES.md regénéré : ${withG.length} gages, ${nDefis} défis 🎯`);
process.exit(0);
