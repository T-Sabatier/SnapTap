// Genere le carrousel Instagram "A TOI DE JOUER" dans store-assets/promo/carousel-jeu/ :
// 4 slides 1080x1350 qui font JOUER le lecteur une manche (il choisit sa carte
// dans sa tete avant de swiper, revele le choix de Lea, repond en commentaire).
// Meme langage visuel que le jeu. Lancer :  node scripts/gen-carousel-jeu.mjs
//
// REGLE EDITORIALE (legal) : jamais de vraie personne ni de grande marque
// dans les visuels marketing — cartes generiques uniquement.
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'store-assets', 'promo', 'carousel-jeu');
mkdirSync(OUT, { recursive: true });

const YELLOW = '#FFE600';
const PINK = '#FF2D6F';
const GREEN = '#00C853';
const RED = '#FF1744';
const BLACK = '#000000';
const WHITE = '#FFFFFF';

const PUBLIC_URL_LABEL = 'SNAPTAPPARTY.COM';
const W = 1080;
const H = 1350;

// La main proposee au lecteur (manche J'AIME PAS → cartes a detester, droles).
const HAND = ['Moustiques en été', 'Salle de sport à 18h', 'Garder les chaussettes', 'Appeler ton ex'];
// La carte que Lea choisit a la revelation.
const CHOSEN = 'Moustiques en été';

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

function gameCard(text, cx, cy, w, h, tilt, bg = WHITE, fg = BLACK, stroke = BLACK) {
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
    <rect x="${bx}" y="${by}" width="${w}" height="${h}" fill="${bg}" stroke="${stroke}" stroke-width="${strokeW}"/>
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

// Coeur plein 24x24 recentre.
function heart(cx, cy, size, fill) {
  const s = size / 24;
  return `<path transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${s})"
    d="M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z" fill="${fill}"/>`;
}

// Bandeau annonce comme en jeu : texte a gauche, coeur (barre = j'aime pas).
function announceBanner(text, cx, cy, w, h, tilt, bg, dislike = false) {
  const bx = cx - w / 2;
  const by = cy - h / 2;
  const size = ((w - h - 120) * 100) / widthOf(text, 100);
  const tx = bx + 60 + widthOf(text, Math.min(size, h * 0.52)) / 2;
  const hx = bx + w - h / 2 - 30;
  return `<g transform="rotate(${tilt} ${cx} ${cy})">
    <rect x="${bx + 16}" y="${by + 16}" width="${w}" height="${h}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${w}" height="${h}" fill="${bg}" stroke="${BLACK}" stroke-width="10"/>
    ${textAt(text, Math.min(size, h * 0.52), tx, cy, dislike ? WHITE : BLACK)}
    ${heart(hx, cy, h * 0.52, dislike ? WHITE : BLACK)}
    ${dislike ? `<rect x="${hx - h * 0.34}" y="${cy - 6}" width="${h * 0.68}" height="12" fill="${bg}" stroke="${BLACK}" stroke-width="6" transform="rotate(-35 ${hx} ${cy})"/>` : ''}
  </g>`;
}

async function render(svg, file) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(W, H).png().toFile(join(OUT, file));
  console.log('✓ promo/carousel-jeu/' + file);
}

const wrap = (inner, bg = YELLOW) =>
  `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${inner}
</svg>`;

// ============ SLIDE 1 — ta main, tu poses quoi ? ============
async function s1() {
  const svg = wrap(`
  ${chip('À TOI DE JOUER', 340, W / 2, 120, PINK, -2)}
  ${announceBanner('LÉA VEUT J’AIME PAS', W / 2, 320, 900, 150, -1.5, RED, true)}
  ${textAt('VOICI TA MAIN.', 74, W / 2, 500, BLACK)}
  ${textAt('TU POSES QUOI ?', 74, W / 2, 590, BLACK)}
  ${gameCard(HAND[0], W / 2 - 240, 790, 430, 235, -2)}
  ${gameCard(HAND[1], W / 2 + 240, 805, 430, 235, 1.5)}
  ${gameCard(HAND[2], W / 2 - 240, 1050, 430, 235, 1)}
  ${gameCard(HAND[3], W / 2 + 240, 1065, 430, 235, -1.5)}
  ${textAt('CHOISIS, PUIS SWIPE', 46, W / 2 - 60, 1280, BLACK)}
  <polygon points="${W / 2 + 285},1258 ${W / 2 + 285},1302 ${W / 2 + 330},1280" fill="${BLACK}"/>
`);
  await render(svg, 'jeu-1-ta-main.png');
}

// ============ SLIDE 2 — suspense (fond noir) ============
async function s2() {
  const svg = wrap(
    `
  ${textAt('TOUT LE MONDE A POSÉ.', 66, W / 2, 200, WHITE)}
  ${textAt('LÉA HÉSITE…', 66, W / 2, 285, WHITE)}
  ${gameCard('?', W / 2 - 240, 560, 430, 250, -2, '#23231F', '#8F8F88', '#4A4A44')}
  ${gameCard('?', W / 2 + 240, 575, 430, 250, 1.5, '#23231F', '#8F8F88', '#4A4A44')}
  ${gameCard('?', W / 2 - 240, 830, 430, 250, 1, '#23231F', '#8F8F88', '#4A4A44')}
  ${gameCard('?', W / 2 + 240, 845, 430, 250, -1, '#23231F', '#8F8F88', '#4A4A44')}
  ${textAt('ELLE NE SAIT PAS QUI A POSÉ QUOI.', 44, W / 2, 1090, WHITE)}
  ${textAt('TOI NON PLUS TU NE SAIS PAS', 44, W / 2, 1155, WHITE)}
  ${textAt('CE QU’ELLE VA PRENDRE.', 44, W / 2, 1220, WHITE)}
  ${textAt('SWIPE POUR LA RÉVÉLATION', 40, W / 2, 1300, '#8F8F88')}
`,
    '#0A0A0A'
  );
  await render(svg, 'jeu-2-suspense.png');
}

// ============ SLIDE 3 — revelation + appel commentaire ============
async function s3() {
  const svg = wrap(`
  ${textAt('LÉA A CHOISI…', 76, W / 2, 190, BLACK)}
  ${gameCard(CHOSEN, W / 2, 480, 780, 380, -2, PINK, WHITE)}
  ${chip('+1 POINT POUR QUI L’A POSÉE', 560, W / 2, 780, GREEN, -2, BLACK)}
  ${textAt('C’ÉTAIT TA CARTE ?', 76, W / 2, 990, BLACK)}
  ${textAt('DIS-LE EN COMMENTAIRE', 52, W / 2, 1120, BLACK)}
  <polygon points="${W / 2 - 22},1180 ${W / 2 + 22},1180 ${W / 2},1230" fill="${BLACK}"/>
  ${textAt(PUBLIC_URL_LABEL, 34, W / 2, 1305, BLACK)}
`);
  await render(svg, 'jeu-3-revelation.png');
}

// ============ SLIDE 4 — CTA ============
async function s4() {
  const svg = wrap(`
  ${textAt('ÇA, C’ÉTAIT UNE MANCHE.', 68, W / 2, 220, BLACK)}
  ${textAt('EN VRAI, C’EST MIEUX :', 68, W / 2, 310, BLACK)}
  ${chip('TES VRAIS POTES', 380, W / 2 - 180, 520, PINK, -2)}
  ${chip('LEURS VRAIS GOÛTS', 420, W / 2 + 130, 660, BLACK, 1.5, YELLOW)}
  ${chip('LEUR MAUVAISE FOI', 420, W / 2 - 130, 800, WHITE, -1.5, BLACK)}
  ${chip('GRATUIT · SANS COMPTE', 480, W / 2, 990, GREEN, 1.5, BLACK)}
  ${textAt('LIEN EN BIO', 90, W / 2, 1160, BLACK)}
  <polygon points="${W / 2 - 22},1225 ${W / 2 + 22},1225 ${W / 2},1272" fill="${BLACK}"/>
  ${textAt(PUBLIC_URL_LABEL, 34, W / 2, 1315, BLACK)}
`);
  await render(svg, 'jeu-4-cta.png');
}

await s1();
await s2();
await s3();
await s4();
console.log('Carrousel-jeu complet dans store-assets/promo/carousel-jeu/');
