// Genere les visuels feed "HISTOIRE DE TABLE" (piste com n°1 "Le test",
// 17/08/2026) dans store-assets/promo/test/ : 1080x1350, fond NOIR (pour se
// distinguer des memes jaunes), une phrase de table en enorme, une carte du
// jeu comme piece a conviction, la marque en bas. Le jeu ne se vend pas par
// ses cartes mais par ce qu'il revele des gens autour de la table.
// Lancer :  node scripts/gen-test.mjs
//
// REGLE EDITORIALE (legal) : jamais de vraie personne ni de grande marque.
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'store-assets', 'promo', 'test');
mkdirSync(OUT, { recursive: true });

const YELLOW = '#FFE600';
const PINK = '#FF2D6F';
const RED = '#FF1744';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GREY = '#9a9aa5';
const AMBER = '#FBB417';

const W = 1080;
const H = 1350;
const MAX_TEXT_W = 960;

// ---- Les 3 histoires. Une ligne = { t, c (couleur), s (taille max) }.
const POSTS = [
  {
    slug: 'tes-potes',
    lines: [
      { t: 'TU CROIS QUE TES POTES', c: WHITE, s: 96 },
      { t: 'TE CONNAISSENT ?', c: WHITE, s: 96 },
      { t: 'IL Y A UN MOYEN', c: YELLOW, s: 120 },
      { t: 'DE VÉRIFIER.', c: YELLOW, s: 120 },
    ],
    card: '?',
    footer: ['3 À 16 JOUEURS. GRATUIT. SANS COMPTE.'],
  },
  {
    slug: 'ton-mec',
    lines: [
      { t: 'TON MEC TE CONNAÎT', c: WHITE, s: 96 },
      { t: 'VRAIMENT ?', c: WHITE, s: 96 },
      { t: 'IL Y A UN MOYEN', c: YELLOW, s: 120 },
      { t: 'DE VÉRIFIER.', c: YELLOW, s: 120 },
    ],
    card: '?',
    footer: ['GRATUIT. SANS COMPTE. À TESTER CE SOIR.'],
  },
  {
    slug: 'qui-te-connait',
    lines: [
      { t: 'TU DIS CE QUE TU DÉTESTES.', c: WHITE, s: 90 },
      { t: 'TES POTES DEVINENT.', c: WHITE, s: 90 },
      { t: 'ON VOIT VITE', c: YELLOW, s: 120 },
      { t: 'QUI TE CONNAÎT.', c: YELLOW, s: 120 },
    ],
    card: 'Lundi matin',
    footer: ['3 À 16 JOUEURS. GRATUIT. SANS COMPTE.'],
  },
  // ---- Declinaison MODE APERO (gratuit). `gage` = la VRAIE regle de la
  // carte dans GAGES.md, jamais inventee.
  {
    slug: 'apero-tes-potes',
    apero: true,
    lines: [
      { t: 'TES POTES TE CONNAISSENT ?', c: WHITE, s: 90 },
      { t: 'ON VÉRIFIE.', c: AMBER, s: 118 },
      { t: 'ET ÇA BOIT.', c: AMBER, s: 118 },
    ],
    card: 'Kebab à 3h du mat',
    gage: 'TEAM KEBAB BOIT 1 GORGÉE, TEAM TACOS BOIT 2 GORGÉES',
    footer: ['MODE APÉRO GRATUIT. 3 À 16 JOUEURS. SANS COMPTE.'],
  },
  {
    slug: 'apero-regle',
    apero: true,
    lines: [
      { t: 'TU DIS CE QUE TU DÉTESTES.', c: WHITE, s: 90 },
      { t: 'TES POTES DEVINENT.', c: WHITE, s: 90 },
      { t: 'CHAQUE CARTE A', c: AMBER, s: 104 },
      { t: 'SA RÈGLE À BOIRE.', c: AMBER, s: 104 },
    ],
    card: 'Appeler ton ex',
    gage: 'CEUX QUI ONT DÉJÀ RECONTACTÉ UN(E) EX EN SOIRÉE BOIVENT 3 GORGÉES',
    footer: ['MODE APÉRO GRATUIT. 3 À 16 JOUEURS. SANS COMPTE.'],
  },
  {
    slug: 'apero-gagnant',
    apero: true,
    lines: [
      { t: 'CELUI QUI TE CONNAÎT LE MIEUX', c: WHITE, s: 88 },
      { t: 'NE BOIT JAMAIS.', c: AMBER, s: 118 },
      { t: 'LES AUTRES, SI.', c: WHITE, s: 100 },
    ],
    card: 'Raclette',
    gage: 'LE DERNIER À AVOIR MANGÉ UNE RACLETTE BOIT 2',
    footer: ['MODE APÉRO GRATUIT. 3 À 16 JOUEURS. SANS COMPTE.'],
  },
];

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

// Taille reelle d'une ligne : son max, reduit si elle deborde.
function fitSize(text, max) {
  return Math.min(max, (MAX_TEXT_W * 100) / widthOf(text, 100));
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
    <rect x="${bx + shadow}" y="${by + shadow}" width="${w}" height="${h}" fill="${PINK}"/>
    <rect x="${bx}" y="${by}" width="${w}" height="${h}" fill="${bg}" stroke="${BLACK}" stroke-width="${strokeW}"/>
    ${texts}
  </g>`;
}

// Bloc de lignes centre verticalement autour de cy.
function textBlock(lines, cx, cy) {
  const sized = lines.map((l) => ({ ...l, size: fitSize(l.t, l.s) }));
  const gap = 1.2;
  const total = sized.reduce((n, l) => n + l.size * gap, 0);
  let y = cy - total / 2;
  let out = '';
  for (const l of sized) {
    y += (l.size * gap) / 2;
    out += textAt(l.t, l.size, cx, y, l.c);
    y += (l.size * gap) / 2;
  }
  return out;
}

function brandChip(cx, cy) {
  const size = 44;
  const w = widthOf('SNAP TAP', size);
  const padX = 22;
  const padY = 12;
  const bw = w + padX * 2;
  const bh = size + padY * 2;
  return `<g transform="rotate(-2 ${cx} ${cy})">
    <rect x="${cx - bw / 2 + 6}" y="${cy - bh / 2 + 6}" width="${bw}" height="${bh}" fill="${WHITE}"/>
    <rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" fill="${PINK}" stroke="${BLACK}" stroke-width="5"/>
    ${textAt('SNAP TAP', size, cx, cy, WHITE)}
  </g>`;
}

// Pastille MODE APERO en haut (ambre, comme le chrome apero du jeu).
function aperoPill(cx, cy) {
  const size = 40;
  const w = widthOf('MODE APÉRO', size);
  const bw = w + 60;
  const bh = size + 26;
  return `<g transform="rotate(-2 ${cx} ${cy})">
    <rect x="${cx - bw / 2 + 6}" y="${cy - bh / 2 + 6}" width="${bw}" height="${bh}" fill="${WHITE}"/>
    <rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" fill="${AMBER}" stroke="${BLACK}" stroke-width="5"/>
    ${textAt('MODE APÉRO', size, cx, cy, BLACK)}
  </g>`;
}

// Le gage de la carte, comme dans le jeu : bloc rose, texte blanc, 1-2 lignes.
function gageChip(text, cx, cy, maxW = 880) {
  const words = text.split(' ');
  let lines = [text];
  if (widthOf(text, 46) > maxW - 80) {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const w = Math.max(widthOf(a, 100), widthOf(b, 100));
      if (!best || w < best.w) best = { a, b, w };
    }
    lines = [best.a, best.b];
  }
  let size = 46;
  for (const ln of lines) size = Math.min(size, ((maxW - 80) * 100) / widthOf(ln, 100));
  const gap = 1.15;
  const bh = lines.length * size * gap + 44;
  const bw = Math.max(...lines.map((l) => widthOf(l, size))) + 80;
  const bx = cx - bw / 2;
  const by = cy - bh / 2;
  let texts = '';
  lines.forEach((ln, i) => {
    texts += textAt(ln, size, cx, cy + (i - (lines.length - 1) / 2) * size * gap, WHITE);
  });
  return `<g transform="rotate(2 ${cx} ${cy})">
    <rect x="${bx + 9}" y="${by + 9}" width="${bw}" height="${bh}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${PINK}" stroke="${BLACK}" stroke-width="7"/>
    ${texts}
  </g>`;
}

async function render(svg, file) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(W, H).png().toFile(join(OUT, file));
  console.log('✓ promo/test/' + file);
}

for (const post of POSTS) {
  const footerColor = post.footerColor || GREY;
  const footerLines = post.footer
    .map((t, i) => textAt(t, 46, W / 2, 1105 + i * 58, footerColor))
    .join('');
  const apero = !!post.apero;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#0a0a0a"/>
  <rect x="0" y="0" width="${W}" height="14" fill="${apero ? AMBER : YELLOW}"/>
  ${apero ? aperoPill(W / 2, 92) : ''}
  ${textBlock(post.lines, W / 2, apero ? 350 : 330)}
  ${gameCard(post.card, W / 2, apero ? 740 : 800, apero ? 560 : 620, apero ? 220 : 290, -3)}
  ${apero ? gageChip(post.gage, W / 2, 950) : ''}
  ${footerLines}
  ${brandChip(W / 2 - 250, 1275)}
  ${textAt('SNAPTAPPARTY.COM', 36, W / 2 + 130, 1275, WHITE)}
</svg>`;
  await render(svg, `test-${post.slug}-1080x1350.png`);
}
console.log('Visuels "histoire de table" dans store-assets/promo/test/');
