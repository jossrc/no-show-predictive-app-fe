import { redirect } from 'next/navigation';

/** Reservas es el único módulo operativo: la raíz redirige al listado. */
export default function HomePage() {
  redirect('/reservations');
}
