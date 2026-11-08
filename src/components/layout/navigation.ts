import { OPERATIONAL_PATH, RESERVATIONS_PATH } from '@/lib/routes';

/**
 * Módulos operativos disponibles; el detalle se alcanza por navegación contextual.
 * `shortLabel` se usa en pantallas angostas. No se muestran módulos inexistentes.
 */
export const navigationItems = [
  { href: RESERVATIONS_PATH, label: 'Reservas', shortLabel: 'Reservas' },
  { href: OPERATIONAL_PATH, label: 'Optimización operativa', shortLabel: 'Optimización' },
] as const;
