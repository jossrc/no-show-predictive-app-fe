# Fundación del frontend

## Versiones y compatibilidad

Aplicación generada directamente en `no-show-predictive-app-fe/` con `create-next-app@16.4.0`, App Router, `src/`, TypeScript, Tailwind y ESLint. Se conservaron `PROMPT_BASE.md` y el repositorio Git existente. No se modificaron los proyectos vecinos.

| Herramienta                  | Versión                  |
| ---------------------------- | ------------------------ |
| Node / npm                   | 24.20.0 / 12.0.2         |
| Next.js / React / React DOM  | 16.4.0 / 19.3.0 / 19.3.0 |
| Compilador nativo TypeScript | 7.0.2                    |
| API auxiliar TypeScript      | 6.0.2                    |
| Tailwind / PostCSS           | 4.3.3 / 8.5.29           |
| shadcn CLI / Radix UI        | 4.21.4 / 1.7.0           |
| ESLint / Prettier            | 9.39.5 / 3.9.10          |
| Vitest / Playwright          | 5.0.3 / 1.64.0           |

`package.json` fija las versiones directas y `package-lock.json` las transitivas. `.npmrc` aplica `save-exact`, `engine-strict` y lockfile. `.nvmrc` permite seleccionar Node sin cambiar el alias global. npm 12 restringe scripts de instalación de dependencias por defecto; no se habilitan indiscriminadamente.

TypeScript 7 no ofrece la API JavaScript anterior. Se usa la [coexistencia oficial de Microsoft](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-60): `@typescript/native` es el alias exacto de `typescript@7.0.2`; `typescript` es el alias exacto de `@typescript/typescript6@6.0.2`. El ejecutable `tsc` pertenece al nativo 7 y `tsc6` al auxiliar. ESLint y las herramientas que importan `typescript` reciben la API auxiliar.

La inspección de `next/dist/lib/typescript/runTypeScriptCli.js` y `verify-typescript-setup.js` en la versión instalada confirma que `experimental.useTypeScriptCli` está soportado y resuelve el binario del paquete llamado `typescript`. Con los alias oficiales invoca `tsc6`. `npm run typecheck` ejecuta `next typegen && tsc --noEmit`; `npm run build` ejecuta `next build && tsc --noEmit`. Así se comprueban también con TS 7 los tipos generados por Next. El comando termina con error si cualquiera de los dos pasos falla. No se modifica Next ni se usa `ignoreBuildErrors`.

ESLint 10.12.0 es más reciente, pero los peers de `eslint-plugin-react` y `eslint-plugin-jsx-a11y` usados por Next admiten ESLint 9, no 10. Se conserva la versión estable compatible 9.39.5, aunque npm advierte sobre su soporte. Reconsiderar al actualizar la configuración oficial de Next. No se utilizaron `--force` ni `--legacy-peer-deps`.

Turbopack se mantiene como bundler por defecto. Se usa la integración PostCSS oficial de Tailwind 4 en lugar del loader del template, con un único `postcss.config.mjs`. Cache Components, React Compiler y feedback de agentes no se habilitaron: este cascarón no los necesita. La única opción experimental explícita es la integración del CLI de TypeScript.

## Estructura y responsabilidades

```text
src/
  app/
    (workspace)/          # layout, inicio y rutas mínimas
      reservations/
      reports/
      models/
      settings/
    layout.tsx           # HTML, metadata y proveedores
    globals.css
    loading.tsx
    not-found.tsx
  components/
    ui/                  # 21 componentes del registro shadcn
    layout/              # shell, sidebar, header y controles
    shared/              # carga, vacío, error y módulo en preparación
  lib/
    config/server.ts     # configuración solo servidor, validada con Zod
    dates/lima.ts        # instantes UTC y presentación en Lima
    utils.ts             # re-export del cn oficial
  providers/             # composición de tema, URL, Query y tooltip
  tests/
    unit/
    components/
    e2e/
    setup/
docs/
```

Solo se crearon carpetas con archivos reales. No se incluyen `features/` ni `types/` vacíos. Al implementar negocio, agregar `features/reservations`, `reservation-risk`, `client-history`, `prediction-models`, `reports` o `dashboard` según necesidad. DTO y adaptadores deben vivir junto a su funcionalidad, con infraestructura compartida en `lib/` cuando exista un uso real.

`app/` se ocupa de rutas y composición. `components/` contiene presentación genérica. La lógica de negocio irá en funcionalidades; no habrá un `services/` global. React Server Components son el valor por defecto. Solo proveedores y controles interactivos usan `use client`. La página inicial es síncrona y puede probarse con RTL; futuros Server Components async se comprobarán mediante E2E.

## Estado

| Estado             | Herramienta y criterio                                               |
| ------------------ | -------------------------------------------------------------------- |
| Local              | `useState` o `useReducer` para una interacción o componente          |
| URL                | nuqs para búsqueda, filtros, orden y períodos conservados al navegar |
| Servidor           | TanStack Query para caché y consultas cuando exista integración      |
| Cliente compartido | Zustand solo ante una necesidad concreta entre páginas/componentes   |
| Tema               | next-themes, inicializado con preferencia del sistema                |

`AppProviders` compone `ThemeProvider`, `NuqsAdapter`, `QueryProvider`, `TooltipProvider` y Sonner. El QueryClient se crea por instancia de proveedor, sin caché global del servidor. Los devtools solo aparecen en desarrollo. No hay stores vacíos, Redux ni duplicación de respuestas HTTP en Zustand. No se persisten datos de clientes o credenciales; next-themes solo conserva la preferencia visual.

## Calidad

ESLint Flat Config incluye Next Core Web Vitals, TypeScript, imports ordenados, imports de tipos explícitos y rechazo de `any`. Las reglas se ejecutan con `eslint`, no `next lint`.

| Ámbito                                      | Límite efectivo |
| ------------------------------------------- | --------------- |
| Archivos propios en `src/`                  | 300 líneas      |
| Componentes de layout, shared y proveedores | 200 líneas      |
| Páginas `page.tsx`                          | 120 líneas      |
| Funciones                                   | 70 líneas       |
| Complejidad / profundidad                   | 12 / 3          |

Los límites de líneas omiten comentarios y líneas vacías. Los 21 componentes generados de `components/ui/` conservan su estructura upstream y quedan exentos de tamaño/complejidad; siguen sujetos a controles de tipos, Next, formato e imports. Las configuraciones y declaraciones generadas tienen exclusiones acotadas. No se exceptúa todo `src/`.

Prettier usa 2 espacios, comillas simples, punto y coma, 100 columnas y LF; ordena clases con el plugin de Tailwind. `PROMPT_BASE.md` se conserva intacto y queda excluido del formateo. `.editorconfig` y VS Code ayudan a mantener estas convenciones. Husky ejecuta ESLint y Prettier sobre archivos staged; no lanza E2E. La CI usa Node de `.nvmrc`, instalación reproducible y `npm run check`.

## Diseño y componentes

CLI oficial [shadcn 4](https://ui.shadcn.com/docs/cli), preset `nova`, base explícita `radix`, familia `radix-nova`, Lucide y tokens CSS. `cn` lo instala el CLI y se re-exporta desde `lib/utils.ts`; no se agregan `clsx` ni `tailwind-merge` alternativos.

Componentes disponibles: Button, Card, Badge, Separator, Skeleton, Alert, Input, Label, Textarea, Select, Dialog, Sheet, Dropdown Menu, Tooltip, Tabs, Table, Checkbox, Popover, Calendar, Sonner y NativeSelect. Calendar mantiene sus dependencias oficiales. Chart y Recharts se retiraron en el rediseño: la interfaz no usa gráficos.

La dirección visual es sobria: verde salvia, fondos cálidos, bordes suaves y tipografía del sistema. No se descargan fuentes externas durante build. Tema claro/oscuro con next-themes y supresión de hydration limitada al HTML que cambia de clase. Sidebar de escritorio y Sheet accesible en móvil, ruta activa con `aria-current`, botón de tema con `aria-pressed`, enlace de salto al contenido, iconos decorativos ocultos a lectores y foco visible. La preferencia inicial puede seguir al sistema; el botón alterna claro/oscuro.

Componentes propios reutilizables: AppShell, AppSidebar, AppHeader, MobileNavigation, ThemeToggle, EmptyState, LoadingState, ErrorState y ModulePlaceholder. Un error de renderizado del workspace ofrece reintentar sin mostrar detalles internos. Las rutas de negocio son placeholders; la página inicial muestra “Frontend preparado”. No se presentan reportes ni datos inventados.

## Integración segura con Fastify

No hay llamadas HTTP. `lib/config/server.ts` importa `server-only`, lee únicamente las tres variables documentadas y valida de forma perezosa con Zod. El modo `demo` identifica esta fase; no genera datos. El modo `live` aún no conecta servicios. El cascarón no necesita API Key.

Próxima integración: cliente HTTP exclusivamente de servidor, URL base validada, `x-api-key` leído del entorno privado y autorización de usuario antes de exponer datos. Aún debe definirse esa autorización. No agregar un proxy público genérico, credenciales `NEXT_PUBLIC_`, autenticación ficticia ni almacenamiento de secretos en navegador. `.env*` queda ignorado excepto `.env.example`.

Contrastar OpenAPI/contratos del backend antes de crear DTO. Validar respuestas externas con Zod; adaptar DTO a modelos de presentación en su funcionalidad. Tratar errores de transporte, contrato y negocio de forma consistente sin exponer respuestas internas. Usar Query solo para consultas cliente que lo necesiten, con claves y errores acordes al contrato. MSW 2 está instalado; definir handlers únicamente cuando exista ese contrato, sin servicios simulados en producción.

Puntos futuros: reservas y detalle, riesgo, generación de predicción, factores, historial de cliente, modelos y salud ML en los endpoints `/api/v1/` descritos por `PROMPT_BASE.md`. No se implementa un SDK anticipado. Las exportaciones PDF/Excel se incorporarán en `features/reports` después de definir datos, formato y autorización; no hay bibliotecas de exportación instaladas.

## Fechas y política predictiva

`formatLimaDateTime` usa `Intl` con `es-PE` y `America/Lima`; `getLimaDateKey` usa `date-fns-tz` para obtener el día local. Se aceptan Date o timestamps con `Z`/offset explícito y se rechazan fechas ambiguas e inválidas. El instante UTC original no se modifica. `date-fns` y `date-fns-tz` están preparados para necesidades futuras; no se ajustan manualmente horas al timestamp guardado.

Reglas obligatorias para futuras pantallas:

- `NOT_SCORABLE`: la evidencia admitida actualmente no permite evaluar la reserva.
- `NOT_SCORED`: ausencia de puntuación.
- `riskLevel=null`: no hay clasificación disponible.
- `EXPLORATORY_NOT_VALIDATED`: predicción exploratoria.
- `operationalUseAllowed=false`: impide presentarla como decisión operativa validada.
- No inventar probabilidades, definir umbrales LOW/MEDIUM/HIGH ni convertir tasas históricas en probabilidades predictivas.
- Mantener separados datos de demostración y datos reales.

No se modifican ML, ETL, bases de datos ni proyectos vecinos.

## Pruebas y verificaciones

Vitest + RTL + jest-dom + user-event + jsdom; alias `@/` configurado en Vitest. Pruebas de bienvenida y enlace a reservas; shell, navegación semántica y ruta activa; tema interactivo con teclado y proveedor real; cinco comprobaciones de fechas UTC/Lima. La cobertura se limita al código propio inicial y no impone un porcentaje arbitrario.

Playwright usa Chromium y `http://127.0.0.1:3001`. Gestiona un servidor de desarrollo sin reutilizar procesos existentes: bienvenida, cambio de tema y ausencia de errores JavaScript; navegación de todas las rutas y 404; menú móvil, cierre tras navegación y ausencia de desbordamiento horizontal. Guarda capturas en `test-results/`, excluido de Git. El puerto debe estar libre; no se dejan servidores activos tras la prueba.

Los comandos de instalación, desarrollo, calidad y pruebas están en el README. `npm test` termina sin watch; `check` no es recursivo. Las verificaciones finales y advertencias se registran debajo una vez ejecutadas.

## Alcance y siguientes pasos

Esta entrega contiene infraestructura y navegación ejecutable. No contiene autenticación, CRUD, filtros de negocio, tablas de reservas, dashboard, predicciones, SHAP, formularios operativos ni exportaciones.

Primera historia recomendada: listado de reservas. Antes de implementarla, revisar el contrato real, definir autorización servidor-servidor, DTO validado, adaptación de presentación y manejo de indisponibilidad. Después agregar filtros en URL y consultas según necesidad. Mantener los límites de archivos y la semántica de ML desde la primera integración.

## Resultados de la verificación local

Comprobación realizada con Node **24.20.0**, npm **12.0.2** y `tsc --version` **7.0.2**:

| Verificación            | Resultado                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- |
| `npm ci`                | Correcta; lockfile reproducible                                              |
| `npm run lint`          | Correcta, sin warnings de ESLint                                             |
| `npm run format:check`  | Correcta                                                                     |
| `npm run typecheck`     | Correcta, compilador nativo 7.0.2                                            |
| `npm run test`          | 4 archivos, 8 pruebas aprobadas                                              |
| `npm run test:coverage` | Correcta; informes HTML y LCOV disponibles                                   |
| `npm run build`         | Correcta; cinco rutas y 404 prerenderizados, chequeo TS 7 posterior correcto |
| `npm run test:e2e`      | 3 pruebas Chromium aprobadas                                                 |
| `npm run start` en 3001 | Cinco rutas con HTTP 200 y contenido esperado; servidor detenido             |
| Husky                   | Activo en este repositorio, `core.hooksPath=.husky/_`                        |
| `npm audit --omit=dev`  | 0 vulnerabilidades reportadas                                                |

El primer build dentro del sandbox falló porque Turbopack necesita abrir un puerto interno para evaluar PostCSS. Esa falla quedó persistida en su caché y afectó el primer reintento con permisos ampliados. Se apartó la salida generada en una carpeta temporal y el build limpio con permisos ampliados pasó. No se cambió el bundler ni se omitieron controles. En este entorno, build y pruebas de navegador requieren permiso para abrir puertos locales.

Las capturas de escritorio y móvil se inspeccionaron. Playwright terminó su servidor; la aplicación se inicia nuevamente con `npm run dev`.

Advertencias pendientes: la auditoría completa reporta **9 hallazgos de severidad alta**, exclusivamente en dependencias de desarrollo, originados por [braces y patrones profundamente anidados](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). La versión publicada sigue siendo 3.0.3 y no existe una actualización compatible reportada por npm. Las propuestas automáticas degradan shadcn o la configuración Next, por lo que no se aplicaron. Revisar las actualizaciones upstream antes de ampliar o publicar el proyecto. ESLint 9 tiene advertencia de soporte, pero ESLint 10 aún contradice los peers de los plugins oficiales usados. npm 12 bloqueó scripts de instalación auxiliares de fsevents, MSW y unrs-resolver; los controles y el build pasan sin habilitarlos. No se inicializó un worker MSW porque aún no hay servicios que simular.

La comprobación conjunta final `npm run check` también terminó correctamente: lint, formato, typecheck, las ocho pruebas y build. La verificación de producción confirmó HTTP 200 y el contenido esperado en las cinco rutas con el puerto 3001. Se detuvo el servidor al terminar. El workflow de GitHub Actions quedó preparado; no se ejecutó en GitHub ni se hicieron commits o push. Next.js generó `AGENTS.md` al iniciar desarrollo y se conserva para orientar el trabajo posterior.
