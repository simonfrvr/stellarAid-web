import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import ArtistCard from '@/components/ArtistCard'

describe('ArtistCard keyboard accessibility (#993)', () => {
  it('is a native button with a descriptive accessible name', () => {
    render(<ArtistCard id="artist-1" displayName="Elena" headline="Ceramic artist" />)

    const card = screen.getByRole('button', { name: 'Elena, Ceramic artist' })
    expect(card).toHaveAttribute('type', 'button')
    expect(card).toHaveAttribute('aria-roledescription', 'artist card')
  })

  it('can be reached with Tab and activated with Enter or Space', async () => {
    const user = userEvent.setup()
    const onActivate = vi.fn()
    render(<ArtistCard id="artist-1" displayName="Elena" onActivate={onActivate} />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Elena' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onActivate).toHaveBeenCalledWith('artist-1')

    await user.keyboard(' ')
    expect(onActivate).toHaveBeenCalledTimes(2)
  })
})
