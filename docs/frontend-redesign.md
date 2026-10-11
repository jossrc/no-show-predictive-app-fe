# Rediseño UX/UI y modos de presentación

Rediseño visual de las pantallas existentes (listado, detalle, estimación, factores e historial)
sin cambiar contratos HTTP, endpoints ni la integración servidor-servidor. Fecha: 11-10-2026.

## 1. APP_ENV, NODE_ENV y FRONTEND_DATA_MODE

| Variable             | Controla                        | Valores                                    |
| -------------------- | ------------------------------- | ------------------------------------------ |
| `APP_ENV`            | Solo la presentación            | `development` · `production` (por defecto) |
| `NODE_ENV`           | Runtime de Next.js (no se toca) | Lo fija `next dev` / `next build`          |
| `FRONTEND_DATA_MODE` | Origen de datos                 | `live` · `mock`                            |

- Resolución centralizada en `src/lib/config/presentation.ts` (`getPresentationConfig()`,
  server-only). Diagnóstico habilitado solo si `APP_ENV=development` **y** `NODE_ENV` no es
  `production`. Un valor ausente o inválido se comporta como `production`.
- Los componentes de servidor usan `DevelopmentDiagnostics` (decide en el servidor: en producción
  no se envía nada técnico al navegador). Los componentes cliente reciben la decisión ya resuelta
  mediante `PresentationProvider` (`ClientDiagnostics`); no existe store global.
- `APP_ENV` no modifica `getServerConfig()`: LIVE sigue rechazado con `NODE_ENV=production`, el
  servidor sigue limitado a loopback (`src/proxy.ts`) y la credencial sigue siendo server-only.
- El indicador de Next.js y las devtools de TanStack Query solo aparecen con `APP_ENV=development`.

**Habilitar el diagnóstico**: `APP_ENV=development` en `.env.local` y `npm run dev`. Aparecen la
etiqueta «Desarrollo», el botón «Diagnóstico» (entorno, origen de datos y Health ML) y un icono
discreto en cada sección (historia de usuario, endpoint, estado HTTP, `requestId`, códigos,
motivos, snapshot, versión de modelo, validación y política de riesgo). Todo queda oculto hasta
que se abre el panel.

**Previsualizar la interfaz de producción en local**: `APP_ENV=production` y
`FRONTEND_DATA_MODE=live` con `npm run dev`. Next.js sigue en modo desarrollo y limitado a
`127.0.0.1`: es una vista previa, no un despliegue apto para exposición pública.

## 2. Decisiones de diseño

- **Identidad**: violeta `#8B5CF6` (`--brand`: foco, navegación activa, marca), con `--primary`
  `#7C4DEB` del mismo tono para botones y enlaces (contraste AA 5.1:1 con texto blanco; `#8B5CF6`
  da 4.2:1). Fondo `#F8FAFB`, superficies blancas, texto `#1F2834`, naranja `#FF9E43` solo como
  detalle de la marca y de la etiqueta «Desarrollo». Tokens semánticos en `globals.css`
  (incluidos `success` y `warning`), modo oscuro equivalente. Ningún color representa riesgo.
- **Tipografía**: Inter variable con eje óptico (`next/font/google`, autoalojada en build); los
  títulos grandes usan el corte Display. Cifras tabulares en fechas, IDs y porcentajes.
- **Componentes**: primitivas shadcn ajustadas (controles de 40 px, radios 10/12 px, sombras
  mínimas). Se eliminaron el footer académico, el indicador «ML disponible», el gráfico SHAP
  (Recharts y `ui/chart` desinstalados), `geist`, `ReasonList`, `RequestIdNote`,
  `AvailabilityBadge` y `ModelVersionNote`.
- **Listado**: filtros principales (Desde, Hasta, Estado, Sede) + «Más filtros» (orden,
  dirección, modelo, tamaño) con contador de filtros activos. Tabla Reserva · Fecha y hora ·
  Cliente (≥ xl) · Sede · Estado · Estimación · «Ver detalle» (una sola acción por fila); tarjetas
  en móvil (1 columna) y tablet (2 columnas). Avisos priorizados sin duplicados (`listNotices`) y
  una única nota experimental cuando hay estimaciones.
- **Detalle**: encabezado con estado, fecha larga en Lima y sede; «Información de la cita» sin
  repetir el encabezado; estimaciones RF/XGBoost independientes con la advertencia científica
  junto al resultado; `NOT_SCORABLE` como bloque compacto sin acciones; «Calcular estimación» solo
  cuando el backend lo permite. Factores en tabla con la unidad del modelo (probabilidad o
  log-odds) y notas metodológicas desplegables.
- **Historial**: pestañas «Al reservar» / «Información actual», tres indicadores, total y fechas
  como datos secundarios, y aclaraciones agrupadas en «Cómo se calcula esta información».
- **Errores**: catálogo reescrito en lenguaje claro (`lib/errors/error-catalog.ts`); los códigos
  se conservan en `ApiError` y se consultan con «Ver diagnóstico técnico» en desarrollo.

## 3. Pruebas

| Comando                | Resultado                                                   |
| ---------------------- | ----------------------------------------------------------- |
| `npm run lint`         | Sin errores ni advertencias                                 |
| `npm run format:check` | OK                                                          |
| `npm run typecheck`    | OK                                                          |
| `npm run test`         | 17 archivos, 173 pruebas aprobadas                          |
| `npm run build`        | OK                                                          |
| `npm run test:e2e`     | 16 pruebas aprobadas (Chromium, mock, `APP_ENV=production`) |

Nuevas pruebas: `unit/presentation-config.test.ts` (modos, valores inválidos, `NODE_ENV`, origen
de datos, LIVE en producción, sin credenciales) y `components/diagnostics.test.tsx` (sin jerga
técnica en vistas normales, diagnóstico solo en desarrollo). Revisión visual manual con datos
LIVE (solo lecturas) en ambos modos, tema claro/oscuro y 390/820/1100/1440 px.
