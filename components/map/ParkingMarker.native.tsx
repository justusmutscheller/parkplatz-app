/**
 * Native (iOS/Android): Echte Marker von react-native-maps.
 * Wird nur auf nativen Plattformen geladen.
 */
import React from 'react';
import { Marker } from 'react-native-maps';
import type { ParkingSearchResult } from '@/types';
import { Colors } from '@/constants/theme';

export interface ParkingMarkerProps {
  parking: ParkingSearchResult;
  onPress: () => void;
}

export function ParkingMarker({ parking, onPress }: ParkingMarkerProps) {
  const pinColor =
    parking.type === 'public' ? Colors.markerPublic : Colors.markerPrivate;

  return (
    <Marker
      coordinate={{
        latitude: parking.location.latitude,
        longitude: parking.location.longitude,
      }}
      pinColor={pinColor}
      onPress={onPress}
      tracksViewChanges={false}
    />
  );
}
