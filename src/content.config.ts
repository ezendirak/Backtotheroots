import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

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
   Varios colaboradores con la misma ubicación se agrupan solos: el clúster de
   Barcelona sale de estos datos, no está escrito en ningún sitio.
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
    /* Agrupa a este colaborador con otros bajo un mismo punto del mapa. */
    cluster: z.string().optional(),
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
    stats: z
      .array(
        z.object({
          value: z.string(),
          label: i18nText,
        })
      )
      .default([]),
    date: z.string(),
    /* Se muestra también en la portada. */
    featured: z.boolean().default(false),
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
      poster: image(),
      posterAlt: i18nText,
      where: i18nText,
      summary: i18nText,
      facts: z.array(i18nText).default([]),
      findLabel: i18nText.optional(),
      findText: i18nText.optional(),
      signupUrl: z.string().url().optional(),
      infopackUrl: z.string().url().optional(),
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
      instagramUrl: z.string().url().startsWith('https://www.instagram.com/'),
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
    email: z.string().email(),
    social: z.array(
      z.object({
        name: z.string(),
        url: z.string().url(),
      })
    ),
    instagramProfile: z.string().url(),
  }),
});

export const collections = { partners, projects, opportunities, archive, team, gallery, config };
