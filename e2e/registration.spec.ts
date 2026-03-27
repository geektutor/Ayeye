import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Critical user journey: attendee registers for an event and pays a deposit.
// This is the highest-value flow in Ayeye — if this breaks, nothing else matters.
//
// Prerequisite: a seeded test event must exist in the DB.
// Run `pnpm --filter api db:seed` before this suite.
// ---------------------------------------------------------------------------

const TEST_EVENT_ID = process.env.TEST_EVENT_ID ?? 'evt_seed_001'
const TEST_EVENT_URL = `/events/${TEST_EVENT_ID}/register`

test.describe('Attendee Registration Flow', () => {
  test('attendee can view event details and access registration form', async ({ page }) => {
    await page.goto(`/events/${TEST_EVENT_ID}`)

    await expect(page.getByRole('heading', { name: /devfest/i })).toBeVisible()
    await expect(page.getByText(/₦2,000/)).toBeVisible()
    await expect(page.getByText(/refundable deposit/i)).toBeVisible()

    const registerButton = page.getByRole('link', { name: /register/i })
    await expect(registerButton).toBeVisible()
    await registerButton.click()

    await expect(page).toHaveURL(TEST_EVENT_URL)
  })

  test('registration form validates inputs before allowing payment', async ({ page }) => {
    await page.goto(TEST_EVENT_URL)

    // Attempt submit with empty form
    await page.getByRole('button', { name: /pay/i }).click()

    await expect(page.getByText(/name is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/phone.*required/i)).toBeVisible()
  })

  test('invalid email shows an inline error without submitting', async ({ page }) => {
    await page.goto(TEST_EVENT_URL)

    await page.getByLabel(/email/i).fill('not-an-email')
    await page.getByLabel(/full name/i).fill('Tunde Adesanya')
    await page.getByLabel(/phone/i).fill('08012345678')
    await page.getByRole('button', { name: /pay/i }).click()

    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('valid submission redirects to Interswitch payment page', async ({ page }) => {
    await page.goto(TEST_EVENT_URL)

    await page.getByLabel(/full name/i).fill('Tunde Adesanya')
    await page.getByLabel(/email/i).fill(`tunde+${Date.now()}@example.com`) // unique email
    await page.getByLabel(/phone/i).fill('08012345678')

    // Intercept the API call to avoid hitting Interswitch in E2E
    await page.route('**/api/registrations', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            registrationId: 'reg_test_001',
            paymentUrl: 'https://sandbox.interswitchng.com/pay/test',
          },
        }),
      })
    })

    await page.getByRole('button', { name: /pay/i }).click()

    // Should redirect to the Interswitch payment URL
    await expect(page).toHaveURL(/interswitchng\.com|sandbox/)
  })
})

test.describe('Organizer Check-In Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as organizer — adjust selector to match your auth UI
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('chisom@example.com')
    await page.getByLabel(/password/i).fill('testpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('organizer dashboard shows registration and check-in counts', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.getByText(/total registrations/i)).toBeVisible()
    await expect(page.getByText(/checked in/i)).toBeVisible()
    await expect(page.getByText(/attendance rate/i)).toBeVisible()
  })

  test('check-in page loads QR scanner on desktop', async ({ page }) => {
    await page.goto(`/events/${TEST_EVENT_ID}/checkin`)

    await expect(page.getByText(/scan qr code/i)).toBeVisible()
    // Camera permission stub is set up in playwright config
  })

  test('manual check-in via registration ID works as fallback', async ({ page }) => {
    await page.goto(`/events/${TEST_EVENT_ID}/checkin`)

    // Intercept check-in API call
    await page.route('**/api/checkin', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            attendeeName: 'Tunde Adesanya',
            paycodeDelivered: true,
            message: 'Check-in successful. Paycode sent via SMS.',
          },
        }),
      })
    })

    await page.getByPlaceholder(/registration id/i).fill('reg_test_001')
    await page.getByRole('button', { name: /check in/i }).click()

    await expect(page.getByText(/check-in successful/i)).toBeVisible()
    await expect(page.getByText(/paycode sent/i)).toBeVisible()
  })
})
