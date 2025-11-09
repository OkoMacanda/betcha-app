/**
 * Payment Provider Integration
 * Supports Paystack (primary) and Stripe (fallback)
 *
 * Environment variables required:
 * - VITE_PAYSTACK_PUBLIC_KEY
 * - VITE_STRIPE_PUBLISHABLE_KEY
 */

export interface PaymentProvider {
  initialize(): Promise<void>;
  initializeDeposit(amount: number, email: string, userId: string): Promise<PaymentIntent>;
  initializeWithdrawal(amount: number, accountDetails: BankAccount): Promise<PayoutIntent>;
  verifyPayment(reference: string): Promise<PaymentVerification>;
}

export interface PaymentIntent {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

export interface PayoutIntent {
  reference: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

export interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
}

export interface PaymentVerification {
  success: boolean;
  amount: number;
  reference: string;
  status: 'success' | 'failed' | 'pending';
  paidAt?: string;
}

/**
 * Paystack Payment Provider
 * Documentation: https://paystack.com/docs/api/
 */
class PaystackProvider implements PaymentProvider {
  private publicKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }

  async initialize(): Promise<void> {
    // Load Paystack Popup JS if not already loaded
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
    userId: string
  ): Promise<PaymentIntent> {
    // Amount in kobo (Paystack uses smallest currency unit)
    const amountInKobo = Math.round(amount * 100);

    // Generate unique reference
    const reference = `DEP_${userId}_${Date.now()}`;

    // In production, this should call your backend
    // Backend will call Paystack API with secret key
    // For now, we'll use the popup directly with public key

    return {
      reference,
      authorizationUrl: '', // Will be handled by popup
      accessCode: '', // Not needed for popup
    };
  }

  openPaymentPopup(
    amount: number,
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
      email: email,
      amount: Math.round(amount * 100), // In kobo
      ref: reference,
      onClose: onClose,
      callback: (response: { reference: string }) => {
        onSuccess(response.reference);
      },
    });

    handler.openIframe();
  }

  async initializeWithdrawal(
    amount: number,
    accountDetails: BankAccount
  ): Promise<PayoutIntent> {
    // In production, this MUST be called from your backend
    // as it requires the secret key

    const reference = `WTD_${Date.now()}`;

    // This is a placeholder - actual implementation requires backend
    // Backend endpoint should:
    // 1. Verify user KYC status
    // 2. Verify wallet balance
    // 3. Call Paystack Transfer API with secret key
    // 4. Record transaction in database

    return {
      reference,
      status: 'pending',
      message: 'Withdrawal request received',
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    // In production, this should call your backend
    // Backend will call Paystack verification API
    // GET https://api.paystack.co/transaction/verify/:reference

    // This is a placeholder
    return {
      success: true,
      amount: 0,
      reference,
      status: 'success',
      paidAt: new Date().toISOString(),
    };
  }
}

/**
 * Stripe Payment Provider
 * Documentation: https://stripe.com/docs/api
 */
class StripeProvider implements PaymentProvider {
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
    userId: string
  ): Promise<PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    // In production, call your backend to create a PaymentIntent
    // Backend endpoint should:
    // 1. Create Stripe PaymentIntent with secret key
    // 2. Return client_secret to frontend

    const reference = `DEP_${userId}_${Date.now()}`;

    return {
      reference,
      authorizationUrl: '', // Stripe uses Elements, not redirect
      accessCode: '', // Will be client_secret in production
    };
  }

  async initializeWithdrawal(
    amount: number,
    accountDetails: BankAccount
  ): Promise<PayoutIntent> {
    // In production, call backend to create payout
    // Stripe payouts require Connect account setup

    const reference = `WTD_${Date.now()}`;

    return {
      reference,
      status: 'pending',
      message: 'Withdrawal request received',
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    // In production, call backend to verify payment

    return {
      success: true,
      amount: 0,
      reference,
      status: 'success',
    };
  }
}

/**
 * Payment Manager
 * Factory for creating payment provider instances
 */
export class PaymentManager {
  private static instance: PaymentManager;
  private provider: PaymentProvider | null = null;
  private providerType: 'paystack' | 'stripe' | null = null;

  private constructor() {}

  static getInstance(): PaymentManager {
    if (!PaymentManager.instance) {
      PaymentManager.instance = new PaymentManager();
    }
    return PaymentManager.instance;
  }

  async initializeProvider(
    type: 'paystack' | 'stripe' = 'paystack'
  ): Promise<void> {
    if (this.provider && this.providerType === type) {
      return; // Already initialized
    }

    if (type === 'paystack') {
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Paystack public key not configured');
      }
      this.provider = new PaystackProvider(publicKey);
    } else {
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Stripe publishable key not configured');
      }
      this.provider = new StripeProvider(publishableKey);
    }

    this.providerType = type;
    await this.provider.initialize();
  }

  getProvider(): PaymentProvider {
    if (!this.provider) {
      throw new Error('Payment provider not initialized. Call initializeProvider() first.');
    }
    return this.provider;
  }

  getProviderType(): 'paystack' | 'stripe' | null {
    return this.providerType;
  }

  /**
   * Helper method for Paystack popup
   * Only available when using Paystack provider
   */
  openPaystackPopup(
    amount: number,
    email: string,
    reference: string,
    onSuccess: (reference: string) => void,
    onClose: () => void
  ): void {
    if (this.providerType !== 'paystack' || !(this.provider instanceof PaystackProvider)) {
      throw new Error('Paystack popup only available with Paystack provider');
    }

    this.provider.openPaymentPopup(amount, email, reference, onSuccess, onClose);
  }
}

/**
 * Type augmentation for window object
 */
declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
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

// Export convenience instance
export const paymentManager = PaymentManager.getInstance();
