# Frontend Sprint 01 — Core predictivo

Implementación del frontend funcional de HU-01, HU-02, HU-03, HU-05 y HU-06 sobre la fundación
existente (Next.js 16.4, React 19.3, TypeScript 7, Tailwind 4, shadcn/ui). Fecha: 11-10-2026.

> La presentación visual (secciones 4, 5, 11 y 14) fue reemplazada por el rediseño UX/UI y el modo
> de presentación `APP_ENV`: ver [frontend-redesign.md](frontend-redesign.md). Contratos,
> integración y reglas científicas de este documento siguen vigentes.

## 1. Alcance implementado

| Incluido                                                   | Excluido (fuera de Sprint 01)                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| Listado de reservas con estado predictivo (HU-01)          | Login, usuarios, roles (HU-21/HU-22)                           |
| Probabilidad estimada y solicitud explícita (HU-02)        | CRUD, reprogramación, cancelación de reservas                  |
| Filtros, orden y paginación por cursor (HU-03)             | Campañas, notificaciones, reportería, exportaciones            |
| Factores SHAP bajo demanda (HU-05)                         | Gestión/configuración/reentrenamiento de modelos               |
| Historial del cliente en dos cortes (HU-06)                | HU-04, 07, 09, 14, 16, 19, 20 (retiradas) y sprints siguientes |
| Soporte: catálogo de modelos, salud ML, detalle de reserva | Integración directa con FLOWww desde el navegador              |

## 2. Historias de usuario

- **HU-01** `/reservations`: tabla (escritorio) o tarjetas (móvil) con ID, fecha/hora en Lima,
  clínica, estado, probabilidades persistidas por modelo y estado predictivo.
- **HU-02** detalle → «Estimación predictiva»: bloques RF/XGBoost identificados por `modelKey`,
  diferencia descriptiva y acción «Solicitar predicción» (`compare` o `single`).
- **HU-03** formulario de filtros (fechas, estado, clínica por ID, orden, dirección, modelo, tamaño).
- **HU-05** detalle → «Factores asociados a la estimación»: selector de modelo y top-K, botón
  «Ver explicación», gráfico de barras con signo + tabla textual + nota metodológica.
- **HU-06** detalle → «Historial del cliente»: pestañas «Al crear la reserva» (`booking_creation`,
  inicial) y «Conocido actualmente» (`current_known`).

## 3. Rutas reales

| Ruta                            | Tipo                      | Contenido                                             |
| ------------------------------- | ------------------------- | ----------------------------------------------------- |
| `/`                             | Redirección               | → `/reservations`                                     |
| `/reservations`                 | Server Component dinámico | Listado, filtros en la URL, Suspense por consulta     |
| `/reservations/[reservationId]` | Server Component dinámico | Detalle; `not-found.tsx` para `RESERVATION_NOT_FOUND` |

Se eliminaron `/reports`, `/models` y `/settings` (placeholders sin funcionalidad de este sprint),
junto con el sidebar y su menú móvil. La configuración técnica (ESLint, Vitest, Playwright,
Husky, CI) se conservó.

## 4. Diseño y decisiones visuales

- Modo claro inicial (`defaultTheme="light"`), oscuro disponible; fondo blanco cálido, superficies
  blancas, texto slate profundo, acento azul petróleo. Se retiró el verde oscuro dominante.
- Barra superior compacta (marca, «Reservas», indicador ML, tema) en lugar del sidebar de cinco
  módulos; contenido a `max-w-7xl` con márgenes 16/24/32 px.
- Geist Sans/Mono (paquete `geist`, fuentes locales), cifras tabulares en tablas y conteos.
- Sin KPIs globales, banners decorativos, degradados ni glassmorphism. Tarjetas solo donde agrupan
  contenido real; estados vacíos proporcionados al contenedor.
- **Sin colores de riesgo**: probabilidades en tinta neutra; los badges de estado predictivo
  distinguen disponibilidad por texto y estilo neutro. Ámbar solo para avisos (frescura,
  datos sintéticos) y rojo solo para errores.
- SHAP: par divergente teal ↔ ocre validado (CVD y contraste en claro/oscuro); se evitó rojo/verde
  para no sugerir «riesgo». Cada barra lleva además dirección textual en la tabla.

## 5. Componentes reutilizables

| Ubicación                    | Componentes                                                                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/layout`          | `AppShell`, `AppHeader`, `MainNavigation`, `ThemeToggle`, `DataModeBanner`                                                                                                                                                                                    |
| `components/shared`          | `PageHeader`, `SectionCard`, `EmptyState`, `Notice`, `ApiErrorNotice`, `ReasonList`, `RequestIdNote`, `DescriptionList`, `RefreshButton`, `ErrorState`, `LoadingState`                                                                                        |
| `features/reservations`      | `ReservationFilters` (+ `ReservationFilterFields`, `FilterField`), `ReservationsResults`, `ReservationsTable`, `ReservationsCardList`, `CursorPagination`, `ListNotices`, `ReservationStatusBadge`, `ReservationFacts`, `ReservationDetailHeader`, esqueletos |
| `features/reservation-risk`  | `RiskSection`, `ModelScoreCard`, `RiskFootnote`, `AvailabilityBadge`, `ScoreList`, `RequestPredictionPanel`, `PredictionOutcomeMessage`, `RiskFactorsSection`, `RiskFactorsPanel`, `RiskFactorsResult`, `RiskFactorsChart` (carga diferida), `FactorTable`    |
| `features/client-history`    | `ClientHistorySection`, `HistorySummary`                                                                                                                                                                                                                      |
| `features/prediction-models` | `MlServiceStatus`, `ModelVersionNote`                                                                                                                                                                                                                         |
| `components/ui`              | Primitivas shadcn; se añadió `native-select` con el CLI oficial                                                                                                                                                                                               |

Cada feature separa `api/` (contratos Zod, acceso server-only, Server Actions), `model/`
(transformaciones puras y textos) y `components/` (presentación). Los componentes no leen
variables de entorno ni hacen `fetch`.

## 6. Integración Fastify

Solo se consumen las ocho operaciones del contrato, siempre desde el servidor de Next.js:

| Operación                                     | Consumidor                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `GET /api/v1/reservations`                    | `listReservations` (Server Component)                                     |
| `GET /api/v1/reservations/:id`                | `getReservation` (Server Component)                                       |
| `GET /api/v1/reservations/:id/risk`           | `getReservationRisk` (Server Component)                                   |
| `POST /api/v1/reservations/:id/predictions`   | `requestPredictionAction` (Server Action, solo por clic) + `refresh()`    |
| `GET /api/v1/reservations/:id/risk/factors`   | `loadRiskFactorsAction` (Server Action + TanStack Query, bajo demanda)    |
| `GET /api/v1/reservations/:id/client-history` | `getClientHistory` (inicial) / `loadClientHistoryAction` (cambio de modo) |
| `GET /api/v1/ml/models`                       | `getModelCatalog` (detalle)                                               |
| `GET /api/v1/health/ml`                       | `ServiceDiagnostics` (solo con `APP_ENV=development`, sin credencial)     |

`lib/api/fastify-client.ts`: URL base del entorno, `x-api-key` solo en rutas de negocio,
`Accept`/`Content-Type` JSON, `cache: 'no-store'`, `redirect: 'error'`, `AbortSignal.timeout`
por operación (`lib/api/timeouts.ts`: 5 s health, 10 s lecturas, 15 s catálogo, 25 s SHAP, 30 s
predicción; superiores a los del backend para recibir su propio 504). `lib/api/response.ts`
interpreta cuerpos vacíos, no JSON, JSON malformado, sobres de error Fastify (`code`, `message`,
`errors`, `details.reasons`) y conserva `requestId` (cuerpo o `x-request-id`).

**Contratos**: el backend local (`../no-show-predictive-app-be`, rama
`feature/sprint-01-core-predictivo`, commit `80992c4`) coincide con `origin` en el último fetch;
no se detectaron diferencias local/remoto. Los schemas Zod se derivaron de los JSON Schemas de las
rutas (`*Schema.ts`, `RiskHttpSchemas.ts`, `ReservationHttpSchemas.ts`). Diferencias de forma
relevantes: el listado y Health no usan el sobre `{ data }`; `sourceFreshness` es opcional en el
riesgo; Health ML está en `/api/v1/health/ml` pero sin compuerta. No se pudo leer el OpenAPI vivo
(`/docs/openapi.json`) porque el backend no estaba en ejecución durante la implementación.

## 7. Gestión de credenciales servidor-servidor

- `FASTIFY_INTERNAL_API_KEY` se lee solo en `lib/config/server.ts` (`import 'server-only'`).
- No existen variables `NEXT_PUBLIC_*`; la clave no aparece en `.next/static` (verificado), ni en
  resultados devueltos a la UI (prueba automatizada), logs, URL, cookies ni almacenamiento.
- Server Actions: Next.js valida `Origin`/`Host`; cada acción valida `reservationId`
  (`^[1-9][0-9]{0,17}$`), `modelKey`, `topK`, `historicalAsOf` y el cuerpo `compare`/`single` con
  Zod antes de contactar a Fastify, y devuelve solo lo que la UI muestra.
- No hay Route Handlers ni proxy HTTP genérico.

## 8. Política de desarrollo local con datos reales

- `FRONTEND_DATA_MODE=live` (predeterminado) solo fuera de producción: en `NODE_ENV=production`
  el cliente devuelve `LIVE_DISABLED_IN_PRODUCTION` hasta que existan HU-21/HU-22.
- `npm run dev`/`start` escuchan en `127.0.0.1:3001`; `src/proxy.ts` responde 403 a cualquier
  `Host` que no sea loopback (defensa adicional ante DNS rebinding).
- `FRONTEND_DATA_MODE=mock` usa el backend simulado de `src/tests/mocks/fastify` (cargado con
  `import()` solo en ese modo), rechazado en producción y anunciado con un aviso visible en todas
  las pantallas. Sus datos son sintéticos (IDs `9000…`).

## 9. Manejo de estados

| Estado                   | Mecanismo                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Filtros, orden, página   | URL (`searchParams`), normalizados en servidor                                     |
| Carga inicial            | Server Components + `Promise.all` en el detalle                                    |
| Historial por modo, SHAP | TanStack Query (claves con `reservationId`; sin reintentos ni refetch automáticos) |
| Solicitud de predicción  | `useTransition` + bloqueo de doble envío (`useRef`)                                |
| Formulario de filtros    | React Hook Form + Zod (validación cruzada de fechas)                               |
| Tema                     | next-themes                                                                        |

No se usa Zustand (no hay estado global real) ni `nuqs`: los filtros se aplican con un formulario
y navegación, y la URL es la única fuente de verdad. El detalle se monta con `key={reservationId}`
para que una respuesta tardía no se mezcle con otra reserva.

## 10. Validación de DTO

Toda respuesta se valida con Zod (`features/*/api/*contract.ts`, `lib/api/schemas.ts`). Los IDs
BIGINT se mantienen como cadenas; `operationalUseAllowed` se exige `false`, `riskLevel` de factores
`null`, `ensembleProbability`/`selectedWinner` `null`. Una respuesta incompatible produce
`INVALID_RESPONSE`, nunca un estado vacío. Propiedades adicionales se ignoran.

## 11. Errores esperados

Catálogo centralizado en `lib/errors/error-catalog.ts` (todos los códigos de la matriz del sprint,
más `ML_NOT_CONFIGURED`, `ML_CIRCUIT_OPEN`, `ML_MODEL_UNAVAILABLE`, `ML_INFERENCE_FAILED`,
`DATABASE_ERROR` y los del frontend `NETWORK_ERROR`, `TIMEOUT`, `INVALID_RESPONSE`,
`INVALID_INPUT`, `FRONTEND_CONFIGURATION_ERROR`). Cada sección muestra su error localizado con
`requestId` y motivos técnicos plegados. Estados funcionales (`NOT_SCORABLE`,
`EXPLANATION_SNAPSHOT_UNAVAILABLE`) se presentan como avisos, no como fallos. Reintento manual solo
en errores recuperables; nunca reintento automático del POST.

## 12. Manejo de fechas

`lib/dates/lima.ts` (instantes UTC → `America/Lima`: «5 dic. 2026 · 3:30 p. m.») y
`lib/dates/calendar.ts` (fechas `YYYY-MM-DD` con aritmética UTC pura; `todayInLima`,
`addCalendarDays`, `calendarDaysBetween`). Nunca se usa `toISOString()` sobre fechas de calendario
ni la zona del navegador. Rango inicial: **hoy en Lima y los 13 días siguientes (14 días)**.
Máximo: 92 días entre `from` y `to` (igual que `ResolveListPeriod.ts`).

## 13. Paginación por cursor

`pagination.nextCursor` es opaco. La URL guarda `cursor` (página actual) y `prev` (cursores
anteriores separados por `.`); «Siguiente» solo existe con `nextCursor`, «Anterior» fuera de la
primera página y «Primera página» desde la tercera. Aplicar filtros o cambiar el tamaño descarta
el cursor. Las fechas se escriben siempre en la URL de paginación para que el período no cambie
entre páginas. `INVALID_CURSOR` ofrece volver a la primera página. No se muestran totales.

## 14. Estados predictivos

| Estado                  | Listado                                | Detalle                                                                        |
| ----------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `AVAILABLE_EXPLORATORY` | Porcentaje por modelo + «Exploratoria» | Bloques por modelo, versión, hash, fecha de evaluación, diferencia descriptiva |
| `NOT_SCORED`            | «—» + «Sin predicción»                 | Mensaje y acción explícita habilitada                                          |
| `NOT_SCORABLE`          | «—» + «No evaluable»                   | Mensaje, motivos desplegables, acción y SHAP deshabilitados                    |

Nunca se muestra `0 %` por ausencia de score; `0 %` y `100 %` solo para scores reales.

## 15. Limitaciones científicas actuales

`EXPLORATORY_NOT_VALIDATED`, `not_operationally_validated`, `operationalUseAllowed=false`,
`riskPolicyStatus=pending_validation`, `riskLevel=null`. El frontend no define umbrales, no infiere
LOW/MEDIUM/HIGH, no ofrece filtro ni orden por nivel (y no envía `riskLevel` ni `sort=riskLevel`),
no promedia modelos ni elige ganador. SHAP: RF en probabilidad, XGBoost en log-odds, sin
conversión a porcentaje ni comparación entre escalas; los factores son asociaciones locales, no
causas. La tasa histórica no es una probabilidad predictiva.

## 16. Pruebas ejecutadas

| Comando                | Resultado                                  |
| ---------------------- | ------------------------------------------ |
| `npm run lint`         | Sin errores ni advertencias                |
| `npm run format:check` | OK                                         |
| `npm run typecheck`    | OK (TypeScript 7 nativo)                   |
| `npm run test`         | 15 archivos, 139 pruebas aprobadas         |
| `npm run build`        | OK                                         |
| `npm run test:e2e`     | 16 pruebas aprobadas (Chromium, modo mock) |

Vitest: cliente HTTP con MSW (200/201/204, 400–504, JSON malformado, no JSON, red, timeout,
`requestId`, campos incompatibles, configuración, no filtración de la clave), serialización de
filtros (sin `riskLevel`), Server Actions, URL/paginación, fechas cerca de medianoche UTC,
presentación, coherencia del backend simulado con los contratos y componentes de cada HU.
Playwright: listado, filtros, cursor, errores, detalle, NOT_SCORABLE, POST, SHAP, historial,
404, teclado, tema oscuro, escritorio y móvil (capturas en `test-results/`).

Excepción de lint: `max-lines-per-function` no aplica a archivos `*.test|spec.*` (los `describe`
agrupan casos); `max-lines` y `complexity` siguen activos.

## 17. Limitaciones pendientes

- **Validación contra el backend real no ejecutada en esta sesión**: Fastify no estaba en ejecución
  y no existe `.env.local`. Ver la lista de verificación del README.
- Con datos reales, todas las reservas responden `NOT_SCORABLE` y SHAP `409
EXPLANATION_SNAPSHOT_UNAVAILABLE` (limitación conocida de evidencia temporal, no del frontend).
- En desarrollo, `notFound()` dentro de una ruta con `loading.tsx` devuelve HTTP 200 por streaming
  (la vista «Reserva no encontrada» se muestra correctamente).
- Sin catálogo de nombres de clínicas: el filtro usa el ID numérico.

## 18. Trabajo futuro fuera de Sprint 01

Autenticación y autorización (HU-21/HU-22) antes de cualquier despliegue; política de niveles de
riesgo cuando sea aprobada científicamente (el modelo de la URL y los componentes están preparados
para añadir el filtro sin rediseño); captura fechada de reservas para habilitar scores reales;
historias de los sprints 02–04.
