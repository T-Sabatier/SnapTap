// ============================================================================
// Système de langues ("carnets") — extensible à N langues.
// Ajouter une langue = 1) créer src/locales/<code>.js, 2) l'importer + l'ajouter
// à DICTS et LOCALES ci-dessous. Aucun autre code à toucher.
//
// - La langue par défaut vient de la langue du téléphone/navigateur.
// - Un choix manuel (sélecteur) est mémorisé en localStorage et prime.
// - Une clé manquante retombe sur l'anglais (fallback), puis sur la clé brute :
//   une langue à moitié traduite n'affiche jamais un écran cassé.
// ============================================================================
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { fr } from './locales/fr';
import { en } from './locales/en';

// UK et AU réutilisent le MÊME dictionnaire d'interface que l'US (c'est de
// l'anglais) ; seul le DECK change (cards_en vs cards_en_gb vs cards_en_au).
export const DICTS = { fr, en, 'en-gb': en, 'en-au': en };

// Liste affichée dans le sélecteur (grandit toute seule quand on ajoute une langue).
export const LOCALES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-gb', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-au', label: 'English (AU)', flag: '🇦🇺' },
];

const FALLBACK = 'en'; // clé de trad manquante -> anglais
const DEFAULT_LOCALE = 'fr'; // langue non gérée par l'app -> français
const STORAGE_KEY = 'st_lang';

// Sélecteur de langue affiché pour tous (lancement US + UK, anglais GA).
// L'auto-détection (detectLocale) sert la bonne langue d'office selon le
// téléphone ; le sélecteur permet en plus de choisir manuellement.
export const SHOW_LANG_SWITCH = true;

// Langue du téléphone/navigateur -> code supporté (ex. "en-US" -> "en").
export function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICTS[saved]) return saved;
  } catch {
    /* localStorage indispo : on ignore */
  }
  const nav = (
    (typeof navigator !== 'undefined' &&
      (navigator.language || navigator.languages?.[0])) ||
    ''
  ).toLowerCase();
  if (DICTS[nav]) return nav; // ex. "en-gb" -> deck UK, "en-au" -> deck AU
  const base = nav.split('-')[0];
  return DICTS[base] ? base : DEFAULT_LOCALE;
}

// Résout une clé "a.b.c" dans un dictionnaire imbriqué.
function lookup(dict, key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
}

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  // Préférence perso (persistée) + langue imposée par la partie en cours.
  const [userLocale, setUserLocale] = useState(detectLocale);
  const [roomLocale, setRoomLocaleState] = useState(null);
  // La langue effective (affichée) : la room prime (une partie = 1 langue,
  // celle de l'hôte) ; sinon la préférence perso.
  const locale = roomLocale && DICTS[roomLocale] ? roomLocale : userLocale;

  const setLocale = useCallback((code) => {
    if (!DICTS[code]) return;
    setUserLocale(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  // Imposée par la room (hôte). null = on revient à la préférence perso.
  const setRoomLocale = useCallback((code) => {
    setRoomLocaleState(code && DICTS[code] ? code : null);
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
    } catch {
      /* ignore */
    }
  }, [locale]);

  return (
    <LangContext.Provider value={{ locale, userLocale, setLocale, setRoomLocale }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return (
    useContext(LangContext) || {
      locale: FALLBACK,
      userLocale: FALLBACK,
      setLocale: () => {},
      setRoomLocale: () => {},
    }
  );
}

// Hook de traduction : const t = useT(); t('home.create') ; t('greet', {name}) .
// Interpolation : "Salut {name}" + {name:'Tim'} -> "Salut Tim".
export function useT() {
  const { locale } = useLang();
  return useCallback(
    (key, vars) => {
      let s = lookup(DICTS[locale], key);
      if (s == null) s = lookup(DICTS[FALLBACK], key);
      if (s == null) return key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.split(`{${k}}`).join(v);
        }
      }
      return s;
    },
    [locale]
  );
}
