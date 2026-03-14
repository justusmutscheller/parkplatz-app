import { Config } from '@/constants/config';

export const mapsService = {
  async searchPlaces(query: string): Promise<PlacePrediction[]> {
    // In a real app, this would call Google Places Autocomplete API
    // Mock implementation returns sample results
    const mockResults: PlacePrediction[] = [
      { placeId: 'place-1', description: 'Alexanderplatz, Berlin', mainText: 'Alexanderplatz', secondaryText: 'Berlin, Deutschland' },
      { placeId: 'place-2', description: 'Potsdamer Platz, Berlin', mainText: 'Potsdamer Platz', secondaryText: 'Berlin, Deutschland' },
      { placeId: 'place-3', description: 'Brandenburger Tor, Berlin', mainText: 'Brandenburger Tor', secondaryText: 'Berlin, Deutschland' },
      { placeId: 'place-4', description: 'Kurfuerstendamm, Berlin', mainText: 'Kurfuerstendamm', secondaryText: 'Berlin, Deutschland' },
    ];
    return mockResults.filter((r) =>
      r.description.toLowerCase().includes(query.toLowerCase())
    );
  },

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    return {
      placeId,
      name: 'Mock Place',
      address: 'Musterstrasse 1, 10115 Berlin',
      latitude: 52.52,
      longitude: 13.405,
    };
  },

  getStaticMapUrl(lat: number, lng: number, zoom: number = 15): string {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=400x200&key=${Config.GOOGLE_MAPS_API_KEY}`;
  },
};

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}
