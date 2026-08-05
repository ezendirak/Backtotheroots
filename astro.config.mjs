// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // URL pública del sitio. Necesaria para canonical absolutos, hreflang y sitemap.
  // El `.pages.dev` sigue existiendo, pero el canónico es el dominio propio.
  site: 'https://backtotheroots.cat',

  // Todas las rutas terminan en barra: /es/colabora/. Una sola forma de escribir
  // cada URL evita duplicados para Google.
  trailingSlash: 'always',

  // La raíz manda al castellano. Cloudflare lo resuelve antes con public/_redirects;
  // esto es la red de seguridad y hace que también funcione en local.
  redirects: {
    '/': '/es/',
  },
});
