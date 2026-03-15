import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '@/node_modules/react-i18next';
import type { ParkingSearchResult } from '@/types';
import { Card } from '@/components/common';
import {
  Colors,
  BorderRadius,
  FontSize,
  FontWeight,
  Spacing,
} from '@/constants/theme';

export interface ParkingCardProps {
  parking: ParkingSearchResult;
  onPress: () => void;
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

function getPricePerHour(parking: ParkingSearchResult): string {
  const hourPrice = parking.pricing.find((p) => p.unit === 'hour');
  if (hourPrice) {
    return `${hourPrice.price.toFixed(2)} €/h`;
  }
  const dayPrice = parking.pricing.find((p) => p.unit === 'day');
  if (dayPrice) {
    return `~${(dayPrice.price / 24).toFixed(2)} €/h`;
  }
  return '-';
}

export function ParkingCard({ parking, onPress }: ParkingCardProps) {
  const { t } = useTranslation();
  const address = [parking.location.address, parking.location.city]
    .filter(Boolean)
    .join(', ');
  const priceText = getPricePerHour(parking);
  const distanceText = formatDistance(parking.distanceKm);
  const typeLabel = parking.type === 'public' ? t('map.public') : t('map.private');
  const typeColor = parking.type === 'public' ? Colors.markerPublic : Colors.markerPrivate;

  const featureBadges: { key: string; label: string }[] = [];
  if (parking.features.covered) featureBadges.push({ key: 'covered', label: t('parking.covered') });
  if (parking.features.evCharging) featureBadges.push({ key: 'ev', label: t('parking.evCharging') });
  if (parking.features.surveillance) featureBadges.push({ key: 'surveillance', label: t('parking.surveillance') });

  return (
    <Card onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoEmoji}>🅿️</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {parking.title}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {address}
          </Text>
          <View style={styles.row}>
            <Text style={styles.price}>{priceText}</Text>
            <View style={[styles.distanceBadge, { backgroundColor: Colors.primaryLight }]}>
              <Text style={styles.distanceText}>{distanceText}</Text>
            </View>
          </View>
          <View style={styles.badgesRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={styles.typeBadgeText}>{typeLabel}</Text>
            </View>
            <Text style={styles.rating}>
              {parking.rating.toFixed(1)} ★
            </Text>
          </View>
          {featureBadges.length > 0 && (
            <View style={styles.featuresRow}>
              {featureBadges.map(({ key, label }) => (
                <View key={key} style={styles.featurePill}>
                  <Text style={styles.featurePillText}>{label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 0,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  photoEmoji: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  address: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  distanceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  distanceText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.white,
  },
  rating: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  featurePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
  },
  featurePillText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
