import { simulateDelay } from './api';

export const authService = {
  async sendOtp(phone: string): Promise<{ success: boolean }> {
    await simulateDelay(1000);
    console.log(`[Mock] SMS OTP sent to ${phone}`);
    return { success: true };
  },

  async verifyOtp(phone: string, code: string): Promise<{ success: boolean; token: string }> {
    await simulateDelay(800);
    if (code.length === 6 && /^\d+$/.test(code)) {
      return { success: true, token: 'mock-jwt-token-' + Date.now() };
    }
    throw new Error('Invalid OTP code');
  },

  async register(data: any): Promise<{ success: boolean; userId: string }> {
    await simulateDelay(1200);
    return { success: true, userId: 'user-' + Date.now() };
  },
};
