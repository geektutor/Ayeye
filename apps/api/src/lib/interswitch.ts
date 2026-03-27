import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Environment — two credential sets
// Card Payment (collections / deposit capture)
// ---------------------------------------------------------------------------
const COLLECTIONS_BASE_URL =
  process.env['ISW_COLLECTIONS_BASE_URL'] ?? 'https://newwebpay.qa.interswitchng.com'
const COLLECTIONS_CLIENT_ID = process.env['ISW_CARD_CLIENT_ID'] ?? ''
const COLLECTIONS_CLIENT_SECRET = process.env['ISW_CARD_SECRET'] ?? ''
const COLLECTIONS_MERCHANT_CODE = process.env['ISW_CARD_MERCHANT_CODE'] ?? ''
const COLLECTIONS_PAY_ITEM_ID = process.env['ISW_CARD_PAY_ITEM_ID'] ?? ''

// General Integration (paycode / cardless services)
const PASSPORT_BASE_URL =
  process.env['ISW_PASSPORT_URL'] ?? 'https://qa.interswitchng.com/passport/oauth/token'
const GENERAL_CLIENT_ID = process.env['ISW_CLIENT_ID'] ?? ''
const GENERAL_CLIENT_SECRET = process.env['ISW_SECRET'] ?? ''
const GENERAL_BASE_URL = process.env['ISW_BASE_URL'] ?? 'https://sandbox.interswitchng.com'

// ---------------------------------------------------------------------------
// OAuth2 token caches (one per credential set)
// ---------------------------------------------------------------------------

interface TokenCache {
  token: string | null
  expiry: number
}

const collectionsCache: TokenCache = { token: null, expiry: 0 }
const generalCache: TokenCache = { token: null, expiry: 0 }

async function getToken(clientId: string, secret: string, cache: TokenCache): Promise<string> {
  if (cache.token && Date.now() < cache.expiry) return cache.token

  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64')

  const response = await fetch(PASSPORT_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Interswitch auth failed: ${response.status} ${body}`)
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  cache.token = data.access_token
  cache.expiry = Date.now() + (data.expires_in - 60) * 1000
  return cache.token
}

// ---------------------------------------------------------------------------
// initiatePayment — builds a web checkout redirect URL (no API call)
// ---------------------------------------------------------------------------

export interface InitiatePaymentParams {
  amount: number       // kobo
  customerEmail: string
  customerName: string
  reference: string
  redirectUrl: string
}

export interface InitiatePaymentResult {
  paymentUrl: string
  transactionReference: string
}

// ---------------------------------------------------------------------------
// verifyPayment — server-side query after Interswitch redirects back
// ---------------------------------------------------------------------------

export interface VerifyPaymentResult {
  approved: boolean
  responseCode: string
  transactionReference: string
  amount: number
}

// ---------------------------------------------------------------------------
// generatePaycode — Cardless/PWM service (General credentials)
// ---------------------------------------------------------------------------

export interface GeneratePaycodeParams {
  amount: number   // kobo
  email: string
  reference: string
}

export interface GeneratePaycodeResult {
  paycodeId: string
  code: string
  expiresAt: string
}

// ---------------------------------------------------------------------------
// Exported client singleton
// ---------------------------------------------------------------------------

export const interswitchClient = {
  /**
   * Build a web checkout redirect URL.
   * The frontend navigates the user to this URL to pay.
   * No network call — pure URL construction.
   */
  initiatePayment(params: InitiatePaymentParams): InitiatePaymentResult {
    const base = `${COLLECTIONS_BASE_URL}/collections/w/pay`
    const query = new URLSearchParams({
      merchant_code: COLLECTIONS_MERCHANT_CODE,
      pay_item_id: COLLECTIONS_PAY_ITEM_ID,
      txn_ref: params.reference,
      amount: String(params.amount),
      currency: '566', // NGN ISO 4217 numeric
      cust_email: params.customerEmail,
      cust_name: params.customerName,
      redirect_url: params.redirectUrl,
      site_redirect_url: params.redirectUrl,
    })

    return {
      paymentUrl: `${base}?${query.toString()}`,
      transactionReference: params.reference,
    }
  },

  /**
   * Verify a transaction after Interswitch redirects back.
   * Must be called server-side — do not trust the frontend responseCode alone.
   */
  async verifyPayment(
    transactionReference: string,
    amount: number,
  ): Promise<VerifyPaymentResult> {
    const credentials = Buffer.from(
      `${COLLECTIONS_CLIENT_ID}:${COLLECTIONS_CLIENT_SECRET}`,
    ).toString('base64')

    const base = COLLECTIONS_BASE_URL.replace('newwebpay.', '')
    const url = `${base}/collections/api/v1/gettransaction.json?merchantcode=${COLLECTIONS_MERCHANT_CODE}&transactionreference=${transactionReference}&amount=${amount}`

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${credentials}` },
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Payment verification failed: ${response.status} ${body}`)
    }

    const data = (await response.json()) as {
      ResponseCode: string
      TransactionReference: string
      Amount: number
    }

    return {
      approved: data.ResponseCode === '00',
      responseCode: data.ResponseCode,
      transactionReference: data.TransactionReference,
      amount: data.Amount,
    }
  },

  /**
   * Generate a Paycode for a refund (Cardless/PWM service).
   * Uses General Integration credentials.
   */
  async generatePaycode(params: GeneratePaycodeParams): Promise<GeneratePaycodeResult> {
    const token = await getToken(GENERAL_CLIENT_ID, GENERAL_CLIENT_SECRET, generalCache)

    // subscriberId: use merchant code as the PWM subscriber identity
    const subscriberId = encodeURIComponent(COLLECTIONS_MERCHANT_CODE)

    const response = await fetch(
      `${GENERAL_BASE_URL}/api/v1/pwm/subscribers/${subscriberId}/tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ttid: params.reference,
          transactionRef: params.reference,
          amount: String(params.amount),
          tokenLifeTimeInMinutes: '1440', // 24 hours
          codeGenerationChannel: 'INTERNET_BANKING',
          codeGenerationChannelProvider: 'AYEYE',
          paymentMethodTypeCode: 'PWM',
          paymentMethodCode: 'ISW',
          payWithMobileChannel: 'ATM',
          autoEnroll: 'false',
        }),
      },
    )

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Paycode generation failed: ${response.status} ${body}`)
    }

    const data = (await response.json()) as {
      subscriberId: string
      payWithMobileToken: string
      tokenLifeTimeInMinutes: string
    }

    const expiresAt = new Date(
      Date.now() + Number(data.tokenLifeTimeInMinutes) * 60 * 1000,
    ).toISOString()

    return {
      paycodeId: data.subscriberId,
      code: data.payWithMobileToken,
      expiresAt,
    }
  },
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// Uses the General Integration secret key
// ---------------------------------------------------------------------------

export function verifyWebhookSignature(body: unknown, signature: string | undefined): boolean {
  if (!signature || !GENERAL_CLIENT_SECRET) return false

  try {
    const payload = typeof body === 'string' ? body : JSON.stringify(body)
    const expected = crypto
      .createHmac('sha512', GENERAL_CLIENT_SECRET)
      .update(payload)
      .digest('hex')

    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)

    if (sigBuf.length !== expBuf.length) return false
    return crypto.timingSafeEqual(sigBuf, expBuf)
  } catch {
    return false
  }
}
