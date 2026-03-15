/**
 * Web: Interaktive Leaflet/OpenStreetMap-Karte.
 * Ersetzt react-native-maps, das im Browser nicht funktioniert.
 */
import 'leaflet/dist/leaflet.css';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ParkingSearchResult } from '@/types';
import { Colors } from '@/constants/theme';

// Leaflet Default-Icon für Webpack/Vite fix (sonst 404)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapViewWrapperWebProps {
  style?: object;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  parkingSpots?: ParkingSearchResult[];
  onMarkerPress?: (parking: ParkingSearchResult) => void;
  children?: React.ReactNode;
}

function MapRefCapture({
  onReady,
}: {
  onReady: (map: L.Map | null) => void;
}) {
  const map = useMap();
  React.useEffect(() => {
    onReady(map);
    return () => onReady(null);
  }, [map, onReady]);
  return null;
}

const MapViewWeb = forwardRef<{ animateToRegion: (r: object) => void }, MapViewWrapperWebProps>(
  function MapViewWeb({ initialRegion, parkingSpots = [], onMarkerPress }, ref) {
    const mapRef = useRef<L.Map | null>(null);

    const center = initialRegion
      ? [initialRegion.latitude, initialRegion.longitude] as [number, number]
      : ([52.52, 13.405] as [number, number]);

    useImperativeHandle(ref, () => ({
      animateToRegion: (r: { latitude?: number; longitude?: number }) => {
        if (mapRef.current && r.latitude != null && r.longitude != null) {
          mapRef.current.setView([r.latitude, r.longitude]);
        }
      },
    }));

    return (
      <div style={{ width: '100%', height: '100%', minHeight: 400, position: 'relative', zIndex: 0 }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <MapRefCapture onReady={(m) => { mapRef.current = m; }} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {parkingSpots.map((parking) => (
            <Marker
              key={parking.id}
              position={[parking.location.latitude, parking.location.longitude]}
              eventHandlers={{
                click: () => onMarkerPress?.(parking),
              }}
            >
              <Popup>
                <strong>{parking.title}</strong>
                <br />
                {parking.location.address}
                <br />
                <button
                  type="button"
                  onClick={() => onMarkerPress?.(parking)}
                  style={{
                    marginTop: 8,
                    padding: '4px 12px',
                    backgroundColor: Colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  Details
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  }
);

export default MapViewWeb;
