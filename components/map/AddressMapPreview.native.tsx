import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Colors, FontSize, BorderRadius, Spacing } from '@/constants/theme';

export interface AddressMapPreviewProps {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  onCoordinatesFound?: (lat: number, lng: number) => void;
  height?: number;
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
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!city && !postalCode) {
      setStatus('idle');
      return;
    }

    const parts = [street, houseNumber, postalCode, city, country].filter(Boolean);
    const query = parts.join(' ');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
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
          setPosition({ latitude: lat, longitude: lng });
          setStatus('found');
          onCoordinatesFound?.(lat, lng);
          mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        } else {
          setStatus('not_found');
        }
      } catch {
        setStatus('not_found');
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [street, houseNumber, postalCode, city, country, onCoordinatesFound]);

  const defaultRegion = {
    latitude: 49.4875,
    longitude: 8.466,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={defaultRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {position && <Marker coordinate={position} />}
      </MapView>
      {status === 'loading' && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>Adresse wird gesucht...</Text>
        </View>
      )}
      {status === 'not_found' && (
        <View style={[styles.statusBar, styles.statusError]}>
          <Text style={[styles.statusText, styles.statusErrorText]}>
            Adresse nicht gefunden
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  statusBar: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  statusError: {
    backgroundColor: 'rgba(255,200,200,0.9)',
  },
  statusErrorText: {
    color: Colors.error,
  },
});
