// Interswitch Paycode shapes

export interface InterswitchPaycodeRequest {
  amount: number // in kobo
  beneficiaryPhoneNumber: string
  narration: string
  customerId: string
  reference: string
}

export interface InterswitchPaycodeResponse {
  responseCode: string
  responseDescription: string
  paycode: string
  expiryDate: string
  amount: number
  reference: string
}

// Interswitch Payment Gateway shapes

export interface PaymentGatewayInitRequest {
  amount: number // in kobo
  customerId: string
  customerEmail: string
  customerName: string
  redirectUrl: string
  paymentReference: string
  currency: string
}

export interface PaymentGatewayInitResponse {
  paymentUrl: string
  transactionReference: string
  amount: number
  expiryTime: string
}

export interface PaymentGatewayWebhookPayload {
  paymentReference: string
  transactionReference: string
  amount: number
  responseCode: string
  responseDescription: string
  paymentDate: string
  currency: string
  cardNumber?: string
  paymentMethod: 'CARD' | 'TRANSFER' | 'USSD' | 'QR'
}
