// Genere les visuels feed "DEFIS" dans store-assets/promo/defis/ : 1080x1350,
// reproduction du slam defi du jeu (fond rose GageAnnounce, encadre jaune,
// kicker DEFI !) avec de VRAIS defis de GENERIC_DEFIS (Game.jsx) — jamais
// inventes, jamais ceux qui citent une marque (regle editoriale marketing).
// Le principe com : le defi EST le spectacle, on montre le contenu brut.
// Lancer :  node scripts/gen-defis.mjs
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'store-assets', 'promo', 'defis');
mkdirSync(OUT, { recursive: true });

const YELLOW = '#FFE600';
const PINK = '#FF2D6F';
const SLAM_PINK = '#D6104A'; // fond du GageAnnounce in-game (rgba 214,15,74)
const BLACK = '#000000';
const WHITE = '#FFFFFF';

const W = 1080;
const H = 1350;

// ---- Les defis mis en avant. t = texte EXACT de GENERIC_DEFIS (sans le @),
// cible = true si le jeu designe un joueur a la roulette ('@' dans Game.jsx).
const DEFIS = [
  {
    slug: 'cacher-un-corps',
    cible: true,
    t: 'Dis qui de la table tu appellerais pour cacher un corps, ou désigne qui te balancerait à la police',
  },
  {
    slug: 'derniere-recherche',
    cible: true,
    t: 'Montre ta dernière recherche internet, ou raconte ta dernière honte',
  },
  {
    slug: 'troisieme-personne',
    cible: true,
    t: "Jusqu'à ton prochain point : parle de toi à la 3e personne",
  },
  {
    slug: 'teleachat',
    cible: true,
    t: "Cours sur place au ralenti avec bruitages, ou vends l'objet le plus proche de toi façon téléachat",
  },
  {
    slug: 'fond-ecran',
    cible: false,
    t: 'Tout le monde montre son fond d\'écran, vote pour le pire',
  },
  {
    slug: 'faux-malade',
    cible: true,
    t: "Danse 15 secondes sans musique dans le silence total, ou avoue la dernière fois que t'as fait semblant d'être malade",
  },
];

const fontBuf = readFileSync(join(root, 'scripts', 'fonts', 'Anton-Regular.ttf'));
const font = opentype.parse(
  fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength)
);

// Serialisation MAISON du path (bug opentype.js : toPathData() glisse des NaN
// a certaines tailles fractionnaires → librsvg tronque le texte).
function pathData(p) {
  const n = (v) => v.toFixed(2);
  return p.commands
    .map((c) =>
      c.type === 'M' ? `M${n(c.x)} ${n(c.y)}`
      : c.type === 'L' ? `L${n(c.x)} ${n(c.y)}`
      : c.type === 'C' ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
      : c.type === 'Q' ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
      : 'Z'
    )
    .join('');
}

function textAt(text, size, cx, cy, fill, extra = '') {
  const p = font.getPath(text, 0, 0, size);
  const b = p.getBoundingBox();
  const dx = cx - (b.x1 + b.x2) / 2;
  const dy = cy - (b.y1 + b.y2) / 2;
  return `<path d="${pathData(p)}" transform="translate(${dx.toFixed(2)},${dy.toFixed(2)})" fill="${fill}" ${extra}/>`;
}

function widthOf(text, size) {
  return font.getAdvanceWidth(text, size);
}

// Coupe le texte en k lignes de largeurs equilibrees (glouton par cible).
function wrapK(words, k) {
  const total = widthOf(words.join(' '), 100);
  const target = total / k;
  const lines = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    if (lines.length < k - 1 && widthOf(cur.join(' '), 100) >= target) {
      lines.push(cur.join(' '));
      cur = [];
    }
  }
  if (cur.length) lines.push(cur.join(' '));
  return lines;
}

// Encadre jaune du slam : wrapping auto (2 a 5 lignes), taille auto.
function slamBox(text, cx, cy, maxW) {
  const words = text.toUpperCase().split(' ');
  let best = null;
  for (let k = 2; k <= 5; k++) {
    if (k > words.length) break;
    const lines = wrapK(words, k);
    const maxLineW = Math.max(...lines.map((l) => widthOf(l, 100)));
    // Les pavés longs (4-5 lignes) restent plus petits pour tenir sous le kicker.
    const size = Math.min(((maxW - 120) * 100) / maxLineW, k <= 3 ? 92 : 70);
    if (!best || size > best.size) best = { lines, size };
    if (size >= 68) break; // assez gros, on garde le moins de lignes possible
  }
  const { lines, size } = best;
  const lineGap = 1.18;
  const padX = 60;
  const padY = 48;
  const bw = Math.max(...lines.map((l) => widthOf(l, size))) + padX * 2;
  const bh = lines.length * size * lineGap + padY * 2 - size * (lineGap - 1);
  const bx = cx - bw / 2;
  const by = cy - bh / 2;
  let texts = '';
  lines.forEach((l, i) => {
    const y = cy + (i - (lines.length - 1) / 2) * size * lineGap;
    texts += textAt(l, size, cx, y, BLACK);
  });
  return {
    h: bh,
    svg: `<g transform="rotate(1.5 ${cx} ${cy})">
    <rect x="${bx + 14}" y="${by + 14}" width="${bw}" height="${bh}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${YELLOW}" stroke="${BLACK}" stroke-width="10"/>
    ${texts}
  </g>`,
  };
}

// Kicker "DEFI !" : cible dessinee + lettres espacees (facon Space Mono du jeu).
function kicker(cx, cy) {
  const letters = 'DÉFI !'.split('').filter((c) => c !== ' ');
  const size = 52;
  const gap = 34;
  const widths = letters.map((c) => widthOf(c, size));
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (letters.length - 1);
  const target = `<g transform="translate(${cx - totalW / 2 - 96} ${cy})">
    <circle r="30" fill="none" stroke="${YELLOW}" stroke-width="8"/>
    <circle r="12" fill="${YELLOW}"/>
  </g>`;
  let x = cx - totalW / 2;
  let out = '';
  letters.forEach((c, i) => {
    out += textAt(c, size, x + widths[i] / 2, cy, YELLOW);
    x += widths[i] + gap;
  });
  return target + out;
}

function chip(text, textTargetW, cx, cy, bg, tilt, fg = BLACK) {
  const size = (textTargetW * 100) / widthOf(text, 100);
  const w = widthOf(text, size);
  const padX = size * 0.42;
  const padY = size * 0.3;
  const bx = cx - w / 2 - padX;
  const by = cy - size / 2 - padY;
  const bw = w + padX * 2;
  const bh = size + padY * 2;
  return `<g transform="rotate(${tilt} ${cx} ${cy})">
    <rect x="${bx + 8}" y="${by + 8}" width="${bw}" height="${bh}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${bg}" stroke="${BLACK}" stroke-width="6"/>
    ${textAt(text, size, cx, cy, fg)}
  </g>`;
}

function logoGroup() {
  const S = 512;
  const snapSize = (400 * 100) / widthOf('SNAP', 100);
  const tapSize = (210 * 100) / widthOf('TAP', 100);
  const tapW = widthOf('TAP', tapSize);
  const padX = 40;
  const padY = 30;
  const bx = S / 2 - tapW / 2 - padX;
  const by = 350 - tapSize / 2 - padY;
  const bw = tapW + padX * 2;
  const bh = tapSize + padY * 2;
  return `${textAt('SNAP', snapSize, S / 2, 150, WHITE)}
  <g transform="rotate(-3 ${S / 2} 350)">
    <rect x="${bx + 13}" y="${by + 13}" width="${bw}" height="${bh}" fill="${WHITE}" opacity="0.25"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${BLACK}" stroke="${WHITE}" stroke-width="10"/>
    ${textAt('TAP', tapSize, S / 2, 350, YELLOW)}
  </g>`;
}

async function render(defi) {
  // Position dynamique : l'encadré démarre sous le kicker, la sous-ligne suit.
  const probe = slamBox(defi.t, W / 2, 0, 980);
  const boxCy = 410 + probe.h / 2;
  const box = slamBox(defi.t, W / 2, boxCy, 980);
  const subline = defi.cible
    ? "LE JEU DÉSIGNE QUI S'Y COLLE, À LA ROULETTE."
    : "TOUTE LA TABLE S'Y COLLE.";
  const subY = Math.min(410 + box.h + 84, 1000);
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BLACK}" stop-opacity="0.18"/>
      <stop offset="0.3" stop-color="${BLACK}" stop-opacity="0"/>
      <stop offset="0.75" stop-color="${BLACK}" stop-opacity="0"/>
      <stop offset="1" stop-color="${BLACK}" stop-opacity="0.3"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${SLAM_PINK}"/>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  ${chip('VRAI DÉFI DU JEU', 260, W / 2, 120, WHITE, -2)}
  ${kicker(W / 2 + 48, 320)}
  ${box.svg}
  ${textAt(subline, 38, W / 2, subY, WHITE)}
  <g transform="translate(${W / 2 - 256 * 0.55} ${H - 320}) scale(0.55)">${logoGroup()}</g>
  ${textAt('GRATUIT · SANS COMPTE · 3 À 16 JOUEURS', 32, W / 2, H - 46, '#ffd9e4')}
</svg>`;
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(W, H)
    .png()
    .toFile(join(OUT, `defi-${defi.slug}-1080x1350.png`));
  console.log(`✓ promo/defis/defi-${defi.slug}-1080x1350.png`);
}

for (const d of DEFIS) await render(d);
console.log('Visuels defis dans store-assets/promo/defis/');
