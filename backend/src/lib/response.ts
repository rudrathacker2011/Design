// ============================================================
// YatraSetu — Standardized API Error Model
// Every API response error uses this shape.
// ============================================================

export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'STALE_DATA'
  | 'INSUFFICIENT_DATA'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ApiError {
  code: ErrorCode;
  message: string;
  field?: string;          // For VALIDATION_ERROR — which field failed
  retryable?: boolean;     // True if caller should retry
  requestId?: string;
}

export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: ApiError;
  requestId?: string;
  timestamp: string;
}

export function ok<T>(data: T, requestId?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export function fail(
  code: ErrorCode,
  message: string,
  opts?: { field?: string; retryable?: boolean; requestId?: string }
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      field: opts?.field,
      retryable: opts?.retryable ?? false,
      requestId: opts?.requestId,
    },
    requestId: opts?.requestId,
    timestamp: new Date().toISOString(),
  };
}
