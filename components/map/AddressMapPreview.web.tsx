import 'leaflet/dist/leaflet.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface AddressMapPreviewProps {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  onCoordinatesFound?: (lat: number, lng: number) => void;
  height?: number;
}

function FlyToPosition({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [map, lat, lng]);
  return null;
}

export default function AddressMapPreview({
  street,
  houseNumber,
  postalCode,
  city,
  country,
  onCoordinatesFound,
  height = 220,
}: AddressMapPreviewProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCoordsRef = useRef(onCoordinatesFound);
  onCoordsRef.current = onCoordinatesFound;

  const geocode = useCallback(async (query: string) => {
    setStatus('loading');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'de' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition([lat, lng]);
        setStatus('found');
        onCoordsRef.current?.(lat, lng);
      } else {
        setStatus('not_found');
      }
    } catch {
      setStatus('not_found');
    }
  }, []);

  useEffect(() => {
    if (!city && !postalCode) {
      setStatus('idle');
      return;
    }

    const parts = [street, houseNumber, postalCode, city, country].filter(Boolean);
    const query = parts.join(' ');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => geocode(query), 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [street, houseNumber, postalCode, city, country, geocode]);

  const defaultCenter: [number, number] = [49.4875, 8.466];

  return (
    <div style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        center={position ?? defaultCenter}
        zoom={position ? 16 : 12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && (
          <>
            <FlyToPosition lat={position[0]} lng={position[1]} />
            <Marker position={position} />
          </>
        )}
      </MapContainer>
      {status === 'loading' && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 6,
          padding: '6px 12px', fontSize: 13, color: '#666', textAlign: 'center',
          zIndex: 1000,
        }}>
          Adresse wird gesucht...
        </div>
      )}
      {status === 'not_found' && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          backgroundColor: 'rgba(255,200,200,0.9)', borderRadius: 6,
          padding: '6px 12px', fontSize: 13, color: '#a00', textAlign: 'center',
          zIndex: 1000,
        }}>
          Adresse nicht gefunden - bitte prüfen
        </div>
      )}
    </div>
  );
}
