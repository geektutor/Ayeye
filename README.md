# Ayeye — Commitment-Fee Event Platform

> **Show up and get your money back.** Ayeye charges attendees a small refundable deposit at registration. Attend the event, scan your QR code, and receive an instant Interswitch Paycode refund — no card needed, redeemable at any ATM or POS nationwide.

**Live Demo:** _[link to be added after deployment]_

---

## The Problem

African tech events suffer a systemic no-show crisis. DevFest Lagos, GDG meetups, hackathons — free RSVP registration means zero accountability. No-show rates of **55–75%** are common. Organizers over-cater, sponsors lose confidence, and actual attendees get a worse experience because the numbers never match reality.

## The Solution

Ayeye introduces a refundable commitment fee. Attendees pay a small deposit (₦500–₦50,000) when registering. Show up → get it back instantly via Interswitch Paycode. Skip it → your fee goes into a community benefit pool (charity, scholarship fund, or future event discounts — organizer's choice).

**No financial risk for committed attendees. Real accountability for everyone.**

---

## Features

- **Event Creation** — Organizers create events with name, date, venue, deposit amount, and no-show policy (charity / scholarship / redistribute / event budget)
- **Interswitch Payment Collection** — Attendees pay deposit via card (Verve/Mastercard/Visa) through Interswitch Web Checkout
- **QR Code Tickets** — Auto-generated and emailed on payment confirmation
- **QR Check-In Scanner** — Organizer scans attendee QR via camera or manual entry; triggers refund immediately
- **Instant Paycode Refund** — Interswitch Paycode delivered to attendee's email within 60 seconds of check-in; redeemable at any ATM or POS — no card required
- **Live Dashboard** — Real-time stats (registered, paid, checked in, no-shows) with 10-second polling during live events
- **No-Show Processing** — One-click event close marks all unpaid registrations as no-shows
- **Discover Page** — Public listing of all upcoming events

---

## Interswitch Integration

Ayeye is built around two Interswitch API surfaces:

| API | Purpose | Trigger |
|---|---|---|
| **Interswitch Web Checkout** (Collections) | Collect registration deposit via card | Attendee submits registration form |
| **Interswitch Paycode (PWM)** | Generate cardless refund code | Attendee checks in at event |

Payment flow:
1. Attendee registers → redirected to Interswitch-hosted checkout page
2. Payment confirmed via webhook (`TRANSACTION.COMPLETED`) → QR code emailed
3. Organizer scans QR at event → Paycode generated via Interswitch PWM API → emailed to attendee
4. Attendee withdraws cash at any Interswitch-connected ATM or POS using the Paycode

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | pnpm workspaces + Turborepo |
| **API** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Frontend** | React + Vite + TypeScript + TanStack Query |
| **Payments** | Interswitch Web Checkout + Paycode API |
| **Email** | SendGrid |
| **QR Scanning** | html5-qrcode |
| **Testing** | Vitest (unit/integration) + Playwright (E2E) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (or Docker)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/geektutor/ayeye.git
cd ayeye

# 2. Start PostgreSQL
docker compose up -d

# 3. Install dependencies
pnpm install

# 4. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Fill in your Interswitch credentials and SendGrid API key

# 5. Run database migrations and seed data
pnpm --filter api db:migrate
pnpm --filter api db:seed

# 6. Start all dev servers
pnpm dev
```

The API runs on `http://localhost:3001` and the web app on `http://localhost:5173`.

### Environment Variables

**`apps/api/.env`**

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/ayeye?schema=public"
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Interswitch — Passport OAuth2
ISW_PASSPORT_URL=https://qa.interswitchng.com/passport/oauth/token

# Interswitch — General Integration (Paycode / PWM)
ISW_CLIENT_ID=your-client-id
ISW_SECRET=your-secret
ISW_BASE_URL=https://sandbox.interswitchng.com

# Interswitch — Card Payment (Collections)
ISW_CARD_CLIENT_ID=your-card-client-id
ISW_CARD_SECRET=your-card-secret
ISW_CARD_MERCHANT_CODE=your-merchant-code
ISW_CARD_PAY_ITEM_ID=your-pay-item-id
ISW_COLLECTIONS_BASE_URL=https://newwebpay.qa.interswitchng.com

# Email
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@ayeye.app

# App
FRONTEND_URL=http://localhost:5173
```

### Webhook Setup (for payment confirmation)

Expose your local API with ngrok:

```bash
ngrok http 3001
```

Register the webhook URL in your Interswitch merchant portal:
```
https://your-ngrok-url.ngrok.io/api/webhooks/payment
```

---

## Running Tests

```bash
pnpm test          # Unit + integration tests (Vitest)
pnpm test:e2e      # End-to-end tests (Playwright)
pnpm lint          # Lint all packages
```

---

## Key Business Rules

- Deposit amount: min **₦500** (50,000 kobo), max **₦50,000** (5,000,000 kobo)
- No-show policy options: `CHARITY` | `SCHOLARSHIP` | `REDISTRIBUTE` | `EVENT_BUDGET`
- QR codes expire 2 hours after event end
- Paycode refund delivered within 60 seconds of check-in
- All amounts stored in **kobo** (smallest currency unit)

---

## Project Structure

```
ayeye/
├── apps/api/           # Express REST API
│   ├── src/routes/     # API route handlers
│   ├── src/services/   # Business logic (refund, QR, notification)
│   ├── src/lib/        # Interswitch client, Prisma
│   └── prisma/         # Database schema + migrations
├── apps/web/           # React frontend
│   ├── src/pages/      # Route pages (dashboard, events, check-in)
│   ├── src/components/ # Shared UI components
│   └── src/hooks/      # TanStack Query hooks
├── packages/types/     # Shared Zod schemas + TypeScript types
├── packages/tsconfig/  # Shared TypeScript configs
└── e2e/                # Playwright E2E tests
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Organizer login |
| `POST` | `/api/auth/register` | — | Organizer registration |
| `GET` | `/api/events` | JWT | List organizer's events |
| `POST` | `/api/events` | JWT | Create event |
| `GET` | `/api/events/:id` | JWT | Get event details |
| `PATCH` | `/api/events/:id` | JWT | Update event |
| `POST` | `/api/events/:id/close` | JWT | Close event + process no-shows |
| `GET` | `/api/events/:id/stats` | JWT | Event statistics |
| `GET` | `/api/events/:id/registrations` | JWT | Event registrations list |
| `GET` | `/api/events/public` | — | Public event listing |
| `POST` | `/api/events/:id/register` | — | Attendee registration |
| `POST` | `/api/checkin` | JWT | QR check-in + trigger refund |
| `POST` | `/api/webhooks/payment` | HMAC | Interswitch payment webhook |

---

## Built For

**Enyata x Interswitch Buildathon 2026**

Ayeye is purpose-built to showcase Interswitch's payment infrastructure — multi-channel deposit collection via Web Checkout and cardless Paycode refunds via the PWM API — applied to a real, high-impact problem across Africa's developer community ecosystem.

---

## Team

**Sodiq Akinjobi** (Geektutor) — Full-stack engineer, product designer
**Ayomide Ogundipe** - QA Engineer

---

## License

MIT
