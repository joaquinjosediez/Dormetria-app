# Cómo trabajar sobre Dormetria sin romper nada

Todo esto se corre desde la Terminal, parado en esta carpeta:

```
cd ~/Documents/Dormetria-app
```

La primera vez, y solo la primera, hay que instalar lo que necesitan las
pruebas:

```
npm install
chmod +x publicar.sh volver-atras.sh probar-en-beta.sh promover-beta.sh
```

---

## Publicar una versión

```
./publicar.sh mod166
```

Busca `APP-index-mod166.html` y `APP-styles-mod166.css` en tu carpeta de
Descargas, **corre las pruebas**, y solo si pasan todas hace el push.

Si algo falla, no se publica nada y tu carpeta queda como estaba. La app en
internet no se entera.

Podés agregarle una descripción:

```
./publicar.sh mod166 "arreglo el gráfico de pilares"
```

---

## Volver atrás

```
./volver-atras.sh
```

Vuelve a la versión anterior. Pregunta antes de hacer nada.

```
./volver-atras.sh --ver        ver el historial, sin tocar nada
./volver-atras.sh mod163       volver a una versión concreta
```

No borra nada: agrega un commit que restaura los archivos viejos. Si te
arrepentís, `./volver-atras.sh mod166` te devuelve para adelante.

**Esto es lo más importante de todo el circuito.** Cuando una versión rompió
la app para todos los pacientes, arreglarla llevó una sesión entera. Volver
atrás lleva treinta segundos.

---

## Mirarlo antes de publicar

```
./probar-en-beta.sh mod166
```

Lo sube a **app.dormetria.com/beta/**. Producción sigue intacta. Abrilo en
tu celular, navegalo, y cuando te convenza:

```
./promover-beta.sh
```

> **Cuidado:** beta usa **la misma base de datos** que producción. Sirve para
> mirar cómo se ve y cómo se navega. Si probás un alta, va a crear un
> paciente de verdad — usá un mail tuyo.

Beta lleva una franja dorada arriba que dice "VERSIÓN DE PRUEBA" para que no
haya forma de confundirla con la app real.

---

## Las pruebas

```
npm test
```

Cinco pruebas, unos veinte segundos. No hace falta correrlas a mano:
`publicar.sh` y `promover-beta.sh` ya lo hacen.

| | Qué mira | Por qué existe |
|---|---|---|
| 01 | Que la app arranque entera | Un `async` mal puesto corta el resto del archivo y los botones dejan de responder, sin ningún error visible |
| 02 | Que el paciente no vea el panel del profesional | Pasó de verdad: una regla de CSS sin `.active` se lo mostró a todos los pacientes que entraban desde el celular |
| 03 | Que se lea lo que está escrito | Contraste calculado, no mirado. También que la palabra y el color no se contradigan |
| 04 | Que las cuentas den | Una paciente con insomnio severo aparecía con 97% de eficiencia porque el tiempo en cama se medía mal |
| 05 | Que el paciente pueda entrar | Es lo único que no puede fallar: quien no puede entrar, abandona |

Cada una explica arriba de todo qué incidente la hizo nacer.

**Están verificadas en los dos sentidos:** la 02 se probó reintroduciendo el
bug original a propósito, para confirmar que lo caza. Una prueba que no puede
fallar no sirve de nada.

---

## Y si algo no arranca

**`zsh: permission denied: ./publicar.sh`**
Los scripts perdieron el permiso de ejecución. Se devuelve así:

```
chmod +x publicar.sh volver-atras.sh probar-en-beta.sh promover-beta.sh
```

**`command not found: npm`**
Falta Node.js. Se instala una sola vez desde
[nodejs.org/en/download](https://nodejs.org/en/download) — botón **LTS**,
archivo `.pkg`, doble clic. Después hay que cerrar la Terminal y abrir una
nueva. Mientras tanto `publicar.sh` te pregunta si querés publicar igual,
sin pruebas.

**`refusing to allow a Personal Access Token to create or update workflow`**
Es por la carpeta `.github/`. No la usamos: ver
`pruebas/OPCIONAL-correr-en-github.md`. Si aparece, borrala con
`rm -rf .github` y volvé a intentar.

---

## Dónde va cada cosa

| Archivo | Adónde |
|---|---|
| `APP-index-*.html` y `APP-styles-*.css` | Acá, con `./publicar.sh` |
| Bloques de SQL | Supabase → SQL Editor |
| Archivos `.ts` | Supabase → Edge Functions |
