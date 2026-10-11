import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReservationFilters } from '@/features/reservations/components/ReservationFilters';
import { defaultFilters } from '@/features/reservations/model/list-query';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const initial = { ...defaultFilters('2026-10-11') };

function pushedParams(): URLSearchParams {
  const href = push.mock.calls.at(-1)?.[0] as string;
  return new URL(href, 'http://x').searchParams;
}

async function setDate(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  const input = screen.getByLabelText(label);
  await user.clear(input);
  await user.type(input, value);
}

beforeEach(() => push.mockClear());

describe('Filtros de reservas (HU-03)', () => {
  it('aplica fechas, estado y clínica en una URL nueva sin cursor ni riskLevel', async () => {
    const user = userEvent.setup();
    render(<ReservationFilters initial={initial} />);
    await setDate(user, 'Desde', '2026-12-01');
    await setDate(user, 'Hasta', '2026-12-31');
    await user.selectOptions(screen.getByLabelText('Estado'), 'CANCELLED');
    await user.type(screen.getByLabelText('Clínica (ID)'), '11');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    const params = pushedParams();
    expect(Object.fromEntries(params)).toEqual({
      from: '2026-12-01',
      to: '2026-12-31',
      status: 'CANCELLED',
      clinicId: '11',
    });
    expect(params.has('riskLevel')).toBe(false);
    expect(params.has('cursor')).toBe(false);
  });

  it('aplica el orden exploratorio por probabilidad, dirección y modelo', async () => {
    const user = userEvent.setup();
    render(<ReservationFilters initial={initial} />);
    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'probabilityNoShow');
    expect(screen.getByText(/no es una priorización operativa validada/)).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Dirección'), 'desc');
    await user.selectOptions(screen.getByLabelText('Modelo'), 'xgboost_full_v1');
    await user.selectOptions(screen.getByLabelText('Por página'), '50');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(Object.fromEntries(pushedParams())).toMatchObject({
      sort: 'probabilityNoShow',
      direction: 'desc',
      modelKey: 'xgboost_full_v1',
      limit: '50',
    });
  });

  it('no ofrece orden ni filtro por nivel de riesgo', () => {
    render(<ReservationFilters initial={initial} />);
    const sortOptions = [
      ...(screen.getByLabelText('Ordenar por') as HTMLSelectElement).options,
    ].map((o) => o.value);
    expect(sortOptions).toEqual(['appointmentAt', 'probabilityNoShow']);
    expect(screen.queryByLabelText(/nivel de riesgo/i)).not.toBeInTheDocument();
  });

  it('impide aplicar una fecha final anterior a la inicial', async () => {
    const user = userEvent.setup();
    render(<ReservationFilters initial={initial} />);
    await setDate(user, 'Desde', '2026-12-10');
    await setDate(user, 'Hasta', '2026-12-01');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(
      await screen.findByText('La fecha final debe ser igual o posterior a la inicial.'),
    ).toBeVisible();
    expect(screen.getByLabelText('Hasta')).toHaveAttribute('aria-invalid', 'true');
    expect(push).not.toHaveBeenCalled();
  });

  it('impide un rango mayor de 92 días y una clínica no numérica', async () => {
    const user = userEvent.setup();
    render(<ReservationFilters initial={initial} />);
    await setDate(user, 'Desde', '2026-01-01');
    await setDate(user, 'Hasta', '2026-06-30');
    await user.type(screen.getByLabelText('Clínica (ID)'), 'sede');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(await screen.findByText('El período no puede superar 92 días.')).toBeVisible();
    expect(screen.getByText(/identificador numérico de clínica/)).toBeVisible();
    expect(push).not.toHaveBeenCalled();
  });

  it('restablece eliminando todos los filtros de la URL', async () => {
    const user = userEvent.setup();
    render(<ReservationFilters initial={{ ...initial, clinicId: '11', status: 'CANCELLED' }} />);
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/reservations'));
  });
});
