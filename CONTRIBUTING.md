# CONTRIBUTING.md

## Bienvenido a 'VotaBien Perú' 🇵🇪

¡Estamos encantados de que estés interesado en contribuir a nuestro proyecto! Este documento te guiará a través de los pasos necesarios para aportar tu valioso trabajo a **VotaBien Perú**, una plataforma de transparencia política desarrollada con Next.js 15. Queremos hacer de este proceso algo sencillo y transparente, así que aquí tienes una guía paso a paso.

## Primeros pasos 🚀

### 1. **Familiarízate con las tecnologías**

Si aún no lo has hecho, asegúrate de entender cómo funcionan las tecnologías principales del proyecto:

- **Next.js 15**: Puedes encontrar información útil en [la documentación oficial de Next.js](https://nextjs.org/docs)
- **React**: Conoce los fundamentos en [la documentación de React](https://react.dev)
- **TypeScript**: Aprende sobre tipado en [la documentación de TypeScript](https://www.typescriptlang.org/docs/)
- **Supabase**: Familiarízate con nuestra base de datos en [la documentación de Supabase](https://supabase.com/docs)
- **Tailwind CSS**: Aprende sobre las utilidades en [la documentación de Tailwind](https://tailwindcss.com/docs)
- **Shadcn/ui**: Conoce los componentes en [shadcn/ui](https://ui.shadcn.com)

### 2. **Configura tu entorno de desarrollo**

Recomendamos utilizar **pnpm** como gestor de paquetes por su eficiencia y rapidez. Si no tienes `pnpm` instalado, puedes hacerlo ejecutando:

```bash
npm install -g pnpm
```

## Cómo contribuir 🛠

### 1. Configura tu entorno

#### Fork el repositorio

Haz un "fork" del proyecto a tu cuenta de GitHub para tener tu propia copia. Para hacer esto:

1. Haz clic en el botón "Fork" en la parte superior derecha de la página del repositorio en GitHub
2. Esto creará una copia del repositorio en tu cuenta de GitHub

#### Clona tu fork

Después de hacer un fork, clona el repositorio a tu máquina local:

```bash
git clone https://github.com/TU_USUARIO/votabien-peru.git
cd votabien-peru
```

#### Añade el repositorio original como remoto

Para mantener tu fork actualizado con los cambios del repositorio original:

```bash
git remote add upstream https://github.com/antguivy/votabien-peru.git
```

#### Asegúrate de usar la versión de Node correcta

```bash
nvm use
# o si no usas NVM, asegúrate de tener Node.js 22+
```

#### Instala las dependencias

```bash
pnpm install
```

Esto también configurará automáticamente los hooks de git con Lefthook.

#### Configura tu entorno

```bash
cp .env.example .env.local
```

El archivo `.env.example` ya contiene las claves públicas necesarias para el entorno de Staging en Supabase.

### 2. Trabaja en tus cambios

#### Sincroniza tu fork

Antes de empezar a trabajar, asegúrate de que tu fork está actualizado:

- **Desde GitHub.com**: Ve a `github.com/tu-usuario/votabien-peru` y haz click en `Sync fork`
- **Desde la terminal**:
  ```bash
  git switch main
  git fetch upstream
  git merge upstream/main
  ```

Más información en la [documentación oficial de GitHub](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork)

#### Crea una nueva rama

Antes de empezar a trabajar en tus cambios, crea una nueva rama:

```bash
git switch -c feat/nombre-descriptivo
```

**Convención de nombres de ramas:**

| Prefijo     | Uso                  | Ejemplo                    |
| ----------- | -------------------- | -------------------------- |
| `feat/`     | Nueva funcionalidad  | `feat/filtro-por-region`   |
| `fix/`      | Corrección de bug    | `fix/error-en-busqueda`    |
| `refactor/` | Refactorización      | `refactor/componente-card` |
| `style/`    | Cambios de estilo/UI | `style/actualizar-colores` |
| `docs/`     | Documentación        | `docs/actualizar-readme`   |
| `test/`     | Tests                | `test/agregar-tests-card`  |
| `chore/`    | Mantenimiento        | `chore/actualizar-deps`    |

### 3. Envía tus cambios

Este proyecto usa **Conventional Commits** con validación estricta. Si el formato es incorrecto, el commit será rechazado.

#### Forma recomendada (Asistente interactivo)

```bash
git add .
pnpm commit
```

El asistente CLI te guiará paso a paso: selecciona tipo, scope y escribe la descripción.

#### Forma manual

Formato: `<tipo>(<scope>): <descripción>`

```bash
git commit -m "feat(candidates): agregar filtro por región"
```

**Scopes válidos:** `legislators`, `candidates`, `parties`, `auth`, `ui`, `config`, `tooling`, `deps`

**Tipos disponibles:**

| Tipo       | Uso                   |
| ---------- | --------------------- |
| `feat`     | Nueva funcionalidad   |
| `fix`      | Corrección de bug     |
| `docs`     | Documentación         |
| `style`    | Formato de código     |
| `refactor` | Refactorización       |
| `perf`     | Mejora de rendimiento |
| `test`     | Tests                 |
| `chore`    | Mantenimiento         |
| `ci`       | CI/CD                 |

**Ejemplos:**

```bash
feat(legislators): agregar búsqueda por partido
fix(auth): corregir redirección en login
docs(readme): actualizar instrucciones de setup
```

#### 🛡️ Quality Gate

Al hacer commit, Lefthook ejecuta automáticamente:

- ✓ ESLint (linter)
- ✓ TypeScript (type-check)
- ✓ Commitlint (formato del mensaje)

Si hay errores, el commit se cancela hasta que los corrijas.

#### Push a tu fork

```bash
git push origin nombre-de-tu-rama
```

#### Crea un Pull Request (PR)

1. Ve a tu fork en GitHub (`github.com/tu-usuario/votabien-peru`)
2. Haz clic en "Pull request" o "Compare & pull request"
3. Asegúrate de que el PR apunte a la rama `main` del repositorio original
4. Describe claramente tus cambios siguiendo la plantilla:

```markdown
## Descripción

Breve descripción de los cambios realizados.

## Tipo de cambio

- [ ] Bug fix (corrección de bug)
- [ ] Nueva funcionalidad (feature)
- [ ] Breaking change (cambio que rompe funcionalidad existente)
- [ ] Documentación

## ¿Cómo se ha probado?

Describe cómo probaste tus cambios.

## Checklist

- [ ] Mi código sigue las guías de estilo del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado mi código en áreas difíciles de entender
- [ ] He actualizado la documentación correspondiente
- [ ] Mis cambios no generan nuevas advertencias
- [ ] He agregado tests que prueban mi funcionalidad
- [ ] Los tests locales pasan con mis cambios
```

## Buenas prácticas

### Antes de abrir un PR

- **Revisa los issues abiertos** antes de comenzar. Si crees que puedes solucionarlo y no hay otra PR abierta, usa `#numero-de-issue` en tu commit para vincularla.
- **Revisa los PRs abiertos** para asegurarte de que no estás trabajando en algo que ya está en progreso.
- **Deja comentarios** en issues que planeas resolver para evitar trabajo duplicado.

### Durante el desarrollo

- **Mantén tus commits limpios y descriptivos** - Cada commit debe representar un cambio lógico
- **Sigue las convenciones de código del proyecto** (ver más abajo)
- **Actualiza tu rama con frecuencia** para mantenerla al día con `main`
- **Escribe tests** para nuevas funcionalidades cuando sea posible
- **Documenta tu código** - Agrega comentarios JSDoc para funciones complejas

### Convenciones de código

#### TypeScript

- **Usa TypeScript estricto** - No uses `any` en ningun caso
- **Define interfaces y types** para estructuras de datos
- **Usa tipos explícitos** en parámetros de función

```typescript
// ✅ Bien
interface Legislador {
  id: string;
  nombre: string;
  partido: string;
  region: string;
}

function getLegislador(id: string): Promise<Legislador | null> {
  // ...
}

// ❌ Evitar
function getLegislador(id: any): any {
  // ...
}
```

#### Nomenclatura

- **Componentes y clases**: PascalCase → `LegisladorCard`, `SearchBar`
- **Funciones y variables**: camelCase → `getLegisladores`, `isLoading`
- **Variables de dominio**: español → `legislador`, `partido`, `votacion`
- **Variables técnicas**: inglés → `isLoading`, `handleClick`, `fetchData`
- **Constantes**: UPPER_SNAKE_CASE → `MAX_RESULTS`, `API_URL`
- **Archivos de componentes**: PascalCase → `LegisladorCard.tsx`
- **Otros archivos**: kebab-case → `use-legisladores.ts`, `format-date.ts`

```typescript
// ✅ Bien - Mezcla apropiada de español e inglés
interface LegisladorCardProps {
  legislador: Legislador;
  onClick?: () => void;
}

export function LegisladorCard({ legislador, onClick }: LegisladorCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Card onClick={onClick}>
      <CardTitle>{legislador.nombre}</CardTitle>
    </Card>
  );
}
```

#### Componentes React

- **Usa componentes funcionales** con hooks
- **Componentiza apropiadamente** - Un componente debe tener una responsabilidad clara
- **Usa React Server Components** cuando sea posible (Next.js 15)
- **Maneja el estado correctamente** - Usa `useState` para estado local, Supabase para estado de servidor

#### Estilos con Tailwind

- **Usa Tailwind utilities** en lugar de CSS custom
- **Sigue un orden consistente** de clases (layout → spacing → typography → colors → effects)
- **Usa el helper `cn()`** para clases condicionales

```typescript
// ✅ Bien
<div className={cn(
  "flex items-center gap-4 p-4",
  "text-lg font-semibold",
  "bg-white dark:bg-gray-800",
  "rounded-lg shadow-md hover:shadow-lg",
  "transition-shadow duration-200",
  isActive && "ring-2 ring-blue-500"
)} />

// ❌ Evitar - Sin orden, difícil de leer
<div className="text-lg bg-white gap-4 rounded-lg flex hover:shadow-lg p-4" />
```

#### Supabase y Queries

- **Define queries reutilizables** en `/queries`
- **Maneja errores apropiadamente**
- **Usa tipos generados** de Supabase

```typescript
// ✅ Bien
export async function getLegisladores() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("legisladores")
    .select("*")
    .order("nombre");

  if (error) {
    console.error("Error al obtener legisladores:", error);
    return [];
  }

  return data;
}
```

#### Importaciones

- **Agrupa las importaciones** en orden lógico
- **Usa paths absolutos** con `@/` cuando sea apropiado

```typescript
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getLegisladores } from "@/queries/legisladores";

import type { Legislador } from "@/interfaces/legislador";
```

### Revisión de PRs

- **Participa en las discusiones** de tu PR si hay comentarios o sugerencias
- **Responde constructivamente** a los comentarios de revisión
- **Actualiza tu PR** según el feedback recibido
- **Sé paciente** - Las revisiones pueden tomar tiempo

### Testing

Aunque aún no tenemos tests implementados, cuando agregues funcionalidad nueva considera:

- Agregar tests unitarios para funciones de utilidad
- Agregar tests de integración para flujos importantes
- Documentar cómo probar manualmente tu funcionalidad

## Estructura del proyecto 📁

```
votabien-peru/
├── app/                    # Next.js 15 App Router
│   ├── (platform)/        # Rutas de la plataforma principal
│   │   ├── legisladores/  # Página de legisladores
│   │   └── ...
│   ├── auth/              # Autenticación
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/               # Componentes de Shadcn/ui
│   ├── legislador/       # Componentes específicos de legisladores
├── hooks/                 # Custom hooks
├── interfaces/            # TypeScript interfaces
├── lib/                   # Utilidades
│   ├── supabase/         # Cliente de Supabase
│   └── utils.ts          # Funciones de utilidad
├── queries/              # Queries de Supabase
└── schemas/              # Validación con Zod
```

## ¿Necesitas ayuda? 🆘

Si tienes alguna pregunta o necesitas ayuda:

- Revisa la [documentación](README.md)
- Abre un [issue](https://github.com/antguivy/votabien-peru/issues) con tus dudas
- Participa en las [discusiones](https://github.com/antguivy/votabien-peru/discussions)
- Contacta al equipo (información en el README)

## Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas un comportamiento respetuoso y profesional.

- Sé respetuoso con otros contribuidores
- Acepta críticas constructivas con gracia
- Enfócate en lo que es mejor para la comunidad
- Muestra empatía hacia otros miembros de la comunidad

---

¡Gracias por contribuir a VotaBien Perú! Juntos estamos construyendo una democracia más transparente.
