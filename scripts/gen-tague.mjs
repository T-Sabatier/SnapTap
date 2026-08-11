// Genere les posts "TAGUE TON POTE" dans store-assets/promo/tague/ :
// visuels feed 1080x1350 — une carte du jeu + "ton pote, il aime ou il
// deteste ?" → on tague le pote avec sa reponse en commentaire, il confirme
// ou conteste. Chaque tag = une nouvelle personne sur le post (acquisition).
// Meme langage visuel que le jeu. Lancer :  node scripts/gen-tague.mjs
//
// REGLE EDITORIALE (legal) : jamais de vraie personne ni de grande marque
// dans les visuels marketing — cartes generiques uniquement.
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'store-assets', 'promo', 'tague');
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

// Cartes REELLES du deck, sans personne/marque, qui divisent bien.
const CARDS = [
  'Ananas sur la pizza',
  'Kebab à 3h du mat',
  'Raclette',
  'Garder les chaussettes',
  'Appeler ton ex',
  'Salle de sport à 18h',
  'Camping sauvage',
  'Danser sur une table',
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
    <rect x="${bx + shadow}" y="${by + shadow}" width="${w}" height="${h}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${w}" height="${h}" fill="${bg}" stroke="${BLACK}" stroke-width="${strokeW}"/>
    ${texts}
  </g>`;
}

// Pastille avec coeur (barre = j'aime pas), comme les votes du jeu.
function voteChip(text, textTargetW, cx, cy, bg, tilt, dislike = false) {
  const size = (textTargetW * 100) / widthOf(text, 100);
  const w = widthOf(text, size);
  const heartS = size * 0.9;
  const gap = size * 0.35;
  const totalW = w + gap + heartS;
  const h = size;
  const padX = size * 0.42;
  const padY = size * 0.3;
  const bx = cx - totalW / 2 - padX;
  const by = cy - h / 2 - padY;
  const bw = totalW + padX * 2;
  const bh = h + padY * 2;
  const stroke = Math.max(6, Math.round(size * 0.12));
  const shadow = Math.max(8, Math.round(size * 0.14));
  const hx = cx - totalW / 2 + heartS / 2;
  const tx = cx + heartS / 2 + gap / 2;
  const s = heartS / 24;
  return `<g transform="rotate(${tilt} ${cx} ${cy})">
    <rect x="${bx + shadow}" y="${by + shadow}" width="${bw}" height="${bh}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${bg}" stroke="${BLACK}" stroke-width="${stroke}"/>
    <path transform="translate(${hx - heartS / 2} ${cy - heartS / 2}) scale(${s})"
      d="M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z" fill="${WHITE}"/>
    ${dislike ? `<rect x="${hx - heartS * 0.62}" y="${cy - 5}" width="${heartS * 1.24}" height="10" fill="${bg}" stroke="${BLACK}" stroke-width="3" transform="rotate(-35 ${hx} ${cy})"/>` : ''}
    ${textAt(text, size, tx, cy, WHITE)}
  </g>`;
}

async function render(svg, file) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(W, H).png().toFile(join(OUT, file));
  console.log('✓ promo/tague/' + file);
}

function slug(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

for (const card of CARDS) {
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${YELLOW}"/>
  ${textAt('TON POTE :', 100, W / 2, 175, BLACK)}
  ${textAt('IL AIME OU IL DÉTESTE ?', 58, W / 2, 285, BLACK)}
  ${gameCard(card, W / 2, 560, 800, 380, -2)}
  ${voteChip("J'AIME", 170, W / 2 - 235, 850, GREEN, -3)}
  ${voteChip("J'AIME PAS", 250, W / 2 + 215, 865, RED, 2, true)}
  ${textAt('TAGUE-LE AVEC TA RÉPONSE', 52, W / 2, 1040, BLACK)}
  ${textAt('EN COMMENTAIRE.', 52, W / 2, 1105, BLACK)}
  ${textAt('IL CONFIRME… OU PAS.', 44, W / 2, 1210, PINK, `stroke="${BLACK}" stroke-width="2" paint-order="stroke"`)}
  ${textAt(PUBLIC_URL_LABEL, 34, W / 2, 1305, BLACK)}
</svg>`;
  await render(svg, `tague-${slug(card)}-1080x1350.png`);
}
console.log('Posts "tague ton pote" dans store-assets/promo/tague/');
