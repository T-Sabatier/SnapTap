// Capture headless des ecrans APERO + DEFI (pool ?safe) pour les visuels pub
// (gen-pub.mjs). Prerequis : serveur dev lance (npm run dev).
// Usage : node scripts/shoot-pub.mjs
// Sortie : store-assets/promo/carousel/src/*.png (1080x2012), memes dimensions
// que les captures du carrousel (les deux scripts se partagent le dossier).
//
// La "partie gage/defi" = le slam plein ecran (GageAnnounce). ?cap le FIGE a
// l'ecran → on le capture tel quel. Pour l'ecran resultat APRES le slam, on
// capture SANS cap en attendant la fin du slam (delay 2s + ~4.1s d'affichage).
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'store-assets', 'promo', 'carousel', 'src');
mkdirSync(outDir, { recursive: true });

const SHOTS = [
  // Mode Apero : main, ecran resultat (gage dans l'encadre), slam du gage.
  { file: 'ecran-apero-main.png', qs: 'scene=play-hand&apero=1&cap=1', wait: 2200 },
  { file: 'ecran-apero-resultat.png', qs: 'scene=result&apero=1&shot=1', wait: 8500 },
  { file: 'ecran-apero-gage.png', qs: 'scene=result&apero=1&cap=1', wait: 2200 },
  // Mode normal : slam du defi (winnerInfo.defi du scenario result).
  { file: 'ecran-defi.png', qs: 'scene=result&cap=1', wait: 2200 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 400, height: 745, deviceScaleFactor: 2.7 });

// Force le francais + neutralise la pop-up "Installe l'app".
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.setItem('st_lang', 'fr');
  sessionStorage.setItem('snaptap_install_nudge_seen', '1');
  localStorage.setItem('fc_party', '0');
});

for (const { file, qs, wait } of SHOTS) {
  await page.goto(`${BASE}/?debug&safe=1&${qs}`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(
    () =>
      !(document.getElementById('root')?.innerText || '')
        .toLowerCase()
        .includes('chargement'),
    { timeout: 20000 }
  );
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await sleep(wait);
  await page.screenshot({ path: join(outDir, file) });
  console.log(`✓ ${file}  (${qs})`);
}

await browser.close();
console.log(`\nEcrans pub dans ${outDir}`);
process.exit(0);
