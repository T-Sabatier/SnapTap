import { useState, useEffect } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';
import {
  makeRoomCode,
  getStoredName,
  setStoredName,
  getStoredParty,
  setStoredParty,
  ROOM_TTL_MS,
  openExternal,
} from '../utils';
import { CATEGORIES, YELLOW, AMBER, PINK, APERO_ACCENT, MAX_PLAYERS, PLAYER_COLORS } from '../cards';
import { useBilling, PRODUCT_ULTRA } from '../purchases';
import { bumpStats } from '../stats';
import { ChevronRight, X, Settings } from 'lucide-react';
import { useT, useLang, LOCALES, SHOW_LANG_SWITCH } from '../i18n.jsx';
import InstallButton from './InstallButton.jsx';
import InstallCta from './InstallCta.jsx';

// Couleur libre (non prise par les joueurs deja presents) tiree au hasard,
// pour que le pseudo soit colore des l'arrivee. Repli sur toutes les couleurs
// si elles sont toutes prises (>16 joueurs, impossible ici mais robuste).
function pickFreeColor(playersObj) {
  const taken = new Set(
    Object.values(playersObj || {})
      .map((p) => p.color)
      .filter(Boolean)
  );
  const free = PLAYER_COLORS.filter((c) => !taken.has(c.id));
  const pool = free.length ? free : PLAYER_COLORS;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function getCodeFromUrl() {
  if (typeof window === 'undefined') return '';
  const fromQuery = new URLSearchParams(window.location.search).get('room');
  return (fromQuery || '').trim().toUpperCase().slice(0, 4);
}

export default function Home({ playerId, onJoin, initialError, hideDevLink }) {
  const [name, setName] = useState(getStoredName);
  const [joinCode, setJoinCode] = useState(getCodeFromUrl);
  const [error, setError] = useState(initialError || '');
  const [busy, setBusy] = useState(false);
  const t = useT();
  const { locale, setLocale } = useLang();
  // Capturé au chargement du module (avant le nettoyage d'URL) — voir i18n.jsx.
  const showLangSwitch = SHOW_LANG_SWITCH;
  const [showSettings, setShowSettings] = useState(false);
  // Pages légales par pays : fr -> '', en (US) -> '-en', en-gb (UK) -> '-en-gb'.
  const legalSuffix = locale === 'fr' ? '' : '-' + locale;
  const [invitedCode] = useState(getCodeFromUrl);
  // Arrivée via QR / lien avec un code → modal de join dédiée (prénom + Rejoindre)
  // pour éviter que le joueur clique par réflexe sur "Créer une partie".
  // Pas de modal si une erreur est déjà présente (room introuvable, kické…).
  const [showJoinModal, setShowJoinModal] = useState(!!invitedCode && !initialError);
  // Preference "Mode Apero" (jeu a boire). GRATUIT pour tous depuis le
  // 13/08/2026 : simple interrupteur, plus aucune notion de possession.
  const [party, setParty] = useState(getStoredParty);
  const [showShop, setShowShop] = useState(false);
  const [shopError, setShopError] = useState('');
  // Possession des packs : RevenueCat en natif, fallback web (Firebase).
  const {
    ultra: ultraOwned,
    prices,
    billingAvailable,
    busy: shopBusy,
    purchase,
    restore,
  } = useBilling();
  // Mode apero actif = choisi via le switch (gratuit, aucun verrou).
  const partyActive = party;
  // Le jeu de mots "SNAP ÉRO" (apéro) ne marche qu'en français. En anglais on
  // garde "SNAP TAP" (juste teinté couleur apéro), "Éro" n'y voulant rien dire.
  const aperoPun = partyActive && locale.startsWith('fr');
  function toggleParty() {
    const v = !party;
    setParty(v);
    setStoredParty(v);
  }
  // Lance l'achat d'un pack (natif). Gere l'annulation et les erreurs.
  async function buyPack(productId) {
    setShopError('');
    try {
      await purchase(productId);
    } catch (e) {
      setShopError(t('errors.errorPrefix') + (e?.message || e?.code || String(e)));
    }
  }
  // Nettoie un code colle/tape : garde seulement les 4 caracteres valides
  // (le lien partage colle parfois "https://...?room=ABCD" → on extrait ABCD).
  function cleanCode(raw) {
    const s = (raw || '').toUpperCase();
    const fromUrl = s.match(/ROOM=([A-HJ-NP-Z2-9]{4})/);
    if (fromUrl) return fromUrl[1];
    return s.replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 4);
  }

  async function restorePurchases() {
    setShopError('');
    try {
      await restore();
    } catch (e) {
      setShopError(t('errors.errorPrefix') + (e?.message || e?.code || String(e)));
    }
  }

  // NB : le sweep des rooms expirées ne se fait plus ici. Les règles Firebase
  // n'autorisent plus la LISTE de /rooms aux joueurs (anti-énumération des
  // codes) : le nettoyage tourne à l'ouverture du dashboard /admin, et
  // createRoom réutilise les codes des rooms expirées (ci-dessous).

  async function createRoom() {
    const n = name.trim();
    if (!n) {
      setError(t('errors.enterName'));
      return;
    }
    setBusy(true);
    setError('');
    setStoredName(n);

    let code;
    let exists = true;
    let tries = 0;
    while (exists && tries < 10) {
      code = makeRoomCode();
      const snap = await get(ref(db, `rooms/${code}`));
      // Une room expirée (> TTL) compte comme libre : son code est réutilisé
      // (le set() ci-dessous l'écrase), ce qui recycle les rooms abandonnées.
      const v = snap.val();
      const expired = v?.createdAt && v.createdAt < Date.now() - ROOM_TTL_MS;
      exists = snap.exists() && !expired;
      tries++;
    }
    if (exists) {
      setError(t('errors.cantCreate'));
      setBusy(false);
      return;
    }

    const defaultCats = Object.fromEntries(CATEGORIES.map((c) => [c.id, true]));

    const room = {
      host: playerId,
      phase: 'lobby',
      createdAt: Date.now(),
      players: {
        [playerId]: {
          name: n,
          score: 0,
          joinedAt: Date.now(),
          color: pickFreeColor(null),
        },
      },
      settings: {
        cats: defaultCats,
        winningScore: 5,
        // Timer par tour ACTIF par defaut (30s) : la cause n1 des manches qui
        // trainent est le joueur qui hesite. L'hote peut le couper au salon.
        turnTimer: 30,
        // Langue de la partie (celle de l'hôte) : tout le salon l'adopte.
        lang: locale,
        sorts: { reroll: false, espion: false, vatout: false },
        // Mode Apero pre-active si l'hote le POSSEDE et l'a choisi sur l'accueil.
        ...(partyActive ? { partyMode: true } : {}),
      },
    };

    try {
      await set(ref(db, `rooms/${code}`), room);
      bumpStats({ gamesCreated: 1, ...(partyActive ? { partyCreated: 1 } : {}) });
      onJoin(code);
    } catch (e) {
      setError(t('errors.firebaseRules'));
      setBusy(false);
    }
  }

  async function joinRoom() {
    const n = name.trim();
    const code = joinCode.trim().toUpperCase();
    if (!n) {
      setError(t('errors.enterName'));
      return;
    }
    if (code.length !== 4) {
      setError(t('errors.codeLength'));
      return;
    }
    // Charset strict (celui de makeRoomCode) : pas de caractères exotiques
    // dans le chemin Firebase (les règles refuseraient de toute façon).
    if (!/^[A-HJ-NP-Z2-9]{4}$/.test(code)) {
      setError(t('errors.invalidCode'));
      return;
    }
    setBusy(true);
    setError('');

    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) {
        setError(t('errors.roomNotFound'));
        setBusy(false);
        return;
      }

      const r = snap.val();
      const alreadyIn = r.players && r.players[playerId];

      if (r.phase !== 'lobby' && !alreadyIn) {
        setError(t('errors.gameInProgress'));
        setBusy(false);
        return;
      }

      if (!alreadyIn && Object.keys(r.players || {}).length >= MAX_PLAYERS) {
        setError(t('errors.roomFull', { max: MAX_PLAYERS }));
        setBusy(false);
        return;
      }

      setStoredName(n);

      await set(ref(db, `rooms/${code}/players/${playerId}`), {
        name: n,
        score: r.players?.[playerId]?.score || 0,
        joinedAt: r.players?.[playerId]?.joinedAt || Date.now(),
        // Couleur conservee si on revient, sinon une couleur libre au hasard.
        color: r.players?.[playerId]?.color || pickFreeColor(r.players),
      });

      onJoin(code);
    } catch (e) {
      setError(t('errors.firebaseConfig'));
      setBusy(false);
    }
  }

  return (
    <div
      style={{ backgroundColor: partyActive ? AMBER : YELLOW, minHeight: '100vh' }}
      className={`text-black overflow-x-hidden${partyActive ? ' apero-bg' : ''}`}
    >
      <div className="max-w-md mx-auto px-5 pt-4 pb-10">
        {/* Rouage paramètres (haut droite, icône nue). Caché tant que la trad est incomplète. */}
        {showLangSwitch && (
          <div className="mb-2 flex justify-end">
            <button
              onClick={() => setShowSettings(true)}
              aria-label={t('settings.title')}
              className="p-1 active:translate-y-[1px] active:opacity-70"
            >
              <Settings size={26} color="#000" />
            </button>
          </div>
        )}

        {showSettings && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6"
            onClick={() => setShowSettings(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm border-4 border-black bg-white p-5"
              style={{ boxShadow: '10px 10px 0 #000' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  style={{ fontFamily: '"Anton", sans-serif' }}
                  className="text-2xl uppercase text-black"
                >
                  {t('settings.title')}
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  aria-label={t('common.close')}
                  className="border-2 border-black bg-white p-1 active:translate-y-[1px]"
                >
                  <X size={18} color="#000" />
                </button>
              </div>
              <div
                style={{ fontFamily: '"Space Mono", monospace' }}
                className="text-[10px] uppercase tracking-widest text-black/60 mb-2"
              >
                {t('settings.language')}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLocale(l.code)}
                    className="border-2 border-black px-2 py-2 flex items-center justify-center gap-1.5 active:translate-y-[1px] min-w-0"
                    style={{
                      backgroundColor: locale === l.code ? PINK : '#FFF',
                      color: locale === l.code ? '#FFF' : '#000',
                      boxShadow: '2px 2px 0 #000',
                    }}
                  >
                    <span className="text-xl leading-none">{l.flag}</span>
                    <span
                      style={{ fontFamily: '"Anton", sans-serif' }}
                      className="text-sm uppercase leading-tight truncate"
                    >
                      {l.label}
                    </span>
                  </button>
                ))}
              </div>
              <div
                style={{ fontFamily: '"Space Mono", monospace' }}
                className="text-[10px] uppercase tracking-widest text-black/50 mt-3"
              >
                {t('settings.langHint')}
              </div>
            </div>
          </div>
        )}

        <div className="mb-10">
          <h1
            style={{
              fontFamily: '"Anton", sans-serif',
              lineHeight: 0.82,
              letterSpacing: '-0.02em',
              fontSize: 'clamp(3.25rem, 22vw, 7rem)',
            }}
            className="uppercase whitespace-nowrap flex items-center justify-center gap-3"
          >
            <span>
              {aperoPun ? (
                <>
                  Sn
                  <span
                    style={{
                      color: '#FFF',
                      WebkitTextStroke: `4px ${APERO_ACCENT}`,
                      paintOrder: 'stroke fill',
                    }}
                  >
                    ap
                  </span>
                </>
              ) : (
                'Snap'
              )}
            </span>
            <span
              className="inline-block px-5 py-2 -rotate-2 leading-none"
              style={{
                backgroundColor: partyActive ? APERO_ACCENT : PINK,
                color: '#fff',
                border: '4px solid #000',
                boxShadow: '6px 6px 0 #000',
              }}
            >
              {aperoPun ? 'Éro' : 'Tap'}
            </span>
          </h1>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1 flex-1 bg-black"></div>
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest whitespace-nowrap text-black"
            >
              {partyActive ? t('home.taglineApero') : t('home.taglineNormal')}
            </div>
          </div>
        </div>

        {/* Switch Mode Apero (jeu a boire) — sur l'accueil pour la decouverte.
            Pre-active le mode a la creation d'une partie ; change l'ambiance.
            GRATUIT pour tous : simple interrupteur On/Off. */}
        {(
          <button
            onClick={toggleParty}
            className="w-full border-4 border-black p-4 mb-8 flex items-center justify-between active:translate-x-[2px] active:translate-y-[2px]"
            style={{
              backgroundColor: party ? APERO_ACCENT : '#FFF',
              color: party ? '#FFF' : '#000',
              boxShadow: party ? '6px 6px 0 #000' : '4px 4px 0 #000',
              transition: 'all 120ms',
            }}
          >
            <div className="text-left min-w-0">
              <div
                style={{ fontFamily: '"Anton", sans-serif' }}
                className="text-2xl uppercase leading-none"
              >
                {t('apero.name')}
              </div>
              <div
                style={{ fontFamily: '"Space Mono", monospace' }}
                className="text-[10px] uppercase tracking-widest mt-1 opacity-80"
              >
                {party ? t('apero.onLabel') : t('apero.offLabel')}
              </div>
            </div>
            <div
              className="border-2 px-3 py-1.5 text-sm uppercase tracking-widest shrink-0"
              style={{
                fontFamily: '"Space Mono", monospace',
                borderColor: party ? '#FFF' : '#000',
              }}
            >
              {party ? 'ON' : 'OFF'}
            </div>
          </button>
        )}

        {invitedCode && (
          <div
            className="mb-6 border-4 border-black bg-black text-white p-4 text-center"
            style={{ boxShadow: '6px 6px 0 #000' }}
          >
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest opacity-60 mb-1"
            >
              {t('home.invitedTitle')}
            </div>
            <div
              style={{
                fontFamily: '"Anton", sans-serif',
                color: YELLOW,
                letterSpacing: '0.15em',
              }}
              className="text-4xl uppercase"
            >
              {invitedCode}
            </div>
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest opacity-60 mt-1"
            >
              {t('home.invitedSub')}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div
            style={{ fontFamily: '"Space Mono", monospace' }}
            className="text-sm uppercase tracking-widest mb-2 opacity-80"
          >
            {t('home.yourName')}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('home.namePlaceholder')}
            maxLength={14}
            className="w-full border-4 border-black bg-white px-3 py-3 outline-none placeholder-black/30 text-lg"
            style={{ boxShadow: '4px 4px 0 #000' }}
          />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-1 flex-1 bg-black"></div>
          <div
            style={{ fontFamily: '"Space Mono", monospace' }}
            className="text-sm uppercase tracking-widest"
          >
            {t('home.start')}
          </div>
          <div className="h-1 flex-1 bg-black"></div>
        </div>

        <button
          onClick={createRoom}
          disabled={busy}
          className="w-full border-4 border-black py-2 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
          style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '4px 4px 0 #000' }}
        >
          <div
            style={{ fontFamily: '"Anton", sans-serif' }}
            className="text-2xl uppercase tracking-wide"
          >
            {t('home.create')}
          </div>
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="h-1 flex-1 bg-black"></div>
          <div
            style={{ fontFamily: '"Space Mono", monospace' }}
            className="text-sm uppercase tracking-widest text-center"
          >
            {t('home.orJoinCode')}
          </div>
          <div className="h-1 flex-1 bg-black"></div>
        </div>

        <div className="flex items-stretch gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(cleanCode(e.target.value))}
            onPaste={(e) => {
              e.preventDefault();
              setJoinCode(cleanCode(e.clipboardData.getData('text')));
            }}
            placeholder={t('home.codePlaceholder')}
            maxLength={4}
            inputMode="text"
            autoCapitalize="characters"
            className="flex-1 min-w-0 border-4 border-black bg-white px-2 py-2 outline-none placeholder-black/30 text-center text-2xl tracking-widest"
            style={{
              boxShadow: '4px 4px 0 #000',
              fontFamily: '"Anton", sans-serif',
            }}
          />
          <button
            onClick={joinRoom}
            disabled={busy || joinCode.trim().length !== 4}
            className="border-4 border-black px-4 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-30 flex items-center justify-center gap-1"
            style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '4px 4px 0 #000' }}
          >
            <span
              style={{ fontFamily: '"Anton", sans-serif' }}
              className="text-lg uppercase"
            >
              {t('home.join')}
            </span>
            <ChevronRight size={20} />
          </button>
        </div>

        {error && (
          <div
            className="mt-4 border-4 border-black bg-white p-3 text-sm"
            style={{ boxShadow: '4px 4px 0 #000' }}
          >
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={() => setShowShop(true)}
          className="mt-6 w-full border-4 border-black py-3 active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-2"
          style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '4px 4px 0 #000' }}
        >
          <span className="text-xl leading-none">🛒</span>
          <span
            style={{ fontFamily: '"Anton", sans-serif' }}
            className="text-xl uppercase tracking-wide"
          >
            {t('home.shopButton')}
          </span>
        </button>

        <div
          className="mt-10 border-4 border-black bg-white p-4"
          style={{ boxShadow: '6px 6px 0 #000' }}
        >
          <div
            style={{ fontFamily: '"Anton", sans-serif' }}
            className="text-xl uppercase mb-2"
          >
            {partyActive ? t('rules.titleApero') : t('rules.title')}
          </div>
          <ul className="text-sm leading-relaxed space-y-1">
            {(partyActive ? t('rules.apero') : t('rules.normal')).map((r, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: r }} />
            ))}
          </ul>
        </div>

        <div className="mt-10">
          <InstallButton variant="block" />
        </div>

        {/* Footer légal. */}
        <div className="mt-8 pt-6 border-t-2 border-black/10 text-center">
          <div
            style={{ fontFamily: '"Space Mono", monospace' }}
            className="text-[10px] uppercase tracking-widest opacity-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
          >
            <a
              href={`https://www.snaptapparty.com/privacy${legalSuffix}`}
              onClick={(e) => {
                e.preventDefault();
                openExternal(`https://www.snaptapparty.com/privacy${legalSuffix}`);
              }}
              className="underline"
            >
              {t('footer.privacy')}
            </a>
            <span aria-hidden>·</span>
            <a
              href={`https://www.snaptapparty.com/conditions${legalSuffix}`}
              onClick={(e) => {
                e.preventDefault();
                openExternal(`https://www.snaptapparty.com/conditions${legalSuffix}`);
              }}
              className="underline"
            >
              {t('footer.terms')}
            </a>
            <span aria-hidden>·</span>
            <a
              href={`https://www.snaptapparty.com/mentions-legales${legalSuffix}`}
              onClick={(e) => {
                e.preventDefault();
                openExternal(`https://www.snaptapparty.com/mentions-legales${legalSuffix}`);
              }}
              className="underline"
            >
              {t('footer.legal')}
            </a>
          </div>
        </div>
      </div>
      {import.meta.env.DEV && !hideDevLink && (
        <a
          href="?debug"
          className="fixed bottom-3 left-3 z-50 border-2 border-black bg-black text-white px-2 py-1 text-[10px] uppercase tracking-widest"
          style={{ fontFamily: '"Space Mono", monospace' }}
        >
          🐛 Debug
        </a>
      )}

      {/* Modal de join : ouverte auto quand on arrive avec un code (QR / lien).
          Prénom + gros bouton Rejoindre → évite le clic réflexe sur "Créer". */}
      {showJoinModal && invitedCode && (
        <div
          onClick={() => setShowJoinModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative border-4 border-black bg-white w-full max-w-sm p-6"
            style={{ boxShadow: '8px 8px 0 #000' }}
          >
            <button
              onClick={() => setShowJoinModal(false)}
              aria-label={t('common.close')}
              className="absolute top-3 right-3 active:opacity-50"
            >
              <X size={24} strokeWidth={3} />
            </button>
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest opacity-60 text-center mb-1 mt-1"
            >
              {t('home.joinTitle')}
            </div>
            <div
              style={{ fontFamily: '"Anton", sans-serif', letterSpacing: '0.15em' }}
              className="text-5xl uppercase text-center mb-5"
            >
              {invitedCode}
            </div>
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-sm uppercase tracking-widest mb-2 opacity-80"
            >
              {t('home.yourName')}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              placeholder={t('home.namePlaceholder')}
              maxLength={14}
              autoFocus
              className="w-full border-4 border-black bg-white px-3 py-3 outline-none placeholder-black/30 text-lg mb-4"
              style={{ boxShadow: '4px 4px 0 #000' }}
            />
            {error && <div className="mb-4 text-sm text-red-600">⚠️ {error}</div>}
            <button
              onClick={joinRoom}
              disabled={busy || !name.trim()}
              className="w-full border-4 border-black py-3 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-40"
              style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '4px 4px 0 #000' }}
            >
              <span
                style={{ fontFamily: '"Anton", sans-serif' }}
                className="text-2xl uppercase"
              >
                {t('home.join')}
              </span>
            </button>
            <button
              onClick={() => setShowJoinModal(false)}
              className="mt-3 w-full text-center"
            >
              <span
                style={{ fontFamily: '"Space Mono", monospace' }}
                className="text-[10px] uppercase tracking-widest opacity-50"
              >
                {t('home.joinInstead')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Boutique : packs premium accessibles depuis l'accueil. */}
      {showShop && (
        <div
          onClick={() => setShowShop(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative border-4 border-black bg-white w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: '8px 8px 0 #000' }}
          >
            <button
              onClick={() => setShowShop(false)}
              aria-label={t('common.close')}
              className="absolute top-3 right-3 active:opacity-50"
            >
              <X size={24} strokeWidth={3} />
            </button>
            <div
              style={{ fontFamily: '"Anton", sans-serif' }}
              className="text-3xl uppercase leading-none mb-1 mt-1 text-center"
            >
              {t('shop.title')}
            </div>
            <div
              style={{ fontFamily: '"Space Mono", monospace' }}
              className="text-[10px] uppercase tracking-widest opacity-60 mb-5 text-center"
            >
              {t('shop.subtitle')}
            </div>
            {!billingAvailable && (
              <div
                className="border-2 border-black px-3 py-2 mb-4 flex items-center justify-center gap-2 text-center"
                style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '3px 3px 0 #000' }}
              >
                <span className="text-base leading-none">📱</span>
                <span
                  style={{ fontFamily: '"Space Mono", monospace' }}
                  className="text-[11px] uppercase tracking-wide leading-tight"
                >
                  {t('shop.mobileOnly')}
                </span>
              </div>
            )}
            <div className="space-y-4">
              {/* Le Mode Apero est GRATUIT depuis le 13/08/2026 : il n'apparait
                  plus en boutique. Seul le Pack Ultra est en vente. */}
              {[
                {
                  emoji: '🌶️',
                  name: t('shop.ultraName'),
                  desc: t('shop.ultraDesc'),
                  productId: PRODUCT_ULTRA,
                  owned: ultraOwned,
                },
              ].map((p) => {
                const price = prices[p.productId] || '…';
                return (
                  <div
                    key={p.name}
                    className="border-4 border-black p-4"
                    style={{ boxShadow: '4px 4px 0 #000' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl leading-none">{p.emoji}</span>
                      <span
                        style={{ fontFamily: '"Anton", sans-serif' }}
                        className="text-2xl uppercase leading-none flex-1 min-w-0"
                      >
                        {p.name}
                      </span>
                      {!p.owned && (
                        <span
                          style={{ fontFamily: '"Anton", sans-serif' }}
                          className="text-xl leading-none shrink-0"
                        >
                          {price}
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-80 mb-3">{p.desc}</p>
                    {p.owned ? (
                      <div
                        className="w-full border-2 border-black py-2 flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#22C55E', color: '#000' }}
                      >
                        <span className="text-sm leading-none">✓</span>
                        <span
                          style={{ fontFamily: '"Space Mono", monospace' }}
                          className="text-[11px] uppercase tracking-widest"
                        >
                          {t('shop.owned')}
                        </span>
                      </div>
                    ) : billingAvailable ? (
                      <button
                        onClick={() => buyPack(p.productId)}
                        disabled={shopBusy}
                        className="w-full border-2 border-black py-2 disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px]"
                        style={{ backgroundColor: PINK, color: '#FFF', boxShadow: '3px 3px 0 #000' }}
                      >
                        <span
                          style={{ fontFamily: '"Space Mono", monospace' }}
                          className="text-[11px] uppercase tracking-widest"
                        >
                          {shopBusy ? '…' : t('shop.buy', { price })}
                        </span>
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {shopError && (
              <div className="mt-3 text-center text-xs text-red-600 break-words">{shopError}</div>
            )}
            {billingAvailable ? (
              <button
                onClick={restorePurchases}
                disabled={shopBusy}
                className="mt-4 w-full underline disabled:opacity-50"
              >
                <span
                  style={{ fontFamily: '"Space Mono", monospace' }}
                  className="text-[10px] uppercase tracking-widest opacity-70"
                >
                  {t('shop.restore')}
                </span>
              </button>
            ) : (
              <div className="mt-5">
                <div
                  style={{ fontFamily: '"Space Mono", monospace' }}
                  className="text-[10px] uppercase tracking-widest opacity-60 mb-3 text-center"
                >
                  {t('shop.mobileOnlyLong')}
                </div>
                <InstallCta onNavigate={() => setShowShop(false)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
