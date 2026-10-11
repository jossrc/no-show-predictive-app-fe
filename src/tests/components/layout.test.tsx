import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/providers/ThemeProvider';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

describe('Layout administrativo', () => {
  it('incluye navegación semántica, ruta activa y acceso al contenido', () => {
    render(
      <ThemeProvider>
        <AppShell>
          <h1>Contenido de prueba</h1>
        </AppShell>
      </ThemeProvider>,
    );
    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(5);
    expect(within(navigation).getByRole('link', { name: 'Inicio' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(navigation).getByRole('link', { name: 'Configuración' })).toHaveAttribute(
      'href',
      '/settings',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('link', { name: 'Ir al contenido' })).toHaveAttribute(
      'href',
      '#main-content',
    );
  });
});
