import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '@/node_modules/react-i18next';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '@/constants/theme';
import { useParkingStore } from '@/stores/parkingStore';
import { Badge, Divider, Button } from '@/components/common';
import type { ParkingSearchResult, ParkingFeatures, AvailabilityWindow } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_HEIGHT = 200;
const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const UNIT_ABBR: Record<string, string> = {
  hour: 'Std',
  day: 'Tag',
  week: 'Wo',
  month: 'Mo',
};

interface FeatureItem {
  key: keyof ParkingFeatures;
  labelKey: string;
}

const FEATURES: FeatureItem[] = [
  { key: 'covered', labelKey: 'parking.covered' },
  { key: 'illuminated', labelKey: 'parking.illuminated' },
  { key: 'gated', labelKey: 'parking.gated' },
  { key: 'surveillance', labelKey: 'parking.surveillance' },
  { key: 'evCharging', labelKey: 'parking.evCharging' },
  { key: 'handicapAccessible', labelKey: 'parking.handicap' },
];

function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',');
}

function getLowestHourlyPrice(parking: ParkingSearchResult): string {
  const hourly = parking.pricing.find((p) => p.unit === 'hour');
  if (hourly) return `ab ${formatPrice(hourly.price)} €/Std`;
  const first = parking.pricing[0];
  if (first) return `ab ${formatPrice(first.price)} €/${UNIT_ABBR[first.unit] ?? first.unit}`;
  return '';
}

function formatAvailability(windows: AvailabilityWindow[]): string[] {
  const grouped: Record<string, number[]> = {};
  for (const w of windows) {
    const timeRange = `${w.startTime} – ${w.endTime}`;
    if (!grouped[timeRange]) grouped[timeRange] = [];
    grouped[timeRange].push(w.dayOfWeek);
  }

  return Object.entries(grouped).map(([timeRange, days]) => {
    days.sort((a, b) => a - b);
    const dayStr = days.map((d) => DAY_LABELS[d]).join(', ');
    const label = timeRange === '00:00 – 23:59' ? '24h' : timeRange;
    return `${dayStr}: ${label}`;
  });
}

export default function ParkingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { parkingSpots, searchNearby } = useParkingStore();

  useEffect(() => {
    if (parkingSpots.length === 0) {
      searchNearby();
    }
  }, [parkingSpots.length, searchNearby]);

  const parking = parkingSpots.find((p) => p.id === id);

  if (!parking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>🅿️</Text>
        <Text style={styles.notFoundTitle}>{t('parking.details')}</Text>
        <Text style={styles.notFoundSub}>{t('common.loading')}</Text>
      </View>
    );
  }

  const fullAddress = `${parking.location.address}, ${parking.location.postalCode} ${parking.location.city}`;
  const typeLabel = parking.type === 'public' ? t('map.public') : t('map.private');
  const categoryLabel = t(`parking.category.${parking.category}`);
  const availabilityLines = formatAvailability(parking.availability);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
        >
          {(parking.photos.length > 0 ? parking.photos : ['1', '2', '3']).map(
            (_, index) => (
              <View key={index} style={styles.galleryItem}>
                <Text style={styles.galleryEmoji}>🅿️</Text>
              </View>
            )
          )}
        </ScrollView>

        <View style={styles.content}>
          {/* Title & Verified */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {parking.title}
            </Text>
            {parking.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>

          {/* Address */}
          <View style={styles.addressRow}>
            <Text style={styles.pinIcon}>📍</Text>
            <Text style={styles.addressText}>{fullAddress}</Text>
          </View>

          {/* Type & Category Badges */}
          <View style={styles.badgeRow}>
            <Badge
              text={typeLabel}
              variant={parking.type === 'public' ? 'info' : 'success'}
            />
            <View style={styles.badgeSpacer} />
            <Badge text={categoryLabel} variant="neutral" />
          </View>

          {/* Pricing Cards */}
          <Text style={styles.sectionTitle}>{t('parking.pricing')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pricingScroll}
          >
            {parking.pricing.map((p) => (
              <View key={p.unit} style={styles.pricingCard}>
                <Text style={styles.pricingAmount}>
                  {formatPrice(p.price)} €
                </Text>
                <Text style={styles.pricingUnit}>
                  / {t(`parking.pricingUnits.${p.unit}`)}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>
              {parking.rating.toFixed(1)} ★
            </Text>
            <Text style={styles.ratingCount}>
              ({parking.reviewCount} {t('parking.reviews')})
            </Text>
          </View>

          <Divider />

          {/* Features */}
          <Text style={styles.sectionTitle}>{t('parking.features')}</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((feat) => {
              const active = parking.features[feat.key];
              if (typeof active !== 'boolean') return null;
              return (
                <View
                  key={feat.key}
                  style={[
                    styles.featurePill,
                    active ? styles.featurePillActive : styles.featurePillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.featurePillText,
                      active
                        ? styles.featurePillTextActive
                        : styles.featurePillTextInactive,
                    ]}
                  >
                    {active ? '✓ ' : '✗ '}
                    {t(feat.labelKey)}
                  </Text>
                </View>
              );
            })}
          </View>

          <Divider />

          {/* Availability */}
          <Text style={styles.sectionTitle}>{t('parking.availability')}</Text>
          <View style={styles.availabilityBox}>
            {availabilityLines.map((line, i) => (
              <Text key={i} style={styles.availabilityLine}>
                {line}
              </Text>
            ))}
          </View>

          <Divider />

          {/* Description */}
          <Text style={styles.sectionTitle}>{t('listing.description')}</Text>
          <Text style={styles.descriptionText}>{parking.description}</Text>

          <Divider />

          {/* Map Placeholder */}
          <Text style={styles.sectionTitle}>{t('map.showOnMap')}</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>🗺️</Text>
            <Text style={styles.mapText}>{fullAddress}</Text>
          </View>

          {/* Spots Info */}
          <View style={styles.spotsInfoRow}>
            <Text style={styles.spotsInfoText}>
              {parking.availableSpots} von {parking.totalSpots}{' '}
              {t('parking.spots')} verfügbar
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceText}>
            {getLowestHourlyPrice(parking)}
          </Text>
        </View>
        <Button
          title={t('parking.bookNow')}
          onPress={() =>
            router.push(`/parking/book?parkingId=${parking.id}`)
          }
          variant="primary"
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  notFoundText: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  notFoundTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  notFoundSub: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  gallery: {
    height: GALLERY_HEIGHT,
  },
  galleryItem: {
    width: SCREEN_WIDTH,
    height: GALLERY_HEIGHT,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryEmoji: {
    fontSize: 64,
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  verifiedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  verifiedText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pinIcon: {
    fontSize: FontSize.md,
    marginRight: Spacing.xs,
  },
  addressText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    flex: 1,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  badgeSpacer: {
    width: Spacing.sm,
  },

  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },

  pricingScroll: {
    marginBottom: Spacing.lg,
  },
  pricingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginRight: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  pricingAmount: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  pricingUnit: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ratingValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.warning,
  },
  ratingCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featurePill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  featurePillActive: {
    backgroundColor: Colors.successLight,
  },
  featurePillInactive: {
    backgroundColor: Colors.surfaceSecondary,
  },
  featurePillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  featurePillTextActive: {
    color: Colors.accentDark,
  },
  featurePillTextInactive: {
    color: Colors.textTertiary,
  },

  availabilityBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  availabilityLine: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 22,
  },

  descriptionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },

  mapPlaceholder: {
    height: 160,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  mapEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  mapText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  spotsInfoRow: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  spotsInfoText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },

  backButton: {
    position: 'absolute',
    top: 52,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadow.lg,
  },
  bottomPrice: {
    flex: 1,
    marginRight: Spacing.md,
  },
  bottomPriceText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
});
