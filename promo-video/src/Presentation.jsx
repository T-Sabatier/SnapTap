// Video de PRESENTATION Snap Tap (~27 s, 1080x1920) — rythme REELS : accroche
// en 1re seconde, phrases voix off COURTES, punch/secousses/emojis partout,
// sous-titres incrustes synchronises (voix ElevenLabs par-dessus).
//
// WORKFLOW VOIX OFF :
//   1. Le script est dans SEGMENTS ci-dessous (aussi dans VOIX-OFF.md a cote).
//   2. Genere la voix sur ElevenLabs (un clip par ligne, debit energique).
//   3. Depose le mp3 dans public/voix-off.mp3 et passe USE_VOICE a true,
//      OU monte la voix par-dessus le MP4 dans CapCut (timecodes VOIX-OFF.md).
//   4. Segment trop court/long pour l'audio : ajuste son `sec` et re-render
//      (npm run render-presentation). Les segments suivants se decalent seuls.
//
// REGLE EDITORIALE : cartes generiques, pas de coquin (tous publics), et la
// scene apero montre les REGLES A BOIRE liees aux cartes (systeme actuel).
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  Audio,
  staticFile,
} from 'remotion';
import {
  YELLOW,
  AMBER,
  PINK,
  LIKE_GREEN,
  anton,
  LEA,
  Stamp,
  Appear,
  Wiggle,
  Bounce,
  useShake,
  usePunch,
  EmojiBurst,
  EmojiRain,
  Center,
  Chip,
  GameChrome,
  BottomBar,
  ModeBanner,
  PlayButton,
  HandGrid,
  SceneReveal,
  SceneResult,
  ScenePitch,
  SceneEnd,
  Intertitle,
} from './Promo.jsx';

const FPS = 30;

// Musique de fond baissee pour laisser la place a la voix.
const USE_MUSIC = true;
const MUSIC_VOLUME = 0.2;
// Passe a true quand public/voix-off.mp3 existe (voix ElevenLabs).
const USE_VOICE = false;

// ================= SCRIPT VOIX OFF / SOUS-TITRES =================
// `sub` = ce qui est dit. `sec` = duree (ajustable). `showSub: false` quand le
// texte est deja en enorme a l'ecran (pas de doublon sous-titre).
export const SEGMENTS = [
  { key: 'hook', sec: 1.6, sub: 'Tu crois connaître tes potes ?', showSub: false },
  { key: 'prouve', sec: 1.3, sub: 'Prouve-le.', showSub: false },
  { key: 'annonce', sec: 2.3, sub: "Léa veut ce qu'elle aime." },
  { key: 'pose', sec: 2.8, sub: 'Pose la carte qui lui va le mieux.' },
  { key: 'choix', sec: 3.2, sub: "Elle choisit à l'aveugle." },
  { key: 'point', sec: 2.6, sub: "C'est ta carte ? Plus un point !" },
  { key: 'apero', sec: 1.6, sub: 'Et en mode apéro ?', showSub: false },
  { key: 'regle', sec: 3.0, sub: 'Chaque carte a sa règle à boire !' },
  { key: 'pitch', sec: 2.2, sub: 'Trois à seize joueurs. Gratuit.' },
  { key: 'fin', sec: 2.6, sub: 'Snap Tap. Lien en bio !' },
];

const frames = (s) => Math.round(s * FPS);
export const TOTAL_FRAMES = SEGMENTS.reduce((n, s) => n + frames(s.sec), 0);

// ================= ENERGIE DE MONTAGE =================

// Zoom continu + micro-derive : chaque plan est une "camera vivante".
const Zoomy = ({ children, dur }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, dur], [1.0, 1.08]);
  const rot = Math.sin(frame / 11) * 0.5;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale.toFixed(4)}) rotate(${rot.toFixed(2)}deg)` }}>
      {children}
    </AbsoluteFill>
  );
};

// Flash blanc sur la coupe (2-3 frames) : rythme de montage nerveux.
const CutFlash = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 2, 6], [0.85, 0.6, 0], {
    extrapolateRight: 'clamp',
  });
  if (frame > 6) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: '#fff', opacity, zIndex: 60, pointerEvents: 'none' }} />
  );
};

// Secousse a l'entree de chaque plan (impact de coupe).
const CutShake = ({ children }) => {
  const shake = useShake(1, 9, 10);
  return <AbsoluteFill style={{ transform: `translate(0,0)${shake}` }}>{children}</AbsoluteFill>;
};

// ================= SOUS-TITRE INCRUSTE (slam) =================

const Subtitle = ({ text, tilt = -1.5 }) => (
  <div
    style={{
      position: 'absolute',
      left: 40,
      right: 40,
      bottom: 130,
      zIndex: 40,
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    <Stamp from={3.2}>
      <Wiggle amp={2.2} speed={7}>
        <div
          style={{
            ...anton,
            backgroundColor: '#000',
            color: '#fff',
            boxShadow: '10px 10px 0 rgba(0,0,0,0.35)',
            padding: '18px 34px 26px',
            fontSize: 52,
            lineHeight: 1.1,
            textAlign: 'center',
            textTransform: 'none',
            transform: `rotate(${tilt}deg)`,
          }}
        >
          {text}
        </div>
      </Wiggle>
    </Stamp>
  </div>
);

// ================= SCENES =================

// Accroche noire, plein ecran, slam.
const SceneHook = () => (
  <Intertitle lines={['TU CROIS CONNAÎTRE', 'TES POTES ?']} emoji="🤨" />
);

// "Prouve-le." + mini logo : flash rapide.
const SceneProuve = () => {
  const shake = useShake(4, 10, 14);
  return (
    <AbsoluteFill style={{ backgroundColor: YELLOW, transform: `scale(1)${shake}` }}>
      <Center>
        <Stamp from={3.4}>
          <Wiggle amp={2.4} speed={7}>
            <Chip text="PROUVE-LE." bg="#000" color={YELLOW} tilt={-2} fontSize={110} />
          </Wiggle>
        </Stamp>
        <div style={{ height: 60 }} />
        <Stamp delay={8} from={2.6}>
          <Wiggle amp={2} speed={9} phase={2}>
            <div
              style={{
                ...anton,
                fontSize: 64,
                lineHeight: 1,
                color: '#fff',
                backgroundColor: PINK,
                border: '8px solid #000',
                boxShadow: '10px 10px 0 #000',
                padding: '8px 34px 14px',
                transform: 'rotate(2deg)',
              }}
            >
              SNAP TAP
            </div>
          </Wiggle>
        </Stamp>
      </Center>
    </AbsoluteFill>
  );
};

// Annonce : le bandeau claque, secousse, burst de coeurs.
const SceneAnnonce = () => {
  const punch = usePunch();
  const shake = useShake(6, 12, 16);
  return (
    <AbsoluteFill style={{ backgroundColor: YELLOW, transform: punch + shake }}>
      <GameChrome right="MANCHE 3" />
      <EmojiBurst emojis={['💚', '❤️']} delay={8} x="50%" y="42%" count={10} />
      <Center style={{ paddingTop: 120 }}>
        <Stamp from={3}>
          <Wiggle amp={2.2} speed={8}>
            <ModeBanner name="LÉA" color={LEA} like />
          </Wiggle>
        </Stamp>
      </Center>
    </AbsoluteFill>
  );
};

// Pose : main de cartes, tap rapide, bouton presse.
const ScenePose = () => {
  const frame = useCurrentFrame();
  const TAP = 30;
  const PRESS = 62;
  const punch = usePunch();
  const shake = useShake(TAP + 4, 10, 12);
  return (
    <AbsoluteFill style={{ backgroundColor: YELLOW, transform: punch + shake }}>
      <GameChrome right="0/4 POSÉ" />
      <Center style={{ paddingTop: 175, paddingBottom: 260 }}>
        <Appear delay={0}>
          <Wiggle amp={1.8} speed={9}>
            <ModeBanner name="LÉA" color={LEA} like />
          </Wiggle>
        </Appear>
        <div style={{ height: 38 }} />
        <HandGrid selectedIdx={3} tapAt={TAP} />
      </Center>
      <BottomBar>
        <PlayButton
          label={frame >= TAP + 4 ? 'JOUER CETTE CARTE ▸' : 'CHOISIS UNE CARTE'}
          pressed={frame >= PRESS}
        />
      </BottomBar>
    </AbsoluteFill>
  );
};

// Regle apero : la carte declenche SA regle a boire, pluie de bieres.
const SceneRegleApero = () => {
  const punch = usePunch();
  const shake = useShake(20, 12, 14);
  return (
    <AbsoluteFill style={{ backgroundColor: AMBER, transform: punch + shake }}>
      <GameChrome right="🍻 APÉRO" bg={AMBER} />
      <EmojiRain emoji="🍺" delay={18} count={12} />
      <Center style={{ paddingTop: 170 }}>
        <Stamp from={1.8}>
          <Wiggle amp={1.8} speed={9}>
            <div
              style={{
                ...anton,
                width: 720,
                backgroundColor: '#000',
                color: YELLOW,
                boxShadow: '16px 16px 0 #000',
                transform: 'rotate(-2deg)',
                padding: '54px 46px',
                fontSize: 80,
                lineHeight: 0.95,
                textAlign: 'center',
              }}
            >
              PIZZA ANANAS
            </div>
          </Wiggle>
        </Stamp>
        <div style={{ height: 50 }} />
        {/* Le VRAI gage de la carte (deck live, cf GAGES.md). */}
        <Stamp delay={18} from={2.8}>
          <Wiggle amp={2.4} speed={7}>
            <div
              style={{
                ...anton,
                width: 800,
                backgroundColor: PINK,
                color: '#fff',
                border: '8px solid #000',
                boxShadow: '11px 11px 0 #000',
                transform: 'rotate(2deg)',
                padding: '30px 34px 40px',
                fontSize: 58,
                lineHeight: 1.05,
                textAlign: 'center',
              }}
            >
              LES DÉFENSEURS DE L'ANANAS BOIVENT 2, FIÈREMENT
            </div>
          </Wiggle>
        </Stamp>
        <div style={{ height: 45 }} />
        <Appear delay={48}>
          <Bounce delay={48} amp={9} speed={7}>
            <div
              style={{
                ...anton,
                fontSize: 40,
                textAlign: 'center',
                color: LIKE_GREEN,
                WebkitTextStroke: '2px #000',
                paintOrder: 'stroke fill',
              }}
            >
              LE GAGNANT NE BOIT JAMAIS 😎
            </div>
          </Bounce>
        </Appear>
      </Center>
    </AbsoluteFill>
  );
};

// ================= COMPOSITION =================

const SCENE_BY_KEY = {
  hook: () => <SceneHook />,
  prouve: () => <SceneProuve />,
  annonce: () => <SceneAnnonce />,
  pose: () => <ScenePose />,
  choix: () => <SceneReveal />,
  point: () => <SceneResult />,
  apero: () => <Intertitle lines={['ET EN', 'MODE APÉRO ?']} emoji="🍻" />,
  regle: () => <SceneRegleApero />,
  pitch: () => <ScenePitch />,
  fin: () => <SceneEnd />,
};

export const Presentation = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: YELLOW }}>
      {USE_MUSIC && (
        <Audio
          src={staticFile('Sunlit Loop.mp3')}
          volume={(f) =>
            MUSIC_VOLUME *
            interpolate(f, [TOTAL_FRAMES - 50, TOTAL_FRAMES - 8], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      )}
      {USE_VOICE && <Audio src={staticFile('voix-off.mp3')} />}
      {SEGMENTS.map((seg, i) => {
        const dur = frames(seg.sec);
        const from = cursor;
        cursor += dur;
        return (
          <Sequence key={seg.key} from={from} durationInFrames={dur}>
            <CutShake>
              <Zoomy dur={dur}>{SCENE_BY_KEY[seg.key](dur)}</Zoomy>
            </CutShake>
            {seg.showSub !== false && (
              <Subtitle text={seg.sub} tilt={i % 2 === 0 ? -1.5 : 1.5} />
            )}
            <CutFlash />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
