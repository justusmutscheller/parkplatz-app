import { create } from 'zustand';
import type {
  ParkingSearchResult,
  ParkingListing,
  ParkingSearchFilters,
} from '@/types';
import { useListingStore } from '@/stores/listingStore';

const MOCK_PARKING_SPOTS: ParkingSearchResult[] = [
  // Öffentliche Parkhäuser Mannheimer Parkhausbetriebe (parken-mannheim.de)
  {
    id: 'parking-1',
    ownerId: 'user-1',
    type: 'public',
    category: 'underground',
    title: 'D3 Tiefgarage',
    description: 'Mannheimer Parkhausbetriebe. 378 Stellplätze, 24h geöffnet. Einfahrt über Kunststraße zwischen D3 und C3. Aufzüge, 2 Behindertenstellplätze. Einfahrtshöhe 2,00 m.',
    location: {
      latitude: 49.48814,
      longitude: 8.46354,
      address: 'D3, 5',
      city: 'Mannheim',
      postalCode: '68159',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-1-1', label: 'D3-101', number: 101, isAvailable: true },
      { id: 'spot-1-2', label: 'D3-102', number: 102, isAvailable: true },
    ],
    totalSpots: 378,
    availableSpots: 348,
    pricing: [
      { unit: 'hour', price: 2, currency: 'EUR' },
      { unit: 'day', price: 18, currency: 'EUR' },
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
      handicapAccessible: true,
      heightLimit: 2.0,
    },
    photos: [],
    rating: 4.5,
    reviewCount: 312,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.3,
  },
  {
    id: 'parking-2',
    ownerId: 'user-2',
    type: 'public',
    category: 'underground',
    title: 'D5 Reiss-Engelhorn-Museen',
    description: 'Tiefgarage bei den Reiss-Engelhorn-Museen. 365 Stellplätze, E-Ladestation, Aufzüge, 54 Frauenstellplätze, Kennzeichenerfassung. Einfahrt Kunststraße D5/C5. Quelle: parken-mannheim.de',
    location: {
      latitude: 49.48853,
      longitude: 8.46204,
      address: 'D5',
      city: 'Mannheim',
      postalCode: '68161',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-2-1', label: 'D5-201', number: 201, isAvailable: true },
      { id: 'spot-2-2', label: 'D5-202', number: 202, isAvailable: true },
    ],
    totalSpots: 365,
    availableSpots: 264,
    pricing: [
      { unit: 'hour', price: 2.5, currency: 'EUR' },
      { unit: 'day', price: 18, currency: 'EUR' },
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
    rating: 4.7,
    reviewCount: 189,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.4,
  },
  {
    id: 'parking-3',
    ownerId: 'user-3',
    type: 'public',
    category: 'underground',
    title: 'G1 Marktplatz Tiefgarage',
    description: 'Tiefgarage unter dem Mannheimer Marktplatz. 337 Stellplätze, E-Ladestation, Kennzeichenerfassung. Einfahrt in der Marktstraße. Quelle: parken-mannheim.de',
    location: {
      latitude: 49.49030,
      longitude: 8.46734,
      address: 'G1',
      city: 'Mannheim',
      postalCode: '68161',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-3-1', label: 'G1-101', number: 101, isAvailable: true },
      { id: 'spot-3-2', label: 'G1-102', number: 102, isAvailable: true },
    ],
    totalSpots: 337,
    availableSpots: 267,
    pricing: [
      { unit: 'hour', price: 2, currency: 'EUR' },
      { unit: 'day', price: 18, currency: 'EUR' },
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
      handicapAccessible: false,
      heightLimit: 2.0,
    },
    photos: [],
    rating: 4.6,
    reviewCount: 245,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.5,
  },
  {
    id: 'parking-4',
    ownerId: 'user-4',
    type: 'public',
    category: 'underground',
    title: 'Hauptbahnhof P1 Tiefgarage',
    description: 'Parkhaus direkt am Mannheimer Hauptbahnhof. 327 Stellplätze, Kennzeichenerfassung, 1 Behindertenstellplatz. Willy-Brandt-Platz. Quelle: parken-mannheim.de',
    location: {
      latitude: 49.48111,
      longitude: 8.47097,
      address: 'Willy-Brandt-Platz 5',
      city: 'Mannheim',
      postalCode: '68161',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-4-1', label: 'P1-101', number: 101, isAvailable: true },
      { id: 'spot-4-2', label: 'P1-102', number: 102, isAvailable: true },
    ],
    totalSpots: 327,
    availableSpots: 187,
    pricing: [
      { unit: 'hour', price: 2.5, currency: 'EUR' },
      { unit: 'day', price: 20, currency: 'EUR' },
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
      evCharging: false,
      handicapAccessible: true,
      heightLimit: 1.9,
    },
    photos: [],
    rating: 4.4,
    reviewCount: 412,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.8,
  },
  {
    id: 'parking-5',
    ownerId: 'user-5',
    type: 'public',
    category: 'underground',
    title: 'H6 Tiefgarage Swanseaplatz',
    description: 'Tiefgarage am Swanseaplatz. 248 Stellplätze, E-Ladestation, 16 Frauenstellplätze. Einfahrtshöhe 1,90 m. Quelle: parken-mannheim.de',
    location: {
      latitude: 49.49240,
      longitude: 8.46391,
      address: 'H6 (Swanseaplatz)',
      city: 'Mannheim',
      postalCode: '68159',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-5-1', label: 'H6-101', number: 101, isAvailable: true },
      { id: 'spot-5-2', label: 'H6-102', number: 102, isAvailable: true },
    ],
    totalSpots: 248,
    availableSpots: 133,
    pricing: [
      { unit: 'hour', price: 2, currency: 'EUR' },
      { unit: 'day', price: 16, currency: 'EUR' },
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
    title: 'Tiefgaragenstellplatz Lindenhof',
    description: 'Privat vermieteter Stellplatz in Wohnanlage Lindenhof. Eigentümer vermietet ungenutzten TG-Platz. Ruhige Lage, 24/7 Zugang per Chip.',
    location: {
      latitude: 49.4722,
      longitude: 8.4985,
      address: 'Seckenheimer Straße 42',
      city: 'Mannheim',
      postalCode: '68163',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-6-1', label: 'TG-12', number: 12, isAvailable: true },
    ],
    totalSpots: 1,
    availableSpots: 1,
    pricing: [
      { unit: 'day', price: 12, currency: 'EUR' },
      { unit: 'week', price: 65, currency: 'EUR' },
      { unit: 'month', price: 180, currency: 'EUR' },
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
    rating: 4.8,
    reviewCount: 23,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 1.8,
  },
  {
    id: 'parking-7',
    ownerId: 'user-7',
    type: 'public',
    category: 'lot',
    title: 'Collini-Center Mulde',
    description: 'Ebenerdiger Parkplatz am Cahn-Garnier-Ufer. 213 Stellplätze, Einfahrtshöhe 3,00 m. Ideal für höhere Fahrzeuge. Quelle: parken-mannheim.de',
    location: {
      latitude: 49.49128,
      longitude: 8.47800,
      address: 'Cahn-Garnier-Ufer',
      city: 'Mannheim',
      postalCode: '68161',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-7-1', label: 'CC-101', number: 101, isAvailable: true },
      { id: 'spot-7-2', label: 'CC-102', number: 102, isAvailable: true },
    ],
    totalSpots: 213,
    availableSpots: 143,
    pricing: [
      { unit: 'hour', price: 2, currency: 'EUR' },
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
      surveillance: false,
      evCharging: false,
      handicapAccessible: false,
      heightLimit: 3.0,
    },
    photos: [],
    rating: 4.3,
    reviewCount: 156,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.9,
  },
  {
    id: 'parking-8',
    ownerId: 'user-8',
    type: 'private',
    category: 'garage',
    title: 'Außenstellplatz Oststadt',
    description: 'Privat vermieteter Stellplatz in Wohnanlage Oststadt. Vermieter nutzt eigenen Platz nicht. Günstige Alternative zu Parkhäusern.',
    location: {
      latitude: 49.4955,
      longitude: 8.4785,
      address: 'Augustaanlage 28',
      city: 'Mannheim',
      postalCode: '68165',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-8-1', label: 'A-15', number: 15, isAvailable: true },
    ],
    totalSpots: 1,
    availableSpots: 1,
    pricing: [
      { unit: 'day', price: 10, currency: 'EUR' },
      { unit: 'week', price: 55, currency: 'EUR' },
      { unit: 'month', price: 120, currency: 'EUR' },
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
      gated: true,
      illuminated: true,
      surveillance: false,
      evCharging: false,
      handicapAccessible: false,
    },
    photos: [],
    rating: 4.6,
    reviewCount: 18,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.7,
  },
  {
    id: 'parking-9',
    ownerId: 'user-9',
    type: 'public',
    category: 'underground',
    title: 'C1 Hauptverwaltung MPB',
    description: 'Parkhaus der Mannheimer Parkhausbetriebe. 211 Stellplätze, E-Ladestation, Aufzüge, 8 Frauenstellplätze, Kennzeichenerfassung. Einfahrtshöhe 1,90 m. Quelle: parken-mannheim.de',
    location: {
      latitude: 49.48673,
      longitude: 8.46416,
      address: 'C1, 13-15',
      city: 'Mannheim',
      postalCode: '68159',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-9-1', label: 'C1-101', number: 101, isAvailable: true },
      { id: 'spot-9-2', label: 'C1-102', number: 102, isAvailable: true },
    ],
    totalSpots: 211,
    availableSpots: 163,
    pricing: [
      { unit: 'hour', price: 2, currency: 'EUR' },
      { unit: 'day', price: 18, currency: 'EUR' },
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
      heightLimit: 1.9,
    },
    photos: [],
    rating: 4.5,
    reviewCount: 278,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 0.2,
  },
  {
    id: 'parking-10',
    ownerId: 'user-10',
    type: 'private',
    category: 'private_spot',
    title: 'Stellplatz Schwetzingerstadt',
    description: 'Privat vermieteter Tiefgaragenstellplatz in Wohnanlage. Vermieter im Ausland, vermietet dauerhaft. Monatsmiete möglich.',
    location: {
      latitude: 49.4785,
      longitude: 8.4820,
      address: 'Rudolf-Diesel-Straße 12',
      city: 'Mannheim',
      postalCode: '68165',
      country: 'Deutschland',
    },
    spots: [
      { id: 'spot-10-1', label: 'TG-B4', number: 4, isAvailable: true },
    ],
    totalSpots: 1,
    availableSpots: 1,
    pricing: [
      { unit: 'day', price: 15, currency: 'EUR' },
      { unit: 'week', price: 80, currency: 'EUR' },
      { unit: 'month', price: 200, currency: 'EUR' },
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
      evCharging: false,
      handicapAccessible: false,
      heightLimit: 2.0,
    },
    photos: [],
    rating: 4.9,
    reviewCount: 31,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    distanceKm: 1.2,
  },
];

const DEFAULT_FILTERS: ParkingSearchFilters = {
  latitude: 49.4875,
  longitude: 8.466,
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
    const listings = useListingStore.getState().listings;
    const listingsAsSearchResults: ParkingSearchResult[] = listings.map((l) => ({
      ...l,
      distanceKm:
        Math.abs(l.location.latitude - filters.latitude) * 111 +
        Math.abs(l.location.longitude - filters.longitude) * 85,
    }));
    let results = [...MOCK_PARKING_SPOTS, ...listingsAsSearchResults];

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
