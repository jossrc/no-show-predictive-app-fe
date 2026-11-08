# Sprint 02 · Matriz de aceptación del frontend

Resultados **reales** del 04-11-2026 (Node 24.20.0, Chromium de Playwright, `FRONTEND_DATA_MODE=mock`).
Ninguna prueba usó el backend real ni ejecutó POST reales. **LIVE no verificado**: el backend
`feature/sprint-02` no estaba en ejecución en `127.0.0.1:3000` durante esta entrega (ver §4).

## 1. Criterios de aceptación → evidencia

| Caso     | Condición verificable                                                                                    | Evidencia (archivo · prueba)                                                                                                                                                                           | Estado (mock) |
| -------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| HU06-CA1 | Detalle con `eligible=true` muestra la acción; no elegible no la muestra                                 | `components/operational-sections` «HU06-CA1…», «no elegible…»; `e2e/operational-optimization` «HU-06: no elegible sin acción…»; `unit/operational-views` «solo es habilitable…»                        | Cumplido      |
| HU06-CA2 | Confirmar envía solo `modelKey` + `predictionRunId`; 201/200 = éxito                                     | `components/operational-overbooking` «consulta la elegibilidad al abrir…»; `integration/operational-actions` «201 y 200 (replayed)…», «HU-06 rechaza…»; `integration/operational-http` «POST…»         | Cumplido      |
| HU06-CA3 | Reconsulta del detalle/listado muestra «Habilitado para sobreasignación» sin reenvío                     | `e2e/operational-optimization` «HU-06: confirma la marca y el estado persiste…» (recarga, seguimiento y detalle); `components/operational-overbooking` «/reservations muestra la marca…»               | Cumplido      |
| HU06-CA4 | La confirmación aclara que es una marca y no crea/modifica citas; solo se llama a la API de autorización | Texto exacto verificado en `components/operational-overbooking` y E2E; `integration/operational-http` (ruta y cuerpo exactos)                                                                          | Cumplido      |
| HU07-CA1 | ATTENDED/NO_SHOW solo si `registration.registrable`                                                      | `components/operational-outcomes` «antes de que termine la cita…», «sin preselección…»; `unit/operational-views` «sin registro y no registrable…»; E2E «HU-07…» (cita futura bloqueada)                | Cumplido      |
| HU07-CA2 | `predictionRunId` permitido y asociación visible                                                         | `components/operational-outcomes` «con varias predicciones registrables exige elegir…»; `unit/operational-views` «las opciones de run provienen exclusivamente…»; «Estimación asociada» en el registro | Cumplido      |
| HU07-CA3 | Comparaciones persistidas por modelo, sin mezclar bandas y umbral                                        | `components/operational-outcomes` «registrado: comparación por modelo, umbral provisional…»; `unit/operational-views` «usa las comparaciones guardadas…»; E2E «HU-07…»                                 | Cumplido      |
| HU07-CA4 | Resultado visible tras recarga; sin editar ni sobrescribir                                               | E2E «HU-07…» (`page.reload()` sin formulario); prueba de componente sin botones Editar/Corregir/Eliminar; 409 `ATTENDANCE_ALREADY_RECORDED_CONFLICT` informado                                         | Cumplido      |
| HU08-CA1 | Registro solo con `preventiveAction.enabled` y `registrable=true`                                        | `unit/operational-views` «sin habilitación HU-06…»; `components/operational-sections` «HU06-CA3…» (formulario visible)                                                                                 | Cumplido      |
| HU08-CA2 | Sí/No envían `true`/`false` y siguen visibles tras recargar                                              | `components/operational-outcomes` «"Sí se recuperó"/"No se recuperó" envía el booleano…»; `integration/operational-http` (`toStrictEqual({spaceRecovered:false})`); E2E «HU-08…»                       | Cumplido      |
| HU08-CA3 | Sin HU-06 el control no se habilita y explica el motivo                                                  | `components/operational-outcomes` «sin habilitación HU-06…»; E2E «HU-08…» (reserva `…1015`)                                                                                                            | Cumplido      |
| HU08-CA4 | La consulta posterior mantiene el resultado (sin reporte HU-13)                                          | E2E «HU-08…» (vista «Espacios recuperados»); `components/operational-sections` «espacios recuperados: false es "No recuperado"…»                                                                       | Cumplido      |

Transversales: HU-08 sin HU-07 (E2E «HU-08: independiente de HU-07…», componente «carga ambos
estados solo al abrir y registra HU-08 sin HU-07»); `null` vs `false` (`unit/operational-contracts`,
`unit/operational-views`); doble clic (`components/operational-overbooking` «bloquea el doble
clic…»); 409 con relectura (componentes y `integration/operational-actions`); timeout sin
reintento (`components/operational-outcomes` «timeout…»); sin jerga técnica en producción (E2E
«estructura de la Figura 17…»); teclado, móvil 390 px y tema oscuro (E2E «móvil y tema oscuro…»).

## 2. Comandos ejecutados

| Comando                 | Resultado                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`          | OK (0 errores, 0 advertencias)                                                                                                                                          |
| `npm run format:check`  | OK                                                                                                                                                                      |
| `npm run typecheck`     | OK                                                                                                                                                                      |
| `npm test`              | **28 archivos, 288 pruebas aprobadas** (línea base Sprint 01: 18 archivos, 188)                                                                                         |
| `npm run build`         | OK (ver nota)                                                                                                                                                           |
| `npm run test:e2e`      | **24 pruebas aprobadas**: 17 de Sprint 01 + 7 nuevas (`operational-optimization.spec.ts`)                                                                               |
| `npm run test:coverage` | Total: 90,37 % líneas · 88,85 % sentencias · 82,92 % ramas · 87,54 % funciones. `features/operational-optimization`: 96,30 % líneas · 86,75 % ramas · 95,69 % funciones |

Pruebas nuevas (100): `unit/operational-contracts` 7, `unit/operational-query` 7,
`unit/operational-views` 10, `unit/mock-operational` 6, `integration/operational-http` 17,
`integration/operational-actions` 17, `components/operational-overbooking` 9,
`components/operational-outcomes` 12, `components/operational-sections` 11,
`components/operational-filters` 4; E2E `operational-optimization.spec.ts` 7.

Pruebas de Sprint 01 ajustadas por cambios intencionales (3 aserciones): la navegación ahora
tiene 2 enlaces (`components/layout`, `e2e/reservations-list`) y el aviso de almacén no disponible
menciona la gestión operativa (`components/reservations-list`). Ninguna otra prueba de Sprint 01
cambió.

**Nota del entorno.** Next.js 16.4.0 instalado imprime un aviso de vulnerabilidad conocida y, la
primera vez, detiene `next build`/`next dev` pidiendo repetir el comando (`SecurityFatalError`).
Al repetirlo, el build y las pruebas terminaron correctamente. No se actualizó Next.js (el encargo
lo prohíbe sin necesidad demostrable); queda como decisión del propietario.

## 3. Capturas (mock, `APP_ENV=production`)

- [Escritorio 1440 px](screenshots/operational-desktop.png)
- [Móvil 390 px (tarjetas)](screenshots/operational-mobile.png)
- [Diálogo de confirmación, tema oscuro](screenshots/operational-dialog-dark.png)

## 4. Pendientes reales

- Verificación LIVE (solo lecturas) contra el backend `feature/sprint-02` con datos sintéticos o
  reales: no realizada en esta entrega (backend no disponible localmente).
- Revisión de usabilidad con supervisor/recepción y validación del texto de confirmación.
- Login/RBAC (HU-21/HU-22): el backend registra `INTERNAL_SERVICE`; la interfaz no identifica a la
  persona.
- Observaciones por horario: requieren un campo/endpoint en el backend.
