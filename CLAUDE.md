# CLAUDE.md — Back to the Roots

Guía de trabajo para el rediseño técnico de la web de la ONG **Back to the Roots**.
Este fichero es la fuente de verdad sobre decisiones tomadas. Si algo aquí choca con
una intuición tuya, gana este fichero; si crees que este fichero se equivoca, dilo
antes de escribir código.

> Revisión 4 — 4 de agosto de 2026. Cambios de la revisión 2 en §12, los de la 3 en §13,
> los de la 4 en §15.

---

## 1. Contexto

Back to the Roots es una entidad sin ánimo de lucro (Cataluña, fundada en **2020**) de
educación ambiental y expresión artística para juventud europea.

**Web actual:** HTML/CSS/JS plano, 6 páginas, desplegado en Netlify
(`bespoke-kelpie-2a70f2.netlify.app`). Funciona, pero es inmantenible: layout duplicado
en cada fichero, datos incrustados en el markup y traducciones aplicadas en cliente.

**Objetivo:** misma web (plana, informativa, mismo contenido y misma identidad visual),
reconstruida para que **una persona sin perfil técnico pueda ampliar contenido sin
tocar código**.

### Qué hay que arreglar (los tres problemas de raíz)

1. **Layout duplicado ×6.** Header, nav y footer copiados literalmente en cada `.html`.
   Ya han divergido: en `colabora.html` el botón "Únete" apunta a `contacto.html` con la
   clave `common.nav.write`, y en las otras cinco páginas a `colabora.html` con
   `common.nav.join`. Es exactamente el fallo que produce copiar y pegar.
2. **Datos esparcidos.** Añadir un colaborador hoy exige tocar 5 sitios: el array `SPOTS`
   del `<script>` inline de `colabora.html`, el `<li><button>` de la lista, el
   `<div class="colabpanel__card">` del panel, y las claves de `i18n.js` en 3 idiomas.
3. **i18n en cliente.** El texto vive duplicado (HTML + diccionario), hay parpadeo al
   cargar y Google solo indexa la versión castellana: `?lang=ca` no posiciona. La
   duplicación ya ha divergido dentro del propio castellano: `index.html` muestra un
   párrafo corto en "Quiénes somos" y la clave `home.who.p` del diccionario ES trae uno
   más largo, así que el texto **cambia al cargar el JS aunque el idioma sea el español**.

### Qué está bien hecho y NO se debe romper

- **Facade de vídeo de YouTube**: miniatura estática, y solo al pulsar play se inyecta el
  iframe (`youtube-nocookie`), con fallback de `maxresdefault` → `hqdefault`. Es la
  solución correcta. Se conserva, componentizada.
- **Galería de Instagram como imágenes locales** que enlazan al post. Se conserva.
- **Accesibilidad**: skip link, `aria-label`, `aria-current`, `aria-expanded` en el menú
  móvil, `role="application"` en el mapa, `prefers-reduced-motion`. Es el suelo mínimo,
  no el techo: al componentizar hay que reponerlo todo, no darlo por hecho.
- **Identidad visual**: paleta bosque/avena/clay, Bricolage Grotesque + Hanken Grotesque
  + Caveat, animaciones de vine y reveal on scroll.

---

## 2. Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Framework | **Astro + TypeScript** | Genera HTML estático puro (0 JS por defecto), componentes, colecciones tipadas, i18n con rutas reales |
| CMS | **Decap CMS** | MIT, gratis siempre, contenido en el propio repo Git |
| Auth editoras | **DecapBridge** | Login por email y contraseña, sin cuenta de GitHub |
| Hosting | **Cloudflare Pages** | 500 builds/mes y ancho de banda ilimitado. Netlify descartado, ver §6 |
| Formulario | **Web3Forms** | 250 envíos/mes gratis, sin backend. Netlify Forms **no funciona** fuera de Netlify |
| Mapa | **Leaflet** como isla + tiles CARTO Positron | Ya funciona, es ligero, no requiere API key |
| Instagram | **Galería curada desde el CMS** | La API oficial murió para cuentas personales (ver §5) |
| Diseño | **Conservar identidad, refinar detalles** | Decisión explícita del cliente |
| Idiomas | **ES / CA / EN** con rutas `/es/ /ca/ /en/` y **slug traducido** | SEO real con `hreflang`: cada idioma posiciona con sus palabras |
| Idioma canónico | **Castellano** | El texto bueno es el ES. CA y EN se derivan de él, nunca al revés |

### Quién mantiene el contenido

**Gente de la ONG sin perfil técnico.** Esto es la restricción que gobierna todo el
diseño técnico. Cualquier decisión que obligue a un no-programador a abrir un editor de
texto, hacer un commit o entender YAML es una decisión equivocada.

---

## 3. Arquitectura

El proyecto Astro vive en la **raíz del repositorio**. La web antigua se conserva en
`legacy/` como referencia durante la migración y **se borra al cerrar la fase 5**.

```
src/
  content/
    partners/       irehom.json, cantonal.json, morera.json…
    projects/       shining-together.json, …
    opportunities/  terratribe-2026.json
    archive/        convocatorias cerradas (solo título)
    team/           saul-nebot.json, …
    gallery/        (imagen subida + enlace al post de Instagram)
    config/         site.json  (email y redes sociales)
    pages/          home.json, about.json…  (titulares y textos de botón)
  i18n/             es.json  ca.json  en.json   ← SOLO textos de UI
  components/       Header, Footer, VideoFacade, PartnerMap, ProjectCard, Gallery
  layouts/          Base.astro
  pages/[lang]/     index, [about], [projects], [opportunities], [collaborate], [contact], [thanks]
  styles/           tokens.css  base.css
public/
  admin/            index.html + config.yml   (Decap CMS)
    decap/          el panel copiado desde npm — no se versiona
  _redirects
  assets/img/
scripts/            copiar-decap.mjs
legacy/             la web actual, borrar al final
```

Son **7 rutas por idioma**, no 6: `/gracias/` es lo que necesita el formulario para
seguir funcionando con JavaScript desactivado.

### URLs traducidas

Cada página tiene un **identificador interno en inglés** (`about`, `collaborate`…) que
nunca aparece en pantalla, y un **slug propio en cada idioma**:

| Página | ES | CA | EN |
|---|---|---|---|
| about | `nosotras` | `nosaltres` | `about-us` |
| projects | `proyectos` | `projectes` | `projects` |
| opportunities | `oportunidades` | `oportunitats` | `opportunities` |
| collaborate | `colabora` | `collabora` | `get-involved` |
| contact | `contacto` | `contacte` | `contact` |
| thanks | `gracias` | `gracies` | `thank-you` |

Los slugs salen de las etiquetas del menú que la ONG ya tenía traducidas; no se inventan.
La tabla vive **en un solo sitio**, `src/i18n/index.ts`, y de ahí se derivan el menú, el
pie, el selector de idioma y los `hreflang`. Consecuencia buscada: cambiar de idioma deja
al visitante en la misma página, no en la portada.

Por eso los ficheros de `pages/[lang]/` se llaman `[about].astro` y no `nosotras.astro`:
el nombre del fichero es el parámetro de ruta, y su valor concreto lo pone
`getStaticPaths` según el idioma.

### Regla de oro

> **El contenido nunca se escribe en un componente.** Si un dato aparece en pantalla y
> puede cambiar sin que cambie el diseño, va en `src/content/`.

Consecuencia directa: añadir un colaborador es **crear un fichero**, y aparece solo en el
mapa, en la lista de chips y en el panel lateral, en los tres idiomas.

### Esquemas

Todas las colecciones se definen con **Zod** en `src/content.config.ts`. Los campos
obligatorios se validan en tiempo de build: si falta la ubicación de un colaborador o el ID
de vídeo de un proyecto, **el build falla**. Es intencionado — mejor romper el deploy que
publicar una página rota.

Las colecciones traducibles se componen con el ayudante `traducible(compartido, traducido)`,
que genera la forma de §7: `es` con todo y obligatorio, `ca`/`en` opcionales y parciales.
`archive` y `config` no llevan i18n — son nombres propios, correos y URLs.

Campos mínimos por colección:

- **partners**: `name`, `place`, `location` (punto GeoJSON del widget de mapa), `color`,
  `initials`, `description` (por idioma)
- **projects**: `title`, `theme[]`, `youtubeId`, `description` (por idioma), `date`, `stats[]?`
- **opportunities**: `title`, `dates`, `status` (abierta/cerrada), `pdf?`, `body`
- **archive**: `title`, `year?`
- **team**: `name`, `role` (por idioma), `bio` (por idioma), `photo?`, `lead` (bool)
- **gallery**: `image` (fichero subido), `instagramUrl`, `alt`
- **config**: emails, redes sociales, textos del footer

---

## 4. Requisitos funcionales

### Mapa de colaboradores (`/colabora`)

- Leaflet cargado **solo** en esta página y **solo** cuando hace falta. Entra como
  **dependencia npm**, nunca desde un CDN.
- **No es una isla de framework.** `client:visible` exige React, Preact o similar, y meter
  un framework entero para un mapa es justo lo contrario de lo que persigue este proyecto.
  El componente es un `.astro` normal con un `<script>` que hace `import()` dinámico de
  Leaflet cuando el contenedor entra en viewport **o** cuando alguien pulsa un chip, lo que
  ocurra antes. Mismo resultado, cero framework: el HTML no referencia Leaflet, solo se
  descarga al usarlo.
- **Sin JavaScript la página sigue leyéndose**: las fichas de los colaboradores se
  renderizan en el servidor y se ven todas apiladas; el mapa y los chips solo aparecen
  cuando el JS confirma que puede manejarlos.
- Marcadores personalizados: círculo con el color del colaborador y borde blanco. Los
  colores actuales son **provisionales**: solo tienen que distinguirse entre sí. La
  intención a futuro es usar los logos de cada entidad, así que el componente no debe
  asumir que el identificador visual es un color plano.
- **Un colaborador, un punto. No hay agrupaciones.** La web anterior juntaba las tres
  entidades de Barcelona bajo un único marcador con badge numérico, con su mini-lista y su
  botón "volver", porque las tres compartían la coordenada del centro de la ciudad. Con las
  direcciones reales (agosto de 2026) cada una tiene su punto y todo eso sobra: menos
  código, menos CSS y un campo menos que explicar en el CMS. Añadir un colaborador es
  crear un fichero y marcar su sitio en el mapa.
- Al pulsar un marcador o un chip de la lista: se resalta el punto, el mapa vuela hacia
  él y el panel lateral muestra su ficha.
- Datos leídos de la colección `partners`. **Nada hardcodeado.** La coordenada llega como
  punto GeoJSON en texto (lo que escribe el widget de mapa del CMS) y el esquema Zod la
  convierte a `lat`/`lng`: fuera del contenido nadie tiene que saber qué es GeoJSON.
- Atribución obligatoria en el mapa: `© CARTO © OpenMapTiles © OpenStreetMap contributors`
  (la atribución actual omite OpenMapTiles — corregirlo).
- `scrollWheelZoom: false` para no secuestrar el scroll de la página.

### Vídeos

- Componente `<VideoFacade youtubeId="..." title="..." />`.
- Miniatura estática; el iframe de `youtube-nocookie.com` solo se inyecta al pulsar play.
- Mantener el fallback de miniatura: si `naturalWidth <= 120`, cambiar a `hqdefault.jpg`.
- Clic en la miniatura (fuera del botón) → abre el vídeo en YouTube.
- Al cambiar de filtro en `/proyectos`, se detienen los vídeos en marcha.

### Galería de Instagram

- Rejilla de imágenes locales optimizadas, cada una enlazando a su post.
- Se gestiona desde el CMS con **dos campos**: subir imagen + pegar el enlace del post.
- **La imagen es un fichero subido, nunca una URL remota.** Las URLs de imagen de
  Instagram (`scontent.cdninstagram.com/…`) van firmadas y caducan en días o semanas: la
  galería se quedaría en blanco sola y, si además se optimiza en build, **el build
  fallaría y no se podría publicar nada**. Lo único estable es la URL del post
  (`instagram.com/p/XXXX/`).
- **No** se integra la API de Meta (ver §5).

### Formulario de contacto

- **Web3Forms** con honeypot + envío AJAX (mensaje de confirmación sin recargar).
- Debe seguir funcionando con JS desactivado (POST nativo con `redirect` a `/gracias/`).
- La access key es pública por diseño, va en el HTML. No es un secreto.
- Activar hCaptcha si aparece spam (está incluido en el plan gratuito).
- Al migrar hay que **borrar** los restos de Netlify Forms: `data-netlify`,
  `netlify-honeypot`, el input oculto `form-name` y el POST a `/` de `script.js`.

### SEO

- `hreflang` recíproco en las tres versiones de cada página + sitemap por idioma.
- `canonical` **absoluto** (hoy son relativos: `href="index.html"`), igual que `og:image`.
- Redirects 301 desde las URLs viejas (`/colabora.html` → `/es/colabora/`) en
  `public/_redirects`.
- **Los enlaces con `?lang=ca` / `?lang=en` no se pueden redirigir.** Cloudflare Pages
  compara solo la ruta, nunca la query, así que caen en la versión castellana de la página
  correcta. Se asume la pérdida: ese parámetro no llegó a indexarse. Resolverlo exigiría
  una Pages Function o JavaScript en cliente, y no compensa.
- Matiz honesto: esos redirects solo actúan en el dominio del sitio nuevo. Lo indexado
  bajo `bespoke-kelpie-2a70f2.netlify.app` se pierde al apagar Netlify. Es asumible: un
  subdominio autogenerado no posiciona prácticamente nada.

### Rendimiento y privacidad

- Fuentes **self-hosted** vía `@fontsource`. Fuera Google Fonts: bloquea el render y
  transmite IPs a Google (RGPD).
- **La familia del cuerpo es `Hanken Grotesk`, no "Hanken Grotesque".** La web actual pide
  el nombre inexistente: Google devuelve 400 si se pide sola, y en la petición combinada la
  descarta en silencio sirviendo solo Bricolage y Caveat. Es decir, **todo el texto de
  cuerpo de la web actual se ve con la fuente del sistema**. Al self-hostear se corrige, y
  eso hace que el sitio nuevo no se vea idéntico al viejo: se ve como estaba diseñado.
- Imágenes con el componente `<Image>` de Astro → AVIF/WebP responsive. Las actuales son
  JPG de hasta 1536 px sin optimizar: 3,4 MB entre 11 ficheros.
- **Cero peticiones a terceros en runtime**, con una excepción consciente: las miniaturas
  de YouTube siguen viniendo de `i.ytimg.com`. Descargarlas en build sería algo más
  rápido, pero ata cada build a que YouTube responda y complica el fallback
  maxres → hq. Queda anotado como mejora futura, no se hace ahora.
- Sin cookies de terceros → **sin banner de cookies**. Esto es un requisito, no un
  accidente: mantenerlo así.
- Objetivo Lighthouse: 95+ en las cuatro categorías.

---

## 5. Instagram: por qué NO hay feed automático

Verificado en agosto de 2026:

- La **Instagram Basic Display API se apagó el 4 de diciembre de 2024**. Sus endpoints
  devuelven error. No hay vuelta atrás.
- **No existe ninguna API oficial que acceda a cuentas personales.** Haría falta convertir
  la cuenta a Profesional (Business o Creator), registrar una app en Meta, pasar revisión,
  y refrescar un token cada ~30 días mediante un cron real.
- Es técnicamente gratis, pero el día que el refresco falle la galería se queda en blanco
  y nadie en la ONG sabrá por qué. **Coste de mantenimiento inaceptable para el perfil de
  usuario de este proyecto.**

Si en el futuro se quiere automatizar: función programada que cachea los posts en un JSON
del repo. Se añade encima sin rehacer nada.

---

## 6. Restricción: coste cero

**Todo el stack debe ser gratuito de forma sostenible.** No "gratis con tarjeta de crédito
por si acaso". Estado verificado en agosto de 2026:

| Pieza | Coste | Nota |
|---|---|---|
| Astro | 0 € | MIT |
| Decap CMS | 0 € | MIT, sin tiers de pago ni límite de editoras |
| Cloudflare Pages | 0 € | 500 builds/mes, ancho de banda ilimitado |
| DecapBridge | 0 € | Invitaciones por email, login con Google/Microsoft o contraseña |
| Web3Forms | 0 € | 250 envíos/mes, historial de 30 días |
| Leaflet | 0 € | BSD-2 |
| Tiles CARTO | 0 € | Uso no comercial, **atribución obligatoria** |
| Fuentes (OFL) | 0 € | Self-hosted |
| GitHub | 0 € | Repo privado o público, indistinto |
| YouTube embeds | 0 € | — |

DecapBridge es la pieza menos consolidada del stack y el único punto donde "gratis para
siempre" depende de un servicio pequeño. Si algún día cambia de política, se busca otra
opción gratuita de autenticación: **el contenido no se pierde nunca, vive en Git.**

### Por qué se descarta Netlify (decisión cerrada, agosto 2026)

La cuenta actual está en el **modelo de créditos**: 300 créditos/mes, **15 créditos por
deploy de producción** → un máximo de ~20 deploys al mes, y eso gastando cero en ancho de
banda (que cuesta 20 créditos/GB del mismo saldo).

En el momento de decidir quedaban **164 créditos = 10 deploys**. La migración a Astro no
cabe ni para arrancar.

Matiz honesto: en régimen estacionario Netlify serviría, porque la web se actualiza pocas
veces al año. El problema es que **no se llega al régimen estacionario**: los meses de
desarrollo agotan el presupuesto repetidamente.

Factor decisivo: el plan gratuito **no admite auto-recarga, el límite es un tope duro**.
Si se supera, el sitio queda **suspendido hasta el mes siguiente**. Para una ONG cuya web
capta participantes, un pico de tráfico que tumba el sitio sin aviso es inaceptable.

**No migrar el proyecto a Netlify más adelante.** Hacerlo después obligaría a rehacer DNS,
autenticación del CMS y formulario con el sitio ya en producción.

### Nota sobre Pages vs Workers

Cloudflare recomienda **Workers con static assets** para proyectos nuevos, pero **Pages
sigue plenamente soportado** y no hay fecha de migración forzosa. Para este proyecto usamos
**Pages**: flujo git-push, previews por rama de serie, sin `wrangler` que configurar. Es lo
más simple de mantener. Si algún día hace falta, la migración a Workers son cambios de
configuración, no de código.

---

## 7. El CMS que verá la ONG

Panel en `/admin`. Ocho colecciones visibles, con etiquetas **en castellano** y textos de
ayuda en cada campo:

```
Proyectos       → título, tema, ID de YouTube, cifras, textos ES/CA/EN
Colaboradores   → nombre, ubicación (selector de mapa), color, textos
Oportunidades   → fechas, plazas, cartel, dosier, estado (abierta/cerrada)
Convocatorias   → listado histórico, solo título
Equipo          → nombre, rol, biografía, foto
Galería         → imagen (subir) + enlace al post de Instagram
Ajustes         → email y redes sociales
Textos de las páginas → titulares, entradillas y textos de botón de las 7 páginas
```

Requisitos del panel:

- Las editoras entran con **email y contraseña**, por invitación. Nunca se les pide una
  cuenta de GitHub ni entender qué es un commit.
  El sitio de DecapBridge está en **auth type «Classic»**, y con Classic el panel dibuja
  solo email y contraseña: no hay botón de Google aunque la cuenta de DecapBridge se haya
  creado con Google, que son dos puertas distintas. Si algún día se quiere entrar con
  Google o Microsoft, se cambia el sitio a **PKCE** en DecapBridge y el `backend` pasa a
  usar `auth_type: pkce` con `base_url` y `app_id` en vez de `identity_url`. Entonces el
  panel redirige a la página de login de DecapBridge, que es donde viven esos botones.
- La ubicación de un colaborador se elige con el **widget de mapa**, no escribiendo
  coordenadas a mano.
- Los campos por idioma usan la configuración `i18n` nativa de Decap con
  `structure: single_file` y el castellano por defecto. **El idioma va en el primer nivel
  del fichero**, no dentro de cada campo — ver §15.
- Al final del proyecto: **guía corta en castellano** (con capturas) para la ONG.

### Cómo se guarda un fichero traducido

Es la decisión que gobierna el formato de todo `src/content/`, así que conviene tenerla
delante antes de tocar un esquema:

```json
{
  "es": { "name": "Irehom", "place": "Castellgalí, Bages", "color": "#6e8b3d", "…": "…" },
  "ca": { "place": "Castellgalí, Bages", "description": "…" },
  "en": { "place": "Castellgalí, Bages", "description": "…" }
}
```

El castellano lleva **todos** los campos; catalán e inglés, **solo los traducibles**. No es
una convención nuestra: en `config.yml`, un campo sin `i18n: true` es `I18N_FIELD.NONE` y
Decap ni lo muestra ni lo escribe fuera del idioma por defecto.

En las plantillas eso se aplana con `localize(entry.data, lang)`, que parte del castellano
y le encima lo traducido. **Un campo sin traducir sale en castellano, nunca en blanco.**

---

## 8. Convenciones de código

- **TypeScript estricto.** Nada de `any`.
- **Componentes `.astro` por defecto.** Solo se usa JS en cliente cuando la interactividad
  lo exige. Hoy son dos sitios y no más: el **layout** (menú móvil, raíz de scroll y
  aparición de bloques, ~30 líneas que ya existían en la web actual y son parte de la
  identidad visual) y el **mapa** de colaboradores, que además es la única isla.
- **Cero JS en cliente** en páginas que no lo necesiten. Es una web informativa.
- **Herramientas de desarrollo aparte.** `@astrojs/check` y `typescript` son
  `devDependencies`: hacen falta para que `npm run check` valide los tipos, y no viajan al
  navegador. La regla de no meter dependencias se refiere a lo que acaba en la página.
- **CSS con tokens** en `src/styles/tokens.css` (colores, tipografías, espaciados, radios).
  Estilos con scope en cada componente. **Prohibidos los hacks globales** tipo
  `.leaflet-container img { max-width: none !important }` — eso era el síntoma del problema
  que estamos eliminando. Fuera también los ~40 atributos `style=` sueltos del markup
  actual: o es un token, o es un estilo con scope.
- **Nombres de fichero en kebab-case y sin acentos.** El repo actual tiene un `LÉEME.md`
  versionado como `L├ëEME.md` por doble codificación en Windows; pasa a `README.md`.
- Claves de contenido en inglés, textos visibles en el idioma que toque.
- **Commits en castellano**, imperativo: `añade colección de colaboradores`.
- Los `console.log` no llegan a `main`.

---

## 9. Fases

Cada fase se cierra con **la web desplegada en Cloudflare Pages y verificada en la URL
pública**. Nada de ramas largas. La regla no es ceremonia: la fase 4 (CMS) es
literalmente imposible de terminar en local, porque Decap y DecapBridge autentican contra
una URL pública.

0. **Base** — repo en GitHub, proyecto en Cloudflare Pages conectado, deploy de un "hola
   mundo" verificado. Sin esto no empieza nada.
1. **Esqueleto** — proyecto Astro, tokens de diseño, layout base, Header/Footer una sola
   vez, las 7 rutas con `/es/ /ca/ /en/` y redirects desde las URLs viejas (`_redirects`).
2. **Contenido** — esquemas Zod y migración de todo el texto e imágenes actuales.
3. **Componentes con miga** — mapa de colaboradores (isla Leaflet alimentada por la
   colección) y facade de vídeo componentizada.
4. **CMS** — Decap, autenticación, invitaciones y guía en castellano para la ONG.
5. **Pulido y corte** — Lighthouse, sitemap con `hreflang`, formulario de contacto,
   dominio propio (`backtotheroots.cat`) y baja del sitio antiguo en Netlify una vez el
   nuevo esté verificado en producción. Borrar `legacy/`.

El dominio **no se conecta a Pages hasta la fase 5**. Hasta entonces se trabaja sobre la
URL `*.pages.dev`.

---

## 10. Reglas para el asistente

- **No empieces una fase sin que la anterior esté desplegada y verificada.**
- **No metas dependencias sin preguntar.** Cada paquete es deuda futura para alguien que
  no programa. Si algo se resuelve con 20 líneas propias, se escriben las 20 líneas.
- **No cambies el diseño visual por iniciativa propia.** "Refinar detalles" significa
  rendimiento, accesibilidad y consistencia de tokens — no reinterpretar la marca.
- **No inventes contenido.** Todo el texto sale de la web actual o lo aporta la ONG. Si
  falta un dato, pregunta; no rellenes con *lorem ipsum* ni con texto plausible.
- **No inventes traducciones.** El castellano es la fuente. Donde el CA o el EN actual
  diga algo distinto del castellano bueno, se anota en §11 para que lo confirme la ONG;
  no se traduce por cuenta propia.
- **Ante la duda entre "más elegante" y "más fácil de mantener para un no-programador",
  gana lo segundo.** Siempre.
- Si una decisión de este fichero resulta equivocada durante la implementación, **dilo y
  actualiza el fichero**, no lo esquives en silencio.

---

## 11. Pendiente de la ONG

Nada de esto bloquea el desarrollo: se deja el hueco y se rellena cuando llegue. Sí
bloquea el cierre de la fase 5.

| Qué falta | Para qué | Estado |
|---|---|---|
| Enlaces de los posts de Instagram + sus imágenes | Colección `gallery`. Hoy las 4 figuras apuntan al perfil, no a publicaciones, y reutilizan fotos de la propia web | Pendiente |
| Biografía de Gisela Saló | Colección `team`. Hoy dice "Biografía en camino" | Pendiente |
| PDF del PIF | `/colabora`. Hoy el botón "Descargar PIF" es un `mailto:`, no un PDF | Pendiente, a futuro |
| Access key de Web3Forms | Formulario de contacto. Se genera en web3forms.com con el email de la ONG y llega por correo | Pendiente |
| Logos de las entidades colaboradoras | Sustituir los círculos de color del mapa | A futuro |
| Traducción de los títulos y descripciones SEO | `pages/*.json`, campo `seo`. Solo existen en castellano; las versiones CA y EN caen al castellano y eso les resta posicionamiento | Pendiente |
| Titular y botón de la página de gracias | Textos nuevos: "¡Gracias!" y "Volver al inicio", con sus versiones CA y EN. El cuerpo sí reutiliza el mensaje de confirmación que ya existía traducido | Pendiente de confirmar |
| Divergencias CA/EN respecto al castellano | Se irán listando aquí durante la fase 2 | Por detectar |

Dominio `backtotheroots.cat`: **comprado**. Se conecta en la fase 5.

---

## 12. Cambios de la revisión 2 (3 de agosto de 2026)

Tras inspeccionar el repositorio y contrastar con la ONG:

- **Año de fundación: 2020**, no 2021. El contenido actual se contradice a sí mismo
  (`nosotras.html` dice 2020, el diccionario ES dice 2021). El bueno es 2020.
- **El formulario actual es Netlify Forms**, no Web3Forms como daba por hecho la revisión
  1. Es código muerto fuera de Netlify y hay que sustituirlo, no portarlo.
- **Séptima ruta `/gracias`** por idioma, necesaria para el formulario sin JS.
- **Tres colecciones nuevas** que existen en la web actual y la revisión 1 no contemplaba:
  `team`, `archive` y `config`.
- **La galería usa imágenes subidas**, nunca URLs remotas de Instagram: caducan y romperían
  el build.
- **Leaflet entra por npm**, no desde unpkg. Igual que las fuentes, era un tercero evitable.
- **El castellano es el idioma canónico** y no se inventan traducciones.
- **Colores del mapa provisionales**, con los logos como destino.
- **El proyecto Astro va en la raíz** del repo; la web actual se conserva en `legacy/`
  hasta la fase 5.
- Se documenta el estado real del SEO heredado y lo que se pierde al apagar Netlify.

---

## 13. Cambios de la revisión 3 (4 de agosto de 2026)

Escritos al cerrar la fase 1, con el esqueleto ya desplegado y verificado:

- **Las URLs se traducen a cada idioma** (§3). Decisión del cliente durante la fase 1: la
  revisión 2 daba por hecho el slug castellano en las tres versiones.
- **`?lang=ca` no se puede redirigir** en Cloudflare Pages (§4). La revisión 2 lo prometía;
  la plataforma solo compara la ruta, no la query.
- **El layout lleva JS**, no solo el mapa (§8). Menú móvil, raíz de scroll y aparición de
  bloques ya existían en la web actual y son parte de la identidad.
- **`@astrojs/check` y `typescript` entran como dependencias de desarrollo** (§8).
- **La fuente del cuerpo estaba mal escrita** en la web actual y por eso nunca se ha
  cargado (§4). Corregido al self-hostear; el sitio nuevo se verá distinto en el cuerpo de
  texto, y es lo correcto.
- El botón "Únete" apunta a `/colabora/` en las siete rutas: se resuelve la divergencia
  descrita en §1, y la clave `common.nav.write` desaparece.
- Cinco etiquetas de accesibilidad que estaban en castellano en las tres versiones
  (`Abrir menú`, `Principal`…) pasan a traducirse. Quedan en §11 para que la ONG las
  confirme.
- **Octava colección, `pages`** (§3): los títulos, entradillas y textos de botón de cada
  página no son etiquetas de interfaz ni fichas de ninguna colección, y si se quedan
  escritos en los `.astro` la ONG no puede cambiar ni un titular desde el CMS.
- **Los títulos y descripciones SEO viven en el contenido**, no en la plantilla. Solo
  existen en castellano: nunca se tradujeron. Anotado en §11.
- **Se elimina la agrupación del mapa** (§4). La ONG facilitó las direcciones reales de las
  tres entidades de Barcelona, así que cada una tiene su punto.

---

## 14. Dónde estamos (4 de agosto de 2026)

**Fases 0 a 3 cerradas y verificadas en `backtotheroots.pages.dev`.** Cada push a `main`
construye y publica solo.

| Fase | Estado |
|---|---|
| 0 · Base | Hecha. Repo en GitHub + proyecto en Cloudflare Pages (`NODE_VERSION=22`) |
| 1 · Esqueleto | Hecha. Tokens, layout, 7 rutas × 3 idiomas con slug traducido, `_redirects` |
| 2 · Contenido | Hecha. 8 colecciones, 39 ficheros, 240 de 242 claves migradas |
| 3 · Componentes | Hecha. Mapa de Leaflet diferido y facade de vídeo |
| 4 · CMS | **Casi.** Panel escrito, probado y enlazado a DecapBridge; falta probar el login real e invitar |
| 5 · Pulido y corte | Pendiente |

Las 2 claves sin migrar (`about.learn.toolkit.soon`, `collab.ecosys.cta`) son huérfanas:
no las referenciaba ningún HTML de la web anterior.

### Cómo retomar

```bash
npm install
npm run dev      # localhost:4321
npm run check    # tipos: tiene que dar 0 errores
```

### Lo que falta de la fase 4

Hecho: `public/admin/index.html` y `config.yml` con las ocho colecciones, etiquetas y
ayudas en castellano, widget de mapa, `i18n` nativo, y el contenido reestructurado al
formato de Decap. Verificado en local con el backend `test-repo`: el panel carga sin
errores de configuración, muestra las columnas ES/CA/EN y **lee correctamente los ficheros
ya migrados**, con los campos no traducibles ocultos fuera del castellano.

Hecha también el alta en DecapBridge: el sitio está creado y su `identity_url` ya está en
`public/admin/config.yml`. El token de GitHub (contenido, lectura y escritura, solo este
repositorio) lo guarda DecapBridge; **no está ni debe estar en el repositorio**. Si algún
día caduca, el panel deja de guardar y hay que generar otro y actualizarlo allí.

Lo que queda **necesita la URL pública**, no se puede hacer en local:

1. Probar el login real en `backtotheroots.pages.dev/admin/`.
2. Invitar a una editora y comprobar el ciclo entero: entrar, cambiar un texto, guardar,
   ver el cambio publicado.
3. Guía corta en castellano con capturas.

### Y después: fase 5

Web3Forms (falta la access key), sitemap con `hreflang`, Lighthouse, dominio
`backtotheroots.cat`, borrar `legacy/` y dar de baja Netlify.

Al conectar el dominio hay **tres sitios** que apuntan todavía a `*.pages.dev`, y los tres
se cambian el mismo día:

1. `site` en `astro.config.mjs` — de ahí salen los `canonical`, los `hreflang` y el sitemap.
2. **«Decap CMS login URL» en la ficha del sitio en DecapBridge** — es a dónde devuelve
   tras autenticarse. Cloudflare no apaga el `.pages.dev` al añadir un dominio propio, así
   que `/admin` existirá en las dos direcciones: si la URL de login apunta a una y se entra
   por la otra, el login rebota a la primera. No rompe nada, pero desconcierta. Nada más de
   DecapBridge depende del dominio: `identity_url` y `gateway_url` son suyos, y `repo` es
   de GitHub.
3. Los `_redirects` de las URLs viejas, para comprobar que siguen resolviendo.

### Lo que hoy se ve a medias, a propósito

- **El formulario de contacto no envía.** Le falta la access key de Web3Forms (§11). El
  `redirect` a `/gracias/` ya apunta al idioma correcto de cada página.
- **La galería enlaza al perfil de Instagram, no a publicaciones** (§11).

### Decisión abierta

Con todo Cataluña encuadrado, los tres puntos de Barcelona se ven pegados: están a 1,9 km
el más cercano, unos 8 píxeles a ese zoom. Al pulsar un chip el mapa vuela a zoom 12 y se
separan bien. Pendiente de decidir si el encuadre inicial molesta; se ajusta con una línea.

---

## 15. Cambios de la revisión 4 (4 de agosto de 2026)

Escritos durante la fase 4, tras leer el código de Decap en vez de fiarse de la
documentación. Los dos primeros son correcciones a lo que prometían las revisiones
anteriores:

- **La i18n de Decap guarda el idioma arriba, no dentro de cada campo** (§7). La revisión 3
  dio por hecho lo segundo y la fase 2 escribió los 39 ficheros con la forma
  `campo: { es, ca, en }`. Con `structure: single_file`, Decap escribe
  `{ es: {…}, ca: {…} }` — verificado en `decap-cms-core/lib/i18n.js`, función
  `getI18nFiles`. El contenido se reestructuró y `pickText(campo, lang)` pasó a ser
  `localize(ficha, lang)`, que además deja las plantillas más limpias: `p.place` en vez de
  `pickText(p.data.place, lang)`.
- **Los colaboradores guardan un punto GeoJSON, no `lat` y `lng`** (§3, §4). Es lo que
  escribe el widget de mapa que §7 exige, y no había alternativa: pedir coordenadas a mano
  era justo lo que se quería evitar. El esquema Zod las desempaqueta, así que el cambio no
  sale de `content.config.ts`.
- **Decap entra por npm y se sirve desde nuestro dominio** (§6, §8). Lo habitual es un
  `<script>` a unpkg; se descarta por el mismo motivo que Leaflet en §12.
  `scripts/copiar-decap.mjs` copia el bundle a `public/admin/decap/` en `postinstall` y
  antes de cada `dev` y `build`. No se versiona: son 5,8 MB que regenera `npm install`.
  Consecuencia: hubo que excluir esa carpeta en `tsconfig.json` o `astro check` se queda
  sin memoria intentando analizarla.
- **Una colección de ficheros necesita `i18n` en la colección Y en cada fichero.** Si falta
  el de la colección, Decap descarta silenciosamente el de los ficheros
  (`actions/config.js`) y las páginas salen sin selector de idioma. Lo detectó la prueba
  con el backend `test-repo`, no la lectura del código.
- **`archive` y `config` no llevan i18n**: nombres propios de proyecto, correos y URLs.
- **Las imágenes siguen en `src/assets/img`** para que Astro las optimice, con
  `public_folder: ../../assets/img`. La miniatura del panel no se rompe: Decap resuelve la
  vista previa contra `media_folder` en el repo, no contra la URL guardada.
- **El panel publica directo a `main`** (`publish_mode: simple`). Una pantalla de revisión
  intermedia es un paso más que nadie daría en una entidad de tres personas.
- **El widget de mapa del panel pide teselas a OpenStreetMap.** Es un tercero, pero solo en
  `/admin` y solo para quien edita. La regla de cero terceros de §4 es sobre la web
  pública, y ahí se mantiene intacta.

---