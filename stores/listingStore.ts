import { create } from 'zustand';
import type { ParkingListing, CreateListingData } from '@/types';

const MOCK_LISTINGS: ParkingListing[] = [
  {
    id: 'listing-1',
    ownerId: 'user-1',
    type: 'private',
    category: 'garage',
    title: 'Tiefgarage am Alexanderplatz',
    description: 'Sichere Tiefgarage in zentraler Lage. 24/7 Zugang per App.',
    location: {
      latitude: 52.5219,
      longitude: 13.4132,
      address: 'Alexanderplatz 1',
      city: 'Berlin',
      postalCode: '10178',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-1-1', label: 'A-12', number: 12, isAvailable: true },
      { id: 'spot-1-2', label: 'A-13', number: 13, isAvailable: false },
    ],
    totalSpots: 2,
    availableSpots: 1,
    pricing: [
      { unit: 'hour', price: 3.5, currency: 'EUR' },
      { unit: 'day', price: 25, currency: 'EUR' },
    ],
    availability: [
      { dayOfWeek: 0, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 1, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 2, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 3, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 4, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 5, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 6, startTime: '00:00', endTime: '23:59' },
    ],
    features: {
      covered: true,
      gated: true,
      illuminated: true,
      surveillance: true,
      evCharging: true,
      handicapAccessible: true,
      heightLimit: 2.1,
    },
    photos: [],
    rating: 4.8,
    reviewCount: 127,
    isVerified: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'listing-2',
    ownerId: 'user-1',
    type: 'private',
    category: 'street',
    title: 'Stellplatz Prenzlauer Berg',
    description: 'Ruhiger Stellplatz in Wohngebiet. Ideal für Übernachtung.',
    location: {
      latitude: 52.5345,
      longitude: 13.4221,
      address: 'Kastanienallee 45',
      city: 'Berlin',
      postalCode: '10435',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-3-1', label: 'Straße 1', number: 1, isAvailable: true },
    ],
    totalSpots: 1,
    availableSpots: 1,
    pricing: [
      { unit: 'hour', price: 2, currency: 'EUR' },
      { unit: 'day', price: 12, currency: 'EUR' },
    ],
    availability: [
      { dayOfWeek: 0, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 1, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 2, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 3, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 4, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 5, startTime: '00:00', endTime: '23:59' },
      { dayOfWeek: 6, startTime: '00:00', endTime: '23:59' },
    ],
    features: {
      covered: false,
      gated: false,
      illuminated: true,
      surveillance: false,
      evCharging: false,
      handicapAccessible: false,
    },
    photos: [],
    rating: 4.6,
    reviewCount: 34,
    isVerified: false,
    createdAt: '2024-02-01T14:00:00Z',
    updatedAt: '2024-02-01T14:00:00Z',
  },
];

interface ListingState {
  listings: ParkingListing[];
  isLoading: boolean;
  selectedListing: ParkingListing | null;
}

interface ListingActions {
  createListing: (data: CreateListingData) => Promise<ParkingListing>;
  updateListing: (id: string, updates: Partial<ParkingListing>) => void;
  deleteListing: (id: string) => void;
  getListings: () => Promise<ParkingListing[]>;
  selectListing: (listing: ParkingListing | null) => void;
}

export const useListingStore = create<ListingState & ListingActions>((set, get) => ({
  listings: MOCK_LISTINGS,
  isLoading: false,
  selectedListing: null,

  createListing: async (data) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 800));

    const now = new Date().toISOString();
    const spots = data.spots.map((s, i) => ({
      ...s,
      id: `spot-new-${Date.now()}-${i}`,
      isAvailable: true,
    }));

    const newListing: ParkingListing = {
      id: `listing-${Date.now()}`,
      ownerId: 'user-1',
      type: 'private',
      category: data.category,
      title: data.title,
      description: data.description,
      location: data.location,
      spots,
      totalSpots: data.totalSpots,
      availableSpots: data.totalSpots,
      pricing: data.pricing,
      availability: data.availability,
      features: data.features,
      photos: data.photos,
      rating: 0,
      reviewCount: 0,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      listings: [newListing, ...state.listings],
      isLoading: false,
    }));

    return newListing;
  },

  updateListing: (id, updates) => {
    set((state) => ({
      listings: state.listings.map((l) =>
        l.id === id
          ? {
              ...l,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : l
      ),
      selectedListing:
        state.selectedListing?.id === id
          ? { ...state.selectedListing, ...updates }
          : state.selectedListing,
    }));
  },

  deleteListing: (id) => {
    set((state) => ({
      listings: state.listings.filter((l) => l.id !== id),
      selectedListing: state.selectedListing?.id === id ? null : state.selectedListing,
    }));
  },

  getListings: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const { listings } = get();
    set({ isLoading: false });
    return listings;
  },

  selectListing: (listing) => set({ selectedListing: listing }),
}));
