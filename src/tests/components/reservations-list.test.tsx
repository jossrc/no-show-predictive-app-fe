import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CursorPagination } from '@/features/reservations/components/CursorPagination';
import { ReservationsCardList } from '@/features/reservations/components/ReservationsCardList';
import { ReservationsTable } from '@/features/reservations/components/ReservationsTable';
import { toReservationRowView } from '@/features/reservations/model/row-view';
import { listItemFixture, MOCK_IDS } from '@/tests/support/fixtures';

const LIST_HREF = '/reservations?from=2026-10-11&to=2026-10-24';
const rowsFor = (...ids: string[]) =>
  ids.map((id) =>
    toReservationRowView(listItemFixture(id), {
      selectedModelKey: 'random_forest_full_v1',
      listHref: LIST_HREF,
      catalog: null,
    }),
  );

function rowOf(id: string) {
  return screen.getByRole('link', { name: `#${id}` }).closest('tr')!;
}

describe('Tabla de reservas (HU-01)', () => {
  it('muestra dos scores identificados por modelo con su estado exploratorio', () => {
    render(<ReservationsTable rows={rowsFor(MOCK_IDS.availableBoth)} caption="Reservas" />);
    const row = within(rowOf(MOCK_IDS.availableBoth));
    expect(row.getByText('31 %')).toBeVisible();
    expect(row.getByText('27.4 %')).toBeVisible();
    expect(row.getByText('Exploratoria')).toBeVisible();
    expect(row.getByText('Programada')).toBeVisible();
  });

  it('muestra un score real de 0 % y un único modelo', () => {
    render(<ReservationsTable rows={rowsFor(MOCK_IDS.rfOnlyZero)} caption="Reservas" />);
    const row = within(rowOf(MOCK_IDS.rfOnlyZero));
    expect(row.getByText('0 %')).toBeVisible();
    expect(row.queryByText(/XGB/)).not.toBeInTheDocument();
  });

  it('no muestra 0 % para reservas sin score (NOT_SCORED / NOT_SCORABLE)', () => {
    render(
      <ReservationsTable
        rows={rowsFor(MOCK_IDS.notScored, MOCK_IDS.notScorable)}
        caption="Reservas"
      />,
    );
    const notScored = within(rowOf(MOCK_IDS.notScored));
    expect(notScored.getAllByText('Sin predicción').length).toBeGreaterThan(0);
    expect(notScored.queryByText(/%/)).not.toBeInTheDocument();
    const notScorable = within(rowOf(MOCK_IDS.notScorable));
    expect(notScorable.getAllByText('No evaluable').length).toBeGreaterThan(0);
    expect(notScorable.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('advierte la clasificación obsoleta y la reprogramación con texto', () => {
    render(<ReservationsTable rows={rowsFor(MOCK_IDS.stale)} caption="Reservas" />);
    const row = within(rowOf(MOCK_IDS.stale));
    expect(row.getByText(/Clasificación desactualizada/)).toBeInTheDocument();
    expect(row.getByText('Reprogramación detectada')).toBeInTheDocument();
  });

  it('distingue reservas canceladas', () => {
    render(<ReservationsTable rows={rowsFor(MOCK_IDS.cancelled)} caption="Reservas" />);
    expect(within(rowOf(MOCK_IDS.cancelled)).getByText('Cancelada')).toBeVisible();
  });

  it('enlaza al detalle conservando el estado del listado y sin niveles de riesgo', () => {
    render(<ReservationsTable rows={rowsFor(MOCK_IDS.availableBoth)} caption="Reservas" />);
    const link = screen.getByRole('link', {
      name: `Ver detalle de Reserva #${MOCK_IDS.availableBoth}`,
    });
    const href = new URL(link.getAttribute('href')!, 'http://x');
    expect(href.pathname).toBe(`/reservations/${MOCK_IDS.availableBoth}`);
    expect(href.searchParams.get('back')).toBe(LIST_HREF);
    expect(screen.queryByText(/riesgo (bajo|medio|alto)/i)).not.toBeInTheDocument();
  });

  it('la variante móvil ofrece el mismo contenido como enlaces', () => {
    render(<ReservationsCardList rows={rowsFor(MOCK_IDS.availableBoth, MOCK_IDS.notScored)} />);
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText('31 %')).toBeVisible();
  });
});

describe('Paginación por cursor', () => {
  it('solo muestra «Siguiente» cuando existe nextCursor y «Anterior» fuera de la primera página', () => {
    const { rerender } = render(
      <CursorPagination
        pageNumber={1}
        previousHref={null}
        nextHref="/reservations?cursor=C1"
        firstHref="/reservations"
        pageSize={25}
        rowCount={25}
      />,
    );
    expect(screen.getByRole('link', { name: 'Siguiente' })).toHaveAttribute(
      'href',
      '/reservations?cursor=C1',
    );
    expect(screen.queryByRole('link', { name: 'Anterior' })).not.toBeInTheDocument();

    rerender(
      <CursorPagination
        pageNumber={3}
        previousHref="/reservations?cursor=C1"
        nextHref={null}
        firstHref="/reservations"
        pageSize={25}
        rowCount={4}
      />,
    );
    expect(screen.queryByRole('link', { name: 'Siguiente' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Anterior' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Primera página' })).toHaveAttribute(
      'href',
      '/reservations',
    );
    expect(screen.getByText(/Página 3 · 4 reservas/)).toBeVisible();
    expect(screen.queryByText(/de \d+ páginas/)).not.toBeInTheDocument();
  });
});
