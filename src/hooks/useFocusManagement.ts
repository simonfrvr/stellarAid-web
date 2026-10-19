import { useCallback, useRef, useState, type KeyboardEvent, type RefObject } from 'react'

export interface UseFocusManagementOptions {
  /** Number of items in the grid. */
  itemCount: number
  /** Column count used for Up/Down navigation. Defaults to 1 (list). */
  columns?: number
  /** Called when the focused index changes via keyboard. */
  onIndexChange?: (index: number) => void
  /** Called when Enter/Space activates the focused item. */
  onActivate?: (index: number) => void
  /** When true, Home/End jump to first/last item. Default true. */
  homeEnd?: boolean
}

export interface UseFocusManagementResult {
  /** Currently focused item index. */
  focusedIndex: number
  /** Attach to the grid container. */
  containerRef: RefObject<HTMLElement | null>
  /** Bind to each cell: `{...getItemProps(index)}`. */
  getItemProps: (index: number) => {
    tabIndex: number
    'data-focus-index': number
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
    onFocus: () => void
  }
  /** Programmatically move focus to an index. */
  focusIndex: (index: number) => void
}

function clampIndex(index: number, itemCount: number): number {
  return Math.max(0, Math.min(itemCount - 1, index))
}

/**
 * Keyboard focus management for grid/list collections (#935, #993).
 *
 * - Only the active cell is in the tab order (`tabIndex={0}`).
 * - Arrow keys move focus between cells (roving tabindex).
 * - Enter / Space activates the focused item.
 * - A shrinking list can never leave focus on a stale index.
 */
export function useFocusManagement(options: UseFocusManagementOptions): UseFocusManagementResult {
  const { itemCount, columns = 1, onIndexChange, onActivate, homeEnd = true } = options

  // State, not a ref: the roving tabindex must re-render when focus moves.
  const [focusedIndex, setFocusedIndex] = useState(0)
  const containerRef = useRef<HTMLElement | null>(null)
  const safeColumns = Math.max(1, Math.floor(columns))
  // Deriving the active index keeps a shrinking list from leaving focus on a
  // stale index without a state-syncing effect.
  const activeIndex = itemCount === 0 ? 0 : clampIndex(focusedIndex, itemCount)

  const moveTo = useCallback(
    (index: number) => {
      if (itemCount === 0) return
      const next = clampIndex(index, itemCount)
      setFocusedIndex(next)
      onIndexChange?.(next)
      const root = containerRef.current
      const el = root?.querySelector<HTMLElement>(`[data-focus-index="${next}"]`)
      el?.focus()
    },
    [itemCount, onIndexChange],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (itemCount === 0) return
      const current = activeIndex
      let next: number

      switch (event.key) {
        case 'ArrowRight':
          next = Math.min(itemCount - 1, current + 1)
          break
        case 'ArrowLeft':
          next = Math.max(0, current - 1)
          break
        case 'ArrowDown':
          next = Math.min(itemCount - 1, current + safeColumns)
          break
        case 'ArrowUp':
          next = Math.max(0, current - safeColumns)
          break
        case 'Home':
          if (!homeEnd) return
          next = 0
          break
        case 'End':
          if (!homeEnd) return
          next = itemCount - 1
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          onActivate?.(current)
          return
        default:
          return
      }

      // Keep arrow keys from scrolling the page even at a grid boundary.
      event.preventDefault()
      if (next !== current) moveTo(next)
    },
    [activeIndex, homeEnd, itemCount, moveTo, onActivate, safeColumns],
  )

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === activeIndex ? 0 : -1,
      'data-focus-index': index,
      onKeyDown,
      onFocus: () => {
        setFocusedIndex(index)
        onIndexChange?.(index)
      },
    }),
    [activeIndex, onIndexChange, onKeyDown],
  )

  return {
    focusedIndex: activeIndex,
    containerRef,
    getItemProps,
    focusIndex: moveTo,
  }
}
