# Agenda Predictiva · Frontend

Fundación técnica del sistema predictivo de inasistencias para una empresa de estética y cuidado personal. Incluye bienvenida, navegación responsive y componentes base; las funciones de negocio se desarrollarán después.

## Comenzar

Desde `no-show-predictive-app-fe/`:

```sh
# Si NVM aún no está cargado:
. "$HOME/.nvm/nvm.sh"
nvm use 24.20.0
npm ci
npm run dev
```

Abrir [http://localhost:3001](http://localhost:3001). Para detener el servidor, usar `Ctrl+C`.

Node 24.20.0 y npm 12.0.2; Next.js 16.4.0; React/React DOM 19.3.0; TypeScript nativo 7.0.2. Las versiones directas y el lockfile están fijados. No se cambia el Node global de NVM.

No hace falta crear un `.env` para ver el cascarón. `.env.example` documenta las variables exclusivamente de servidor para una integración futura. Nunca colocar una API Key en una variable `NEXT_PUBLIC_`.

## Comandos

| Comando                                   | Propósito                                      |
| ----------------------------------------- | ---------------------------------------------- |
| `npm run dev`                             | Desarrollo con Turbopack en 3001               |
| `npm run build`                           | Build de producción y verificación nativa TS 7 |
| `npm run start`                           | Producción en 3001, tras hacer build           |
| `npm run lint` / `npm run lint:fix`       | ESLint y correcciones                          |
| `npm run format` / `npm run format:check` | Prettier y verificación                        |
| `npm run typecheck`                       | Generar tipos Next y comprobar con TS 7        |
| `npm test` / `npm run test:watch`         | Vitest sin/con watch                           |
| `npm run test:coverage`                   | Cobertura en `coverage/`                       |
| `npm run test:e2e`                        | Chromium, servidor gestionado por Playwright   |
| `npm run check`                           | Lint, formato, tipos, pruebas y build          |

Para preparar el navegador E2E:

```sh
npm exec playwright install chromium
npm run test:e2e
```

Playwright necesita el puerto 3001 libre y detiene su servidor al terminar. No consume servicios de los proyectos vecinos.

## Organización y límites

Las rutas `/`, `/reservations`, `/reports`, `/models` y `/settings` cargan con un layout común. El tema admite claro, oscuro y la preferencia inicial del sistema.

Consultar [la arquitectura, compatibilidad y verificaciones](docs/frontend-foundation.md). TypeScript 6 proporciona la API auxiliar para ESLint y el CLI interno de Next; el proyecto usa el compilador nativo 7.0.2 en `typecheck` y después del build. No hay errores de tipos ignorados.

Husky y lint-staged revisan los archivos modificados en pre-commit. `npm ci` ejecuta `prepare`; si se necesita reinstalar el hook en un clon Git, ejecutar `npm run prepare`. La configuración de CI ejecuta `npm ci` y `npm run check`, sin despliegues.

No hay autenticación, llamadas HTTP, reservas reales, predicciones, umbrales de riesgo ni exportaciones. El siguiente paso es contrastar los contratos de Fastify y definir autorización antes de integrar la primera historia de reservas.
