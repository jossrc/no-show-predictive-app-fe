# Sprint 02 · Implementación frontend (HU-06, HU-07, HU-08)

Épica 3 «Soporte a Optimización Operativa» (13 SP). Rama `feature/sprint-02`, basada en `main`
`494f501`. Backend de referencia (solo lectura): `no-show-predictive-app-web` rama
`feature/sprint-02`, revisión `90dc600` (verificada contra `origin`, sin cambios posteriores).
Fecha: 04-11-2026.

> **Numeración.** README y documentos de Sprint 01 usan un catálogo antiguo (HU-05 = factores,
> HU-06 = historial). Aquí rige la tesis vigente: HU-04 factores, HU-05 historial, **HU-06
> sobreasignación, HU-07 asistencia, HU-08 recuperación**. No se renombraron componentes de
> Sprint 01; sus comentarios conservan la numeración histórica.

## 1. Pantallas y rutas

| Ruta                                | Contenido                                                                                                                                                                                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/operational-optimization` (nueva) | «Optimización operativa» (Figura 17): filtros, bloque **Reservas con alto riesgo** y bloque **Seguimiento operativo** con tres vistas persistidas (Horarios habilitados · Asistencia registrada · Espacios recuperados).                                                                |
| `/reservations/[reservationId]`     | Nueva sección **Gestión operativa** (Sobreasignación · ¿Asistió? · ¿Espacio recuperado?) tras «Estimación de inasistencia», con `Suspense` propio. Insignia «Habilitado para sobreasignación» junto al estado de la reserva. Estimación, factores e historial de Sprint 01 sin cambios. |
| `/reservations`                     | Insignia «Habilitado para sobreasignación» en filas/tarjetas con `overbooking.enabled=true`. Contrato y comportamiento de Sprint 01 intactos.                                                                                                                                           |

Navegación superior: «Reservas» y «Optimización operativa» («Optimización» en pantallas angostas,
con nombre accesible completo). Sin login, menú de usuario ni perfiles.

### Estado en la URL (`/operational-optimization`)

`from`, `to` (fecha de **cita**, calendario de Lima, máx. 92 días), `clinicId`, `status`
(estado de la reserva en la agenda; solo bloque de alto riesgo), `modelKey`, `limit`,
`riskCursor`/`riskPrev` (paginación del bloque de alto riesgo), `view`
(`authorizations` | `attendance` | `recovery`) y `trackCursor`/`trackPrev` (paginación del
seguimiento). Cada bloque pagina por separado; cambiar de vista reinicia solo su cursor; aplicar
filtros descarta ambos. Período inicial: 7 días previos + próximas 3 semanas (28 días), para
registrar resultados recientes y revisar candidatas futuras. Valores inválidos se reemplazan con
aviso «Ajustamos algunos filtros». El regreso desde el detalle («Volver a optimización operativa»)
conserva todos los parámetros (lista blanca de rutas en `resolveBackHref`).

## 2. Arquitectura y archivos

```text
src/app/(workspace)/operational-optimization/{page,loading,error}.tsx
src/features/operational-optimization/
  api/        summary · records · overbooking · attendance · recovery (.contract.ts, Zod)
              operational.server.ts (server-only, 9 endpoints) · operational.actions.ts ('use server')
  model/      query · urls · labels · overbooking-view · outcome-view · runs · high-risk-view
              tracking-view · errors · diagnostics
  components/ OperationalFilters · OperationalBlock · HighRiskResults · TrackingTabs
              TrackingResults · tracking-columns · ResponsiveRecords · BlockParts
              OverbookingDialog · EnableOverbookingForm · OverbookingStateViews · OverbookingMarkBadge
              OperationalDetailSection · AttendancePanel · AttendanceForm · AttendanceRecord
              RecoveryPanel · OutcomesDialog · ConfirmStep · ChoiceGroup · WriteResultMessage
              use-operational-write · OperationalSkeletons
  validation/ filters-schema.ts
src/lib/routes.ts   rutas del espacio de trabajo (reservas / optimización operativa)
```

Modificados (aditivos): `reservations/api/contract.ts` (campos `overbooking`,
`attendanceOutcome`, `spaceRecoveryOutcome`), `row-view.ts`, `ReservationsTable`,
`ReservationsCardList`, `ReservationDetailHeader`, `ListNotices` (aviso cuando el almacén no
responde), `CursorPagination` (nombre accesible y sustantivo configurables, valores por defecto
iguales), `list-url.ts` (`resolveBackHref` acepta la pantalla operativa; `backLinkLabel`),
`labels.ts` (`formatAppointmentContext`), `navigation.ts`/`MainNavigation.tsx`,
`lib/api/timeouts.ts` (`operationalWrite: 15 s`), `lib/errors/error-catalog.ts` (10 códigos
operativos) y el detalle `reservations/[reservationId]/page.tsx`.

Convenciones respetadas: Server Components por defecto; `fastifyRequest` como único transporte
servidor-servidor con `cache:'no-store'`; `x-api-key` solo en el servidor; Server Actions con
validación Zod antes de contactar a Fastify; `refresh()` tras éxito o conflicto; IDs como `string`
(nunca `Number`); fechas UTC presentadas en Lima (`lib/dates`); componentes `shadcn` existentes
(`Dialog`, `Button`, `NativeSelect`, `Table`, `Skeleton`) y compartidos (`PageHeader`,
`SectionCard`, `Notice`, `EmptyState`, `ApiErrorNotice`, `RefreshButton`, `CursorPagination`). Sin
dependencias nuevas.

## 3. Contratos consumidos (todos con prefijo `/api/v1`)

| HU  | Método | Ruta                                                        | Uso en el frontend                                                              |
| --- | ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 06  | GET    | `/reservations/{id}/overbooking-authorization`              | Detalle (SSR) y al abrir el diálogo de habilitación (Server Action de lectura). |
| 06  | POST   | `/reservations/{id}/overbooking-authorizations`             | Confirmación del diálogo: `{modelKey, predictionRunId}` del candidato elegido.  |
| 06  | GET    | `/overbooking-authorizations`                               | Seguimiento · «Horarios habilitados».                                           |
| 07  | GET    | `/reservations/{id}/attendance-outcome`                     | Detalle y diálogo «Registrar resultados».                                       |
| 07  | POST   | `/reservations/{id}/attendance-outcomes`                    | `{attendanceStatus, predictionRunId}` tras confirmación.                        |
| 07  | GET    | `/attendance-outcomes`                                      | Seguimiento · «Asistencia registrada» (con comparación por modelo).             |
| 08  | GET    | `/reservations/{id}/space-recovery-outcome`                 | Detalle y diálogo «Registrar resultados».                                       |
| 08  | POST   | `/reservations/{id}/space-recovery-outcomes`                | `{spaceRecovered: true\|false}` (booleano JSON) tras confirmación.              |
| 08  | GET    | `/space-recovery-outcomes`                                  | Seguimiento · «Espacios recuperados».                                           |
| 01  | GET    | `/reservations` (`experimentalRiskLevel=HIGH` + `modelKey`) | Bloque «Reservas con alto riesgo» (solo scores persistidos).                    |
| 01  | GET    | `/reservations/{id}`, `/reservations/{id}/risk`             | Resúmenes aditivos; descripción de los runs para HU-07.                         |

Los Zod se derivaron de `OperationalHttpSchemas.ts`, `OperationalStatusHttp.ts` y los schemas de
ruta de `feature/sprint-02` (no de la tabla abreviada). Los listados operativos nunca reciben
`status` ni `modelKey` (el querystring del backend es `additionalProperties:false`).
Desajustes detectados con la documentación del backend: **ninguno** en rutas ni campos. Nota:
el handoff menciona `ReasonSchema.code` como enum; el frontend lo valida como `string` (igual que
los motivos de Sprint 01) y muestra el `message` en español que entrega el backend.

## 4. Flujos

**HU-06.** El bloque de alto riesgo lista reservas con banda experimental Alta del modelo elegido
(RF o XGBoost, nunca combinados; `riskLevel` operativo sigue `null`). «Gestión» distingue
`Habilitado para sobreasignación` / `No habilitado` / `Estado de gestión no disponible`
(`overbooking=null`). El botón solo aparece con `overbooking.enabled=false`; al abrirlo se
consulta el GET de elegibilidad (un botón visible no implica elegibilidad). El diálogo muestra los
motivos del backend si no es elegible; si hay candidatos, permite elegir modelo (se preselecciona
el modelo consultado solo si es elegible; con uno, ese) y exige confirmación con el texto «Se
marcará este horario para evaluación posterior por Call Center. No se creará una nueva cita ni se
modificará la agenda principal.» más la advertencia de banda experimental. En el detalle, la
acción aparece solo si `eligibility.eligible=true` con candidato elegible. Tras 201/200 se relee
el estado y la ruta; el diálogo permanece abierto con el resultado aunque la fila cambie.

**HU-07.** Formulario solo con `registration.registrable=true` (y runs disponibles). Radios
«Sí asistió / No asistió» sin preselección; run asociado = único de
`availablePredictionRunIds` o elección explícita (descrita con los scores de `GET …/risk`, sin
UUID visibles). Confirmación en línea («no podrá modificarse ni eliminarse»). Bloqueos con
mensaje propio (`APPOINTMENT_NOT_STARTED`, `…_IN_PROGRESS`, `…_END_UNKNOWN`,
`RESERVATION_CANCELLED`, `PREDICTION_REQUIRED`, `ALREADY_RECORDED`). Registrado: resultado,
fecha, estimación asociada y una tarjeta por modelo con estimación, predicción, observado y
«Coincidió/No coincidió» **tal como lo guarda el backend**, umbral provisional visible y
`comparisonNotice` siempre presente.

**HU-08.** Formulario solo con `recorded=false && registrable && preventiveAction.enabled`.
Sin HU-06: «Primero debe habilitarse el horario para sobreasignación.» «Sí se recuperó / No se
recuperó» sin preselección, con confirmación; envía `true`/`false`. `false` ⇒ «No recuperado»,
`null` ⇒ «Sin registro». No depende ni se infiere de HU-07.

**Seguimiento.** Tres listados persistidos con una sola lectura por página (sin N+1, sin
emparejar páginas de listados distintos). «Registrar resultados» abre un diálogo que consulta los
estados HU-07/HU-08 de esa reserva **solo al abrirse**.

**Escrituras.** Doble clic bloqueado (`useOperationalWrite`, referencia `inFlight` + transición);
sin reintentos automáticos; 201 y 200 `replayed` son éxito; los 409 de cambio de estado y los
timeouts disparan una relectura (GET/`refresh()`), nunca otro POST; ante timeout o fallo de red se
muestra «No podemos confirmar si se guardó. Actualiza el estado antes de volver a intentarlo.».

## 5. Diferencias justificadas respecto al prototipo (Figura 17)

| Wireframe                                       | Implementación                                                                                                                       | Motivo                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Columna «Observaciones»                         | Omitida                                                                                                                              | El backend no tiene campo ni endpoint que la persista.                                                  |
| Nombre de cliente, ordinal de cita, pago previo | Solo `#clientId`, reserva, sede y fecha                                                                                              | La API no los provee; no se inventan.                                                                   |
| «Estado» (ambiguo)                              | Filtro «Estado de la reserva» (Programadas/Canceladas) del bloque de alto riesgo; columnas separadas para estado de agenda y gestión | Los listados operativos no admiten `status`; se distingue `reservationStatus` de la marca y resultados. |
| ¿Asistió? / ¿Espacio recuperado? por fila       | Botón «Registrar resultados» por horario habilitado + vistas «Asistencia registrada» y «Espacios recuperados»                        | Mostrar ambos estados por fila exigiría 2 GET por fila (N+1) o cruzar páginas no alineadas.             |
| Selector de modelo                              | Añadido                                                                                                                              | `HIGH` depende de un `modelKey` explícito.                                                              |
| Estilo gris, menú hamburguesa                   | Lenguaje visual vigente (cabecera superior, violeta, tarjetas, claro/oscuro)                                                         | Instrucción del encargo.                                                                                |

Sin botones de editar, deshabilitar, eliminar o corregir: los registros son inmutables.

## 6. Errores

Catálogo ampliado: `OVERBOOKING_NOT_ELIGIBLE`, `OVERBOOKING_ALREADY_ENABLED_CONFLICT`,
`PREDICTION_RESERVATION_MISMATCH`, `ATTENDANCE_ALREADY_RECORDED_CONFLICT`,
`APPOINTMENT_NOT_FINISHED`, `RESERVATION_CANCELLED`, `PREDICTION_REQUIRED`,
`PREDICTION_AFTER_APPOINTMENT`, `PREVENTIVE_ACTION_REQUIRED`,
`SPACE_RECOVERY_ALREADY_RECORDED_CONFLICT`. `PERSISTENCE_UNAVAILABLE` se presenta como «Gestión
operativa no disponible por ahora» en esta funcionalidad. 422 de listados con acción propia («Ir a
la primera página», «Quitar filtro de sede»). Cada bloque falla de forma localizada; un error nunca
se convierte en lista vacía. Códigos, estado HTTP, `requestId`, versiones de regla y runs solo se
ven en el diagnóstico de `APP_ENV=development`.

## 7. Configuración y ejecución

Sin variables nuevas. Mock (datos sintéticos, POST en memoria del proceso):

```sh
APP_ENV=development FRONTEND_DATA_MODE=mock npm run dev   # http://127.0.0.1:3001/operational-optimization
```

Reservas sintéticas útiles (mock): `900000000001010` (RF y XGB Alto, elegible),
`…1011` (solo RF Alto), `…1012` (ya habilitada, cita futura: HU-08 sí, HU-07 no),
`…1016` (simula 409 por habilitación concurrente), `…1013` (pasada habilitada: HU-07 y HU-08),
`…1014` (pasada con «No asistió» y «No recuperado»), `…1015` (pasada sin HU-06, dos runs),
`…1017` (pasada sin estimación), `…1009` (503 parcial). Las futuras están a partir del día 15 para
no alterar el listado inicial de `/reservations` de Sprint 01.

LIVE seguro (solo `127.0.0.1`, bloqueado en producción): backend `feature/sprint-02` en el puerto
3000 y `.env.local` como en el README. Las vistas solo hacen GET; los POST requieren confirmación
explícita y **persisten en PostgreSQL de la app**: no ejecutarlos sobre reservas reales sin una
decisión consciente (usar la base sintética del handoff del backend, §9).
