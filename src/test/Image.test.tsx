import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import ImageUpload from '@/components/ImageUpload'
import { altTextFromFileName, getImageAltText } from '@/components/ImageUpload/imageAlt'

describe('image alt text resolution (#999)', () => {
  it('prefers the description the user wrote', () => {
    expect(
      getImageAltText({
        altText: '  A blue ceramic bowl on a wooden table  ',
        fallbackAltText: 'Fallback',
        fileName: 'random-hash.png',
        label: 'Portfolio image',
      }),
    ).toBe('A blue ceramic bowl on a wooden table')
  })

  it('uses a readable file name before falling back to the field label', () => {
    expect(altTextFromFileName('blue-ceramic_bowl.jpg')).toBe('Blue ceramic bowl')
    expect(
      getImageAltText({
        fileName: 'blue-ceramic_bowl.jpg',
        label: 'Upload artwork',
      }),
    ).toBe('Blue ceramic bowl')
  })

  it('ignores machine-generated file names and never returns an empty alt', () => {
    expect(altTextFromFileName('9f86d081884c7d659a2feaa0c55ad015.png')).toBe('')
    expect(altTextFromFileName('a1b2c3d4.jpg')).toBe('')
    expect(getImageAltText({})).toBe('Uploaded image')
  })
})

describe('ImageUpload alt text field (#999)', () => {
  it('lets the user describe an image and reflects that description on the preview', async () => {
    const user = userEvent.setup()
    const onAltTextChange = vi.fn()
    render(
      <ImageUpload
        label="Artwork image"
        currentImage="https://cdn.example.com/blue-ceramic-bowl.jpg"
        onFileSelect={vi.fn()}
        onAltTextChange={onAltTextChange}
      />,
    )

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Blue ceramic bowl')

    const field = screen.getByLabelText(/image description/i)
    await user.type(field, 'A blue ceramic bowl with a matte glaze')

    expect(onAltTextChange).toHaveBeenLastCalledWith('A blue ceramic bowl with a matte glaze')
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'A blue ceramic bowl with a matte glaze')
  })

  it('uses a caller-supplied fallback when the field is blank', () => {
    render(
      <ImageUpload
        label="Profile photo"
        currentImage="https://cdn.example.com/a1b2c3d4.jpg"
        fallbackAltText="Elena, the artist"
        onFileSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Elena, the artist')
  })

  it('enforces the alt text length limit', () => {
    render(
      <ImageUpload
        label="Profile photo"
        currentImage="https://cdn.example.com/elena.jpg"
        maxAltTextLength={20}
        onFileSelect={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/image description/i)).toHaveAttribute('maxLength', '20')
  })
})
