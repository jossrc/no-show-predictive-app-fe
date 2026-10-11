import type { ApiError } from '@/lib/api/result';

export interface ErrorPresentation {
  title: string;
  description: string;
  /** El usuario puede reintentar manualmente con posibilidades razonables de éxito. */
  retryable: boolean;
}

/**
 * Mensajes en español para los códigos documentados del contrato Sprint 01. No revelan
 * credenciales, stacks ni detalles internos. Los códigos funcionales esperados
 * (p. ej. NOT_SCORABLE) se presentan como estados, no como fallos inesperados.
 */
const CATALOG: Readonly<Record<string, ErrorPresentation>> = {
  REQUEST_VALIDATION_ERROR: {
    title: 'Solicitud inválida',
    description: 'Alguno de los parámetros enviados no cumple el contrato del servicio.',
    retryable: false,
  },
  UNAUTHORIZED: {
    title: 'Acceso interno no autorizado',
    description:
      'El servidor del frontend no pudo autenticarse ante el backend. Revisa la credencial interna configurada en el servidor.',
    retryable: false,
  },
  RESERVATION_NOT_FOUND: {
    title: 'Reserva no encontrada',
    description: 'La reserva no existe o no está disponible para esta consulta.',
    retryable: false,
  },
  RISK_POLICY_UNAVAILABLE: {
    title: 'Política de riesgo no validada',
    description: 'Los niveles de riesgo están pendientes de validación científica.',
    retryable: false,
  },
  NOT_SCORABLE: {
    title: 'Reserva no evaluable',
    description: 'No es posible generar una predicción con la información disponible.',
    retryable: false,
  },
  EXPLANATION_SNAPSHOT_UNAVAILABLE: {
    title: 'Explicación no disponible',
    description: 'No se dispone de información suficiente para explicar esta estimación.',
    retryable: false,
  },
  HISTORY_CUTOFF_UNAVAILABLE: {
    title: 'Historial temporal no disponible',
    description: 'No se pudo establecer el corte temporal del historial para esta reserva.',
    retryable: false,
  },
  FEATURE_VERSION_MISMATCH: {
    title: 'Incompatibilidad de versión ML',
    description: 'La versión de características no coincide con la esperada por el modelo.',
    retryable: false,
  },
  PAYLOAD_TOO_LARGE: {
    title: 'Solicitud demasiado grande',
    description: 'La solicitud excede el límite permitido por el backend.',
    retryable: false,
  },
  INVALID_PERIOD: {
    title: 'Período inválido',
    description:
      'Revisa las fechas: la final debe ser igual o posterior a la inicial y el rango no puede superar 92 días.',
    retryable: false,
  },
  INVALID_CURSOR: {
    title: 'Cursor de paginación inválido',
    description:
      'La página solicitada ya no corresponde a los filtros actuales. Vuelve a la primera página.',
    retryable: false,
  },
  UNKNOWN_CLINIC: {
    title: 'Clínica desconocida',
    description: 'El identificador de clínica no existe en la fuente de datos.',
    retryable: false,
  },
  INVALID_FEATURES: {
    title: 'Características inválidas',
    description: 'El modelo rechazó las características construidas para esta reserva.',
    retryable: false,
  },
  ML_RATE_LIMITED: {
    title: 'Servicio de predicción saturado',
    description:
      'El servicio ML alcanzó su límite temporal de solicitudes. Espera unos segundos antes de reintentar.',
    retryable: true,
  },
  ML_CONTRACT_VIOLATION: {
    title: 'Respuesta ML incompatible',
    description:
      'El servicio ML respondió fuera del contrato acordado. Se requiere revisión técnica.',
    retryable: false,
  },
  SOURCE_DATA_UNAVAILABLE: {
    title: 'Fuente de reservas no disponible',
    description: 'No fue posible consultar la fuente de datos de reservas.',
    retryable: true,
  },
  ML_UNAVAILABLE: {
    title: 'Servicio ML no disponible',
    description: 'El modelo no está disponible en este momento.',
    retryable: true,
  },
  ML_NOT_CONFIGURED: {
    title: 'Servicio ML no configurado',
    description: 'El backend no tiene configurado el acceso al servicio de predicción.',
    retryable: false,
  },
  ML_MODEL_UNAVAILABLE: {
    title: 'Modelo no disponible',
    description: 'El modelo solicitado no está disponible en el servicio ML.',
    retryable: true,
  },
  ML_INFERENCE_FAILED: {
    title: 'La inferencia no se completó',
    description: 'El servicio ML no pudo completar la estimación.',
    retryable: true,
  },
  ML_CIRCUIT_OPEN: {
    title: 'Servicio ML en pausa',
    description:
      'Se detectaron fallos consecutivos; el backend pausó temporalmente las llamadas al servicio ML.',
    retryable: true,
  },
  ML_CREDENTIAL_REJECTED: {
    title: 'Credencial interna ML rechazada',
    description:
      'El servicio ML rechazó la credencial del backend. Se requiere revisión de configuración.',
    retryable: false,
  },
  PERSISTENCE_UNAVAILABLE: {
    title: 'Persistencia predictiva no disponible',
    description: 'No está disponible el almacenamiento de predicciones.',
    retryable: true,
  },
  EXPLANATION_UNAVAILABLE: {
    title: 'Explicaciones SHAP no disponibles',
    description: 'El servicio de explicaciones no está disponible en este momento.',
    retryable: true,
  },
  ML_TIMEOUT: {
    title: 'Tiempo de espera agotado',
    description:
      'El servicio ML no respondió a tiempo. No se confirmó el resultado de la operación.',
    retryable: true,
  },
  NETWORK_ERROR: {
    title: 'Sin conexión con el backend',
    description: 'No se pudo contactar con el servicio. Verifica que el backend esté en ejecución.',
    retryable: true,
  },
  TIMEOUT: {
    title: 'Tiempo de espera agotado',
    description: 'El backend no respondió a tiempo. No se confirmó el resultado de la operación.',
    retryable: true,
  },
  INVALID_INPUT: {
    title: 'Parámetros no válidos',
    description:
      'La solicitud fue rechazada por el servidor del frontend antes de contactar al backend.',
    retryable: false,
  },
  INVALID_RESPONSE: {
    title: 'Respuesta incompatible',
    description: 'La respuesta del backend no coincide con el contrato esperado por el frontend.',
    retryable: false,
  },
};

function fallbackPresentation(error: ApiError): ErrorPresentation {
  if (error.status !== null && error.status >= 500) {
    return {
      title: 'Servicio no disponible',
      description: 'El backend no pudo atender la solicitud en este momento.',
      retryable: true,
    };
  }
  return {
    title: 'Solicitud rechazada',
    description: 'El backend rechazó la solicitud.',
    retryable: false,
  };
}

export function describeApiError(error: ApiError): ErrorPresentation {
  if (error.kind === 'configuration') {
    return { title: 'Configuración incompleta', description: error.message, retryable: false };
  }
  return CATALOG[error.code] ?? fallbackPresentation(error);
}
