import { type NextRequest, NextResponse } from 'next/server';

import { isLoopbackHost } from '@/lib/security/loopback-host';

/**
 * Sprint 01 no tiene autenticación de usuarios finales (HU-21/HU-22 son posteriores).
 * Mientras tanto, la aplicación solo atiende solicitudes dirigidas a loopback.
 */
export function proxy(request: NextRequest) {
  if (isLoopbackHost(request.headers.get('host'))) return NextResponse.next();
  return new NextResponse('Acceso restringido a 127.0.0.1 durante el desarrollo local.', {
    status: 403,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
