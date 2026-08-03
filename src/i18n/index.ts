import ca from './ca.json';
import en from './en.json';
import es from './es.json';

export const LOCALES = ['es', 'ca', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** El castellano es el idioma canónico: todo lo demás se deriva de él. */
export const DEFAULT_LOCALE: Locale = 'es';

/** Las claves válidas son las del castellano. Un typo rompe el build. */
export type UIKey = keyof typeof es;

const DICTIONARIES: Record<Locale, Partial<Record<UIKey, string>>> = { es, ca, en };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Traductor de textos de interfaz. Si una clave falta en el idioma pedido,
 * cae al castellano — nunca a una cadena vacía.
 */
export function useTranslations(lang: Locale): (key: UIKey) => string {
  return (key) => DICTIONARIES[lang][key] ?? es[key];
}

/**
 * Las 7 páginas del sitio, identificadas por un nombre interno en inglés.
 * Ese identificador nunca aparece en pantalla: solo sirve para que el código
 * hable de "la página de colaboración" sin atarse a una URL concreta.
 */
export const PAGES = [
  'home',
  'about',
  'projects',
  'opportunities',
  'collaborate',
  'contact',
  'thanks',
] as const;
export type PageId = (typeof PAGES)[number];

/** Páginas con URL propia. La portada es la raíz del idioma y no lleva slug. */
export type InnerPageId = Exclude<PageId, 'home'>;

/**
 * El trozo de URL de cada página en cada idioma. Sale de las etiquetas del menú
 * que la ONG ya tenía traducidas; el castellano conserva las URLs de siempre.
 * Cada idioma posiciona con sus propias palabras.
 */
const SLUGS: Record<Locale, Record<PageId, string>> = {
  es: {
    home: '',
    about: 'nosotras',
    projects: 'proyectos',
    opportunities: 'oportunidades',
    collaborate: 'colabora',
    contact: 'contacto',
    thanks: 'gracias',
  },
  ca: {
    home: '',
    about: 'nosaltres',
    projects: 'projectes',
    opportunities: 'oportunitats',
    collaborate: 'collabora',
    contact: 'contacte',
    thanks: 'gracies',
  },
  en: {
    home: '',
    about: 'about-us',
    projects: 'projects',
    opportunities: 'opportunities',
    collaborate: 'get-involved',
    contact: 'contact',
    thanks: 'thank-you',
  },
};

/** Ruta absoluta dentro del sitio: localePath('ca', 'collaborate') → /ca/collabora/ */
export function localePath(lang: Locale, page: PageId = 'home'): string {
  const slug = SLUGS[lang][page];
  return slug === '' ? `/${lang}/` : `/${lang}/${slug}/`;
}

/** getStaticPaths de la portada: una copia por idioma. */
export function homePaths(): Array<{ params: { lang: Locale }; props: { lang: Locale } }> {
  return LOCALES.map((lang) => ({ params: { lang }, props: { lang } }));
}

/**
 * getStaticPaths de una página interior: una ruta por idioma, cada una con su
 * slug. El nombre del parámetro es el identificador de la página, que es
 * también el nombre del fichero (src/pages/[lang]/[about].astro).
 */
export function pathsFor(
  page: InnerPageId
): Array<{ params: Record<string, string>; props: { lang: Locale } }> {
  return LOCALES.map((lang) => ({
    params: { lang, [page]: SLUGS[lang][page] },
    props: { lang },
  }));
}
