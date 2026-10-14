# La Edge Function `informe-clinico` · cómo se actualiza

**Esta función NO se publica con `git push`.** Vive en Supabase, no en
GitHub Pages. El archivo del repo —`edge-functions/informe-clinico.ts`— es
la copia de referencia; la que corre es la que está pegada en el panel.

Por eso, cada vez que cambia hay que hacer esto a mano.

## Los pasos

```bash
cd ~/Documents/Dormetria-app && ./herramientas/copiar-edge.sh
```

Eso la deja en el portapapeles y te imprime los pasos. Son estos:

1. Entrá a **supabase.com** y abrí el proyecto **Dormetria**
2. Menú de la izquierda → **Edge Functions**
3. Tocá **informe-clinico**
4. Pestaña **Code**
5. Clic adentro del editor · **Cmd+A** (selecciona todo lo que hay)
6. **Cmd+V** (pega lo nuevo encima)
7. Botón **Deploy**, arriba a la derecha

Quedó desplegada cuando el panel muestra una versión nueva con la fecha de
hoy.

## Cómo saber si anduvo

Abrí un paciente con diario cargado → pestaña **Informe** → **Interconsulta**.

- Si sale completo y termina con una sección **Conclusión sugerida**, anduvo.
- Si sale el cartel naranja de "este informe está incompleto", la función
  vieja sigue corriendo: la v5 sube el tope de longitud justamente para que
  eso no pase.
- Si sale un error de la API, el detalle técnico está abajo del mensaje y
  también en **Edge Functions → informe-clinico → Logs**.

## Qué cambió en la v5 (mod271)

- `max_tokens` de 2000 a 8000. El 2000 estaba puesto a dedo y cortaba los
  informes al medio. No es un presupuesto: a la API se le paga por lo que se
  usa, así que subirlo no cuesta nada mientras no se use.
- La consigna de **interconsulta** decía, literal, *"Menos de 400 palabras en
  total"*. Por eso el informe detallado no tenía nada: el modelo hacía lo que
  se le pedía. Ahora pide el informe completo —arquitectura del sueño, ritmo
  y regularidad, sueño diurno, todas las escalas con su fecha, los factores
  evaluados incluidos los que dieron negativo, lo que no se puede afirmar— y
  cierra con una **conclusión sugerida** redactada como la de una
  polisomnografía.
- Devuelve `cortado: true` cuando la respuesta llegó al tope. Antes, un
  informe truncado se mostraba y se guardaba como si estuviera terminado, y
  lo que faltaba era justo la conclusión.

## Historial

### v4 · el error de prefill

La v3 terminaba la conversación con un mensaje del asistente, para forzar el
arranque de la respuesta. Se llama *prefill*:

```js
messages: [
  { role: 'user',      content: prompt },
  { role: 'assistant', content: 'NOTA DE EVOLUCIÓN\n\n' }   // ← esto
]
```

Era válido con los modelos anteriores. `claude-sonnet-5` lo rechaza:

> This model does not support assistant message prefill.
> The conversation must end with a user message.

El arreglo fue borrar ese último mensaje y pedir el formato en el texto del
prompt. Ya está en el archivo del repo.
