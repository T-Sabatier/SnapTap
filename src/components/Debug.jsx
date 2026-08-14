import { useState, useEffect, useRef } from 'react';
import { ref, set, onValue, remove } from 'firebase/database';
import { db } from '../firebase';
import { useLang } from '../i18n.jsx';
import Home from './Home.jsx';
import Lobby from './Lobby.jsx';
import Game from './Game.jsx';

// ============================================================
// MODE DEBUG (dev only) — visualiser chaque ecran sans monter
// une vraie partie. Le debug cree une VRAIE room "DEBG" dans
// Firebase et s'y abonne → tous les sorts (reroll, x2, charges)
// fonctionnent pour de vrai, en solo. La room est re-seedee a
// chaque changement de scenario et supprimee en quittant.
// ============================================================

const POOL = {
  // g = regle a boire (Mode Apero). c1 = collective, c3 = defi (@).
  c1: { t: 'Dua Lipa', cat: 'musique', spicy: false, g: "Ceux qui l'ont dans une playlist boivent 2" },
  c2: { t: 'Tokyo', cat: 'voyages', spicy: false },
  c3: { t: 'Guêpe à l\'apéro', cat: 'nature', spicy: false, g: '@Chasse une guêpe imaginaire ou bois 2' },
  c4: { t: 'Raclette', cat: 'bouffe', spicy: false },
  c5: { t: 'Pizza ananas', cat: 'bouffe', spicy: false, g: 'Team ananas boit 1, les puristes boivent 2' },
  c6: { t: 'Appeler ton ex', cat: 'bourre', spicy: false },
  c7: { t: 'Chaussettes-claquettes', cat: 'mode', spicy: false },
  c8: { t: 'Sushis', cat: 'bouffe', spicy: false },
  c9: { t: 'New York', cat: 'voyages', spicy: false },
  c10: { t: 'Messi', cat: 'sport', spicy: false },
  c11: { t: 'Tacos', cat: 'bouffe', spicy: false },
  c12: { t: 'Zelda', cat: 'gaming', spicy: false },
  c13: { t: 'Plage déserte', cat: 'voyages', spicy: false },
  c14: { t: 'Café noir', cat: 'bouffe', spicy: false },
  c15: { t: 'Basket', cat: 'sport', spicy: false },
  c16: { t: 'Bali', cat: 'voyages', spicy: false },
  c17: { t: 'Burger', cat: 'bouffe', spicy: false },
  c18: { t: 'Tennis', cat: 'sport', spicy: false },
  c19: { t: 'Glace choco', cat: 'bouffe', spicy: false },
  c20: { t: 'Islande', cat: 'voyages', spicy: false },
};

const MY_HAND = { c1: true, c2: true, c3: true, c4: true, c5: true, c6: true, c7: true };
const MY_HAND_AFTER_PLAY = { c2: true, c3: true, c4: true, c6: true, c7: true };
// Pioche : cartes qui ne sont ni en main ni posees → de quoi reroller.
const DECK = ['c8', 'c9', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18'];

const PLAYERS = {
  me: { name: 'Tim', score: 2, color: 'yellow', joinedAt: 1 },
  alex: { name: 'Thor', score: 3, color: 'blue', joinedAt: 2 },
  sam: { name: 'Chloé', score: 1, color: 'green', joinedAt: 3 },
  jo: { name: 'Adi', score: 4, color: 'violet', joinedAt: 4 },
  gui: { name: 'Guillaume', score: 2, color: 'orange', joinedAt: 5 },
};

// Variantes ANGLAISES pour les captures store US/UK : cartes CHOISIES COMMUNES
// aux decks US et UK (pas dans les 59 overrides UK) → mêmes screenshots valables
// pour les deux marchés. Mêmes ids que POOL/PLAYERS.
const EN_POOL = {
  c1: { t: 'Beyoncé', cat: 'musique', spicy: false, g: 'Anyone with her in a playlist drinks 2' },
  c2: { t: 'Tokyo', cat: 'voyages', spicy: false },
  c3: { t: 'A wasp at the picnic', cat: 'nature', spicy: false, g: '@Swat an imaginary wasp or drink 2' },
  c4: { t: 'Sushi', cat: 'bouffe', spicy: false },
  c5: { t: 'Pineapple on pizza', cat: 'bouffe', spicy: false, g: 'Team pineapple drinks 1, purists drink 2' },
  c6: { t: 'Texting your ex', cat: 'bourre', spicy: false },
  c7: { t: 'Socks with sandals', cat: 'mode', spicy: false },
  c8: { t: 'Ramen', cat: 'bouffe', spicy: false },
  c9: { t: 'New York', cat: 'voyages', spicy: false },
  c10: { t: 'Messi', cat: 'sport', spicy: false },
  c11: { t: 'Tacos', cat: 'bouffe', spicy: false },
  c12: { t: 'Zelda', cat: 'gaming', spicy: false },
  c13: { t: 'A deserted beach', cat: 'voyages', spicy: false },
  c14: { t: 'Black coffee', cat: 'bouffe', spicy: false },
  c15: { t: 'Basketball', cat: 'sport', spicy: false },
  c16: { t: 'Bali', cat: 'voyages', spicy: false },
  c17: { t: 'Burger', cat: 'bouffe', spicy: false },
  c18: { t: 'Tennis', cat: 'sport', spicy: false },
  c19: { t: 'Karaoke', cat: 'musique', spicy: false },
  c20: { t: 'Iceland', cat: 'voyages', spicy: false },
};

const EN_PLAYERS = {
  me: { name: 'Tim', score: 2, color: 'yellow', joinedAt: 1 },
  alex: { name: 'Max', score: 3, color: 'blue', joinedAt: 2 },
  sam: { name: 'Chloe', score: 1, color: 'green', joinedAt: 3 },
  jo: { name: 'Ava', score: 4, color: 'violet', joinedAt: 4 },
  gui: { name: 'Will', score: 2, color: 'orange', joinedAt: 5 },
};

const SCENARIOS = [
  { key: 'home', label: 'Accueil' },
  { key: 'lobby-host', label: 'Salon · host' },
  { key: 'lobby-guest', label: 'Salon · joueur' },
  { key: 'boss_choose-boss', label: 'Annonce · boss' },
  { key: 'boss_choose-wait', label: 'Annonce · attente' },
  { key: 'play-hand', label: '⭐ Poser sa carte' },
  { key: 'play-waited', label: 'Carte posée · attente' },
  { key: 'play-boss', label: 'En jeu · boss' },
  { key: 'reveal-boss', label: 'Choix · boss' },
  { key: 'reveal-guest', label: 'Choix · joueur' },
  { key: 'result', label: 'Résultat' },
  { key: 'result-defi', label: 'Résultat · défi' },
  { key: 'game_over', label: 'Fin de partie' },
];

const noop = () => {};

function buildScenario(key, mode, pick, apero, special, sorts, pool, players, lang) {
  const base = {
    // createdAt + host OBLIGATOIRES : les regles RTDB (.validate) refusent
    // toute room sans eux → sans ca, le seed de DEBG echouait en silence et
    // tout ce qui passe par Firebase dans la demo (chrono, sorts) ecrivait
    // dans le vide. Host par defaut = alex (pas moi : les ecrans "joueur"
    // ne doivent pas avoir les pouvoirs host) ; les scenes qui ont besoin
    // que JE sois host l'ecrasent (result, game_over, lobby-host).
    createdAt: Date.now(),
    host: 'alex',
    round: 3,
    pool: pool,
    deck: DECK,
    discard: [],
    special: special || null,
    settings: {
      winningScore: 5,
      cats: {},
      sorts: sorts
        ? { reroll: true, espion: true, vatout: true }
        : { reroll: false, espion: false, vatout: false },
      ...(apero ? { partyMode: true } : {}),
      ...(lang ? { lang } : {}),
    },
    players: players,
  };
  switch (key) {
    case 'home':
      return { kind: 'home' };
    case 'lobby-host':
      return { kind: 'lobby', room: { ...base, phase: 'lobby', host: 'me' } };
    case 'lobby-guest':
      return { kind: 'lobby', room: { ...base, phase: 'lobby', host: 'alex' } };
    case 'boss_choose-boss':
      return { kind: 'game', room: { ...base, phase: 'boss_choose', bossId: 'me' } };
    case 'boss_choose-wait':
      return { kind: 'game', room: { ...base, phase: 'boss_choose', bossId: 'alex' } };
    case 'play-hand':
      return { kind: 'game', room: { ...base, phase: 'play', bossId: 'alex', mode, hands: { me: MY_HAND }, played: { sam: 'c19' } } };
    case 'play-waited':
      return { kind: 'game', room: { ...base, phase: 'play', bossId: 'alex', mode, hands: { me: MY_HAND_AFTER_PLAY }, played: { me: 'c1', sam: 'c19' } } };
    case 'play-boss':
      return { kind: 'game', room: { ...base, phase: 'play', bossId: 'me', mode, played: { sam: 'c19', jo: 'c20' } } };
    case 'reveal-boss':
      return { kind: 'game', room: { ...base, phase: 'reveal', bossId: 'me', mode, played: { alex: 'c19', sam: 'c20', jo: 'c5' }, bossPick: pick ? 'c19' : null } };
    case 'reveal-guest':
      return { kind: 'game', room: { ...base, phase: 'reveal', bossId: 'alex', mode, hands: { me: MY_HAND_AFTER_PLAY }, played: { me: 'c1', sam: 'c20', jo: 'c5' }, bossPick: pick ? 'c20' : null } };
    case 'result':
      // Gagnante = Chloe (sam) avec Pizza ananas (c5). Gagnant != boss.
      // En mode NORMAL (apero off) : defi fun collectif pour visualiser le
      // slam + l'encadre (winnerInfo.defi, comme le poserait le host).
      return { kind: 'game', room: { ...base, host: 'me', phase: 'result', bossId: 'alex', mode, played: { me: 'c1', sam: 'c5', jo: 'c20' }, winnerInfo: { playerId: 'sam', cardId: 'c5', ...(apero ? {} : { defi: { text: 'Silence total 20 secondes en se regardant : le premier qui rit fait 10 squats', targetId: null } }) } } };
    case 'result-defi':
      // Gagnante = Chloe (sam) avec un defi (c3) → roulette (hors boss/gagnant).
      // En mode NORMAL : defi fun CIBLE (roulette puis slam avec le prenom).
      return { kind: 'game', room: { ...base, host: 'me', phase: 'result', bossId: 'alex', mode, played: { me: 'c1', sam: 'c3', jo: 'c20' }, winnerInfo: { playerId: 'sam', cardId: 'c3', ...(apero ? {} : { defi: { text: 'Bataille de regard avec ton voisin de droite, le premier qui rit fait 5 pompes', targetId: 'jo' } }) } } };
    case 'game_over':
      return { kind: 'game', room: { ...base, host: 'me', phase: 'game_over', bossId: 'jo' } };
    default:
      return { kind: 'home' };
  }
}

export default function Debug() {
  const { locale } = useLang();
  const isEn = locale.startsWith('en');
  // ?safe : variante MARKETING (visuels reseaux sociaux) — aucune vraie
  // personne ni marque dans les cartes visibles (regle editoriale : opinion
  // dans le jeu OK, exploitation d'image en pub NON), et le boss s'appelle
  // Lea comme dans la video promo.
  const safeMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('safe');
  // POOL/joueurs anglais quand l'UI est en anglais (captures store US/UK).
  const basePool = isEn ? EN_POOL : POOL;
  const basePlayers = isEn ? EN_PLAYERS : PLAYERS;
  const POOL_ACTIVE = safeMode
    ? {
        ...basePool,
        c1: { t: 'Kebab à 3h du mat', cat: 'bouffe', spicy: false, g: 'Ceux qui ont déjà craqué boivent 2' },
        c10: { t: 'Marathon', cat: 'sport', spicy: false },
        c12: { t: 'Karaoké', cat: 'musique', spicy: false },
      }
    : basePool;
  const PLAYERS_ACTIVE = safeMode
    ? { ...basePlayers, alex: { ...basePlayers.alex, name: 'Léa' } }
    : basePlayers;
  const langArg = isEn ? locale : undefined; // charge categories_en / _en_gb dans le lobby

  // Pilotage par URL (pour capture headless) : ?debug&scene=<key>&cap=1
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const sceneParam = params.get('scene');
  const capParam = params.has('cap');

  const [key, setKey] = useState(
    sceneParam && SCENARIOS.some((s) => s.key === sceneParam) ? sceneParam : 'play-hand'
  );
  const [mode, setMode] = useState('like');
  const [pick, setPick] = useState(false);
  const [apero, setApero] = useState(params.has('apero'));
  const [special, setSpecial] = useState(
    ['double', 'chrono', 'swap'].includes(params.get('special')) ? params.get('special') : null
  ); // null | 'double' | 'chrono' | 'swap'
  const [sorts, setSorts] = useState(true);
  const [capturing, setCapturing] = useState(false); // masque la barre pour screener
  const [liveRoom, setLiveRoom] = useState(null);

  const scenario = buildScenario(key, mode, pick, apero, special, sorts, POOL_ACTIVE, PLAYERS_ACTIVE, langArg);
  const SPECIAL_CYCLE = [null, 'double', 'chrono', 'swap'];

  // Abonnement permanent a la room debug
  useEffect(() => {
    const r = ref(db, 'rooms/DEBG');
    const unsub = onValue(r, (snap) => {
      if (drawSwapped.current) return; // simulation de pioche en cours
      setLiveRoom(snap.val());
    });
    return () => {
      unsub();
      remove(r).catch(() => {});
    };
  }, []);

  // Simulation de PIOCHE (?draw=1, scene play-hand) : ~2s apres l'affichage
  // de la main, on passe a la manche suivante avec c1 jouee et c8 piochee.
  // Exerce le VRAI code de Game (diff main N vs N+1 → animation .card-draw
  // sur la carte neuve), sans monter une partie a 3.
  const drawParam = params.has('draw');
  // Une fois le swap fait, on ignore les snapshots Firebase (une room DEBG
  // d'une session precedente ecraserait la simulation).
  const drawSwapped = useRef(false);
  useEffect(() => {
    if (!drawParam || key !== 'play-hand') return undefined;
    const t = setTimeout(() => {
      drawSwapped.current = true;
      setLiveRoom((cur) => {
        const r = cur || scenario.room;
        const next = {
          ...r,
          round: (r.round || 3) + 1,
          hands: { me: { ...MY_HAND_AFTER_PLAY, c8: true } },
          played: null,
        };
        set(ref(db, 'rooms/DEBG'), next).catch(() => {});
        return next;
      });
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawParam, key]);

  // (Re)seed la room a chaque changement de scenario / mode / choix boss / options
  useEffect(() => {
    const sc = buildScenario(key, mode, pick, apero, special, sorts, POOL_ACTIVE, PLAYERS_ACTIVE, langArg);
    if (sc.kind === 'home') {
      setLiveRoom(null);
      remove(ref(db, 'rooms/DEBG')).catch(() => {});
      return;
    }
    // ?chrono=1 : chrono deja lance (demo/capture du modal plein ecran).
    if (params.has('chrono') && sc.room) {
      sc.room.chrono = { start: Date.now(), secs: 20 };
    }
    setLiveRoom(sc.room); // optimiste, evite le flash
    set(ref(db, 'rooms/DEBG'), sc.room).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, mode, pick, apero, special, sorts, isEn]);

  function renderScreen() {
    if (scenario.kind === 'home') {
      return <Home playerId="me" onJoin={noop} hideDevLink />;
    }
    const room = liveRoom || scenario.room;
    if (scenario.kind === 'lobby') {
      return <Lobby room={room} roomCode="DEBG" playerId="me" onLeave={noop} />;
    }
    return <Game room={room} roomCode="DEBG" playerId="me" onLeave={noop} />;
  }

  const isGamePhase = !['home', 'lobby-host', 'lobby-guest'].includes(key);
  const isReveal = key.startsWith('reveal');

  // Mode capture : la barre disparait 5 s pour un screenshot propre.
  function startCapture() {
    setCapturing(true);
    setTimeout(() => setCapturing(false), 5000);
  }

  // Pendant la capture : uniquement l'ecran, plein, sans rien de debug.
  // ?cap=1 dans l'URL → mode capture permanent (pilotage headless).
  if (capturing || capParam) {
    return <div>{renderScreen()}</div>;
  }

  return (
    <div>
      {/* Barre de controle debug — fixe en haut */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-black text-white border-b-4 border-white">
        <div className="flex items-center gap-2 px-2 py-1.5 overflow-x-auto">
          <a
            href="/"
            className="shrink-0 px-2 py-1 border-2 border-white text-[11px] uppercase"
            style={{ fontFamily: '"Space Mono", monospace' }}
            title="Quitter le debug"
          >
            ✕
          </a>
          <span
            style={{ fontFamily: '"Anton", sans-serif' }}
            className="text-sm uppercase text-yellow-300 shrink-0"
          >
            🐛 Debug
          </span>
          <button
            onClick={startCapture}
            className="shrink-0 px-2 py-1 border-2 border-yellow-300 text-yellow-300 text-[11px] uppercase"
            style={{ fontFamily: '"Space Mono", monospace' }}
            title="Masque la barre 5 s pour screenshoter"
          >
            📷 Capturer
          </button>
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => setKey(s.key)}
              className="shrink-0 px-2 py-1 border-2 text-[11px] uppercase whitespace-nowrap"
              style={{
                fontFamily: '"Space Mono", monospace',
                backgroundColor: key === s.key ? '#FFE600' : 'transparent',
                color: key === s.key ? '#000' : '#FFF',
                borderColor: key === s.key ? '#FFE600' : '#555',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {isGamePhase && (
          <div className="flex items-center gap-2 px-2 pb-1.5 overflow-x-auto">
            <button
              onClick={() => setMode(mode === 'like' ? 'dislike' : 'like')}
              className="shrink-0 px-2 py-1 border-2 border-white text-[11px] uppercase"
              style={{ fontFamily: '"Space Mono", monospace' }}
            >
              Mode : {mode === 'like' ? "J'aime" : "J'aime pas"}
            </button>
            <button
              onClick={() => setApero((a) => !a)}
              className="shrink-0 px-2 py-1 border-2 text-[11px] uppercase"
              style={{
                fontFamily: '"Space Mono", monospace',
                backgroundColor: apero ? '#FBB417' : 'transparent',
                color: apero ? '#000' : '#FFF',
                borderColor: apero ? '#FBB417' : '#FFF',
              }}
            >
              🍻 Apéro : {apero ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() =>
                setSpecial(
                  SPECIAL_CYCLE[(SPECIAL_CYCLE.indexOf(special) + 1) % SPECIAL_CYCLE.length]
                )
              }
              className="shrink-0 px-2 py-1 border-2 text-[11px] uppercase"
              style={{
                fontFamily: '"Space Mono", monospace',
                backgroundColor: special ? '#FFE600' : 'transparent',
                color: special ? '#000' : '#FFF',
                borderColor: special ? '#FFE600' : '#FFF',
              }}
            >
              ⚡ Spécial : {special || 'off'}
            </button>
            <button
              onClick={() => setSorts((s) => !s)}
              className="shrink-0 px-2 py-1 border-2 text-[11px] uppercase"
              style={{
                fontFamily: '"Space Mono", monospace',
                backgroundColor: sorts ? '#FFF' : 'transparent',
                color: sorts ? '#000' : '#FFF',
                borderColor: '#FFF',
              }}
            >
              Sorts : {sorts ? 'ON' : 'OFF'}
            </button>
            {isReveal && (
              <button
                onClick={() => setPick(!pick)}
                className="shrink-0 px-2 py-1 border-2 text-[11px] uppercase"
                style={{
                  fontFamily: '"Space Mono", monospace',
                  backgroundColor: pick ? '#FF2D6F' : 'transparent',
                  borderColor: pick ? '#FF2D6F' : '#FFF',
                }}
              >
                Choix boss : {pick ? 'oui' : 'non'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Ecran rendu, decale sous la barre */}
      <div style={{ paddingTop: isGamePhase ? '5.5rem' : '3rem' }}>
        {renderScreen()}
      </div>
    </div>
  );
}
