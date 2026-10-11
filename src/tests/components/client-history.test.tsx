import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClientHistorySection } from '@/features/client-history/components/ClientHistorySection';
import { historyFixture, httpError, MOCK_IDS, ok } from '@/tests/support/fixtures';
import { renderWithQuery } from '@/tests/support/render';

const actions = vi.hoisted(() => ({ loadClientHistoryAction: vi.fn() }));
vi.mock('@/features/client-history/api/history.actions', () => actions);

const region = () => within(screen.getByRole('region', { name: 'Historial del cliente' }));
const stat = (label: string) => screen.getByText(label).parentElement!;

beforeEach(() => vi.clearAllMocks());

describe('Historial del cliente (HU-06)', () => {
  it('modo inicial booking_creation con datos del servidor, sin llamadas adicionales', () => {
    renderWithQuery(
      <ClientHistorySection
        reservationId={MOCK_IDS.availableBoth}
        initial={ok(historyFixture(MOCK_IDS.availableBoth, 'booking_creation'))}
      />,
    );
    expect(region().getByRole('tab', { name: 'Al crear la reserva' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(stat('Asistencias previas')).toHaveTextContent('10');
    expect(stat('Inasistencias candidatas')).toHaveTextContent('0');
    expect(stat('Tasa histórica')).toHaveTextContent('0 %');
    expect(region().getByText(/no es la probabilidad predictiva de esta cita/)).toBeVisible();
    expect(region().getByText('Las cancelaciones no se cuentan como inasistencias.')).toBeVisible();
    expect(actions.loadClientHistoryAction).not.toHaveBeenCalled();
  });

  it('cambia a current_known bajo demanda y aclara que no alimenta el score original', async () => {
    const user = userEvent.setup();
    actions.loadClientHistoryAction.mockResolvedValue(
      ok(historyFixture(MOCK_IDS.availableBoth, 'current_known')),
    );
    renderWithQuery(
      <ClientHistorySection
        reservationId={MOCK_IDS.availableBoth}
        initial={ok(historyFixture(MOCK_IDS.availableBoth, 'booking_creation'))}
      />,
    );
    await user.click(region().getByRole('tab', { name: 'Conocido actualmente' }));
    expect(await screen.findByText('12')).toBeVisible();
    expect(actions.loadClientHistoryAction).toHaveBeenCalledWith(
      MOCK_IDS.availableBoth,
      'current_known',
    );
    expect(stat('Inasistencias candidatas')).toHaveTextContent('1');
    expect(stat('Tasa histórica')).toHaveTextContent('7.7 %');
    expect(
      region().getByText(/no corresponde al historial usado por la predicción original/),
    ).toBeVisible();
    expect(
      region().getByText(
        'Este historial actual no alimenta ni modifica el score original de la reserva.',
      ),
    ).toBeVisible();
  });

  it('historial vacío: tasa null como «Sin historial suficiente» y fechas sin registros', () => {
    renderWithQuery(
      <ClientHistorySection
        reservationId={MOCK_IDS.notScorable}
        initial={ok(historyFixture(MOCK_IDS.notScorable, 'booking_creation'))}
      />,
    );
    expect(stat('Tasa histórica')).toHaveTextContent('Sin historial suficiente');
    expect(stat('Tasa histórica')).not.toHaveTextContent('0 %');
    expect(region().getAllByText('Sin registros')).toHaveLength(2);
    expect(region().getByText('known_at < cutoffAt')).toBeVisible();
  });

  it.each([
    [404, 'RESERVATION_NOT_FOUND', 'Reserva no encontrada', false],
    [409, 'HISTORY_CUTOFF_UNAVAILABLE', 'Historial temporal no disponible', false],
    [503, 'SOURCE_DATA_UNAVAILABLE', 'Fuente de reservas no disponible', true],
  ])('error %i %s', (status, code, title, retryable) => {
    renderWithQuery(
      <ClientHistorySection
        reservationId={MOCK_IDS.availableBoth}
        initial={httpError(status, code)}
      />,
    );
    expect(region().getByRole('alert')).toHaveTextContent(title);
    expect(region().queryAllByRole('button', { name: 'Reintentar' }).length > 0).toBe(retryable);
  });

  it('error de conexión al cambiar de modo, con reintento', async () => {
    const user = userEvent.setup();
    actions.loadClientHistoryAction.mockRejectedValueOnce(new Error('fetch failed'));
    actions.loadClientHistoryAction.mockResolvedValueOnce(
      ok(historyFixture(MOCK_IDS.availableBoth, 'current_known')),
    );
    renderWithQuery(
      <ClientHistorySection
        reservationId={MOCK_IDS.availableBoth}
        initial={ok(historyFixture(MOCK_IDS.availableBoth, 'booking_creation'))}
      />,
    );
    await user.click(region().getByRole('tab', { name: 'Conocido actualmente' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión con el backend');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('12')).toBeVisible();
  });
});
