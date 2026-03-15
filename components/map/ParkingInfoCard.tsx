import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from '@/node_modules/react-i18next';
import type { ParkingSearchResult } from '@/types';
import { Colors, Spacing, BorderRadius, Shadow, FontSize, FontWeight } from '@/constants/theme';
import { Button } from '@/components/common';
import { formatPrice, formatDistance } from '@/utils/format';

export interface ParkingInfoCardProps {
  parking: ParkingSearchResult;
  onDetails: () => void;
  onBook: () => void;
  onClose: () => void;
}

export function ParkingInfoCard({
  parking,
  onDetails,
  onBook,
  onClose,
}: ParkingInfoCardProps) {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [slideAnim]);

  const hourPrice = parking.pricing.find((p) => p.unit === 'hour');
  const priceText = hourPrice
    ? formatPrice(hourPrice.price, hourPrice.currency) + '/h'
    : '—';

  const photoUri = parking.photos?.[0];

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <View style={styles.imageContainer}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>🅿️</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.badges}>
          <View
            style={[
              styles.typeBadge,
              parking.type === 'public' ? styles.badgePublic : styles.badgePrivate,
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {parking.type === 'public' ? t('map.public') : t('map.private')}
            </Text>
          </View>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{formatDistance(parking.distanceKm)}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {parking.title}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {parking.location.address}, {parking.location.city}
        </Text>

        <View style={styles.meta}>
          <Text style={styles.price}>{priceText}</Text>
          <Text style={styles.rating}>
            ★ {parking.rating.toFixed(1)} ({parking.reviewCount})
          </Text>
        </View>

        <View style={styles.buttons}>
          <View style={styles.buttonWrapper}>
            <Button
              title={t('parking.showDetails')}
              onPress={onDetails}
              variant="outline"
              fullWidth
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title={t('parking.bookNow')}
              onPress={onBook}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    ...Shadow.lg,
    zIndex: 1001,
    elevation: 1001,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.md,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  imageContainer: {
    height: 120,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl + 24,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgePublic: {
    backgroundColor: Colors.primaryLight,
  },
  badgePrivate: {
    backgroundColor: Colors.accentLight,
  },
  typeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  distanceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
  },
  distanceText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  address: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  rating: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  buttonWrapper: {
    flex: 1,
  },
});
