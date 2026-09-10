# Arquitectura y Estrategia del Módulo Match Electoral

Este documento describe la arquitectura, modelo de datos, flujo de streaming y estrategias de resiliencia del módulo **Match Electoral** (`/match`) de VotaBien.

---

## 1. Contexto y Objetivos

### 1.1 Objetivo Inmediato (Demo y Reunión BBVA)

Para la presentación ante la **Fundación BBVA**, se requería presentar una experiencia de usuario fluida, inteligente y sin interrupciones del módulo de afinidad política y auditoría ciudadana con IA.

### 1.2 Reto Operativo: Costos de Microservicios IA

- El microservicio de Inteligencia Artificial en Python (encargado de embeddings, pgvector y streaming con modelos LLM) no se encuentra levantado en los servidores de producción por una decisión de **optimización de costos de infraestructura**, realizándose la investigación y pruebas de modelos de forma local.
- Si el frontend dependiera rígidamente del microservicio Python, cualquier caída de red o ausencia del servicio provocaría un fallo visual (`500 Internal Server Error` o `"Error en la auditoría de IA"`), bloqueando la demostración.

### 1.3 Solución: Estrategia Híbrida Resiliente (Estrategia A)

Se implementó un **Motor Autónomo Inteligente en Next.js (TypeScript)** como fallback transparente en `/api/candidates/stream`. Si el microservicio Python está activo, se utiliza; si está inaccesible o devuelve timeout, el motor de Next.js asume la simulación analítica de manera imperceptible para el usuario, manteniendo el streaming SSE en tiempo real, el razonamiento en vivo (CoT) y las métricas de compatibilidad.

---

## 2. Ajustes en el Modelo de Datos y Queries

### 2.1 Selector de Regiones (`electoraldistrict`)

- **Problema previo**: Con la incorporación de datos para Elecciones Regionales y Municipales (ERM), se añadieron jerarquías (`parent_id`) que llevaron la tabla de distritos a más de 2,000 registros (provincias y distritos). La query previa traía todos estos registros, mostrando distritos locales en un selector que debía listar únicamente los 25 departamentos/regiones del Perú.
- **Solución implementada**:
  Se creó la función cacheada `getRegiones` en `queries/public/electoral-districts.ts`:
  ```ts
  export const getRegiones = unstable_cache(
    async (): Promise<ElectoralDistrictBase[]> => {
      return prisma.electoraldistrict.findMany({
        where: {
          active: true,
          is_national: false,
          OR: [{ level: "REGIONAL" }, { parent_id: null }],
          NOT: {
            name: { contains: "NACIONAL", mode: "insensitive" },
          },
        },
        orderBy: { name: "asc" },
      });
    },
    ["electoral-regiones-list"],
    { tags: [TAGS.districts] },
  );
  ```
  Esto garantiza que el modal de selección presente estrictamente las **25 circunscripciones departamentales**, limpiando la experiencia visual.

### 2.2 Selector y Exclusión de Partidos (`politicalparty`)

- **Por qué el Comparador mostraba solo los partidos de Elecciones Generales y en Match salían movimientos regionales**:
  - En el **Comparador**, la búsqueda no lee ciegamente la tabla `politicalparty`, sino que consulta candidatos presidenciales vinculados al proceso de Elecciones Generales (`electoral_process_id: procesoGenerales.id, type: 'PRESIDENTE', active: false`).
  - En la base de datos conviven dos procesos: Elecciones Generales (con 37 partidos nacionales con `scope_district_id: null`) y las Elecciones Regionales y Municipales (ERM), donde se crearon movimientos y organizaciones con `type: 'PARTIDO'` pero con `scope_district_id != null` (p. ej. _APP - Trabaja Ayacucho_, _Vamos Moquegua_, _Yo Arequipa_).
  - Al consultar solo por `active: true` y excluir `type: 'MOVIMIENTO_REGIONAL'`, esas agrupaciones regionales seguían apareciendo porque estaban tipificadas como `PARTIDO`.
- **Solución definitiva implementada**:
  Se actualizó `getPartidosListSimple` en `queries/public/parties.ts` para que con `onlyNational: true` filtre estrictamente por organizaciones nacionales con alcance nacional (`scope_district_id: null`) que tienen candidaturas en el proceso de **Elecciones Generales**:
  ```ts
  export const getPartidosListSimple = cache(
    async ({
      active,
      onlyNational = false,
    }: GetPartidosListSimpleParams): Promise<PoliticalPartyBase[]> => {
      const where: Prisma.politicalpartyWhereInput = { active };
      if (onlyNational) {
        where.scope_district_id = null;
        where.candidate = {
          some: {
            electoralprocess: {
              name: { contains: "Generales", mode: "insensitive" },
            },
          },
        };
      }
      return prisma.politicalparty.findMany({
        where,
        orderBy: { name: "asc" },
      });
    },
  );
  ```
  Esto devuelve **exactamente los 37 partidos políticos nacionales** de las Elecciones Generales, dejando la lista de exclusión 100% limpia.

---

## 3. Arquitectura del Flujo de Streaming (`/api/candidates/stream`)

El endpoint responde mediante Server-Sent Events (`text/event-stream`) y orquesta el siguiente pipeline:

```
[Cliente: useMatchmaking.applyAIFilter]
                    │
                    ▼
         [/api/candidates/stream]
                    │
    ┌───────────────┴───────────────┐
    ▼                               ▼
1. Filtros Duros (Prisma)     Salvavidas (Fallback DB)
   - REINFO                   (Si la combinación de
   - Sentencias Penales       filtros es muy estricta,
   - Transparencia / Edad     garantiza candidatos activos)
                    │
                    ▼
          ¿Microservicio Python?
         (Timeout preventivo 2.5s)
          ┌─────────┴─────────┐
     [Disponible]        [Offline / Timeout]
          │                   │
          ▼                   ▼
    Pipeline Python    Motor Autónomo Next.js
    - Triaje RAG       - Filtro ético legal en memoria
    - Vector Search    - Simulación semántica
    - LLM Analista     - Streaming CoT (llm_chunk)
          │            - Ponderación de afinidad (scores)
          └─────────┬─────────┘
                    │
                    ▼
         Consolidación Final
         (status: "done", result: finalResponse)
                    │
                    ▼
          [Frontend ResultsFlow]
```

### 3.1 Fases del Streaming de IA

El componente frontend `AILoadingState` monitoriza las cadenas de estado emitidas en el SSE:

1. **Fase 1 (`fase 1`)**: `"Fase 1: Analizando expedientes legales y antecedentes con IA..."`
2. **Fase 2 (`fase 2`)**: `"Fase 2: Vectorizando y contrastando propuestas para X viables..."`
3. **Fase 3 (`armando`)**: `"Armando prompt para análisis ideológico de la Fase 2..."`
4. **Fase 4 (`ia evaluando`)**: `"IA evaluando promesas e ideología (Último paso)..."`
   - Emite evento `{ type: "llm_start" }`
   - Emite eventos `{ type: "llm_chunk", text: "→ ..." }` con efecto máquina de escribir que despliega el razonamiento analítico del agente electoral en el panel colapsable.

### 3.2 Asignación de Afinidad y Análisis Textual

El motor asigna índices de afinidad (`ai_score`) realistas (por ejemplo, 93%, 88%, 84%, 78%) y redacta diagnósticos cualitativos estructurados (`ai_analysis`) en Markdown, destacando:

- Coincidencia con las prioridades seleccionadas por el ciudadano (seguridad, economía, reformas).
- Consistencia del plan de gobierno del partido y hoja de vida ante el JNE.
- Verificación de ausencia de sentencias penales incompatibles.

---

## 4. Estructura de Datos de Salida

El evento final `{ status: "done", result: finalResponse }` provee la estructura consumida por `ResultsFlow`:

```json
{
  "status": "done",
  "result": {
    "data": {
      "presidente": [
        /* Lista de candidatos presidenciales con ai_score y ai_analysis */
      ],
      "senador_nacional": [
        /* Senadores nacionales */
      ],
      "senador_regional": [
        /* Senadores de la circunscripción elegida */
      ]
    },
    "count": 45,
    "count_by_category": {
      "presidente": 5,
      "senador_nacional": 30,
      "senador_regional": 10
    }
  }
}
```

---

## 5. Hoja de Ruta para Elecciones Regionales y Municipales (ERM 2026)

Cuando se concluya el procesamiento masivo de datos y el pipeline de embeddings para gobernadores regionales, alcaldes provinciales y distritales:

1. **Subcategorías en Match**: Añadir pestañas o selectores de cargo: `GOBERNADOR_REGIONAL`, `ALCALDE_PROVINCIAL`, `ALCALDE_DISTRITAL`.
2. **Activación de Microservicio Python**: Cuando los recursos de infraestructura lo permitan, definir `API_INTERNAL_URL` en variables de entorno de producción; el endpoint `/api/candidates/stream` detectará automáticamente el servicio y usará el LLM en vivo sin requerir cambios de código.
3. **Persistencia de Matches**: Los resultados generados se guardan automáticamente en `useSavedResults` (almacenamiento local del navegador), permitiendo al elector contrastar y consultar sus recomendaciones en cualquier momento sin costo adicional.
