/**
 * Copia el panel de Decap CMS desde node_modules a public/admin/.
 *
 * Decap se distribuye normalmente con un <script> a unpkg. Aquí no: igual que
 * Leaflet y las fuentes (CLAUDE.md §12), entra por npm y se sirve desde nuestro
 * propio dominio. Así la versión queda fijada en package-lock.json y /admin no
 * depende de que un tercero esté en pie.
 *
 * El fichero copiado no se versiona: lo regenera `npm install` y `npm run build`.
 */
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, 'node_modules', 'decap-cms', 'dist');
const destino = join(raiz, 'public', 'admin', 'decap');

/* El bundle está partido en trozos que se piden bajo demanda, así que hace falta
   `decap-cms.js` y sus 90 y pico chunks. Los .map se quedan fuera: son 58 MB de
   sourcemaps que nadie va a mirar en producción. */
const esDelPanel = (f) => f.endsWith('.js') && (f === 'decap-cms.js' || f.endsWith('.decap-cms.js'));

let ficheros;
try {
  ficheros = readdirSync(origen).filter(esDelPanel);
} catch {
  console.error(`No encuentro ${origen}. ¿Falta un "npm install"?`);
  process.exit(1);
}

if (ficheros.length === 0) {
  console.error(`${origen} no tiene el bundle de Decap. Revisa la versión instalada.`);
  process.exit(1);
}

/* Se vacía antes de copiar para que al subir de versión no queden chunks viejos
   con nombres distintos. */
rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });

for (const fichero of ficheros) {
  copyFileSync(join(origen, fichero), join(destino, fichero));
}

console.log(`Decap CMS: ${ficheros.length} ficheros copiados a public/admin/decap/`);
