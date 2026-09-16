# Estadística del profesional — diseño

Borrador para decidir. Nada de esto está implementado todavía.

---

## 0. Lo que hay que resolver antes

**El archivado hoy vive en `localStorage`**, con la clave
`dm_dr_archived_pts_<email del médico>`. No está en la base.

Eso significa que si le agregamos motivos ahora, esa información desaparece
cuando el profesional limpia el navegador y no existe si abre la app en otro
dispositivo. **Cualquier métrica construida sobre eso es estadística que se
evapora.** El orden correcto es migrar primero. La SQL está en la sección 6.

---

## 1. Tres ejes, no uno

El error a evitar es meter todo en un solo campo "motivo de archivo". Lo que
describiste son tres cosas distintas y no se pueden cruzar si se mezclan:

| Eje | Quién lo determina | Cuándo |
|---|---|---|
| **Desenlace** | El profesional, a mano | Al archivar |
| **Adherencia** | La app, contando noches | Siempre, en vivo |
| **Respuesta clínica** | La app, comparando escalas | Siempre, en vivo |

"Le di el alta" es un desenlace. "Nunca ingresó" **no** es un desenlace: es
adherencia, y la app ya la sabe sin preguntarte. Si le pedís al profesional
que elija entre esas dos, vas a perder información en los dos ejes.

---

## 2. Eje 1 — Desenlace (lo elegís vos al archivar)

Seis opciones, excluyentes. Más que eso y nadie completa el campo.

| Valor | Etiqueta | Cuándo |
|---|---|---|
| `alta_mejoria` | Alta por mejoría | El motivo de consulta se resolvió |
| `alta_diagnostico` | Alta — estudio terminado | Vino a diagnóstico, no a seguimiento |
| `derivacion` | Derivado | Pasa a otro profesional o a otro nivel |
| `abandono` | Dejó de venir | Sin cierre, no volvió |
| `sin_inicio` | Nunca empezó | Se vinculó y no hubo consulta |
| `otro` | Otro | Con un campo de texto corto |

Un campo de nota libre (140 caracteres) al lado, opcional. Es donde va a
aparecer lo que no previmos, y a los seis meses te dice qué opción falta.

**Al archivar, el formulario propone un valor.** Si el paciente no registró
ninguna noche y no tiene escalas, viene preseleccionado `sin_inicio`. Si la
última actividad es de hace más de 60 días, `abandono`. El profesional lo
confirma o lo cambia. Esto no es cosmético: un campo que viene vacío se
completa el 20% de las veces, uno que viene propuesto el 80%.

---

## 3. Eje 2 — Adherencia (la calcula la app)

Se calcula sobre `sleep_diary`, sin preguntarle nada a nadie.

- **Noches esperadas** = días desde la vinculación (o desde la primera noche
  registrada, lo que sea posterior), con tope en 90.
- **Tasa** = noches registradas ÷ noches esperadas.

| Categoría | Regla |
|---|---|
| Nunca registró | 0 noches |
| Arrancó y dejó | ≥1 noche, ninguna en los últimos 21 días |
| Intermitente | Activo, tasa < 40% |
| Constante | Activo, tasa 40–79% |
| Muy constante | Activo, tasa ≥ 80% |

Los cortes 40/80 son una convención de trabajo, no un estándar publicado. Se
pueden mover; lo que importa es que sean los mismos para todos los
profesionales, si no las comparaciones no significan nada.

---

## 4. Eje 3 — Respuesta clínica (la calcula la app)

Primera toma vs. última toma de la escala que corresponde a la patología
etiquetada: ISI en insomnio, ESS en somnolencia, IRLS en SPI.

Dos cuidados antes de mostrar un número:

1. **El umbral del ISI es el de Morin et al. 2011** (*Sleep* 34(5):601-8):
   8,4 puntos de cambio clínicamente significativo. Operativamente, **≥8
   puntos de descenso = mejoró**, ≥8 de aumento = empeoró, el resto sin cambio
   relevante. La cita va en el panel de criterios y fuentes, igual que
   Lichstein para los umbrales del diario. (La otra referencia habitual,
   Yang 2009, usa 6 puntos; se descartó.)
2. **No comparar tomas de versiones distintas de la escala.** Ya tenemos el
   guard para DBAS y PSAS; acá aplica igual.

Sin al menos dos tomas separadas por 14 días, la respuesta es "sin dato". No
"sin cambio".

---

## 5. Las comparaciones que valen la pena

Ordenadas por lo que le cambia la conducta al profesional.

### 5.1 Embudo de la cartera

De cada 100 pacientes vinculados:
vinculados → registraron al menos una noche → llegaron a 14 noches →
respondieron las escalas pedidas → cerraron con alta.

Es la más útil de todas y la más barata: dice **en qué escalón se le cae la
gente**. Perder al 60% entre "vinculado" y "primera noche" es un problema de
onboarding, no de adherencia, y se arregla distinto.

### 5.2 Adherencia × desenlace

Tabla cruzada. La pregunta: **¿los que registran se van de alta más seguido
que los que no?** Si la respuesta es que sí, tenés con qué convencer al
paciente de que registre. Si es que no, el diario no está aportando lo que
creemos y eso también hay que saberlo.

### 5.3 Días hasta la primera noche

Mediana, y la distribución. Mide tu onboarding, no al paciente. Si la mediana
son 9 días, el problema está en lo que pasa entre la consulta y la app.

### 5.4 Permanencia

% de pacientes que sigue registrando a las 2, 4, 8 y 12 semanas. Es la curva
que te dice cuándo conviene el refuerzo — y hoy el mensaje de aliento se manda
a los 7 días sin ninguna evidencia de que ahí esté la caída.

### 5.5 Respuesta clínica por patología

Delta de la escala principal, agrupado por etiqueta. Con 77 pacientes, cortar
por patología ya deja grupos de 8 a 15: **es descriptivo, no comparativo.**

### 5.6 Escalas pedidas vs. respondidas

Ya existe en la pestaña Métricas. Se le agrega el desglose por escala: si el
PSQI se responde el 30% de las veces y el ISI el 80%, el problema es el PSQI.

---

## 6. La migración

Sin esto nada de lo de arriba se puede construir.

```sql
-- El archivado pasa de localStorage a la base, con su motivo y su fecha.
alter table public.doctor_patients
  add column if not exists archived_at   timestamptz,
  add column if not exists archive_reason text,
  add column if not exists archive_note   text;

-- Lista cerrada: sin esto, en seis meses hay catorce formas de escribir
-- "abandono" y ninguna consulta sirve.
alter table public.doctor_patients
  drop constraint if exists dp_archive_reason_valido;
alter table public.doctor_patients
  add constraint dp_archive_reason_valido check (
    archive_reason is null or archive_reason in
      ('alta_mejoria','alta_diagnostico','derivacion','abandono','sin_inicio','otro')
  );

-- Un motivo sin fecha, o una fecha sin motivo, es una fila que no se puede
-- interpretar después.
alter table public.doctor_patients
  drop constraint if exists dp_archive_coherente;
alter table public.doctor_patients
  add constraint dp_archive_coherente check (
    (archived_at is null and archive_reason is null) or
    (archived_at is not null and archive_reason is not null)
  );

create index if not exists dp_archived_idx
  on public.doctor_patients (doctor_email, archived_at);
```

**Sobre las policies:** `doctor_patients` ya tiene UPDATE para el médico dueño
del vínculo, así que estas columnas quedan cubiertas sin tocar RLS. Conviene
igual confirmarlo antes:

```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename='doctor_patients'
order by cmd;
```

Recordá que en `BUGS.md` quedó anotado que `doctor_patients` tiene **dos
políticas de UPDATE redundantes** y que `dp_medico_vincula` no valida
consentimiento. Es el momento de mirarlo, porque vamos a escribir más en esa
tabla.

**Migración de lo que ya existe:** los archivados que hoy están en
`localStorage` de tu teléfono no se pueden recuperar desde el servidor. Lo
único posible es que la app, la primera vez que abra después del cambio, suba
los que encuentre en ese navegador con `archive_reason = 'otro'`. Se hace una
vez y se pide que revisen esos casos.

---

## 7. Decidido

- **Seis opciones de desenlace**, las de la sección 2.
- **MCID del ISI: Morin et al. 2011** (*Sleep* 34(5):601-8) — 8,4 puntos para
  cambio clínicamente significativo. Se usa **≥8 puntos de descenso** = mejoró,
  **≥8 de aumento** = empeoró, el resto sin cambio relevante. La cita va en el
  panel de criterios y fuentes, como Lichstein en el diario.
- **n mínimo de 5** para mostrar cualquier porcentaje, con el n siempre al lado.
- **Sin comparativa contra la media de la plataforma** para el profesional.
  Cada uno ve lo suyo.
- **Métricas de profesionales para el administrador, sí.** Es otra cosa: no es
  darle a un profesional el rendimiento de sus colegas, es el operador de la
  plataforma mirando cómo se usa. Primera parte implementada en mod192 (ver
  sección 8).

## 8. Panel de administración — lo que ya está

En Administración → Profesionales, dos columnas nuevas por profesional:

| Columna | Qué mide |
|---|---|
| **Activaron** | % de sus pacientes que registró al menos una noche |
| **14+ noches** | % de sus pacientes que llegó a catorce noches |

La distinción importa: **Activaron mide al profesional** —si el paciente
arranca depende casi por completo de cómo se lo presentó en la consulta—
mientras que **14+ noches mide si el paciente sostiene**, que ya es otra cosa.
Un profesional con 90% de activación y 20% de permanencia tiene un problema
distinto del que tiene 30% y 25%.

Ambas respetan el n≥5: por debajo muestran un guion, no un porcentaje.

**Ojo:** los pacientes de ejemplo cuentan como pacientes vinculados. En una
cartera de seis, cinco son demos y el número no dice nada. Cuando haya
volumen conviene excluirlos por `is_demo`.

### Lo que falta en el panel de administración

- **Mediana de días hasta la primera noche**, por profesional. Es el mejor
  indicador de onboarding y hoy no está.
- **Permanencia a 4 y 12 semanas**, para ver si la caída es temprana o tardía.
- **Escalas pedidas vs. respondidas**, por profesional.
- Todo lo que dependa de **desenlace** — o sea, la mitad de la sección 5 —
  espera la migración.

## 9. Lo que sigue abierto

1. **Correr la migración de la sección 6.** Es el único bloqueante real: sin
   `archived_at` y `archive_reason` en la base, el eje de desenlace no existe
   y con él se cae la mitad de las comparaciones de la sección 5.
2. **Qué hacer con los archivados que hoy están en localStorage.** Se pueden
   subir con `archive_reason='otro'` la primera vez que la app abra después
   del cambio, para que el profesional los revise. O se descartan y se empieza
   limpio. Mi recomendación: subirlos, porque un archivado perdido se lee
   después como un paciente activo que nunca volvió.
3. **Excluir los pacientes de ejemplo de las métricas** cuando haya volumen
   suficiente. Hoy inflan las carteras chicas.
4. **Verificar las policies de `doctor_patients` antes de escribir más ahí.**
   En `BUGS.md` quedó anotado que tiene dos políticas de UPDATE redundantes y
   que `dp_medico_vincula` no valida consentimiento.
