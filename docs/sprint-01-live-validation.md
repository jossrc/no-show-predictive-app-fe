# Sprint 01: visualización de predicciones reales

Verificación realizada el 12 de octubre de 2026 en `main`, con el frontend en
`http://127.0.0.1:3001`, `FRONTEND_DATA_MODE=live` y el backend local existente.
La primera consulta fue `GET /api/v1/reservations/1281790/risk` (HTTP 200).

## Resultado LIVE

| Comprobación           | Resultado observado                                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reserva `1281790`      | `AVAILABLE_EXPLORATORY`; RF **47.68 % / Alto (exploratorio)** y XGBoost **40.60 % / Medio (exploratorio)** visibles en navegador.                                 |
| Riesgo operativo       | `riskLevel=null`, `operationalClassificationUnavailable=true`, `operationalUseAllowed=false`. Las bandas no sustituyen estos campos.                              |
| SHAP Random Forest     | Cinco factores consultados explícitamente, con dirección, contribución y descripción; unidad de probabilidad.                                                     |
| SHAP XGBoost           | Cinco factores consultados explícitamente; unidad log-odds, sin convertirla a porcentaje ni compararla con RF. Edad marcada como dato sensible.                   |
| Cambio de modelo       | Oculta la explicación anterior y espera que se pulse «Ver factores». Los selectores no solicitan explicaciones automáticamente.                                   |
| Reserva `883973`       | `NOT_SCORABLE`, sin scores, sin snapshot elegible ni acción de cálculo. Muestra los dos motivos reales del backend.                                               |
| Listado del 02/11/2026 | Primera y segunda página de 10 reservas; navegación Siguiente/Anterior y regreso sin cursor. Fechas y tamaño de página visibles.                                  |
| Filtro RF/HIGH         | `experimentalRiskLevel=HIGH`, RF y `sort=experimentalRisk`: devuelve `1281790`, con ambos scores y bandas.                                                        |
| Filtro XGBoost/MEDIUM  | Modelo XGBoost, banda MEDIUM y orden experimental: devuelve `1281790`; destaca primero su score de 40.60 %.                                                       |
| Historial de `1281790` | «Al reservar» e «Información actual» cargan: 4 asistencias, 1 posible inasistencia, tasa histórica 20 %.                                                          |
| Errores LIVE           | Cursor inválido ofrece volver a primera página; sede 999 ofrece quitar filtro; reserva inexistente presenta su vista de no encontrado.                            |
| Móvil                  | Detalle y factores RF a 390 × 844, sin desbordamiento horizontal.                                                                                                 |
| JavaScript             | Sin errores de ejecución en los recorridos LIVE.                                                                                                                  |
| Persistencia           | Comparación por GET antes/después: los resultados completos de ambos modelos permanecen iguales, incluidos scores, bandas, fechas e identificadores de ejecución. |

Motivos reales de `883973`:

- «La cita fue reprogramada y no existe instantánea original de la reserva».
- «Los servicios programados provienen de la réplica actual sin evidencia temporal de la reserva».

Principales contribuciones de `1281790`, redondeadas solo para visualización.
Random Forest, en escala de probabilidad:

| Factor                         | Contribución |
| ------------------------------ | ------------ |
| Duración programada            | −0.0784      |
| Días de anticipación           | +0.0332      |
| Indicador FWA                  | −0.0305      |
| Días desde última asistencia   | +0.0291      |
| Tasa histórica de inasistencia | +0.0268      |

XGBoost, en log-odds:

| Factor                         | Contribución |
| ------------------------------ | ------------ |
| Duración programada            | −0.9766      |
| Días de anticipación           | +0.3659      |
| Tasa histórica de inasistencia | +0.3098      |
| Edad al reservar               | +0.2705      |
| Asistencias previas            | −0.2161      |

Los modelos usan escalas distintas y no permiten comparar magnitudes entre ellos.
Los factores describen asociaciones locales, no causas demostradas ni recomendaciones.
Los scores no están calibrados ni aprobados para uso operativo; las bandas son relativas.

## Verificación automática

- `npm run check`: **PASS**. ESLint, Prettier, tipos, 188 pruebas en 18 archivos y build de producción.
  Se usaron Node 24.20.0 y npm 12.0.2. La primera compilación quedó bloqueada por permisos del
  sandbox; se apartó reversiblemente su caché de Turbopack y la ejecución con permisos ampliados
  terminó correctamente, sin cambiar la configuración del compilador.
- `npm run test:e2e`: **PASS**, 17 pruebas Chromium en 24.9 segundos, contra datos sintéticos.
- `git diff --check`: **PASS**.
- Cobertura añadida: contratos completos y compactos, scores v1 sin bandas, separación del riesgo
  operativo, motivos de exclusión, cambio de modelo sin carga automática, filtros experimentales,
  serialización y conservación de filtros al paginar.
- Las pruebas habituales usan fixtures sintéticas; las comprobaciones LIVE anteriores se ejecutaron
  por GET y mediante acciones explícitas de factores e historial en Chromium.
- No se enviaron solicitudes de predicción reales ni se hicieron cambios en Node, Python, modelos
  o PostgreSQL. No se ejecutaron predicciones masivas, commits ni pushes.

Capturas locales, no versionadas:

- [Detalle inicial de 1281790](../test-results/live-1281790-initial.png).
- [Factores Random Forest](../test-results/live-1281790-rf.png).
- [Factores XGBoost](../test-results/live-1281790-xgb.png).
- [Detalle y factores en móvil](../test-results/live-1281790-mobile.png).
- [Reserva no puntuable 883973](../test-results/live-883973.png).
- [Listado RF/HIGH](../test-results/live-list-rf-high.png).
- [Listado XGBoost/MEDIUM](../test-results/live-list-xgb-medium.png).

## Archivos modificados o añadidos

- [README.md](../README.md)
- [docs/sprint-01-live-validation.md](../docs/sprint-01-live-validation.md)
- [src/features/reservation-risk/api/experimental-risk.contract.ts](../src/features/reservation-risk/api/experimental-risk.contract.ts)
- [src/features/reservation-risk/api/factors.contract.ts](../src/features/reservation-risk/api/factors.contract.ts)
- [src/features/reservation-risk/api/risk.contract.ts](../src/features/reservation-risk/api/risk.contract.ts)
- [src/features/reservation-risk/components/FactorTable.tsx](../src/features/reservation-risk/components/FactorTable.tsx)
- [src/features/reservation-risk/components/ModelScoreCard.tsx](../src/features/reservation-risk/components/ModelScoreCard.tsx)
- [src/features/reservation-risk/components/RiskFactorsPanel.tsx](../src/features/reservation-risk/components/RiskFactorsPanel.tsx)
- [src/features/reservation-risk/components/RiskFactorsResult.tsx](../src/features/reservation-risk/components/RiskFactorsResult.tsx)
- [src/features/reservation-risk/components/RiskFactorsSection.tsx](../src/features/reservation-risk/components/RiskFactorsSection.tsx)
- [src/features/reservation-risk/components/RiskSection.tsx](../src/features/reservation-risk/components/RiskSection.tsx)
- [src/features/reservation-risk/components/ScoreList.tsx](../src/features/reservation-risk/components/ScoreList.tsx)
- [src/features/reservation-risk/model/availability.ts](../src/features/reservation-risk/model/availability.ts)
- [src/features/reservation-risk/model/diagnostics.ts](../src/features/reservation-risk/model/diagnostics.ts)
- [src/features/reservation-risk/model/factors.ts](../src/features/reservation-risk/model/factors.ts)
- [src/features/reservation-risk/model/score-view.ts](../src/features/reservation-risk/model/score-view.ts)
- [src/features/reservations/api/contract.ts](../src/features/reservations/api/contract.ts)
- [src/features/reservations/components/CursorPagination.tsx](../src/features/reservations/components/CursorPagination.tsx)
- [src/features/reservations/components/ReservationFilterFields.tsx](../src/features/reservations/components/ReservationFilterFields.tsx)
- [src/features/reservations/components/ReservationFilters.tsx](../src/features/reservations/components/ReservationFilters.tsx)
- [src/features/reservations/components/ReservationsResults.tsx](../src/features/reservations/components/ReservationsResults.tsx)
- [src/features/reservations/components/caption.ts](../src/features/reservations/components/caption.ts)
- [src/features/reservations/model/diagnostics.ts](../src/features/reservations/model/diagnostics.ts)
- [src/features/reservations/model/labels.ts](../src/features/reservations/model/labels.ts)
- [src/features/reservations/model/list-query.ts](../src/features/reservations/model/list-query.ts)
- [src/features/reservations/model/list-url.ts](../src/features/reservations/model/list-url.ts)
- [src/features/reservations/validation/filters-schema.ts](../src/features/reservations/validation/filters-schema.ts)
- [src/lib/format/percentage.ts](../src/lib/format/percentage.ts)
- [src/tests/components/reservation-filters.test.tsx](../src/tests/components/reservation-filters.test.tsx)
- [src/tests/components/reservations-list.test.tsx](../src/tests/components/reservations-list.test.tsx)
- [src/tests/components/risk-factors.test.tsx](../src/tests/components/risk-factors.test.tsx)
- [src/tests/components/risk-section.test.tsx](../src/tests/components/risk-section.test.tsx)
- [src/tests/e2e/reservation-detail.spec.ts](../src/tests/e2e/reservation-detail.spec.ts)
- [src/tests/e2e/reservations-list.spec.ts](../src/tests/e2e/reservations-list.spec.ts)
- [src/tests/integration/list-serialization.test.ts](../src/tests/integration/list-serialization.test.ts)
- [src/tests/mocks/fastify/fixtures/reservations.ts](../src/tests/mocks/fastify/fixtures/reservations.ts)
- [src/tests/mocks/fastify/fixtures/risk.ts](../src/tests/mocks/fastify/fixtures/risk.ts)
- [src/tests/mocks/fastify/list.ts](../src/tests/mocks/fastify/list.ts)
- [src/tests/support/fixtures.ts](../src/tests/support/fixtures.ts)
- [src/tests/unit/experimental-risk-contract.test.ts](../src/tests/unit/experimental-risk-contract.test.ts)
- [src/tests/unit/list-query.test.ts](../src/tests/unit/list-query.test.ts)
- [src/tests/unit/presentation.test.ts](../src/tests/unit/presentation.test.ts)
