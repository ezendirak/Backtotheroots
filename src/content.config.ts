import { glob } from 'astro/loaders';
/* `z` se importa de astro/zod, no de astro:content: es la misma instancia que
   usa Astro por dentro y su reexport en astro:content está marcado obsoleto. */
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

const carpeta = (nombre: string) => glob({ pattern: '**/*.json', base: `./src/content/${nombre}` });

/**
 * Compone una colección traducible con la forma exacta que escribe Decap CMS
 * cuando la i18n es `single_file`:
 *
 *     { "es": { …todo… }, "ca": { …solo lo traducible… }, "en": { … } }
 *
 * El castellano es obligatorio y lleva todos los campos porque es el idioma
 * canónico. Catalán e inglés son opcionales, y dentro de ellos cada campo
 * también: lo que falte cae al castellano en tiempo de render (`localize` en
 * src/lib/content.ts). Una página nunca se queda con un hueco.
 *
 * Que los otros idiomas solo tengan lo traducible no es una convención nuestra:
 * un campo sin `i18n` en config.yml es I18N_FIELD.NONE y Decap no lo escribe
 * fuera del idioma por defecto.
 */
function traducible<C extends z.ZodRawShape, T extends z.ZodRawShape>(compartido: C, traducido: T) {
  const otroIdioma = z.object(traducido).partial().optional();
  return z.object({
    es: z.object({ ...compartido, ...traducido }),
    ca: otroIdioma,
    en: otroIdioma,
  });
}

/**
 * El punto que escribe el widget de mapa de Decap: una geometría GeoJSON
 * serializada, `{"type":"Point","coordinates":[lng, lat]}`. Se traduce aquí a
 * latitud y longitud para que nadie más tenga que saber de GeoJSON, y para que
 * un punto mal formado rompa el build en vez de dejar el mapa en blanco.
 */
const punto = z.string().transform((valor, ctx) => {
  let coordenadas: unknown;
  try {
    coordenadas = (JSON.parse(valor) as { coordinates?: unknown }).coordinates;
  } catch {
    ctx.addIssue({ code: 'custom', message: `La ubicación no es un punto válido: ${valor}` });
    return z.NEVER;
  }

  const [lng, lat] = Array.isArray(coordenadas) ? coordenadas : [];
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    ctx.addIssue({ code: 'custom', message: `La ubicación no tiene coordenadas: ${valor}` });
    return z.NEVER;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    ctx.addIssue({ code: 'custom', message: `La ubicación cae fuera del mundo: ${valor}` });
    return z.NEVER;
  }

  return { lat, lng };
});

/* ---------------------------------------------------------------------------
   Colaboradores — alimentan el mapa, la lista de chips y el panel lateral.
   Un colaborador, un punto en el mapa. No hay agrupaciones: añadir uno nuevo
   es crear este fichero y marcar su sitio, nada más.
--------------------------------------------------------------------------- */
const partners = defineCollection({
  loader: carpeta('partners'),
  schema: traducible(
    {
      name: z.string(),
      location: punto,
      /* Provisional: solo tiene que distinguirse del resto. La intención a futuro
         es sustituirlo por el logo de la entidad. */
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Usa un color en formato #rrggbb'),
      /* Iniciales que se ven dentro del círculo mientras no haya logo. */
      initials: z.string().min(1).max(3),
      order: z.number().default(99),
    },
    {
      place: z.string(),
      description: z.string(),
    }
  ),
});

/* ---------------------------------------------------------------------------
   Proyectos — tarjeta con vídeo, filtrable por temática.
--------------------------------------------------------------------------- */
const projects = defineCollection({
  loader: carpeta('projects'),
  schema: traducible(
    {
      /* Las temáticas del filtro de /proyectos. */
      theme: z.array(z.enum(['nature', 'art', 'youth'])).min(1),
      youtubeId: z.string().min(5),
      /* Línea pequeña sobre el título: "EFFIC · Ribes de Freser 2024". */
      meta: z.string(),
      date: z.string().optional(),
      /* Se muestra también en la portada. */
      featured: z.boolean().default(false),
      /* Orden dentro de la portada, que no es el de /proyectos. */
      homeOrder: z.number().optional(),
      order: z.number().default(99),
    },
    {
      title: z.string(),
      tag: z.string(),
      description: z.string(),
      /* Versión corta para la tarjeta de la portada. */
      summary: z.string().optional(),
      /* La cifra no se traduce, pero viaja con la etiqueta: Decap guarda la
         lista entera por idioma, no campo a campo. */
      stats: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
          })
        )
        .default([]),
    }
  ),
});

/* ---------------------------------------------------------------------------
   Oportunidades — convocatorias abiertas, con su cartel y su ficha.
--------------------------------------------------------------------------- */
const opportunities = defineCollection({
  loader: carpeta('opportunities'),
  schema: ({ image }) =>
    traducible(
      {
        title: z.string(),
        status: z.enum(['abierta', 'cerrada']),
        poster: image(),
        signupUrl: z.url().optional(),
        infopackUrl: z.url().optional(),
        order: z.number().default(99),
      },
      {
        /* Etiqueta sobre el cartel: "Inscripciones abiertas". */
        flag: z.string().optional(),
        posterAlt: z.string(),
        where: z.string(),
        summary: z.string(),
        /* Versiones cortas para la tarjeta de la portada. */
        whereShort: z.string().optional(),
        summaryShort: z.string().optional(),
        facts: z.array(z.string()).default([]),
        findLabel: z.string().optional(),
        findText: z.string().optional(),
      }
    ),
});

/* ---------------------------------------------------------------------------
   Convocatorias anteriores — solo el nombre, es un listado de trayectoria.
   Sin i18n: son nombres propios de proyecto, no se traducen.
--------------------------------------------------------------------------- */
const archive = defineCollection({
  loader: carpeta('archive'),
  schema: z.object({
    title: z.string(),
    year: z.number().optional(),
    order: z.number().default(99),
  }),
});

/* ---------------------------------------------------------------------------
   Equipo — una persona destacada (lead) y el resto en rejilla.
--------------------------------------------------------------------------- */
const team = defineCollection({
  loader: carpeta('team'),
  schema: ({ image }) =>
    traducible(
      {
        name: z.string(),
        photo: image().optional(),
        /* Dibujo que acompaña a quien no tiene foto. */
        icon: z.enum(['leaf', 'music', 'sprout']).default('leaf'),
        lead: z.boolean().default(false),
        order: z.number().default(99),
      },
      {
        role: z.string(),
        bio: z.string(),
        photoAlt: z.string().optional(),
      }
    ),
});

/* ---------------------------------------------------------------------------
   Galería — imagen subida + enlace al post. La imagen NUNCA es una URL remota:
   las de Instagram van firmadas y caducan, y romperían el build (ver CLAUDE.md §4).
--------------------------------------------------------------------------- */
const gallery = defineCollection({
  loader: carpeta('gallery'),
  schema: ({ image }) =>
    traducible(
      {
        image: image(),
        instagramUrl: z.url().startsWith('https://www.instagram.com/'),
        credit: z.string().optional(),
        order: z.number().default(99),
      },
      {
        alt: z.string(),
      }
    ),
});

/* ---------------------------------------------------------------------------
   Ajustes — un único fichero con lo que se repite en todo el sitio.
   Sin i18n: correos, URLs y nombres de red social son iguales en los tres.
--------------------------------------------------------------------------- */
const config = defineCollection({
  loader: carpeta('config'),
  schema: z.object({
    email: z.email(),
    social: z.array(
      z.object({
        name: z.string(),
        url: z.url(),
      })
    ),
    instagramProfile: z.url(),
  }),
});

/* ---------------------------------------------------------------------------
   Textos de cada página — todo lo que se lee en pantalla y no es una ficha de
   otra colección: titulares, entradillas, textos de botones.

   El esquema valida la forma, no una lista cerrada de campos: secciones que
   contienen textos. Así la ONG puede añadir un párrafo desde el CMS sin que
   haya que tocar este fichero. Que un texto concreto exista lo comprueba la
   plantilla al leerlo: si falta, el build falla (ver `usePageText` en
   src/lib/content.ts).
--------------------------------------------------------------------------- */
const secciones = z.record(z.string(), z.record(z.string(), z.string()));
const pages = defineCollection({
  loader: carpeta('pages'),
  schema: z.object({
    es: secciones,
    ca: secciones.optional(),
    en: secciones.optional(),
  }),
});

export const collections = {
  pages,
  partners,
  projects,
  opportunities,
  archive,
  team,
  gallery,
  config,
};
