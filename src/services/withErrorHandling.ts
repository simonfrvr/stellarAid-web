import { toApiError } from './http'

/** An asynchronous API operation, e.g. a service call or route handler. */
export type ApiHandler<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>

/**
 * Wraps an API operation so every rejection is an `ApiError`.
 *
 * The HTTP interceptor already normalizes Axios failures. This wrapper covers
 * service functions and route handlers that also throw plain `Error`s, and
 * ensures callers only ever have to handle the shared
 * `{ code, message, statusCode, timestamp }` contract.
 */
export function withErrorHandling<TArgs extends unknown[], TResult>(
  handler: ApiHandler<TArgs, TResult>,
): ApiHandler<TArgs, TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await handler(...args)
    } catch (error) {
      throw toApiError(error)
    }
  }
}
