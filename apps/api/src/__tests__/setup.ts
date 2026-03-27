import { vi, afterEach } from 'vitest'

// Reset all mocks after each test so implementation state doesn't bleed between tests.
// resetAllMocks clears call history AND resets implementations (unlike clearAllMocks).
afterEach(() => {
  vi.resetAllMocks()
})
