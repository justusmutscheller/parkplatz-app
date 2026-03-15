import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/node_modules/react-i18next';
import type { ParkingSearchResult } from '@/types';
import { useParkingStore } from '@/stores/parkingStore';
import { Config } from '@/constants/config';
import { Colors, Spacing, BorderRadius, Shadow, FontSize } from '@/constants/theme';
import { ParkingMarker } from '@/components/map/ParkingMarker';
import { ParkingInfoCard } from '@/components/map/ParkingInfoCard';

export default function MapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedParking, setSelectedParking] = useState<ParkingSearchResult | null>(null);

  const {
    parkingSpots,
    isLoading,
    searchNearby,
    setFilters,
  } = useParkingStore();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setLocation(coords);
        setFilters({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        await searchNearby();
      } catch (err) {
        setLocationError(err instanceof Error ? err.message : 'Failed to get location');
      }
    })();
  }, [searchNearby, setFilters]);

  const region = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: Config.DEFAULT_LOCATION.latitudeDelta,
        longitudeDelta: Config.DEFAULT_LOCATION.longitudeDelta,
      }
    : {
        latitude: Config.DEFAULT_LOCATION.latitude,
        longitude: Config.DEFAULT_LOCATION.longitude,
        latitudeDelta: Config.DEFAULT_LOCATION.latitudeDelta,
        longitudeDelta: Config.DEFAULT_LOCATION.longitudeDelta,
      };

  const handleRecenter = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        ...region,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  };

  const handleDetails = () => {
    if (selectedParking) {
      router.push(`/parking/${selectedParking.id}`);
      setSelectedParking(null);
    }
  };

  const handleBook = () => {
    if (selectedParking) {
      router.push({
        pathname: '/parking/book',
        params: { parkingId: selectedParking.id },
      });
      setSelectedParking(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {parkingSpots.map((parking) => (
          <ParkingMarker
            key={parking.id}
            parking={parking}
            onPress={() => setSelectedParking(parking)}
          />
        ))}
      </MapView>

      {/* Search bar */}
      <Pressable
        style={styles.searchBar}
        onPress={() => router.push('/(tabs)/search')}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>{t('search.searchPlaceholder')}</Text>
      </Pressable>

      {/* Re-center button */}
      <Pressable style={styles.recenterButton} onPress={handleRecenter}>
        <Text style={styles.recenterIcon}>📍</Text>
      </Pressable>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Info card */}
      {selectedParking && (
        <ParkingInfoCard
          parking={selectedParking}
          onDetails={handleDetails}
          onBook={handleBook}
          onClose={() => setSelectedParking(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchBar: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
    gap: Spacing.sm,
  },
  searchIcon: {
    fontSize: FontSize.lg,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  recenterButton: {
    position: 'absolute',
    top: 100,
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  recenterIcon: {
    fontSize: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
