export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type PaymentMethod = 'stripe' | 'paypal';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Booking {
  id: string;
  parkingId: string;
  parkingTitle: string;
  parkingAddress: string;
  spotId: string;
  spotLabel: string;
  renterId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  parkingId: string;
  spotId: string;
  startTime: string;
  endTime: string;
  paymentMethod: PaymentMethod;
}

export interface BookingConfirmation {
  bookingId: string;
  qrCode: string;
  totalPrice: number;
  currency: string;
}
