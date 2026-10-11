import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppShell } from '@/components/layout/AppShell';
import { DataModeBanner } from '@/components/layout/DataModeBanner';
import { ThemeProvider } from '@/providers/ThemeProvider';

vi.mock('next/navigation', () => ({ usePathname: () => '/reservations/900000000001001' }));

describe('Layout general', () => {
  it('navegación compacta enfocada en reservas, con ruta activa en el detalle', () => {
    render(
      <ThemeProvider>
        <AppShell>
          <h1>Contenido de prueba</h1>
        </AppShell>
      </ThemeProvider>,
    );
    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    const links = within(navigation).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent('Reservas');
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    for (const removed of ['Reportes', 'Configuración', 'Modelos', 'Inicio']) {
      expect(screen.queryByRole('link', { name: removed })).not.toBeInTheDocument();
    }
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('link', { name: 'Ir al contenido' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('button', { name: 'Cambiar tema' })).toBeVisible();
  });

  it('sin footer académico, usuario ficticio ni indicadores de infraestructura', () => {
    render(<AppShell>contenido</AppShell>);
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /Sprint|Core predictivo|Tesis|HU-|EXPLORATORY_NOT_VALIDATED|NO_SHOW_CANDIDATE|ML disponible/,
    );
    expect(screen.queryByRole('img', { name: /avatar|perfil/i })).not.toBeInTheDocument();
  });

  it('advierte el modo de datos de prueba sin nombres de variables y no muestra nada en LIVE', () => {
    const { rerender } = render(<DataModeBanner mode="mock" />);
    expect(screen.getByRole('note')).toHaveTextContent('No son resultados reales');
    expect(screen.getByRole('note')).not.toHaveTextContent('FRONTEND_DATA_MODE');
    rerender(<DataModeBanner mode="live" />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
