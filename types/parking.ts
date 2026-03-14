export type ParkingType = 'public' | 'private';
export type ParkingCategory = 'garage' | 'lot' | 'street' | 'underground' | 'private_spot';
export type PricingUnit = 'hour' | 'day' | 'week' | 'month';
export type OwnershipProofType = 'land_register' | 'rental_agreement' | 'management_confirmation';

export interface ParkingLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ParkingSpot {
  id: string;
  label: string;
  row?: string;
  number: number;
  isAvailable: boolean;
}

export interface PricingOption {
  unit: PricingUnit;
  price: number;
  currency: string;
}

export interface AvailabilityWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ParkingListing {
  id: string;
  ownerId: string;
  type: ParkingType;
  category: ParkingCategory;
  title: string;
  description: string;
  location: ParkingLocation;
  spots: ParkingSpot[];
  totalSpots: number;
  availableSpots: number;
  pricing: PricingOption[];
  availability: AvailabilityWindow[];
  features: ParkingFeatures;
  photos: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  ownershipProofType?: OwnershipProofType;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingFeatures {
  covered: boolean;
  gated: boolean;
  illuminated: boolean;
  surveillance: boolean;
  evCharging: boolean;
  handicapAccessible: boolean;
  heightLimit?: number;
  widthLimit?: number;
}

export interface ParkingSearchFilters {
  latitude: number;
  longitude: number;
  radiusKm: number;
  type?: ParkingType;
  category?: ParkingCategory;
  minPrice?: number;
  maxPrice?: number;
  pricingUnit?: PricingUnit;
  covered?: boolean;
  evCharging?: boolean;
  surveillance?: boolean;
  availableFrom?: string;
  availableTo?: string;
}

export interface ParkingSearchResult extends ParkingListing {
  distanceKm: number;
}

export interface CreateListingData {
  title: string;
  description: string;
  category: ParkingCategory;
  location: ParkingLocation;
  spots: Omit<ParkingSpot, 'id' | 'isAvailable'>[];
  totalSpots: number;
  pricing: PricingOption[];
  availability: AvailabilityWindow[];
  features: ParkingFeatures;
  photos: string[];
}
