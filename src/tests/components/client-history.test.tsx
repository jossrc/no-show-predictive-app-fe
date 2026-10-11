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

function renderHistory(id: string, initial = ok(historyFixture(id, 'booking_creation'))) {
  return renderWithQuery(<ClientHistorySection reservationId={id} initial={initial} />);
}

beforeEach(() => vi.clearAllMocks());

describe('Historial del cliente (HU-06)', () => {
  it('«Al reservar» con datos del servidor, sin llamadas adicionales', () => {
    renderHistory(MOCK_IDS.availableBoth);
    expect(region().getByRole('tab', { name: 'Al reservar' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(region().getByText(/Información conocida al crear la reserva/)).toBeVisible();
    expect(stat('Asistencias')).toHaveTextContent('10');
    expect(stat('Posibles inasistencias')).toHaveTextContent('0');
    expect(stat('Tasa histórica')).toHaveTextContent('0 %');
    expect(region().getByText('Total de citas resueltas')).toBeVisible();
    expect(actions.loadClientHistoryAction).not.toHaveBeenCalled();
  });

  it('las aclaraciones se agrupan en «Cómo se calcula esta información»', async () => {
    const user = userEvent.setup();
    renderHistory(MOCK_IDS.availableBoth);
    const cancellations = region().getByText('Las cancelaciones no se cuentan como inasistencias.');
    expect(cancellations).not.toBeVisible();
    await user.click(region().getByText('Cómo se calcula esta información'));
    expect(cancellations).toBeVisible();
    expect(region().getByText(/no equivalen necesariamente a ausencias confirmadas/)).toBeVisible();
    expect(region().getByText(/no es la estimación de esta cita/)).toBeVisible();
    expect(region().queryByText(/NO_SHOW_CANDIDATE|known_at|cutoff/)).not.toBeInTheDocument();
  });

  it('cambia a «Información actual» bajo demanda y aclara que no modifica la predicción', async () => {
    const user = userEvent.setup();
    actions.loadClientHistoryAction.mockResolvedValue(
      ok(historyFixture(MOCK_IDS.availableBoth, 'current_known')),
    );
    renderHistory(MOCK_IDS.availableBoth);
    await user.click(region().getByRole('tab', { name: 'Información actual' }));
    expect(await screen.findByText('12')).toBeVisible();
    expect(actions.loadClientHistoryAction).toHaveBeenCalledWith(
      MOCK_IDS.availableBoth,
      'current_known',
    );
    expect(stat('Posibles inasistencias')).toHaveTextContent('1');
    expect(stat('Tasa histórica')).toHaveTextContent('7.7 %');
    expect(region().getByText(/Información conocida hasta el/)).toBeVisible();
    await user.click(region().getByText('Cómo se calcula esta información'));
    expect(
      region().getByText('El historial actual no modifica una predicción realizada anteriormente.'),
    ).toBeVisible();
  });

  it('historial vacío: tasa null como «Sin datos suficientes» (nunca 0 %)', () => {
    renderHistory(MOCK_IDS.notScorable);
    expect(stat('Tasa histórica')).toHaveTextContent('Sin datos suficientes');
    expect(stat('Tasa histórica')).not.toHaveTextContent('0 %');
    expect(region().getAllByText('Sin registros')).toHaveLength(2);
  });

  it.each([
    [404, 'RESERVATION_NOT_FOUND', 'No encontramos esta reserva', false],
    [409, 'HISTORY_CUTOFF_UNAVAILABLE', 'Historial no disponible', false],
    [503, 'SOURCE_DATA_UNAVAILABLE', 'No pudimos cargar la información', true],
  ])('error %i %s', (status, code, title, retryable) => {
    renderHistory(MOCK_IDS.availableBoth, httpError(status, code));
    expect(region().getByRole('alert')).toHaveTextContent(title);
    expect(region().getByRole('alert')).not.toHaveTextContent(code);
    expect(region().queryAllByRole('button', { name: 'Reintentar' }).length > 0).toBe(retryable);
  });

  it('error de conexión al cambiar de modo, con reintento', async () => {
    const user = userEvent.setup();
    actions.loadClientHistoryAction.mockRejectedValueOnce(new Error('fetch failed'));
    actions.loadClientHistoryAction.mockResolvedValueOnce(
      ok(historyFixture(MOCK_IDS.availableBoth, 'current_known')),
    );
    renderHistory(MOCK_IDS.availableBoth);
    await user.click(region().getByRole('tab', { name: 'Información actual' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la información');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('12')).toBeVisible();
  });

  it('desarrollo: el corte temporal técnico se consulta en el diagnóstico', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <ClientHistorySection
        reservationId={MOCK_IDS.availableBoth}
        initial={ok(historyFixture(MOCK_IDS.availableBoth, 'booking_creation'))}
      />,
      { diagnosticsEnabled: true },
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Diagnóstico técnico: Historial del cliente · Al reservar',
      }),
    );
    const sheet = within(screen.getByRole('dialog'));
    expect(sheet.getByText('HU-06')).toBeVisible();
    expect(sheet.getByText('known_at < cutoffAt')).toBeVisible();
  });
});
