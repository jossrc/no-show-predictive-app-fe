import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CursorPagination } from '@/features/reservations/components/CursorPagination';
import { listNotices } from '@/features/reservations/components/ListNotices';
import { ReservationsCardList } from '@/features/reservations/components/ReservationsCardList';
import { ReservationsTable } from '@/features/reservations/components/ReservationsTable';
import { toReservationRowView } from '@/features/reservations/model/row-view';
import { listFixture, listItemFixture, MOCK_IDS } from '@/tests/support/fixtures';

const LIST_HREF = '/reservations?from=2026-10-11&to=2026-10-24';
const rowsFor = (...ids: string[]) =>
  ids.map((id) =>
    toReservationRowView(listItemFixture(id), {
      selectedModelKey: 'random_forest_full_v1',
      listHref: LIST_HREF,
      catalog: null,
    }),
  );

const detailLink = (id: string) =>
  screen.getByRole('link', { name: `Ver detalle de Reserva #${id}` });
const rowOf = (id: string) => detailLink(id).closest('tr')!;

describe('Tabla de reservas (HU-01)', () => {
  it('muestra los datos de la cita y dos estimaciones identificadas por modelo', () => {
    render(<ReservationsTable rows={rowsFor(MOCK_IDS.availableBoth)} caption="Reservas" />);
    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent);
    expect(headers).toEqual([
      'Reserva',
      'Fecha y hora',
      'Cliente',
      'Sede',
      'Estado',
      'Estimación',
      'Acción',
    ]);
    const row = within(rowOf(MOCK_IDS.availableBoth));
    expect(row.getByText(`#${MOCK_IDS.availableBoth}`)).toBeVisible();
    expect(row.getByText('Sede #2')).toBeVisible();
    expect(row.getByText('31 %')).toBeVisible();
    expect(row.getByText('27.4 %')).toBeVisible();
    expect(row.getByText('Random Forest')).toBeVisible();
    expect(row.getByText('XGBoost')).toBeVisible();
    expect(row.getByText('Programada')).toBeVisible();
  });

  it('muestra un score real de 0 % y un único modelo', () => {
    render(<ReservationsTable rows={rowsFor(MOCK_IDS.rfOnlyZero)} caption="Reservas" />);
    const row = within(rowOf(MOCK_IDS.rfOnlyZero));
    expect(row.getByText('0 %')).toBeVisible();
    expect(row.queryByText('XGBoost')).not.toBeInTheDocument();
  });

  it('sin score muestra «Sin estimación», nunca 0 % ni códigos predictivos', () => {
    render(
      <ReservationsTable
        rows={rowsFor(MOCK_IDS.notScored, MOCK_IDS.notScorable)}
        caption="Reservas"
      />,
    );
    for (const id of [MOCK_IDS.notScored, MOCK_IDS.notScorable]) {
      const row = within(rowOf(id));
      expect(row.getByText('Sin estimación')).toBeVisible();
      expect(row.queryByText(/%/)).not.toBeInTheDocument();
      expect(row.queryByText(/NOT_SCOR|No evaluable|Exploratoria/)).not.toBeInTheDocument();
    }
  });

  it('advierte la información por actualizar y la reprogramación con texto accesible', () => {
    render(<ReservationsTable rows={rowsFor(MOCK_IDS.stale)} caption="Reservas" />);
    const row = within(rowOf(MOCK_IDS.stale));
    expect(row.getByText(/podría requerir actualización/)).toBeInTheDocument();
    expect(row.getByText('Reprogramación detectada')).toBeInTheDocument();
  });

  it('distingue reservas canceladas', () => {
    render(<ReservationsTable rows={rowsFor(MOCK_IDS.cancelled)} caption="Reservas" />);
    expect(within(rowOf(MOCK_IDS.cancelled)).getByText('Cancelada')).toBeVisible();
  });

  it('una única acción por fila hacia el detalle, conservando el listado y sin semáforos', () => {
    render(<ReservationsTable rows={rowsFor(MOCK_IDS.availableBoth)} caption="Reservas" />);
    expect(within(rowOf(MOCK_IDS.availableBoth)).getAllByRole('link')).toHaveLength(1);
    const link = detailLink(MOCK_IDS.availableBoth);
    expect(link).toHaveTextContent('Ver detalle');
    const href = new URL(link.getAttribute('href')!, 'http://x');
    expect(href.pathname).toBe(`/reservations/${MOCK_IDS.availableBoth}`);
    expect(href.searchParams.get('back')).toBe(LIST_HREF);
    expect(screen.queryByText(/riesgo (bajo|medio|alto)/i)).not.toBeInTheDocument();
  });

  it('la variante móvil conserva identificador, fecha, sede, estado, estimación y acción', () => {
    render(<ReservationsCardList rows={rowsFor(MOCK_IDS.availableBoth, MOCK_IDS.notScored)} />);
    expect(screen.getAllByRole('link', { name: /Ver detalle de Reserva/ })).toHaveLength(2);
    const card = within(detailLink(MOCK_IDS.availableBoth).closest('li')!);
    expect(card.getByText(`Reserva #${MOCK_IDS.availableBoth}`)).toBeVisible();
    expect(card.getByText(/Sede #2/)).toBeVisible();
    expect(card.getByText('Programada')).toBeVisible();
    expect(card.getByText('31 %')).toBeVisible();
    expect(screen.getByText('Sin estimación')).toBeVisible();
  });
});

describe('Avisos del listado', () => {
  const keys = (...args: Parameters<typeof listNotices>) =>
    listNotices(...args).map((notice) => notice.key);

  it('sin avisos cuando las reservas tienen estimaciones y datos vigentes', () => {
    expect(keys(listFixture([MOCK_IDS.availableBoth]), 'live')).toEqual([]);
  });

  it('una sola nota cuando ninguna reserva tiene estimación', () => {
    const notices = listNotices(listFixture([MOCK_IDS.notScorable, MOCK_IDS.notScored]), 'live');
    expect(notices).toHaveLength(1);
    expect(notices[0]?.text).toBe('Las estimaciones no están disponibles para estas citas.');
  });

  it('un error predictivo general reemplaza la nota de «sin estimaciones» (sin duplicar)', () => {
    const list = listFixture([MOCK_IDS.notScorable], { predictiveStoreAvailable: false });
    expect(listNotices(list, 'live').map((notice) => notice.text)).toEqual([
      'Las reservas están disponibles, pero no podemos consultar sus estimaciones en este momento.',
    ]);
  });

  it('datos desactualizados y fuente de demostración (esta última no se repite en modo de prueba)', () => {
    const list = listFixture([MOCK_IDS.availableBoth, MOCK_IDS.stale], {
      sourceStatus: 'SYNTHETIC_DEMO_ONLY',
    });
    expect(keys(list, 'live')).toEqual(['stale', 'synthetic']);
    expect(keys(list, 'mock')).toEqual(['stale']);
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
        rowCount={25}
      />,
    );
    expect(screen.getByText('25 reservas en esta página')).toBeVisible();
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
        rowCount={4}
      />,
    );
    expect(screen.queryByRole('link', { name: 'Siguiente' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Anterior' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Primera página' })).toHaveAttribute(
      'href',
      '/reservations',
    );
    expect(screen.getByText('Página 3 · 4 reservas en esta página')).toBeVisible();
    expect(screen.queryByText(/de \d+ páginas|total/i)).not.toBeInTheDocument();
  });
});
