export interface ArtistCardProps {
  id: string
  displayName: string
  headline?: string
  avatarUrl?: string
  onActivate?: (id: string) => void
  className?: string
}

/**
 * Focusable artist card (#993).
 *
 * A native `<button>` supplies Tab focus and Enter/Space activation, and is
 * valid on its own instead of pretending to be a `gridcell` without a grid.
 */
export default function ArtistCard({
  id,
  displayName,
  headline,
  avatarUrl,
  onActivate,
  className = '',
}: ArtistCardProps) {
  const activate = () => onActivate?.(id)

  return (
    <button
      type="button"
      aria-roledescription="artist card"
      aria-label={headline ? `${displayName}, ${headline}` : displayName}
      onClick={activate}
      className={`w-full cursor-pointer rounded-card border border-line bg-surface p-4 text-left shadow-card outline-none transition hover:shadow-elevated focus-visible:shadow-focus-ring ${className}`}
    >
      <span className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${displayName} avatar`}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-body font-semibold text-muted"
          >
            {displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-body font-semibold text-foreground">
            {displayName}
          </span>
          {headline ? (
            <span className="block truncate text-caption text-muted">{headline}</span>
          ) : null}
        </span>
      </span>
    </button>
  )
}
