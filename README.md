# Agenda Predictiva · Frontend

Frontend del sistema web predictivo de inasistencias (XGBoost y Random Forest) para una empresa de
estética y cuidado personal. Sprint 01 — Core predictivo: reservas (HU-01/HU-03), probabilidad
estimada (HU-02), factores SHAP (HU-05) e historial del cliente (HU-06), integrados con el backend
Fastify desde el servidor de Next.js.

Las estimaciones son **exploratorias** (`EXPLORATORY_NOT_VALIDATED`): no hay niveles de riesgo
aprobados ni uso operativo. Detalles en [docs/frontend-sprint-01.md](docs/frontend-sprint-01.md) y
[la matriz de aceptación](docs/sprint-01-frontend-acceptance.md).

## Comenzar

Desde `no-show-predictive-app-fe/`:

```sh
. "$HOME/.nvm/nvm.sh"   # si NVM no está cargado
nvm use 24.20.0
npm ci
cp .env.example .env.local
```

Editar `.env.local` (nunca se versiona):

```dotenv
FASTIFY_API_BASE_URL=http://127.0.0.1:3000
FASTIFY_INTERNAL_API_KEY=<clave interna ORIGINAL de Fastify, no el hash INTERNAL_API_KEY_SHA256>
FRONTEND_DATA_MODE=live
```

La clave solo se lee en el servidor de Next.js; nunca usar `NEXT_PUBLIC_`.

## Levantar los servicios

1. **ML (Python, puerto 8001)** — ver `../depi-noshow-ml/docs/api_operations.md`.
2. **Backend Fastify (puerto 3000)** — en `../no-show-predictive-app-be`, con `INTERNAL_API_KEY_SHA256`
   y `ML_SERVICE_*` configurados según su README.
3. **Frontend (puerto 3001)**:

```sh
npm run dev   # http://127.0.0.1:3001 (solo loopback)
```

Sin backend la aplicación sigue cargando y muestra errores localizados. Para ver la interfaz con
datos **sintéticos de prueba** sin backend: `FRONTEND_DATA_MODE=mock npm run dev` (se indica con un
aviso en todas las pantallas).

### Restricciones del modo LIVE

No existe autenticación de usuarios (HU-21/HU-22 son posteriores). Por eso el servidor escucha solo
en `127.0.0.1`, rechaza cabeceras `Host` externas y **el modo LIVE se rechaza en producción**. No
desplegar públicamente.

### Verificación manual contra el backend real (pendiente)

Con Fastify en marcha, abrir: `/reservations` (listado y filtros), el detalle de una reserva
(riesgo esperado `NOT_SCORABLE`), el historial en ambas pestañas y «Ver explicación» (409
`EXPLANATION_SNAPSHOT_UNAVAILABLE` esperado). **No** pulsar «Solicitar predicción» sobre reservas
reales sin decidir conscientemente sus efectos de persistencia.

## Comandos

| Comando                                   | Propósito                                              |
| ----------------------------------------- | ------------------------------------------------------ |
| `npm run dev`                             | Desarrollo en `127.0.0.1:3001`                         |
| `npm run build` / `npm run start`         | Build de producción / servidor (LIVE rechazado)        |
| `npm run lint` / `npm run lint:fix`       | ESLint                                                 |
| `npm run format` / `npm run format:check` | Prettier                                               |
| `npm run typecheck`                       | Tipos de rutas + TypeScript 7                          |
| `npm test` / `npm run test:coverage`      | Vitest (unidad, integración HTTP con MSW, componentes) |
| `npm run test:e2e`                        | Playwright con backend simulado (`mock`)               |
| `npm run check`                           | Lint, formato, tipos, pruebas y build                  |

Playwright necesita el puerto 3001 libre (detener `npm run dev`) y Chromium
(`npm exec playwright install chromium`). Nunca usa datos reales ni ejecuta POST reales.

## Organización

```text
src/
  app/(workspace)/reservations/            listado, [reservationId] detalle, loading/error/not-found
  components/{layout,shared,ui}/           shell, componentes reutilizables, primitivas shadcn
  features/{reservations,reservation-risk,client-history,prediction-models}/
    api/        contratos Zod, acceso server-only y Server Actions
    model/      transformaciones puras y textos de presentación
    components/ vistas de la funcionalidad
  lib/{api,config,dates,errors,format,security}/
  proxy.ts                                 restricción a loopback
  tests/{unit,integration,components,e2e,mocks,support}/
```

Fundación técnica (versiones, TypeScript 7, reglas de calidad): [docs/frontend-foundation.md](docs/frontend-foundation.md).
