# Agenda Predictiva · Frontend

Frontend del sistema web predictivo de inasistencias (XGBoost y Random Forest) para una empresa de
estética y cuidado personal. Sprint 01 — Core predictivo: reservas (HU-01/HU-03), probabilidad
estimada (HU-02), factores SHAP (HU-05) e historial del cliente (HU-06), integrados con el backend
Fastify desde el servidor de Next.js.

Las estimaciones son **exploratorias** (`EXPLORATORY_NOT_VALIDATED`): no hay niveles de riesgo
aprobados ni uso operativo. Detalles en [docs/frontend-sprint-01.md](docs/frontend-sprint-01.md),
[la matriz de aceptación](docs/sprint-01-frontend-acceptance.md) y
[el rediseño UX/UI y los modos de presentación](docs/frontend-redesign.md).

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
APP_ENV=development
FRONTEND_DATA_MODE=live
FASTIFY_API_BASE_URL=http://127.0.0.1:3000
FASTIFY_INTERNAL_API_KEY=<clave interna ORIGINAL de Fastify, no el hash INTERNAL_API_KEY_SHA256>
```

La clave solo se lee en el servidor de Next.js; nunca usar `NEXT_PUBLIC_`.

### Modo de presentación (`APP_ENV`)

- `APP_ENV=development`: interfaz de producto + botón «Diagnóstico» y paneles técnicos ocultos
  por defecto (historia de usuario, endpoint, estado HTTP, `requestId`, códigos, snapshot…).
- `APP_ENV=production` (o valor ausente/inválido): solo información de negocio.
- `APP_ENV` controla solo la presentación: `NODE_ENV` sigue siendo el runtime de Next.js y
  `FRONTEND_DATA_MODE` el origen de datos. Con `NODE_ENV=production` nunca hay diagnósticos y
  LIVE sigue rechazado.
- Para previsualizar la interfaz de usuarios finales en local: `APP_ENV=production` con
  `FRONTEND_DATA_MODE=live` y `npm run dev` (sigue limitado a `127.0.0.1`).

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

### Verificación contra el backend real

El recorrido LIVE de Sprint 01 está documentado en
[la verificación de reservas reales](docs/sprint-01-live-validation.md): `1281790` muestra RF
47.68 % / Alto (exploratorio), XGBoost 40.60 % / Medio (exploratorio) y factores SHAP por modelo;
`883973` conserva su estado no puntuable y explica los motivos de reprogramación.

Con Fastify en marcha, abrir `/reservations` para comprobar fechas, tamaño de página y filtros
por banda exploratoria del modelo elegido. Las bandas son relativas, sin calibración ni aprobación
operativa. «Ver factores» consulta una explicación bajo demanda. **No** pulsar «Calcular estimación»
sobre reservas reales sin decidir conscientemente sus efectos de persistencia.

## Comandos

| Comando                                   | Propósito                                              |
| ----------------------------------------- | ------------------------------------------------------ |
| `npm run dev`                             | Desarrollo en `127.0.0.1:3001`                         |
| `npm run build` / `npm run start`         | Build de producción / servidor (LIVE rechazado)        |
| `npm run lint` / `npm run lint:fix`       | ESLint                                                 |
| `npm run format` / `npm run format:check` | Prettier                                               |
| `npm run typecheck`                       | Tipos de rutas + TypeScript 7                          |
| `npm test` / `npm run test:coverage`      | Vitest (unidad, integración HTTP con MSW, componentes) |
| `npm run test:e2e`                        | Playwright (`mock`, `APP_ENV=production`)              |
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
