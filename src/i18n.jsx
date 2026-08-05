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

export const DICTS = { fr, en };

// Liste affichée dans le sélecteur (grandit toute seule quand on ajoute une langue).
export const LOCALES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const FALLBACK = 'en';
const STORAGE_KEY = 'st_lang';

// Faut-il afficher le sélecteur de langue ? (tant que la trad est incomplète)
// Capturé ICI, au chargement du module, AVANT que App.jsx ne nettoie l'URL
// (?room, ?i18n…). Sinon le paramètre a disparu au moment du rendu.
export const SHOW_LANG_SWITCH =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('i18n'));

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
  const base = nav.split('-')[0];
  return DICTS[base] ? base : FALLBACK;
}

// Résout une clé "a.b.c" dans un dictionnaire imbriqué.
function lookup(dict, key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
}

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale);

  const setLocale = useCallback((code) => {
    if (!DICTS[code]) return;
    setLocaleState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
    } catch {
      /* ignore */
    }
  }, [locale]);

  return (
    <LangContext.Provider value={{ locale, setLocale }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext) || { locale: FALLBACK, setLocale: () => {} };
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
