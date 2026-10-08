// Esta prueba existe por un error mío.
//
// En el script con el que subo la versión escribí esto:
//
//     open('sw.js','w').write(open('sw.js').read().replace(vieja, nueva))
//
// Python evalúa primero `open('sw.js','w')`, y abrir en modo 'w' TRUNCA el
// archivo. Para cuando corre el `read()` de adentro, el archivo ya está
// vacío: devuelve '', el replace no tiene nada que reemplazar, y se escribe
// una cadena vacía. El service worker quedó en 0 bytes y así se commiteó.
//
// Ningún control lo agarró. `node --check` aprueba un archivo vacío —es un
// programa válido, el que no hace nada—. El bloque <script> de index.html
// estaba intacto. Las 70 pruebas pasaban, porque ninguna miraba sw.js.
//
// Y lo que se habría publicado es peor que un error visible: el navegador
// registra el worker sin quejarse, la caché offline desaparece, y el aviso
// de "hay una versión nueva" —que es lo único que hace que un paciente con
// la app abierta hace cuatro días vea un arreglo— deja de existir. Todo en
// silencio.
//
// La regla que queda: los archivos de los que depende la publicación se
// miran por su CONTENIDO, no por su sintaxis.

const fs = require('fs');
const path = require('path');
const C = require('./comun');
const r = C.crearReporte('Los archivos de la publicación existen');

const raiz = path.join(__dirname, '..');
const leer = (p) => fs.readFileSync(path.join(raiz, p), 'utf8');

const version = JSON.parse(leer('version.json')).version;

r.seccion('El service worker no está vacío:');

[['sw.js', version], ['staging/sw.js', JSON.parse(leer('staging/version.json')).version]].forEach(function (par) {
  const [ruta, ver] = par;
  const s = leer(ruta);
  // Un archivo vacío pasa node --check. Por eso el piso es de tamaño.
  r.ok(s.length > 1500, ruta + ' tiene contenido', s.length + ' caracteres');
  r.ok(/const CACHE = 'dormetria-/.test(s), '  con su nombre de caché');
  r.ok(s.indexOf("dormetria-" + ver) > 0,
       '  y es la versión de este release (' + ver + ')');
  // Lo que el worker tiene que seguir sabiendo hacer.
  r.ok(/addEventListener\('install'/.test(s), '  install');
  r.ok(/addEventListener\('activate'/.test(s), '  activate');
  r.ok(/addEventListener\('fetch'/.test(s), '  fetch');
  r.ok(/caches\.delete/.test(s), '  y borra las cachés viejas al activarse');
});

r.seccion('Y el resto de lo que mira el navegador al publicar:');

const idx = leer('index.html');

// Si version.json y APP_VERSION no coinciden, el aviso de versión nueva se
// dispara en bucle o no se dispara nunca.
const appVer = (idx.match(/const APP_VERSION='([^']*)'/) || [])[1];
r.ok(appVer === version,
     'APP_VERSION y version.json dicen lo mismo', appVer + ' / ' + version);

const stgIdx = leer('staging/index.html');
const stgVer = (stgIdx.match(/const APP_VERSION='([^']*)'/) || [])[1];
r.ok(stgVer === JSON.parse(leer('staging/version.json')).version,
     'y en staging también', stgVer);
r.ok(stgVer !== appVer,
     'con un número distinto: si fueran iguales, staging pisaría la caché de producción');

r.seccion('Los archivos que el HTML declara existen y su hash es el real:');

// Un token de versión con un hash que no corresponde al archivo es peor que
// no tener hash: el navegador se queda con la copia vieja y el cambio
// "no se publica", que es el síntoma más difícil de diagnosticar de todos.
const crypto = require('crypto');
const refs = [...idx.matchAll(/(?:href|src)="((?:css|js)\/[^"?]+)\?v=([^"]+)"/g)];
r.ok(refs.length >= 5, 'hay referencias con versión', refs.length + ' archivos');
refs.forEach(function (m) {
  const [, archivo, token] = m;
  const abs = path.join(raiz, archivo);
  if (!fs.existsSync(abs)) { r.ok(false, archivo + ' no existe'); return; }
  const real = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex').slice(0, 8);
  const hash = token.split('-').slice(1).join('-');
  r.ok(hash === real, archivo.replace(/^.*\//, '') + ' · el hash es el del archivo',
       hash === real ? '' : 'dice ' + hash + ' y es ' + real);
  r.ok(token.indexOf(version + '-') === 0, '  y lleva la versión de este release');
});

r.seccion('Staging sirve lo mismo que producción:');

// staging/js y staging/css son COPIAS, no enlaces. Ya pasó de publicar
// staging con un módulo de dos versiones atrás y pelearse con un bug que en
// producción ya estaba arreglado.
['css/styles.css'].concat(
  fs.readdirSync(path.join(raiz, 'js')).filter(f => /\.js$/.test(f)).map(f => 'js/' + f)
).forEach(function (f) {
  const a = path.join(raiz, f), b = path.join(raiz, 'staging', f);
  if (!fs.existsSync(b)) { r.ok(false, 'falta staging/' + f); return; }
  r.ok(fs.readFileSync(a).equals(fs.readFileSync(b)),
       'staging/' + f.replace(/^.*\//, '') + ' está sincronizado');
});

r.cerrar('Un archivo vacío es sintaxis válida. Lo único que lo agarra es mirar lo que dice adentro.');
