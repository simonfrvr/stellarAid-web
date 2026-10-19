/** Maximum useful length for an image description before screen readers truncate it. */
export const MAX_ALT_TEXT_LENGTH = 125

export interface ImageAltTextInput {
  /** Alt text supplied by the user. Always wins when present. */
  altText?: string | null
  /** Caller-supplied description to use when the user has not written one. */
  fallbackAltText?: string | null
  /** Original file name, used as a last-resort description. */
  fileName?: string | null
  /** Upload field label, used when no better description exists. */
  label?: string | null
}

/** Collapses whitespace so an alt attribute never carries stray newlines. */
export function normalizeAltText(value: string | null | undefined): string {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

/**
 * Turns a file name into a readable description. Random ids and hashes are
 * rejected because announcing "a1b2c3d4" is worse than a generic fallback.
 */
export function altTextFromFileName(fileName: string | null | undefined): string {
  if (!fileName) return ''

  const baseName = fileName.split(/[\\/]/).pop() ?? ''
  const withoutExtension = baseName.replace(/\.[a-z0-9]+$/i, '')
  let decoded = withoutExtension
  try {
    decoded = decodeURIComponent(withoutExtension)
  } catch {
    // Malformed percent-encoding: keep the raw name rather than throwing.
  }

  const words = decoded.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (words.length < 3 || !/[a-z]/i.test(words)) return ''
  // Skip UUIDs, content hashes and other machine-generated identifiers.
  if (/^[a-f0-9]{8,}$/i.test(words.replace(/\s+/g, ''))) return ''

  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * Resolves the description announced for an uploaded image.
 *
 * Order: the user's own words, an explicit fallback from the parent, a readable
 * file name, the upload field label, then a final generic description. The
 * generic value is only reached when every other source is empty.
 */
export function getImageAltText({
  altText,
  fallbackAltText,
  fileName,
  label,
}: ImageAltTextInput): string {
  return (
    normalizeAltText(altText) ||
    normalizeAltText(fallbackAltText) ||
    altTextFromFileName(fileName) ||
    normalizeAltText(label) ||
    'Uploaded image'
  )
}

/** Derives a readable file name from a public image URL, when one exists. */
export function fileNameFromUrl(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const parsed = new URL(url, 'https://placeholder.invalid')
    return parsed.pathname.split('/').pop() ?? ''
  } catch {
    return ''
  }
}
