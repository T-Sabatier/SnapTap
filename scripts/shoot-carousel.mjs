// Capture headless des ecrans FR "safe" (cartes generiques, boss = Lea) pour
// le carrousel Instagram. Prerequis : serveur dev lance (npm run dev).
// Usage : node scripts/shoot-carousel.mjs
// Sortie : store-assets/promo/carousel/src/*.png (1080x2012), consommes par
// gen-carousel.mjs qui les monte dans les slides 1080x1350.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'store-assets', 'promo', 'carousel', 'src');
mkdirSync(outDir, { recursive: true });

// Ecrans du carrousel → scenario Debug (?safe = pool marketing sans vraies
// personnes/marques + boss renommee Lea).
const SHOTS = [
  { file: 'ecran-main.png', scene: 'play-hand' },
  { file: 'ecran-choix.png', scene: 'reveal-guest' },
  { file: 'ecran-resultat.png', scene: 'result' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
// Viewport type telephone (400 CSS px) x2.7 → sortie 1080 px de large.
await page.setViewport({ width: 400, height: 745, deviceScaleFactor: 2.7 });

// Force le francais (Chrome headless est en anglais → detectLocale servirait
// le deck US) + neutralise la pop-up "Installe l'app".
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.setItem('st_lang', 'fr');
  sessionStorage.setItem('snaptap_install_nudge_seen', '1');
  localStorage.setItem('fc_party', '0');
});

for (const { file, scene } of SHOTS) {
  await page.goto(`${BASE}/?debug&cap=1&safe=1&scene=${scene}`, {
    waitUntil: 'networkidle2',
  });
  // Le montage React attend l'auth Firebase (jusqu'a 5s en headless, App Check
  // repondant 403) : on attend la disparition du splash statique "Chargement".
  // innerText est deja transforme en MAJUSCULES par le CSS → comparer en lower.
  await page.waitForFunction(
    () =>
      !(document.getElementById('root')?.innerText || '')
        .toLowerCase()
        .includes('chargement'),
    { timeout: 20000 }
  );
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await sleep(2200);
  await page.screenshot({ path: join(outDir, file) });
  console.log(`✓ ${file}  (scene=${scene})`);
}

await browser.close();
console.log(`\nEcrans safe dans ${outDir}`);
process.exit(0);
