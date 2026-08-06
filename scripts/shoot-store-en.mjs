// Capture headless des 6 screenshots store EN (US/UK) via le mode Debug.
// Prérequis : le serveur dev doit tourner (npm run dev sur localhost:5173).
// Usage : node scripts/shoot-store-en.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'store-assets', 'screenshots-en');
mkdirSync(outDir, { recursive: true });

// Écrans du store → scénario Debug (mêmes 6 que la version FR).
const SHOTS = [
  { file: '01-home.png', scene: 'home' },
  { file: '02-lobby.png', scene: 'lobby-host' },
  { file: '03-selection.png', scene: 'play-hand' },
  { file: '04-choix.png', scene: 'reveal-boss' },
  { file: '05-revelation.png', scene: 'result' },
  { file: '06-champion.png', scene: 'game_over' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
// Viewport type téléphone (400 CSS px) x2.7 → sortie 1080 px de large.
await page.setViewport({ width: 400, height: 745, deviceScaleFactor: 2.7 });

// Force la langue anglaise (US) : localStorage st_lang sur l'origine dev.
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.setItem('st_lang', 'en');
  // Neutralise la pop-up "Get the app" (InstallNudge, 1x/session) qui recouvre
  // le lobby et assombrit le fond via son voile.
  sessionStorage.setItem('snaptap_install_nudge_seen', '1');
});

for (const { file, scene } of SHOTS) {
  const url = `${BASE}/?debug&cap=1&scene=${scene}`;
  await page.goto(url, { waitUntil: 'networkidle2' });
  // Polices chargées + laisse les animations (confettis/feux) s'installer.
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await sleep(2200);
  await page.screenshot({ path: join(outDir, file) });
  console.log(`✓ ${file}  (scene=${scene})`);
}

await browser.close();
console.log(`\nScreenshots EN dans ${outDir}`);
process.exit(0);
