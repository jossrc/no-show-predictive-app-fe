# CODEX — Fundación técnica del frontend | TESIS 2026–2027

## 1. Objetivo

Implementar desde cero la **fundación técnica, arquitectura y cascarón mínimo ejecutable** del frontend de nuestro sistema web predictivo de inasistencias en una empresa del sector de estética y cuidado personal.

Esta tarea NO consiste en desarrollar todavía las pantallas completas ni integrar todas las historias de usuario.

**Entregable esperado:** una aplicación Next.js 16.4.0 con React, TypeScript 7, Tailwind CSS, shadcn/ui, dependencias preparadas, reglas estrictas de calidad, arquitectura modular, componentes reutilizables, configuración de estado, pruebas iniciales y una página "Hola mundo" accesible desde el navegador.

Priorizar calidad, mantenibilidad y posibilidad de continuar el desarrollo posteriormente, sin sobrediseñar la solución.

## 2. Directorio y contexto local

Estás ejecutándote dentro de:

`no-show-predictive-app-fe/`

Estructura de carpetas vecinas:

- `../no-show-predictive-app-be/`: backend Node.js/TypeScript/Fastify.
- `../depi-noshow-ml/`: microservicio Python/FastAPI con Random Forest, XGBoost y SHAP.
- `../diagramas/`: diagramas y documentación técnica.

**REGLAS IMPORTANTES:**

- Trabajar exclusivamente dentro de `no-show-predictive-app-fe/`.
- NO crear otro directorio `no-show-predictive-app-fe` dentro del actual.
- NO transformar estas carpetas en un monorepo.
- NO instalar dependencias en los proyectos vecinos.
- NO modificar archivos del backend, Python, bases de datos o diagramas.
- Puedes inspeccionar el código y los contratos del backend en modo lectura para entender la arquitectura y los servicios existentes.
- Antes de generar archivos, examina el directorio actual. Respeta los archivos existentes que sean pertinentes.
- Comprueba el directorio de trabajo efectivo antes de instalar o modificar nada.

Nombre npm del proyecto: `no-show-predictive-app-fe`.

## 3. Versiones obligatorias

Utilizar:

- Node.js: **24.20.0**
- npm como gestor de paquetes.
- Next.js: **16.4.0 estable**, versión exacta.
- React y React DOM: versión estable compatible con Next.js 16.4.0, preferentemente React 19.3.
- TypeScript: **7.0.2**, con su compilador nativo.
- Tailwind CSS: versión 4 estable.
- ESLint: versión estable compatible con Next.js 16.
- Prettier: versión estable compatible.

El usuario utiliza NVM y dispone de varias versiones de Node.

Al comenzar:

1. Comprobar `pwd`, `node -v`, `npm -v` y el estado del directorio.
2. Activar `nvm use 24.20.0`. Si NVM no está cargado en el shell, cargarlo desde su instalación estándar antes de ejecutarlo.
3. No cambiar la versión global por defecto de Node.
4. Crear `.nvmrc` con `24.20.0`.
5. Configurar `engines.node` de forma compatible con Node 24.20.0.
6. Crear `.npmrc` con `save-exact=true` y una política de versiones reproducibles.
7. Generar y conservar `package-lock.json`.
8. Utilizar `npm ci` para verificar la reproducibilidad de la instalación.

**Consideración especial de TypeScript 7:**

TypeScript 7 utiliza un compilador nativo y no tiene la misma API JavaScript que TypeScript 6.

Antes de configurar Next.js, revisar la compatibilidad efectiva entre Next.js 16.4.0 y TypeScript 7.0.2.

Preferir la integración soportada mediante `experimental.useTypeScriptCli` cuando esté disponible en la versión instalada.

Ejecutar una verificación real de `next build` y del chequeo de tipos.

No desactivar los errores de TypeScript mediante `ignoreBuildErrors: true`.

Si alguna herramienta todavía requiere la antigua API de TypeScript, estudiar primero el mecanismo oficial de coexistencia entre TypeScript 6 y TypeScript 7, manteniendo TypeScript 7 como herramienta de typecheck del proyecto. Documentar cualquier compatibilidad auxiliar. No degradar silenciosamente a TypeScript 6 ni instalar parches improvisados.

## 4. Crear el proyecto

Inicializar la aplicación **directamente en el directorio actual** con la configuración oficial de Next.js 16.4.0.

Preferencias:

- App Router.
- `src/` directory.
- TypeScript estricto.
- Tailwind CSS 4.
- ESLint.
- Alias `@/*` hacia `src/*`.
- Turbopack predeterminado.
- React Server Components por defecto.

No incluir Pages Router.

No activar configuraciones experimentales innecesarias para esta fundación. Si el generador activa Cache Components u otras capacidades de Next.js 16.4, verificar su necesidad y dejar constancia de la decisión.

Evitar utilizar `latest` sin inspeccionar las versiones instaladas. Registrar versiones efectivas y fijarlas en el lockfile.

## 5. Librerías de interfaz

Configurar shadcn/ui siguiendo su CLI oficial actual y utilizando **Radix UI como base de primitivas**, con una sola familia consistente de componentes.

Configurar:

- Tailwind CSS 4.
- Tokens de diseño mediante variables CSS.
- Modo claro y oscuro.
- Componentes con soporte de accesibilidad.
- Lucide React para iconos.
- Sistema consistente de bordes, espaciado y tipografía.

Agregar los componentes base de shadcn/ui que necesitaremos próximamente, siempre que el CLI los soporte en la versión instalada:

- Button
- Card
- Badge
- Separator
- Skeleton
- Alert
- Input
- Label
- Textarea
- Select
- Dialog
- Sheet
- Dropdown Menu
- Tooltip
- Tabs
- Table
- Checkbox
- Popover
- Calendar
- Sonner
- Chart

No agregar todos los componentes disponibles indiscriminadamente. Utilizar el CLI oficial y respetar sus dependencias.

Los componentes generados deberán ubicarse en `src/components/ui/`, para mantenerlos diferenciados de nuestros componentes de dominio.

No duplicar primitivas que shadcn/ui ya proporciona.

## 6. Librerías funcionales que deben quedar instaladas

### Datos y tablas

Instalar:

- `@tanstack/react-query`
- `@tanstack/react-query-devtools`
- `@tanstack/react-table`
- `@tanstack/react-virtual`
- `nuqs`

Propósito:

- Consultas remotas y caché de estado de servidor.
- Tablas complejas.
- Preparación para paginación y virtualización.
- Sincronización de filtros con parámetros de URL.

### Gráficos y reportes

Instalar:

- `recharts`, en su versión estable compatible con el componente Chart de shadcn/ui.

Preparar el componente Chart de shadcn/ui.

Los futuros reportes incluirán gráficos de barras, líneas, áreas y distribuciones.

No construir todavía dashboards completos ni reportes con datos ficticios.

### Formularios y validación

Instalar:

- `react-hook-form`
- `zod`
- `@hookform/resolvers`

No crear formularios de negocio todavía.

### Gestión de estado

Instalar:

- `zustand`
- `next-themes`

No crear stores globales vacíos ni patrones abstractos antes de necesitarlos.

### Fechas

Instalar:

- `date-fns`
- `date-fns-tz`

Utilizar `Intl` donde resulte suficiente.

Definir utilidades reutilizables para la zona horaria `America/Lima`. Los timestamps UTC deben conservarse correctamente y mostrarse en la zona horaria especificada.

### Utilidades

Instalar:

- `lucide-react`
- `sonner`

Respetar las utilidades de clases instaladas por el CLI actual de shadcn/ui. No duplicar `cn`, `clsx` o `tailwind-merge` innecesariamente si el CLI utiliza una solución nueva.

### Exportación

No instalar todavía bibliotecas de PDF o Excel sin un contrato definido para los reportes. Documentar el punto de extensión para incorporarlas posteriormente.

No instalar librerías de gráficos alternativas a Recharts ni frameworks de estado adicionales.

## 7. Estrategia de manejo de estados

Definir y documentar una política explícita:

**Estado local:**
Usar `useState` o `useReducer` cuando el estado pertenezca a un componente o una interacción local.

**Estado en URL:**
Usar `nuqs` para filtros, búsqueda, ordenamiento y selección de períodos que necesiten conservarse al navegar.

**Estado de servidor:**
Usar TanStack Query cuando las funcionalidades empiecen a consultar las API.

**Estado global del cliente:**
Reservar Zustand para casos realmente compartidos entre componentes o páginas, como algunas preferencias de interfaz. No almacenar en Zustand todas las respuestas HTTP.

**Tema visual:**
Utilizar next-themes.

No introducir Redux.

No duplicar estado entre URL, Zustand y React Query.

No almacenar datos sensibles de reservas o clientes innecesariamente en almacenamiento persistente del navegador.

Preparar `Providers` de manera composicional, evitando un componente gigantesco.

React Server Components deben ser el comportamiento predeterminado. Utilizar `"use client"` solamente donde corresponda.

## 8. Organización del proyecto

Proponer y aplicar una estructura ligera, compatible con App Router y organización por funcionalidades.

Estructura objetivo orientativa:

    src/
      app/
        (workspace)/
          layout.tsx
          page.tsx
          reservations/
            page.tsx
          reports/
            page.tsx
          models/
            page.tsx
          settings/
            page.tsx
        layout.tsx
        globals.css
        loading.tsx
        not-found.tsx

      components/
        ui/
        layout/
          AppShell.tsx
          AppSidebar.tsx
          AppHeader.tsx
        shared/
          EmptyState.tsx
          ErrorState.tsx
          LoadingState.tsx

      features/
        dashboard/
        reservations/
        reservation-risk/
        client-history/
        prediction-models/
        reports/

      lib/
        dates/
        config/
        utils/

      providers/
        AppProviders.tsx

      tests/
        unit/
        components/
        e2e/
        setup/

      types/

Crear solamente los directorios que tengan archivos reales. No utilizar archivos vacíos para simular arquitectura.

Puede ajustarse la estructura propuesta siempre que se mantengan:

- Rutas y layouts Next.js en `app/`.
- Componentes visuales genéricos en `components/`.
- Código específico de negocio agrupado por funcionalidad.
- Infraestructura y utilidades fuera de las páginas.
- Tests identificables y fáciles de ejecutar.

Aplicar separación de responsabilidades sin construir una arquitectura hexagonal artificial ni crear capas innecesarias.

No crear una carpeta global `services/` donde termine acumulándose toda la lógica de la aplicación.

## 9. Reglas estrictas de calidad del código

Uno de los problemas que queremos evitar es que los agentes de IA creen archivos de 500 o 1000 líneas.

Configurar ESLint con reglas reales y ejecutables para limitar tamaño y complejidad.

**Límites propuestos:**

- Archivos propios: máximo **300 líneas efectivas**.
- Componentes React propios: objetivo de **200 líneas o menos**.
- Páginas `page.tsx`: preferentemente menos de **120 líneas**.
- Funciones: máximo aproximado de **70 líneas**.
- Complejidad ciclomática máxima orientativa: **12**.
- Anidamiento lógico reducido; evitar funciones con múltiples niveles de condiciones.

Configurar `max-lines`, `max-lines-per-function` y `complexity` donde resulte técnicamente apropiado.

Las reglas deben omitir líneas en blanco y comentarios cuando sea pertinente.

Excepciones justificadas:

- Componentes generados automáticamente por shadcn/ui.
- Archivos generados por Next.js.
- Configuraciones de herramientas.
- Fixtures de pruebas que lo requieran.

**No exceptuar todo `src/` ni deshabilitar las reglas globalmente.**

Si un archivo excede el límite, preferir separar responsabilidades antes que suprimir ESLint.

Otras reglas:

- Evitar `any` injustificado.
- No usar `@ts-ignore` ni `eslint-disable` sin motivo concreto.
- Evitar componentes monolíticos.
- Separar configuración, constantes, hooks, transformaciones y presentación cuando sea necesario.
- Usar nombres expresivos.
- Priorizar funciones pequeñas y simples.
- No crear abstracciones para una única línea de código.
- No utilizar clases cuando funciones y composición resulten suficientes.
- Mantener imports organizados.
- Evitar imports circulares.
- Evitar código muerto y exports no utilizados.

No se busca alcanzar un número arbitrario de carpetas, sino código comprensible y mantenible.

## 10. Prettier, ESLint y editor

Configurar:

- ESLint Flat Config compatible con Next.js 16.
- Reglas Next.js Core Web Vitals.
- Reglas TypeScript compatibles.
- Prettier.
- `prettier-plugin-tailwindcss` compatible con Tailwind 4.
- `eslint-config-prettier`.
- `.prettierrc.json` o una configuración equivalente.
- `.prettierignore`.
- `.editorconfig`.
- Configuración básica de VS Code si aporta valor.

Convenciones sugeridas:

- Indentación de 2 espacios.
- Comillas simples en TypeScript.
- Punto y coma según convención única.
- Ancho de línea Prettier: 100 caracteres.
- Fin de línea LF.
- Ordenamiento automático de clases Tailwind.

**Importante:** Next.js 16 ya no proporciona `next lint`; utilizar el CLI `eslint` directamente.

Configurar los siguientes scripts en `package.json`, adaptándolos si hace falta:

- `dev`: iniciar Next.js en el puerto 3001.
- `build`: build de producción.
- `start`: iniciar producción en puerto 3001.
- `lint`: ejecutar ESLint.
- `lint:fix`: corregir problemas reparables.
- `format`: aplicar Prettier.
- `format:check`: verificar formato sin modificar.
- `typecheck`: comprobación de TypeScript.
- `test`: pruebas Vitest sin watch.
- `test:watch`: Vitest en watch.
- `test:coverage`: generar reporte de cobertura.
- `test:e2e`: ejecutar Playwright.
- `check`: lint + format:check + typecheck + pruebas unitarias + build.

Evitar que `npm test` se quede esperando indefinidamente en watch.

No crear un script `check` que llame a otro `check` recursivamente.

Si hay herramientas de desarrollo adicionales necesarias para estas reglas, instalarlas y configurarlas correctamente.

## 11. Puerto local

El backend Fastify utiliza el puerto 3000.

El microservicio Python utiliza el puerto 8001.

**El frontend utilizará por defecto el puerto 3001.**

Configurar los scripts para que:

- `npm run dev` inicie Next.js en `http://localhost:3001`.
- `npm run start` use también el puerto 3001.

No cambiar los puertos de los proyectos vecinos.

## 12. Diseño mínimo de la aplicación

Construir un cascarón administrativo básico, visualmente limpio, en español.

Incluir:

- Layout general.
- Sidebar responsive.
- Header.
- Nombre provisional del sistema.
- Navegación básica.
- Botón de tema claro/oscuro.
- Estados reutilizables de carga, vacío y error.
- Página inicial que muestre "Hola mundo" o "Frontend preparado".
- Indicador visual de que el frontend está en fase de configuración.

Las secciones de navegación serán:

- Inicio.
- Reservas.
- Reportes.
- Modelos.
- Configuración.

Cada ruta debe cargar correctamente, pero por ahora puede mostrar una pantalla sobria de "Módulo en preparación".

No implementar el diseño definitivo de estas páginas.

No crear todavía:

- Dashboard con datos sintéticos.
- Gráficos de negocio inventados.
- Tabla completa de reservas.
- Filtros complejos.
- Autenticación.
- CRUD.
- Predicciones.
- SHAP.
- Formularios de negocio.
- Exportaciones.

El objetivo es demostrar que la navegación, el layout, los componentes y el sistema de diseño están preparados.

La pantalla inicial debe ser suficientemente pulida como para visualizar la dirección estética del producto, pero sin invertir demasiado esfuerzo en detalles cosméticos.

Asegurar responsive y accesibilidad básica: elementos semánticos, navegación con teclado y etiquetas de controles.

## 13. Preparación para APIs reales

El backend Fastify ya dispone de estos endpoints:

- `GET /api/v1/reservations`
- `GET /api/v1/reservations/:reservationId`
- `GET /api/v1/reservations/:reservationId/risk`
- `POST /api/v1/reservations/:reservationId/predictions`
- `GET /api/v1/reservations/:reservationId/risk/factors`
- `GET /api/v1/reservations/:reservationId/client-history`
- `GET /api/v1/ml/models`
- `GET /api/v1/health/ml`

No consumir todavía las APIs reales.

No crear un gran SDK ni generar tipos que no hayan sido contrastados con el contrato.

Preparar únicamente los puntos de extensión necesarios para introducir más adelante:

- Cliente HTTP ejecutado desde servidor.
- Tipos DTO.
- Validación de respuestas externas con Zod.
- Tratamiento consistente de errores.
- Consultas mediante TanStack Query cuando se necesiten.
- Adaptación DTO → modelos de presentación.
- Estados de disponibilidad predictiva.

Si el backend contiene un contrato OpenAPI generado o contratos documentados, puedes consultarlos en modo lectura. No es obligatorio implementar todavía el cliente HTTP.

## 14. Seguridad

La API Fastify tiene autenticación provisional mediante `x-api-key`.

**La API Key nunca debe estar en código del navegador.**

Configurar `.env.example` con nombres como:

    FRONTEND_DATA_MODE=demo
    FASTIFY_API_BASE_URL=http://127.0.0.1:3000
    FASTIFY_INTERNAL_API_KEY=

Reglas:

- No copiar archivos `.env` de las carpetas vecinas.
- No buscar ni imprimir valores de secretos.
- No usar `NEXT_PUBLIC_` para API Keys.
- No usar `localStorage` ni `sessionStorage` para credenciales.
- No crear proxies HTTP genéricos accesibles públicamente.
- No exponer datos reales de clientes.
- No introducir una autenticación ficticia.
- No introducir protección simulada que pueda confundirse con autenticación segura.

Agregar `.env*` al `.gitignore` según las convenciones de Next.js, permitiendo versionar `.env.example`.

La integración real con Fastify se realizará más adelante con llamadas servidor-servidor y autorización adecuada.

## 15. Política de datos y ML

Esta fase del frontend no necesita predicciones reales.

Sin embargo, dejar documentadas estas reglas del proyecto:

- `NOT_SCORABLE` significa que la reserva no puede evaluarse con la evidencia admitida actualmente.
- `NOT_SCORED` significa ausencia de puntuación.
- `riskLevel=null` significa que no hay clasificación de riesgo disponible.
- `EXPLORATORY_NOT_VALIDATED` indica predicciones exploratorias.
- `operationalUseAllowed=false` impide presentarlas como decisiones operativas validadas.
- No inventar probabilidades de inasistencia.
- No definir umbrales LOW/MEDIUM/HIGH todavía.
- No tratar tasas históricas como probabilidades predictivas.
- No mezclar datos de demostración con datos reales.

No modificar nada del ML en esta tarea.

## 16. Tests iniciales

Instalar y configurar el siguiente stack:

**Pruebas unitarias y de componentes:**

- Vitest.
- React Testing Library.
- `@testing-library/jest-dom`.
- `@testing-library/user-event`.
- jsdom.
- Herramientas necesarias para integrar Vitest con TypeScript y alias de Next.js.

**Mocking de futuros servicios HTTP:**

- MSW versión 2 compatible.

**Pruebas de navegador:**

- `@playwright/test`.

Configurar `vitest.config` y `playwright.config` correctamente.

Para esta primera etapa, implementar solamente pruebas útiles:

1. Renderizado de la página inicial: muestra "Hola mundo" o "Frontend preparado".
2. Renderizado del layout y navegación.
3. Una prueba interactiva del selector de tema, verificando su comportamiento accesible o estado.
4. Una prueba unitaria de una utilidad real de fechas en `America/Lima`.
5. Una prueba E2E básica con Playwright: iniciar Next.js, abrir la página principal y verificar que carga correctamente.

No crear pruebas ficticias que solamente hagan `expect(true).toBe(true)`.

No crear fixtures masivas.

No escribir tests para servicios todavía inexistentes.

Para Playwright:

- Usar `baseURL=http://127.0.0.1:3001`.
- Configurar el arranque del servidor mediante `webServer` o mecanismo equivalente.
- Instalar Chromium si es necesario y el entorno lo permite.
- Evitar una configuración que deje procesos abiertos innecesariamente.

Para pruebas de componentes async Server Components, respetar las limitaciones actuales de Vitest y preferir E2E cuando corresponda.

Configurar cobertura y exclusiones razonables. No imponer un umbral de cobertura global arbitrario en un proyecto que recién se inicializa.

## 17. Calidad automatizada en Git

Preparar Husky y lint-staged si el proyecto Git está correctamente inicializado.

Objetivo del pre-commit:

- ESLint en archivos aplicables.
- Prettier en archivos modificados.

Evitar ejecutar toda la suite de Playwright en cada commit.

Si el directorio todavía no es un repositorio Git, dejar lista la configuración documentada sin modificar el repositorio padre ni inicializar Git silenciosamente.

Opcionalmente configurar un flujo básico de GitHub Actions que ejecute `npm ci`, lint, formato, typecheck, tests unitarios y build con Node 24.20.0.

No añadir desplegues automáticos ni credenciales.

## 18. Archivos de configuración esperados

Como mínimo, dejar preparados los que correspondan realmente a las herramientas seleccionadas:

- `package.json`
- `package-lock.json`
- `.nvmrc`
- `.npmrc`
- `.gitignore`
- `.editorconfig`
- `.prettierrc.json`
- `.prettierignore`
- `eslint.config.mjs`
- `tsconfig.json`
- `next.config.ts` o `.mts`
- `postcss.config.mjs`
- `components.json`
- `vitest.config.ts` o equivalente
- `playwright.config.ts`
- `.env.example`
- `README.md`

No duplicar archivos de configuración generados por las herramientas.

## 19. Documentación de arquitectura

Crear:

`docs/frontend-foundation.md`

Debe explicar:

1. Versiones instaladas y compatibilidad TypeScript 7 / Next.js 16.4.
2. Arquitectura y estructura de carpetas.
3. Reglas de separación de responsabilidades.
4. Política de gestión de estados.
5. Reglas de ESLint y límites de líneas.
6. Componentes reutilizables disponibles.
7. Estrategia de diseño y temas.
8. Estrategia de consumo seguro de Fastify.
9. Gestión de fechas y zona horaria Lima.
10. Pruebas y comandos disponibles.
11. Limitaciones del cascarón.
12. Próximos pasos para las historias de usuario.

Actualizar el README con instrucciones sencillas para:

- Activar Node con NVM.
- Instalar dependencias.
- Levantar en desarrollo.
- Ejecutar lint.
- Ejecutar typecheck.
- Ejecutar tests.
- Ejecutar build.

## 20. Verificaciones obligatorias

Una vez implementado, ejecutar:

1. `node -v`
2. `npm -v`
3. `npm ci`
4. `npm run lint`
5. `npm run format:check`
6. `npm run typecheck`
7. `npm run test`
8. `npm run build`
9. `npm run test:e2e`, cuando Chromium esté disponible.

También comprobar que el servidor arranca en el puerto 3001 y responde correctamente.

No dejar el servidor ejecutándose indefinidamente después de la comprobación.

Corregir los errores encontrados dentro del alcance de esta tarea.

No declarar éxito si algún paso relevante falla. Documentar cualquier verificación bloqueada por limitaciones del entorno.

## 21. Restricciones definitivas

NO modificar:

- `../no-show-predictive-app-be/`
- `../depi-noshow-ml/`
- PostgreSQL
- MySQL
- Las migraciones
- El ETL
- Los modelos Random Forest y XGBoost
- La configuración de Scalar
- Los documentos de la tesis externos al frontend

NO:

- Crear otra aplicación dentro del directorio actual.
- Crear un monorepo.
- Implementar todas las HU.
- Implementar un dashboard completo.
- Diseñar pantallas complejas sin necesidad.
- Crear servicios falsos que aparenten funcionar.
- Generar un SDK HTTP innecesario.
- Desactivar controles de calidad para que el build pase.
- Utilizar `--force` o `--legacy-peer-deps` para ocultar incompatibilidades sin investigar.
- Realizar commits ni push sin autorización.

## 22. Entrega esperada

Al finalizar entregar un informe conciso indicando:

- Directorio de trabajo utilizado.
- Versiones efectivas de Node, Next.js, React y TypeScript.
- Cómo se resolvió la compatibilidad con TypeScript 7.
- Librerías instaladas.
- Estructura creada.
- Componentes reutilizables implementados.
- Rutas disponibles.
- Scripts npm configurados.
- Pruebas creadas y resultados.
- Estado del build.
- URL local para abrir la aplicación.
- Advertencias pendientes.
- Recomendación del siguiente paso de desarrollo.

**Criterio principal de aceptación:** desde `no-show-predictive-app-fe/`, ejecutar `nvm use 24.20.0` y `npm run dev` debe permitir abrir una aplicación Next.js estable, con un layout básico, pantalla de bienvenida y navegación, mientras ESLint, Prettier, TypeScript y las pruebas quedan correctamente configurados para desarrollar el resto del sistema posteriormente.

No exceder el alcance: es una fundación técnica, no la implementación funcional completa del producto.
