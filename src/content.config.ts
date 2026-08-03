import { glob } from 'astro/loaders';
/* `z` se importa de astro/zod, no de astro:content: es la misma instancia que
   usa Astro por dentro y su reexport en astro:content está marcado obsoleto. */
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

/**
 * Texto traducible. El castellano es obligatorio porque es el idioma canónico;
 * catalán e inglés son opcionales y, si faltan, la página cae al castellano.
 * Nunca se queda en blanco.
 */
const i18nText = z.object({
  es: z.string(),
  ca: z.string().optional(),
  en: z.string().optional(),
});

const carpeta = (nombre: string) => glob({ pattern: '**/*.json', base: `./src/content/${nombre}` });

/* ---------------------------------------------------------------------------
   Colaboradores — alimentan el mapa, la lista de chips y el panel lateral.
   Un colaborador, un punto en el mapa. No hay agrupaciones: añadir uno nuevo
   es crear este fichero y marcar su sitio, nada más.
--------------------------------------------------------------------------- */
const partners = defineCollection({
  loader: carpeta('partners'),
  schema: z.object({
    name: z.string(),
    place: i18nText,
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    /* Provisional: solo tiene que distinguirse del resto. La intención a futuro
       es sustituirlo por el logo de la entidad. */
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Usa un color en formato #rrggbb'),
    /* Iniciales que se ven dentro del círculo mientras no haya logo. */
    initials: z.string().min(1).max(3),
    description: i18nText,
    order: z.number().default(99),
  }),
});

/* ---------------------------------------------------------------------------
   Proyectos — tarjeta con vídeo, filtrable por temática.
--------------------------------------------------------------------------- */
const projects = defineCollection({
  loader: carpeta('projects'),
  schema: z.object({
    title: i18nText,
    /* Las temáticas del filtro de /proyectos. */
    theme: z.array(z.enum(['nature', 'art', 'youth'])).min(1),
    tag: i18nText,
    youtubeId: z.string().min(5),
    /* Línea pequeña sobre el título: "EFFIC · Ribes de Freser 2024". */
    meta: z.string(),
    description: i18nText,
    /* Versión corta para la tarjeta de la portada. */
    summary: i18nText.optional(),
    stats: z
      .array(
        z.object({
          value: z.string(),
          label: i18nText,
        })
      )
      .default([]),
    date: z.string().optional(),
    /* Se muestra también en la portada. */
    featured: z.boolean().default(false),
    /* Orden dentro de la portada, que no es el de /proyectos. */
    homeOrder: z.number().optional(),
    order: z.number().default(99),
  }),
});

/* ---------------------------------------------------------------------------
   Oportunidades — convocatorias abiertas, con su cartel y su ficha.
--------------------------------------------------------------------------- */
const opportunities = defineCollection({
  loader: carpeta('opportunities'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      status: z.enum(['abierta', 'cerrada']),
      /* Etiqueta sobre el cartel: "Inscripciones abiertas". */
      flag: i18nText.optional(),
      poster: image(),
      posterAlt: i18nText,
      where: i18nText,
      summary: i18nText,
      /* Versiones cortas para la tarjeta de la portada. */
      whereShort: i18nText.optional(),
      summaryShort: i18nText.optional(),
      facts: z.array(i18nText).default([]),
      findLabel: i18nText.optional(),
      findText: i18nText.optional(),
      signupUrl: z.url().optional(),
      infopackUrl: z.url().optional(),
      order: z.number().default(99),
    }),
});

/* ---------------------------------------------------------------------------
   Convocatorias anteriores — solo el nombre, es un listado de trayectoria.
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
    z.object({
      name: z.string(),
      role: i18nText,
      bio: i18nText,
      photo: image().optional(),
      photoAlt: i18nText.optional(),
      lead: z.boolean().default(false),
      order: z.number().default(99),
    }),
});

/* ---------------------------------------------------------------------------
   Galería — imagen subida + enlace al post. La imagen NUNCA es una URL remota:
   las de Instagram van firmadas y caducan, y romperían el build (ver CLAUDE.md §4).
--------------------------------------------------------------------------- */
const gallery = defineCollection({
  loader: carpeta('gallery'),
  schema: ({ image }) =>
    z.object({
      image: image(),
      alt: i18nText,
      instagramUrl: z.url().startsWith('https://www.instagram.com/'),
      credit: z.string().optional(),
      order: z.number().default(99),
    }),
});

/* ---------------------------------------------------------------------------
   Ajustes — un único fichero con lo que se repite en todo el sitio.
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
   contienen textos, y cada texto con su castellano obligatorio. Así la ONG
   puede añadir un párrafo desde el CMS sin que haya que tocar este fichero.
   Que un texto concreto exista lo comprueba la plantilla al leerlo: si falta,
   el build falla (ver `usePageText` en src/lib/content.ts).
--------------------------------------------------------------------------- */
const pages = defineCollection({
  loader: carpeta('pages'),
  schema: z.record(z.string(), z.record(z.string(), i18nText)),
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
