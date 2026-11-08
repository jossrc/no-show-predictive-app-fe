import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OverbookingDialog } from '@/features/operational-optimization/components/OverbookingDialog';
import { OverbookingMarkBadge } from '@/features/operational-optimization/components/OverbookingMarkBadge';
import { ReservationsTable } from '@/features/reservations/components/ReservationsTable';
import { toReservationRowView } from '@/features/reservations/model/row-view';
import {
  httpError,
  listItemFixture,
  MOCK_IDS,
  ok,
  overbookingFixture,
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

const ID = MOCK_IDS.highBoth;
const CONTEXT = 'Reserva #900000000001010 · 19 nov. 2026 · 10:00 a. m. · Sede #7';
const TRIGGER = `Habilitar para sobreasignación · ${CONTEXT}`;

async function openDialog(preferredModelKey?: 'random_forest_full_v1' | 'xgboost_full_v1') {
  const user = userEvent.setup();
  renderWithQuery(
    <OverbookingDialog
      reservationId={ID}
      context={CONTEXT}
      preferredModelKey={preferredModelKey}
    />,
  );
  expect(actions.loadOverbookingStateAction).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: TRIGGER }));
  const dialog = within(await screen.findByRole('dialog'));
  return { user, dialog };
}

const enabledResult = () =>
  ok({ created: true, replayed: false, enabledAt: '2026-11-04T15:00:00.000Z' }, 201);

beforeEach(() => vi.clearAllMocks());

describe('HU-06 · Habilitar para sobreasignación', () => {
  it('consulta la elegibilidad al abrir y confirma con el texto exigido', async () => {
    actions.loadOverbookingStateAction.mockResolvedValue(ok(overbookingFixture(ID)));
    actions.enableOverbookingAction.mockResolvedValue(enabledResult());
    const { user, dialog } = await openDialog();
    expect(
      await dialog.findByText(
        'Se marcará este horario para evaluación posterior por Call Center. No se creará una nueva cita ni se modificará la agenda principal.',
      ),
    ).toBeVisible();
    expect(dialog.getByText(/experimental y provisional/)).toBeVisible();
    const confirm = dialog.getByRole('button', { name: 'Confirmar habilitación' });
    expect(confirm).toBeDisabled(); // ambos modelos son elegibles: la elección es explícita
    await user.click(dialog.getByRole('radio', { name: /XGBoost · 91.59 %/ }));
    await user.click(confirm);
    const candidate = overbookingFixture(ID).eligibility.candidates[1]!;
    expect(actions.enableOverbookingAction).toHaveBeenCalledWith(ID, {
      modelKey: 'xgboost_full_v1',
      predictionRunId: candidate.predictionRunId,
    });
    expect(await dialog.findByText('Horario habilitado para sobreasignación')).toBeVisible();
    expect(actions.loadOverbookingStateAction).toHaveBeenCalledTimes(2); // relectura posterior
  });

  it('preselecciona el modelo consultado solo si el backend lo considera elegible', async () => {
    actions.loadOverbookingStateAction.mockResolvedValue(ok(overbookingFixture(ID)));
    const { dialog } = await openDialog('random_forest_full_v1');
    expect(await dialog.findByRole('radio', { name: /Random Forest/ })).toBeChecked();
    expect(dialog.getByRole('button', { name: 'Confirmar habilitación' })).toBeEnabled();
  });

  it('bloquea el doble clic mientras la petición está en curso', async () => {
    actions.loadOverbookingStateAction.mockResolvedValue(
      ok(overbookingFixture(MOCK_IDS.highRfOnly)),
    );
    let resolve: (value: unknown) => void = () => {};
    actions.enableOverbookingAction.mockReturnValue(new Promise((done) => (resolve = done)));
    const { user, dialog } = await openDialog();
    const confirm = await dialog.findByRole('button', { name: 'Confirmar habilitación' });
    await user.click(confirm);
    await user.click(confirm);
    expect(await dialog.findByRole('button', { name: /Habilitando/ })).toBeDisabled();
    expect(actions.enableOverbookingAction).toHaveBeenCalledTimes(1);
    resolve(enabledResult());
    expect(await dialog.findByText('Horario habilitado para sobreasignación')).toBeVisible();
  });

  it('no elegible: muestra los motivos del backend y ninguna acción de confirmación', async () => {
    actions.loadOverbookingStateAction.mockResolvedValue(
      ok(overbookingFixture(MOCK_IDS.availableBoth)),
    );
    const { dialog } = await openDialog();
    expect(await dialog.findByText('Este horario no se puede habilitar')).toBeVisible();
    expect(dialog.getByText(/Random Forest: La banda experimental/)).toBeVisible();
    expect(
      dialog.queryByRole('button', { name: 'Confirmar habilitación' }),
    ).not.toBeInTheDocument();
  });

  it('ya habilitado: muestra el estado registrado sin permitir una segunda marca ni edición', async () => {
    actions.loadOverbookingStateAction.mockResolvedValue(
      ok(overbookingFixture(MOCK_IDS.enabledFuture)),
    );
    const { dialog } = await openDialog();
    expect(await dialog.findByText('Habilitado para sobreasignación')).toBeVisible();
    expect(dialog.getByText('Random Forest')).toBeVisible();
    expect(dialog.getByText('62.00 %')).toBeVisible();
    expect(
      dialog.queryByRole('button', { name: /Confirmar|Editar|Deshabilitar|Eliminar/ }),
    ).toBeNull();
  });

  it('409 por cambio concurrente: informa y vuelve a leer el estado (sin repetir el POST)', async () => {
    actions.loadOverbookingStateAction
      .mockResolvedValueOnce(ok(overbookingFixture(MOCK_IDS.highRfOnly)))
      .mockResolvedValue(ok(overbookingFixture(MOCK_IDS.enabledFuture)));
    actions.enableOverbookingAction.mockResolvedValue(
      httpError(409, 'OVERBOOKING_ALREADY_ENABLED_CONFLICT'),
    );
    const { user, dialog } = await openDialog();
    await user.click(await dialog.findByRole('button', { name: 'Confirmar habilitación' }));
    expect(await dialog.findByRole('alert')).toHaveTextContent('El horario ya estaba habilitado');
    await waitFor(() => expect(dialog.getByText('Habilitado el')).toBeVisible());
    expect(actions.enableOverbookingAction).toHaveBeenCalledTimes(1);
    expect(dialog.getByRole('alert')).not.toHaveTextContent(/OVERBOOKING|409|req-/);
  });

  it('error de lectura: mensaje operativo y reintento manual', async () => {
    actions.loadOverbookingStateAction.mockResolvedValue(httpError(503, 'PERSISTENCE_UNAVAILABLE'));
    const { user, dialog } = await openDialog();
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'Gestión operativa no disponible por ahora',
    );
    await user.click(dialog.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(actions.loadOverbookingStateAction).toHaveBeenCalledTimes(2));
    expect(router.refresh).toHaveBeenCalled();
  });
});

describe('HU-06 · marca visible en los listados', () => {
  it('la insignia distingue habilitado, no habilitado y gestión no disponible', () => {
    const { rerender } = render(
      <OverbookingMarkBadge summary={listItemFixture(MOCK_IDS.enabledFuture).overbooking} />,
    );
    expect(screen.getByText('Habilitado para sobreasignación')).toBeVisible();
    rerender(<OverbookingMarkBadge summary={listItemFixture(MOCK_IDS.highBoth).overbooking} />);
    expect(screen.getByText('No habilitado')).toBeVisible();
    rerender(<OverbookingMarkBadge summary={null} />);
    expect(screen.getByText('Estado de gestión no disponible')).toBeVisible();
    rerender(<OverbookingMarkBadge summary={null} onlyWhenEnabled />);
    expect(document.body).toHaveTextContent('');
  });

  it('/reservations muestra la marca solo en la reserva habilitada', () => {
    const rows = [MOCK_IDS.enabledFuture, MOCK_IDS.highBoth].map((id) =>
      toReservationRowView(listItemFixture(id), {
        selectedModelKey: 'random_forest_full_v1',
        listHref: '/reservations?from=2026-10-11&to=2026-10-24',
        catalog: null,
      }),
    );
    render(<ReservationsTable rows={rows} caption="Reservas" />);
    expect(screen.getAllByText('Habilitado para sobreasignación')).toHaveLength(1);
    expect(screen.queryByText('No habilitado')).not.toBeInTheDocument();
  });
});
