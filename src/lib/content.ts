import type { Locale } from '../i18n';

/** Un texto con sus idiomas. Solo el castellano está garantizado. */
export type I18nText = { es: string; ca?: string; en?: string };

/**
 * Devuelve el texto en el idioma pedido. Si esa traducción no existe todavía,
 * cae al castellano — nunca a una cadena vacía ni a un hueco en la página.
 */
export function pickText(text: I18nText, lang: Locale): string {
  return text[lang] ?? text.es;
}

type PageData = Record<string, Record<string, I18nText>>;

/**
 * Lector de los textos de una página, ya atado a su idioma:
 *
 *     const t = usePageText(entry.data, 'home', lang);
 *     t('hero.title');
 *
 * Si el texto no existe, revienta el build en vez de publicar una página con
 * un hueco. Es intencionado (CLAUDE.md §3).
 */
export function usePageText(data: PageData, id: string, lang: Locale): (path: string) => string {
  return (path) => {
    const [section, field] = path.split('.');
    const value = section && field ? data[section]?.[field] : undefined;
    if (!value) {
      throw new Error(`Falta el texto "${path}" en src/content/pages/${id}.json`);
    }
    return pickText(value, lang);
  };
}
