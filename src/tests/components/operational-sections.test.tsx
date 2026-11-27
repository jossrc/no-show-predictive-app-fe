import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HighRiskResults } from '@/features/operational-optimization/components/HighRiskResults';
import { OperationalDetailSection } from '@/features/operational-optimization/components/OperationalDetailSection';
import { TrackingResults } from '@/features/operational-optimization/components/TrackingResults';
import { parseOperationalParams } from '@/features/operational-optimization/model/query';
import {
  attendanceFixture,
  httpError,
  listFixture,
  MOCK_IDS,
  ok,
  overbookingFixture,
  recoveryFixture,
  riskFixture,
} from '@/tests/support/fixtures';
import { renderWithQuery } from '@/tests/support/render';

const server = vi.hoisted(() => ({
  getOverbookingState: vi.fn(),
  getAttendanceState: vi.fn(),
  getSpaceRecoveryState: vi.fn(),
  listOverbookingAuthorizations: vi.fn(),
  listAttendanceOutcomes: vi.fn(),
  listSpaceRecoveryOutcomes: vi.fn(),
  listReservations: vi.fn(),
}));
vi.mock('@/features/operational-optimization/api/operational.server', () => server);
vi.mock('@/features/reservations/api/reservations.server', () => ({
  listReservations: server.listReservations,
}));
vi.mock('@/features/operational-optimization/api/operational.actions', () => ({}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

async function detail(id: string) {
  server.getOverbookingState.mockResolvedValue(ok(overbookingFixture(id)));
  server.getAttendanceState.mockResolvedValue(ok(attendanceFixture(id)));
  server.getSpaceRecoveryState.mockResolvedValue(ok(recoveryFixture(id)));
  renderWithQuery(
    await OperationalDetailSection({
      reservationId: id,
      context: `Reserva #${id}`,
      risk: ok(riskFixture(id)),
    }),
  );
  return within(screen.getByRole('region', { name: 'Gestión operativa' }));
}

const query = (raw: Record<string, string> = {}) => parseOperationalParams(raw, '2026-10-11').query;
const page = <T,>(data: T[], nextCursor: string | null = null) => ({
  data,
  pagination: { limit: 25, nextCursor },
  period: {
    from: '2026-10-04',
    to: '2026-10-31',
    timeZone: 'America/Lima',
    startInclusive: '2026-10-04T05:00:00.000Z',
    endExclusive: '2026-11-01T05:00:00.000Z',
  },
  requestId: 'req-list',
});

beforeEach(() => vi.clearAllMocks());

describe('Detalle · Gestión operativa (HU-06/07/08)', () => {
  it('HU06-CA1: con eligible=true muestra la acción de habilitar', async () => {
    const section = await detail(MOCK_IDS.highBoth);
    expect(section.getByRole('button', { name: /Habilitar para sobreasignación/ })).toBeVisible();
    expect(section.getByText(/Random Forest · 69.76 % · XGBoost · 91.59 %/)).toBeVisible();
  });

  it('no elegible (banda Media/Baja): sin acción y con el motivo del backend', async () => {
    const section = await detail(MOCK_IDS.availableBoth);
    expect(section.queryByRole('button', { name: /Habilitar/ })).not.toBeInTheDocument();
    expect(section.getByText('Este horario no se puede habilitar')).toBeVisible();
  });

  it('HU06-CA3: ya habilitado muestra el estado actualizado y HU-08 disponible', async () => {
    const section = await detail(MOCK_IDS.enabledFuture);
    expect(section.getByText('Habilitado para sobreasignación')).toBeVisible();
    expect(section.queryByRole('button', { name: /Habilitar/ })).not.toBeInTheDocument();
    expect(section.getByRole('radio', { name: 'Sí se recuperó' })).toBeVisible();
    expect(section.getByText('La cita aún no ha comenzado')).toBeVisible();
  });

  it('un GET operativo fallido no oculta los otros bloques', async () => {
    server.getOverbookingState.mockResolvedValue(httpError(503, 'PERSISTENCE_UNAVAILABLE'));
    server.getAttendanceState.mockResolvedValue(ok(attendanceFixture(MOCK_IDS.pastRecorded)));
    server.getSpaceRecoveryState.mockResolvedValue(ok(recoveryFixture(MOCK_IDS.pastRecorded)));
    renderWithQuery(
      await OperationalDetailSection({
        reservationId: MOCK_IDS.pastRecorded,
        context: 'Reserva',
        risk: httpError(503, 'PERSISTENCE_UNAVAILABLE'),
      }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Gestión operativa no disponible por ahora',
    );
    expect(screen.getByText('No asistió')).toBeVisible();
    expect(screen.getByText('No recuperado')).toBeVisible();
  });
});

describe('Optimización operativa · Reservas con alto riesgo', () => {
  it('solo pide la banda HIGH del modelo elegido y ofrece la acción sin marca previa', async () => {
    server.listReservations.mockResolvedValue(
      ok(
        listFixture([MOCK_IDS.highBoth, MOCK_IDS.enabledFuture], { experimentalRiskPolicy: null }),
      ),
    );
    renderWithQuery(await HighRiskResults({ query: query({ modelKey: 'xgboost_full_v1' }) }));
    expect(server.listReservations).toHaveBeenCalledWith(
      expect.objectContaining({ experimentalRiskLevel: 'HIGH', modelKey: 'xgboost_full_v1' }),
    );
    const table = within(screen.getByRole('table'));
    const enabledRow = within(table.getByText('#900000000001012').closest('tr')!);
    expect(enabledRow.getByText('Habilitado para sobreasignación')).toBeVisible();
    expect(enabledRow.queryByRole('button', { name: /Habilitar/ })).not.toBeInTheDocument();
    const newRow = within(table.getByText('#900000000001010').closest('tr')!);
    expect(newRow.getByText('No habilitado')).toBeVisible();
    expect(newRow.getByRole('button', { name: /Habilitar para sobreasignación/ })).toBeVisible();
    expect(
      newRow.getByRole('link', { name: 'Ver detalle de Reserva #900000000001010' }),
    ).toHaveAttribute('href', expect.stringContaining('back=%2Foperational-optimization'));
    expect(screen.getByText(/experimental y provisional/)).toBeVisible();
  });

  it('vacío explícito y error localizado (nunca una lista vacía falsa)', async () => {
    server.listReservations.mockResolvedValue(ok(listFixture([])));
    const { unmount } = renderWithQuery(await HighRiskResults({ query: query() }));
    expect(screen.getByText('No hay reservas con banda Alta')).toBeVisible();
    unmount();
    server.listReservations.mockResolvedValue(httpError(422, 'UNKNOWN_CLINIC'));
    renderWithQuery(await HighRiskResults({ query: query({ clinicId: '999' }) }));
    expect(screen.getByRole('alert')).toHaveTextContent('No encontramos esa sede');
    expect(screen.getByRole('link', { name: 'Quitar filtro de sede' })).not.toHaveAttribute(
      'href',
      expect.stringContaining('clinicId'),
    );
  });

  it('con overbooking null no ofrece la acción ni dice «No habilitado»', async () => {
    const list = listFixture([MOCK_IDS.highBoth], { predictiveStoreAvailable: false });
    list.data[0] = { ...list.data[0]!, overbooking: null };
    server.listReservations.mockResolvedValue(ok(list));
    renderWithQuery(await HighRiskResults({ query: query() }));
    expect(screen.getAllByText('Estado de gestión no disponible').length).toBeGreaterThan(0);
    expect(screen.queryByText('No habilitado')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Habilitar/ })).not.toBeInTheDocument();
  });
});

describe('Optimización operativa · Seguimiento', () => {
  it('habilitaciones persistidas con «Registrar resultados» y paginación propia', async () => {
    const authorization = overbookingFixture(MOCK_IDS.pastRecorded).authorization!;
    server.listOverbookingAuthorizations.mockResolvedValue(ok(page([authorization], 'next-1')));
    renderWithQuery(await TrackingResults({ query: query({ riskCursor: 'r1' }) }));
    expect(server.listOverbookingAuthorizations).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: expect.anything() }),
    );
    expect(server.listAttendanceOutcomes).not.toHaveBeenCalled();
    const row = within(
      within(screen.getByRole('table')).getByText('#900000000001014').closest('tr')!,
    );
    expect(row.getByText('Alto · XGBoost 92.00 %')).toBeVisible();
    expect(row.getByRole('button', { name: /Registrar resultados/ })).toBeVisible();
    const next = screen.getByRole('navigation', { name: 'Paginación de horarios habilitados' });
    expect(within(next).getByRole('link', { name: 'Siguiente' })).toHaveAttribute(
      'href',
      expect.stringMatching(/riskCursor=r1.*trackCursor=next-1/),
    );
    expect(screen.getByText('1 registro en esta página')).toBeVisible();
  });

  it('asistencia registrada: resultado y coincidencia por modelo con aviso', async () => {
    server.listAttendanceOutcomes.mockResolvedValue(
      ok(page([attendanceFixture(MOCK_IDS.pastRecorded).outcome!])),
    );
    renderWithQuery(await TrackingResults({ query: query({ view: 'attendance' }) }));
    const row = within(
      within(screen.getByRole('table')).getByText('#900000000001014').closest('tr')!,
    );
    expect(row.getByText('No asistió')).toBeVisible();
    expect(row.getByText('Random Forest: Coincidió')).toBeVisible();
    expect(row.getByText('XGBoost: Coincidió')).toBeVisible();
    expect(screen.getByText(/Umbral técnico provisional/)).toBeVisible();
  });

  it('espacios recuperados: false es «No recuperado»; error 422 con acción propia', async () => {
    server.listSpaceRecoveryOutcomes.mockResolvedValue(
      ok(page([recoveryFixture(MOCK_IDS.pastRecorded).outcome!])),
    );
    const { unmount } = renderWithQuery(
      await TrackingResults({ query: query({ view: 'recovery' }) }),
    );
    expect(screen.getAllByText('No recuperado').length).toBeGreaterThan(0);
    unmount();
    server.listSpaceRecoveryOutcomes.mockResolvedValue(httpError(422, 'INVALID_CURSOR'));
    renderWithQuery(
      await TrackingResults({ query: query({ view: 'recovery', trackCursor: 'x' }) }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Esta página ya no está disponible');
    expect(screen.getByRole('link', { name: 'Ir a la primera página' })).not.toHaveAttribute(
      'href',
      expect.stringContaining('trackCursor'),
    );
  });

  it('sin registros muestra un vacío explícito', async () => {
    server.listAttendanceOutcomes.mockResolvedValue(ok(page([])));
    renderWithQuery(await TrackingResults({ query: query({ view: 'attendance' }) }));
    expect(screen.getByText('Sin registros')).toBeVisible();
  });
});
