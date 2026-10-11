const LOOPBACK_HOSTNAMES = new Set(['127.0.0.1', 'localhost', '[::1]']);

/**
 * Indica si la cabecera Host apunta a loopback. Es una defensa adicional (p. ej. frente a
 * DNS rebinding); la protección principal es que el servidor escuche solo en 127.0.0.1.
 */
export function isLoopbackHost(hostHeader: string | null): boolean {
  if (!hostHeader) return false;
  const hostname = hostHeader.startsWith('[')
    ? hostHeader.slice(0, hostHeader.indexOf(']') + 1)
    : (hostHeader.split(':')[0] ?? '');
  return LOOPBACK_HOSTNAMES.has(hostname.toLowerCase());
}
