# El informe no se genera · qué cambiar en la Edge Function

El error que le sale a Ruffa viene tal cual de la API de Anthropic:

> This model does not support assistant message prefill.
> The conversation must end with a user message.

No es un problema de la app ni de los datos del paciente. **Es la Edge
Function `informe-clinico`**, que vive en Supabase y no está en el repo, así
que hay que editarla desde el panel.

---

## Qué está haciendo mal

La función arma la conversación terminándola con un mensaje del asistente,
para forzar el arranque de la respuesta. Se llama *prefill* y se ve así:

```js
messages: [
  { role: 'user',      content: prompt },
  { role: 'assistant', content: 'NOTA DE EVOLUCIÓN\n\n' }   // ← esto
]
```

Era una técnica válida con los modelos anteriores. **`claude-sonnet-5` no la
soporta**: exige que el último mensaje sea del usuario.

## El arreglo

Borrar ese último mensaje. Lo que el prefill intentaba conseguir —que la
respuesta empiece con un formato determinado— se pide en el texto:

```js
const resp = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-5',
    max_tokens: 1500,
    // Las reglas duras van acá, no mezcladas con los datos.
    system: PROMPT_SISTEMA,
    messages: [
      {
        role: 'user',
        content:
          FORMATO + '\n\n' +
          'Datos del paciente:\n' + JSON.stringify(paquete, null, 2) + '\n\n' +
          // Lo que antes hacía el prefill:
          'Empezá directamente con el texto del informe. Sin encabezado, ' +
          'sin saludo y sin decir que sos un asistente.'
      }
    ]
    // ← sin ningún { role: 'assistant' } al final
  })
});
```

**Dónde editarla:** Supabase → Edge Functions → `informe-clinico` → editar y
desplegar. Los logs de esa misma pantalla son los que menciona el cartel de
error de la app.

## Mientras tanto

Si querés destrabarlo hoy mismo sin tocar el prompt, alcanza con sacar el
mensaje del asistente. El informe va a salir igual; puede que arranque con una
línea de presentación que antes el prefill cortaba, y eso se corrige después
con la instrucción de arriba.

## Dos cosas para revisar de paso

1. **El modelo está escrito a mano en la función.** Conviene que salga de una
   variable de entorno: el día que cambie, se cambia en un lugar y no hay que
   volver a desplegar la función. Lo mismo vale para no quedar atado a una
   versión que mañana se deprecia.

2. **El error le llegó al profesional en inglés y con jerga de API.** Está bien
   que el detalle técnico se muestre —sirve para esto mismo—, pero conviene
   que arriba diga algo que un médico pueda accionar: *"No se pudo generar el
   informe. Es un problema de configuración, no de los datos del paciente.
   Avisale a Joaquín."* Si querés lo agrego a la app.
