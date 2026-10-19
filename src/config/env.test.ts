import { describe, expect, it } from 'vitest'
import { REQUIRED_ENV_KEYS, validateEnv, type RawEnv } from './env'

const validEnv: RawEnv = {
  VITE_API_URL: 'https://api.lumora.example',
  VITE_STELLAR_NETWORK: 'mainnet',
  VITE_APP_URL: 'https://lumora.example',
}

describe('environment validation (#997)', () => {
  it('accepts a complete configuration', () => {
    const result = validateEnv(validEnv)

    expect(result.configError).toBeNull()
    expect(result.missing).toEqual([])
    expect(result.invalid).toEqual([])
    expect(result.env.VITE_API_URL).toBe('https://api.lumora.example')
    expect(result.env.VITE_STELLAR_NETWORK).toBe('mainnet')
  })

  it.each(REQUIRED_ENV_KEYS)('fails closed when %s is missing', (key) => {
    const raw = { ...validEnv, [key]: undefined }
    const result = validateEnv(raw)

    expect(result.configError).toContain(key)
    expect(result.missing).toContain(key)
    // A fallback keeps the error screen renderable, but the configuration is
    // still reported as unusable.
    expect(result.env.VITE_API_URL).toBeTruthy()
    expect(result.env.VITE_STELLAR_NETWORK).toBeTruthy()
    expect(result.env.VITE_APP_URL).toBeTruthy()
  })

  it('treats an empty or whitespace value as missing', () => {
    const result = validateEnv({ ...validEnv, VITE_API_URL: '   ' })

    expect(result.missing).toEqual(['VITE_API_URL'])
    expect(result.configError).toContain('Missing variables')
  })

  it('reports malformed values instead of throwing before the error screen mounts', () => {
    const result = validateEnv({
      ...validEnv,
      VITE_API_URL: 'not-a-url',
      VITE_STELLAR_NETWORK: 'devnet',
    })

    expect(result.configError).toContain('Invalid values')
    expect(result.configError).toContain('VITE_API_URL')
    expect(result.configError).toContain('VITE_STELLAR_NETWORK')
    expect(result.invalid.length).toBeGreaterThanOrEqual(2)
  })

  it('does not fail the app for an invalid optional feature flag', () => {
    const result = validateEnv({ ...validEnv, VITE_FF_MESSAGING: 'sometimes' })

    expect(result.configError).toBeNull()
    expect(result.env.VITE_FF_MESSAGING).toBeUndefined()
  })
})
