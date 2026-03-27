import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '../../components/RegisterForm'

// ---------------------------------------------------------------------------
// RegisterForm collects attendee details before redirecting to Interswitch
// payment. The Zod schema from packages/types drives all validation.
// ---------------------------------------------------------------------------

const mockEvent = {
  id: 'evt_xyz789',
  name: 'DevFest Lagos 2026',
  depositAmount: 200000, // ₦2,000 in kobo
}

const mockOnSubmit = vi.fn()

describe('RegisterForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders all required fields', () => {
    render(<RegisterForm event={mockEvent} onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pay ₦2,000 deposit/i })).toBeInTheDocument()
  })

  it('submits with valid data', async () => {
    const user = userEvent.setup()
    render(<RegisterForm event={mockEvent} onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/full name/i), 'Tunde Adesanya')
    await user.type(screen.getByLabelText(/email/i), 'tunde@example.com')
    await user.type(screen.getByLabelText(/phone number/i), '08012345678')
    await user.click(screen.getByRole('button', { name: /pay/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Tunde Adesanya',
        email: 'tunde@example.com',
        phone: '08012345678',
      })
    })
  })

  it('shows validation error when email is invalid', async () => {
    const user = userEvent.setup()
    render(<RegisterForm event={mockEvent} onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /pay/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when Nigerian phone number format is invalid', async () => {
    const user = userEvent.setup()
    render(<RegisterForm event={mockEvent} onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/phone number/i), '1234') // too short
    await user.click(screen.getByRole('button', { name: /pay/i }))

    await waitFor(() => {
      expect(screen.getByText(/valid nigerian phone/i)).toBeInTheDocument()
    })
  })

  it('disables submit button and shows loading state during submission', async () => {
    const user = userEvent.setup()
    // onSubmit that never resolves — simulates pending state
    const slowSubmit = vi.fn(() => new Promise(() => {}))
    render(<RegisterForm event={mockEvent} onSubmit={slowSubmit} />)

    await user.type(screen.getByLabelText(/full name/i), 'Tunde Adesanya')
    await user.type(screen.getByLabelText(/email/i), 'tunde@example.com')
    await user.type(screen.getByLabelText(/phone number/i), '08012345678')
    await user.click(screen.getByRole('button', { name: /pay/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pay/i })).toBeDisabled()
    })
  })
})
