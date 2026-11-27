import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttendancePanel } from '@/features/operational-optimization/components/AttendancePanel';
import { OutcomesDialog } from '@/features/operational-optimization/components/OutcomesDialog';
import { RecoveryPanel } from '@/features/operational-optimization/components/RecoveryPanel';
import { toPredictionRunOptions } from '@/features/operational-optimization/model/runs';
import {
  attendanceFixture,
  httpError,
  MOCK_IDS,
  ok,
  recoveryFixture,
  riskFixture,
} from '@/tests/support/fixtures';
import { renderWithQuery } from '@/tests/support/render';

const actions = vi.hoisted(() => ({
  loadOverbookingStateAction: vi.fn(),
  enableOverbookingAction: vi.fn(),
  loadOutcomeStatesAction: vi.fn(),
  recordAttendanceAction: vi.fn(),
  recordSpaceRecoveryAction: vi.fn(),
}));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('@/features/operational-optimization/api/operational.actions', () => actions);
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const runsOf = (id: string) => toPredictionRunOptions(riskFixture(id).models);
const written = (data: Record<string, unknown>, status = 201) =>
  ok({ created: status === 201, replayed: status === 200, ...data }, status);

function attendance(id: string) {
  return renderWithQuery(
    <AttendancePanel reservationId={id} state={attendanceFixture(id)} runs={runsOf(id)} />,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('HU-07 · ¿Asistió?', () => {
  it('antes de que termine la cita no hay formulario activo', () => {
    attendance(MOCK_IDS.highBoth);
    expect(screen.getByText('La cita aún no ha comenzado')).toBeVisible();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar resultado' })).not.toBeInTheDocument();
  });

  it('sin preselección; confirma y envía el estado con el run permitido', async () => {
    const user = userEvent.setup();
    actions.recordAttendanceAction.mockResolvedValue(written({ attendanceStatus: 'NO_SHOW' }));
    attendance(MOCK_IDS.pastFinished);
    expect(screen.getByRole('radio', { name: 'Sí asistió' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'No asistió' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Registrar resultado' })).toBeDisabled();
    expect(screen.getByText(/Random Forest 58.00 % · XGBoost 42.00 %/)).toBeVisible();

    await user.click(screen.getByRole('radio', { name: 'No asistió' }));
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }));
    expect(screen.getByRole('group', { name: '¿Registrar «No asistió»?' })).toBeVisible();
    expect(screen.getByText(/no podrá modificarse ni eliminarse/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Confirmar registro' })).toHaveFocus();
    expect(actions.recordAttendanceAction).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirmar registro' }));
    expect(actions.recordAttendanceAction).toHaveBeenCalledWith(MOCK_IDS.pastFinished, {
      attendanceStatus: 'NO_SHOW',
      predictionRunId: attendanceFixture(MOCK_IDS.pastFinished).registration
        .availablePredictionRunIds[0],
    });
    expect(await screen.findByText('Resultado registrado')).toBeVisible();
  });

  it('con varias predicciones registrables exige elegir a cuál asociar', async () => {
    const user = userEvent.setup();
    actions.recordAttendanceAction.mockResolvedValue(written({ attendanceStatus: 'ATTENDED' }));
    attendance(MOCK_IDS.pastNotEnabled);
    await user.click(screen.getByRole('radio', { name: 'Sí asistió' }));
    expect(screen.getByRole('button', { name: 'Registrar resultado' })).toBeDisabled();
    const runs = attendanceFixture(MOCK_IDS.pastNotEnabled).registration.availablePredictionRunIds;
    expect(runs).toHaveLength(2);
    await user.click(screen.getByRole('radio', { name: /XGBoost 27.00 %/ }));
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar registro' }));
    expect(actions.recordAttendanceAction).toHaveBeenCalledWith(MOCK_IDS.pastNotEnabled, {
      attendanceStatus: 'ATTENDED',
      predictionRunId: runs[1],
    });
  });

  it('registrado: comparación por modelo, umbral provisional y aviso, sin edición', () => {
    attendance(MOCK_IDS.pastRecorded);
    expect(screen.getByText('No asistió')).toBeVisible();
    const cards = screen.getAllByRole('listitem');
    expect(within(cards[0]!).getByText('Random Forest')).toBeVisible();
    expect(within(cards[0]!).getByText('Coincidió')).toBeVisible();
    expect(within(cards[1]!).getByText('XGBoost')).toBeVisible();
    expect(screen.getAllByText('Umbral provisional: 50.00 %')).toHaveLength(2);
    expect(screen.getByText(/distinto de las bandas Alto, Medio y Bajo/)).toBeVisible();
    expect(screen.getByText(/no es evaluación científica final/)).toBeVisible();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar|Corregir|Eliminar/ })).toBeNull();
  });

  it('409 por registro previo: informa sin códigos y permite releer el estado', async () => {
    const user = userEvent.setup();
    actions.recordAttendanceAction.mockResolvedValue(
      httpError(409, 'ATTENDANCE_ALREADY_RECORDED_CONFLICT'),
    );
    attendance(MOCK_IDS.pastFinished);
    await user.click(screen.getByRole('radio', { name: 'Sí asistió' }));
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar registro' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('La asistencia ya estaba registrada');
    expect(alert).not.toHaveTextContent(/ATTENDANCE_|409/);
    await user.click(screen.getByRole('button', { name: 'Actualizar estado' }));
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(actions.recordAttendanceAction).toHaveBeenCalledTimes(1);
  });

  it('timeout: no afirma éxito ni fallo y no reintenta solo', async () => {
    const user = userEvent.setup();
    actions.recordAttendanceAction.mockRejectedValue(new Error('fetch failed'));
    attendance(MOCK_IDS.pastFinished);
    await user.click(screen.getByRole('radio', { name: 'Sí asistió' }));
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar registro' }));
    expect(await screen.findByText(/No podemos confirmar si se guardó/)).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(actions.recordAttendanceAction).toHaveBeenCalledTimes(1);
  });
});

describe('HU-08 · ¿Espacio recuperado?', () => {
  it('sin habilitación HU-06 no ofrece el control y explica el motivo', () => {
    renderWithQuery(
      <RecoveryPanel
        reservationId={MOCK_IDS.pastNotEnabled}
        state={recoveryFixture(MOCK_IDS.pastNotEnabled)}
      />,
    );
    expect(
      screen.getByText('Primero debe habilitarse el horario para sobreasignación.'),
    ).toBeVisible();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it.each([
    ['Sí se recuperó', true],
    ['No se recuperó', false],
  ])('«%s» envía el booleano JSON %s tras confirmar', async (label, value) => {
    const user = userEvent.setup();
    actions.recordSpaceRecoveryAction.mockResolvedValue(written({ spaceRecovered: value }));
    renderWithQuery(
      <RecoveryPanel
        reservationId={MOCK_IDS.enabledFuture}
        state={recoveryFixture(MOCK_IDS.enabledFuture)}
      />,
    );
    await user.click(screen.getByRole('radio', { name: label }));
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar registro' }));
    expect(actions.recordSpaceRecoveryAction).toHaveBeenCalledWith(MOCK_IDS.enabledFuture, {
      spaceRecovered: value,
    });
    expect(await screen.findByText('Resultado registrado')).toBeVisible();
  });

  it('false registrado se muestra como «No recuperado», nunca «Sin registro»', () => {
    renderWithQuery(
      <RecoveryPanel
        reservationId={MOCK_IDS.pastRecorded}
        state={recoveryFixture(MOCK_IDS.pastRecorded)}
      />,
    );
    expect(screen.getByText('No recuperado')).toBeVisible();
    expect(screen.queryByText('Sin registro')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});

describe('Seguimiento · «Registrar resultados»', () => {
  it('carga ambos estados solo al abrir y registra HU-08 sin HU-07', async () => {
    const user = userEvent.setup();
    const id = MOCK_IDS.enabledFuture;
    actions.loadOutcomeStatesAction.mockResolvedValue({
      attendance: ok(attendanceFixture(id)),
      recovery: ok(recoveryFixture(id)),
      runs: runsOf(id),
    });
    actions.recordSpaceRecoveryAction.mockResolvedValue(written({ spaceRecovered: true }));
    renderWithQuery(<OutcomesDialog reservationId={id} context="Reserva #900000000001012" />);
    expect(actions.loadOutcomeStatesAction).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /Registrar resultados/ }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(await dialog.findByText('La cita aún no ha comenzado')).toBeVisible();
    await user.click(dialog.getByRole('radio', { name: 'Sí se recuperó' }));
    await user.click(dialog.getByRole('button', { name: 'Registrar resultado' }));
    await user.click(dialog.getByRole('button', { name: 'Confirmar registro' }));
    expect(actions.recordSpaceRecoveryAction).toHaveBeenCalledWith(id, { spaceRecovered: true });
    await waitFor(() => expect(actions.loadOutcomeStatesAction).toHaveBeenCalledTimes(2));
  });

  it('un fallo parcial no oculta el otro registro', async () => {
    const user = userEvent.setup();
    const id = MOCK_IDS.pastRecorded;
    actions.loadOutcomeStatesAction.mockResolvedValue({
      attendance: httpError(503, 'PERSISTENCE_UNAVAILABLE'),
      recovery: ok(recoveryFixture(id)),
      runs: [],
    });
    renderWithQuery(<OutcomesDialog reservationId={id} context="Reserva #900000000001014" />);
    await user.click(screen.getByRole('button', { name: /Registrar resultados/ }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'Gestión operativa no disponible por ahora',
    );
    expect(dialog.getByText('No recuperado')).toBeVisible();
  });
});
