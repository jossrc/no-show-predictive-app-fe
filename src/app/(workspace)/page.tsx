import { redirect } from 'next/navigation';

/** Sprint 01 se centra en reservas: la raíz redirige al listado. */
export default function HomePage() {
  redirect('/reservations');
}
