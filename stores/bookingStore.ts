import { create } from 'zustand';
import type { Booking, CreateBookingData } from '@/types';

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'booking-1',
    parkingId: 'parking-1',
    parkingTitle: 'Tiefgarage am Alexanderplatz',
    parkingAddress: 'Alexanderplatz 1, 10178 Berlin',
    spotId: 'spot-1-1',
    spotLabel: 'A-12',
    renterId: 'user-1',
    startTime: '2024-02-15T09:00:00Z',
    endTime: '2024-02-15T17:00:00Z',
    totalPrice: 28,
    currency: 'EUR',
    status: 'completed',
    paymentMethod: 'stripe',
    paymentStatus: 'completed',
    qrCode: 'QR-BOOKING-1-ABC123',
    createdAt: '2024-02-14T18:30:00Z',
    updatedAt: '2024-02-15T17:00:00Z',
  },
  {
    id: 'booking-2',
    parkingId: 'parking-4',
    parkingTitle: 'Unterirdische Garage Mitte',
    parkingAddress: 'Rosenthaler Straße 40, 10178 Berlin',
    spotId: 'spot-4-1',
    spotLabel: 'UG-A1',
    renterId: 'user-1',
    startTime: '2024-03-01T10:00:00Z',
    endTime: '2024-03-01T14:00:00Z',
    totalPrice: 16,
    currency: 'EUR',
    status: 'completed',
    paymentMethod: 'paypal',
    paymentStatus: 'completed',
    qrCode: 'QR-BOOKING-2-DEF456',
    createdAt: '2024-02-28T20:15:00Z',
    updatedAt: '2024-03-01T14:00:00Z',
  },
  {
    id: 'booking-3',
    parkingId: 'parking-2',
    parkingTitle: 'Parkplatz Potsdamer Platz',
    parkingAddress: 'Potsdamer Platz 1, 10785 Berlin',
    spotId: 'spot-2-1',
    spotLabel: 'P-101',
    renterId: 'user-1',
    startTime: '2024-03-10T08:00:00Z',
    endTime: '2024-03-10T12:00:00Z',
    totalPrice: 10,
    currency: 'EUR',
    status: 'cancelled',
    paymentMethod: 'stripe',
    paymentStatus: 'refunded',
    qrCode: 'QR-BOOKING-3-GHI789',
    createdAt: '2024-03-09T15:00:00Z',
    updatedAt: '2024-03-09T16:30:00Z',
  },
];

interface BookingState {
  bookings: Booking[];
  activeBooking: Booking | null;
  isLoading: boolean;
}

interface BookingActions {
  createBooking: (data: CreateBookingData) => Promise<Booking>;
  cancelBooking: (bookingId: string) => void;
  getBookings: () => Promise<Booking[]>;
}

export const useBookingStore = create<BookingState & BookingActions>((set, get) => ({
  bookings: MOCK_BOOKINGS,
  activeBooking: null,
  isLoading: false,

  createBooking: async (data) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const parkingTitles: Record<string, string> = {
      'parking-1': 'Tiefgarage am Alexanderplatz',
      'parking-2': 'Parkplatz Potsdamer Platz',
      'parking-3': 'Stellplatz Prenzlauer Berg',
      'parking-4': 'Unterirdische Garage Mitte',
      'parking-5': 'Park & Ride Friedrichshain',
      'parking-6': 'Garagenstellplatz Charlottenburg',
      'parking-7': 'Parkhaus am Hauptbahnhof',
      'parking-8': 'Stellplatz Kreuzberg',
      'parking-9': 'Tiefgarage Kurfürstendamm',
    };

    const parkingAddresses: Record<string, string> = {
      'parking-1': 'Alexanderplatz 1, 10178 Berlin',
      'parking-2': 'Potsdamer Platz 1, 10785 Berlin',
      'parking-3': 'Kastanienallee 45, 10435 Berlin',
      'parking-4': 'Rosenthaler Straße 40, 10178 Berlin',
      'parking-5': 'Warschauer Straße 45, 10243 Berlin',
      'parking-6': 'Kantstraße 112, 10625 Berlin',
      'parking-7': 'Europaplatz 1, 10557 Berlin',
      'parking-8': 'Skalitzer Straße 55, 10997 Berlin',
      'parking-9': 'Kurfürstendamm 195, 10707 Berlin',
    };

    const spotLabels: Record<string, string> = {
      'spot-1-1': 'A-12',
      'spot-2-1': 'P-101',
      'spot-3-1': 'Straße 1',
      'spot-4-1': 'UG-A1',
      'spot-5-1': 'WR-1',
      'spot-6-1': 'Garage 1',
      'spot-7-1': 'EB-201',
      'spot-8-1': 'K-1',
      'spot-9-1': 'KU-301',
    };

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalPrice = Math.round(hours * 3.5);

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      parkingId: data.parkingId,
      parkingTitle: parkingTitles[data.parkingId] ?? 'Parkplatz',
      parkingAddress: parkingAddresses[data.parkingId] ?? 'Berlin',
      spotId: data.spotId,
      spotLabel: spotLabels[data.spotId] ?? data.spotId,
      renterId: 'user-1',
      startTime: data.startTime,
      endTime: data.endTime,
      totalPrice,
      currency: 'EUR',
      status: 'confirmed',
      paymentMethod: data.paymentMethod,
      paymentStatus: 'completed',
      qrCode: `QR-${data.parkingId}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      bookings: [newBooking, ...state.bookings],
      activeBooking: newBooking,
      isLoading: false,
    }));

    return newBooking;
  },

  cancelBooking: (bookingId) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'cancelled' as const,
              paymentStatus: 'refunded' as const,
              updatedAt: new Date().toISOString(),
            }
          : b
      ),
      activeBooking:
        state.activeBooking?.id === bookingId ? null : state.activeBooking,
    }));
  },

  getBookings: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const { bookings } = get();
    set({ isLoading: false });
    return bookings;
  },
}));
