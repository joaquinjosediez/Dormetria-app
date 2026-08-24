# Opcional: que las pruebas corran también en GitHub

**Esto no hace falta.** El control que importa es `./publicar.sh`, que corre
las pruebas en tu computadora y no deja publicar si algo falla. Lo de acá
abajo es una segunda red que solo agrega un mail de aviso.

Lo separé porque publicarlo choca con un permiso: GitHub rechaza el push si
tu credencial no tiene el alcance `workflow`, y arreglar eso significa
generar un token nuevo y actualizarlo en el llavero del Mac. Es bastante
trámite para algo que ni siquiera bloquea la publicación.

Si algún día querés activarlo:

1. Crear la carpeta `.github/workflows/`
2. Adentro, un archivo `pruebas.yml` con esto:

```yaml
name: Pruebas

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

jobs:
  pruebas:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Instalar lo que necesitan las pruebas
        run: npm install --no-audit --no-fund
      - name: Correr las pruebas
        run: npm test
```

3. En GitHub → Settings → Developer settings → Personal access tokens,
   generar uno con el permiso `workflow` marcado, y usarlo al pushear.

## Por qué no bloquea la publicación

GitHub Pages sirve la rama `main` apenas se pushea. Para que las pruebas
pudieran frenar una publicación habría que cambiar el modo de publicación de
Pages a "GitHub Actions", y si ese flujo sale mal el sitio se cae entero.

Con 55 pacientes usando la app, ese riesgo no compensa. El control local
avisa **antes** de que nada llegue a nadie, que es lo que importa.
