import { useState, useEffect, useRef } from 'react';
import { ref, update, remove, set } from 'firebase/database';
import { LogOut, ChevronRight, Check } from 'lucide-react';
import { db } from '../firebase';
import { toArray } from '../utils';
import { YELLOW, AMBER, PINK, LIKE_GREEN, DISLIKE_RED, colorHex, colorFg } from '../cards';
import { MOUTON_AT, DEBATS_DEFAULT_COUNT, pickDebatQuestions } from '../debats';
import { useT } from '../i18n.jsx';
import { bumpStats } from '../stats';

// MODE DÉBATS (spec MODE-SANS-FILTRE.md) : une question OUI/NON tombe sur
// tous les tels, chacun répond en secret, on révèle les camps. Le camp
// minoritaire prend une marque 🐑 ; à MOUTON_AT marques → MOUTON NOIR (slam
// plein écran, 2 gorgées en Apéro, juste le titre en Normal) et retour à 0.
//
// Phases : debat_vote → debat_reveal → (question suivante | debat_end).
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

function NameChip({ p }) {
  const bg = colorHex(p?.color) || '#FFF';
  return (
    <span
      className="inline-block border-2 border-black px-2 py-1 uppercase text-sm leading-none"
      style={{ ...ANTON, backgroundColor: bg, color: colorFg(p?.color), boxShadow: '2px 2px 0 #000' }}
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

// Slam plein écran du MOUTON NOIR, un peu après la révélation (on lit
// d'abord les camps, puis le slam tombe : une info à la fois).
function MoutonAnnounce({ moutons, apero }) {
  const t = useT();
  const [phase, setPhase] = useState('wait');
  useEffect(() => {
    const t0 = setTimeout(() => setPhase('in'), 1500);
    const t1 = setTimeout(() => setPhase('out'), 5200);
    const t2 = setTimeout(() => setPhase('hidden'), 5600);
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
        await update(ref(db, `rooms/${roomCode}`), { phase: 'debat_end', 'debats/votes': null });
      } else {
        await update(ref(db, `rooms/${roomCode}`), {
          phase: 'debat_vote',
          'debats/i': i + 1,
          'debats/votes': null,
          'debats/reveal': null,
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

  async function backToLobby() {
    if (!isDriver || busy) return;
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

  // Bouton "suivante" grisé 2.5 s après la révélation : on lit les camps
  // (et on commence à débattre) avant de pouvoir enchaîner.
  const [canNext, setCanNext] = useState(false);
  useEffect(() => {
    if (room.phase !== 'debat_reveal') return undefined;
    setCanNext(false);
    const id = setTimeout(() => setCanNext(true), 2500);
    return () => clearTimeout(id);
  }, [room.phase, i]);

  // ---------- Rendu ----------
  const topBar = (
    <div className="flex items-center justify-between mb-5">
      <button onClick={leave} className="flex items-center gap-1.5">
        <LogOut size={18} />
        <span style={MONO} className="text-[10px] uppercase tracking-widest">
          {t('common.leave')}
        </span>
      </button>
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
    <div style={{ backgroundColor: bg, minHeight: '100vh' }} className={`text-black${partyMode ? ' apero-bg' : ''}`}>
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
          { label: t('debats.leastMouton'), list: least, v: min, bgc: '#FFF', fg: '#000' },
        ].map((b) => (
          <div
            key={b.label}
            className="border-4 border-black p-4 mb-4"
            style={{ backgroundColor: b.bgc, color: b.fg, boxShadow: '6px 6px 0 #000' }}
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
        <div className="border-4 border-black bg-white p-4 mb-6" style={{ boxShadow: '4px 4px 0 #000' }}>
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
              onClick={backToLobby}
              disabled={busy}
              className="w-full border-4 border-black py-3 bg-white active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0 #000' }}
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
    const col = (side, list, color) => {
      const isMin = minority === side;
      return (
        <div
          className="flex-1 border-4 border-black bg-white min-w-0"
          style={{ boxShadow: isMin ? `6px 6px 0 ${PINK}` : '4px 4px 0 #000' }}
        >
          <div style={{ ...ANTON, backgroundColor: color, color: '#FFF' }} className="border-b-4 border-black text-center text-3xl uppercase py-2">
            {side === 'y' ? t('debats.yes') : t('debats.no')}
            <span className="ml-2 text-xl opacity-90">{list.length}</span>
          </div>
          {isMin && (
            <div style={{ ...MONO, backgroundColor: PINK, color: '#FFF' }} className="text-center text-[10px] uppercase tracking-widest py-1 border-b-4 border-black">
              {t('debats.minority')}
            </div>
          )}
          <div className="p-3 flex flex-wrap gap-2 justify-center min-h-[64px]">
            {list.length ? (
              list.map((p) => <NameChip key={p.id} p={p} />)
            ) : (
              <span style={MONO} className="text-[10px] uppercase tracking-widest opacity-40 self-center">
                {t('debats.nobody')}
              </span>
            )}
          </div>
        </div>
      );
    };
    return wrap(
      <>
        {moutons.length > 0 && <MoutonAnnounce key={i} moutons={moutons} apero={partyMode} />}
        <div
          className="border-4 border-black bg-white px-4 py-5 mb-5 text-center"
          style={{ boxShadow: '4px 4px 0 #000' }}
        >
          <div style={ANTON} className="text-2xl uppercase leading-tight">
            {q.t}
          </div>
        </div>
        <div className="flex gap-3 mb-4">
          {col('y', yes, LIKE_GREEN)}
          {col('n', no, DISLIKE_RED)}
        </div>
        {!minority && (
          <div style={MONO} className="text-center text-xs uppercase tracking-widest mb-4">
            {unanimous ? t('debats.unanimous') : t('debats.tie')}
          </div>
        )}
        <div className="text-center mb-6">
          <span
            style={{ ...ANTON, backgroundColor: '#000', color: YELLOW, transform: 'rotate(-2deg)', boxShadow: `5px 5px 0 ${PINK}` }}
            className="inline-block border-4 border-black px-5 py-2 text-3xl uppercase"
          >
            {t('debats.debate')}
          </span>
        </div>
        <div className="border-4 border-black bg-white p-3" style={{ boxShadow: '4px 4px 0 #000' }}>
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-1">
              <NameChip p={p} />
              <Marks n={marks[p.id] || 0} />
            </div>
          ))}
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t-4 border-black" style={{ backgroundColor: bg }}>
          <div className="max-w-md mx-auto">
            {isDriver ? (
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
          backgroundColor: myVote && !mine ? '#FFF' : color,
          color: myVote && !mine ? 'rgba(0,0,0,0.35)' : '#FFF',
          boxShadow: mine ? '0 0 0 #000' : '6px 6px 0 #000',
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
        className="special-slam border-4 border-black bg-white px-5 py-10 mb-8 text-center flex items-center justify-center min-h-[220px]"
        style={{ boxShadow: '8px 8px 0 #000' }}
      >
        <div style={{ ...ANTON, fontSize: questionSize(q.t) }} className="uppercase leading-tight">
          {q.t}
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        {voteBtn('y', t('debats.yes'), LIKE_GREEN)}
        {voteBtn('n', t('debats.no'), DISLIKE_RED)}
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
      <div className="flex items-center justify-between border-t-4 border-black pt-3">
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
          className="mt-6 w-full border-4 border-black py-3 bg-white active:translate-x-[2px] active:translate-y-[2px]"
          style={{ boxShadow: '4px 4px 0 #000' }}
        >
          <span style={ANTON} className="text-lg uppercase">
            {t('debats.revealNow')}
          </span>
        </button>
      )}
    </>
  );
}
