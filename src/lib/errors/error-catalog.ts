import type { ApiError } from '@/lib/api/result';

export interface ErrorPresentation {
  title: string;
  description: string;
  /** El usuario puede reintentar manualmente con posibilidades razonables de éxito. */
  retryable: boolean;
}

const TECHNICAL_SUPPORT = 'Si el problema continúa, contacta al equipo técnico.';

const SERVICE_DOWN: ErrorPresentation = {
  title: 'No pudimos cargar la información',
  description: 'El servicio no respondió. Intenta nuevamente.',
  retryable: true,
};

const ESTIMATION_TECHNICAL: ErrorPresentation = {
  title: 'No se pudo calcular la estimación',
  description: `Ocurrió un problema técnico con el servicio de estimaciones. ${TECHNICAL_SUPPORT}`,
  retryable: false,
};

/**
 * Mensajes en español claro para los códigos del contrato. Los códigos originales se conservan
 * en `ApiError` y solo se consultan en el diagnóstico de desarrollo. Los estados funcionales
 * esperados (p. ej. NOT_SCORABLE) se presentan como limitaciones, no como fallos.
 */
const CATALOG: Readonly<Record<string, ErrorPresentation>> = {
  REQUEST_VALIDATION_ERROR: {
    title: 'No pudimos completar la consulta',
    description: `Algún dato de la búsqueda no es válido. Revisa los filtros. ${TECHNICAL_SUPPORT}`,
    retryable: false,
  },
  UNAUTHORIZED: {
    title: 'No pudimos acceder al servicio',
    description: `La aplicación no tiene acceso autorizado a la información. ${TECHNICAL_SUPPORT}`,
    retryable: false,
  },
  RESERVATION_NOT_FOUND: {
    title: 'No encontramos esta reserva',
    description: 'Verifica el identificador o vuelve al listado.',
    retryable: false,
  },
  RISK_POLICY_UNAVAILABLE: {
    title: 'Clasificación de riesgo no disponible',
    description: 'Los niveles de riesgo todavía no están habilitados.',
    retryable: false,
  },
  NOT_SCORABLE: {
    title: 'Estimación no disponible',
    description: 'No contamos con información suficiente para calcularla.',
    retryable: false,
  },
  EXPLANATION_SNAPSHOT_UNAVAILABLE: {
    title: 'Explicación no disponible',
    description: 'No podemos mostrar los factores de esta cita con la información actual.',
    retryable: false,
  },
  HISTORY_CUTOFF_UNAVAILABLE: {
    title: 'Historial no disponible',
    description: 'No podemos mostrar el historial de esta cita con la información actual.',
    retryable: false,
  },
  FEATURE_VERSION_MISMATCH: ESTIMATION_TECHNICAL,
  INVALID_FEATURES: ESTIMATION_TECHNICAL,
  ML_CONTRACT_VIOLATION: ESTIMATION_TECHNICAL,
  ML_CREDENTIAL_REJECTED: ESTIMATION_TECHNICAL,
  ML_NOT_CONFIGURED: {
    title: 'Estimaciones no habilitadas',
    description: `El servicio de estimaciones no está configurado. ${TECHNICAL_SUPPORT}`,
    retryable: false,
  },
  PAYLOAD_TOO_LARGE: {
    title: 'No pudimos completar la solicitud',
    description: `La solicitud supera el tamaño permitido. ${TECHNICAL_SUPPORT}`,
    retryable: false,
  },
  INVALID_PERIOD: {
    title: 'Período no válido',
    description:
      'La fecha final debe ser igual o posterior a la inicial y el rango no puede superar 92 días.',
    retryable: false,
  },
  INVALID_CURSOR: {
    title: 'Esta página ya no está disponible',
    description: 'Los resultados cambiaron desde la última consulta. Vuelve a la primera página.',
    retryable: false,
  },
  UNKNOWN_CLINIC: {
    title: 'No encontramos esa sede',
    description: 'Verifica el número de sede o quita el filtro.',
    retryable: false,
  },
  ML_RATE_LIMITED: {
    title: 'Demasiadas solicitudes',
    description: 'Espera unos segundos e inténtalo nuevamente.',
    retryable: true,
  },
  SOURCE_DATA_UNAVAILABLE: {
    title: 'No pudimos cargar la información',
    description: 'El servicio de reservas no respondió. Intenta nuevamente.',
    retryable: true,
  },
  ML_UNAVAILABLE: {
    title: 'Estimaciones no disponibles por ahora',
    description: 'El servicio de estimaciones no está disponible. Intenta más tarde.',
    retryable: true,
  },
  ML_MODEL_UNAVAILABLE: {
    title: 'Modelo no disponible por ahora',
    description: 'El modelo elegido no está disponible en este momento. Intenta más tarde.',
    retryable: true,
  },
  ML_INFERENCE_FAILED: {
    title: 'No se completó la estimación',
    description: 'El servicio no pudo calcular la estimación. Intenta nuevamente.',
    retryable: true,
  },
  ML_CIRCUIT_OPEN: {
    title: 'Estimaciones en pausa',
    description:
      'El servicio de estimaciones se pausó temporalmente por fallos recientes. Intenta en unos minutos.',
    retryable: true,
  },
  PERSISTENCE_UNAVAILABLE: {
    title: 'Estimaciones no disponibles por ahora',
    description: 'No podemos consultar las estimaciones en este momento. Intenta nuevamente.',
    retryable: true,
  },
  EXPLANATION_UNAVAILABLE: {
    title: 'Factores no disponibles por ahora',
    description: 'No podemos consultar los factores en este momento. Intenta nuevamente.',
    retryable: true,
  },
  ML_TIMEOUT: {
    title: 'No se completó la estimación',
    description: 'El servicio tardó demasiado en responder. No podemos confirmar el resultado.',
    retryable: true,
  },
  NETWORK_ERROR: SERVICE_DOWN,
  TIMEOUT: {
    title: 'El servicio tardó demasiado',
    description: 'No podemos confirmar el resultado. Intenta nuevamente.',
    retryable: true,
  },
  INVALID_INPUT: {
    title: 'No pudimos completar la solicitud',
    description: 'Los datos enviados no son válidos. Actualiza la página e intenta nuevamente.',
    retryable: false,
  },
  INVALID_RESPONSE: {
    title: 'No pudimos interpretar la información',
    description: `El servicio respondió de forma inesperada. ${TECHNICAL_SUPPORT}`,
    retryable: false,
  },
};

function fallbackPresentation(error: ApiError): ErrorPresentation {
  if (error.status !== null && error.status >= 500) return SERVICE_DOWN;
  return {
    title: 'No pudimos completar la solicitud',
    description: `Intenta nuevamente. ${TECHNICAL_SUPPORT}`,
    retryable: false,
  };
}

export function describeApiError(error: ApiError): ErrorPresentation {
  if (error.kind === 'configuration') {
    // El detalle (variables de entorno) solo se muestra en el diagnóstico de desarrollo.
    return {
      title: 'Aplicación sin configurar',
      description: `La aplicación no está configurada para consultar la información. ${TECHNICAL_SUPPORT}`,
      retryable: false,
    };
  }
  return CATALOG[error.code] ?? fallbackPresentation(error);
}
