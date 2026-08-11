// Genere le carrousel Instagram "comment on joue" dans store-assets/promo/carousel/ :
// 5 slides 1080x1350 (feed 4:5) montant de VRAIES captures du jeu (mode Debug
// ?safe : cartes generiques, boss = Lea) dans le langage visuel du jeu.
// Prerequis : les captures store-assets/promo/carousel/src/*.png, produites par
//   1. npm run dev          (serveur dev)
//   2. node scripts/shoot-carousel.mjs
// Puis :  node scripts/gen-carousel.mjs
//
// REGLE EDITORIALE (legal) : ne JAMAIS mettre de vraie personne ni de grande
// marque dans ces visuels — d'ou le pool ?safe (les screenshots store, eux,
// contiennent Dua Lipa / Star Wars et sont interdits en marketing).
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'store-assets', 'promo', 'carousel');
const SRC = join(OUT, 'src');
mkdirSync(OUT, { recursive: true });

const YELLOW = '#FFE600';
const PINK = '#FF2D6F';
const GREEN = '#00C853';
const BLACK = '#000000';
const WHITE = '#FFFFFF';

const PUBLIC_URL_LABEL = 'SNAPTAPPARTY.COM';
const W = 1080;
const H = 1350;

for (const f of ['ecran-main.png', 'ecran-choix.png', 'ecran-resultat.png']) {
  if (!existsSync(join(SRC, f))) {
    console.error(
      `Capture manquante : ${f}\nLance d'abord le serveur dev (npm run dev) puis : node scripts/shoot-carousel.mjs`
    );
    process.exit(1);
  }
}

const fontBuf = readFileSync(join(root, 'scripts', 'fonts', 'Anton-Regular.ttf'));
const font = opentype.parse(
  fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength)
);

function textAt(text, size, cx, cy, fill, extra = '') {
  const p = font.getPath(text, 0, 0, size);
  const b = p.getBoundingBox();
  const dx = cx - (b.x1 + b.x2) / 2;
  const dy = cy - (b.y1 + b.y2) / 2;
  return `<path d="${p.toPathData(2)}" transform="translate(${dx.toFixed(2)},${dy.toFixed(2)})" fill="${fill}" ${extra}/>`;
}

function widthOf(text, size) {
  return font.getAdvanceWidth(text, size);
}

function splitBalanced(text) {
  const words = text.split(' ');
  if (words.length === 1 || text.length <= 12) return [text];
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(widthOf(a, 100), widthOf(b, 100));
    if (!best || w < best.w) best = { a, b, w };
  }
  return [best.a, best.b];
}

// Carte blanche inclinee (ombre + contour), texte 1-2 lignes.
function gameCard(text, cx, cy, w, h, tilt, bg = WHITE, fg = BLACK) {
  const lines = splitBalanced(text.toUpperCase());
  const padX = w * 0.1;
  const padY = h * 0.16;
  let size = Infinity;
  for (const ln of lines) {
    size = Math.min(size, ((w - padX * 2) * 100) / widthOf(ln, 100));
  }
  const lineGap = 1.14;
  size = Math.min(size, (h - padY * 2) / (lines.length * lineGap));
  const bx = cx - w / 2;
  const by = cy - h / 2;
  const strokeW = Math.max(8, Math.round(w * 0.018));
  const shadow = Math.max(10, Math.round(w * 0.026));
  let texts = '';
  lines.forEach((ln, i) => {
    const yi = cy + (i - (lines.length - 1) / 2) * size * lineGap;
    texts += textAt(ln, size, cx, yi, fg);
  });
  return `<g transform="rotate(${tilt} ${cx} ${cy})">
    <rect x="${bx + shadow}" y="${by + shadow}" width="${w}" height="${h}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${w}" height="${h}" fill="${bg}" stroke="${BLACK}" stroke-width="${strokeW}"/>
    ${texts}
  </g>`;
}

function chip(text, textTargetW, cx, cy, bg, tilt, fg = WHITE) {
  const size = (textTargetW * 100) / widthOf(text, 100);
  const w = widthOf(text, size);
  const h = size;
  const padX = size * 0.42;
  const padY = size * 0.3;
  const bx = cx - w / 2 - padX;
  const by = cy - h / 2 - padY;
  const bw = w + padX * 2;
  const bh = h + padY * 2;
  const stroke = Math.max(6, Math.round(size * 0.12));
  const shadow = Math.max(8, Math.round(size * 0.14));
  return `<g transform="rotate(${tilt} ${cx} ${cy})">
    <rect x="${bx + shadow}" y="${by + shadow}" width="${bw}" height="${bh}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${bg}" stroke="${BLACK}" stroke-width="${stroke}"/>
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
  return `${textAt('SNAP', snapSize, S / 2, 150, BLACK)}
  <g transform="rotate(-3 ${S / 2} 350)">
    <rect x="${bx + 13}" y="${by + 13}" width="${bw}" height="${bh}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${PINK}" stroke="${BLACK}" stroke-width="14"/>
    ${textAt('TAP', tapSize, S / 2, 350, WHITE)}
  </g>`;
}

// Capture telephone integree : cadre noir + ombre, legerement inclinee.
function phone(file, cx, cy, h, tilt) {
  const ratio = 1080 / 2012;
  const w = h * ratio;
  const b64 = readFileSync(join(SRC, file)).toString('base64');
  const bx = cx - w / 2;
  const by = cy - h / 2;
  return `<g transform="rotate(${tilt} ${cx} ${cy})">
    <rect x="${bx + 16}" y="${by + 16}" width="${w + 20}" height="${h + 20}" fill="${BLACK}" opacity="0.35"/>
    <rect x="${bx - 10}" y="${by - 10}" width="${w + 20}" height="${h + 20}" fill="${BLACK}"/>
    <image x="${bx}" y="${by}" width="${w}" height="${h}" href="data:image/png;base64,${b64}"/>
  </g>`;
}

async function render(svg, file) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(W, H).png().toFile(join(OUT, file));
  console.log('✓ promo/carousel/' + file);
}

const wrap = (inner, bg = YELLOW) =>
  `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${inner}
</svg>`;

// Slide type "ecran du jeu" : etape + titre 2 lignes + capture + legende.
function screenSlide({ stepN, title1, title2, file, caption, tilt }) {
  return wrap(`
  ${chip(`ÉTAPE ${stepN}`, 170, W / 2, 100, BLACK, -2, YELLOW)}
  ${textAt(title1, 62, W / 2, 205, BLACK)}
  ${title2 ? textAt(title2, 62, W / 2, 280, BLACK) : ''}
  ${phone(file, W / 2, 790, 870, tilt)}
  ${textAt(caption, 44, W / 2, 1290, BLACK)}
`);
}

// ============ SLIDE 1 — accroche ============
async function s1() {
  const svg = wrap(`
  ${textAt('TU CROIS CONNAÎTRE', 82, W / 2, 175, BLACK)}
  ${textAt('TES POTES ?', 82, W / 2, 280, BLACK)}
  ${gameCard('Appeler ton ex', W / 2 - 350, 545, 330, 200, -6)}
  ${gameCard('Chaussettes-claquettes', W / 2 + 350, 555, 330, 200, 6)}
  ${gameCard('Raclette', W / 2, 590, 340, 210, 1.5, PINK, WHITE)}
  <g transform="translate(${W / 2 - 256 * 0.78} 790) scale(0.78)">${logoGroup()}</g>
  ${chip('LE JEU QUI VÉRIFIE', 400, W / 2, 1180, PINK, -2)}
  ${textAt('COMMENT ON JOUE', 42, W / 2 - 55, 1300, BLACK)}
  <polygon points="${W / 2 + 215},1280 ${W / 2 + 215},1320 ${W / 2 + 256},1300 " fill="${BLACK}"/>
`);
  await render(svg, 'carrousel-1-accroche.png');
}

// ============ SLIDES 2-4 — vrais ecrans ============
const s2 = () =>
  render(
    screenSlide({
      stepN: 1,
      title1: 'LÉA VEUT CE QU’ELLE AIME.',
      title2: 'POSE LA CARTE QUI LUI VA',
      file: 'ecran-main.png',
      caption: 'CHAQUE MANCHE, UN JOUEUR ANNONCE LA COULEUR',
      tilt: -1.5,
    }),
    'carrousel-2-main.png'
  );

const s3 = () =>
  render(
    screenSlide({
      stepN: 2,
      title1: 'ELLE CHOISIT',
      title2: 'SA PRÉFÉRÉE',
      file: 'ecran-choix.png',
      caption: 'SANS SAVOIR QUI A POSÉ QUOI',
      tilt: 1.5,
    }),
    'carrousel-3-choix.png'
  );

const s4 = () =>
  render(
    screenSlide({
      stepN: 3,
      title1: 'C’EST TA CARTE ?',
      title2: '+1 POINT',
      file: 'ecran-resultat.png',
      caption: 'PREMIER À 5 POINTS, VICTOIRE',
      tilt: -1.5,
    }),
    'carrousel-4-resultat.png'
  );

// ============ SLIDE 5 — appel a l'action ============
async function s5() {
  const svg = wrap(`
  <g transform="translate(${W / 2 - 256 * 0.9} 100) scale(0.9)">${logoGroup()}</g>
  ${chip('GRATUIT', 200, W / 2 - 280, 700, GREEN, -3, BLACK)}
  ${chip('SANS COMPTE', 300, W / 2 + 190, 715, BLACK, 2, YELLOW)}
  ${chip('3 À 16 JOUEURS', 340, W / 2 - 150, 880, PINK, 1.5)}
  ${chip('CHACUN SON TEL', 300, W / 2 + 265, 905, WHITE, -2, BLACK)}
  ${textAt('LIEN EN BIO', 96, W / 2, 1120, BLACK)}
  <polygon points="${W / 2 - 22},1190 ${W / 2 + 22},1190 ${W / 2},1240" fill="${BLACK}"/>
  ${textAt(PUBLIC_URL_LABEL, 34, W / 2, 1310, BLACK)}
`);
  await render(svg, 'carrousel-5-cta.png');
}

await s1();
await s2();
await s3();
await s4();
await s5();
console.log('Carrousel complet dans store-assets/promo/carousel/');
