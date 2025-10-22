<div align="center">

<a name="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<br>

<a href="https://votabien.pe/" target="_blank" rel="noopener noreferrer">
  <img src="https://github.com/antguivy/votabien-peru/blob/main/public/logo_completo.png?raw=true" alt="VotaBien Perú Logo" width="400" />
</a>

<br>
<br>

<p align="center">
  <strong>Plataforma de transparencia política para una ciudadanía informada</strong>
  <br>
  <br>
  <a href="https://github.com/antguivy/votabien-peru/issues">Reportar error</a>
  ·
  <a href="https://github.com/antguivy/votabien-peru/issues">Sugerir algo</a>
</p>

</div>

<br>

## 📎 Descripción:

**VotaBien Perú** es una iniciativa de código abierto que democratiza el acceso a la información política en el Perú. Nuestra plataforma permite a los ciudadanos peruanos explorar de manera transparente los perfiles de congresistas actuales y futuros candidatos, realizar seguimiento a su actividad legislativa, y tomar decisiones informadas basadas en datos verificables.

Este proyecto nace con la visión de empoderar a la ciudadanía con información clara, accesible y verificable sobre quiénes nos representan y quiénes aspiran a hacerlo.

### 🔗 Repositorios Relacionados

- 🎨 **Frontend** (Este repositorio): https://github.com/antguivy/votabien-peru-frontend
- 🚀 **Backend API**: https://github.com/antguivy/votabien-peru-backend

<p align="right">
    (<strong><a href="#readme-top">regresar</a></strong>)
    (<a href="#readme-index">índice</a>)
</p>

<a name="readme-index"></a>

---

## 🗂️ Índice:

<details open>
    <summary>
        <a href="#readme-index" title="Más...">VotaBien Perú - Frontend</a>
    </summary>

- 📎 <a href="#readme-top" title="Ir a la Descripción">Descripción</a>
- 🗂️ <a href="#readme-index" title="Ir al Índice"><strong>Índice</strong></a>  <span><strong>< Usted está aquí ></strong></span>
- ✨ <a href="#readme-features" title="Ir a Características">Características</a>
- 🚀 <a href="#readme-stack" title="Ir al Stack Tecnológico">Tech Stack</a>
- 🧑‍💻 <a href="#readme-setup" title="Ir a Configuración">Configuración Rápida</a>
- 🏗️ <a href="#readme-structure" title="Ir a Estructura">Estructura del Proyecto</a>
- 🤝 <a href="#readme-contribute" title="Ir a Contribuir">¿Cómo Contribuir?</a>
- 📄 <a href="#readme-license" title="Ir a Licencia">Licencia</a>

</details>

<p align="right">
    (<a href="#readme-top">regresar</a>)
    (<strong><a href="#readme-index">índice</a></strong>)
</p>

<a name="readme-features"></a>

---

## ✨ Características:

- 🔍 **Búsqueda Avanzada** - Encuentra rápidamente a congresistas y candidatos
- 📊 **Perfiles Detallados** - Información completa sobre trayectoria política y legislativa
- 📈 **Seguimiento de Actividad** - Monitorea votaciones y proyectos de ley
- 📱 **Diseño Responsivo** - Experiencia optimizada en todos los dispositivos
- 🌐 **Código Abierto** - Transparente y verificable por la comunidad
- ⚡ **Rendimiento Óptimo** - Carga rápida y navegación fluida

<p align="right">
    (<a href="#readme-top">regresar</a>)
    (<a href="#readme-index">índice</a>)
</p>

<a name="readme-stack"></a>

---

## 🚀 Tech Stack:

- [![Next.js][nextjs-badge]][nextjs-url] - The React Framework for Production
- [![React][react-badge]][react-url] - A JavaScript library for building user interfaces
- [![TypeScript][typescript-badge]][typescript-url] - JavaScript with syntax for types
- [![Tailwind CSS][tailwind-badge]][tailwind-url] - A utility-first CSS framework
- [![Shadcn/ui][shadcn-badge]][shadcn-url] - Re-usable components built with Radix UI
- [![pnpm][pnpm-badge]][pnpm-url] - Fast, disk space efficient package manager

<p align="right">
    (<a href="#readme-top">regresar</a>)
    (<a href="#readme-index">índice</a>)
</p>

<a name="readme-setup"></a>

---

## 🧑‍💻 Configuración Rápida:

> [!IMPORTANT]
> Este repositorio contiene **solo el frontend**. Necesitarás conectarte a una API backend para que funcione completamente.


### Stack Completo con Backend Local (Docker)

Si quieres desarrollar con todo el sistema localmente:

**Paso 1: Levanta el Backend**

```bash
# Clona el repositorio del backend
git clone https://github.com/antguivy/votabien-peru-backend.git
cd votabien-peru-backend

# Configura y levanta con Docker
cp .env.example .env
docker-compose up -d

```

**Paso 2: Configura el Frontend**

```bash
# Clona este repositorio (en otro directorio)
git clone https://github.com/antguivy/votabien-peru-frontend.git
cd votabien-peru

# Instala dependencias
pnpm install

# Configura para usar el backend local
cp .env.example .env

```

**Paso 3: Inicia el Frontend**

```bash
pnpm dev
```

Ahora tienes acceso a:
- 🎨 **Frontend**: http://localhost:3000
- 🚀 **Backend**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs
- 🗄️ **Adminer**: http://localhost:8080

---

## 🤝 ¿Cómo Contribuir?

> [!IMPORTANT]
> ¡Toda ayuda es bienvenida! Si quieres formar parte de este proyecto y contribuir a la democracia peruana, adelante.

### 🚀 Guía Rápida

1. **Fork** este repositorio

2. **Clona** tu fork:
    ```bash
    git clone https://github.com/TU_USUARIO/votabien-peru.git
    cd votabien-peru
    ```

3. **Instala dependencias**:
    ```bash
    pnpm install
    ```

4. **Configura el entorno**:
    ```bash
    cp .env.example .env
    ```

5. **Crea una rama** para tu feature:
    ```bash
    git checkout -b feat/nueva-funcionalidad
    ```

    **Convención de nombres:**
    
    | Prefijo    | Uso                     |
    |-----------|-------------------------|
    | `feat/`     | Nueva funcionalidad     |
    | `fix/`      | Corrección de bug       |
    | `refactor/` | Refactorización         |
    | `style/`    | Cambios de estilo/UI    |
    | `docs/`     | Documentación           |
    | `test/`     | Tests                   |
    | `chore/`    | Tareas de mantenimiento |

6. **Desarrolla** y **prueba**:
    ```bash
    pnpm dev          # Servidor de desarrollo
    pnpm lint         # Verifica el código
    ```

7. **Commit** tus cambios:
    ```bash
    git add .
    git commit -m "feat: agregar filtro por región"
    ```

8. **Push** a tu fork:
    ```bash
    git push origin feat/nueva-funcionalidad
    ```

9. **Abre un Pull Request** en GitHub explicando:
   - ✅ Qué cambios hiciste
   - ✅ Por qué son necesarios
   - ✅ Screenshots (si hay cambios visuales)
   - ✅ Cómo probar los cambios

### 📋 Checklist antes del PR

- [ ] El código compila sin errores (`pnpm build`)
- [ ] Pasa el linting (`pnpm lint`)
- [ ] He probado los cambios localmente
- [ ] He actualizado la documentación si es necesario
- [ ] He agregado tests para nuevas funcionalidades

### 🎨 Estándares de Código

- Usa **TypeScript** estricto
- Sigue las convenciones de **ESLint** y **Prettier**
- Componentes funcionales con **hooks**
- Nombres en español para variables de dominio
- Nombres en inglés para componentes y funciones técnicas
- Usa **Tailwind CSS** para estilos
- Componentiza de forma reutilizable

**Ejemplo:**

```typescript
interface CongresistaCardProps {
  legislador: Legislador;
  onClick?: () => void;
}

export function LegisladorCard({ legislador, onClick }: LegisladorCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader>
        <CardTitle>{legislador.nombre}</CardTitle>
        <CardDescription>{legislador.partido}</CardDescription>
      </CardHeader>
    </Card>
  );
}
```

<p align="right">
    (<a href="#readme-top">regresar</a>)
    (<a href="#readme-index">índice</a>)
</p>



<br>
<br>

<div align="center">

**¡Gracias a todos los colaboradores por construir una democracia más transparente!**

[![Contribuidores](https://contrib.rocks/image?repo=antguivy/votabien-peru&max=500&columns=20)](https://github.com/antguivy/votabien-peru/graphs/contributors)

</div>

<br>

<div align="center">

**Hecho con ❤️ para el Perú**

[Backend](https://github.com/antguivy/votabien-peru-backend) · 
[Reportar error](https://github.com/antguivy/votabien-peru-frontend/issues) · 
[Sugerir algo](https://github.com/antguivy/votabien-peru-frontend/issues)

</div>

<!-- Repository Links -->
[contributors-shield]: https://img.shields.io/github/contributors/antguivy/votabien-peru.svg?style=for-the-badge
[contributors-url]: https://github.com/antguivy/votabien-peru/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/antguivy/votabien-peru.svg?style=for-the-badge
[forks-url]: https://github.com/antguivy/votabien-peru/network/members
[stars-shield]: https://img.shields.io/github/stars/antguivy/votabien-peru.svg?style=for-the-badge
[stars-url]: https://github.com/antguivy/votabien-peru/stargazers
[issues-shield]: https://img.shields.io/github/issues/antguivy/votabien-peru.svg?style=for-the-badge
[issues-url]: https://github.com/antguivy/votabien-peru/issues
[license-shield]: https://img.shields.io/github/license/antguivy/votabien-peru.svg?style=for-the-badge

<!-- Tech Stack Links -->
[nextjs-url]: https://nextjs.org/
[react-url]: https://reactjs.org/
[typescript-url]: https://www.typescriptlang.org/
[tailwind-url]: https://tailwindcss.com/
[shadcn-url]: https://ui.shadcn.com/
[pnpm-url]: https://pnpm.io/

[nextjs-badge]: https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[react-badge]: https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black
[typescript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[tailwind-badge]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[shadcn-badge]: https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white
[pnpm-badge]: https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white
