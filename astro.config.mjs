// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // URL pública del sitio. Necesaria para canonical absolutos, hreflang y sitemap.
  // Cambia a https://backtotheroots.cat en la fase 5, al conectar el dominio.
  site: 'https://backtotheroots.pages.dev',

  // Todas las rutas terminan en barra: /es/colabora/. Una sola forma de escribir
  // cada URL evita duplicados para Google.
  trailingSlash: 'always',

  // La raíz manda al castellano. Cloudflare lo resuelve antes con public/_redirects;
  // esto es la red de seguridad y hace que también funcione en local.
  redirects: {
    '/': '/es/',
  },
});
