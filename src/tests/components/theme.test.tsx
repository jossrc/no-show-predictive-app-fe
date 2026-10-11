import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ThemeProvider } from '@/providers/ThemeProvider';

describe('Selector de tema', () => {
  it('alterna el tema con el teclado y expone su estado accesible', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    const button = screen.getByRole('button', { name: 'Cambiar tema' });
    await waitFor(() => expect(document.documentElement).toHaveClass('light'));
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard(' ');
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard(' ');
    await waitFor(() => expect(document.documentElement).toHaveClass('light'));
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });
});
