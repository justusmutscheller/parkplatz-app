import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
  Keyboard,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from '@/components/map/MapViewWrapper';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/node_modules/react-i18next';
import type { ParkingSearchResult, ParkingType, ParkingCategory } from '@/types';
import { useParkingStore } from '@/stores/parkingStore';
import { Config } from '@/constants/config';
import { Colors, Spacing, BorderRadius, Shadow, FontSize, FontWeight } from '@/constants/theme';
import { ParkingMarker } from '@/components/map/ParkingMarker';
import { ParkingInfoCard } from '@/components/map/ParkingInfoCard';
import { mapsService } from '@/services/maps';
import type { PlacePrediction } from '@/services/maps';
import { Button } from '@/components/common';

const DISTANCE_PRESETS = [0.5, 1, 2, 5, 10, 25, 50];

export default function MapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<{ animateToRegion: (r: object) => void } | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedParking, setSelectedParking] = useState<ParkingSearchResult | null>(null);

  const {
    parkingSpots,
    isLoading,
    filters,
    searchNearby,
    setFilters,
  } = useParkingStore();

  // Search & filter state
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<PlacePrediction[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ParkingType | 'all'>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ParkingCategory | 'all'>('all');
  const [covered, setCovered] = useState(false);
  const [evCharging, setEvCharging] = useState(false);
  const [surveillance, setSurveillance] = useState(false);
  const [gated, setGated] = useState(false);
  const [illuminated, setIlluminated] = useState(false);
  const [handicapAccessible, setHandicapAccessible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          setFilters({
            latitude: Config.DEFAULT_LOCATION.latitude,
            longitude: Config.DEFAULT_LOCATION.longitude,
          });
          await searchNearby();
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
        setFilters({
          latitude: Config.DEFAULT_LOCATION.latitude,
          longitude: Config.DEFAULT_LOCATION.longitude,
        });
        await searchNearby();
      }
    })();
  }, [searchNearby, setFilters]);

  useFocusEffect(
    React.useCallback(() => {
      searchNearby();
    }, [searchNearby])
  );

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

  // Autocomplete
  const fetchAutocomplete = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setAutocompleteResults([]);
      return;
    }
    const results = await mapsService.searchPlaces(query.trim());
    setAutocompleteResults(results);
    setShowAutocomplete(results.length > 0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAutocomplete(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchAutocomplete]);

  const handleSelectPlace = useCallback(async (place: PlacePrediction) => {
    setSearchQuery(place.description);
    setShowAutocomplete(false);
    Keyboard.dismiss();
    const details = await mapsService.getPlaceDetails(place.placeId);
    if (details) {
      setFilters({ latitude: details.latitude, longitude: details.longitude });
      mapRef.current?.animateToRegion({
        latitude: details.latitude,
        longitude: details.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      await searchNearby();
    }
  }, [setFilters, searchNearby]);

  const handleApplyFilters = useCallback(async () => {
    const updates: Parameters<typeof setFilters>[0] = {
      radiusKm: filters.radiusKm,
      type: typeFilter === 'all' ? undefined : typeFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      covered: covered || undefined,
      evCharging: evCharging || undefined,
      surveillance: surveillance || undefined,
    };
    setFilters(updates);
    await searchNearby();
    setFiltersExpanded(false);
  }, [filters.radiusKm, typeFilter, categoryFilter, minPrice, maxPrice, covered, evCharging, surveillance, setFilters, searchNearby]);

  const handleResetFilters = useCallback(() => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setCovered(false);
    setEvCharging(false);
    setSurveillance(false);
    setGated(false);
    setIlluminated(false);
    setHandicapAccessible(false);
    setFilters({
      type: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      covered: undefined,
      evCharging: undefined,
      surveillance: undefined,
    });
    searchNearby();
  }, [setFilters, searchNearby]);

  const activeFilterCount = [
    typeFilter !== 'all',
    categoryFilter !== 'all',
    !!minPrice,
    !!maxPrice,
    covered,
    evCharging,
    surveillance,
    gated,
    illuminated,
    handicapAccessible,
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        parkingSpots={parkingSpots}
        onMarkerPress={setSelectedParking}
      >
        {parkingSpots.map((parking) => (
          <ParkingMarker
            key={parking.id}
            parking={parking}
            onPress={() => setSelectedParking(parking)}
          />
        ))}
      </MapView>

      {/* Search overlay */}
      <View style={styles.searchOverlay}>
        <View style={styles.searchBarRow}>
          <View style={styles.searchBarInner}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search.searchPlaceholderShort')}
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => {
                setSearchExpanded(true);
                if (searchQuery.length >= 2) setShowAutocomplete(autocompleteResults.length > 0);
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => { setSearchQuery(''); setShowAutocomplete(false); }}>
                <Text style={styles.clearIcon}>✕</Text>
              </Pressable>
            )}
          </View>
          <Pressable
            style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
            onPress={() => { setSearchExpanded(true); setFiltersExpanded(!filtersExpanded); }}
          >
            <Text style={styles.filterButtonIcon}>⚙️</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Autocomplete dropdown */}
        {showAutocomplete && autocompleteResults.length > 0 && (
          <View style={styles.autocompleteDropdown}>
            {autocompleteResults.map((item) => (
              <Pressable
                key={item.placeId}
                style={styles.autocompleteItem}
                onPress={() => handleSelectPlace(item)}
              >
                <Text style={styles.autocompleteMain}>{item.mainText}</Text>
                <Text style={styles.autocompleteSecondary}>{item.secondaryText}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Results count */}
        {!filtersExpanded && parkingSpots.length > 0 && (
          <View style={styles.resultsChip}>
            <Text style={styles.resultsChipText}>
              {t('search.parkingSpotsFound', { count: parkingSpots.length })}
            </Text>
          </View>
        )}

        {/* Filter panel */}
        {filtersExpanded && (
          <View style={styles.filterPanel}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.filterScroll}
            >
              {/* Distance */}
              <Text style={styles.filterLabel}>{t('search.radius')}: {filters.radiusKm} km</Text>
              <View style={styles.chipRow}>
                {DISTANCE_PRESETS.map((km) => (
                  <Pressable
                    key={km}
                    style={[styles.chip, filters.radiusKm === km && styles.chipActive]}
                    onPress={() => setFilters({ radiusKm: km })}
                  >
                    <Text style={[styles.chipText, filters.radiusKm === km && styles.chipTextActive]}>
                      {km < 1 ? `${km * 1000}m` : `${km}km`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Type */}
              <Text style={styles.filterLabel}>{t('search.typeFilter')}</Text>
              <View style={styles.chipRow}>
                {(['all', 'public', 'private'] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.chip, styles.chipFlex, typeFilter === type && styles.chipActive]}
                    onPress={() => setTypeFilter(type)}
                  >
                    <Text style={[styles.chipText, typeFilter === type && styles.chipTextActive]}>
                      {type === 'all' ? t('search.typeAll') : type === 'public' ? t('search.typePublic') : t('search.typePrivate')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Category */}
              <Text style={styles.filterLabel}>{t('search.categoryFilter')}</Text>
              <View style={styles.chipRow}>
                {(['all', 'garage', 'lot', 'street', 'underground', 'private_spot'] as const).map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.chip, categoryFilter === cat && styles.chipActive]}
                    onPress={() => setCategoryFilter(cat)}
                  >
                    <Text style={[styles.chipText, categoryFilter === cat && styles.chipTextActive]}>
                      {cat === 'all' ? t('search.typeAll') : t(`parking.category.${cat}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Price */}
              <Text style={styles.filterLabel}>{t('search.priceRange')}</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder={t('search.minPrice')}
                  placeholderTextColor={Colors.textTertiary}
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.priceSeparator}>–</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder={t('search.maxPrice')}
                  placeholderTextColor={Colors.textTertiary}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Features */}
              <Text style={styles.filterLabel}>{t('parking.features')}</Text>
              <View style={styles.chipRow}>
                <Pressable style={[styles.chip, covered && styles.chipActive]} onPress={() => setCovered(!covered)}>
                  <Text style={[styles.chipText, covered && styles.chipTextActive]}>{t('parking.covered')}</Text>
                </Pressable>
                <Pressable style={[styles.chip, evCharging && styles.chipActive]} onPress={() => setEvCharging(!evCharging)}>
                  <Text style={[styles.chipText, evCharging && styles.chipTextActive]}>{t('parking.evCharging')}</Text>
                </Pressable>
                <Pressable style={[styles.chip, surveillance && styles.chipActive]} onPress={() => setSurveillance(!surveillance)}>
                  <Text style={[styles.chipText, surveillance && styles.chipTextActive]}>{t('parking.surveillance')}</Text>
                </Pressable>
                <Pressable style={[styles.chip, gated && styles.chipActive]} onPress={() => setGated(!gated)}>
                  <Text style={[styles.chipText, gated && styles.chipTextActive]}>{t('parking.gated')}</Text>
                </Pressable>
                <Pressable style={[styles.chip, illuminated && styles.chipActive]} onPress={() => setIlluminated(!illuminated)}>
                  <Text style={[styles.chipText, illuminated && styles.chipTextActive]}>{t('parking.illuminated')}</Text>
                </Pressable>
                <Pressable style={[styles.chip, handicapAccessible && styles.chipActive]} onPress={() => setHandicapAccessible(!handicapAccessible)}>
                  <Text style={[styles.chipText, handicapAccessible && styles.chipTextActive]}>{t('parking.handicap')}</Text>
                </Pressable>
              </View>

              {/* Actions */}
              <View style={styles.filterActions}>
                <Button title={t('search.applyFilters')} onPress={handleApplyFilters} fullWidth />
                <Pressable style={styles.resetButton} onPress={handleResetFilters}>
                  <Text style={styles.resetButtonText}>{t('search.clearFilters')}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}
      </View>

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
    zIndex: 0,
  },
  searchOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 1000,
    elevation: 1000,
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Platform.OS === 'web' ? Spacing.sm : Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  searchIcon: {
    fontSize: FontSize.lg,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  clearIcon: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.xs,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  filterButtonIcon: {
    fontSize: 20,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  autocompleteDropdown: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    ...Shadow.md,
    maxHeight: 200,
    overflow: 'hidden',
  },
  autocompleteItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  autocompleteMain: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  autocompleteSecondary: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resultsChip: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadow.sm,
  },
  resultsChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  filterPanel: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadow.lg,
    maxHeight: 500,
    overflow: 'hidden',
  },
  filterScroll: {
    padding: Spacing.md,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  chipFlex: {
    flex: 1,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.white,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceInput: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  priceSeparator: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  filterActions: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  resetButton: {
    alignSelf: 'center',
    padding: Spacing.sm,
  },
  resetButtonText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 120,
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
    zIndex: 1000,
    elevation: 1000,
  },
  recenterIcon: {
    fontSize: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
});
