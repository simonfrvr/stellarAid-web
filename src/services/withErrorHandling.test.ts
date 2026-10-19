import { describe, expect, it } from 'vitest'
import { isAPIError, type APIError } from '@/types'
import { ApiError, isApiError, toApiError } from './http'
import { withErrorHandling } from './withErrorHandling'

async function capture(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
    return undefined
  } catch (error) {
    return error
  }
}

describe('APIError contract (#998)', () => {
  it('serializes every ApiError with the same four core fields', async () => {
    const error = await capture(
      Promise.reject(new ApiError(404, 'RESOURCE_NOT_FOUND', 'Not found')),
    )

    expect(isApiError(error)).toBe(true)
    expect(isAPIError(error)).toBe(true)

    const json = (error as ApiError).toJSON()
    expect(Object.keys(json).sort()).toEqual(['code', 'message', 'statusCode', 'timestamp'])
    expect(json).toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
      message: 'Not found',
      statusCode: 404,
      timestamp: expect.any(String),
    })
    expect(() => new Date(json.timestamp).toISOString()).not.toThrow()
  })

  it('normalizes an unknown thrown value into the same shape', async () => {
    const handler = withErrorHandling(async () => {
      throw new Error('database connection string leaked')
    })

    const error = await capture(handler())

    expect(isAPIError(error)).toBe(true)
    expect(error).toMatchObject({
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
      statusCode: null,
      timestamp: expect.any(String),
    })
    expect(toApiError(error)).toBe(error)
  })

  it('keeps successful return values untouched', async () => {
    const handler = withErrorHandling(async (value: number) => value * 2)

    await expect(handler(21)).resolves.toBe(42)
  })

  it('turns a plain object into a valid contract instead of leaking it', () => {
    const error = toApiError({ code: 'SOMETHING', statusCode: 500 })

    expect(error).toBeInstanceOf(ApiError)
    expect(isAPIError(error)).toBe(true)
    expect(error.toJSON()).toMatchObject({
      code: 'UNKNOWN_ERROR',
      statusCode: null,
    })
  })

  it('is assignable to the shared APIError type', () => {
    const error: APIError = new ApiError(422, 'VALIDATION_FAILED', 'Check the fields', {
      email: 'Enter a valid email.',
    })

    expect(error.fieldErrors).toEqual({ email: 'Enter a valid email.' })
    expect(error.statusCode).toBe(422)
  })
})
