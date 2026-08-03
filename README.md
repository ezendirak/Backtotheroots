# Back to the Roots — web

Web de la ONG Back to the Roots, reconstruida con **Astro** y editable desde un CMS
por personas sin perfil técnico.

Las decisiones técnicas, la arquitectura y las fases del proyecto están en
[`CLAUDE.md`](CLAUDE.md). Ese fichero es la fuente de verdad: léelo antes de tocar nada.

## Poner en marcha el proyecto

```bash
npm install
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor local en `localhost:4321` |
| `npm run build` | Genera el sitio estático en `dist/` |
| `npm run preview` | Sirve `dist/` para revisarlo antes de publicar |
| `npm run check` | Comprueba tipos y errores de Astro |

## Despliegue

Automático: cada push a `main` construye y publica en Cloudflare Pages.
Las ramas distintas de `main` generan una URL de vista previa.

## `legacy/`

La web anterior (HTML/CSS/JS plano) se conserva ahí como referencia durante la
migración. Se borra al cerrar la fase 5.
