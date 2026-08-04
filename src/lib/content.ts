import type { Locale } from '../i18n';

/**
 * Una ficha tal y como la guarda Decap con i18n `single_file`: el castellano
 * completo y, colgando, los idiomas que ya estén traducidos.
 */
export type Traducible<T> = { es: T; ca?: Partial<T>; en?: Partial<T> };

/**
 * Aplana una ficha al idioma pedido: parte del castellano y le encima lo que
 * exista traducido. Un campo sin traducir se queda en castellano — nunca en
 * blanco, nunca con un hueco en la página.
 *
 *     const p = localize(entry.data, lang);
 *     p.place;   // ya está en el idioma que toca
 */
export function localize<T extends object>(data: Traducible<T>, lang: Locale): T {
  const traducido = lang === 'es' ? undefined : data[lang];
  if (!traducido) return data.es;

  const salida = { ...data.es };
  for (const [clave, valor] of Object.entries(traducido)) {
    if (valor !== undefined) salida[clave as keyof T] = valor as T[keyof T];
  }
  return salida;
}

type Secciones = Record<string, Record<string, string>>;

/**
 * Lector de los textos de una página, ya atado a su idioma:
 *
 *     const t = usePageText(entry.data, 'home', lang);
 *     t('hero.title');
 *
 * El fallback es por texto, no por sección: si el catalán tiene traducido el
 * titular pero no el botón, el botón sale en castellano y el titular en catalán.
 *
 * Si el texto no existe ni siquiera en castellano, revienta el build en vez de
 * publicar una página con un hueco. Es intencionado (CLAUDE.md §3).
 */
export function usePageText(
  data: Traducible<Secciones>,
  id: string,
  lang: Locale
): (path: string) => string {
  const traducido = lang === 'es' ? undefined : data[lang];

  return (path) => {
    const [section, field] = path.split('.');
    if (!section || !field) {
      throw new Error(`El texto "${path}" no tiene la forma "seccion.campo"`);
    }

    const value = traducido?.[section]?.[field] ?? data.es[section]?.[field];
    if (value === undefined) {
      throw new Error(`Falta el texto "${path}" en src/content/pages/${id}.json`);
    }
    return value;
  };
}
