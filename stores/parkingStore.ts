import { create } from 'zustand';
import type {
  ParkingSearchResult,
  ParkingListing,
  ParkingSearchFilters,
} from '@/types';

const MOCK_PARKING_SPOTS: ParkingSearchResult[] = [
  {
    id: 'parking-1',
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
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.3,
  },
  {
    id: 'parking-2',
    ownerId: 'user-2',
    type: 'public',
    category: 'lot',
    title: 'Parkplatz Potsdamer Platz',
    description: 'Großer öffentlicher Parkplatz in der Nähe des Sony Centers.',
    location: {
      latitude: 52.5096,
      longitude: 13.3766,
      address: 'Potsdamer Platz 1',
      city: 'Berlin',
      postalCode: '10785',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-2-1', label: 'P-101', number: 101, isAvailable: true },
      { id: 'spot-2-2', label: 'P-102', number: 102, isAvailable: true },
      { id: 'spot-2-3', label: 'P-103', number: 103, isAvailable: false },
    ],
    totalSpots: 3,
    availableSpots: 2,
    pricing: [
      { unit: 'hour', price: 2.5, currency: 'EUR' },
      { unit: 'day', price: 18, currency: 'EUR' },
    ],
    availability: [
      { dayOfWeek: 0, startTime: '06:00', endTime: '24:00' },
      { dayOfWeek: 1, startTime: '06:00', endTime: '24:00' },
      { dayOfWeek: 2, startTime: '06:00', endTime: '24:00' },
      { dayOfWeek: 3, startTime: '06:00', endTime: '24:00' },
      { dayOfWeek: 4, startTime: '06:00', endTime: '24:00' },
      { dayOfWeek: 5, startTime: '06:00', endTime: '24:00' },
      { dayOfWeek: 6, startTime: '08:00', endTime: '22:00' },
    ],
    features: {
      covered: false,
      gated: false,
      illuminated: true,
      surveillance: true,
      evCharging: true,
      handicapAccessible: true,
    },
    photos: [],
    rating: 4.2,
    reviewCount: 89,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.8,
  },
  {
    id: 'parking-3',
    ownerId: 'user-3',
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
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 1.2,
  },
  {
    id: 'parking-4',
    ownerId: 'user-4',
    type: 'private',
    category: 'underground',
    title: 'Unterirdische Garage Mitte',
    description: 'Moderne Tiefgarage mit E-Ladesäule. Direkt am Hackescher Markt.',
    location: {
      latitude: 52.5234,
      longitude: 13.4025,
      address: 'Rosenthaler Straße 40',
      city: 'Berlin',
      postalCode: '10178',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-4-1', label: 'UG-A1', number: 1, isAvailable: true },
      { id: 'spot-4-2', label: 'UG-A2', number: 2, isAvailable: true },
    ],
    totalSpots: 2,
    availableSpots: 2,
    pricing: [
      { unit: 'hour', price: 4, currency: 'EUR' },
      { unit: 'day', price: 28, currency: 'EUR' },
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
      heightLimit: 2.0,
    },
    photos: [],
    rating: 4.9,
    reviewCount: 203,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.5,
  },
  {
    id: 'parking-5',
    ownerId: 'user-5',
    type: 'public',
    category: 'street',
    title: 'Park & Ride Friedrichshain',
    description: 'Öffentlicher Parkplatz nahe der Warschauer Straße.',
    location: {
      latitude: 52.5058,
      longitude: 13.4492,
      address: 'Warschauer Straße 45',
      city: 'Berlin',
      postalCode: '10243',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-5-1', label: 'WR-1', number: 1, isAvailable: true },
      { id: 'spot-5-2', label: 'WR-2', number: 2, isAvailable: true },
      { id: 'spot-5-3', label: 'WR-3', number: 3, isAvailable: false },
    ],
    totalSpots: 3,
    availableSpots: 2,
    pricing: [
      { unit: 'hour', price: 2.2, currency: 'EUR' },
      { unit: 'day', price: 15, currency: 'EUR' },
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
      surveillance: true,
      evCharging: false,
      handicapAccessible: true,
    },
    photos: [],
    rating: 4.0,
    reviewCount: 56,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 1.5,
  },
  {
    id: 'parking-6',
    ownerId: 'user-6',
    type: 'private',
    category: 'private_spot',
    title: 'Garagenstellplatz Charlottenburg',
    description: 'Eigene Garage in ruhiger Seitenstraße. Perfekt für Langzeitparken.',
    location: {
      latitude: 52.5163,
      longitude: 13.2957,
      address: 'Kantstraße 112',
      city: 'Berlin',
      postalCode: '10625',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-6-1', label: 'Garage 1', number: 1, isAvailable: true },
    ],
    totalSpots: 1,
    availableSpots: 1,
    pricing: [
      { unit: 'hour', price: 3, currency: 'EUR' },
      { unit: 'day', price: 20, currency: 'EUR' },
      { unit: 'week', price: 100, currency: 'EUR' },
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
      surveillance: false,
      evCharging: false,
      handicapAccessible: false,
      heightLimit: 2.2,
    },
    photos: [],
    rating: 4.7,
    reviewCount: 42,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 2.1,
  },
  {
    id: 'parking-7',
    ownerId: 'user-7',
    type: 'public',
    category: 'lot',
    title: 'Parkhaus am Hauptbahnhof',
    description: 'Großes Parkhaus direkt am Berlin Hauptbahnhof. 24h geöffnet.',
    location: {
      latitude: 52.5256,
      longitude: 13.3694,
      address: 'Europaplatz 1',
      city: 'Berlin',
      postalCode: '10557',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-7-1', label: 'EB-201', number: 201, isAvailable: true },
      { id: 'spot-7-2', label: 'EB-202', number: 202, isAvailable: true },
      { id: 'spot-7-3', label: 'EB-203', number: 203, isAvailable: true },
    ],
    totalSpots: 3,
    availableSpots: 3,
    pricing: [
      { unit: 'hour', price: 4.5, currency: 'EUR' },
      { unit: 'day', price: 32, currency: 'EUR' },
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
    rating: 4.4,
    reviewCount: 312,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.6,
  },
  {
    id: 'parking-8',
    ownerId: 'user-8',
    type: 'private',
    category: 'garage',
    title: 'Stellplatz Kreuzberg',
    description: 'Überdachter Stellplatz in Innenhof. Nahe Görlitzer Park.',
    location: {
      latitude: 52.4994,
      longitude: 13.4255,
      address: 'Skalitzer Straße 55',
      city: 'Berlin',
      postalCode: '10997',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-8-1', label: 'K-1', number: 1, isAvailable: true },
      { id: 'spot-8-2', label: 'K-2', number: 2, isAvailable: false },
    ],
    totalSpots: 2,
    availableSpots: 1,
    pricing: [
      { unit: 'hour', price: 2.8, currency: 'EUR' },
      { unit: 'day', price: 16, currency: 'EUR' },
    ],
    availability: [
      { dayOfWeek: 0, startTime: '08:00', endTime: '22:00' },
      { dayOfWeek: 1, startTime: '08:00', endTime: '22:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '22:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '22:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '22:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '22:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '20:00' },
    ],
    features: {
      covered: true,
      gated: true,
      illuminated: true,
      surveillance: true,
      evCharging: false,
      handicapAccessible: false,
    },
    photos: [],
    rating: 4.5,
    reviewCount: 78,
    isVerified: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 1.0,
  },
  {
    id: 'parking-9',
    ownerId: 'user-9',
    type: 'public',
    category: 'underground',
    title: 'Tiefgarage Kurfürstendamm',
    description: 'Zentrale Tiefgarage am Ku\'damm. Einkaufen und Parken kombiniert.',
    location: {
      latitude: 52.5044,
      longitude: 13.3322,
      address: 'Kurfürstendamm 195',
      city: 'Berlin',
      postalCode: '10707',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-9-1', label: 'KU-301', number: 301, isAvailable: true },
      { id: 'spot-9-2', label: 'KU-302', number: 302, isAvailable: true },
    ],
    totalSpots: 2,
    availableSpots: 2,
    pricing: [
      { unit: 'hour', price: 5, currency: 'EUR' },
      { unit: 'day', price: 35, currency: 'EUR' },
    ],
    availability: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '22:00' },
      { dayOfWeek: 1, startTime: '09:00', endTime: '22:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '22:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '22:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '22:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '22:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '20:00' },
    ],
    features: {
      covered: true,
      gated: true,
      illuminated: true,
      surveillance: true,
      evCharging: true,
      handicapAccessible: true,
      heightLimit: 2.0,
    },
    photos: [],
    rating: 4.6,
    reviewCount: 156,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 2.5,
  },
];

const DEFAULT_FILTERS: ParkingSearchFilters = {
  latitude: 52.52,
  longitude: 13.405,
  radiusKm: 5,
};

interface ParkingState {
  parkingSpots: ParkingSearchResult[];
  selectedParking: ParkingListing | null;
  isLoading: boolean;
  filters: ParkingSearchFilters;
  publicParkingSpots: ParkingSearchResult[];
}

interface ParkingActions {
  searchNearby: () => Promise<void>;
  setFilters: (filters: Partial<ParkingSearchFilters>) => void;
  selectParking: (parking: ParkingListing | null) => void;
  clearSelection: () => void;
}

export const useParkingStore = create<ParkingState & ParkingActions>((set, get) => ({
  parkingSpots: [],
  selectedParking: null,
  isLoading: false,
  filters: DEFAULT_FILTERS,
  publicParkingSpots: MOCK_PARKING_SPOTS.filter((p) => p.type === 'public'),

  searchNearby: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    const { filters } = get();
    let results = [...MOCK_PARKING_SPOTS];

    if (filters.type) {
      results = results.filter((p) => p.type === filters.type);
    }
    if (filters.category) {
      results = results.filter((p) => p.category === filters.category);
    }
    if (filters.minPrice !== undefined) {
      results = results.filter((p) =>
        p.pricing.some((pr) => pr.price >= filters.minPrice!)
      );
    }
    if (filters.maxPrice !== undefined) {
      results = results.filter((p) =>
        p.pricing.some((pr) => pr.price <= filters.maxPrice!)
      );
    }
    if (filters.covered === true) {
      results = results.filter((p) => p.features.covered);
    }
    if (filters.evCharging === true) {
      results = results.filter((p) => p.features.evCharging);
    }
    if (filters.surveillance === true) {
      results = results.filter((p) => p.features.surveillance);
    }

    results = results
      .map((p) => ({
        ...p,
        distanceKm:
          Math.abs(p.location.latitude - filters.latitude) * 111 +
          Math.abs(p.location.longitude - filters.longitude) * 85,
      }))
      .filter((p) => p.distanceKm <= filters.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    set({ parkingSpots: results, isLoading: false });
  },

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  selectParking: (parking) => set({ selectedParking: parking }),

  clearSelection: () => set({ selectedParking: null }),
}));
