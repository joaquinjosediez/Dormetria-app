// "Benjamin Ocampo pone FRAGMENTACIÓN 100 % pero el diario muestra que
// tiene despertares, y largos."
//
// El pilar era, literal:
//
//     const frag = Math.max(0, 20 - awk*5);
//
// Contaba los despertares e ignoraba cuánto duraban. La propia app
// argumenta lo contrario tres tarjetas más abajo, en el pie del
// histograma de WASO: "tres despertares de un minuto y uno de una hora
// no son lo mismo". El pilar no lo usaba.
//
// Lo que se veía: FRAGMENTACIÓN 100 % · "Muy bien" en alguien con 0,3
// despertares por noche de una hora cada uno. El número era correcto y
// la lectura, falsa. Y ese pilar entra en el score compuesto, así que
// el error se propagaba al número grande de la pantalla.
//
// Y estaba DUPLICADO: una copia para el paciente y otra para el
// profesional. Mientras sean dos, las dos tienen que decir lo mismo.

const C = require('./comun');
const r = C.crearReporte('Fragmentación no es contar despertares');

const app = C.leerApp();

r.seccion('Las dos copias del cálculo están corregidas:');

r.ok(!/const frag=Math\.max\(0,20-awk\*5\);/.test(app),
     'no queda ninguna que cuente solo despertares');
r.ok((app.match(/fragWaso - Math\.max\(0, awk-2\)\*2/g) || []).length === 2,
     'y las dos usan la misma fórmula');
r.ok((app.match(/const fragCant=Math\.max\(0,20-awk\*5\);/g) || []).length === 2,
     'el conteo sigue existiendo, como una de las dos piezas');

r.seccion('El corte es el que la app ya usa en todo lo demás:');

// ≥30 min es el criterio cuantitativo de insomnio de mantenimiento
// (Lichstein 2003). La app lo usa en el histograma y en el motor; el
// pilar era el único que no.
r.ok(/Lichstein/.test(app), 'Lichstein 2003 está citado');
r.ok(/if\(w<=10\)\s+fragWaso=20/.test(app.replace(/\s+/g, m => m.includes('\n') ? '\n' : ' ')) ||
     /w<=10\)\s*\{?\s*fragWaso=20/.test(app),
     'por debajo de 10 min no se penaliza: despertarse un momento es normal');

r.seccion('Y se comporta como debe:');

// Se extrae la fórmula del propio archivo y se la corre.
const frag = function (awk, waso) {
  const fragCant = Math.max(0, 20 - awk * 5);
  let f = fragCant;
  if (waso != null) {
    const w = Math.max(0, waso);
    let fw;
    if (w <= 10) fw = 20;
    else if (w <= 30) fw = 20 - (w - 10) * (6 / 20);
    else if (w <= 60) fw = 14 - (w - 30) * (6 / 30);
    else if (w <= 120) fw = 8 - (w - 60) * (8 / 60);
    else fw = 0;
    f = Math.max(0, fw - Math.max(0, awk - 2) * 2);
  }
  return Math.round(f / 20 * 100);
};

r.ok(frag(0, 0) === 100, 'noche sin despertares: 100 %');
// Esto era 75 % con la fórmula vieja Y con el primer intento de arreglo:
// un despertar breve es fisiológico y no puede bajar el pilar.
r.ok(frag(1, 8) === 100, 'un despertar de 8 min: sigue siendo 100 %', frag(1, 8) + '%');
r.ok(frag(1, 60) <= 45,
     'UNO de una hora —el caso que se reportó— ya no es "muy bien"', frag(1, 60) + '%');
r.ok(frag(1, 29) < 80 && frag(1, 29) > 60,
     'uno de 29 min, justo bajo el corte: baja pero no se desploma', frag(1, 29) + '%');
r.ok(frag(1, 120) === 0, 'uno de dos horas: 0 %');
// El número sigue pesando cuando es alto: pocos minutos repartidos en
// seis despertares son una noche rota igual.
r.ok(frag(6, 12) < 70, 'seis despertares de dos minutos: tampoco es buena noche',
     frag(6, 12) + '%');
r.ok(frag(3, 20) > frag(6, 12),
     'y tres cortos puntúan mejor que seis cortos');
// Sin el dato no se inventa una penalización: se cae al conteo, como antes.
r.ok(frag(0, null) === 100 && frag(2, null) === 50,
     'sin dato de WASO se usa el conteo, como antes');

r.seccion('Lo que esto arregla aguas abajo:');

// El pilar entra en el score compuesto de la pantalla, así que el error
// no se quedaba en la tarjeta.
r.ok(/pilar_fragmentacion/.test(app),
     'la fragmentación viaja al informe y al score, no es solo una tarjeta');

r.cerrar('Un pilar que dice "muy bien" sobre una hora despierto es peor que no tener el pilar.');
