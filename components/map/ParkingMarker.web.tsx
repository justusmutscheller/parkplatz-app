/**
 * Web: Marker werden nicht gerendert — es gibt keine Karte.
 * Gibt null zurück, damit keine Fehler entstehen.
 */
import type { ParkingSearchResult } from '@/types';

export interface ParkingMarkerProps {
  parking: ParkingSearchResult;
  onPress: () => void;
}

export function ParkingMarker(_props: ParkingMarkerProps) {
  return null;
}
