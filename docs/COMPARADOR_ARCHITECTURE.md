# Arquitectura y Estrategia del Módulo Comparador

Este documento describe el diagnóstico, la estrategia de adaptación y los cambios técnicos implementados en el módulo **Comparador de Fórmulas y Planes** (`/comparador`) para permitir la demostración ante la **Fundación BBVA** utilizando la información de las Elecciones Generales 2026, garantizando cero regresiones sobre los flujos activos de las Elecciones Regionales y Municipales (ERM 2026).

---

## 1. Contexto y Objetivos

### 1.1 Objetivo Inmediato (Demo y Reunión BBVA)

Para la reunión con la **Fundación BBVA**, se requería presentar la funcionalidad analítica del Comparador Político:

- Contraste cara a cara de fórmulas presidenciales (Presidente y Vicepresidentes).
- Auditoría cruzada de hojas de vida (educación, experiencia laboral, ingresos y patrimonio).
- Antecedentes judiciales, éticos y penales contrastados.
- Posturas programáticas declaradas.

### 1.2 Reto Operativo: Convivencia ERM 2026 y Elecciones Generales

- Actualmente, la plataforma VotaBien se encuentra en transición y desarrollo enfocado en las **Elecciones Regionales y Municipales 2026 (ERM)**.
- En la base de datos conviven dos procesos electorales:
  1. `Elecciones Generales 2026` (`id: "dclcgoqihesl49kyjgnjcf9a"`): Concluido, marcado con `active = false`.
  2. `Elecciones Regionales y Municipales 2026` (`id: "cmt6ek0xz00006djcdj8ztx6j"`): Vigente, marcado con `active = true`.
- Al finalizar las Elecciones Generales, los **7,621 candidatos** de dicho proceso (incluidos los 36 candidatos presidenciales y los 72 miembros de sus fórmulas) fueron archivados con el campo `candidate.active = false`.
- Las queries originales del comparador asumían que el proceso y los candidatos a comparar se encontraban en estado `active = true`.

---

## 2. Diagnóstico del Bloqueo Previo

Se identificaron tres cuellos de botella encadenados:

1. **Resolución errónea del proceso electoral en la búsqueda:**
   - `searchPresidentialCandidates` en `app/(platform)/(interaccion)/comparador/_lib/actions.ts` consultaba `getElectoralProcess({ active: true })`.
   - Esto devolvía el proceso de **ERM 2026**, donde no existen candidaturas presidenciales (`type: "PRESIDENTE"` = 0).
   - En consecuencia, el modal de búsqueda siempre devolvía un array vacío (`Sin resultados`).

2. **Filtro estricto `active: true` en las queries de base de datos:**
   - `getCandidatesCards` en `queries/public/candidacies.ts`: Tenía hardcodeado `whereClause: Prisma.candidateWhereInput = { active: true }`.
   - `getPresidentialFormulasComparison` en `queries/public/compare.ts`: Exigía `active: true` tanto al filtrar por los IDs de presidentes como al extraer los miembros de la plancha (vicepresidentes).
   - Como todos los candidatos de las Generales tienen `active: false`, cualquier intento de consulta resultaba en registros vacíos o `status: "not_found"`.

3. **Guardián de autenticación de equipo (`UnderConstruction`):**
   - `app/(platform)/(interaccion)/comparador/page.tsx` ejecutaba una comprobación `if (!user)` que renderizaba la vista de "En Construcción" para usuarios anónimos, impidiendo demostraciones sin inicio de sesión previo.

---

## 3. Estrategia de Solución (Garantía de Cero Regresiones)

Para cumplir con el requerimiento de no alterar ningún otro componente ni romper la lógica de ERM 2026, se aplicó el principio de **retrocompatibilidad estricta**:

```
                              ┌──────────────────────────────────┐
                              │    getCandidatesCards(params)    │
                              └─────────────────┬────────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │                                                 │
                       ▼                                                 ▼
          Parámetro `active` omitido                        `active: false` provisto
        (Vistas ERM: /candidatos, /match)                  (Vistas históricas: /comparador)
                       │                                                 │
                       ▼                                                 ▼
             whereClause.active = true                       whereClause.active = false
          (Comportamiento 100% intacto)                    (Permite leer Elecciones Generales)
```

### 3.1 Modificaciones Realizadas

#### A. Capa de Datos Compartida: `queries/public/candidacies.ts`

Se extendió la interfaz `GetCandidatesParams` con `active?: boolean` y se condicionó el armado del filtro:

```ts
// queries/public/candidacies.ts
interface GetCandidatesParams {
  // ... otros parámetros
  active?: boolean;
}

// Dentro de getCandidatesCards:
const whereClause: Prisma.candidateWhereInput = {
  active: active !== undefined ? active : true,
};
```

_Garantía_: Si un componente no especifica `active` (como el directorio de candidatos de ERM o el motor de match), el valor por defecto sigue siendo estrictamente `true`.

#### B. Capa de Comparación Presidencial: `queries/public/compare.ts`

En `getPresidentialFormulasComparison`:

- Se eliminó el requerimiento `active: true` en la consulta del presidente:
  ```ts
  where: {
    id: { in: uniqueIds },
    type: "PRESIDENTE",
  }
  ```
- Se eliminó el requerimiento `active: true` en la consulta de los miembros de fórmula:
  ```ts
  where: {
    political_party_id: pres.political_party_id,
    electoral_process_id: pres.electoral_process_id,
    type: { in: FORMULA_TYPES },
  }
  ```
  _Garantía_: Esta función es de uso exclusivo del Comparador Presidencial. Al estar acotada a `uniqueIds` y al `electoral_process_id` del candidato seleccionado, no existe riesgo de fuga de datos ni impacto colateral.

#### C. Acciones del Comparador: `app/(platform)/(interaccion)/comparador/_lib/actions.ts`

En `searchPresidentialCandidates`:

- Se localiza el proceso de Elecciones Generales por nombre o identificador (`dclcgoqihesl49kyjgnjcf9a`), sin importar su flag `active`.
- Se envía `active: false` y `pageSize: 60` a `getCandidatesCards` para listar a los 36 candidatos presidenciales disponibles en el selector.

#### D. Hidratación por URL: `app/(platform)/(interaccion)/comparador/_lib/data.ts`

En `getEntitiesByIds`:

- Se pasa `active: false` y `pageSize: ids.length` para recuperar las entidades seleccionadas a partir de los query params (`?ids=...`).

#### E. Acceso para la Presentación: `app/(platform)/(interaccion)/comparador/page.tsx`

- Se suspendió temporalmente el guardia `if (!user)` para permitir que la demostración a la Fundación BBVA funcione fluidamente desde cualquier navegador o ventana sin requerir credenciales activas.

---

## 4. Guía para el Futuro y Mantenimiento

### 4.1 Cómo restaurar el bloqueo de autenticación post-reunión

Una vez finalizada la reunión con Fundación BBVA, si se desea volver a ocultar el comparador para el público general:

1. En `app/(platform)/(interaccion)/comparador/page.tsx`, descomentar las líneas de importación y validación de usuario:

   ```tsx
   import UnderConstruction from "@/components/under-construction";
   import { serverGetUser } from "@/lib/auth-actions";

   // Dentro de ComparatorPage:
   const { user } = await serverGetUser();
   if (!user) {
     return (
       <ContentPlatformLayout>
         <UnderConstruction feature="comparador" isTeam />
       </ContentPlatformLayout>
     );
   }
   ```

### 4.2 Cómo adaptar el Comparador a Elecciones Regionales y Municipales (ERM)

Si en el futuro se decide habilitar el comparador para candidatos de ERM (ej. Gobernadores Regionales o Alcaldes Provinciales):

1. **Tipo de Candidatura**: Cambiar en `actions.ts` y `data.ts` el tipo `CandidacyType.PRESIDENTE` por el tipo deseado (`GOBERNADOR_REGIONAL` o `ALCALDE_PROVINCIAL`).
2. **Proceso Electoral**: Volver a apuntar a `getElectoralProcess({ active: true })` para tomar automáticamente el proceso ERM 2026.
3. **Estado Activo**: Cambiar `active: false` por `active: true` en las llamadas a `getCandidatesCards`.
4. **Fórmulas**: Adaptar `queries/public/compare.ts` para agrupar vicegobernadores o listas de regidores según corresponda.

---

## 5. Matriz de Validación y Pruebas Realizadas

| Prueba                  | Comando / Método                        | Resultado                                                                                     |
| :---------------------- | :-------------------------------------- | :-------------------------------------------------------------------------------------------- |
| **Comprobación en BD**  | Script directo con Prisma Client        | Confirmada existencia de 36 fórmulas presidenciales completas en `dclcgoqihesl49kyjgnjcf9a`.  |
| **Type Check**          | `pnpm run type-check` (`tsc --noEmit`)  | **Exitoso (código 0)**. Tipado estricto sin errores.                                          |
| **Linter**              | `pnpm exec eslint ...`                  | **Exitoso (0 errores, 0 warnings)**.                                                          |
| **Renderizado SSR**     | Petición HTTP local con IDs de prueba   | Retorno HTTP 200 con nombres y fórmulas de candidatos inyectados en HTML.                     |
| **Prueba en Navegador** | Verificación interactiva por el usuario | Selector funcional, carga de tarjetas, visualización de pestañas y contraste temático activo. |
