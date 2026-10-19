import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import PortfolioGrid from '@/components/PortfolioGrid'

const items = [
  { id: '1', title: 'Nebula', category: 'Digital' },
  { id: '2', title: 'Harbor', category: 'Oil' },
  { id: '3', title: 'Cascade', category: 'Photo' },
]

const sixItems = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1),
  title: `Work ${index + 1}`,
  category: 'Digital',
}))

describe('PortfolioGrid keyboard accessibility (#993)', () => {
  it('exposes role=grid and role=gridcell with aria labels', () => {
    render(<PortfolioGrid items={items} label="Artist portfolio" />)

    expect(screen.getByRole('grid', { name: 'Artist portfolio' })).toBeInTheDocument()
    const cells = screen.getAllByRole('gridcell')
    expect(cells).toHaveLength(3)
    expect(cells[0]).toHaveAttribute('aria-roledescription', 'portfolio item')
    expect(cells[0]).toHaveAccessibleName(/Nebula/)
  })

  it('groups cells into real rows with the correct dimensions', () => {
    render(<PortfolioGrid items={[...items, { id: '4', title: 'Dune' }]} columns={3} />)

    const grid = screen.getByRole('grid')
    expect(grid).toHaveAttribute('aria-rowcount', '2')
    expect(grid).toHaveAttribute('aria-colcount', '3')

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getAllByRole('gridcell')).toHaveLength(3)
    expect(within(rows[1]!).getAllByRole('gridcell')).toHaveLength(1)
  })

  it('makes only the active item tabbable and updates it after arrow navigation', async () => {
    const user = userEvent.setup()
    const onActivate = vi.fn()
    render(<PortfolioGrid items={items} onItemActivate={onActivate} />)

    const cells = screen.getAllByRole('gridcell')
    expect(cells[0]).toHaveAttribute('tabIndex', '0')
    expect(cells[1]).toHaveAttribute('tabIndex', '-1')

    cells[0]!.focus()
    await user.keyboard('{Enter}')
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))

    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(cells[1])
    expect(cells[0]).toHaveAttribute('tabIndex', '-1')
    expect(cells[1]).toHaveAttribute('tabIndex', '0')

    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(cells[0])
    expect(cells[0]).toHaveAttribute('tabIndex', '0')
  })

  it('navigates up and down by whole rows', async () => {
    const user = userEvent.setup()
    render(<PortfolioGrid items={sixItems} columns={3} />)

    const cells = screen.getAllByRole('gridcell')
    cells[0]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(cells[3])
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(cells[0])
  })

  it('supports Home and End for quick navigation', async () => {
    const user = userEvent.setup()
    render(<PortfolioGrid items={sixItems} columns={3} />)

    const cells = screen.getAllByRole('gridcell')
    cells[3]!.focus()
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(cells[5])
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(cells[0])
  })

  it('activates the focused item with Space', async () => {
    const user = userEvent.setup()
    const onActivate = vi.fn()
    render(<PortfolioGrid items={items} onItemActivate={onActivate} />)

    screen.getAllByRole('gridcell')[1]!.focus()
    await user.keyboard(' ')

    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }))
  })

  it('gives preview images a meaningful description', () => {
    render(
      <PortfolioGrid
        items={[
          {
            id: '1',
            title: 'Nebula',
            imageUrl: 'https://cdn.example.com/nebula.jpg',
          },
        ]}
      />,
    )

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Nebula')
  })

  it('renders an accessible empty state', () => {
    render(<PortfolioGrid items={[]} emptyMessage="Nothing here yet" />)

    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
  })
})
