import { simulateDelay } from './api';
import type { PaymentMethod } from '@/types';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export const paymentService = {
  async createStripePaymentIntent(amount: number, currency: string = 'EUR'): Promise<PaymentIntent> {
    await simulateDelay(1000);
    return {
      id: 'pi_mock_' + Date.now(),
      clientSecret: 'pi_mock_secret_' + Date.now(),
      amount,
      currency,
      status: 'requires_payment_method',
    };
  },

  async confirmStripePayment(paymentIntentId: string): Promise<{ success: boolean }> {
    await simulateDelay(1500);
    return { success: true };
  },

  async createPayPalOrder(amount: number, currency: string = 'EUR'): Promise<{ orderId: string; approvalUrl: string }> {
    await simulateDelay(1000);
    return {
      orderId: 'paypal_mock_' + Date.now(),
      approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=mock',
    };
  },

  async capturePayPalOrder(orderId: string): Promise<{ success: boolean }> {
    await simulateDelay(1000);
    return { success: true };
  },
};
