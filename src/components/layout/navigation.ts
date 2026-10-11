import { CalendarDays } from 'lucide-react';

/**
 * Sprint 01 se centra en reservas; el detalle se alcanza por navegación contextual.
 * Los módulos de sprints posteriores no se muestran como funcionalidades disponibles.
 */
export const navigationItems = [
  { href: '/reservations', label: 'Reservas', icon: CalendarDays },
] as const;
