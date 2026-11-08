import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OperationalBlock } from '@/features/operational-optimization/components/OperationalBlock';
import { OperationalFilters } from '@/features/operational-optimization/components/OperationalFilters';
import { TrackingTabs } from '@/features/operational-optimization/components/TrackingTabs';
import { parseOperationalParams } from '@/features/operational-optimization/model/query';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const query = (raw: Record<string, string> = {}) => parseOperationalParams(raw, '2026-11-04').query;

beforeEach(() => vi.clearAllMocks());

describe('Filtros de «Optimización operativa»', () => {
  it('muestra los filtros de la Figura 17 más el modelo, con valores de la URL', () => {
    render(<OperationalFilters initial={query({ clinicId: '7' })} view="authorizations" />);
    const form = within(screen.getByRole('form', { name: 'Filtros de búsqueda' }));
    expect(form.getByLabelText('Fecha desde')).toHaveValue('2026-10-28');
    expect(form.getByLabelText('Fecha hasta')).toHaveValue('2026-11-24');
    expect(form.getByLabelText('Sede')).toHaveValue('7');
    expect(form.getByLabelText('Estado de la reserva')).toHaveValue('SCHEDULED');
    expect(form.getByLabelText('Modelo')).toHaveValue('random_forest_full_v1');
    expect(form.getByText(/Estado y modelo aplican a «Reservas con alto riesgo»/)).toBeVisible();
  });

  it('aplica filtros a una URL canónica sin cursores y conserva la vista de seguimiento', async () => {
    const user = userEvent.setup();
    render(<OperationalFilters initial={query({ riskCursor: 'r1' })} view="recovery" />);
    await user.selectOptions(screen.getByLabelText('Modelo'), 'xgboost_full_v1');
    await user.type(screen.getByLabelText('Sede'), '11');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    const href = router.push.mock.calls[0]?.[0] as string;
    expect(href).toMatch(/^\/operational-optimization\?from=2026-10-28&to=2026-11-24/);
    expect(href).toContain('clinicId=11');
    expect(href).toContain('modelKey=xgboost_full_v1');
    expect(href).toContain('view=recovery');
    expect(href).not.toContain('Cursor');
  });

  it('valida el período (máx. 92 días) y la sede antes de navegar', async () => {
    const user = userEvent.setup();
    render(<OperationalFilters initial={query()} view="authorizations" />);
    const from = screen.getByLabelText('Fecha desde');
    await user.clear(from);
    await user.type(from, '2026-01-01');
    await user.type(screen.getByLabelText('Sede'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(await screen.findByText('El período no puede superar 92 días.')).toBeVisible();
    expect(screen.getByText('Ingresa el número de sede (por ejemplo, 11).')).toBeVisible();
    expect(screen.getByLabelText('Sede')).toHaveAttribute('aria-invalid', 'true');
    expect(router.push).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));
    expect(router.push).toHaveBeenCalledWith('/operational-optimization');
  });
});

describe('Pestañas del seguimiento', () => {
  it('marcan la vista actual y reinician solo el cursor del seguimiento', () => {
    render(
      <OperationalBlock title="Seguimiento operativo">
        <TrackingTabs query={query({ view: 'attendance', trackCursor: 't1', riskCursor: 'r1' })} />
      </OperationalBlock>,
    );
    const region = within(screen.getByRole('region', { name: 'Seguimiento operativo' }));
    expect(region.getByRole('link', { name: 'Asistencia registrada' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const recovery = region.getByRole('link', { name: 'Espacios recuperados' });
    expect(recovery).not.toHaveAttribute('aria-current');
    expect(recovery.getAttribute('href')).toContain('view=recovery');
    expect(recovery.getAttribute('href')).toContain('riskCursor=r1');
    expect(recovery.getAttribute('href')).not.toContain('trackCursor');
  });
});
