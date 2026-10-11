import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppShell } from '@/components/layout/AppShell';
import { DataModeBanner } from '@/components/layout/DataModeBanner';
import { ThemeProvider } from '@/providers/ThemeProvider';

vi.mock('next/navigation', () => ({ usePathname: () => '/reservations/900000000001001' }));

describe('Layout del Sprint 01', () => {
  it('navegación compacta enfocada en reservas, con ruta activa en el detalle', () => {
    render(
      <ThemeProvider>
        <AppShell statusSlot={<span>Estado ML</span>}>
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
    expect(screen.getByText('Estado ML')).toBeVisible();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('link', { name: 'Ir al contenido' })).toHaveAttribute(
      'href',
      '#main-content',
    );
  });

  it('advierte el modo de datos de prueba y no muestra nada en LIVE', () => {
    const { rerender } = render(<DataModeBanner mode="mock" />);
    expect(screen.getByRole('note')).toHaveTextContent('No son resultados reales');
    rerender(<DataModeBanner mode="live" />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
