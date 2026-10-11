import { CalendarDays, ChartNoAxesCombined, House, Settings2, Shapes } from 'lucide-react';

export const navigationItems = [
  { href: '/', label: 'Inicio', icon: House },
  { href: '/reservations', label: 'Reservas', icon: CalendarDays },
  { href: '/reports', label: 'Reportes', icon: ChartNoAxesCombined },
  { href: '/models', label: 'Modelos', icon: Shapes },
  { href: '/settings', label: 'Configuración', icon: Settings2 },
] as const;
