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

/** Las 7 rutas del sitio. La cadena vacía es la portada. */
export const SLUGS = [
  '',
  'nosotras',
  'proyectos',
  'oportunidades',
  'colabora',
  'contacto',
  'gracias',
] as const;
export type Slug = (typeof SLUGS)[number];

/** Ruta absoluta dentro del sitio: localePath('ca', 'colabora') → /ca/colabora/ */
export function localePath(lang: Locale, slug: Slug = ''): string {
  return slug === '' ? `/${lang}/` : `/${lang}/${slug}/`;
}

/**
 * getStaticPaths compartido por las 7 páginas: una copia por idioma.
 * Pasa el idioma también como prop para que las páginas lo reciban tipado,
 * sin castear `Astro.params`.
 */
export function localePaths(): Array<{ params: { lang: Locale }; props: { lang: Locale } }> {
  return LOCALES.map((lang) => ({ params: { lang }, props: { lang } }));
}
