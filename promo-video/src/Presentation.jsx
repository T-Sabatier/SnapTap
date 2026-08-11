// Video de PRESENTATION Snap Tap (~43 s, 1080x1920) — explique le jeu posement,
// SOUS-TITRES incrustes synchronises sur un script voix off (ElevenLabs).
//
// WORKFLOW VOIX OFF :
//   1. Le script est dans SEGMENTS ci-dessous (aussi dans VOIX-OFF.md a cote).
//   2. Genere la voix sur ElevenLabs (une piste par segment, ou une lecture
//      complete du script).
//   3. Depose le mp3 dans public/voix-off.mp3 et passe USE_VOICE a true,
//      OU monte la voix par-dessus le MP4 dans CapCut (les sous-titres et les
//      timecodes de VOIX-OFF.md servent de guide).
//   4. Si un segment est trop court/long pour l'audio : ajuste son `sec`
//      ci-dessous et re-render (npm run render-presentation).
//
// REGLE EDITORIALE : cartes generiques, pas de coquin (tous publics), et la
// scene apero montre les REGLES A BOIRE liees aux cartes (le systeme actuel),
// pas l'ancienne mise de gorgees.
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
  EmojiRain,
  Center,
  Chip,
  GameChrome,
  BottomBar,
  ModeBanner,
  PlayButton,
  HandGrid,
  SceneLogo,
  SceneReveal,
  SceneResult,
  ScenePitch,
  SceneEnd,
  Intertitle,
} from './Promo.jsx';

const FPS = 30;

// Musique de fond baissee pour laisser la place a la voix.
const USE_MUSIC = true;
const MUSIC_VOLUME = 0.16;
// Passe a true quand public/voix-off.mp3 existe (voix ElevenLabs).
const USE_VOICE = false;

// ================= SCRIPT VOIX OFF / SOUS-TITRES =================
// `sub` = ce qui est dit ET affiche. `sec` = duree du segment (ajustable).
export const SEGMENTS = [
  { key: 'logo', sec: 4.5, sub: "Snap Tap, c'est le jeu qui teste si tes potes te connaissent vraiment." },
  { key: 'annonce', sec: 5.0, sub: "À chaque manche, un joueur annonce s'il veut ce qu'il aime… ou ce qu'il déteste." },
  { key: 'pose', sec: 4.5, sub: 'Les autres posent la carte qui lui correspond le mieux.' },
  { key: 'choix', sec: 4.5, sub: 'Elle choisit sa préférée, sans savoir qui a posé quoi.' },
  { key: 'point', sec: 3.5, sub: "Si c'est ta carte : plus un point." },
  { key: 'but', sec: 3.0, sub: 'Premier à cinq points, victoire.' },
  { key: 'apero', sec: 3.5, sub: 'Et pour pimenter la soirée : le mode apéro.' },
  { key: 'regle', sec: 5.0, sub: 'Chaque carte déclenche sa règle à boire. Et le gagnant, lui, ne boit jamais.' },
  { key: 'pitch', sec: 4.5, sub: 'De 3 à 16 joueurs, chacun sur son téléphone. Gratuit, sans compte.' },
  { key: 'fin', sec: 5.0, sub: 'Snap Tap, sur le Play Store et sur snaptapparty.com.' },
];

const frames = (s) => Math.round(s * FPS);
export const TOTAL_FRAMES = SEGMENTS.reduce((n, s) => n + frames(s.sec), 0);

// ================= SOUS-TITRE INCRUSTE =================

const Subtitle = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [0, 6], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 50,
        right: 50,
        bottom: 120,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          ...anton,
          backgroundColor: 'rgba(0,0,0,0.92)',
          color: '#fff',
          border: '5px solid #000',
          boxShadow: `8px 8px 0 rgba(0,0,0,0.35)`,
          padding: '20px 34px 28px',
          fontSize: 46,
          lineHeight: 1.14,
          textAlign: 'center',
          textTransform: 'none',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ================= SCENES SPECIFIQUES =================

// Annonce : le bandeau J'AIME, puis bascule J'AIME PAS a mi-segment.
const SceneAnnonce = ({ dur }) => {
  const frame = useCurrentFrame();
  const swap = frame >= dur / 2;
  return (
    <AbsoluteFill style={{ backgroundColor: YELLOW }}>
      <GameChrome right="MANCHE 3" />
      <Center style={{ paddingTop: 120 }}>
        <Stamp from={2}>
          <Wiggle amp={1.8} speed={9}>
            <ModeBanner name="LÉA" color={LEA} like={!swap} />
          </Wiggle>
        </Stamp>
        <div style={{ height: 60 }} />
        <Appear delay={10}>
          <div style={{ ...anton, fontSize: 44, opacity: 0.65, textAlign: 'center' }}>
            ELLE ANNONCE LA COULEUR
          </div>
        </Appear>
      </Center>
    </AbsoluteFill>
  );
};

// Pose : la main de cartes, tap, bouton jouer (rythme adapte au segment).
const ScenePose = () => {
  const frame = useCurrentFrame();
  const TAP = 50;
  const PRESS = 95;
  return (
    <AbsoluteFill style={{ backgroundColor: YELLOW }}>
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

// But : premier a 5 points.
const SceneBut = () => (
  <AbsoluteFill style={{ backgroundColor: YELLOW }}>
    <Center>
      <Stamp from={2.6}>
        <Bounce amp={12} speed={9}>
          <Chip text="PREMIER À 5 POINTS" bg="#000" color={YELLOW} tilt={-2} fontSize={84} />
        </Bounce>
      </Stamp>
      <div style={{ height: 70 }} />
      <Stamp delay={14} from={3}>
        <Wiggle amp={6} speed={6}>
          <div style={{ fontSize: 170, lineHeight: 1 }}>🏆</div>
        </Wiggle>
      </Stamp>
    </Center>
  </AbsoluteFill>
);

// Regle apero : la carte choisie declenche SA regle a boire (systeme actuel).
const SceneRegleApero = () => (
  <AbsoluteFill style={{ backgroundColor: AMBER }}>
    <GameChrome right="🍻 APÉRO" bg={AMBER} />
    <EmojiRain emoji="🍺" delay={40} count={8} />
    <Center style={{ paddingTop: 170 }}>
      <Appear delay={0}>
        <div style={{ ...anton, fontSize: 36, opacity: 0.6, textAlign: 'center' }}>
          CARTE CHOISIE
        </div>
      </Appear>
      <div style={{ height: 24 }} />
      <Stamp delay={4} from={1.6}>
        <Wiggle amp={1.6} speed={10}>
          <div
            style={{
              ...anton,
              width: 720,
              backgroundColor: '#000',
              color: YELLOW,
              boxShadow: '16px 16px 0 #000',
              transform: 'rotate(-2deg)',
              padding: '58px 46px',
              fontSize: 80,
              lineHeight: 0.95,
              textAlign: 'center',
            }}
          >
            PIZZA ANANAS
          </div>
        </Wiggle>
      </Stamp>
      <div style={{ height: 60 }} />
      <Stamp delay={28} from={2.6}>
        <Wiggle amp={2.4} speed={8}>
          <Chip text="TEAM ANANAS BOIT 1" bg={PINK} tilt={2} fontSize={62} />
        </Wiggle>
      </Stamp>
      <div style={{ height: 30 }} />
      <Stamp delay={44} from={2.6}>
        <Wiggle amp={2.4} speed={8} phase={2}>
          <Chip text="LES PURISTES BOIVENT 2" bg="#fff" color="#000" tilt={-2} fontSize={56} />
        </Wiggle>
      </Stamp>
      <div style={{ height: 55 }} />
      <Appear delay={70}>
        <Bounce delay={70} amp={8} speed={8}>
          <div style={{ ...anton, fontSize: 40, textAlign: 'center', color: LIKE_GREEN, WebkitTextStroke: '2px #000', paintOrder: 'stroke fill' }}>
            LE GAGNANT NE BOIT JAMAIS 😎
          </div>
        </Bounce>
      </Appear>
    </Center>
  </AbsoluteFill>
);

// ================= COMPOSITION =================

const SCENE_BY_KEY = {
  logo: () => <SceneLogo />,
  annonce: (dur) => <SceneAnnonce dur={dur} />,
  pose: () => <ScenePose />,
  choix: () => <SceneReveal />,
  point: () => <SceneResult />,
  but: () => <SceneBut />,
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
            interpolate(f, [TOTAL_FRAMES - 60, TOTAL_FRAMES - 10], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      )}
      {USE_VOICE && <Audio src={staticFile('voix-off.mp3')} />}
      {SEGMENTS.map((seg) => {
        const dur = frames(seg.sec);
        const from = cursor;
        cursor += dur;
        return (
          <Sequence key={seg.key} from={from} durationInFrames={dur}>
            {SCENE_BY_KEY[seg.key](dur)}
            <Subtitle text={seg.sub} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
