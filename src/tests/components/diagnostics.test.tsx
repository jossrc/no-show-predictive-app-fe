import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppShell } from '@/components/layout/AppShell';
import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { RiskSection } from '@/features/reservation-risk/components/RiskSection';
import { ReservationFacts } from '@/features/reservations/components/ReservationFacts';
import {
  catalogFixture,
  detailFixture,
  httpError,
  MOCK_IDS,
  ok,
  riskFixture,
} from '@/tests/support/fixtures';
import { renderWithQuery } from '@/tests/support/render';

vi.mock('@/features/reservation-risk/api/risk.actions', () => ({
  requestPredictionAction: vi.fn(),
  loadRiskFactorsAction: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/reservations/900000000001002',
}));

/** Jerga técnica que nunca debe aparecer en la vista normal (sin abrir el diagnóstico). */
const TECHNICAL_JARGON =
  /HU-\d|Sprint|EXPLORATORY_NOT_VALIDATED|NO_SHOW_CANDIDATE|NOT_SCORABLE|snapshot|requestId|ID de solicitud|SCHEDULED_SERVICES|pending_validation|endpoint/i;

function renderDetailSections() {
  return renderWithQuery(
    <AppShell>
      <ReservationFacts detail={ok(detailFixture(MOCK_IDS.notScorable))} />
      <RiskSection
        reservationId={MOCK_IDS.notScorable}
        risk={ok(riskFixture(MOCK_IDS.notScorable))}
        catalog={ok(catalogFixture)}
      />
    </AppShell>,
  );
}

afterEach(() => vi.unstubAllEnvs());

describe('APP_ENV en la interfaz', () => {
  it('production: sin acceso al diagnóstico y sin jerga técnica, HU ni Sprint', () => {
    vi.stubEnv('APP_ENV', 'production');
    renderDetailSections();
    expect(screen.queryByRole('button', { name: /Diagnóstico técnico/ })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(TECHNICAL_JARGON);
  });

  it('development: acceso discreto al diagnóstico, oculto hasta que se abre', async () => {
    vi.stubEnv('APP_ENV', 'development');
    const user = userEvent.setup();
    renderDetailSections();
    expect(document.body.textContent).not.toMatch(TECHNICAL_JARGON);

    await user.click(
      screen.getByRole('button', { name: 'Diagnóstico técnico: Estimación de inasistencia' }),
    );
    const sheet = within(screen.getByRole('dialog'));
    expect(sheet.getByText('HU-02')).toBeVisible();
    expect(sheet.getByText('GET /api/v1/reservations/:reservationId/risk')).toBeVisible();
    expect(sheet.getByText('NOT_SCORABLE')).toBeVisible();
    expect(sheet.getByText('SCHEDULED_SERVICES_NOT_POINT_IN_TIME')).toBeVisible();
    expect(sheet.getByText('EXPLORATORY_NOT_VALIDATED')).toBeVisible();
    expect(sheet.getByText('pending_validation')).toBeVisible();
  });

  it('NODE_ENV=production oculta el diagnóstico aunque APP_ENV=development', () => {
    vi.stubEnv('APP_ENV', 'development');
    vi.stubEnv('NODE_ENV', 'production');
    renderDetailSections();
    expect(screen.queryByRole('button', { name: /Diagnóstico técnico/ })).not.toBeInTheDocument();
  });

  it('APP_ENV inválido se comporta como producción', () => {
    vi.stubEnv('APP_ENV', 'debug');
    renderDetailSections();
    expect(screen.queryByRole('button', { name: /Diagnóstico técnico/ })).not.toBeInTheDocument();
  });

  it('la cabecera muestra la etiqueta y las herramientas solo cuando se le entregan', () => {
    const { rerender } = render(<AppShell>contenido</AppShell>);
    expect(screen.queryByText('Desarrollo')).not.toBeInTheDocument();
    rerender(
      <AppShell
        environmentLabel="Desarrollo"
        toolsSlot={<button type="button">Diagnóstico</button>}
      >
        contenido
      </AppShell>,
    );
    expect(screen.getByText('Desarrollo')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Diagnóstico' })).toBeVisible();
  });
});

describe('Errores: mensaje claro y código técnico solo en desarrollo', () => {
  const error = httpError(503, 'SOURCE_DATA_UNAVAILABLE').error;

  it('producción: título y descripción comprensibles, sin código ni requestId', () => {
    renderWithQuery(<ApiErrorNotice error={error} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('No pudimos cargar la información');
    expect(alert).not.toHaveTextContent(/SOURCE_DATA_UNAVAILABLE|req-error-1|503/);
    expect(
      screen.queryByRole('button', { name: 'Ver diagnóstico técnico' }),
    ).not.toBeInTheDocument();
  });

  it('desarrollo: el código original se consulta voluntariamente', async () => {
    const user = userEvent.setup();
    renderWithQuery(<ApiErrorNotice error={error} />, { diagnosticsEnabled: true });
    expect(screen.getByRole('alert')).not.toHaveTextContent('SOURCE_DATA_UNAVAILABLE');
    await user.click(screen.getByRole('button', { name: 'Ver diagnóstico técnico' }));
    const sheet = within(screen.getByRole('dialog'));
    expect(sheet.getByText('SOURCE_DATA_UNAVAILABLE')).toBeVisible();
    expect(sheet.getByText('req-error-1')).toBeVisible();
    expect(sheet.getByText('503')).toBeVisible();
  });
});
