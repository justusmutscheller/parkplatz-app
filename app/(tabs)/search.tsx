import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/node_modules/react-i18next';
import { useRouter } from 'expo-router';
import { mapsService } from '@/services/maps';
import type { PlacePrediction } from '@/services/maps';
import { useParkingStore } from '@/stores/parkingStore';
import { ParkingCard } from '@/components/parking';
import { Button, EmptyState, LoadingOverlay } from '@/components/common';
import {
  Colors,
  BorderRadius,
  FontSize,
  FontWeight,
  Spacing,
  Shadow,
} from '@/constants/theme';
import type { ParkingSearchResult, ParkingType } from '@/types';

const DISTANCE_PRESETS = [0.5, 1, 2, 5, 10, 25, 50];

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    parkingSpots,
    isLoading,
    filters,
    searchNearby,
    setFilters,
  } = useParkingStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<PlacePrediction[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
  const [typeFilter, setTypeFilter] = useState<ParkingType | 'all'>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [covered, setCovered] = useState(false);
  const [evCharging, setEvCharging] = useState(false);
  const [surveillance, setSurveillance] = useState(false);
  const [availableFrom, setAvailableFrom] = useState('');

  useEffect(() => {
    searchNearby();
  }, [searchNearby]);

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

  const handleSelectPlace = async (place: PlacePrediction) => {
    setSearchQuery(place.description);
    setShowAutocomplete(false);
    Keyboard.dismiss();
    const details = await mapsService.getPlaceDetails(place.placeId);
    if (details) {
      setFilters({ latitude: details.latitude, longitude: details.longitude });
      await searchNearby();
    }
  };

  const handleApplyFilters = useCallback(async () => {
    const updates: Parameters<typeof setFilters>[0] = {
      radiusKm: filters.radiusKm,
      type: typeFilter === 'all' ? undefined : typeFilter,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      covered: covered || undefined,
      evCharging: evCharging || undefined,
      surveillance: surveillance || undefined,
      availableFrom: availableFrom || undefined,
    };
    setFilters(updates);
    await searchNearby();
  }, [
    filters.radiusKm,
    typeFilter,
    minPrice,
    maxPrice,
    covered,
    evCharging,
    surveillance,
    availableFrom,
    setFilters,
    searchNearby,
  ]);

  const handleResetFilters = useCallback(() => {
    setTypeFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setCovered(false);
    setEvCharging(false);
    setSurveillance(false);
    setAvailableFrom('');
    setFilters({
      type: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      covered: undefined,
      evCharging: undefined,
      surveillance: undefined,
      availableFrom: undefined,
    });
    searchNearby();
  }, [setFilters, searchNearby]);

  const sortedResults = React.useMemo(() => {
    const list = [...parkingSpots];
    if (sortBy === 'distance') {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      list.sort((a, b) => {
        const priceA = a.pricing.find((p) => p.unit === 'hour')?.price ?? Infinity;
        const priceB = b.pricing.find((p) => p.unit === 'hour')?.price ?? Infinity;
        return priceA - priceB;
      });
    }
    return list;
  }, [parkingSpots, sortBy]);

  const handleCardPress = useCallback(
    (id: string) => {
      router.push(`/parking/${id}` as const);
    },
    [router]
  );

  const renderParkingCard = useCallback(
    ({ item }: { item: ParkingSearchResult }) => (
      <View style={styles.cardWrapper}>
        <ParkingCard
          parking={item}
          onPress={() => handleCardPress(item.id)}
        />
      </View>
    ),
    [handleCardPress]
  );

  const renderAutocompleteItem = useCallback(
    ({ item }: { item: PlacePrediction }) => (
      <Pressable
        style={styles.autocompleteItem}
        onPress={() => handleSelectPlace(item)}
      >
        <Text style={styles.autocompleteMain}>{item.mainText}</Text>
        <Text style={styles.autocompleteSecondary}>{item.secondaryText}</Text>
      </Pressable>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search.searchPlaceholder')}
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => searchQuery.length >= 2 && setShowAutocomplete(autocompleteResults.length > 0)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
            />
          </View>
          {showAutocomplete && autocompleteResults.length > 0 && (
            <View style={styles.autocompleteDropdown}>
              <FlatList
                data={autocompleteResults}
                keyExtractor={(item) => item.placeId}
                renderItem={renderAutocompleteItem}
                keyboardShouldPersistTaps="handled"
                style={styles.autocompleteList}
              />
            </View>
          )}
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <Pressable
            style={styles.filterToggle}
            onPress={() => setFiltersExpanded(!filtersExpanded)}
          >
            <Text style={styles.filterToggleText}>{t('search.filters')}</Text>
            <Text style={styles.filterToggleIcon}>{filtersExpanded ? '▼' : '▶'}</Text>
          </Pressable>

          {filtersExpanded && (
            <View style={styles.filterContent}>
              {/* Distance */}
              <Text style={styles.filterLabel}>{t('search.radius')}: {filters.radiusKm} km</Text>
              <View style={styles.distanceRow}>
                {DISTANCE_PRESETS.map((km) => (
                  <Pressable
                    key={km}
                    style={[
                      styles.distanceButton,
                      filters.radiusKm === km && styles.distanceButtonActive,
                    ]}
                    onPress={() => setFilters({ radiusKm: km })}
                  >
                    <Text
                      style={[
                        styles.distanceButtonText,
                        filters.radiusKm === km && styles.distanceButtonTextActive,
                      ]}
                    >
                      {km < 1 ? `${km * 1000}m` : `${km}km`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Type Filter */}
              <Text style={styles.filterLabel}>{t('search.typeFilter')}</Text>
              <View style={styles.typeRow}>
                {(['all', 'public', 'private'] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeButton,
                      typeFilter === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setTypeFilter(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        typeFilter === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type === 'all'
                        ? t('search.typeAll')
                        : type === 'public'
                          ? t('search.typePublic')
                          : t('search.typePrivate')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Price Filter */}
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
              <View style={styles.featuresRow}>
                <Pressable
                  style={[styles.featureChip, covered && styles.featureChipActive]}
                  onPress={() => setCovered(!covered)}
                >
                  <Text style={[styles.featureChipText, covered && styles.featureChipTextActive]}>
                    {t('parking.covered')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.featureChip, evCharging && styles.featureChipActive]}
                  onPress={() => setEvCharging(!evCharging)}
                >
                  <Text style={[styles.featureChipText, evCharging && styles.featureChipTextActive]}>
                    {t('parking.evCharging')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.featureChip, surveillance && styles.featureChipActive]}
                  onPress={() => setSurveillance(!surveillance)}
                >
                  <Text style={[styles.featureChipText, surveillance && styles.featureChipTextActive]}>
                    {t('parking.surveillance')}
                  </Text>
                </Pressable>
              </View>

              {/* Availability */}
              <Text style={styles.filterLabel}>{t('search.availableFrom')}</Text>
              <TextInput
                style={styles.availableInput}
                placeholder="z.B. 15.03.2025 10:00"
                placeholderTextColor={Colors.textTertiary}
                value={availableFrom}
                onChangeText={setAvailableFrom}
              />

              <View style={styles.filterActions}>
                <Button
                  title={t('search.applyFilters')}
                  onPress={handleApplyFilters}
                  fullWidth
                />
                <Pressable style={styles.resetButton} onPress={handleResetFilters}>
                  <Text style={styles.resetButtonText}>{t('search.clearFilters')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Results Section */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {t('search.parkingSpotsFound', { count: sortedResults.length })}
            </Text>
            <View style={styles.sortRow}>
              <Pressable
                style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonActive]}
                onPress={() => setSortBy('distance')}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === 'distance' && styles.sortButtonTextActive,
                  ]}
                >
                  {t('search.sortDistance')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
                onPress={() => setSortBy('price')}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === 'price' && styles.sortButtonTextActive,
                  ]}
                >
                  {t('search.sortPrice')}
                </Text>
              </Pressable>
            </View>
          </View>

          {sortedResults.length === 0 ? (
            <EmptyState
              icon="🅿️"
              title={t('search.noResults')}
              description=""
            />
          ) : (
            <FlatList
              data={sortedResults}
              keyExtractor={(item) => item.id}
              renderItem={renderParkingCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      <LoadingOverlay visible={isLoading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  searchSection: {
    marginBottom: Spacing.md,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  autocompleteDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.md,
    maxHeight: 200,
  },
  autocompleteList: {
    maxHeight: 200,
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
  filterSection: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  filterToggleText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  filterToggleIcon: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  filterContent: {
    padding: Spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  distanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  distanceButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
  },
  distanceButtonActive: {
    backgroundColor: Colors.primary,
  },
  distanceButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  distanceButtonTextActive: {
    color: Colors.white,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  typeButtonTextActive: {
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
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  featureChipActive: {
    backgroundColor: Colors.primary,
  },
  featureChipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  featureChipTextActive: {
    color: Colors.white,
  },
  availableInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  filterActions: {
    marginTop: Spacing.lg,
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
  resultsSection: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultsCount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sortButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  sortButtonTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
});
