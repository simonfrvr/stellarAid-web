/**
 * The one error shape every API call rejects with.
 *
 * Consumers can rely on these four fields regardless of whether the failure
 * came from the network, an HTTP status or a thrown JavaScript error. Optional
 * fields carry validation/request context without changing the core contract.
 */
export interface APIError {
  /** Stable, machine-readable error code (e.g. `AUTH_TOKEN_EXPIRED`). */
  code: string
  /** User-facing message that is safe to render. */
  message: string
  /** HTTP status, or `null` when no response was received. */
  statusCode: number | null
  /** ISO-8601 timestamp for logs and support reports. */
  timestamp: string
  /** Per-field validation messages, keyed by field name. */
  fieldErrors?: Record<string, string>
  /** Server request id, when one was returned. */
  requestId?: string | null
}

/** The minimal wire shape accepted from an API error response body. */
export interface APIErrorDto {
  code?: string
  message?: string
  error?: string
  statusCode?: number
  timestamp?: string
  requestId?: string
}

/** Structural guard usable on either side of a serialization boundary. */
export function isAPIError(value: unknown): value is APIError {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<APIError>
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string' &&
    (typeof candidate.statusCode === 'number' || candidate.statusCode === null) &&
    typeof candidate.timestamp === 'string'
  )
}

/** Builds a well-formed contract object from partial input. */
export function createAPIError(
  input: Pick<APIError, 'code' | 'message'> & Partial<Omit<APIError, 'code' | 'message'>>,
): APIError {
  return {
    code: input.code,
    message: input.message,
    statusCode: input.statusCode ?? null,
    timestamp: input.timestamp ?? new Date().toISOString(),
    ...(input.fieldErrors ? { fieldErrors: input.fieldErrors } : {}),
    ...(input.requestId !== undefined ? { requestId: input.requestId } : {}),
  }
}
