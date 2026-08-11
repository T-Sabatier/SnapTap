// Genere le carrousel Instagram "comment on joue" dans store-assets/promo/carousel/ :
// 6 slides 1080x1350 (format feed 4:5) qui deroulent une manche etape par etape,
// en imitant les ecrans du jeu (annonce, main, choix du boss, resultat).
// Meme langage visuel que gen-promo.mjs (Anton, jaune/rose/noir, brutaliste).
// Lancer :  node scripts/gen-carousel.mjs
//
// REGLE EDITORIALE (legal) : ne JAMAIS mettre de vraie personne ni de grande
// marque dans ces visuels — cartes generiques uniquement (pas de capture des
// vrais screenshots store, qui contiennent Dua Lipa / Star Wars).
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'store-assets', 'promo', 'carousel');
mkdirSync(OUT, { recursive: true });

const YELLOW = '#FFE600';
const PINK = '#FF2D6F';
const GREEN = '#00C853';
const RED = '#FF1744';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const ORANGE = '#FF7A00';

const PUBLIC_URL_LABEL = 'SNAPTAPPARTY.COM';
const W = 1080;
const H = 1350;

const fontBuf = readFileSync(join(root, 'scripts', 'fonts', 'Anton-Regular.ttf'));
const font = opentype.parse(
  fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength)
);

// Path SVG du texte, boite englobante centree sur (cx, cy).
// extra : attributs supplementaires (ex. contour "sticker" des pseudos).
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

// Coupe un texte en 1-2 lignes equilibrees (au mot le plus central).
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

// Carte blanche inclinee (ombre + contour) avec texte ajuste sur 1-2 lignes.
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

// Pastille coloree (ombre, inclinee) — meme style que le jeu.
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

// Logo SNAP/TAP (meme construction que gen-promo), groupe 512x512.
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

// Coeur plein (path 24x24 recentre), pour les bandeaux J'AIME.
function heart(cx, cy, size, fill) {
  const s = size / 24;
  return `<path transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${s})"
    d="M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z" fill="${fill}"/>`;
}

// Oeil filaire (comme l'ecran "X choisit") : contour + pupille.
function eye(cx, cy, w, color) {
  const rx = w / 2;
  const ry = w / 3.2;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="9"/>
    <circle cx="${cx}" cy="${cy}" r="${w / 6.5}" fill="${color}"/>`;
}

// Numero d'etape en haut de slide.
function step(n, fg = YELLOW, bg = BLACK) {
  return chip(`ÉTAPE ${n}`, 190, W / 2, 120, bg, -2, fg);
}

// Grand bandeau annonce (comme "ADI VEUT J'AIME" en jeu) : texte a gauche, coeur a droite.
function announceBanner(text, cx, cy, w, h, tilt, bg, heartFill) {
  const bx = cx - w / 2;
  const by = cy - h / 2;
  const size = ((w - h - 120) * 100) / widthOf(text, 100);
  const tx = bx + 60 + widthOf(text, size) / 2;
  return `<g transform="rotate(${tilt} ${cx} ${cy})">
    <rect x="${bx + 16}" y="${by + 16}" width="${w}" height="${h}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${w}" height="${h}" fill="${bg}" stroke="${BLACK}" stroke-width="10"/>
    ${textAt(text, Math.min(size, h * 0.52), tx, cy, BLACK)}
    ${heart(bx + w - h / 2 - 30, cy, h * 0.52, heartFill)}
  </g>`;
}

async function render(svg, file) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(W, H).png().toFile(join(OUT, file));
  console.log('✓ promo/carousel/' + file);
}

const wrap = (inner, bg = YELLOW) =>
  `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${inner}
</svg>`;

// ============ SLIDE 1 — accroche ============
async function s1() {
  const svg = wrap(`
  ${textAt('TU CROIS CONNAÎTRE', 82, W / 2, 190, BLACK)}
  ${textAt('TES POTES ?', 82, W / 2, 295, BLACK)}
  <g transform="translate(${W / 2 - 256 * 1.05} 400) scale(1.05)">${logoGroup()}</g>
  ${chip('LE JEU QUI VÉRIFIE', 430, W / 2, 1035, PINK, -2)}
  ${textAt('COMMENT ON JOUE', 46, W / 2 - 60, 1210, BLACK)}
  <polygon points="${W / 2 + 240},1188 ${W / 2 + 240},1232 ${W / 2 + 285},1210" fill="${BLACK}"/>
`);
  await render(svg, 'carrousel-1-accroche.png');
}

// ============ SLIDE 2 — l'annonce ============
async function s2() {
  const svg = wrap(`
  ${step(1)}
  ${textAt('LÉA ANNONCE', 88, W / 2, 285, BLACK)}
  ${textAt('LA COULEUR', 88, W / 2, 390, BLACK)}
  ${announceBanner('LÉA VEUT J’AIME', W / 2, 640, 880, 190, -1.5, GREEN, BLACK)}
  ${chip('OU J’AIME PAS…', 360, W / 2, 880, RED, 2)}
  ${textAt('À CHAQUE MANCHE, ÇA TOURNE', 44, W / 2, 1130, BLACK)}
  ${textAt(PUBLIC_URL_LABEL, 34, W / 2, 1280, BLACK)}
`);
  await render(svg, 'carrousel-2-annonce.png');
}

// ============ SLIDE 3 — chacun pose une carte ============
async function s3() {
  const svg = wrap(`
  ${step(2)}
  ${textAt('CHACUN POSE UNE CARTE', 74, W / 2, 275, BLACK)}
  ${textAt('DE SA MAIN', 74, W / 2, 370, BLACK)}
  ${gameCard('Raclette', W / 2 - 240, 570, 430, 240, -2, PINK, WHITE)}
  ${gameCard('Téléportation', W / 2 + 240, 585, 430, 240, 1.5)}
  ${gameCard('Camping sauvage', W / 2 - 240, 835, 430, 240, 1)}
  ${gameCard('Danser sur une table', W / 2 + 240, 850, 430, 240, -1.5)}
  <g transform="rotate(-1 ${W / 2} 1080)">
    <rect x="${W / 2 - 390 + 12}" y="${1080 - 62 + 12}" width="780" height="124" fill="${BLACK}" opacity="0.35"/>
    <rect x="${W / 2 - 390}" y="${1080 - 62}" width="780" height="124" fill="${BLACK}"/>
    ${textAt('JOUER CETTE CARTE  >', 56, W / 2, 1080, WHITE)}
  </g>
  ${textAt('CELLE QUI LUI VA LE MIEUX', 44, W / 2, 1230, BLACK)}
  ${textAt(PUBLIC_URL_LABEL, 34, W / 2, 1310, BLACK)}
`);
  await render(svg, 'carrousel-3-pose.png');
}

// ============ SLIDE 4 — le choix a l'aveugle (fond noir comme en jeu) ============
async function s4() {
  const svg = wrap(
    `
  ${step(3, BLACK, YELLOW)}
  ${eye(W / 2, 270, 130, GREEN)}
  ${textAt('LÉA', 150, W / 2, 430, '#FF6F61')}
  <g>
    <rect x="${W / 2 - 330}" y="520" width="660" height="86" fill="none" stroke="${GREEN}" stroke-width="6"/>
    ${heart(W / 2 - 270, 563, 40, GREEN)}
    ${textAt('CHOISIT CE QU’ELLE AIME', 44, W / 2 + 30, 563, GREEN)}
  </g>
  ${gameCard('Raclette', W / 2 - 240, 780, 430, 240, -1.5, '#23231F', '#8F8F88', '#4A4A44')}
  ${gameCard('Téléportation', W / 2 + 240, 795, 430, 240, 1.5, '#23231F', '#8F8F88', '#4A4A44')}
  ${gameCard('Camping sauvage', W / 2 - 240, 1040, 430, 240, 1, '#23231F', '#8F8F88', '#4A4A44')}
  ${gameCard('Danser sur une table', W / 2 + 240, 1055, 430, 240, -1, '#23231F', '#8F8F88', '#4A4A44')}
  ${textAt('SANS SAVOIR QUI A POSÉ QUOI', 44, W / 2, 1250, WHITE)}
  ${textAt(PUBLIC_URL_LABEL, 34, W / 2, 1315, '#8F8F88')}
`,
    '#0A0A0A'
  );
  await render(svg, 'carrousel-4-choix.png');
}

// ============ SLIDE 5 — le resultat ============
async function s5() {
  const svg = wrap(`
  ${step(4)}
  ${textAt('CARTE CHOISIE', 40, W / 2, 250, '#6B6200')}
  <g transform="rotate(-2 ${W / 2} 380)">
    <rect x="${W / 2 - 400 + 14}" y="${380 - 95 + 14}" width="800" height="190" fill="${BLACK}" opacity="0.3"/>
    <rect x="${W / 2 - 400}" y="${380 - 95}" width="800" height="190" fill="${BLACK}"/>
    ${textAt('RACLETTE', 110, W / 2, 380, YELLOW)}
  </g>
  ${textAt('POSÉE PAR', 40, W / 2, 570, '#6B6200')}
  ${textAt('TOI', 210, W / 2, 720, ORANGE, `stroke="${BLACK}" stroke-width="10" paint-order="stroke"`)}
  ${chip('+1 POINT', 260, W / 2, 930, BLACK, -3, YELLOW)}
  ${textAt('PREMIER À 5 POINTS, VICTOIRE', 46, W / 2, 1130, BLACK)}
  ${textAt(PUBLIC_URL_LABEL, 34, W / 2, 1280, BLACK)}
`);
  await render(svg, 'carrousel-5-point.png');
}

// ============ SLIDE 6 — appel a l'action ============
async function s6() {
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
  await render(svg, 'carrousel-6-cta.png');
}

await s1();
await s2();
await s3();
await s4();
await s5();
await s6();
console.log('Carrousel complet dans store-assets/promo/carousel/');
