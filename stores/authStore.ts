import { create } from 'zustand';
import type { User, RegistrationData } from '@/types';

const MOCK_USER: User = {
  id: 'user-1',
  phone: '+491701234567',
  email: 'max.mustermann@example.de',
  firstName: 'Max',
  lastName: 'Mustermann',
  dateOfBirth: '1990-05-15',
  placeOfBirth: 'Berlin',
  address: {
    street: 'Friedrichstraße',
    houseNumber: '123',
    postalCode: '10117',
    city: 'Berlin',
    country: 'Deutschland',
  },
  accountType: 'private',
  identityVerificationStatus: 'verified',
  documentVerificationStatus: 'verified',
  savedPaymentMethods: [
    { id: 'pm-1', type: 'stripe', label: 'Visa ****4242', icon: '💳', isDefault: true },
    { id: 'pm-2', type: 'paypal', label: 'PayPal max@example.de', icon: '🅿️', isDefault: false },
  ],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  phone: string;
  smsCodeSent: boolean;
  smsVerified: boolean;
  pendingRegistration: RegistrationData | null;
}

interface AuthActions {
  setPhone: (phone: string) => void;
  sendSmsCode: () => Promise<void>;
  verifySmsCode: (code: string) => boolean;
  setPendingRegistration: (data: RegistrationData) => void;
  completePendingRegistration: () => void;
  register: (data: RegistrationData) => void;
  loginWithPhone: () => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  phone: '',
  smsCodeSent: false,
  smsVerified: false,
  pendingRegistration: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  ...initialState,

  setPhone: (phone) => set({ phone }),

  sendSmsCode: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({ smsCodeSent: true, isLoading: false });
  },

  verifySmsCode: (code) => {
    const isValid = /^\d{6}$/.test(code);
    if (isValid) {
      set({ smsVerified: true });
    }
    return isValid;
  },

  setPendingRegistration: (data) => set({ pendingRegistration: data }),

  completePendingRegistration: () => {
    const { pendingRegistration } = get();
    if (pendingRegistration) {
      get().register(pendingRegistration);
      set({ pendingRegistration: null });
    }
  },

  register: (data) => {
    const now = new Date().toISOString();
    const user: User = {
      ...MOCK_USER,
      ...data,
      id: 'user-' + Date.now(),
      identityVerificationStatus: 'verified',
      documentVerificationStatus: 'verified',
      savedPaymentMethods: [],
      createdAt: now,
      updatedAt: now,
    };
    set({
      user,
      isAuthenticated: true,
      smsCodeSent: false,
      smsVerified: false,
      pendingRegistration: null,
    });
  },

  loginWithPhone: () => {
    const { phone } = get();
    set({
      user: { ...MOCK_USER, phone },
      isAuthenticated: true,
      smsCodeSent: false,
      smsVerified: false,
    });
  },

  logout: () => set(initialState),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),
}));
