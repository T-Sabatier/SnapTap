import { useState, useEffect, useRef } from 'react';
import { ref, update, remove, set } from 'firebase/database';
import { LogOut, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { db } from '../firebase';
import { toArray } from '../utils';
import { YELLOW, AMBER, PINK, LIKE_GREEN, DISLIKE_RED, colorHex, colorFg } from '../cards';
import {
  MOUTON_AT,
  DEBATS_DEFAULT_COUNT,
  GAGE_VOTE_MS,
  pickDebatQuestions,
  pickGageOptions,
} from '../debats';
import { useT } from '../i18n.jsx';
import { bumpStats } from '../stats';

// MODE DÉBATS (spec MODE-SANS-FILTRE.md) : une question OUI/NON tombe sur
// tous les tels, chacun répond en secret, on révèle les camps. Le camp
// minoritaire prend une marque 🐑 ; à MOUTON_AT marques → MOUTON NOIR (slam
// plein écran, 2 gorgées en Apéro, juste le titre en Normal) et retour à 0.
//
// Phases : debat_vote → debat_reveal → (question suivante | debat_end).
// En Normal (sans alcool), un mouton noir déclenche en plus :
// debat_reveal → debat_gage (la TABLE vote parmi 3 gages, 15 s) →
// debat_gage_result → question suivante. Les gages "durables" restent
// affichés (debats.rule) jusqu'au prochain mouton noir.
// État dans room.debats : { qs: [{t, tone}], i, votes: {pid: 'y'|'n'},
// marks: {pid: n}, totals: {pid: n}, reveal: {yes, no, minority, moutons} }.
// L'hôte "pilote" (révélation auto, question suivante) ; s'il est parti,
// le premier joueur arrivé prend le relais.

const MONO = { fontFamily: '"Space Mono", monospace' };
const ANTON = { fontFamily: '"Anton", sans-serif' };

// Taille de la question selon sa longueur (elles sont courtes par règle).
function questionSize(text) {
  const len = text.length;
  if (len < 22) return '2.6rem';
  if (len < 34) return '2.1rem';
  if (len < 46) return '1.75rem';
  return '1.45rem';
}

const moutonCountOf = (d) => toArray(d.reveal?.moutons).length;

// Espace insécable avant « ? » : le point d'interrogation ne se retrouve
// jamais seul sur la dernière ligne.
const nbsp = (text) => text.replace(/ \?/g, ' ?');

function NameChip({ p, big }) {
  const bg = colorHex(p?.color) || '#FFF';
  return (
    <span
      className={`inline-flex items-center justify-center border-2 border-black uppercase leading-none ${big ? 'px-3 pt-2 pb-1.5 text-xl' : 'px-2 pt-1.5 pb-1 text-sm'}`}
      style={{ ...ANTON, backgroundColor: bg, color: colorFg(p?.color), boxShadow: big ? '3px 3px 0 #000' : '2px 2px 0 #000' }}
    >
      {p?.name || '?'}
    </span>
  );
}

function Marks({ n }) {
  return (
    <span className="whitespace-nowrap">
      {Array.from({ length: MOUTON_AT }, (_, k) => (
        <span key={k} style={{ opacity: k < n ? 1 : 0.25 }}>
          🐑
        </span>
      ))}
    </span>
  );
}

// Timing du slam (ms après la révélation). Le bouton "suivante" reste grisé
// jusqu'à la fin : sinon l'hôte enchaînait et le slam disparaissait avant
// que la table l'ait vu (retour utilisateur).
const MOUTON_SLAM = { in: 1200, out: 4800, end: 5200 };

// Slam plein écran du MOUTON NOIR, un peu après la révélation (on lit
// d'abord les camps, puis le slam tombe : une info à la fois).
function MoutonAnnounce({ moutons, apero }) {
  const t = useT();
  const [phase, setPhase] = useState('wait');
  useEffect(() => {
    const t0 = setTimeout(() => setPhase('in'), MOUTON_SLAM.in);
    const t1 = setTimeout(() => setPhase('out'), MOUTON_SLAM.out);
    const t2 = setTimeout(() => setPhase('hidden'), MOUTON_SLAM.end);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  if (phase === 'wait' || phase === 'hidden') return null;
  return (
    <div
      onClick={() => setPhase('hidden')}
      className={`fixed inset-0 z-[55] flex items-center justify-center p-6 ${phase === 'out' ? 'special-fade' : ''}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
    >
      <div className="special-slam text-center flex flex-col items-center">
        <div style={{ ...MONO, color: YELLOW }} className="text-sm uppercase tracking-[0.4em] mb-4">
          {t('debats.moutonKicker')}
        </div>
        {moutons.map((p) => (
          <div
            key={p.id}
            style={{
              ...ANTON,
              color: colorHex(p.color) || '#FFF',
              WebkitTextStroke: '3px #000',
              paintOrder: 'stroke fill',
            }}
            className="text-6xl uppercase leading-none mb-3 break-words max-w-md"
          >
            {p.name}
          </div>
        ))}
        <div
          style={{ ...ANTON, backgroundColor: apero ? PINK : YELLOW, color: apero ? '#FFF' : '#000', boxShadow: '6px 6px 0 #000', transform: 'rotate(1.5deg)' }}
          className="inline-block border-4 border-black px-5 py-4 text-2xl uppercase max-w-sm leading-tight mt-2"
        >
          {apero
            ? moutons.length > 1
              ? t('debats.moutonAperoMany')
              : t('debats.moutonApero')
            : t('debats.moutonNormal')}
        </div>
      </div>
    </div>
  );
}

export default function Debats({ room, roomCode, playerId, onLeave }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const partyMode = !!room.settings?.partyMode;
  const bg = partyMode ? AMBER : YELLOW;
  const deck = room.settings?.debatsDeck === 'adult' ? 'adult' : 'soft';
  // Ambiance ADULTE (demande utilisateur : "un truc plus sensuel") : nuit
  // bordeaux, lueurs rose néon, OUI rose / NON aubergine. Le Soft garde le
  // jaune (ou l'ambre bière en Apéro).
  const th =
    deck === 'adult'
      ? {
          page: '#5A0F30',
          pageImg:
            'radial-gradient(130% 80% at 50% 0%, #C2336F 0%, #8A1C4C 50%, #5A0F30 100%)',
          pageClass: '',
          text: '#FFF',
          panel: '#45102A',
          panelText: '#FFF',
          // Ombres OR (champagne) : le rose sur framboise faisait bizarre, le
          // noir était trop terne (retours utilisateur) ; le blanc marque la minorité.
          shadow: '#FFC23D',
          hi: '#FFF',
          yes: PINK,
          no: '#5B1A8C',
          bar: '#5A0F30',
          debate: { bg: PINK, fg: '#FFF', shadow: '#FFC23D' },
        }
      : {
          page: bg,
          pageImg: undefined,
          pageClass: partyMode ? 'apero-bg' : '',
          text: '#000',
          panel: '#FFF',
          panelText: '#000',
          shadow: '#000',
          hi: PINK,
          yes: LIKE_GREEN,
          no: DISLIKE_RED,
          bar: bg,
          debate: { bg: '#000', fg: YELLOW, shadow: PINK },
        };
  const panel = { backgroundColor: th.panel, color: th.panelText };
  const players = Object.entries(room.players || {})
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const d = room.debats || {};
  const qs = toArray(d.qs);
  const i = d.i || 0;
  const n = qs.length;
  const q = qs[i];
  const votes = d.votes || {};
  const marks = d.marks || {};
  const totals = d.totals || {};
  const isHost = room.host === playerId;
  // Pilote : l'hôte, ou le premier joueur arrivé si l'hôte a quitté.
  const driverId = byId[room.host] ? room.host : players[0]?.id;
  const isDriver = driverId === playerId;
  const driverName = byId[driverId]?.name || '';

  // ---------- Actions ----------
  async function castVote(v) {
    if (room.phase !== 'debat_vote') return;
    await set(ref(db, `rooms/${roomCode}/debats/votes/${playerId}`), v);
  }

  // Révélation : calcule les camps, la minorité, les marques et les moutons.
  // Garde anti double-révélation, par partie (gid) et par question.
  const revealedFor = useRef('');
  const revealKey = `${d.gid || ''}:${i}`;
  async function reveal() {
    if (!isDriver || room.phase !== 'debat_vote' || revealedFor.current === revealKey) return;
    revealedFor.current = revealKey;
    const yes = players.filter((p) => votes[p.id] === 'y').map((p) => p.id);
    const no = players.filter((p) => votes[p.id] === 'n').map((p) => p.id);
    // Égalité ou unanimité : personne ne prend.
    const minority =
      yes.length && no.length && yes.length !== no.length
        ? yes.length < no.length
          ? 'y'
          : 'n'
        : null;
    const minIds = minority === 'y' ? yes : minority === 'n' ? no : [];
    const nextMarks = { ...marks };
    const nextTotals = { ...totals };
    const moutons = [];
    minIds.forEach((id) => {
      nextTotals[id] = (nextTotals[id] || 0) + 1;
      const m = (nextMarks[id] || 0) + 1;
      if (m >= MOUTON_AT) {
        moutons.push(id);
        nextMarks[id] = 0;
      } else nextMarks[id] = m;
    });
    try {
      await update(ref(db, `rooms/${roomCode}`), {
        phase: 'debat_reveal',
        'debats/reveal': { yes, no, minority, moutons },
        'debats/marks': nextMarks,
        'debats/totals': nextTotals,
        ...(moutons.length ? { 'debats/rule': null } : {}),
      });
    } catch {
      revealedFor.current = '';
    }
  }

  // Tout le monde a répondu → le pilote révèle automatiquement.
  const allVoted = players.length > 0 && players.every((p) => votes[p.id]);
  const votedCount = players.filter((p) => votes[p.id]).length;
  useEffect(() => {
    if (room.phase === 'debat_vote' && isDriver && allVoted) reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.phase, isDriver, allVoted, i]);

  async function next() {
    if (!isDriver || busy) return;
    setBusy(true);
    try {
      if (i + 1 >= n) {
        await update(ref(db, `rooms/${roomCode}`), {
          phase: 'debat_end',
          'debats/votes': null,
          'debats/gage': null,
          'debats/gvotes': null,
        });
      } else {
        await update(ref(db, `rooms/${roomCode}`), {
          phase: 'debat_vote',
          'debats/i': i + 1,
          'debats/votes': null,
          'debats/reveal': null,
          'debats/gage': null,
          'debats/gvotes': null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function replay() {
    if (!isDriver || busy) return;
    setBusy(true);
    try {
      const count = room.settings?.debatsCount || DEBATS_DEFAULT_COUNT;
      await update(ref(db, `rooms/${roomCode}`), {
        phase: 'debat_vote',
        debats: { qs: pickDebatQuestions(deck, count), i: 0, gid: Date.now() },
      });
      bumpStats({ debatsStarted: 1, ...(deck === 'adult' ? { debatsAdult: 1 } : {}) });
    } finally {
      setBusy(false);
    }
  }

  async function backToLobby(ask) {
    if (!isDriver || busy) return;
    if (ask && !confirm(t('debats.lobbyConfirm'))) return;
    setBusy(true);
    try {
      await update(ref(db, `rooms/${roomCode}`), { phase: 'lobby', debats: null });
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (busy) return;
    if (!confirm(t('game.leaveConfirm'))) return;
    setBusy(true);
    try {
      const remaining = players.filter((p) => p.id !== playerId);
      if (remaining.length === 0) {
        await remove(ref(db, `rooms/${roomCode}`));
        onLeave();
        return;
      }
      const updates = {
        [`players/${playerId}`]: null,
        [`debats/votes/${playerId}`]: null,
      };
      if (isHost) updates.host = remaining[0].id;
      await update(ref(db, `rooms/${roomCode}`), updates);
      onLeave();
    } finally {
      setBusy(false);
    }
  }

  // ---------- Gage du mouton noir (Normal) : la table vote ----------
  const gage = d.gage || null;
  const gOpts = toArray(gage?.opts);
  const gWho = toArray(gage?.who);
  const gVotes = d.gvotes || {};
  const gVoters = players.filter((p) => !gWho.includes(p.id));
  const gVotedCount = gVoters.filter((p) => gVotes[p.id] != null).length;
  const needGage = moutonCountOf(d) > 0 && !partyMode;

  async function startGage() {
    if (!isDriver || busy) return;
    setBusy(true);
    try {
      await update(ref(db, `rooms/${roomCode}`), {
        phase: 'debat_gage',
        'debats/gage': {
          opts: pickGageOptions(),
          who: toArray(d.reveal?.moutons),
          ends: Date.now() + GAGE_VOTE_MS,
        },
        'debats/gvotes': null,
      });
    } finally {
      setBusy(false);
    }
  }

  // Dès qu'il y a un mouton noir (Normal), le vote du gage s'enchaîne tout
  // seul à la fin du slam (demande utilisateur : plus de bouton "Le gage !").
  useEffect(() => {
    if (room.phase !== 'debat_reveal' || !isDriver || !needGage) return undefined;
    const id = setTimeout(startGage, MOUTON_SLAM.end);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.phase, isDriver, needGage, i]);

  async function castGageVote(k) {
    if (room.phase !== 'debat_gage' || gWho.includes(playerId)) return;
    await set(ref(db, `rooms/${roomCode}/debats/gvotes/${playerId}`), k);
  }

  // Dépouillement : le plus de voix gagne ; égalité (ou aucun vote) → tirage.
  const resolvedFor = useRef('');
  async function resolveGage() {
    const key = `${d.gid || ''}:${i}`;
    if (!isDriver || room.phase !== 'debat_gage' || resolvedFor.current === key) return;
    resolvedFor.current = key;
    const counts = gOpts.map((_, k) => gVoters.filter((p) => gVotes[p.id] === k).length);
    const best = Math.max(0, ...counts);
    const top = counts.map((c, k) => (c === best ? k : -1)).filter((k) => k >= 0);
    const win = top[Math.floor(Math.random() * top.length)] ?? 0;
    const chosen = gOpts[win];
    try {
      await update(ref(db, `rooms/${roomCode}`), {
        phase: 'debat_gage_result',
        'debats/gage/win': win,
        ...(chosen?.durable ? { 'debats/rule': { who: gWho, t: chosen.t } } : {}),
      });
    } catch {
      resolvedFor.current = '';
    }
  }

  // Tout le monde a voté → dépouillement ; sinon à la fin du chrono.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (room.phase !== 'debat_gage') return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [room.phase]);
  const gageLeft = Math.max(0, Math.ceil(((gage?.ends || 0) - now) / 1000));
  useEffect(() => {
    if (room.phase !== 'debat_gage' || !isDriver) return;
    const allIn = gVoters.length > 0 && gVotedCount >= gVoters.length;
    if (allIn || gageLeft <= 0) resolveGage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.phase, isDriver, gVotedCount, gageLeft]);

  // Bouton "suivante" grisé 2.5 s après la révélation : on lit les camps
  // (et on commence à débattre) avant de pouvoir enchaîner. S'il y a un
  // mouton noir, grisé jusqu'à la fin de son slam.
  const [canNext, setCanNext] = useState(false);
  const moutonCount = toArray(d.reveal?.moutons).length;
  useEffect(() => {
    if (room.phase !== 'debat_reveal' && room.phase !== 'debat_gage_result') return undefined;
    setCanNext(false);
    const wait = room.phase === 'debat_gage_result' ? 2000 : moutonCount ? MOUTON_SLAM.end : 2500;
    const id = setTimeout(() => setCanNext(true), wait);
    return () => clearTimeout(id);
  }, [room.phase, i, moutonCount]);

  // ---------- Rendu ----------
  const topBar = (
    <div className="flex items-center justify-between mb-5">
      {/* L'hôte ramène toute la table au salon (demande utilisateur) ; les
          invités gardent "Quitter". */}
      {isDriver ? (
        <button onClick={() => backToLobby(true)} className="flex items-center gap-1">
          <ChevronLeft size={20} strokeWidth={3} />
          <span style={MONO} className="text-[10px] uppercase tracking-widest">
            {t('debats.lobbyBtn')}
          </span>
        </button>
      ) : (
        <button onClick={leave} className="flex items-center gap-1.5">
          <LogOut size={18} />
          <span style={MONO} className="text-[10px] uppercase tracking-widest">
            {t('common.leave')}
          </span>
        </button>
      )}
      <div
        style={{ ...ANTON, backgroundColor: deck === 'adult' ? PINK : '#000', color: deck === 'adult' ? '#FFF' : YELLOW }}
        className="border-2 border-black px-2 py-1 uppercase text-sm leading-none"
      >
        {t('debats.name')} · {deck === 'adult' ? t('debats.adult') : t('debats.soft')}
      </div>
      <div style={MONO} className="text-[10px] uppercase tracking-widest">
        {room.phase === 'debat_end' ? '' : t('debats.question', { i: Math.min(i + 1, n), n })}
      </div>
    </div>
  );

  const wrap = (children) => (
    <div
      style={{
        backgroundColor: th.page,
        backgroundImage: th.pageImg,
        backgroundAttachment: 'fixed',
        color: th.text,
        minHeight: '100vh',
      }}
      className={th.pageClass}
    >
      <div className="max-w-md mx-auto px-5 py-6 pb-32">
        {topBar}
        {children}
      </div>
    </div>
  );

  // ===== FIN =====
  if (room.phase === 'debat_end') {
    const ranked = [...players].sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0));
    const max = ranked.length ? totals[ranked[0].id] || 0 : 0;
    const min = ranked.length ? totals[ranked[ranked.length - 1].id] || 0 : 0;
    const most = ranked.filter((p) => (totals[p.id] || 0) === max);
    const least = ranked.filter((p) => (totals[p.id] || 0) === min);
    return wrap(
      <>
        <h1 style={ANTON} className="text-5xl uppercase leading-none mb-6 text-center">
          {t('debats.endTitle')}
        </h1>
        {[
          { label: t('debats.mostMouton'), list: most, v: max, bgc: '#000', fg: '#FFF' },
          { label: t('debats.leastMouton'), list: least, v: min, bgc: th.panel, fg: th.panelText },
        ].map((b) => (
          <div
            key={b.label}
            className="border-4 border-black p-4 mb-4"
            style={{ backgroundColor: b.bgc, color: b.fg, boxShadow: `6px 6px 0 ${th.shadow}` }}
          >
            <div style={MONO} className="text-[10px] uppercase tracking-widest opacity-80 mb-2">
              {b.label}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {b.list.map((p) => (
                <NameChip key={p.id} p={p} />
              ))}
            </div>
            <div style={MONO} className="text-xs uppercase tracking-widest opacity-70">
              {t('debats.times', { n: b.v })}
            </div>
          </div>
        ))}
        <div className="border-4 border-black p-4 mb-6" style={{ ...panel, boxShadow: `4px 4px 0 ${th.shadow}` }}>
          {ranked.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-1.5">
              <NameChip p={p} />
              <span style={ANTON} className="text-xl">
                {totals[p.id] || 0} 🐑
              </span>
            </div>
          ))}
        </div>
        {isDriver ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={replay}
              disabled={busy}
              className="w-full border-4 border-black py-4 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
              style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '6px 6px 0 #000' }}
            >
              <span style={ANTON} className="text-2xl uppercase">
                {t('debats.replay')}
              </span>
            </button>
            <button
              onClick={() => backToLobby(false)}
              disabled={busy}
              className="w-full border-4 border-black py-3 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
              style={{ ...panel, boxShadow: `4px 4px 0 ${th.shadow}` }}
            >
              <span style={ANTON} className="text-xl uppercase">
                {t('debats.backToLobby')}
              </span>
            </button>
          </div>
        ) : (
          <div style={MONO} className="text-center text-[10px] uppercase tracking-widest opacity-60 py-3">
            {t('debats.waitHost')}
          </div>
        )}
      </>
    );
  }

  if (!q) return wrap(null);

  // ===== RÉVÉLATION =====
  if (room.phase === 'debat_reveal') {
    const r = d.reveal || {};
    const yes = toArray(r.yes).map((id) => byId[id]).filter(Boolean);
    const no = toArray(r.no).map((id) => byId[id]).filter(Boolean);
    const moutons = toArray(r.moutons).map((id) => byId[id]).filter(Boolean);
    const minority = r.minority || null;
    const unanimous = !minority && (yes.length === 0 || no.length === 0);
    // ÉCRAN COUPÉ EN DEUX (choix utilisateur parmi 3 maquettes) : une moitié
    // pleine hauteur par camp, sans cadre ni carte ; prénoms écrits en gros
    // directement dessus, en autocollant (couleur du joueur + contour noir).
    // Minorité : ses marques 🐑 sous chaque prénom.
    const half = (side, list, color) => {
      const isMin = minority === side;
      return (
        <div
          className={`flex-1 min-w-0 flex flex-col items-center pb-12${side === 'n' ? ' border-l-4 border-black' : ''}`}
          style={{ backgroundColor: color, color: '#FFF' }}
        >
          {/* Bandeau d'en-tête assombri + trait noir : OUI/NON ne se
              confond plus avec les pseudos (retour utilisateur). */}
          <div
            style={{ ...ANTON, backgroundColor: 'rgba(0,0,0,0.28)' }}
            className="w-full text-center text-4xl uppercase leading-none pt-3 pb-2.5 border-b-4 border-black mb-6"
          >
            {side === 'y' ? t('debats.yes') : t('debats.no')}
          </div>
          {list.length ? (
            list.map((p) => (
              <div key={p.id} className="flex flex-col items-center mb-4 max-w-full px-2">
                <span
                  style={{
                    ...ANTON,
                    color: colorHex(p.color) || '#FFF',
                    WebkitTextStroke: '0.1em #000',
                    paintOrder: 'stroke fill',
                    letterSpacing: '0.05em',
                  }}
                  className="text-3xl uppercase leading-tight text-center break-all"
                >
                  {p.name}
                </span>
                {isMin && (
                  <span className="text-base leading-none mt-1">
                    <Marks n={marks[p.id] || 0} />
                  </span>
                )}
              </div>
            ))
          ) : (
            <span style={MONO} className="text-[10px] uppercase tracking-widest opacity-70">
              {t('debats.nobody')}
            </span>
          )}
        </div>
      );
    };
    return wrap(
      <>
        {moutons.length > 0 && <MoutonAnnounce key={i} moutons={moutons} apero={partyMode} />}
        {/* Écran épuré (retour "un peu fouillis") : la question en rappel
            discret, les deux camps, et c'est tout. */}
        <div style={ANTON} className="text-xl uppercase leading-tight text-center opacity-80 mb-4 px-2">
          {nbsp(q.t)}
        </div>
        <div
          className="-mx-5 relative flex border-y-4 border-black mb-12"
          style={{ minHeight: moutons.length ? 'max(240px, calc(100vh - 400px))' : 'max(260px, calc(100vh - 310px))' }}
        >
          {half('y', yes, th.yes)}
          {half('n', no, th.no)}
          <div
            className="absolute left-1/2 bottom-0 z-10"
            style={{ transform: 'translate(-50%, 50%)' }}
          >
            <span
              style={{ ...ANTON, backgroundColor: th.debate.bg, color: th.debate.fg, transform: 'rotate(-2deg)', boxShadow: `5px 5px 0 ${th.debate.shadow}` }}
              className="inline-block border-4 border-black px-5 py-2 text-3xl uppercase whitespace-nowrap"
            >
              {t('debats.debate')}
            </span>
          </div>
        </div>
        {!minority && (
          <div style={MONO} className="text-center text-xs uppercase tracking-widest mb-4">
            {unanimous ? t('debats.unanimous') : t('debats.tie')}
          </div>
        )}
        {/* Le mouton noir reste affiché après le slam : ceux qui l'ont raté
            voient qui prend (et combien de gorgées en Apéro). */}
        {moutons.length > 0 && (
          <div
            className="border-4 border-black p-3 mb-5 flex items-center gap-3 flex-wrap justify-center"
            style={{ backgroundColor: '#000', color: '#FFF', boxShadow: `4px 4px 0 ${th.shadow === '#000' ? PINK : th.shadow}` }}
          >
            <span style={{ ...MONO, color: YELLOW }} className="text-xs uppercase tracking-widest">
              {t('debats.moutonKicker')}
            </span>
            {moutons.map((p) => (
              <NameChip key={p.id} p={p} />
            ))}
            <span style={ANTON} className="text-xl uppercase">
              {partyMode
                ? moutons.length > 1
                  ? t('debats.moutonAperoMany')
                  : t('debats.moutonApero')
                : t('debats.moutonNormal')}
            </span>
          </div>
        )}
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t-4" style={{ backgroundColor: th.bar, borderColor: th.shadow }}>
          <div className="max-w-md mx-auto">
            {needGage ? (
              <div style={MONO} className="text-center text-[10px] uppercase tracking-widest opacity-70 py-3">
                {t('debats.gageSoon')}
              </div>
            ) : isDriver ? (
              <button
                onClick={next}
                disabled={!canNext || busy}
                className="w-full border-4 border-black py-4 disabled:opacity-40 active:translate-x-[2px] active:translate-y-[2px]"
                style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '6px 6px 0 #000' }}
              >
                <span className="flex items-center justify-center gap-3">
                  <span style={ANTON} className="text-2xl uppercase">
                    {i + 1 >= n ? t('debats.finish') : t('debats.next')}
                  </span>
                  <ChevronRight size={28} />
                </span>
              </button>
            ) : (
              <div style={MONO} className="text-center text-[10px] uppercase tracking-widest opacity-60 py-3">
                {t('debats.waitNext', { name: driverName })}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  const names = (ids) =>
    ids
      .map((id) => byId[id]?.name)
      .filter(Boolean)
      .join(' & ');
  const bottomBar = (content) => (
    <div className="fixed bottom-0 left-0 right-0 p-4 border-t-4" style={{ backgroundColor: th.bar, borderColor: th.shadow }}>
      <div className="max-w-md mx-auto">{content}</div>
    </div>
  );
  const nextButton = bottomBar(
    isDriver ? (
      <button
        onClick={next}
        disabled={!canNext || busy}
        className="w-full border-4 border-black py-4 disabled:opacity-40 active:translate-x-[2px] active:translate-y-[2px]"
        style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '6px 6px 0 #000' }}
      >
        <span className="flex items-center justify-center gap-3">
          <span style={ANTON} className="text-2xl uppercase">
            {i + 1 >= n ? t('debats.finish') : t('debats.next')}
          </span>
          <ChevronRight size={28} />
        </span>
      </button>
    ) : (
      <div style={MONO} className="text-center text-[10px] uppercase tracking-widest opacity-60 py-3">
        {t('debats.waitNext', { name: driverName })}
      </div>
    )
  );
  const sticker = (p, size = 'text-5xl') => (
    <span
      key={p.id}
      style={{
        ...ANTON,
        color: colorHex(p.color) || '#FFF',
        WebkitTextStroke: '0.1em #000',
        paintOrder: 'stroke fill',
        letterSpacing: '0.05em',
      }}
      className={`${size} uppercase leading-tight text-center break-all`}
    >
      {p.name}
    </span>
  );

  // ===== GAGE : la table vote =====
  if (room.phase === 'debat_gage') {
    const iAmMouton = gWho.includes(playerId);
    const myPick = gVotes[playerId];
    // Le mouton noir ne voit PAS les propositions (surprise au verdict) :
    // écran d'attente animé, juste l'avancée du vote et le chrono.
    if (iAmMouton) {
      return wrap(
        <div className="text-center flex flex-col items-center pt-4">
          <div className="sheep-wobble text-[7rem] leading-none mb-6">🐑</div>
          <div style={ANTON} className="text-4xl uppercase leading-tight mb-2">
            {t('debats.gageWait')}
          </div>
          <div style={MONO} className="text-xs uppercase tracking-widest opacity-80 mb-8">
            {t('debats.gageNoPeek')}
          </div>
          <div
            className="border-4 border-black px-6 py-4 mb-6 dot-blink"
            style={{ ...panel, boxShadow: `5px 5px 0 ${th.shadow}` }}
          >
            <span style={ANTON} className="text-5xl">●</span>
            <span style={ANTON} className="text-5xl mx-3">●</span>
            <span style={ANTON} className="text-5xl">●</span>
          </div>
          <div style={MONO} className="text-[10px] uppercase tracking-widest mb-1">
            {t('debats.gageVoted', { n: gVotedCount, total: gVoters.length })}
          </div>
          <div style={ANTON} className="text-4xl leading-none">
            {gageLeft}s
          </div>
        </div>
      );
    }
    return wrap(
      <>
        <div className="text-center mb-5">
          <div style={{ ...MONO }} className="text-xs uppercase tracking-[0.3em] mb-2">
            {t('debats.moutonKicker')}
          </div>
          <div className="flex flex-wrap justify-center gap-x-3">
            {gWho.map((id) => byId[id]).filter(Boolean).map((p) => sticker(p))}
          </div>
          <div style={ANTON} className="text-2xl uppercase mt-3">
            {iAmMouton ? t('debats.gageWait') : t('debats.gageTitle')}
          </div>
        </div>
        <div className="flex flex-col gap-4 mb-6">
          {gOpts.map((g, k) => {
            const mine = myPick === k;
            return (
              <button
                key={k}
                onClick={() => castGageVote(k)}
                disabled={iAmMouton}
                className="border-4 border-black px-4 py-4 text-left flex items-center gap-3 active:translate-x-[2px] active:translate-y-[2px]"
                style={{
                  ...(mine ? { backgroundColor: PINK, color: '#FFF' } : panel),
                  boxShadow: mine ? '0 0 0 #000' : `5px 5px 0 ${th.shadow}`,
                  transform: mine ? 'translate(4px, 4px)' : 'none',
                  opacity: myPick != null && !mine ? 0.55 : 1,
                  transition: 'all 120ms',
                }}
              >
                <span className="text-2xl shrink-0">{g.kind === 'calme' ? '🙂' : '🎭'}</span>
                <span style={ANTON} className="text-xl uppercase leading-tight flex-1">
                  {g.t}
                  {g.durable && (
                    <span style={MONO} className="block text-[9px] tracking-widest opacity-70 mt-1">
                      {t('debats.untilNext')}
                    </span>
                  )}
                </span>
                {mine && <Check size={26} strokeWidth={4} className="shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between" style={MONO}>
          <span className="text-[10px] uppercase tracking-widest">
            {t('debats.gageVoted', { n: gVotedCount, total: gVoters.length })}
          </span>
          <span style={ANTON} className="text-3xl leading-none">
            {gageLeft}s
          </span>
        </div>
      </>
    );
  }

  // ===== GAGE : résultat =====
  if (room.phase === 'debat_gage_result') {
    const chosen = gOpts[gage?.win ?? 0];
    return wrap(
      <>
        <div className="special-slam text-center flex flex-col items-center pt-6">
          <div style={{ ...MONO }} className="text-xs uppercase tracking-[0.3em] mb-3">
            {t('debats.gageKicker')}
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 mb-5">
            {gWho.map((id) => byId[id]).filter(Boolean).map((p) => sticker(p, 'text-6xl'))}
          </div>
          <div
            style={{ ...ANTON, backgroundColor: deck === 'adult' ? YELLOW : '#FFF', color: '#000', boxShadow: `6px 6px 0 ${th.shadow === '#000' ? PINK : th.shadow}`, transform: 'rotate(1.5deg)' }}
            className="inline-block border-4 border-black px-5 py-4 text-3xl uppercase max-w-sm leading-tight"
          >
            {chosen?.t}
          </div>
          {chosen?.durable && (
            <div style={MONO} className="text-xs uppercase tracking-widest mt-5">
              ⏳ {t('debats.untilNext')}
            </div>
          )}
        </div>
        {nextButton}
      </>
    );
  }

  // ===== VOTE =====
  const myVote = votes[playerId];
  const voteBtn = (v, label, color) => {
    const mine = myVote === v;
    return (
      <button
        onClick={() => castVote(v)}
        className="flex-1 border-4 border-black py-8 active:translate-x-[2px] active:translate-y-[2px]"
        style={{
          // Le bouton non choisi passe en blanc (pas en transparence : le
          // rouge délavé sur fond jaune virait à l'orange).
          backgroundColor: myVote && !mine ? th.panel : color,
          color: myVote && !mine ? (th.text === '#FFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)') : '#FFF',
          boxShadow: mine ? '0 0 0 #000' : `6px 6px 0 ${th.shadow}`,
          transform: mine ? 'translate(4px, 4px)' : 'none',
          transition: 'all 120ms',
        }}
      >
        <span style={ANTON} className="text-5xl uppercase flex items-center justify-center gap-2">
          {mine && <Check size={36} strokeWidth={4} />}
          {label}
        </span>
      </button>
    );
  };
  return wrap(
    <>
      <div
        key={i}
        className="special-slam border-4 border-black px-5 py-10 mb-8 text-center flex items-center justify-center min-h-[220px]"
        style={{ ...panel, boxShadow: `8px 8px 0 ${th.shadow}` }}
      >
        <div style={{ ...ANTON, fontSize: questionSize(q.t) }} className="uppercase leading-tight">
          {nbsp(q.t)}
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        {voteBtn('y', t('debats.yes'), th.yes)}
        {voteBtn('n', t('debats.no'), th.no)}
      </div>
      <div style={MONO} className="text-center text-[10px] uppercase tracking-widest opacity-70 mb-6 h-4">
        {myVote ? t('debats.changeVote') : ''}
      </div>
      <div style={MONO} className="text-[10px] uppercase tracking-widest mb-2">
        {t('debats.voted', { n: votedCount, total: players.length })}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {players.map((p) => (
          <span key={p.id} style={{ opacity: votes[p.id] ? 1 : 0.3 }}>
            <NameChip p={p} />
          </span>
        ))}
      </div>
      {d.rule && (
        <div
          className="border-4 border-black px-3 py-2 mb-4 flex items-center gap-2"
          style={{ backgroundColor: YELLOW, color: '#000' }}
        >
          <span className="text-lg">⏳</span>
          <span style={ANTON} className="uppercase text-sm leading-tight">
            {names(toArray(d.rule.who))} : {d.rule.t}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between border-t-4 pt-3" style={{ borderColor: th.text }}>
        <span style={MONO} className="text-[10px] uppercase tracking-widest">
          {t('debats.marks')}
        </span>
        <span className="text-2xl">
          <Marks n={marks[playerId] || 0} />
        </span>
      </div>
      {isDriver && !allVoted && votedCount >= 2 && (
        <button
          onClick={reveal}
          className="mt-6 w-full border-4 border-black py-3 active:translate-x-[2px] active:translate-y-[2px]"
          style={{ ...panel, boxShadow: `4px 4px 0 ${th.shadow}` }}
        >
          <span style={ANTON} className="text-lg uppercase">
            {t('debats.revealNow')}
          </span>
        </button>
      )}
    </>
  );
}
