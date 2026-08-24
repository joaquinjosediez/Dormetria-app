// Corre todas las pruebas y devuelve un resumen de una línea.
//
// Cada prueba vive en su propio proceso a propósito: si una se cuelga o
// revienta, las demás siguen corriendo y se ve el panorama completo en vez
// de frenar en la primera.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const archivos = fs.readdirSync(AQUI)
  .filter(f => /^\d\d-.*\.js$/.test(f))
  .sort();

if (!archivos.length) {
  console.log('No encontré ninguna prueba en ' + AQUI);
  process.exit(1);
}

console.log('═══ Pruebas de Dormetria ═══');

const fallaron = [];
for (const f of archivos) {
  try {
    const salida = execFileSync('node', [path.join(AQUI, f)],
                                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    process.stdout.write(salida);
  } catch (e) {
    fallaron.push(f);
    process.stdout.write(e.stdout || '');
    if (e.stderr) process.stdout.write('\n' + e.stderr);
  }
}

console.log('\n═══════════════════════════════════════════');
if (fallaron.length) {
  console.log('NO PASA (' + fallaron.length + ' de ' + archivos.length + '):');
  fallaron.forEach(f => console.log('   x ' + f));
  console.log('\nNo publiques así. Arriba está el detalle de qué falló.');
  process.exit(1);
}
console.log('Las ' + archivos.length + ' pruebas pasan. Se puede publicar.');
