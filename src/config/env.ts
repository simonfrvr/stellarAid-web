import { z } from 'zod'

/** Supported Stellar networks. */
export const stellarNetworkSchema = z.enum(['testnet', 'mainnet'])

/**
 * Runtime environment configuration. All variables use the `VITE_` prefix and are
 * read from `import.meta.env` (see `.env.example`).
 *
 * Required variables deliberately have no defaults: silently pointing a
 * production build at `localhost` is worse than refusing to boot (#997).
 */
const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_STELLAR_NETWORK: stellarNetworkSchema,
  VITE_APP_URL: z.url(),
  // Optional feature-flag overrides ("true"/"false"); anything else counts as unset.
  VITE_FF_MESSAGING: z.stringbool().optional().catch(undefined),
  VITE_FF_NOTIFICATIONS: z.stringbool().optional().catch(undefined),
  VITE_FF_ADVANCED_FILTERS: z.stringbool().optional().catch(undefined),
})

export type StellarNetwork = z.infer<typeof stellarNetworkSchema>
export type AppEnv = z.infer<typeof envSchema>

/** Variables the app cannot run without, in any environment. */
export const REQUIRED_ENV_KEYS = ['VITE_API_URL', 'VITE_STELLAR_NETWORK', 'VITE_APP_URL'] as const

type EnvKey = (typeof REQUIRED_ENV_KEYS)[number]
type FlagEnvKey = 'VITE_FF_MESSAGING' | 'VITE_FF_NOTIFICATIONS' | 'VITE_FF_ADVANCED_FILTERS'
export type RawEnv = Partial<Record<EnvKey | FlagEnvKey, string | undefined>>

export interface EnvValidationResult {
  /** Always safe to read: missing/invalid required values fall back here. */
  env: AppEnv
  /** Human-readable problem summary, or `null` when everything is valid. */
  configError: string | null
  /** Required keys that were absent or blank. */
  missing: EnvKey[]
  /** Zod messages for values that were present but malformed. */
  invalid: string[]
}

/**
 * Values used only so the config error screen can render. The application is
 * never mounted when `configError` is set, so these are not runtime defaults.
 */
const FALLBACK_ENV: AppEnv = {
  VITE_API_URL: 'http://localhost:4000',
  VITE_STELLAR_NETWORK: 'testnet',
  VITE_APP_URL: 'http://localhost:5173',
}

/**
 * Single access point for the raw `import.meta.env` values. No other module in
 * the app should touch `import.meta.env` directly.
 */
function readRawEnv(): RawEnv {
  return {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_STELLAR_NETWORK: import.meta.env.VITE_STELLAR_NETWORK,
    VITE_APP_URL: import.meta.env.VITE_APP_URL,
    VITE_FF_MESSAGING: import.meta.env.VITE_FF_MESSAGING,
    VITE_FF_NOTIFICATIONS: import.meta.env.VITE_FF_NOTIFICATIONS,
    VITE_FF_ADVANCED_FILTERS: import.meta.env.VITE_FF_ADVANCED_FILTERS,
  }
}

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === ''
}

/**
 * Validates a raw environment object without touching `import.meta.env`, which
 * makes the failure modes testable and keeps the startup path deterministic.
 */
export function validateEnv(raw: RawEnv): EnvValidationResult {
  const missing = REQUIRED_ENV_KEYS.filter((key) => isBlank(raw[key]))
  const parsed = envSchema.safeParse(raw)

  if (missing.length === 0 && parsed.success) {
    return { env: parsed.data, configError: null, missing: [], invalid: [] }
  }

  const invalid = parsed.success
    ? []
    : parsed.error.issues
        // Missing keys are already listed above; don't report them twice as
        // "expected string, received undefined".
        .filter((issue) => !missing.includes(issue.path[0] as EnvKey))
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)

  const details = [
    missing.length > 0
      ? `Missing variables:\n${missing.map((key) => `  - ${key}`).join('\n')}`
      : '',
    invalid.length > 0
      ? `Invalid values:\n${invalid.map((issue) => `  - ${issue}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const configError = [
    'Invalid environment configuration.',
    details,
    'Set every required variable in .env (see .env.example), then restart the app.',
  ].join('\n\n')

  return { env: FALLBACK_ENV, configError, missing, invalid }
}

function loadEnv(): EnvValidationResult {
  const result = validateEnv(readRawEnv())
  if (result.configError) console.error(`[config:env] ${result.configError}`)
  return result
}

export const { env, configError } = loadEnv()
