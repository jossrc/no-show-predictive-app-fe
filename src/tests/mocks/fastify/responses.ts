export interface MockResponse {
  status: number;
  /** Sin `requestId`: el transporte lo añade como haría Fastify. */
  body?: Record<string, unknown>;
}

export function mockOk(body: Record<string, unknown>, status = 200): MockResponse {
  return { status, body };
}

export function mockData(data: unknown, status = 200): MockResponse {
  return { status, body: { data } };
}

export function mockError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): MockResponse {
  return { status, body: { error: { code, message, ...(details ? { details } : {}) } } };
}
