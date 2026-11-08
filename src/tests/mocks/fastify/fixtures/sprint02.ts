import type { OperationalStatus } from '@/features/operational-optimization/api/summary.contract';
import {
  appointmentAt,
  limaInstant,
  MOCK_IDS,
  type MockReservation,
  mockRunId,
  RF,
  scoreRunId,
  XGB,
} from '@/tests/mocks/fastify/fixtures/base';

const scheduled = (id: string, clinicId: number, dayOffset: number, time: string) => ({
  id,
  clientId: `9000000000020${id.slice(-2)}`,
  clinicId,
  dayOffset,
  time,
  status: 'SCHEDULED' as const,
  availability: 'AVAILABLE_EXPLORATORY' as const,
  reasons: [],
});

const past = (id: string, clinicId: number, dayOffset: number, time: string) => ({
  ...scheduled(id, clinicId, dayOffset, time),
  status: 'PAST' as const,
});

/** Scores registrados seis días antes de la cita (anteriores a su inicio). */
const before = (dayOffset: number) => dayOffset - 6;

/** Futuras programadas: HIGH en ambos modelos, solo RF, ya habilitada y conflicto concurrente. */
function futureReservations(): MockReservation[] {
  return [
    {
      ...scheduled(MOCK_IDS.highBoth, 7, 15, '10:00'),
      scores: [
        { model: RF, probability: 0.6976, experimentalLevel: 'HIGH' },
        { model: XGB, probability: 0.9159, experimentalLevel: 'HIGH' },
      ],
    },
    {
      ...scheduled(MOCK_IDS.highRfOnly, 7, 16, '11:30'),
      scores: [
        { model: RF, probability: 0.55, experimentalLevel: 'HIGH' },
        { model: XGB, probability: 0.45, experimentalLevel: 'MEDIUM' },
      ],
    },
    {
      ...scheduled(MOCK_IDS.enabledFuture, 11, 17, '09:00'),
      scores: [
        { model: RF, probability: 0.62, experimentalLevel: 'HIGH' },
        { model: XGB, probability: 0.71, experimentalLevel: 'HIGH' },
      ],
      operational: { enabledModel: RF },
    },
    {
      ...scheduled(MOCK_IDS.raceConflict, 7, 18, '16:30'),
      scores: [
        { model: RF, probability: 0.66, experimentalLevel: 'HIGH' },
        { model: XGB, probability: 0.8, experimentalLevel: 'HIGH' },
      ],
    },
  ];
}

/** Pasadas: finalizada habilitada, ya registrada, sin habilitación (dos runs) y sin scores. */
function pastReservations(): MockReservation[] {
  return [
    {
      ...past(MOCK_IDS.pastFinished, 7, -2, '10:00'),
      scores: [
        { model: RF, probability: 0.58, experimentalLevel: 'HIGH', scoredDayOffset: before(-2) },
        { model: XGB, probability: 0.42, experimentalLevel: 'MEDIUM', scoredDayOffset: before(-2) },
      ],
      operational: { enabledModel: RF },
    },
    {
      ...past(MOCK_IDS.pastRecorded, 11, -3, '15:00'),
      scores: [
        { model: RF, probability: 0.69, experimentalLevel: 'HIGH', scoredDayOffset: before(-3) },
        { model: XGB, probability: 0.92, experimentalLevel: 'HIGH', scoredDayOffset: before(-3) },
      ],
      operational: { enabledModel: XGB, attendance: 'NO_SHOW', spaceRecovered: false },
    },
    {
      // Dos runs distintos (uno por modelo): recepción elige a cuál asociar el resultado.
      ...past(MOCK_IDS.pastNotEnabled, 7, -1, '12:00'),
      scores: [
        {
          model: RF,
          probability: 0.31,
          experimentalLevel: 'MEDIUM',
          runId: mockRunId(MOCK_IDS.pastNotEnabled, 1),
          scoredDayOffset: -8,
        },
        {
          model: XGB,
          probability: 0.27,
          experimentalLevel: 'LOW',
          runId: mockRunId(MOCK_IDS.pastNotEnabled, 2),
          scoredDayOffset: -6,
        },
      ],
    },
    {
      ...past(MOCK_IDS.pastNoScores, 7, -1, '17:00'),
      availability: 'NOT_SCORED',
      scores: [],
    },
  ];
}

/** Escenarios sintéticos de HU-06/07/08 (bandas coherentes con los umbrales sintéticos). */
export function sprint02Reservations(): MockReservation[] {
  return [...futureReservations(), ...pastReservations()];
}

/** Instantes sintéticos de la gestión semilla (siempre anteriores a «ahora»). */
export function seedInstants(reservation: MockReservation, now: Date) {
  const appointment = appointmentAt(reservation, now);
  const enabledAt = limaInstant(Math.min(reservation.dayOffset - 1, -1), '08:30', now);
  const recordedAt = new Date(new Date(appointment).getTime() + 2 * 3_600_000).toISOString();
  return { appointment, enabledAt, recordedAt };
}

/** Resumen operativo derivado de la semilla (fixtures de componentes, sin estado mutable). */
export function seedOperationalStatus(reservation: MockReservation, now: Date): OperationalStatus {
  const seed = reservation.operational ?? {};
  const { enabledAt, recordedAt } = seedInstants(reservation, now);
  const enabledScore = reservation.scores.find((score) => score.model === seed.enabledModel);
  return {
    overbooking: enabledScore
      ? {
          enabled: true,
          status: 'ENABLED',
          statusLabel: 'Habilitado para sobreasignación',
          authorizationId: `7${reservation.id.slice(-4)}`,
          enabledAt,
          modelKey: enabledScore.model.key,
          predictionRunId: scoreRunId(reservation.id, enabledScore),
        }
      : {
          enabled: false,
          status: 'NOT_ENABLED',
          statusLabel: 'No habilitado',
          authorizationId: null,
          enabledAt: null,
          modelKey: null,
          predictionRunId: null,
        },
    attendanceOutcome: {
      recorded: seed.attendance !== undefined,
      attendanceStatus: seed.attendance ?? null,
      recordedAt: seed.attendance ? recordedAt : null,
    },
    spaceRecoveryOutcome: {
      recorded: seed.spaceRecovered !== undefined,
      spaceRecovered: seed.spaceRecovered ?? null,
      recordedAt: seed.spaceRecovered !== undefined ? recordedAt : null,
    },
  };
}
