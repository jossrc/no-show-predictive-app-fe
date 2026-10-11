import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from '@/app/(workspace)/page';

describe('Página inicial', () => {
  it('presenta la bienvenida y permite abrir reservas', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Frontend preparado' })).toBeVisible();
    expect(screen.getByText('En configuración')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Explorar reservas' })).toHaveAttribute(
      'href',
      '/reservations',
    );
  });
});
