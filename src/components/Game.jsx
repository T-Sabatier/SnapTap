import { useState, useEffect, useMemo, useRef } from 'react';
import { ref, update, runTransaction, remove, set, push } from 'firebase/database';
import { db } from '../firebase';
import {
  shuffle,
  seededShuffle,
  toArray,
  fitCard,
  fitBig,
  NAME_STYLE,
} from '../utils';
import {
  WINNING_SCORE,
  HAND_SIZE,
  YELLOW,
  AMBER,
  PINK,
  LIKE_GREEN,
  DISLIKE_RED,
  CATEGORIES,
  colorHex,
  colorFg,
} from '../cards';
import { useT } from '../i18n.jsx';
import { bumpStats } from '../stats';

const CAT_EMOJI = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.emoji])
);
function catEmojiOf(card) {
  return CAT_EMOJI[card?.cat] || '';
}

// Mode Apero — regles a boire GENERIQUES, utilisees quand la carte choisie
// n'a pas de regle dediee (champ g pose via l'admin/deck-tool). Le tirage est
// DETERMINISTE (hash cardId + manche) : meme regle affichee chez tous.
const GENERIC_GAGES = {
  fr: [
    'Le gagnant distribue 3 gorgées',
    'Tout le monde trinque, le dernier à reposer son verre boit 2',
    "Ceux qui n'ont pas encore marqué de point boivent 2",
    'Les voisins du gagnant boivent 2',
    "Le gagnant choisit quelqu'un : il boit 3",
    'Vote : le plus susceptible de finir sous la table boit 2',
    'Le plus jeune de la table boit 2',
    'Ceux qui ont leur tel à moins de 30% boivent 2',
    'Tout le monde boit 1 à la santé du gagnant',
    'Le dernier à lever la main boit 2',
  ],
  en: [
    'The winner hands out 3 sips',
    'Everyone cheers, the last to put their glass down drinks 2',
    "Anyone who hasn't scored yet drinks 2",
    "The winner's neighbors drink 2",
    'The winner picks someone: they drink 3',
    'Vote: the most likely to end up under the table drinks 2',
    'The youngest at the table drinks 2',
    'Anyone with their phone under 30% drinks 2',
    'Everyone drinks 1 to the winner',
    'The last to raise their hand drinks 2',
  ],
};

// Mode normal — DEFIS FUN sans alcool (fournee validee 15/08/2026) : la ou
// l'apero a la gorgee comme consequence, ici le defi EST le spectacle. 5
// formats inspires de la grammaire Picolo (les formats, jamais leurs textes) :
// action instantanee, regle persistante (piege differe), duel, tour de table,
// vote/respiration. Meme convention que les gages : '@' = defi individuel
// (roulette). Tombe ~1 manche sur 2 (tirage deterministe cote host), toggle
// "Defis" au salon. Une carte peut porter son defi dedie (champ `f`, comme
// `g` pour les gages) ; sinon tirage dans ce pool.
// FOURNÉE FINALE validée le 16/08/2026 ("on peut se les tenter"), règles
// d'écriture actées avec l'utilisateur : JAMAIS un défi "un seul truc" —
// chaque défi ciblé est un DILEMME (X ou Y), le reste est une interaction
// (duel, piège, tour de table, vote). Enjeu personnel, pas de culture G.
const GENERIC_DEFIS = {
  fr: [
    // Dilemmes (deux portes)
    '@Montre la photo la plus gênante de ta galerie, ou la table choisit une pose que tu tiens 30 secondes',
    '@Avoue un truc que personne ici ne sait sur toi, ou fais 10 squats',
    '@Montre ta dernière recherche internet, ou raconte ta dernière honte',
    '@Dis qui de la table tu appellerais pour cacher un corps, ou désigne qui te balancerait à la police',
    '@Désigne qui de la table tu sacrifierais en premier dans un film d\'horreur, ou qui s\'en sortirait tout seul',
    '@Dis à qui de la table tu confierais ton tel déverrouillé, et à qui jamais',
    '@Ton crush célébrité le plus honteux, ou chante ton refrain le plus honteux',
    '@Le truc le plus bizarre que tu fais quand t\'es seul, ou imite un joueur de la table jusqu\'à ce qu\'on devine qui',
    '@Raconte ton pire message envoyé au mauvais destinataire, ou éternue de la façon la plus dramatique possible',
    '@Danse 15 secondes sans musique dans le silence total, ou avoue la dernière fois que t\'as fait semblant d\'être malade',
    '@Cours sur place au ralenti avec bruitages, ou vends l\'objet le plus proche de toi façon téléachat',
    '@Chante le générique d\'une sitcom, ou raconte ton dernier rêve bizarre',
    // Duels (le designe + son voisin de droite)
    '@Bataille de regard avec ton voisin de droite, le premier qui rit raconte sa dernière honte',
    '@Pierre-feuille-ciseaux en 3 manches contre ton voisin de gauche, le perdant imite un animal choisi par la table',
    '@Concours de grimaces avec ton voisin de droite, la table élit le pire',
    '@Bras de fer de pouces contre ton voisin de gauche, le perdant garde les mains sur la tête jusqu\'à son prochain point',
    '@Ni oui ni non : ton voisin de droite t\'interroge pendant 30 secondes, tu craques = la table choisit ta pose, tu la tiens 20 secondes',
    '@Équilibre sur une jambe face à ton voisin de droite : le premier qui pose le pied fait 10 pompes',
    '@Concours de blagues nulles avec ton voisin de gauche, la table élit la pire',
    'Les deux voisins du gagnant se font un compliment sincère, les yeux dans les yeux',
    // Pieges persistants
    '@Jusqu\'à ton prochain point : parle de toi à la 3e personne',
    '@Jusqu\'à la fin de la prochaine manche : chuchote tout ce que tu dis',
    '@Avant chaque phrase, dis "excellente question" jusqu\'à ton prochain point',
    '@Interdit de dire oui et non jusqu\'à ton prochain point',
    '@Termine toutes tes phrases par "voilà" jusqu\'à ton prochain point',
    'Le prochain de la table qui dit "non" fait 10 squats',
    // Chaos collectif
    'Tout le monde montre son fond d\'écran, vote pour le pire',
    'Silence total 20 secondes en se regardant : le premier qui rit mime sa propre mort',
    'Tour de table : chacun sort son excuse bidon pour annuler une soirée, le gagnant élit la plus minable',
    'Tour de table : chacun cite un red flag en rencard, le gagnant élit le plus rédhibitoire',
    // Votes qui piquent
    'Vote : qui a le plus de chances de finir au poste pour un truc débile',
    'Vote : qui envoie des vocaux de 4 minutes pour rien dire',
    'Vote : qui stalke le plus ses ex sur Insta',
    'Vote : qui dit "on verra" et ne vient jamais',
    'Vote : qui serait éliminé en premier dans Koh-Lanta',
  ],
  en: [
    '@Show the most embarrassing photo in your camera roll, or the table picks a pose you hold for 30 seconds',
    '@Confess something nobody here knows about you, or do 10 squats',
    '@Show your latest internet search, or share your latest embarrassing moment',
    '@Say who at the table you\'d call to hide a body, or point at who would turn you in',
    '@Pick who at the table you\'d sacrifice first in a horror movie, or who would make it out alone',
    '@Say who at the table you\'d trust with your unlocked phone, and who never',
    '@Your most shameful celebrity crush, or sing your most shameful chorus',
    '@The weirdest thing you do when you\'re alone, or impersonate someone at the table until they guess who',
    '@Tell about your worst text sent to the wrong person, or sneeze as dramatically as possible',
    '@Dance for 15 seconds with no music in total silence, or confess the last time you faked being sick',
    '@Run in place in slow motion with sound effects, or sell the closest object to you like a TV shopping host',
    '@Sing a sitcom theme song, or tell your latest weird dream',
    '@Staring contest with the player on your right, first to laugh shares their latest embarrassing moment',
    '@Rock-paper-scissors, best of 3, against the player on your left, loser acts like an animal picked by the table',
    '@Funny face contest with the player on your right, the table picks the worst',
    '@Thumb war against the player on your left, loser keeps their hands on their head until their next point',
    '@No yes, no no: the player on your right grills you for 30 seconds, you slip = the table picks a pose you hold for 20 seconds',
    '@One-leg balance face-off with the player on your right: first foot down does 10 push-ups',
    '@Bad joke contest with the player on your left, the table picks the worst one',
    'The winner\'s two neighbors give each other a sincere compliment, keeping eye contact',
    '@Until your next point: talk about yourself in the third person',
    '@Until the end of next round: whisper everything you say',
    '@Say "excellent question" before every sentence until your next point',
    '@No saying yes or no until your next point',
    '@End every sentence with "there you go" until your next point',
    'Next person at the table to say "no" does 10 squats',
    'Everyone shows their wallpaper, vote for the worst',
    'Total silence for 20 seconds staring at each other: first to laugh mimes their own death',
    'Round the table: everyone gives their go-to fake excuse to cancel plans, the winner picks the lamest',
    'Round the table: everyone names a dating red flag, the winner picks the biggest dealbreaker',
    'Vote: most likely to end up at the police station for something stupid',
    'Vote: who sends 4-minute voice messages that say nothing',
    'Vote: who stalks their exes the most on Insta',
    'Vote: who says "we\'ll see" and never shows up',
    'Vote: who would be voted out first on a survival show',
  ],
};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Reactions emoji disponibles pendant la revelation.
const REACTIONS = ['😂', '😱', '😍', '🔥', '👎', '💀'];

// Sorts a usage unique : contenu du modal de confirmation stylee (reroll / x2).
// Textes dans les carnets (game.sortConfirm.<id>) ; ici juste l'emoji.
const SORT_CONFIRM = {
  reroll: { emoji: '🎲' },
  vatout: { emoji: '🔥' },
};

// Manches speciales (mode normal comme apero) : twist annonce en debut de
// manche. Choisi par le host (writer unique) au passage a la manche suivante.
// Les libellés/descriptions vivent dans les carnets (game.specials.<id>).
const SPECIALS = { double: true, chrono: true, swap: true };
const SPECIAL_KEYS = Object.keys(SPECIALS);
// ~30% de chance qu'une manche soit speciale.
function rollSpecial() {
  return Math.random() < 0.3
    ? SPECIAL_KEYS[Math.floor(Math.random() * SPECIAL_KEYS.length)]
    : null;
}

// Annonce PLEIN ECRAN d'une manche speciale, au debut de la manche : ca claque
// pendant ~2.5 s puis se fond. Se remonte a chaque nouvelle manche (key=round).
function SpecialAnnounce({ special }) {
  const t = useT();
  const s = SPECIALS[special];
  const [phase, setPhase] = useState('in'); // 'in' → 'out' → hidden
  // Mode capture (?cap) : on fige l'annonce à l'écran pour la screener.
  const freeze =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('cap');
  useEffect(() => {
    if (!s || freeze) return undefined;
    const t1 = setTimeout(() => setPhase('out'), 2100);
    const t2 = setTimeout(() => setPhase('hidden'), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [s, freeze]);
  if (!s || phase === 'hidden') return null;
  return (
    <div
      className={`fixed inset-0 z-[55] flex items-center justify-center p-6 ${phase === 'out' ? 'special-fade' : ''}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
    >
      <div className="special-slam text-center flex flex-col items-center">
        <div
          style={{ fontFamily: '"Space Mono", monospace', color: YELLOW }}
          className="text-sm uppercase tracking-[0.4em] mb-4"
        >
          {t('game.specialRound')}
        </div>
        <div
          style={{
            fontFamily: '"Anton", sans-serif',
            color: '#fff',
            WebkitTextStroke: '3px #000',
            paintOrder: 'stroke fill',
          }}
          className="text-6xl uppercase leading-none mb-5"
        >
          {t(`game.specials.${special}.label`)}
        </div>
        <div
          style={{
            fontFamily: '"Anton", sans-serif',
            backgroundColor: YELLOW,
            color: '#000',
            boxShadow: '6px 6px 0 #000',
            transform: 'rotate(1.5deg)',
          }}
          className="inline-block border-4 border-black px-5 py-3 text-xl uppercase"
        >
          {t(`game.specials.${special}.desc`)}
        </div>
      </div>
    </div>
  );
}

// Banniere d'annonce d'une manche speciale (affichee en haut des ecrans de jeu).
function SpecialBanner({ special }) {
  const t = useT();
  const s = SPECIALS[special];
  if (!s) return null;
  return (
    <div className="px-4 pt-3 max-w-xl mx-auto w-full">
      <div
        className="border-4 border-black px-4 py-2 text-center"
        style={{ backgroundColor: '#000', color: YELLOW, boxShadow: '5px 5px 0 #000' }}
      >
        <div
          style={{ fontFamily: '"Anton", sans-serif' }}
          className="text-xl uppercase leading-none"
        >
          {t(`game.specials.${special}.label`)}
        </div>
        <div
          style={{ fontFamily: '"Space Mono", monospace' }}
          className="text-[10px] uppercase tracking-widest mt-1 opacity-80"
        >
          {t(`game.specials.${special}.desc`)}
        </div>
      </div>
    </div>
  );
}

// Annonce PLEIN ECRAN du JACKPOT (x2 sort + manche double = x4), au moment de
// la revelation. Meme "slam" que les manches speciales : ca claque ~2.5 s puis
// se fond. Remontee a chaque manche (key=round).
function JackpotAnnounce({ apero, winnerName }) {
  const t = useT();
  const [phase, setPhase] = useState('in'); // 'in' → 'out' → hidden
  useEffect(() => {
    // Reste ~2 s de plus que les manches speciales (moment fort).
    const t1 = setTimeout(() => setPhase('out'), 4100);
    const t2 = setTimeout(() => setPhase('hidden'), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  if (phase === 'hidden') return null;
  return (
    <div
      className={`fixed inset-0 z-[55] flex items-center justify-center overflow-hidden p-6 ${phase === 'out' ? 'special-fade' : ''}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
    >
      {/* Vrais feux d'artifice (CSS) derriere le texte. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <span className="fw" style={{ top: '22%', left: '24%' }} />
        <span className="fw" style={{ top: '26%', left: '76%', animationDelay: '0.35s' }} />
        <span className="fw" style={{ top: '70%', left: '30%', animationDelay: '0.7s' }} />
        <span className="fw" style={{ top: '74%', left: '72%', animationDelay: '1.05s' }} />
        <span className="fw" style={{ top: '48%', left: '52%', animationDelay: '1.4s' }} />
      </div>
      <div className="special-slam relative text-center flex flex-col items-center">
        <div
          style={{ fontFamily: '"Space Mono", monospace', color: YELLOW }}
          className="text-sm uppercase tracking-[0.4em] mb-3"
        >
          {t('game.jackpot')}
        </div>
        <div
          style={{
            fontFamily: '"Anton", sans-serif',
            color: '#fff',
            WebkitTextStroke: '3px #000',
            paintOrder: 'stroke fill',
          }}
          className="text-7xl uppercase leading-none mb-5"
        >
          x4 !
        </div>
        <div
          style={{
            fontFamily: '"Anton", sans-serif',
            backgroundColor: YELLOW,
            color: '#000',
            boxShadow: '6px 6px 0 #000',
            transform: 'rotate(1.5deg)',
          }}
          className="inline-block border-4 border-black px-5 py-3 text-lg uppercase max-w-xs leading-tight"
        >
          {apero ? t('game.jackpotApero') : t('game.jackpotNormal')}
          <div className="text-4xl leading-none mt-1 break-words">
            {winnerName || '?'} !
          </div>
        </div>
      </div>
    </div>
  );
}

// Annonce PLEIN ECRAN de la regle a boire (Mode Apero), a l'ecran resultat :
// les joueurs ne lisaient pas la regle affichee en bas (constat de soiree).
// Meme "slam" que les manches speciales mais aux couleurs APERO (fond rose,
// pas noir — a valider en test). ~4 s (le temps de lire une phrase) puis se
// fond ; la regle reste affichee sur l'ecran resultat en dessous.
// Pour un DEFI cible, montee seulement APRES la roulette, avec le prenom.
function GageAnnounce({ text, targetName, targetColor, kicker, delay = 0 }) {
  const t = useT();
  // ORDRE DE LECTURE (bilan anti-brouillon) : delay > 0 laisse d'abord voir
  // QUI a gagne sur l'ecran resultat, PUIS le slam annonce le defi/gage.
  // Une info a la fois. 'wait' → 'in' → 'out' → hidden.
  const [phase, setPhase] = useState(delay > 0 ? 'wait' : 'in');
  // Mode capture (?cap) : on fige l'annonce a l'ecran pour la screener.
  const freeze =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('cap');
  useEffect(() => {
    if (freeze) {
      setPhase('in');
      return undefined;
    }
    const t0 = setTimeout(() => setPhase('in'), delay);
    const t1 = setTimeout(() => setPhase('out'), delay + 3700);
    const t2 = setTimeout(() => setPhase('hidden'), delay + 4100);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [freeze, delay]);
  if (phase === 'hidden' || phase === 'wait') return null;
  return (
    <div
      className={`fixed inset-0 z-[55] flex items-center justify-center p-6 ${phase === 'out' ? 'special-fade' : ''}`}
      style={{ backgroundColor: 'rgba(214, 15, 74, 0.93)' }}
    >
      <div className="special-slam text-center flex flex-col items-center">
        <div
          style={{ fontFamily: '"Space Mono", monospace', color: YELLOW }}
          className="text-sm uppercase tracking-[0.4em] mb-4"
        >
          {kicker || `🍻 ${t('game.gageAnnounce')}`}
        </div>
        {targetName && (
          <div
            style={{
              fontFamily: '"Anton", sans-serif',
              color: targetColor || '#FFF',
              WebkitTextStroke: '3px #000',
              paintOrder: 'stroke fill',
            }}
            className="text-6xl uppercase leading-none mb-5 break-words max-w-md"
          >
            {targetName}
          </div>
        )}
        <div
          style={{
            fontFamily: '"Anton", sans-serif',
            backgroundColor: YELLOW,
            color: '#000',
            boxShadow: '6px 6px 0 #000',
            transform: 'rotate(1.5deg)',
          }}
          className="inline-block border-4 border-black px-5 py-4 text-2xl uppercase max-w-sm leading-tight"
        >
          {text}
        </div>
      </div>
    </div>
  );
}

// Duree (secondes) contenue dans un gage/defi, si >= 10 s : en dessous, un
// chrono n'a pas de sens (demande utilisateur : "pas pour 5 secondes").
function chronoSecs(text) {
  const m = (text || '').match(/(\d+)\s*(?:secondes?|seconds?)/i);
  const n = m ? parseInt(m[1], 10) : 0;
  return n >= 10 ? n : 0;
}

// Chrono de gage/defi : quand le texte contient une duree >= 10 s, l'hote
// voit un bouton "Lancer le chrono" ; le depart est ecrit dans la room
// (rooms/$code/chrono = {start, secs}) → compte a rebours synchronise sur
// tous les ecrans, puis "Temps ecoule !". Nettoye au passage de manche.
function DefiChrono({ text, chrono, isHost, onStart, onStop }) {
  const t = useT();
  const secs = chronoSecs(text);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!chrono) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [chrono]);
  if (!secs) return null;
  if (!chrono) {
    if (!isHost) return null;
    return (
      <button
        onClick={() => onStart(secs)}
        className="mt-3 border-4 border-black px-4 py-2 active:translate-x-[2px] active:translate-y-[2px]"
        style={{ backgroundColor: '#000', color: YELLOW, boxShadow: '4px 4px 0 #000' }}
      >
        <span
          style={{ fontFamily: '"Anton", sans-serif' }}
          className="text-lg uppercase"
        >
          ⏱ {t('game.chronoStart', { s: secs })}
        </span>
      </button>
    );
  }
  // MODAL plein ecran (demande utilisateur) : toute la table doit voir le
  // decompte. Le defi est rappele en haut, les secondes battent en enorme,
  // rouges sous 5 s, slam "Temps ecoule !" a zero puis fermeture auto.
  // L'hote peut toucher l'ecran pour arreter en avance (defi plie avant).
  const end = chrono.start + chrono.secs * 1000;
  const remain = Math.max(0, Math.ceil((end - now) / 1000));
  if (now > end + 2500) return null; // "temps ecoule" reste ~2.5s puis rend la main
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
      onClick={isHost ? onStop : undefined}
    >
      <div
        style={{ fontFamily: '"Space Mono", monospace', color: YELLOW }}
        className="text-xs uppercase tracking-[0.3em] mb-6 text-center max-w-sm leading-relaxed"
      >
        {text}
      </div>
      {remain > 0 ? (
        <div
          key={remain}
          className="gage-pop"
          style={{
            fontFamily: '"Anton", sans-serif',
            color: remain <= 5 ? '#FF5252' : YELLOW,
            WebkitTextStroke: '4px #000',
            paintOrder: 'stroke fill',
            fontSize: '10rem',
            lineHeight: 1,
          }}
        >
          {remain}
        </div>
      ) : (
        <div
          className="special-slam border-4 border-black px-6 py-4"
          style={{
            backgroundColor: DISLIKE_RED,
            color: '#FFF',
            boxShadow: '6px 6px 0 #000',
            fontFamily: '"Anton", sans-serif',
          }}
        >
          <span className="text-4xl uppercase">⏱ {t('game.chronoUp')}</span>
        </div>
      )}
      {isHost && remain > 0 && (
        <div
          style={{ fontFamily: '"Space Mono", monospace', color: '#FFF' }}
          className="text-[10px] uppercase tracking-widest opacity-50 mt-8"
        >
          {t('game.chronoStop')}
        </div>
      )}
    </div>
  );
}

// Choix J'AIME / J'AIME PAS du GAGNANT directement sur l'ecran resultat :
// il devient boss de la manche suivante, son choix VALIDE le resultat ET
// LANCE la manche (fusion valide par l'utilisateur des ex-etapes "l'hote
// clique continuer" + ecran d'attente "X choisit" → ~15-25s gagnees par
// manche). Garde-fous anti-enchainement ("si ca passe trop vite c'est
// relou") : boutons affiches apres ~4.5s (le temps du slam defi/gage) et
// GELES tant qu'un chrono tourne.
function WinnerNextChoice({ chrono, busy, onPick, hasAction }) {
  const t = useT();
  const [now, setNow] = useState(Date.now());
  // Delai ADAPTATIF (decide avec l'utilisateur) : 4.5s si l'ecran n'a que le
  // resultat a lire, 12s quand un defi/gage doit se JOUER a la table (sinon
  // le gagnant zappe le moment fun). Chrono lance → gel jusqu'a sa fin.
  const [readyAt] = useState(() => Date.now() + (hasAction ? 12000 : 4500));
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(iv);
  }, []);
  const chronoRunning =
    chrono && now < chrono.start + chrono.secs * 1000 + 2500;
  const waitLeft = Math.max(0, Math.ceil((readyAt - now) / 1000));
  const locked = waitLeft > 0 || chronoRunning || busy;
  // Attente LISIBLE : boutons grises + compteur (le gagnant sait que ca
  // vient, il n'a pas l'impression que c'est casse).
  return (
    <div className="max-w-xl mx-auto">
      <div
        style={{ fontFamily: '"Anton", sans-serif' }}
        className="text-lg uppercase text-center mb-2 leading-none"
      >
        {chronoRunning
          ? t('game.winnerAfterChrono')
          : waitLeft > 0
            ? t('game.winnerReadyIn', { s: waitLeft })
            : t('game.yourTurnNext')}
      </div>
      <div
        className="flex gap-3"
        style={{ opacity: locked ? 0.35 : 1, transition: 'opacity 300ms' }}>
        <button
          onClick={() => onPick('like')}
          disabled={locked}
          className="flex-1 border-4 border-black p-3 active:translate-x-[2px] active:translate-y-[2px] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backgroundColor: LIKE_GREEN,
            color: '#000',
            boxShadow: '5px 5px 0 #000',
            transform: 'rotate(-1deg)',
          }}
        >
          <span
            style={{ fontFamily: '"Anton", sans-serif' }}
            className="text-xl uppercase"
          >
            {t('game.like')}
          </span>
          <Heart size={24} fill="#000" strokeWidth={0} />
        </button>
        <button
          onClick={() => onPick('dislike')}
          disabled={locked}
          className="flex-1 border-4 border-black p-3 active:translate-x-[2px] active:translate-y-[2px] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backgroundColor: DISLIKE_RED,
            color: '#FFF',
            boxShadow: '5px 5px 0 #000',
            transform: 'rotate(1deg)',
          }}
        >
          <span
            style={{ fontFamily: '"Anton", sans-serif' }}
            className="text-xl uppercase"
          >
            {t('game.dislike')}
          </span>
          <HeartCrack size={24} color="#FFF" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// NB : le compte a rebours 3-2-1 avant la revelation a ete RETIRE le 16/08
// (bilan anti-brouillon avec l'utilisateur : plein ecran a CHAQUE manche
// sans aucune info = du bruit des la 3e manche). Ne pas le reintroduire.

// Couche d'affichage des reactions : chaque reaction recente (< 3.5 s) monte
// et s'estompe. Position horizontale deterministe (hash de la cle) → placee
// pareil sur tous les ecrans. reactions = objet Firebase { key: {e, t} }.
function ReactionsLayer({ reactions }) {
  const now = Date.now();
  const items = Object.entries(reactions || {}).filter(
    ([, r]) => r && now - r.t < 3500
  );
  if (!items.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {items.map(([key, r]) => {
        const left = 6 + (hashStr(key) % 88); // 6%..94%
        return (
          <div
            key={key}
            className="reaction-float"
            style={{ left: `${left}%`, fontSize: 52 }}
          >
            {r.e}
          </div>
        );
      })}
    </div>
  );
}

// Roulette de designation : un halo balaie les pseudos de plus en plus
// lentement puis s'arrete sur le joueur cible (targetId). Deterministe (meme
// cible partout), l'animation est locale mais finit toujours sur le meme nom.
function GageRoulette({ players, targetId, onDone }) {
  const t = useT();
  const targetIdx = Math.max(0, players.findIndex((p) => p.id === targetId));
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const n = players.length;
    if (n <= 1) {
      // Un seul eligible (parties a 3 : gagnant + boss exclus) → pas de vraie
      // roulette. On DIFFERE onDone via setTimeout : sinon il s'execute pendant
      // le montage, AVANT l'effet de reset du parent (les effets enfant passent
      // avant ceux du parent sur un meme commit), qui remet gageRouletteDone a
      // false juste apres → le texte du gage restait masque ("QUI S'Y COLLE ?"
      // + joueur designe, mais pas de regle). Le delai ajoute aussi un beat.
      setActive(targetIdx);
      const t = setTimeout(() => {
        setDone(true);
        onDone && onDone();
      }, 600);
      return () => clearTimeout(t);
    }
    // Sequence : ~4 tours + arrivee sur la cible, deceleration cubique.
    // Plus long (~5-6 s) pour le suspense et pour que tout le monde suive.
    const loops = 4;
    const totalSteps = loops * n + targetIdx;
    const MIN = 60; // ms au depart (rapide)
    const MAX = 520; // ms a l'arrivee (gros suspense final)
    let step = 0;
    let timer;
    const tick = () => {
      step++;
      setActive(step % n);
      if (step >= totalSteps) {
        setDone(true);
        onDone && onDone();
        return;
      }
      const t = step / totalSteps;
      const delay = MIN + (MAX - MIN) * t * t * t;
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, MIN);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const target = players[targetIdx];

  // Une fois la roulette arretee : on montre EN GROS le joueur designe,
  // en texte "sticker" nu (le cadre est reserve a la carte + a la regle).
  if (done) {
    const tColor = colorHex(target?.color);
    return (
      <div className="flex flex-col items-center mb-4 gage-pop">
        <div
          style={{ fontFamily: '"Space Mono", monospace' }}
          className="text-[11px] uppercase tracking-widest opacity-70 mb-4"
        >
          {t('game.gageYou')}
        </div>
        <span
          style={{
            fontFamily: '"Anton", sans-serif',
            color: tColor || '#FFF',
            WebkitTextStroke: '0.14em #000',
            paintOrder: 'stroke fill',
            letterSpacing: '0.05em',
            fontSize: fitBig(target?.name || ''),
            lineHeight: 1,
          }}
          className="uppercase break-words text-center"
        >
          {target?.name || '?'}
        </span>
      </div>
    );
  }

  // Pendant que ca tourne : tous les pseudos, halo qui balaie.
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-sm">
      {players.map((p, i) => {
        const on = i === active;
        return (
          <div
            key={p.id}
            style={{
              backgroundColor: on ? YELLOW : '#FFF',
              boxShadow: on ? '5px 5px 0 #000' : '2px 2px 0 #000',
              transform: on ? 'scale(1.18)' : 'scale(1)',
              transition: 'all 60ms',
            }}
            className="border-2 border-black px-3 py-1.5"
          >
            <span
              style={{ fontFamily: '"Anton", sans-serif', ...NAME_STYLE }}
              className="uppercase text-lg leading-none"
            >
              {p.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Regle de la manche + eventuel joueur designe. Convention : une regle qui
// commence par '@' est un DEFI INDIVIDUEL → l'app tire au sort qui s'y colle
// (deterministe : meme joueur affiche sur tous les ecrans, comme Picolo).
// Sont EXCLUS du tirage du defi : le GAGNANT (il a gagne, il ne boit pas) et
// le BOSS (c'est lui qui menait la manche). Le defi tombe donc sur un
// "perdant". Si aucun eligible (cas degenere), pas de cible → texte simple.
function gageOf(card, cardId, round, playersObj, excludeIds = [], lang) {
  let text = card?.g;
  if (!text) {
    const pool = GENERIC_GAGES[lang && lang.startsWith('en') ? 'en' : 'fr'];
    text = pool[hashStr(`${cardId}_${round}`) % pool.length];
  }
  if (!text.startsWith('@')) return { text, targetId: null };
  const ids = Object.keys(playersObj || {})
    .filter((id) => !excludeIds.includes(id))
    .sort();
  const targetId = ids.length
    ? ids[hashStr(`${cardId}_${round}_cible`) % ids.length]
    : null;
  return { text: text.slice(1), targetId };
}

// DEFI FUN du mode normal : meme mecanique que gageOf (defi dedie de la
// carte via le champ `f`, sinon pool generique ; '@' = cible via roulette,
// gagnant et boss exclus). Sels de hash distincts de ceux des gages.
function defiOf(card, cardId, round, playersObj, excludeIds = [], lang) {
  let text = card?.f;
  if (!text) {
    const pool = GENERIC_DEFIS[lang && lang.startsWith('en') ? 'en' : 'fr'];
    text = pool[hashStr(`${cardId}_${round}_defi`) % pool.length];
  }
  if (!text.startsWith('@')) return { text, targetId: null };
  const ids = Object.keys(playersObj || {})
    .filter((id) => !excludeIds.includes(id))
    .sort();
  const targetId = ids.length
    ? ids[hashStr(`${cardId}_${round}_defi_cible`) % ids.length]
    : null;
  return { text: text.slice(1), targetId };
}
import {
  Heart,
  HeartCrack,
  ChevronRight,
  Trophy,
  Crown,
  LogOut,
  Clock,
  Eye,
  X,
  Zap,
} from 'lucide-react';

export default function Game({ room, roomCode, playerId, onLeave }) {
  const t = useT();
  const [selectedCard, setSelectedCard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [vatoutArmed, setVatoutArmed] = useState(false);
  // Mode Apero : la carte choisie declenche une regle a boire (champ g de la
  // carte, ou une regle generique tiree au sort de facon deterministe).
  const [espionArming, setEspionArming] = useState(false);
  const [espionReveal, setEspionReveal] = useState({});
  const [espionDone, setEspionDone] = useState(false);
  const [sortsOpen, setSortsOpen] = useState(false);
  // Mode Apero : la roulette de designation d'un defi a-t-elle fini de tourner ?
  const [gageRouletteDone, setGageRouletteDone] = useState(false);
  // Confirmation stylee avant de consommer un sort a usage unique (reroll / x2).
  const [confirmSort, setConfirmSort] = useState(null); // null | 'reroll' | 'vatout'
  // Legende emoji -> categorie (bouton "?" toujours dispo dans la TopBar).
  const [showHelp, setShowHelp] = useState(false);

  const isHost = room.host === playerId;
  const isBoss = room.bossId === playerId;

  // Mode Apero (jeu a boire) : couche d'affichage par-dessus le moteur normal.
  // La carte choisie declenche une regle a boire. Regle du jeu inchangee.
  const partyMode = !!room.settings?.partyMode;
  // Fond ambre "biere" quand le Mode Apero est actif (sinon jaune), en gardant
  // les accents jaunes sur noir et le rose. La couleur sert de SECOURS derriere
  // la texture biere (classe .apero-bg) appliquee sur la racine des ecrans.
  const baseColor = partyMode ? AMBER : YELLOW;
  const baseClass = `${partyMode ? 'apero-bg ' : ''}screen-in`;

  const players = Object.entries(room.players || {}).map(([id, p]) => ({
    id,
    ...p,
  }));
  const playerById = Object.fromEntries(players.map((p) => [p.id, p]));
  const boss = room.bossId ? playerById[room.bossId] : null;
  const bossColor = colorHex(boss?.color);

  const myHandCardIds = Object.keys(room.hands?.[playerId] || {});
  const pool = room.pool || {};

  // Pioche VISIBLE : la carte neuve arrivait au milieu des anciennes sans
  // aucun signe — les joueurs croyaient garder "toujours les memes cartes"
  // (constat de soiree). On repere donc, a chaque changement de manche, les
  // cartes absentes de la main precedente et on les fait arriver avec une
  // animation de distribution (classe .card-draw). Diff purement local.
  const prevHandRef = useRef({ round: room.round, ids: myHandCardIds });
  const [freshCards, setFreshCards] = useState({});
  useEffect(() => {
    const prev = prevHandRef.current;
    if (room.round !== prev.round) {
      const before = new Set(prev.ids);
      const fresh = myHandCardIds.filter((id) => !before.has(id));
      // 1 a 2 cartes = pioche normale. Au-dela (manche Echange, reroll…),
      // toute la main change : animer 7 cartes d'un coup serait illisible.
      setFreshCards(
        fresh.length > 0 && fresh.length <= 2
          ? Object.fromEntries(fresh.map((id) => [id, true]))
          : {}
      );
    }
    prevHandRef.current = { round: room.round, ids: myHandCardIds };
  });

  // La carte fraichement piochee s'affiche EN PREMIER dans la main (demande
  // utilisateur) : "ca fait genre il y a du changement" — meme sans voir
  // l'animation, la main a visiblement bouge. Ordre stable toute la manche.
  const orderedHandIds = [
    ...myHandCardIds.filter((id) => freshCards[id]),
    ...myHandCardIds.filter((id) => !freshCards[id]),
  ];

  // Sorts (pouvoirs) actives par l'host + ce que j'ai deja consomme.
  const sorts = room.settings?.sorts || {};
  const myUsed = room.players?.[playerId]?.sortsUsed || {};

  const playedObj = room.played || {};
  // Ordre d'affichage ALÉATOIRE mais IDENTIQUE POUR TOUS : sinon la position
  // trahit qui a joué quoi. Mélange DÉTERMINISTE (seededShuffle) seedé par les
  // cartes posées (partagées) → même ordre aléatoire sur tous les écrans, stable
  // au re-render, réordonné à chaque manche. Entrée triée par cardId d'abord
  // pour que le résultat soit identique quel que soit l'ordre de lecture Firebase.
  const playedKey = Object.values(playedObj).slice().sort().join(',');
  const playedEntries = useMemo(
    () =>
      seededShuffle(
        Object.entries(playedObj)
          .map(([pid, cid]) => ({ playerId: pid, cardId: cid }))
          .sort((a, b) => (a.cardId < b.cardId ? -1 : a.cardId > b.cardId ? 1 : 0)),
        playedKey
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playedKey]
  );
  const iHavePlayed = !!playedObj[playerId];
  const nonBossCount = players.length - 1;
  const playedCount = playedEntries.length;

  // Auto-transition: play → reveal once everyone has played
  useEffect(() => {
    if (
      room.phase === 'play' &&
      nonBossCount > 0 &&
      playedCount >= nonBossCount
    ) {
      runTransaction(ref(db, `rooms/${roomCode}/phase`), (cur) => {
        if (cur === 'play') return 'reveal';
        return undefined;
      });
    }
  }, [room.phase, playedCount, nonBossCount, roomCode]);

  // --- Timer par tour (settings.turnTimer, 0 = off) -----------------------
  // Demarre quand le VIP annonce j'aime/j'aime pas (playStartedAt). A zero,
  // le client du retardataire joue sa PREMIERE carte (tri par id : choix
  // deterministe → idempotent meme si le host enforce en parallele).
  // La Manche Chrono force un timer de 10 s, meme si le timer du salon est off.
  const turnTimer =
    room.special === 'chrono' ? 10 : room.settings?.turnTimer || 0;
  const timerActive =
    turnTimer > 0 && room.phase === 'play' && !!room.playStartedAt;
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    if (!timerActive) return undefined;
    const iv = setInterval(() => setNowTs(Date.now()), 250);
    return () => clearInterval(iv);
  }, [timerActive]);
  const timerRemaining = timerActive
    ? Math.max(0, Math.ceil((room.playStartedAt + turnTimer * 1000 - nowTs) / 1000))
    : null;

  // Expiration (moi) : je n'ai pas joue → une carte part toute seule.
  // TRANSACTION (pas un simple update) : si mon jeu manuel ou l'enforcement du
  // host est passe entre-temps, on ne joue PAS par-dessus (sinon la carte deja
  // posee etait ecrasee et sortait du jeu sans passer par la defausse).
  useEffect(() => {
    if (!timerActive || isBoss || iHavePlayed || timerRemaining > 0) return;
    runTransaction(ref(db, `rooms/${roomCode}`), (cur) => {
      if (!cur || cur.phase !== 'play') return undefined;
      if (cur.played?.[playerId]) return undefined; // deja joue entre-temps
      const hand = Object.keys(cur.hands?.[playerId] || {}).sort();
      if (hand.length === 0) return undefined;
      const first = hand[0];
      delete cur.hands[playerId][first];
      cur.played = { ...(cur.played || {}), [playerId]: first };
      return cur;
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timerRemaining, isBoss, iHavePlayed]);

  // Filet de securite (host, +4s de grace) : joue pour les joueurs absents
  // (tel verrouille, app fermee) pour ne jamais bloquer la manche. Transaction :
  // ne touche que les joueurs qui n'ont VRAIMENT pas joue au moment du commit.
  useEffect(() => {
    if (!timerActive || !isHost) return;
    if (room.playStartedAt + (turnTimer + 4) * 1000 > nowTs) return;
    runTransaction(ref(db, `rooms/${roomCode}`), (cur) => {
      if (!cur || cur.phase !== 'play') return undefined;
      let changed = false;
      Object.keys(cur.players || {}).forEach((pid) => {
        if (pid === cur.bossId || cur.played?.[pid]) return;
        const hand = Object.keys(cur.hands?.[pid] || {}).sort();
        if (hand.length === 0) return;
        const first = hand[0];
        delete cur.hands[pid][first];
        cur.played = { ...(cur.played || {}), [pid]: first };
        changed = true;
      });
      return changed ? cur : undefined;
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, isHost, nowTs]);
  // -------------------------------------------------------------------------

  // Safety net: si bossId pointe vers un joueur disparu (boss qui a quitte
  // sans nettoyer), le host reassigne le boss et reset la phase
  useEffect(() => {
    if (!isHost) return;
    const inGamePhase = ['boss_choose', 'play', 'reveal'].includes(room.phase);
    if (!inGamePhase) return;
    if (room.bossId && playerById[room.bossId]) return;
    if (players.length === 0) return;
    runTransaction(ref(db, `rooms/${roomCode}`), (cur) => {
      if (!cur) return undefined;
      if (cur.bossId && cur.players?.[cur.bossId]) return undefined;
      const remainingIds = Object.keys(cur.players || {});
      if (remainingIds.length === 0) return undefined;
      return {
        ...cur,
        bossId: remainingIds[0],
        phase: 'boss_choose',
        mode: null,
        played: null,
        winnerInfo: null,
      };
    });
  }, [isHost, room.phase, room.bossId, players.length, playerById, roomCode]);

  // Reset local state on phase / round changes
  useEffect(() => {
    setSelectedCard(null);
    setVatoutArmed(false);
    setEspionArming(false);
    setEspionReveal({});
    setEspionDone(false);
    setSortsOpen(false);
    setGageRouletteDone(false);
  }, [room.phase, room.round, room.bossId]);

  async function bossChooseMode(m) {
    if (!isBoss || busy) return;
    setBusy(true);
    try {
      const updates = {
        mode: m,
        phase: 'play',
        played: null,
        bossPick: null,
        vatout: null,
        bets: null, // nettoyage d'anciennes parties (systeme de mise retire)
        // Depart du timer par tour (si active dans les reglages du salon)
        playStartedAt: Date.now(),
      };
      // MANCHE ÉCHANGE : les mains des non-boss tournent d'un cran (chacun
      // joue la main de son voisin). Le boss ne pose pas → sa main est intacte.
      if (room.special === 'swap') {
        const nonBoss = Object.keys(room.players || {}).filter(
          (id) => id !== room.bossId
        );
        if (nonBoss.length >= 2) {
          const hands = nonBoss.map((id) => room.hands?.[id] || {});
          nonBoss.forEach((id, i) => {
            updates[`hands/${id}`] = hands[(i + 1) % nonBoss.length];
          });
        }
      }
      await update(ref(db, `rooms/${roomCode}`), updates);
    } finally {
      setBusy(false);
    }
  }

  async function playCard() {
    if (!selectedCard || isBoss || iHavePlayed || busy) return;
    setBusy(true);
    const useVatout = vatoutArmed && sorts.vatout && !myUsed.vatout;
    try {
      const updates = {
        [`hands/${playerId}/${selectedCard}`]: null,
        [`played/${playerId}`]: selectedCard,
      };
      if (useVatout) {
        updates[`vatout/${playerId}`] = true;
        updates[`players/${playerId}/sortsUsed/vatout`] = true;
      }
      await update(ref(db, `rooms/${roomCode}`), updates);
    } finally {
      setBusy(false);
      setSelectedCard(null);
      setVatoutArmed(false);
    }
  }

  // SORT Reroll : rejette ma main et repioche HAND_SIZE cartes. Transaction
  // pour eviter les conflits si plusieurs joueurs rerollent en meme temps.
  async function rerollHand() {
    if (isBoss || iHavePlayed || busy) return;
    if (!sorts.reroll || myUsed.reroll) return;
    // La confirmation passe desormais par le modal stylee (confirmSortAction).
    setBusy(true);
    try {
      await runTransaction(ref(db, `rooms/${roomCode}`), (cur) => {
        if (!cur || cur.phase !== 'play') return undefined;
        if (cur.played?.[playerId]) return undefined;
        if (cur.players?.[playerId]?.sortsUsed?.reroll) return undefined;
        const myHand = Object.keys(cur.hands?.[playerId] || {});
        let deck = toArray(cur.deck);
        let discard = [...toArray(cur.discard), ...myHand];
        const newHand = {};
        for (let i = 0; i < HAND_SIZE; i++) {
          if (deck.length === 0 && discard.length > 0) {
            deck = shuffle(discard);
            discard = [];
          }
          if (deck.length > 0) newHand[deck.shift()] = true;
        }
        cur.hands = cur.hands || {};
        cur.hands[playerId] = newHand;
        cur.deck = deck;
        cur.discard = discard;
        cur.players[playerId].sortsUsed = {
          ...(cur.players[playerId].sortsUsed || {}),
          reroll: true,
        };
        return cur;
      });
    } finally {
      setBusy(false);
      setSelectedCard(null);
    }
  }

  // Valide le sort choisi dans le modal de confirmation, puis l'execute/arme.
  function confirmSortAction() {
    const type = confirmSort;
    setConfirmSort(null);
    if (type === 'reroll') rerollHand();
    else if (type === 'vatout') setVatoutArmed(true);
  }

  // SORT Espion : revele (pour moi seul) qui a pose la carte tapee.
  async function consumeEspion(cardId) {
    if (!espionArming || espionDone || espionReveal[cardId]) return;
    setEspionReveal((r) => ({ ...r, [cardId]: true }));
    setEspionArming(false);
    setEspionDone(true); // verrou local : une seule carte revelee, pas de re-arme
    if (sorts.espion && !myUsed.espion) {
      await update(ref(db, `rooms/${roomCode}`), {
        [`players/${playerId}/sortsUsed/espion`]: true,
      }).catch(() => {});
    }
  }

  // Lance le chrono d'un gage/defi (host) : depart ecrit dans la room →
  // compte a rebours synchronise sur tous les ecrans (voir DefiChrono).
  const startChrono = (secs) =>
    set(ref(db, `rooms/${roomCode}/chrono`), { start: Date.now(), secs }).catch(
      () => {}
    );
  // Arret anticipe par l'hote (tap sur le modal du chrono).
  const stopChrono = () =>
    set(ref(db, `rooms/${roomCode}/chrono`), null).catch(() => {});

  // Reaction emoji ephemere (pendant la revelation). Se supprime toute seule.
  function sendReaction(e) {
    const r = push(ref(db, `rooms/${roomCode}/reactions`));
    set(r, { e, t: Date.now() }).catch(() => {});
    setTimeout(() => remove(r).catch(() => {}), 3600);
  }

  async function bossPickWinner(entry) {
    if (!isBoss || busy) return;
    setBusy(true);
    try {
      // Mode Apero : on resout le GAGE UNE seule fois ici (cote host) et on le
      // fige dans winnerInfo. Tous les clients l'AFFICHENT tel quel, sans jamais
      // le recalculer → meme texte + meme joueur designe pour tout le monde,
      // immunise contre les differences de version/cache (un bundle perime ne
      // peut plus afficher un autre gage, ni la roulette sans texte). En mode
      // normal, winnerInfo.gage est simplement ignore.
      const wCard = (room.pool || {})[entry.cardId];
      const excluded = [entry.playerId, room.bossId];
      const g = gageOf(wCard, entry.cardId, room.round || 1, room.players, excluded, room.settings?.lang);
      // DEFI FUN (mode normal uniquement) : fige ici par le host, comme le
      // gage. Tombe ~1 manche sur 2 (hash deterministe), sauf si l'hote a
      // coupe les defis au salon (settings.defis === false).
      // 3 positions (reglage salon) : 'off' | 'some' (1 manche sur 2,
      // defaut) | 'all' (chaque manche). Retro-compat : false=off, true=some.
      const defisRaw = room.settings?.defis;
      const defisMode =
        defisRaw === false || defisRaw === 'off'
          ? 'off'
          : defisRaw === 'all'
            ? 'all'
            : 'some';
      const isDefiRound =
        defisMode === 'all' ||
        hashStr(`${entry.cardId}_${room.round || 1}_defiroll`) % 2 === 0;
      const d =
        !partyMode && defisMode !== 'off' && isDefiRound
          ? defiOf(wCard, entry.cardId, room.round || 1, room.players, excluded, room.settings?.lang)
          : null;
      await update(ref(db, `rooms/${roomCode}`), {
        winnerInfo: {
          playerId: entry.playerId,
          cardId: entry.cardId,
          // Firebase ignore les cles null : targetId absent = defi non cible.
          gage: { text: g.text, targetId: g.targetId ?? null },
          defi: d ? { text: d.text, targetId: d.targetId ?? null } : null,
        },
        phase: 'result',
        bossPick: null,
        chrono: null,
      });
    } finally {
      setBusy(false);
    }
  }

  async function continueAfterResult() {
    if (!isHost || busy || !room.winnerInfo) return;
    setBusy(true);
    try {
      const updates = {};
      const winnerId = room.winnerInfo.playerId;
      const winnerCurrentScore = playerById[winnerId]?.score || 0;
      // Gain = 1, DOUBLE si Va-tout (sort x2) et DOUBLE si Manche Double : les
      // deux x2 se MULTIPLIENT → 1, 2, 2 ou 4 (jackpot les deux cumules).
      const gain =
        1 * (room.vatout?.[winnerId] ? 2 : 1) * (room.special === 'double' ? 2 : 1);
      const winnerNewScore = winnerCurrentScore + gain;
      updates[`players/${winnerId}/score`] = winnerNewScore;
      // Le va-tout est valable un seul tour → on le remet a zero.
      updates['vatout'] = null;

      // Move played cards to discard
      const playedCardIds = Object.values(playedObj);
      let currentDeck = toArray(room.deck);
      let currentDiscard = [...toArray(room.discard), ...playedCardIds];

      // Refill hands of non-boss players
      const nonBossIds = players
        .map((p) => p.id)
        .filter((id) => id !== room.bossId);

      nonBossIds.forEach((pid) => {
        if (currentDeck.length === 0 && currentDiscard.length > 0) {
          currentDeck = shuffle(currentDiscard);
          currentDiscard = [];
        }
        if (currentDeck.length > 0) {
          const drawn = currentDeck.shift();
          updates[`hands/${pid}/${drawn}`] = true;
        }
      });

      updates['deck'] = currentDeck;
      updates['discard'] = currentDiscard;
      updates['reactions'] = null; // on repart avec un ecran propre
      updates['chrono'] = null; // chrono de gage/defi de la manche finie

      const targetScore = room.settings?.winningScore ?? WINNING_SCORE;
      if (winnerNewScore >= targetScore) {
        updates['phase'] = 'game_over';
        // Compteur de victoires de la session : il survit au retour au lobby
        // (backToLobby ne touche pas `wins`) et meurt avec la room.
        updates[`wins/${winnerId}`] = (room.wins?.[winnerId] || 0) + 1;
      } else {
        updates['phase'] = 'boss_choose';
        updates['bossId'] = winnerId;
        updates['mode'] = null;
        updates['played'] = null;
        updates['winnerInfo'] = null;
        updates['round'] = (room.round || 1) + 1;
        // Tirage de la manche speciale suivante (host = writer unique).
        updates['special'] = rollSpecial();
      }

      await update(ref(db, `rooms/${roomCode}`), updates);
    } finally {
      setBusy(false);
    }
  }

  // Le GAGNANT choisit J'aime/J'aime pas depuis l'ecran resultat : fait tout
  // ce que faisaient continueAfterResult (score, defausse, pioche) PUIS
  // bossChooseMode (mode, manche speciale, echange de mains, timer) en UNE
  // seule ecriture → on saute l'ecran d'attente "X choisit". Le chemin
  // continueAfterResult reste utilise pour la victoire finale (game_over) et
  // en secours si le gagnant a quitte la partie.
  async function winnerStartNextRound(m) {
    if (busy || !room.winnerInfo) return;
    if (room.winnerInfo.playerId !== playerId) return;
    const gain =
      1 * (room.vatout?.[playerId] ? 2 : 1) * (room.special === 'double' ? 2 : 1);
    const newScore = (playerById[playerId]?.score || 0) + gain;
    // Score gagnant : ce chemin ne gere pas la fin de partie (l'UI affiche
    // alors le bouton classique de l'hote qui passe par continueAfterResult).
    if (newScore >= (room.settings?.winningScore ?? WINNING_SCORE)) return;
    setBusy(true);
    try {
      // Defausse des cartes jouees + pioche pour les non-boss de la manche
      // finie (meme logique que continueAfterResult).
      const playedCardIds = Object.values(playedObj);
      let deck = toArray(room.deck);
      let discard = [...toArray(room.discard), ...playedCardIds];
      const hands = {};
      Object.keys(room.players || {}).forEach((pid) => {
        hands[pid] = { ...(room.hands?.[pid] || {}) };
      });
      const nonBossIds = players
        .map((p) => p.id)
        .filter((id) => id !== room.bossId);
      nonBossIds.forEach((pid) => {
        if (deck.length === 0 && discard.length > 0) {
          deck = shuffle(discard);
          discard = [];
        }
        if (deck.length > 0) hands[pid][deck.shift()] = true;
      });
      // Manche speciale de la manche qui DEMARRE (annonce plein ecran au
      // moment ou l'ecran de pose s'ouvre, SpecialAnnounce y est deja rendu).
      const special = rollSpecial();
      // MANCHE ECHANGE : les mains des non-boss (je suis le nouveau boss)
      // tournent d'un cran — meme logique que bossChooseMode.
      if (special === 'swap') {
        const nonBoss = Object.keys(room.players || {}).filter(
          (id) => id !== playerId
        );
        if (nonBoss.length >= 2) {
          const hs = nonBoss.map((id) => hands[id]);
          nonBoss.forEach((id, i) => {
            hands[id] = hs[(i + 1) % nonBoss.length];
          });
        }
      }
      await update(ref(db, `rooms/${roomCode}`), {
        [`players/${playerId}/score`]: newScore,
        vatout: null,
        hands,
        deck,
        discard,
        reactions: null,
        chrono: null,
        phase: 'play',
        mode: m,
        bossId: playerId,
        round: (room.round || 1) + 1,
        special,
        played: null,
        winnerInfo: null,
        bossPick: null,
        bets: null,
        playStartedAt: Date.now(),
      });
    } finally {
      setBusy(false);
    }
  }

  // "On rejoue !" : relance une partie IMMEDIATEMENT avec les memes reglages,
  // sans repasser par le salon (entre deux parties, c'est la que les groupes
  // decrochent). Le pool de la room est reutilise tel quel (memes categories),
  // simplement remelange et redistribue. Le compteur de victoires survit.
  async function replayGame() {
    if (!isHost || busy) return;
    setBusy(true);
    try {
      const ids = shuffle(Object.keys(room.pool || {}));
      let cursor = 0;
      const handsObj = {};
      const playersReset = {};
      players.forEach((p) => {
        handsObj[p.id] = Object.fromEntries(
          ids.slice(cursor, cursor + HAND_SIZE).map((c) => [c, true])
        );
        cursor += HAND_SIZE;
        playersReset[p.id] = {
          name: p.name,
          score: 0,
          joinedAt: p.joinedAt,
          ...(p.color ? { color: p.color } : {}),
        };
      });
      const randomBoss = players[Math.floor(Math.random() * players.length)].id;
      await update(ref(db, `rooms/${roomCode}`), {
        phase: 'boss_choose',
        hands: handsObj,
        deck: ids.slice(cursor),
        discard: null,
        played: null,
        winnerInfo: null,
        mode: null,
        bossPick: null,
        vatout: null,
        reactions: null,
        chrono: null,
        bossId: randomBoss,
        round: 1,
        special: null,
        players: playersReset,
      });
      bumpStats({
        gamesStarted: 1,
        playersTotal: players.length,
        ...(partyMode ? { partyStarted: 1 } : {}),
      });
    } finally {
      setBusy(false);
    }
  }

  async function backToLobby() {
    if (!isHost || busy) return;
    setBusy(true);
    try {
      // Reset scores, clear game state, go back to lobby
      const playersReset = {};
      players.forEach((p) => {
        playersReset[p.id] = {
          name: p.name,
          score: 0,
          joinedAt: p.joinedAt,
          ...(p.color ? { color: p.color } : {}),
        };
      });
      await update(ref(db, `rooms/${roomCode}`), {
        phase: 'lobby',
        pool: null,
        hands: null,
        deck: null,
        discard: null,
        played: null,
        winnerInfo: null,
        mode: null,
        bossId: null,
        round: null,
        chrono: null,
        players: playersReset,
      });
    } finally {
      setBusy(false);
    }
  }

  async function leaveGame() {
    if (busy) return;
    if (!confirm(t('game.leaveConfirm'))) return;
    setBusy(true);
    try {
      const remaining = players.filter((p) => p.id !== playerId);
      const wasBoss = room.bossId === playerId;
      const updates = {
        [`players/${playerId}`]: null,
        [`hands/${playerId}`]: null,
      };
      if (remaining.length === 0) {
        await remove(ref(db, `rooms/${roomCode}`));
        onLeave();
        return;
      }
      if (isHost) {
        updates.host = remaining[0].id;
      }
      if (wasBoss) {
        updates.bossId = remaining[0].id;
        updates.phase = 'boss_choose';
        updates.mode = null;
        updates.played = null;
        updates.winnerInfo = null;
        updates.bossPick = null;
      } else {
        updates[`played/${playerId}`] = null;
      }
      await update(ref(db, `rooms/${roomCode}`), updates);
      onLeave();
    } finally {
      setBusy(false);
    }
  }

  // ============ COMMON SUBCOMPONENTS ============

  const TopBar = ({ right }) => (
    // text-black explicite : la barre reste jaune sur TOUS les ecrans, y
    // compris le mode projecteur (fond noir + text-white herite sinon).
    <>
      <div className="px-4 py-3 border-b-4 border-black bg-yellow-300 text-black" style={{ backgroundColor: baseColor }}>
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <button onClick={leaveGame} className="flex items-center gap-1.5">
            <LogOut size={16} />
            <span
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest"
            >
              {t('common.leave')}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div
              style={{ fontFamily: '"Anton", sans-serif' }}
              className="text-lg uppercase tracking-tight"
            >
              Room {roomCode}
            </div>
            <button
              onClick={() => setShowHelp(true)}
              aria-label={t('game.helpAria')}
              className="w-6 h-6 flex items-center justify-center border-2 border-black rounded-full active:translate-y-[1px]"
              style={{ fontFamily: '"Anton", sans-serif', backgroundColor: '#FFF', color: '#000', lineHeight: 1 }}
            >
              ?
            </button>
          </div>
          <div
            style={{ fontFamily: '"Space Mono", monospace' }}
            className="text-[10px] uppercase tracking-widest text-right min-w-[60px]"
          >
            {right || (partyMode ? '🍻 ' + t('game.aperoTag') : '')}
          </div>
        </div>
      </div>

      {/* Legende emoji -> categorie, ouverte depuis le "?" de la TopBar. */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5"
          onClick={() => setShowHelp(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm border-4 border-black bg-white p-5 max-h-[82vh] overflow-y-auto"
            style={{ boxShadow: '10px 10px 0 #000' }}
          >
            <div className="flex items-center justify-between mb-1">
              <div
                style={{ fontFamily: '"Anton", sans-serif' }}
                className="text-2xl uppercase text-black"
              >
                {t('game.helpTitle')}
              </div>
              <button
                onClick={() => setShowHelp(false)}
                aria-label={t('common.close')}
                className="border-2 border-black bg-white p-1 active:translate-y-[1px]"
              >
                <X size={18} color="#000" />
              </button>
            </div>
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest text-black/60 mb-4"
            >
              {t('game.helpSub')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 border-2 border-black px-2 py-1.5"
                  style={{ backgroundColor: c.spicy ? '#FFE4E9' : '#FFF' }}
                >
                  <span className="text-lg leading-none">{c.emoji}</span>
                  <span
                    style={{ fontFamily: '"Anton", sans-serif' }}
                    className="text-sm uppercase leading-none text-black"
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  const Scoreboard = () => (
    <div className="px-4 py-2 border-b-4 border-black bg-white/40">
      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl mx-auto">
        {players.map((p) => {
          const isPlayerBoss = p.id === room.bossId;
          const isMe = p.id === playerId;
          const pColor = colorHex(p.color);
          const bg = pColor || (isPlayerBoss ? '#000' : '#FFF');
          const fg = pColor ? colorFg(p.color) : (isPlayerBoss ? YELLOW : '#000');
          const outline = isPlayerBoss
            ? '3px solid ' + YELLOW
            : isMe
              ? '2px solid ' + PINK
              : 'none';
          return (
            <div
              key={p.id}
              style={{
                backgroundColor: bg,
                color: fg,
                fontFamily: '"Anton", sans-serif',
                outline,
                outlineOffset: '1px',
              }}
              className="border-2 border-black px-2 py-1 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span style={NAME_STYLE} className="uppercase text-sm leading-none">
                {p.name}
              </span>
              <span
                style={{
                  backgroundColor: '#000',
                  color: YELLOW,
                }}
                className="text-xs leading-none px-1.5 py-0.5"
              >
                {p.score || 0}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Ecrans d'attente : barre de progression (combien ont pose) + pseudos,
  // grises tant que le joueur n'a pas encore pose sa carte.
  const WaitingProgress = () => {
    const others = players.filter((p) => p.id !== room.bossId);
    const total = others.length || 1;
    const done = others.filter((p) => playedObj[p.id]).length;
    const pct = Math.round((done / total) * 100);
    return (
      <div className="w-full max-w-sm mx-auto">
        <div
          className="relative border-4 border-black overflow-hidden"
          style={{ backgroundColor: '#FFF', height: 34, boxShadow: '4px 4px 0 #000' }}
        >
          <div
            className="h-full"
            style={{
              width: `${pct}%`,
              backgroundColor: LIKE_GREEN,
              transition: 'width 350ms ease-out',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              style={{ fontFamily: '"Anton", sans-serif', ...NAME_STYLE }}
              className="text-lg uppercase leading-none"
            >
              {t('game.played', { done, total: others.length })}
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {others.map((p) => {
            const hasPlayed = !!playedObj[p.id];
            const pColor = colorHex(p.color);
            const bg = pColor || (hasPlayed ? '#000' : '#FFF');
            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: bg,
                  opacity: hasPlayed ? 1 : 0.4,
                  fontFamily: '"Anton", sans-serif',
                  boxShadow: '3px 3px 0 #000',
                  ...NAME_STYLE,
                }}
                className="border-2 border-black px-3 py-1.5 uppercase text-lg leading-none"
              >
                {hasPlayed ? '✓ ' : '… '}
                {p.name}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const baseWrap = {
    minHeight: '100vh',
    backgroundColor: baseColor,
  };

  // ============ PHASE: BOSS_CHOOSE ============
  if (room.phase === 'boss_choose') {
    if (isBoss) {
      return (
        <div key={room.phase} style={baseWrap} className={`text-black flex flex-col ${baseClass}`}>
          {/* Pas de SpecialAnnounce ici : il joue au debut de la phase de
              POSE (l'ecran boss_choose est saute par la manche acceleree, et
              quand on y passe encore, l'annonce jouerait en double). */}
          <TopBar right={t('game.roundLabel', { n: room.round || 1 })} />
          <Scoreboard />
          <SpecialBanner special={room.special} />
          <div className="flex-1 px-5 py-6 flex flex-col max-w-xl mx-auto w-full text-center">
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[11px] uppercase tracking-[0.35em] opacity-70 mb-4"
            >
              {t('game.yourTurn')}
            </div>
            <div
              style={{
                fontFamily: '"Anton", sans-serif',
                lineHeight: 0.88,
                fontSize: fitBig(boss?.name || ''),
                color: bossColor || '#000',
                WebkitTextStroke: '5px #000',
                paintOrder: 'stroke fill',
                letterSpacing: '0.08em',
              }}
              className="uppercase break-words mb-2"
            >
              {boss?.name || '…'}
            </div>
            <div
              style={{ fontFamily: '"Anton", sans-serif' }}
              className="text-2xl uppercase mb-1 mt-4"
            >
              {t('game.announceMode')}
            </div>
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest opacity-70 mb-6"
            >
              {t('game.othersWillPlay')}
            </div>

            <div className="flex flex-col gap-6 mt-2">
              <button
                onClick={() => bossChooseMode('like')}
                disabled={busy}
                className="border-4 border-black p-4 active:translate-x-[3px] active:translate-y-[3px] flex items-center justify-between"
                style={{
                  backgroundColor: LIKE_GREEN,
                  color: '#000',
                  boxShadow: '6px 6px 0 #000',
                  transform: 'rotate(-1deg)',
                }}
              >
                <div
                  style={{ fontFamily: '"Anton", sans-serif', lineHeight: 0.9 }}
                  className="text-3xl uppercase"
                >
                  {t('game.like')}
                </div>
                <Heart size={36} fill="#000" strokeWidth={0} />
              </button>

              <button
                onClick={() => bossChooseMode('dislike')}
                disabled={busy}
                className="border-4 border-black p-4 active:translate-x-[3px] active:translate-y-[3px] flex items-center justify-between"
                style={{
                  backgroundColor: DISLIKE_RED,
                  color: '#FFF',
                  boxShadow: '6px 6px 0 #000',
                  transform: 'rotate(1deg)',
                }}
              >
                <div
                  style={{
                    fontFamily: '"Anton", sans-serif',
                    lineHeight: 0.9,
                    color: '#FFF',
                  }}
                  className="text-3xl uppercase"
                >
                  {t('game.dislike')}
                </div>
                <HeartCrack size={36} color="#FFF" strokeWidth={2.5} />
              </button>
            </div>

            {/* Outil DEV (absent en prod) : force la manche speciale courante. */}
            {import.meta.env.DEV && (
              <div className="mt-8 border-2 border-dashed border-black/40 p-2">
                <div
                  style={{ fontFamily: '"Space Mono", monospace' }}
                  className="text-[9px] uppercase tracking-widest opacity-50 mb-1"
                >
                  🔧 DEV · forcer une manche spéciale
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(SPECIALS).concat('none').map((k) => (
                    <button
                      key={k}
                      onClick={() =>
                        update(ref(db, `rooms/${roomCode}`), {
                          special: k === 'none' ? null : k,
                        }).catch(() => {})
                      }
                      className="border-2 border-black bg-white px-2 py-1 text-[10px] uppercase active:opacity-60"
                      style={{
                        fontFamily: '"Space Mono", monospace',
                        backgroundColor: room.special === k ? YELLOW : '#FFF',
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    // Non-boss waiting
    return (
      <div key={room.phase} style={baseWrap} className={`text-black flex flex-col ${baseClass}`}>
        <TopBar right={t('game.roundLabel', { n: room.round || 1 })} />
        <Scoreboard />
        <SpecialBanner special={room.special} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <Clock size={64} strokeWidth={2.5} />
          <div
            style={{ fontFamily: '"Space Mono", monospace' }}
            className="text-[10px] uppercase tracking-widest opacity-60 mt-4 mb-2"
          >
            {t('game.waiting')}
          </div>
          <div
            style={{
              fontFamily: '"Anton", sans-serif',
              lineHeight: 0.9,
              fontSize: fitBig(boss?.name || ''),
              color: bossColor || '#000',
              WebkitTextStroke: '5px #000',
              paintOrder: 'stroke fill',
              letterSpacing: '0.08em',
            }}
            className="uppercase mb-2 break-words"
          >
            {boss?.name || '…'}
          </div>
          <div
            style={{ fontFamily: '"Anton", sans-serif' }}
            className="text-xl uppercase opacity-80"
          >
            {t('game.choosingMode')}
          </div>
        </div>
      </div>
    );
  }

  // ============ PHASE: PLAY ============
  if (room.phase === 'play') {
    if (isBoss) {
      // Boss waits while others play
      return (
        <div key={room.phase} style={baseWrap} className={`text-black flex flex-col ${baseClass}`}>
          {/* Annonce de manche speciale ICI (debut reel de la manche) : la
              manche acceleree saute l'ecran boss_choose ou elle vivait. */}
          <SpecialAnnounce key={room.round} special={room.special} />
          <TopBar right={`${playedCount}/${nonBossCount}`} />
          <Scoreboard />
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-xl mx-auto w-full">
            <div
              className="border-4 border-black p-3 flex items-center justify-between w-full max-w-sm mb-6"
              style={{
                backgroundColor: room.mode === 'like' ? LIKE_GREEN : DISLIKE_RED,
                color: room.mode === 'like' ? '#000' : '#FFF',
                boxShadow: '5px 5px 0 #000',
                transform: room.mode === 'like' ? 'rotate(-1deg)' : 'rotate(1deg)',
              }}
            >
              <div
                style={{ fontFamily: '"Anton", sans-serif', lineHeight: 0.9 }}
                className="text-3xl uppercase"
              >
                {room.mode === 'like' ? t('game.like') : t('game.dislike')}
              </div>
              {room.mode === 'like' ? (
                <Heart size={32} fill="#000" strokeWidth={0} />
              ) : (
                <HeartCrack size={32} color="#FFF" strokeWidth={2.5} />
              )}
            </div>
            <Clock size={56} strokeWidth={2.5} />
            <div
              style={{
                fontFamily: '"Anton", sans-serif',
                lineHeight: 0.9,
              }}
              className="text-3xl uppercase mb-4 mt-3"
            >
              {t('game.playersPlaying')}
            </div>
            <div className="w-full mt-2">
              <WaitingProgress />
            </div>
          </div>
        </div>
      );
    }

    // Non-boss player
    if (iHavePlayed) {
      const myPlayedCardId = playedObj[playerId];
      const myCard = pool[myPlayedCardId];
      return (
        <div key={room.phase} style={baseWrap} className={`text-black flex flex-col ${baseClass}`}>
          <TopBar right={`${playedCount}/${nonBossCount}`} />
          <Scoreboard />
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-xl mx-auto w-full">
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest opacity-60 mb-2"
            >
              {t('game.yourCard')}
            </div>
            <div
              className="border-4 border-black p-5 mb-6 max-w-xs w-full relative"
              style={{
                backgroundColor: '#FFF',
                color: '#000',
                boxShadow: '8px 8px 0 #000',
                transform: 'rotate(-2deg)',
              }}
            >
              <span
                className="absolute top-1.5 right-2 text-lg leading-none opacity-80 select-none"
                aria-hidden
              >
                {catEmojiOf(myCard)}
              </span>
              <div
                style={{
                  fontFamily: '"Anton", sans-serif',
                  lineHeight: 0.92,
                  fontSize: fitBig(myCard?.t || ''),
                }}
                className="uppercase"
              >
                {myCard?.t || '?'}
              </div>
            </div>
            <div
              style={{ fontFamily: '"Anton", sans-serif', lineHeight: 0.95 }}
              className="text-3xl uppercase mb-3"
            >
              {t('game.waitingOthers')}
            </div>
            <div className="w-full mt-2">
              <WaitingProgress />
            </div>
          </div>
        </div>
      );
    }

    // Non-boss player : main directement, banniere mode en haut
    const isLike = room.mode === 'like';
    return (
      <div key={room.phase} style={baseWrap} className={`text-black flex flex-col ${baseClass}`}>
        <SpecialAnnounce key={room.round} special={room.special} />
        <TopBar right={`${playedCount}/${nonBossCount}`} />
        <Scoreboard />
        <SpecialBanner special={room.special} />
        <div className="px-4 pt-3 pb-6 max-w-xl mx-auto w-full">
          <div
            className="border-4 border-black p-4 flex items-center justify-between gap-3"
            style={{
              backgroundColor: isLike ? LIKE_GREEN : DISLIKE_RED,
              color: isLike ? '#000' : '#FFF',
              boxShadow: '5px 5px 0 #000',
              transform: isLike ? 'rotate(-1deg)' : 'rotate(1deg)',
            }}
          >
            <div
              style={{ fontFamily: '"Anton", sans-serif', lineHeight: 0.95 }}
              className="text-2xl uppercase min-w-0 break-words"
            >
              <span
                style={{
                  color: bossColor || (isLike ? '#000' : '#FFF'),
                  WebkitTextStroke: isLike ? '0.6px #000' : '0.6px #FFF',
                  paintOrder: 'stroke fill',
                }}
              >
                {boss?.name || '…'}
              </span>{' '}
              {t('game.wants')} {isLike ? t('game.like') : t('game.dislike')}
            </div>
            {isLike ? (
              <Heart size={40} fill="#000" strokeWidth={0} className="shrink-0" />
            ) : (
              <HeartCrack size={40} color="#FFF" strokeWidth={2.5} className="shrink-0" />
            )}
          </div>
        </div>

        {/* Consigne d'action explicite : sans ca, un nouveau joueur ne sait pas
            quoi poser (retour recurrent des testeurs). */}
        <div className="px-4 -mt-2 pb-2 max-w-xl mx-auto w-full text-center">
          <span
            style={{ fontFamily: '"Anton", sans-serif' }}
            className="text-lg uppercase leading-tight"
          >
            {t('game.playHintPre')}{' '}
            <span style={{ color: PINK }}>
              {isLike ? t('game.playHintLike') : t('game.playHintDislike')}
            </span>{' '}
            {t('game.playHintPost')}
          </span>
        </div>

        <div className="flex-1 px-4 overflow-y-auto pb-32">
          <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
            {orderedHandIds.map((cid) => {
              const card = pool[cid];
              if (!card) return null;
              const isSel = selectedCard === cid;
              const isSpicy = card.spicy;
              return (
                <button
                  key={cid}
                  onClick={() => setSelectedCard(cid)}
                  style={{
                    backgroundColor: isSel ? PINK : '#FFF',
                    color: isSel ? '#FFF' : '#000',
                    boxShadow: isSel ? '6px 6px 0 #000' : '4px 4px 0 #000',
                    transform: isSel ? 'translate(-2px, -2px)' : 'none',
                    transition: 'all 120ms',
                    minHeight: '100px',
                  }}
                  className={`border-4 border-black p-3 pt-5 text-center flex items-center justify-center relative${freshCards[cid] ? ' card-draw' : ''}`}
                >
                  {/* Petit badge catégorie, discret en haut à droite */}
                  <span
                    className="absolute top-1.5 right-2 text-base leading-none opacity-70 select-none"
                    aria-hidden
                  >
                    {catEmojiOf(card)}
                  </span>
                  <div
                    style={{
                      fontFamily: '"Anton", sans-serif',
                      lineHeight: 0.95,
                      fontSize: fitCard(card.t),
                    }}
                    className="uppercase"
                  >
                    {card.t}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="fixed bottom-0 left-0 right-0 p-4 border-t-4 border-black"
          style={{ backgroundColor: baseColor }}
        >
          <div className="max-w-xl mx-auto">
            {timerActive && !isBoss && !iHavePlayed && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-lg leading-none" aria-hidden>
                  ⏱
                </span>
                <span
                  style={{
                    fontFamily: '"Anton", sans-serif',
                    color: timerRemaining <= 5 ? DISLIKE_RED : '#000',
                  }}
                  className="text-2xl uppercase leading-none tabular-nums"
                >
                  {timerRemaining}s
                </span>
                {timerRemaining <= 5 && (
                  <span
                    style={{ fontFamily: '"Space Mono", monospace', color: DISLIKE_RED }}
                    className="text-[10px] uppercase tracking-widest"
                  >
                    {t('game.hurry')}
                  </span>
                )}
              </div>
            )}
            {(sorts.reroll || sorts.vatout) &&
              (sortsOpen ? (
                <div className="flex gap-2 mb-2 items-stretch">
                  {sorts.reroll && (
                    <button
                      onClick={() => setConfirmSort('reroll')}
                      disabled={busy || myUsed.reroll}
                      className="flex-1 border-4 border-black bg-white py-2 disabled:opacity-30 active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-1.5"
                      style={{ boxShadow: '4px 4px 0 #000' }}
                    >
                      <span className="text-lg leading-none">🎲</span>
                      <span
                        style={{ fontFamily: '"Anton", sans-serif' }}
                        className="text-sm uppercase leading-none"
                      >
                        {myUsed.reroll ? t('game.rerollUsed') : t('game.reroll')}
                      </span>
                    </button>
                  )}
                  {sorts.vatout && (
                    <button
                      onClick={() => {
                        if (myUsed.vatout) return;
                        // Deja arme → on desarme direct ; sinon → modal de confirm.
                        if (vatoutArmed) setVatoutArmed(false);
                        else setConfirmSort('vatout');
                      }}
                      disabled={busy || myUsed.vatout}
                      className="flex-1 border-4 border-black py-2 disabled:opacity-30 active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: vatoutArmed ? DISLIKE_RED : '#FFF',
                        color: vatoutArmed ? '#FFF' : '#000',
                        boxShadow: '4px 4px 0 #000',
                      }}
                    >
                      <span className="text-lg leading-none">🔥</span>
                      <span
                        style={{ fontFamily: '"Anton", sans-serif' }}
                        className="text-sm uppercase leading-none"
                      >
                        {myUsed.vatout
                          ? t('game.x2Used')
                          : vatoutArmed
                            ? t('game.x2On')
                            : 'x2'}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => setSortsOpen(false)}
                    aria-label={t('common.close')}
                    className="border-4 border-black bg-black text-white px-3 active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center"
                    style={{ boxShadow: '4px 4px 0 #000' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-center mb-2">
                  <button
                    onClick={() => setSortsOpen(true)}
                    className="border-4 border-black bg-white px-3 py-1.5 active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-1.5"
                    style={{
                      boxShadow: '4px 4px 0 #000',
                      backgroundColor: vatoutArmed ? DISLIKE_RED : '#FFF',
                      color: vatoutArmed ? '#FFF' : '#000',
                    }}
                  >
                    <Zap size={16} fill="currentColor" strokeWidth={0} />
                    <span
                      style={{ fontFamily: '"Anton", sans-serif' }}
                      className="text-sm uppercase leading-none"
                    >
                      {vatoutArmed ? t('game.x2Armed') : t('game.spellsBtn')}
                    </span>
                  </button>
                </div>
              ))}
            <button
              onClick={playCard}
              disabled={!selectedCard || busy}
              className="w-full border-4 border-black py-4 disabled:opacity-30 active:translate-x-[2px] active:translate-y-[2px]"
              style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '6px 6px 0 #000' }}
            >
              <div className="flex items-center justify-center gap-3">
                <span
                  style={{ fontFamily: '"Anton", sans-serif' }}
                  className="text-xl uppercase tracking-wide"
                >
                  {selectedCard
                    ? vatoutArmed
                      ? t('game.playX2')
                      : t('game.playCard')
                    : t('game.pickCard')}
                </span>
                {selectedCard && <ChevronRight size={24} />}
              </div>
            </button>
            {confirmSort && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
                onClick={() => setConfirmSort(null)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm border-4 border-black bg-white p-6 text-center gage-pop"
                  style={{ boxShadow: '10px 10px 0 #000' }}
                >
                  <div className="text-5xl leading-none mb-3" aria-hidden>
                    {SORT_CONFIRM[confirmSort].emoji}
                  </div>
                  <div
                    style={{ fontFamily: '"Anton", sans-serif' }}
                    className="text-3xl uppercase mb-3 text-black"
                  >
                    {t(`game.sortConfirm.${confirmSort}.title`)}
                  </div>
                  <p
                    style={{ fontFamily: '"Space Mono", monospace' }}
                    className="text-sm text-black/80 mb-6 leading-snug"
                  >
                    {t(`game.sortConfirm.${confirmSort}.body`)}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmSort(null)}
                      style={{ fontFamily: '"Anton", sans-serif', boxShadow: '4px 4px 0 #000' }}
                      className="flex-1 border-4 border-black bg-white text-black py-3 text-lg uppercase active:translate-x-[2px] active:translate-y-[2px]"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={confirmSortAction}
                      style={{
                        fontFamily: '"Anton", sans-serif',
                        backgroundColor: DISLIKE_RED,
                        color: '#FFF',
                        boxShadow: '4px 4px 0 #000',
                      }}
                      className="flex-1 border-4 border-black py-3 text-lg uppercase active:translate-x-[2px] active:translate-y-[2px]"
                    >
                      {t(`game.sortConfirm.${confirmSort}.cta`)}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============ PHASE: REVEAL ============
  if (room.phase === 'reveal') {
    if (isBoss) {
      return (
        <div key={room.phase} style={baseWrap} className={`relative text-black flex flex-col ${baseClass}`}>
          <ReactionsLayer reactions={room.reactions} />
          <TopBar right={t('game.cardsCount', { n: playedEntries.length })} />
          <Scoreboard />
          <div className="px-5 pt-3 pb-2 max-w-xl mx-auto w-full">
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest opacity-60"
            >
              {t('game.yourTurnChoose')}
            </div>
            <div
              style={{ fontFamily: '"Anton", sans-serif', lineHeight: 0.95 }}
              className="text-2xl uppercase mt-1"
            >
              {t('game.chooseCard')}{' '}
              <span style={{ color: room.mode === 'like' ? '#000' : PINK }}>
                {room.mode === 'like' ? t('game.likeMost') : t('game.likeLeast')}
              </span>
            </div>
          </div>
          <div className="flex-1 px-4 pt-6 pb-32 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6 mt-1 max-w-xl mx-auto">
              {playedEntries.map((entry, i) => {
                const card = pool[entry.cardId];
                if (!card) return null;
                const isSel = room.bossPick === entry.cardId;
                const rot = i % 2 === 0 ? '-1.5deg' : '1.5deg';
                return (
                  <button
                    key={entry.cardId}
                    onClick={() => {
                      set(
                        ref(db, `rooms/${roomCode}/bossPick`),
                        entry.cardId
                      ).catch(() => {});
                    }}
                    disabled={busy}
                    style={{
                      backgroundColor: '#FFF',
                      color: '#000',
                      boxShadow: isSel ? '8px 8px 0 #000' : '5px 5px 0 #000',
                      transform: isSel
                        ? `rotate(${rot}) translate(-3px, -3px)`
                        : `rotate(${rot})`,
                      outline: isSel ? `4px solid ${PINK}` : 'none',
                      outlineOffset: isSel ? '3px' : '0',
                      minHeight: '120px',
                      transition: 'all 120ms',
                    }}
                    className="border-4 border-black p-4 pt-6 text-center flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] relative"
                  >
                    <span
                      className="absolute top-1.5 right-2 text-base leading-none opacity-70 select-none"
                      aria-hidden
                    >
                      {catEmojiOf(card)}
                    </span>
                    <div
                      style={{
                        fontFamily: '"Anton", sans-serif',
                        lineHeight: 0.95,
                        fontSize: fitCard(card.t),
                      }}
                      className="uppercase"
                    >
                      {card.t}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="fixed bottom-0 left-0 right-0 p-4 border-t-4 border-black"
            style={{ backgroundColor: baseColor }}
          >
            <div className="max-w-xl mx-auto">
              <button
                onClick={() => {
                  const entry = playedEntries.find((e) => e.cardId === room.bossPick);
                  if (entry) bossPickWinner(entry);
                }}
                disabled={!room.bossPick || busy}
                className="w-full border-4 border-black py-4 disabled:opacity-30 active:translate-x-[2px] active:translate-y-[2px]"
                style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '6px 6px 0 #000' }}
              >
                <div className="flex items-center justify-center gap-3">
                  <span
                    style={{ fontFamily: '"Anton", sans-serif' }}
                    className="text-xl uppercase tracking-wide"
                  >
                    {room.bossPick ? t('game.confirmChoice') : t('game.pickCard')}
                  </span>
                  {room.bossPick && <ChevronRight size={24} />}
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Non-boss: MODE PROJECTEUR — fond noir, le boss "scanne" les cartes.
    // Changement radical de fond (noir au lieu du jaune) = signal visuel le
    // plus fort que ce n'est PAS a moi de jouer, sans rien avoir a lire.
    const revealIsLike = room.mode === 'like';
    const modeColor = revealIsLike ? LIKE_GREEN : DISLIKE_RED;
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }} className="relative text-white flex flex-col">
        <ReactionsLayer reactions={room.reactions} />
        <TopBar right={t('game.cardsCount', { n: playedEntries.length })} />
        <Scoreboard />

        {/* Entete projecteur : gros nom du boss qui pulse + halo couleur du mode */}
        <div className="relative px-4 pt-6 pb-4 text-center overflow-hidden">
          <div
            className="boss-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              width: 320,
              height: 220,
              background: `radial-gradient(ellipse at center, ${bossColor || modeColor}66 0%, transparent 70%)`,
              filter: 'blur(10px)',
            }}
            aria-hidden
          />
          <div className="relative flex flex-col items-center">
            <Eye size={28} color={modeColor} strokeWidth={2.5} className="mb-1 animate-pulse" />
            <div
              style={{
                fontFamily: '"Anton", sans-serif',
                lineHeight: 0.9,
                fontSize: fitBig(boss?.name || ''),
                color: bossColor || '#FFF',
                letterSpacing: '0.06em',
              }}
              className="uppercase break-words"
            >
              {boss?.name || '…'}
            </div>
            <div
              className="inline-flex items-center gap-2 mt-2 border-2 px-3 py-1"
              style={{ borderColor: modeColor, color: modeColor }}
            >
              {revealIsLike ? (
                <Heart size={16} fill={modeColor} strokeWidth={0} />
              ) : (
                <HeartCrack size={16} color={modeColor} strokeWidth={2.5} />
              )}
              <span
                style={{ fontFamily: '"Anton", sans-serif' }}
                className="text-base uppercase leading-none"
              >
                {t('game.chooses')} {revealIsLike ? t('game.likes') : t('game.dislikes')}
              </span>
            </div>
            {sorts.espion && (
              <button
                onClick={() =>
                  !myUsed.espion && !espionDone && setEspionArming((v) => !v)
                }
                disabled={myUsed.espion || espionDone}
                className="mt-3 inline-flex items-center gap-2 border-2 px-3 py-1.5 disabled:opacity-40"
                style={{
                  borderColor: espionArming ? YELLOW : '#666',
                  backgroundColor: espionArming ? YELLOW : 'transparent',
                  color: espionArming ? '#000' : '#FFF',
                }}
              >
                <span className="text-base leading-none">🕵️</span>
                <span
                  style={{ fontFamily: '"Anton", sans-serif' }}
                  className="text-sm uppercase leading-none"
                >
                  {myUsed.espion || espionDone
                    ? t('game.spyUsed')
                    : espionArming
                      ? t('game.spyTap')
                      : t('game.spy')}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Cartes sombres "sur scene" + faisceau de projecteur qui balaie.
            pt-6 : marge en haut pour que la carte selectionnee (scale + halo)
            ne soit pas rognee par le bord du conteneur qui scrolle. */}
        <div className="flex-1 px-4 pt-6 pb-8 overflow-y-auto">
          <div className="relative max-w-xl mx-auto">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 spotlight-sweep z-10"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)',
              }}
              aria-hidden
            />
            <div className="grid grid-cols-2 gap-6 mt-1">
              {playedEntries.map((entry, i) => {
                const card = pool[entry.cardId];
                if (!card) return null;
                const isBossPick = room.bossPick === entry.cardId;
                const rot = i % 2 === 0 ? '-1.5deg' : '1.5deg';
                const revealed = espionReveal[entry.cardId];
                const author = playerById[entry.playerId];
                return (
                  <div
                    key={i}
                    onClick={() => consumeEspion(entry.cardId)}
                    style={{
                      backgroundColor: isBossPick ? '#FFF' : '#33333a',
                      color: isBossPick ? '#000' : '#c9c9d2',
                      borderColor: isBossPick
                        ? PINK
                        : espionArming && !revealed
                          ? YELLOW
                          : '#55555f',
                      boxShadow: isBossPick
                        ? `0 0 0 4px ${PINK}, 0 0 32px ${PINK}`
                        : 'none',
                      opacity: isBossPick ? 1 : 0.82,
                      transform: isBossPick
                        ? `rotate(${rot}) scale(1.06)`
                        : `rotate(${rot})`,
                      minHeight: '120px',
                      transition: 'all 160ms',
                      cursor: espionArming && !revealed ? 'pointer' : 'default',
                    }}
                    className="border-4 p-4 pt-6 text-center flex items-center justify-center relative"
                  >
                    <span
                      className="absolute top-1.5 right-2 text-base leading-none select-none"
                      style={{ filter: isBossPick ? 'none' : 'grayscale(0.6)', opacity: isBossPick ? 0.85 : 0.6 }}
                      aria-hidden
                    >
                      {catEmojiOf(card)}
                    </span>
                    <div
                      style={{
                        fontFamily: '"Anton", sans-serif',
                        lineHeight: 0.95,
                        fontSize: fitCard(card.t),
                      }}
                      className="uppercase"
                    >
                      {card.t}
                    </div>
                    {revealed && author && (
                      <div
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 border-2 border-black px-2 py-0.5 whitespace-nowrap"
                        style={{
                          backgroundColor: colorHex(author.color) || '#000',
                          fontFamily: '"Anton", sans-serif',
                          boxShadow: '2px 2px 0 #000',
                        }}
                      >
                        <span style={NAME_STYLE} className="text-sm uppercase leading-none">
                          🕵️ {author.name || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Barre de reactions : les spectateurs animent le moment reveal. */}
        <div
          className="sticky bottom-0 left-0 right-0 z-30 flex justify-center gap-2 px-4 py-3 border-t border-white/10"
          style={{ backgroundColor: 'rgba(10,10,10,0.85)' }}
        >
          {REACTIONS.map((e) => (
            <button
              key={e}
              onClick={() => sendReaction(e)}
              className="text-3xl leading-none active:scale-90 transition-transform"
              style={{ transition: 'transform 80ms' }}
              aria-label={t('game.reactAria', { e })}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ============ PHASE: RESULT ============
  if (room.phase === 'result' && room.winnerInfo) {
    const winnerP = playerById[room.winnerInfo.playerId];
    const winnerCard = pool[room.winnerInfo.cardId];
    const winnerUsedVatout = !!room.vatout?.[room.winnerInfo.playerId];
    const winnerDoubleRound = room.special === 'double';
    // x2 (sort) et manche "double" se MULTIPLIENT : 1 → x2 → x2 = jusqu'a x4.
    const winnerGain = 1 * (winnerUsedVatout ? 2 : 1) * (winnerDoubleRound ? 2 : 1);
    // Jackpot : les DEUX x2 cumules (sort + manche double) → x4.
    const jackpot = winnerUsedVatout && winnerDoubleRound;
    const winnerNewScore = (winnerP?.score || 0) + winnerGain;
    const willWinGame = winnerNewScore >= (room.settings?.winningScore ?? WINNING_SCORE);
    const iAmWinner = room.winnerInfo.playerId === playerId;

    return (
      <div key={room.phase} style={baseWrap} className={`text-black flex flex-col ${baseClass}`}>
        <TopBar />
        <Scoreboard />
        {jackpot && (
          <JackpotAnnounce
            key={room.round}
            apero={partyMode}
            winnerName={winnerP?.name}
          />
        )}
        {/* Petits feux d'artifice sur l'ecran du gagnant (hors jackpot, qui a
            deja son gros slam). Places en peripherie pour ne pas cacher le nom. */}
        {iAmWinner && !jackpot && (
          <div className="pointer-events-none fixed inset-0 z-40" aria-hidden>
            <span className="fw" style={{ top: '16%', left: '15%' }} />
            <span className="fw" style={{ top: '20%', left: '85%', animationDelay: '0.3s' }} />
            <span className="fw" style={{ top: '40%', left: '10%', animationDelay: '0.6s' }} />
            <span className="fw" style={{ top: '44%', left: '90%', animationDelay: '0.9s' }} />
            <span className="fw" style={{ top: '68%', left: '20%', animationDelay: '1.2s' }} />
            <span className="fw" style={{ top: '72%', left: '80%', animationDelay: '1.5s' }} />
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-6 max-w-xl mx-auto w-full">
          {partyMode ? (
            <>
              {/* ---- ZONE 1 : resultat de la manche, COMPACT ----
                  Carte gagnante ENCADREE (le pseudo designe plus bas est nu). */}
              <div
                className="border-4 border-black px-5 py-4 mb-4 max-w-sm w-full relative"
                style={{
                  backgroundColor: '#FFF',
                  color: '#000',
                  boxShadow: '5px 5px 0 #000',
                  transform: 'rotate(-1.5deg)',
                }}
              >
                <span
                  className="absolute top-1 right-2 text-base leading-none opacity-80 select-none"
                  aria-hidden
                >
                  {catEmojiOf(winnerCard)}
                </span>
                <div
                  style={{
                    fontFamily: '"Anton", sans-serif',
                    lineHeight: 0.95,
                    fontSize: fitCard(winnerCard?.t || ''),
                  }}
                  className="uppercase"
                >
                  {winnerCard?.t || '?'}
                </div>
              </div>
              <div className="mb-9 flex flex-col items-center gap-1">
                <span
                  style={{ fontFamily: '"Space Mono", monospace' }}
                  className="text-[11px] uppercase tracking-widest opacity-70"
                >
                  {t('game.playedBy')}
                </span>
                <div
                  style={{
                    fontFamily: '"Anton", sans-serif',
                    color: colorHex(winnerP?.color) || '#000',
                    WebkitTextStroke: '3px #000',
                    paintOrder: 'stroke fill',
                    fontSize: fitBig(winnerP?.name || ''),
                    lineHeight: 1,
                    letterSpacing: '0.04em',
                  }}
                  className="uppercase break-words"
                >
                  {winnerP?.name || '?'}
                </div>
                <span
                  style={{
                    backgroundColor: PINK,
                    color: '#FFF',
                    border: '2px solid #000',
                    fontFamily: '"Space Mono", monospace',
                  }}
                  className="px-2 py-0.5 text-[11px] uppercase tracking-widest mt-1"
                >
                  +{winnerGain} PT{winnerGain > 1 ? 'S' : ''} {iAmWinner && '🎉'}
                </span>
              </div>

              {/* ---- ZONE 2 : la regle a boire, LA VEDETTE ---- */}
              <div className="w-full border-t-4 border-black/15 pt-8 flex flex-col items-center gap-2">
                {(() => {
                  // Exclus du defi : le gagnant (il ne boit pas) et le boss.
                  const excluded = [room.winnerInfo.playerId, room.bossId];
                  // Gage FIGE par le host (source de verite, identique pour tous).
                  // Fallback sur le calcul local uniquement pour les parties
                  // demarrees avant ce correctif (winnerInfo.gage absent).
                  const gage =
                    room.winnerInfo.gage ||
                    gageOf(
                      winnerCard,
                      room.winnerInfo.cardId,
                      room.round || 1,
                      room.players,
                      excluded,
                      room.settings?.lang
                    );
                  const eligible = players.filter(
                    (p) => !excluded.includes(p.id)
                  );
                  if (gage.targetId) {
                    return (
                      <div className="flex flex-col items-center gap-3">
                        {/* Slam plein ecran APRES la roulette : le suspense
                            d'abord, la sentence impossible a rater ensuite. */}
                        {gageRouletteDone && (
                          <GageAnnounce
                            key={room.round}
                            text={gage.text}
                            targetName={playerById[gage.targetId]?.name}
                            targetColor={colorHex(playerById[gage.targetId]?.color)}
                          />
                        )}
                        {!gageRouletteDone && (
                          <div
                            style={{ fontFamily: '"Space Mono", monospace' }}
                            className="text-[11px] uppercase tracking-widest opacity-70 mb-2"
                          >
                            Qui s'y colle ?
                          </div>
                        )}
                        <GageRoulette
                          players={eligible}
                          targetId={gage.targetId}
                          onDone={() => setGageRouletteDone(true)}
                        />
                        {gageRouletteDone && (
                          <div
                            style={{
                              fontFamily: '"Anton", sans-serif',
                              backgroundColor: PINK,
                              color: '#FFF',
                              boxShadow: '6px 6px 0 #000',
                              transform: 'rotate(1deg)',
                              lineHeight: 1.1,
                            }}
                            className="inline-block border-4 border-black px-6 py-5 text-2xl uppercase max-w-sm gage-pop"
                          >
                            {gage.text}
                          </div>
                        )}
                        {gageRouletteDone && (
                          <DefiChrono
                            text={gage.text}
                            chrono={room.chrono}
                            isHost={isHost}
                            onStart={startChrono}
                            onStop={stopChrono}
                          />
                        )}
                      </div>
                    );
                  }
                  // Regle de VOTE (« Vote : ... ») → badge dedie + texte epure.
                  const isVote = /^vote\s*:/i.test(gage.text);
                  const ruleText = isVote
                    ? gage.text.replace(/^vote\s*:\s*/i, '')
                    : gage.text;
                  // Pour un vote, on detache la consequence (« boit 2 » /
                  // « distribue 2 ») du sujet -> petite pastille, pas de pronom
                  // (jamais faux) et pas de bloc « sujet + verbe » colle.
                  const voteMatch = isVote
                    ? ruleText.match(/^(.*?)\s+((?:boit|distribue|drinks?|downs?|hands? out)\s+\d+)\s*$/i)
                    : null;
                  const voteSubject = voteMatch ? voteMatch[1] : ruleText;
                  const voteConseq = voteMatch ? voteMatch[2] : null;
                  return (
                    <>
                      {/* Slam plein ecran a l'arrivee sur le resultat (sauf
                          jackpot, qui a deja son propre gros slam x4). */}
                      {!jackpot && (
                        <GageAnnounce
                          key={room.round}
                          text={gage.text}
                          delay={2000}
                        />
                      )}
                      {/* Regle de VOTE : « VOTEZ POUR : » (jaune) au-dessus du
                          sujet, et la consequence (« boit 2 ») en pastille. */}
                      <div
                        style={{
                          fontFamily: '"Anton", sans-serif',
                          backgroundColor: PINK,
                          color: '#FFF',
                          boxShadow: '6px 6px 0 #000',
                          transform: 'rotate(1deg)',
                          lineHeight: 1.15,
                        }}
                        className="inline-block border-4 border-black px-6 py-5 text-2xl uppercase max-w-sm"
                      >
                        {isVote ? (
                          <>
                            <span
                              style={{ color: YELLOW }}
                              className="block mb-1"
                            >
                              {t('game.voteFor')}
                            </span>
                            {voteSubject}
                            {voteConseq && (
                              <span
                                style={{
                                  backgroundColor: YELLOW,
                                  color: '#000',
                                  boxShadow: '3px 3px 0 #000',
                                }}
                                className="inline-block border-2 border-black px-3 py-1 text-lg ml-2 align-middle whitespace-nowrap"
                              >
                                {voteConseq}
                              </span>
                            )}
                          </>
                        ) : (
                          ruleText
                        )}
                      </div>
                      <DefiChrono
                        text={gage.text}
                        chrono={room.chrono}
                        isHost={isHost}
                        onStart={startChrono}
                        onStop={stopChrono}
                      />
                      <div
                        style={{ fontFamily: '"Space Mono", monospace', color: '#000' }}
                        className="text-base font-bold uppercase tracking-wide mt-5"
                      >
                        {t('game.bossWinnerNoDrink')}
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <>
              {/* Mise en page COMPACTE (retour utilisateur : "trop de trucs
                  écrits à l'écran") : la carte, le prénom et le +1 racontent
                  l'histoire sans micro-labels, comme le résultat apéro. */}
              <div
                className="border-4 border-black p-6 mb-5 max-w-sm w-full relative"
                style={{
                  backgroundColor: '#FFF',
                  color: '#000',
                  boxShadow: '8px 8px 0 #000',
                  transform: 'rotate(-2deg)',
                }}
              >
                <div
                  style={{
                    fontFamily: '"Anton", sans-serif',
                    lineHeight: 0.92,
                    fontSize: fitBig(winnerCard?.t || ''),
                  }}
                  className="uppercase"
                >
                  {winnerCard?.t || '?'}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <div
                  style={{
                    fontFamily: '"Anton", sans-serif',
                    lineHeight: 1.05,
                    fontSize: fitBig(winnerP?.name || ''),
                    color: colorHex(winnerP?.color) || '#000',
                    WebkitTextStroke: '5px #000',
                    paintOrder: 'stroke fill',
                    letterSpacing: '0.08em',
                  }}
                  className="uppercase break-words"
                >
                  {winnerP?.name || '?'}
                </div>
                <div
                  style={{
                    fontFamily: '"Anton", sans-serif',
                    backgroundColor: LIKE_GREEN,
                    color: '#000',
                    boxShadow: '4px 4px 0 #000',
                    transform: 'rotate(3deg)',
                  }}
                  className="inline-block border-4 border-black px-3 py-2 text-2xl uppercase shrink-0"
                >
                  +{winnerGain} {winnerGain > 1 ? t('game.points') : t('game.point')}
                </div>
              </div>
              {winnerGain > 1 && !jackpot && (
                <div
                  style={{
                    fontFamily: '"Anton", sans-serif',
                    backgroundColor: DISLIKE_RED,
                    color: '#FFF',
                    boxShadow: '4px 4px 0 #000',
                    transform: 'rotate(-2deg)',
                  }}
                  className="inline-block border-4 border-black px-3 py-1 text-lg uppercase mt-3 ml-2"
                >
                  🔥 {t('game.x2Success')}
                </div>
              )}

              {/* ---- DEFI FUN (mode normal, ~1 manche sur 2) : le pendant
                  sans alcool des gages apero. Fige par le host dans
                  winnerInfo.defi. Cible ('@') → roulette puis slam ; sinon
                  slam a l'arrivee (sauf jackpot, qui a deja le sien). ---- */}
              {room.winnerInfo.defi && (() => {
                const defi = room.winnerInfo.defi;
                const excluded = [room.winnerInfo.playerId, room.bossId];
                const eligible = players.filter((p) => !excluded.includes(p.id));
                const defiKicker = `🎯 ${t('game.defiAnnounce')}`;
                if (defi.targetId) {
                  return (
                    <div className="w-full border-t-4 border-black/15 pt-6 mt-8 flex flex-col items-center gap-3">
                      {gageRouletteDone && (
                        <GageAnnounce
                          key={room.round}
                          kicker={defiKicker}
                          text={defi.text}
                          targetName={playerById[defi.targetId]?.name}
                          targetColor={colorHex(playerById[defi.targetId]?.color)}
                        />
                      )}
                      {!gageRouletteDone && (
                        <div
                          style={{ fontFamily: '"Space Mono", monospace' }}
                          className="text-[11px] uppercase tracking-widest opacity-70 mb-2"
                        >
                          {t('game.whoGetsIt')}
                        </div>
                      )}
                      <GageRoulette
                        players={eligible}
                        targetId={defi.targetId}
                        onDone={() => setGageRouletteDone(true)}
                      />
                      {gageRouletteDone && (
                        <div
                          style={{
                            fontFamily: '"Anton", sans-serif',
                            backgroundColor: PINK,
                            color: '#FFF',
                            boxShadow: '6px 6px 0 #000',
                            transform: 'rotate(1deg)',
                            lineHeight: 1.1,
                          }}
                          className="inline-block border-4 border-black px-6 py-5 text-2xl uppercase max-w-sm gage-pop"
                        >
                          {defi.text}
                        </div>
                      )}
                      {gageRouletteDone && (
                        <DefiChrono
                          text={defi.text}
                          chrono={room.chrono}
                          isHost={isHost}
                          onStart={startChrono}
                          onStop={stopChrono}
                        />
                      )}
                    </div>
                  );
                }
                const isVote = /^vote\s*:/i.test(defi.text);
                const defiText = isVote
                  ? defi.text.replace(/^vote\s*:\s*/i, '')
                  : defi.text;
                return (
                  <div className="w-full border-t-4 border-black/15 pt-6 mt-8 flex flex-col items-center gap-2">
                    {!jackpot && (
                      <GageAnnounce
                        key={room.round}
                        kicker={defiKicker}
                        text={defi.text}
                        delay={2000}
                      />
                    )}
                    <div
                      style={{
                        fontFamily: '"Anton", sans-serif',
                        backgroundColor: PINK,
                        color: '#FFF',
                        boxShadow: '6px 6px 0 #000',
                        transform: 'rotate(1deg)',
                        lineHeight: 1.15,
                      }}
                      className="inline-block border-4 border-black px-6 py-5 text-2xl uppercase max-w-sm"
                    >
                      {isVote && (
                        <span style={{ color: YELLOW }} className="block mb-1">
                          {t('game.voteFor')}
                        </span>
                      )}
                      {defiText}
                    </div>
                    <DefiChrono
                      text={defi.text}
                      chrono={room.chrono}
                      isHost={isHost}
                      onStart={startChrono}
                      onStop={stopChrono}
                    />
                  </div>
                );
              })()}
            </>
          )}
        </div>

        <div
          className="p-4 border-t-4 border-black"
          style={{ backgroundColor: baseColor }}
        >
          {/* Fin de partie ou gagnant absent → chemin classique via l'hote.
              Sinon : le GAGNANT lance lui-meme la manche suivante (J'aime /
              J'aime pas directement ici, plus d'ecran d'attente). */}
          {willWinGame || !winnerP ? (
            isHost ? (
              <button
                onClick={continueAfterResult}
                disabled={busy}
                className="w-full border-4 border-black py-4 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
                style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '6px 6px 0 #000' }}
              >
                <div className="flex items-center justify-center gap-3">
                  <span
                    style={{ fontFamily: '"Anton", sans-serif' }}
                    className="text-xl uppercase tracking-wide"
                  >
                    {willWinGame
                      ? t('game.seeWinner')
                      : t('game.turnOf', { name: winnerP?.name })}
                  </span>
                  <ChevronRight size={24} />
                </div>
              </button>
            ) : (
              <div
                style={{ fontFamily: '"Space Mono", monospace' }}
                className="text-[10px] uppercase tracking-widest text-center py-3 opacity-60"
              >
                {t('game.waitHostContinue')}
              </div>
            )
          ) : iAmWinner ? (
            <WinnerNextChoice
              chrono={room.chrono}
              busy={busy}
              onPick={winnerStartNextRound}
              hasAction={
                !!(room.winnerInfo.defi || (partyMode && room.winnerInfo.gage))
              }
            />
          ) : (
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest text-center py-3 opacity-60"
            >
              {t('game.winnerWillStart', { name: winnerP?.name })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ PHASE: GAME_OVER ============
  if (room.phase === 'game_over') {
    const ranked = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const champ = ranked[0];
    return (
      <div key={room.phase} style={baseWrap} className={`text-black flex flex-col ${baseClass}`}>
        <TopBar />
        {/* Feux d'artifice : c'est le climax de la partie, on celebre le champion. */}
        <div className="pointer-events-none fixed inset-0 z-40" aria-hidden>
          <span className="fw" style={{ top: '14%', left: '14%' }} />
          <span className="fw" style={{ top: '18%', left: '86%', animationDelay: '0.3s' }} />
          <span className="fw" style={{ top: '40%', left: '8%', animationDelay: '0.6s' }} />
          <span className="fw" style={{ top: '44%', left: '92%', animationDelay: '0.9s' }} />
          <span className="fw" style={{ top: '70%', left: '18%', animationDelay: '1.2s' }} />
          <span className="fw" style={{ top: '74%', left: '82%', animationDelay: '1.5s' }} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-8 max-w-xl mx-auto w-full">
          <Trophy size={80} strokeWidth={2.5} />
          <div
            style={{ fontFamily: '"Space Mono", monospace' }}
            className="text-[10px] uppercase tracking-widest opacity-60 mt-4 mb-2"
          >
            {partyMode ? t('game.kingOfNight') : t('game.champOfDay')}
          </div>
          <div
            style={{
              fontFamily: '"Anton", sans-serif',
              lineHeight: 0.85,
              fontSize: fitBig(champ?.name || ''),
              color: colorHex(champ?.color) || '#000',
              WebkitTextStroke: '5px #000',
              paintOrder: 'stroke fill',
              letterSpacing: '0.08em',
            }}
            className="uppercase mb-8 break-words"
          >
            {champ?.name || '?'}
          </div>

          <div className="w-full max-w-sm space-y-2 mb-8">
            {ranked.map((p, i) => {
              const pColor = colorHex(p.color);
              const bg = pColor || (i === 0 ? '#000' : '#FFF');
              // Contraste calcule par luminance (colorFg) : lisible sur
              // toutes les couleurs de joueur.
              const fg = pColor ? colorFg(p.color) : (i === 0 ? YELLOW : '#000');
              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: bg,
                    color: fg,
                    boxShadow: i === 0 ? '6px 6px 0 #000' : '4px 4px 0 #000',
                  }}
                  className={`border-4 border-black px-4 flex items-center justify-between ${
                    i === 0 ? 'py-5' : 'py-3'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {i === 0 ? (
                      <Crown
                        size={26}
                        fill="currentColor"
                        strokeWidth={1.5}
                        className="shrink-0"
                      />
                    ) : (
                      <span
                        style={{ fontFamily: '"Space Mono", monospace' }}
                        className="text-xs opacity-70 shrink-0"
                      >
                        #{i + 1}
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: '"Anton", sans-serif',
                        letterSpacing: '0.05em',
                        ...NAME_STYLE,
                      }}
                      className={`uppercase leading-none truncate ${
                        i === 0 ? 'text-3xl' : 'text-xl'
                      }`}
                    >
                      {p.name}
                    </span>
                    {(room.wins?.[p.id] || 0) > 0 && (
                      <span
                        style={{ fontFamily: '"Space Mono", monospace' }}
                        className="text-xs whitespace-nowrap shrink-0"
                        title={t('game.winsTooltip')}
                      >
                        🏆×{room.wins[p.id]}
                      </span>
                    )}
                  </div>
                  <span
                    style={{ fontFamily: '"Anton", sans-serif' }}
                    className={`shrink-0 pl-2 ${i === 0 ? 'text-4xl' : 'text-2xl'}`}
                  >
                    {p.score || 0}
                  </span>
                </div>
              );
            })}
          </div>

          {isHost ? (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={replayGame}
                disabled={busy}
                className="border-4 border-black py-4 px-8 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
                style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '6px 6px 0 #000' }}
              >
                <span
                  style={{ fontFamily: '"Anton", sans-serif' }}
                  className="text-2xl uppercase"
                >
                  🔁 {t('game.replay')}
                </span>
              </button>
              <button
                onClick={backToLobby}
                disabled={busy}
                className="border-4 border-black py-2.5 px-5 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
                style={{ backgroundColor: '#FFF', color: '#000', boxShadow: '4px 4px 0 #000' }}
              >
                <span
                  style={{ fontFamily: '"Anton", sans-serif' }}
                  className="text-base uppercase"
                >
                  {t('game.backToLobby')}
                </span>
              </button>
            </div>
          ) : (
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest opacity-60"
            >
              {t('game.waitHost')}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
