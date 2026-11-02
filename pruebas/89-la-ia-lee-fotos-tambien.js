// "La idea es que el botón de IA aparezca con cualquier formato."
//
// El botón 🤖 IA aparecía sólo en los PDF:
//
//     (d.file_data && (d.file_type||'').includes('pdf') ? '<button …'
//
// y el motivo estaba más abajo: la Edge Function sólo sabía armar un
// bloque `document`, que es el de PDF. Una foto de una polisomnografía
// —que es lo que la mayoría de los pacientes tiene— no se podía analizar.
//
// ── Lo que se hizo, y en qué orden ───────────────────────────────────
//
// El cambio tiene dos mitades que se despliegan por caminos distintos: la
// app va con `git push`, la función se pega a mano en Supabase. Si se
// hacen de una y la función queda atrás, el botón aparece en las fotos y
// falla. Por eso:
//
//   · La app manda `pdf` como siempre Y ADEMÁS `archivo:{datos,tipo}`. Con
//     un PDF todo sigue andando aunque nadie pegue la función nueva.
//   · La función nueva acepta las dos formas, así que tampoco rompe si la
//     app queda atrasada.
//
// ── Y una advertencia que no es cosmética ────────────────────────────
//
// Leer un número de una tabla impresa, fotografiada con reflejos, sombra o
// en diagonal, es una tarea con error. Un IAH mal leído en una
// polisomnografía es peor que un IAH faltante. Tanto la consigna como el
// aviso en pantalla lo dicen.

const C = require('./comun');
const fs = require('fs');
const path = require('path');
const r = C.crearReporte('La IA lee fotos también');

const app = C.leerApp();
const fn = fs.readFileSync(
  path.join(__dirname, '..', 'edge-functions', 'analizar-estudio.ts'), 'utf8');

r.seccion('El botón aparece con cualquier archivo:');

r.ok(!/\(d\.file_data && \(d\.file_type\|\|''\)\.includes\('pdf'\)/.test(app),
     'se fue el filtro por pdf');
r.ok(/\(d\.file_data \? '<button data-did=/.test(app),
     'ahora basta con que haya archivo');

r.seccion('Y se manda lo que la función necesita para saber qué es:');

r.ok(/const _cab = \/\^data:\(\[\^;\]\*\);base64,\/\.exec/.test(app),
     'el tipo sale de la cabecera del dato');
// file_type puede no coincidir con el contenido en registros viejos: hasta
// mod292 se guardaba el tipo del archivo original aunque el dato fuera JPEG.
r.ok(/es mas confiable que file_type/.test(app),
     'y no de file_type, que en registros viejos puede mentir');
r.ok(/archivo: \{ datos: _b64, tipo: _tipo \}/.test(app), 'va en `archivo`');
r.ok(/pdf: _b64,/.test(app),
     'y `pdf` se sigue mandando: con la función vieja, los PDF siguen andando');
r.ok(/no romper la funcion que ya\s*\n?\s*\/\/ esta desplegada/.test(app) ||
     /no romper la funcion que ya/.test(app),
     'con el motivo escrito');

r.seccion('La función arma el bloque que corresponde:');

r.ok(/type: 'document', source: \{ type: 'base64', media_type: 'application\/pdf'/.test(fn),
     'document para PDF');
r.ok(/type: 'image', source: \{ type: 'base64', media_type: t/.test(fn),
     'image para foto');
r.ok(/const IMAGENES_OK = \['image\/jpeg', 'image\/png', 'image\/gif', 'image\/webp'\]/.test(fn),
     'con la lista de lo que la API acepta');
// Un HEIC viejo tiene que fallar con un mensaje útil, no con un 400 pelado.
r.ok(/Ese formato de imagen \(' \+ t \+ '\) no se puede analizar/.test(fn),
     'y un formato que no entra lo dice con todas las letras');
r.ok(/la app lo convierte a JPG al subirlo/.test(fn), 'y qué hacer');
// Las dos formas de pedido.
r.ok(/cuerpo\?\.archivo\?\.datos \|\| cuerpo\?\.pdf/.test(fn),
     'acepta el pedido nuevo y el viejo');

r.seccion('Y avisa que una foto no es un PDF:');

r.ok(/const AVISO_FOTO =/.test(fn), 'hay una consigna específica para fotos');
r.ok(/escribí "no legible" y NO lo estimes/.test(fn),
     'que le pide marcar lo que no se lee en vez de estimarlo');
r.ok(/peor que un IAH faltante/.test(fn), 'con el motivo clínico');
r.ok(/No completes con lo que "suele" traer ese tipo de estudio/.test(fn),
     'y que no complete con lo que "suele" venir');
r.ok(/const esFoto = armado\.fuente === 'foto'/.test(fn),
     'y sólo se agrega cuando es una foto');
r.ok(/fuente: armado\.fuente/.test(fn),
     'la respuesta dice de dónde salió el análisis');
// En la app, el mismo aviso donde la persona lo va a leer.
r.ok(/Este estudio es una <b>foto<\/b>, no un PDF/.test(app),
     'y la app lo dice en el modal, antes de analizar');
r.ok(/Compará siempre contra el informe original/.test(app), 'con qué hacer con eso');
// En el fuente la Í va escapada porque la cadena vive dentro de un
// template de JS: se busca el tramo sin acento, que es literal.
r.ok(app.indexOf('Este estudio llega como FOTOGRAF') > 0,
     'y el prompt que manda la app también lo aclara');

r.seccion('La función está en el repositorio y se puede copiar:');

// La anterior se escribió directo en el panel de Supabase y nunca estuvo
// acá: no se podía revisar, ni versionar, ni saber qué tenía.
r.ok(/REEMPLAZA A LA QUE ESTÁ DESPLEGADA, Y NO PUDE VERLA/.test(fn),
     'y queda dicho que reemplaza a una que no se pudo leer');
r.ok(/cop[ií]á su código a un archivo\s*\n?\/\/\s*aparte/.test(fn) ||
     /copiá su código a un archivo/.test(fn),
     'con el recaudo de guardar la anterior antes de pegar');
const sh = fs.readFileSync(path.join(__dirname, '..', 'herramientas', 'copiar-edge.sh'), 'utf8');
r.ok(/NOMBRE="\$\{1:-informe-clinico\}"/.test(sh),
     'copiar-edge.sh acepta cuál copiar');
r.ok(/ls edge-functions\/\*\.ts \| sed/.test(sh),
     'y si el nombre está mal, lista las que hay');

r.cerrar('Las dos mitades se despliegan por caminos distintos: la que va por git no puede romperse esperando a la que se pega a mano.');
