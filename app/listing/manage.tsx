import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '@/constants/theme';
import { Button, Card, Badge, Divider } from '@/components/common';
import { useListingStore } from '@/stores/listingStore';

export default function ManageListingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const selectedListing = useListingStore((s) => s.selectedListing);
  const updateListing = useListingStore((s) => s.updateListing);
  const deleteListing = useListingStore((s) => s.deleteListing);

  const listing = selectedListing;

  const handlePause = useCallback(() => {
    if (!listing) return;
    Alert.alert(
      t('manage.pauseTitle'),
      t('manage.pauseMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('manage.pause'),
          onPress: () => {
            updateListing(listing.id, { availableSpots: 0 });
            Alert.alert(t('manage.paused'));
          },
        },
      ]
    );
  }, [listing, updateListing, t]);

  const handleDelete = useCallback(() => {
    if (!listing) return;
    Alert.alert(
      t('manage.deleteTitle'),
      t('manage.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('manage.delete'),
          style: 'destructive',
          onPress: () => {
            deleteListing(listing.id);
            router.replace('/(tabs)/my-listings');
          },
        },
      ]
    );
  }, [listing, deleteListing, router, t]);

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('manage.noListing')}</Text>
          <Button
            title={t('listing.back')}
            onPress={() => router.back()}
            variant="ghost"
          />
        </View>
      </SafeAreaView>
    );
  }

  const mockBookings = Math.floor(Math.random() * 50) + 10;
  const mockRevenue = (mockBookings * 18.5).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{t('listing.back')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('manage.title')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            <Badge
              text={
                listing.isVerified
                  ? t('manage.verified')
                  : t('manage.unverified')
              }
              variant={listing.isVerified ? 'success' : 'warning'}
            />
          </View>
          <Text style={styles.listingAddress}>
            {listing.location.address}, {listing.location.postalCode}{' '}
            {listing.location.city}
          </Text>
          <Text style={styles.listingDescription}>{listing.description}</Text>

          <Divider />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('manage.category')}</Text>
              <Text style={styles.detailValue}>{listing.category}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('manage.spots')}</Text>
              <Text style={styles.detailValue}>
                {listing.availableSpots}/{listing.totalSpots}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('manage.pricing')}</Text>
              <Text style={styles.detailValue}>
                {listing.pricing
                  .map(
                    (p) =>
                      `${p.price.toFixed(2)}€/${t(`listing.pricing.${p.unit}`)}`
                  )
                  .join(', ')}
              </Text>
            </View>
          </View>

          {listing.spots.length > 0 && (
            <>
              <Divider />
              <Text style={styles.sectionLabel}>{t('manage.spotsList')}</Text>
              <View style={styles.spotChips}>
                {listing.spots.map((spot) => (
                  <View
                    key={spot.id}
                    style={[
                      styles.spotChip,
                      !spot.isAvailable && styles.spotChipUnavailable,
                    ]}
                  >
                    <Text
                      style={[
                        styles.spotChipText,
                        !spot.isAvailable && styles.spotChipTextUnavailable,
                      ]}
                    >
                      {spot.label}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        <Text style={styles.statsHeading}>{t('manage.statistics')}</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{mockBookings}</Text>
            <Text style={styles.statLabel}>{t('manage.bookings')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{mockRevenue}€</Text>
            <Text style={styles.statLabel}>{t('manage.revenue')}</Text>
          </Card>
        </View>

        <View style={styles.actionButtons}>
          <Button
            title={t('manage.edit')}
            onPress={() => router.push('/listing/create')}
            variant="primary"
            fullWidth
          />
          <View style={styles.buttonSpacer} />
          <Button
            title={t('manage.pause')}
            onPress={handlePause}
            variant="outline"
            fullWidth
          />
          <View style={styles.buttonSpacer} />
          <Button
            title={t('manage.delete')}
            onPress={handleDelete}
            variant="danger"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    minWidth: 60,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  listingTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  listingAddress: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  listingDescription: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  detailsGrid: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  spotChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  spotChip: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  spotChipUnavailable: {
    backgroundColor: Colors.errorLight,
  },
  spotChipText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  spotChipTextUnavailable: {
    color: Colors.error,
  },
  statsHeading: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  actionButtons: {
    marginTop: Spacing.md,
  },
  buttonSpacer: {
    height: Spacing.sm,
  },
});
