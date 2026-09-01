// Ajoute l'unité aux gages des decks (décision utilisateur 01/09/2026 :
// "boit 2" sec est ambigu, la norme du genre — Picolo & co — écrit l'unité).
//   FR : boit/boivent/bois/buvez/distribue(s/z) N  → ... N gorgée(s)
//   EN : drink/drinks N                            → ... N sip(s)
// Ne touche pas aux textes qui ont déjà l'unité après le nombre, ni aux
// nombres qui ne sont pas des gorgées (secondes, squats, points...).
//
// Usage :
//   node scripts/gorgees.mjs [fr|en|en_gb|en_au]          → DRY RUN
//   node scripts/gorgees.mjs [fr|en|en_gb|en_au] --apply  → écrit en base
//     (sauvegarde JSON des gages du deck dans backups/ avant écriture)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get, update } from 'firebase/database';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const deckArg = (process.argv[2] || 'fr').replace('--apply', '') || 'fr';

const DECKS = {
  fr: { node: 'cards', lang: 'fr' },
  en: { node: 'cards_en', lang: 'en' },
  en_gb: { node: 'cards_en_gb', lang: 'en' },
  en_au: { node: 'cards_en_au', lang: 'en' },
};
const deck = DECKS[deckArg];
if (!deck) throw new Error(`Deck inconnu : ${deckArg} (fr|en|en_gb|en_au)`);

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

export function addUnit(text, lang) {
  if (lang === 'fr') {
    return text.replace(
      /\b(boit|boivent|bois|buvez|distribue|distribuez|distribues)\s+(\d+)(?!\s*gorgée)(?!\s*(?:fois|min|sec|seconde|secondes|point|points|carte|cartes|manche|manches|chiffre))/gi,
      (m, verbe, n) => `${verbe} ${n} ${n === '1' ? 'gorgée' : 'gorgées'}`
    );
  }
  return text.replace(
    /\b(drinks|drink|hands out|hand out)\s+(\d+)(?!\s*sips?)(?!\s*(?:times|min|sec|second|seconds|point|points|card|cards|round|rounds))/gi,
    (m, verbe, n) => `${verbe} ${n} ${n === '1' ? 'sip' : 'sips'}`
  );
}

const snap = await get(ref(db, deck.node));
const cards = snap.val() || {};
const withG = Object.entries(cards).filter(([, c]) => c.g);

const changes = [];
const untouched = [];
for (const [id, c] of withG) {
  const after = addUnit(c.g, deck.lang);
  if (after !== c.g) changes.push({ id, t: c.t, before: c.g, after });
  else untouched.push({ id, t: c.t, g: c.g });
}

console.log(
  `[${deck.node}] ${withG.length} gages — ${changes.length} à modifier, ${untouched.length} inchangés\n`
);

console.log('=== MODIFIÉS (avant → après) ===');
for (const ch of changes) {
  console.log(`\n[${ch.t}]`);
  console.log(`  - ${ch.before}`);
  console.log(`  + ${ch.after}`);
}

console.log('\n=== INCHANGÉS avec chiffres (à relire) ===');
for (const u of untouched) {
  if (/\d/.test(u.g)) console.log(`  [${u.t}] ${u.g}`);
}
const noDigit = untouched.filter((u) => !/\d/.test(u.g)).length;
console.log(`  (+ ${noDigit} sans aucun chiffre, rien à faire)`);

if (!APPLY) {
  console.log('\nDRY RUN — rien écrit. Relance avec --apply pour écrire en base.');
  process.exit(0);
}

mkdirSync(join(root, 'backups'), { recursive: true });
const backupPath = join(
  root,
  'backups',
  `gages-${deck.node}-avant-gorgees-2026-09-01.json`
);
writeFileSync(
  backupPath,
  JSON.stringify(
    Object.fromEntries(withG.map(([id, c]) => [id, { t: c.t, g: c.g }])),
    null,
    2
  )
);
console.log(`\n💾 Sauvegarde : ${backupPath}`);

for (const ch of changes) {
  await update(ref(db, `${deck.node}/${ch.id}`), { g: ch.after });
}
console.log(`✅ ${changes.length} gages mis à jour dans ${deck.node}.`);
process.exit(0);
