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

const moreFilters = () => screen.getByRole('button', { name: /Más filtros/ });

beforeEach(() => push.mockClear());

describe('Filtros de reservas (HU-03)', () => {
  it('muestra a la vista solo los filtros principales', () => {
    render(<ReservationFilters initial={initial} />);
    for (const label of ['Desde', 'Hasta', 'Estado', 'Sede']) {
      expect(screen.getByLabelText(label)).toBeVisible();
    }
    for (const label of ['Ordenar por', 'Dirección', 'Modelo', 'Por página']) {
      expect(screen.getByLabelText(label)).not.toBeVisible();
    }
    expect(moreFilters()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Aplicar filtros' })).toBeVisible();
  });

  it('aplica fechas, estado y sede en una URL nueva sin cursor ni riskLevel', async () => {
    const user = userEvent.setup();
    render(<ReservationFilters initial={initial} />);
    await setDate(user, 'Desde', '2026-12-01');
    await setDate(user, 'Hasta', '2026-12-31');
    await user.selectOptions(screen.getByLabelText('Estado'), 'CANCELLED');
    await user.type(screen.getByLabelText('Sede'), '11');
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

  it('«Más filtros»: orden por estimación, dirección, modelo y tamaño de página', async () => {
    const user = userEvent.setup();
    render(<ReservationFilters initial={initial} />);
    await user.click(moreFilters());
    expect(moreFilters()).toHaveAttribute('aria-expanded', 'true');
    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'probabilityNoShow');
    expect(screen.getByText(/no es una priorización validada/)).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Dirección'), 'desc');
    await user.selectOptions(screen.getByLabelText('Modelo'), 'xgboost_full_v1');
    await user.selectOptions(screen.getByLabelText('Por página'), '50');
    expect(moreFilters()).toHaveTextContent('4 activos');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(Object.fromEntries(pushedParams())).toMatchObject({
      sort: 'probabilityNoShow',
      direction: 'desc',
      modelKey: 'xgboost_full_v1',
      limit: '50',
    });
  });

  it('un filtro avanzado activo se conserva y es perceptible con el panel cerrado', async () => {
    const user = userEvent.setup();
    render(<ReservationFilters initial={{ ...initial, sort: 'probabilityNoShow' }} />);
    expect(moreFilters()).toHaveTextContent('1 activo');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(pushedParams().get('sort')).toBe('probabilityNoShow');
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

  it('impide un rango mayor de 92 días y una sede no numérica', async () => {
    const user = userEvent.setup();
    render(<ReservationFilters initial={initial} />);
    await setDate(user, 'Desde', '2026-01-01');
    await setDate(user, 'Hasta', '2026-06-30');
    await user.type(screen.getByLabelText('Sede'), 'sede');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(await screen.findByText('El período no puede superar 92 días.')).toBeVisible();
    expect(screen.getByText('Ingresa el número de sede (por ejemplo, 11).')).toBeVisible();
    expect(push).not.toHaveBeenCalled();
  });

  it('restablece eliminando todos los filtros de la URL', async () => {
    const user = userEvent.setup();
    render(<ReservationFilters initial={{ ...initial, clinicId: '11', status: 'CANCELLED' }} />);
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/reservations'));
  });
});
