// "¿En los estudios sólo se cargan PDF o permite formato imagen? Hay
//  pacientes que tienen fotos de los estudios."
//
// Las imágenes YA estaban aceptadas: `accept="image/*,application/pdf"`.
// Así que la respuesta a la pregunta era "sí". Pero en la práctica no
// funcionaban, y el motivo es el tipo de defecto que no deja rastro.
//
// ── Lo que pasaba ────────────────────────────────────────────────────
//
//   1 · `img.onload` no tenía `onerror`. Si el navegador no puede
//       decodificar la imagen —HEIC, que es el formato POR DEFECTO de la
//       cámara de iPhone— onload no se dispara nunca: el campo oculto
//       queda vacío, la tarjeta se queda en "Procesando…" para siempre, y
//       la persona concluye que la app no acepta fotos. Ni un error en la
//       consola.
//   2 · El `accept` no nombraba .heic/.heif, así que en varios selectores
//       el archivo aparecía en gris y ni se podía elegir.
//   3 · Se reducía a 1200 px con calidad 0,75. Para una foto cualquiera
//       alcanza; para la foto de un INFORME no: lo que importa de una
//       polisomnografía es la letra chica, y a 1200 px no se lee. Se
//       guardaba un archivo liviano e inútil — que es peor que no
//       guardarlo, porque nadie se entera hasta que hace falta leerlo.
//   4 · `doc-type` guardaba el tipo ORIGINAL (image/png) aunque el dato
//       almacenado fuera un JPEG.

const C = require('./comun');
const r = C.crearReporte('Las fotos de los estudios');

const app = C.leerApp();
const bloque = app.slice(app.indexOf('function previewDocFile(input){'),
                         app.indexOf('async function saveDoc(){'));

r.seccion('Se puede elegir el archivo:');

r.ok(/accept="image\/\*,\.heic,\.heif,\.jpg,\.jpeg,\.png,\.webp,application\/pdf,\.pdf"/.test(app),
     'el selector nombra HEIC y los demás formatos');
r.ok(/Foto \(JPG, PNG, HEIC\), PDF o captura de pantalla/.test(app),
     'y la pantalla dice qué se puede subir');

r.seccion('Y si el navegador no puede abrirla, lo dice:');

// Éste es el arreglo de fondo: sin onerror la tarjeta se colgaba.
r.ok(/img\.onerror = function\(\)\{/.test(bloque), 'hay onerror');
r.ok(/reader\.onerror = function\(\)\{/.test(bloque), 'y también al leer el archivo');
r.ok(/HEIC/.test(bloque), 'el mensaje nombra el formato que suele fallar');
// Un error sin salida es un callejón: se dan las dos que funcionan.
r.ok(/compartir la foto por WhatsApp o mail/.test(bloque),
     'con una salida que no exige cambiar nada');
r.ok(/Ajustes › Cámara ›/.test(bloque) && /Más compatible/.test(bloque),
     'y la que lo arregla de raíz en el iPhone');
r.ok(/console\.warn\('\[ESTUDIOS\] no se pudo decodificar'/.test(bloque),
     'y queda registro en la consola, que antes no había');

r.seccion('La foto se guarda en una resolución que se pueda leer:');

r.ok(/const DM_DOC_MAX_PX = 2000;/.test(app),
     '2000 px, no 1200: la letra chica es lo que importa de un informe');
r.ok(!/const MAX = 1200;/.test(app), 'el 1200 se fue');
// Antes que achicar la imagen —y perder la letra— conviene comprimir más.
r.ok(/const DM_DOC_CALIDAD = \[0\.82, 0\.72, 0\.62\];/.test(app),
     'y si pesa de más se baja la calidad por pasos');
r.ok(/for\(const q of DM_DOC_CALIDAD\)/.test(bloque), 'probándolas en orden');
r.ok(/antes\n\/\/ que achicar la imagen|antes que achicar la imagen/.test(app) ||
     /perder la letra/.test(bloque),
     'con el criterio escrito: comprimir antes que achicar');
// Un PNG con transparencia sobre JPEG sale negro.
r.ok(/cx\.fillStyle = '#ffffff'; cx\.fillRect\(0,0,w,h\);/.test(bloque),
     'y se pinta el fondo en blanco: un PNG transparente salía negro');

r.seccion('Y lo que se guarda coincide con lo que se dice que es:');

r.ok(/document\.getElementById\('doc-type'\)\.value = 'image\/jpeg';/.test(bloque),
     'el tipo guardado es el del dato, no el del archivo original');
r.ok(/El tipo que se guarda es el del DATO/.test(bloque), 'con el motivo escrito');
// Si una carga falla a mitad de camino, no puede quedar el archivo anterior.
r.ok(/document\.getElementById\('doc-data'\)\.value = '';/.test(bloque),
     'y al elegir un archivo nuevo se limpia el anterior');

r.seccion('El aviso de que la foto se lea:');

r.ok(/Si le sacás una foto, que se lea/.test(app), 'está en la pantalla de carga');
// Instrucciones concretas, no "sacá una buena foto".
r.ok(/superficie\s*\n?\s*plana con buena luz/.test(app), 'dice cómo apoyarla');
r.ok(/desde arriba y\s*\n?\s*derecho/.test(app), 'y desde dónde sacarla');
r.ok(/una\s*\n?\s*por una/.test(app), 'y qué hacer si el estudio tiene varias hojas');
// La prueba que puede hacer la persona sola, que es la que vale.
r.ok(/si vos no los leés en el teléfono, tu profesional tampoco/.test(app),
     'y le da una forma de comprobarlo él mismo');
r.ok(/confirmá que se lean los números chicos antes de guardar/.test(bloque),
     'y se lo repite al terminar de procesar, que es cuando puede mirarlo');

r.cerrar('Una foto guardada en 1200 px es un archivo liviano e inútil: nadie se entera hasta que hace falta leerlo.');
