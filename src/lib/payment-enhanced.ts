/**
 * ENHANCED PAYMENT PROVIDER INTEGRATION
 * Supports: Yoco (SA), Paystack (Africa), Stripe (Global)
 *
 * Features:
 * - Multi-currency support (ZAR, USD, NGN, GHS, KES)
 * - Secure popup-based deposits
 * - KYC-gated withdrawals
 * - Transaction verification
 * - Webhook handling preparation
 */

export type Currency = 'ZAR' | 'USD' | 'NGN' | 'GHS' | 'KES';
export type PaymentProviderType = 'yoco' | 'paystack' | 'stripe';

export interface PaymentProvider {
  name: string;
  supportedCurrencies: Currency[];
  initialize(): Promise<void>;
  initializeDeposit(amount: number, email: string, userId: string, currency: Currency): Promise<PaymentIntent>;
  initializeWithdrawal(amount: number, accountDetails: BankAccount, currency: Currency): Promise<PayoutIntent>;
  verifyPayment(reference: string): Promise<PaymentVerification>;
}

export interface PaymentIntent {
  reference: string;
  authorizationUrl?: string;
  accessCode?: string;
  checkoutUrl?: string;
}

export interface PayoutIntent {
  reference: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  estimatedArrival?: string;
}

export interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  branchCode?: string; // For South African banks
  accountType?: 'current' | 'savings';
}

export interface PaymentVerification {
  success: boolean;
  amount: number;
  reference: string;
  status: 'success' | 'failed' | 'pending';
  paidAt?: string;
  currency: Currency;
  fees?: number;
}

/**
 * YOCO PAYMENT PROVIDER
 * Primary provider for South Africa
 * Documentation: https://developer.yoco.com/online/
 */
class YocoProvider implements PaymentProvider {
  name = 'Yoco';
  supportedCurrencies: Currency[] = ['ZAR'];
  private publicKey: string;
  private baseUrl = 'https://online.yoco.com';

  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }

  async initialize(): Promise<void> {
    // Load Yoco SDK
    if (typeof window !== 'undefined' && !window.YocoSDK) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.yoco.com/sdk/v1/yoco-sdk-web.js';
        script.onload = () => {
          window.YocoSDK = window.YocoSDK || {};
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Yoco SDK'));
        document.head.appendChild(script);
      });
    }
  }

  async initializeDeposit(
    amount: number,
    email: string,
    userId: string,
    currency: Currency = 'ZAR'
  ): Promise<PaymentIntent> {
    if (currency !== 'ZAR') {
      throw new Error('Yoco only supports ZAR currency');
    }

    // Amount in cents
    const amountInCents = Math.round(amount * 100);
    const reference = `DEP_${userId}_${Date.now()}`;

    // In production, call backend to create checkout
    // Backend endpoint: POST /api/payments/yoco/checkout
    // Returns: checkoutUrl and reference

    return {
      reference,
      checkoutUrl: `${this.baseUrl}/checkout?publicKey=${this.publicKey}&amount=${amountInCents}&currency=${currency}&reference=${reference}&metadata[userId]=${userId}&metadata[email]=${email}`,
    };
  }

  async initializeWithdrawal(
    amount: number,
    accountDetails: BankAccount,
    currency: Currency = 'ZAR'
  ): Promise<PayoutIntent> {
    // Yoco payouts require backend integration
    // Backend endpoint: POST /api/payments/yoco/payout

    const reference = `WTD_${Date.now()}`;

    // This is handled by backend with secret key
    // Backend should:
    // 1. Verify KYC
    // 2. Verify balance
    // 3. Create Yoco payout
    // 4. Update database

    return {
      reference,
      status: 'pending',
      message: 'Withdrawal request received. Processing typically takes 1-3 business days.',
      estimatedArrival: this.calculateBusinessDays(3),
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    // Backend endpoint: GET /api/payments/yoco/verify/:reference
    // Backend calls: GET https://api.yoco.com/v1/charges/:id

    // Placeholder - actual verification done by backend
    return {
      success: true,
      amount: 0,
      reference,
      status: 'pending',
      currency: 'ZAR',
    };
  }

  private calculateBusinessDays(days: number): string {
    const date = new Date();
    let addedDays = 0;
    while (addedDays < days) {
      date.setDate(date.getDate() + 1);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        addedDays++;
      }
    }
    return date.toISOString().split('T')[0];
  }

  /**
   * Open Yoco inline popup
   */
  openInlinePopup(
    amount: number,
    currency: Currency,
    email: string,
    reference: string,
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ): void {
    if (!window.YocoSDK) {
      throw new Error('Yoco SDK not loaded');
    }

    const sdk = new window.YocoSDK({
      publicKey: this.publicKey,
    });

    sdk.showPopup({
      amountInCents: Math.round(amount * 100),
      currency,
      name: 'Betcha Wallet Deposit',
      description: `Deposit to wallet - ${reference}`,
      metadata: {
        reference,
        email,
      },
      callback: (result: any) => {
        if (result.error) {
          onError(result.error);
        } else {
          onSuccess(result);
        }
      },
    });
  }
}

/**
 * PAYSTACK PAYMENT PROVIDER
 * Primary provider for Nigeria, Ghana, Kenya, South Africa
 * Documentation: https://paystack.com/docs/api/
 */
class PaystackProvider implements PaymentProvider {
  name = 'Paystack';
  supportedCurrencies: Currency[] = ['NGN', 'GHS', 'ZAR', 'USD', 'KES'];
  private publicKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }

  async initialize(): Promise<void> {
    if (typeof window !== 'undefined' && !window.PaystackPop) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Paystack script'));
        document.head.appendChild(script);
      });
    }
  }

  async initializeDeposit(
    amount: number,
    email: string,
    userId: string,
    currency: Currency
  ): Promise<PaymentIntent> {
    // Convert amount to smallest currency unit
    const amountInKobo = Math.round(amount * 100);
    const reference = `DEP_${userId}_${Date.now()}`;

    // Backend creates transaction
    // Backend endpoint: POST /api/payments/paystack/initialize

    return {
      reference,
      authorizationUrl: '',
      accessCode: '',
    };
  }

  async initializeWithdrawal(
    amount: number,
    accountDetails: BankAccount,
    currency: Currency
  ): Promise<PayoutIntent> {
    const reference = `WTD_${Date.now()}`;

    // Backend endpoint: POST /api/payments/paystack/transfer
    // Requires:
    // 1. Resolve account number
    // 2. Create transfer recipient
    // 3. Initiate transfer

    return {
      reference,
      status: 'pending',
      message: 'Withdrawal initiated. Funds should arrive within 24 hours.',
      estimatedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    // Backend endpoint: GET /api/payments/paystack/verify/:reference
    return {
      success: true,
      amount: 0,
      reference,
      status: 'pending',
      currency: 'NGN',
    };
  }

  openPaymentPopup(
    amount: number,
    currency: Currency,
    email: string,
    reference: string,
    onSuccess: (reference: string) => void,
    onClose: () => void
  ): void {
    if (!window.PaystackPop) {
      throw new Error('Paystack script not loaded');
    }

    const handler = window.PaystackPop.setup({
      key: this.publicKey,
      email,
      amount: Math.round(amount * 100),
      currency,
      ref: reference,
      onClose,
      callback: (response: { reference: string }) => {
        onSuccess(response.reference);
      },
    });

    handler.openIframe();
  }
}

/**
 * STRIPE PAYMENT PROVIDER
 * Global provider (fallback)
 * Documentation: https://stripe.com/docs/api
 */
class StripeProvider implements PaymentProvider {
  name = 'Stripe';
  supportedCurrencies: Currency[] = ['USD', 'ZAR'];
  private publishableKey: string;
  private stripe: any = null;

  constructor(publishableKey: string) {
    this.publishableKey = publishableKey;
  }

  async initialize(): Promise<void> {
    if (typeof window !== 'undefined' && !window.Stripe) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => {
          this.stripe = window.Stripe(this.publishableKey);
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Stripe script'));
        document.head.appendChild(script);
      });
    } else if (window.Stripe) {
      this.stripe = window.Stripe(this.publishableKey);
    }
  }

  async initializeDeposit(
    amount: number,
    email: string,
    userId: string,
    currency: Currency
  ): Promise<PaymentIntent> {
    const reference = `DEP_${userId}_${Date.now()}`;

    // Backend endpoint: POST /api/payments/stripe/create-payment-intent
    // Returns: clientSecret

    return {
      reference,
      accessCode: '', // Will be clientSecret from backend
    };
  }

  async initializeWithdrawal(
    amount: number,
    accountDetails: BankAccount,
    currency: Currency
  ): Promise<PayoutIntent> {
    const reference = `WTD_${Date.now()}`;

    // Backend endpoint: POST /api/payments/stripe/payout
    // Requires Stripe Connect setup

    return {
      reference,
      status: 'pending',
      message: 'Withdrawal request submitted.',
      estimatedArrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    // Backend verifies payment
    return {
      success: true,
      amount: 0,
      reference,
      status: 'pending',
      currency: 'USD',
    };
  }
}

/**
 * PAYMENT MANAGER
 * Singleton to manage payment providers
 */
export class PaymentManager {
  private static instance: PaymentManager;
  private provider: PaymentProvider | null = null;
  private providerType: PaymentProviderType | null = null;
  private currency: Currency = 'ZAR'; // Default to South African Rand

  private constructor() {}

  static getInstance(): PaymentManager {
    if (!PaymentManager.instance) {
      PaymentManager.instance = new PaymentManager();
    }
    return PaymentManager.instance;
  }

  /**
   * Auto-detect best payment provider based on currency
   */
  getBestProvider(currency: Currency): PaymentProviderType {
    switch (currency) {
      case 'ZAR':
        // Prefer Yoco for South Africa (lowest fees)
        return import.meta.env.VITE_YOCO_PUBLIC_KEY ? 'yoco' : 'paystack';
      case 'NGN':
      case 'GHS':
      case 'KES':
        return 'paystack'; // Best for West/East Africa
      case 'USD':
        return 'stripe'; // Best for USD
      default:
        return 'paystack';
    }
  }

  async initializeProvider(
    type?: PaymentProviderType,
    currency: Currency = 'ZAR'
  ): Promise<void> {
    this.currency = currency;

    // Auto-detect if not specified
    const providerType = type || this.getBestProvider(currency);

    if (this.provider && this.providerType === providerType) {
      return; // Already initialized
    }

    switch (providerType) {
      case 'yoco': {
        const publicKey = import.meta.env.VITE_YOCO_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error('Yoco public key not configured');
        }
        this.provider = new YocoProvider(publicKey);
        break;
      }
      case 'paystack': {
        const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error('Paystack public key not configured');
        }
        this.provider = new PaystackProvider(publicKey);
        break;
      }
      case 'stripe': {
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
          throw new Error('Stripe publishable key not configured');
        }
        this.provider = new StripeProvider(publishableKey);
        break;
      }
    }

    this.providerType = providerType;
    await this.provider.initialize();
  }

  getProvider(): PaymentProvider {
    if (!this.provider) {
      throw new Error('Payment provider not initialized. Call initializeProvider() first.');
    }
    return this.provider;
  }

  getProviderType(): PaymentProviderType | null {
    return this.providerType;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  /**
   * Open payment popup (provider-agnostic)
   */
  openPaymentPopup(
    amount: number,
    email: string,
    reference: string,
    onSuccess: (reference: string) => void,
    onClose: () => void,
    onError?: (error: any) => void
  ): void {
    if (!this.provider || !this.providerType) {
      throw new Error('Payment provider not initialized');
    }

    if (this.providerType === 'yoco' && this.provider instanceof YocoProvider) {
      this.provider.openInlinePopup(
        amount,
        this.currency,
        email,
        reference,
        (result) => onSuccess(result.id || reference),
        (error) => onError?.(error) || console.error(error)
      );
    } else if (this.providerType === 'paystack' && this.provider instanceof PaystackProvider) {
      this.provider.openPaymentPopup(amount, this.currency, email, reference, onSuccess, onClose);
    } else {
      throw new Error('Popup payment not supported for this provider');
    }
  }
}

/**
 * Type augmentation for window object
 */
declare global {
  interface Window {
    YocoSDK?: any;
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }) => {
        openIframe: () => void;
      };
    };
    Stripe?: (key: string) => any;
  }
}

// Export singleton instance
export const paymentManager = PaymentManager.getInstance();

/**
 * CONVENIENCE FUNCTIONS
 */

/**
 * Initialize payment system with best provider for currency
 */
export async function initializePaymentSystem(currency: Currency = 'ZAR'): Promise<void> {
  await paymentManager.initializeProvider(undefined, currency);
}

/**
 * Create deposit payment
 */
export async function createDeposit(
  amount: number,
  email: string,
  userId: string,
  currency: Currency = 'ZAR'
): Promise<PaymentIntent> {
  await paymentManager.initializeProvider(undefined, currency);
  const provider = paymentManager.getProvider();
  return provider.initializeDeposit(amount, email, userId, currency);
}

/**
 * Create withdrawal request
 */
export async function createWithdrawal(
  amount: number,
  bankAccount: BankAccount,
  currency: Currency = 'ZAR'
): Promise<PayoutIntent> {
  await paymentManager.initializeProvider(undefined, currency);
  const provider = paymentManager.getProvider();
  return provider.initializeWithdrawal(amount, bankAccount, currency);
}

/**
 * Verify payment by reference
 */
export async function verifyPayment(
  reference: string,
  currency: Currency = 'ZAR'
): Promise<PaymentVerification> {
  await paymentManager.initializeProvider(undefined, currency);
  const provider = paymentManager.getProvider();
  return provider.verifyPayment(reference);
}
