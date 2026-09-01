// Genere les visuels "PUB" (format repere sur les pubs Insta de jeux de
// societe : le jeu en situation dans une ambiance de soiree + UNE grosse
// phrase de positionnement en blanc en bas) dans store-assets/promo/pub/.
// 1080x1350 (feed 4:5). Pas de photo (regle du 19/07 : on ne filme rien) :
// la "situation" = scene de soiree sombre a lumieres chaudes + vraies
// captures du jeu en telephones inclines (les memes que le carrousel).
// Prerequis : store-assets/promo/carousel/src/*.png (sinon lancer
//   npm run dev  puis  node scripts/shoot-carousel.mjs).
// Lancer :  node scripts/gen-pub.mjs
//
// REGLE EDITORIALE (legal) : jamais de vraie personne ni de grande marque.
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'store-assets', 'promo', 'pub');
const SRC = join(root, 'store-assets', 'promo', 'carousel', 'src');
mkdirSync(OUT, { recursive: true });

const YELLOW = '#FFE600';
const PINK = '#FF2D6F';
const BLACK = '#000000';
const WHITE = '#FFFFFF';

const W = 1080;
const H = 1350;

// ---- Les phrases de positionnement. Une ligne = { t, c (couleur) }.
// La taille s'ajuste seule (largeur max commune, comme gen-test).
// screens = [gauche, droite, centre] : le CENTRE est dessine en dernier
// (au-dessus), c'est lui qu'on lit — y mettre l'ecran vedette.
const FOOTER_NORMAL = 'GRATUIT · SANS COMPTE · 3 À 16 JOUEURS';
const FOOTER_APERO = 'MODE APÉRO GRATUIT · SANS COMPTE · 3 À 16 JOUEURS';
const SCREENS_ORIG = ['ecran-choix.png', 'ecran-resultat.png', 'ecran-main.png'];
const SCREENS_DEFI = ['ecran-main.png', 'ecran-resultat.png', 'ecran-defi.png'];
const SCREENS_APERO = ['ecran-apero-main.png', 'ecran-apero-resultat.png', 'ecran-apero-gage.png'];

const PUBS = [
  // ---- Serie originale (mode normal, gameplay au centre).
  {
    slug: 'nouvelle-generation',
    screens: SCREENS_ORIG,
    footer: FOOTER_NORMAL,
    lines: [
      { t: 'Un jeu de soirée', c: WHITE },
      { t: 'nouvelle génération', c: WHITE },
      { t: 'pour tes potes...', c: WHITE },
      { t: 'Et tes darons !', c: YELLOW },
    ],
  },
  {
    slug: 'juste-vos-telephones',
    screens: SCREENS_ORIG,
    footer: FOOTER_NORMAL,
    lines: [
      { t: "Le jeu d'apéro", c: WHITE },
      { t: 'nouvelle génération :', c: WHITE },
      { t: 'pas de boîte, pas de pion...', c: WHITE },
      { t: 'Juste vos téléphones !', c: YELLOW },
    ],
  },
  {
    slug: 'bien-moins',
    screens: SCREENS_ORIG,
    footer: FOOTER_NORMAL,
    lines: [
      { t: 'Vous connaissez vos potes', c: WHITE },
      { t: 'bien moins que', c: WHITE },
      { t: 'vous ne le pensez...', c: WHITE },
      { t: 'On vérifie ?', c: YELLOW },
    ],
  },
  // ---- Serie originale AVEC la partie defi (slam du defi au centre —
  // texte = un des 35 vrais defis de Game.jsx, jamais invente).
  {
    slug: 'defi-nouvelle-generation',
    screens: SCREENS_DEFI,
    footer: FOOTER_NORMAL,
    lines: [
      { t: 'Un jeu de soirée', c: WHITE },
      { t: 'nouvelle génération', c: WHITE },
      { t: 'pour tes potes...', c: WHITE },
      { t: 'Et tes darons !', c: YELLOW },
    ],
  },
  {
    slug: 'defi-juste-vos-telephones',
    screens: SCREENS_DEFI,
    footer: FOOTER_NORMAL,
    lines: [
      { t: "Le jeu d'apéro", c: WHITE },
      { t: 'nouvelle génération :', c: WHITE },
      { t: 'pas de boîte, pas de pion...', c: WHITE },
      { t: 'Juste vos téléphones !', c: YELLOW },
    ],
  },
  {
    slug: 'defi-bien-moins',
    screens: SCREENS_DEFI,
    footer: FOOTER_NORMAL,
    lines: [
      { t: 'Vous connaissez vos potes', c: WHITE },
      { t: 'bien moins que', c: WHITE },
      { t: 'vous ne le pensez...', c: WHITE },
      { t: 'On vérifie ?', c: YELLOW },
    ],
  },
  // ---- Serie MODE APERO (slam de la regle a boire au centre — gage reel
  // de GAGES.md, jamais invente).
  {
    slug: 'apero-nouvelle-generation',
    screens: SCREENS_APERO,
    footer: FOOTER_APERO,
    lines: [
      { t: "L'apéro", c: WHITE },
      { t: 'nouvelle génération :', c: WHITE },
      { t: 'chaque carte a', c: WHITE },
      { t: 'sa règle à boire !', c: YELLOW },
    ],
  },
  {
    slug: 'apero-juste-vos-telephones',
    screens: SCREENS_APERO,
    footer: FOOTER_APERO,
    lines: [
      { t: 'Le jeu à boire', c: WHITE },
      { t: 'nouvelle génération :', c: WHITE },
      { t: 'pas de boîte, pas de pion...', c: WHITE },
      { t: 'Juste vos téléphones !', c: YELLOW },
    ],
  },
  {
    slug: 'apero-bien-moins',
    screens: SCREENS_APERO,
    footer: FOOTER_APERO,
    lines: [
      { t: 'Vous connaissez vos potes', c: WHITE },
      { t: 'bien moins que', c: WHITE },
      { t: 'vous ne le pensez...', c: WHITE },
      { t: 'Et ça va se boire !', c: YELLOW },
    ],
  },
];

for (const f of new Set(PUBS.flatMap((p) => p.screens))) {
  if (!existsSync(join(SRC, f))) {
    console.error(
      `Capture manquante : ${f}\nLance d'abord le serveur dev (npm run dev) puis : node scripts/shoot-carousel.mjs et node scripts/shoot-pub.mjs`
    );
    process.exit(1);
  }
}

const fontBuf = readFileSync(join(root, 'scripts', 'fonts', 'Anton-Regular.ttf'));
const font = opentype.parse(
  fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength)
);

// Serialisation MAISON du path : opentype.js toPathData() glisse des NaN a
// certaines tailles fractionnaires (vu sur SNAPTAPPARTY.COM taille 75.13) →
// librsvg s'arrete net au NaN et le texte est tronque.
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

// Capture telephone : cadre noir arrondi + ombre, inclinee, rognee en bas
// par la zone texte (les tels "sortent du cadre" comme un objet pose).
function phone(file, cx, cy, h, tilt) {
  const ratio = 1080 / 2012;
  const w = h * ratio;
  const b64 = readFileSync(join(SRC, file)).toString('base64');
  const bx = cx - w / 2;
  const by = cy - h / 2;
  const r = w * 0.09;
  return `<g transform="rotate(${tilt} ${cx} ${cy})">
    <rect x="${bx + 18}" y="${by + 22}" width="${w + 24}" height="${h + 24}" rx="${r}" fill="${BLACK}" opacity="0.55"/>
    <rect x="${bx - 12}" y="${by - 12}" width="${w + 24}" height="${h + 24}" rx="${r}" fill="#0c0c10"/>
    <image x="${bx}" y="${by}" width="${w}" height="${h}" href="data:image/png;base64,${b64}"/>
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
    <rect x="${bx + 13}" y="${by + 13}" width="${bw}" height="${bh}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${PINK}" stroke="${BLACK}" stroke-width="14"/>
    ${textAt('TAP', tapSize, S / 2, 350, WHITE)}
  </g>`;
}

// Lumieres chaudes en fond (guirlande de bar) : halos en degrade radial,
// pas de filtre de flou (rendu librsvg plus sur).
function bokeh() {
  const spots = [
    [120, 130, 90, 0.5], [340, 70, 55, 0.35], [620, 120, 70, 0.45],
    [860, 60, 100, 0.5], [1010, 200, 60, 0.35], [60, 330, 50, 0.3],
    [980, 420, 45, 0.28], [230, 220, 40, 0.3], [760, 260, 45, 0.3],
  ];
  return spots
    .map(
      ([x, y, r, o], i) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#glow)" opacity="${o}"/>
         <circle cx="${x}" cy="${y}" r="${Math.max(6, r * 0.13)}" fill="#ffd98a" opacity="${Math.min(0.9, o + 0.3)}"/>`
    )
    .join('\n');
}

async function render(pub) {
  const TEXT_TOP = 800; // la scene occupe le haut, la phrase le bas
  const MAX_TEXT_W = 950;
  const LINE_GAP = 1.16;

  // taille commune : la ligne la plus large tient dans MAX_TEXT_W,
  // et le bloc tient dans la zone basse.
  let size = Infinity;
  for (const ln of pub.lines) {
    size = Math.min(size, (MAX_TEXT_W * 100) / widthOf(ln.t, 100));
  }
  size = Math.min(size, (H - 60 - TEXT_TOP - 90) / (pub.lines.length * LINE_GAP));

  let texts = '';
  pub.lines.forEach((ln, i) => {
    const y = TEXT_TOP + 40 + (i + 0.5) * size * LINE_GAP;
    texts += textAt(ln.t, size, W / 2, y, ln.c);
  });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a1c10"/>
      <stop offset="0.45" stop-color="#1b120b"/>
      <stop offset="1" stop-color="#0a0806"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0" stop-color="#ffc966" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ffc966" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BLACK}" stop-opacity="0"/>
      <stop offset="1" stop-color="${BLACK}" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#night)"/>
  ${bokeh()}
  <ellipse cx="${W / 2}" cy="905" rx="720" ry="190" fill="#3a2413" opacity="0.55"/>
  ${phone(pub.screens[0], W / 2 - 300, 520, 700, -8)}
  ${phone(pub.screens[1], W / 2 + 300, 530, 700, 8)}
  ${phone(pub.screens[2], W / 2, 480, 780, -1.5)}
  <rect x="0" y="${TEXT_TOP - 160}" width="${W}" height="${H - TEXT_TOP + 160}" fill="url(#fade)"/>
  ${texts}
  ${textAt(pub.footer, 34, W / 2, H - 46, '#cfcfd6')}
  <g transform="translate(30 26) scale(0.26)">${logoGroup()}</g>
</svg>`;

  await sharp(Buffer.from(svg), { density: 300 })
    .resize(W, H)
    .png()
    .toFile(join(OUT, `pub-${pub.slug}-1080x1350.png`));
  console.log(`✓ promo/pub/pub-${pub.slug}-1080x1350.png`);
}

// ---- Slide CTA de cloture : logo + ou trouver le jeu (Android + web
// seulement — pas d'App Store pour l'instant).
function box(text, textTargetW, cx, cy, bg, tilt, fg = BLACK) {
  const size = (textTargetW * 100) / widthOf(text, 100);
  const w = widthOf(text, size);
  const padX = size * 0.42;
  const padY = size * 0.3;
  const bx = cx - w / 2 - padX;
  const by = cy - size / 2 - padY;
  const bw = w + padX * 2;
  const bh = size + padY * 2;
  const stroke = Math.max(6, Math.round(size * 0.12));
  const shadow = Math.max(8, Math.round(size * 0.14));
  return `<g transform="rotate(${tilt} ${cx} ${cy})">
    <rect x="${bx + shadow}" y="${by + shadow}" width="${bw}" height="${bh}" fill="${BLACK}"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${bg}" stroke="${BLACK}" stroke-width="${stroke}"/>
    ${textAt(text, size, cx, cy, fg)}
  </g>`;
}

// Badge "Play Store" : boite noire + triangle Play multicolore + texte,
// dans l'esprit du badge officiel "Disponible sur Google Play".
function playBadge(cx, cy) {
  const bw = 640;
  const bh = 150;
  const bx = cx - bw / 2;
  const by = cy - bh / 2;
  // Triangle Play : bleu a gauche, vert en haut, rouge en bas, jaune a la
  // pointe (construction par rubans croises, version plate).
  const tx = bx + 52;
  const ty = cy - 45;
  const tri = `<g transform="translate(${tx} ${ty})">
    <polygon points="0,0 43.2,45 0,90" fill="#00C3FF"/>
    <polygon points="0,0 59.4,34.6 43.2,45" fill="#00E370"/>
    <polygon points="0,90 59.4,55.4 43.2,45" fill="#FF3A44"/>
    <polygon points="43.2,45 59.4,34.6 77.4,45 59.4,55.4" fill="#FFCE00"/>
  </g>`;
  return `<g transform="rotate(-2 ${cx} ${cy})">
    <rect x="${bx + 14}" y="${by + 14}" width="${bw}" height="${bh}" fill="#000" opacity="0.6"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${BLACK}" stroke="${WHITE}" stroke-width="8"/>
    ${tri}
    ${textAt('PLAY STORE', 74, cx + 55, cy, WHITE)}
  </g>`;
}

async function renderCta() {
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a1c10"/>
      <stop offset="0.45" stop-color="#1b120b"/>
      <stop offset="1" stop-color="#0a0806"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0" stop-color="#ffc966" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ffc966" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#night)"/>
  ${bokeh()}
  <g transform="translate(${W / 2 - 256 * 1.15} 120) scale(1.15)">${logoGroup()}</g>
  ${textAt('DISPO SUR LE', 54, W / 2, 762, WHITE)}
  ${playBadge(W / 2, 902)}
  ${textAt('SUR IPHONE, ÇA SE JOUE VIA LE SITE :', 42, W / 2, 1046, WHITE)}
  ${box('SNAPTAPPARTY.COM', 560, W / 2, 1168, PINK, 1.5, WHITE)}
  ${textAt('GRATUIT · SANS COMPTE · 3 À 16 JOUEURS', 34, W / 2, H - 46, '#cfcfd6')}
</svg>`;
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(W, H)
    .png()
    .toFile(join(OUT, 'pub-cta-1080x1350.png'));
  console.log('✓ promo/pub/pub-cta-1080x1350.png');
}

for (const pub of PUBS) await render(pub);
await renderCta();
console.log('Visuels pub dans store-assets/promo/pub/');
