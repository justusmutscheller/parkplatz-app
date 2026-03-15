import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/node_modules/react-i18next';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '@/constants/theme';
import { Card, Badge, EmptyState } from '@/components/common';
import { useListingStore } from '@/stores/listingStore';
import { useAuthStore } from '@/stores/authStore';
import type { ParkingListing } from '@/types';

export default function MyListingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const listings = useListingStore((s) => s.listings);
  const isLoading = useListingStore((s) => s.isLoading);
  const getListings = useListingStore((s) => s.getListings);
  const selectListing = useListingStore((s) => s.selectListing);
  const user = useAuthStore((s) => s.user);
  const isBusiness = user?.accountType === 'business';

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getListings();
  }, [getListings]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await getListings();
    setRefreshing(false);
  }, [getListings]);

  const handleListingPress = useCallback(
    (listing: ParkingListing) => {
      selectListing(listing);
      router.push('/listing/manage');
    },
    [selectListing, router]
  );

  const handleCreate = useCallback(() => {
    router.push('/listing/create');
  }, [router]);

  const getMockRevenue = (listing: ParkingListing) => {
    const base = listing.pricing[0]?.price ?? 10;
    return (base * 30 * listing.totalSpots * 0.6).toFixed(0);
  };

  const renderItem = useCallback(
    ({ item }: { item: ParkingListing }) => (
      <Card onPress={() => handleListingPress(item)} style={styles.listingCard}>
        <View style={styles.cardTop}>
          <View style={styles.cardTitleSection}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardAddress} numberOfLines={1}>
              {item.location.address}, {item.location.postalCode}{' '}
              {item.location.city}
            </Text>
          </View>
          <Badge
            text={
              item.isVerified
                ? t('manage.verified')
                : t('manage.unverified')
            }
            variant={item.isVerified ? 'success' : 'warning'}
          />
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.cardDetailItem}>
            <Text style={styles.cardDetailLabel}>
              {t('myListings.spots')}
            </Text>
            <Text style={styles.cardDetailValue}>
              {item.availableSpots}/{item.totalSpots}
            </Text>
          </View>
          <View style={styles.cardDetailDivider} />
          <View style={styles.cardDetailItem}>
            <Text style={styles.cardDetailLabel}>
              {t('myListings.monthlyRevenue')}
            </Text>
            <Text style={styles.cardDetailValueHighlight}>
              ~{getMockRevenue(item)}€
            </Text>
          </View>
          <View style={styles.cardDetailDivider} />
          <View style={styles.cardDetailItem}>
            <Text style={styles.cardDetailLabel}>
              {t('myListings.status')}
            </Text>
            <View style={styles.statusDot}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      item.availableSpots > 0
                        ? Colors.success
                        : Colors.error,
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {item.availableSpots > 0
                  ? t('myListings.active')
                  : t('myListings.paused')}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    ),
    [handleListingPress, t]
  );

  const renderEmpty = useCallback(
    () => (
      <EmptyState
        icon="🅿️"
        title={t('myListings.emptyTitle')}
        description={t('myListings.emptyDescription')}
        actionLabel={t('myListings.createNow')}
        onAction={handleCreate}
      />
    ),
    [handleCreate, t]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('myListings.title')}</Text>
        {isBusiness && (
          <Pressable
            onPress={() => router.push('/listing/dashboard')}
            style={({ pressed }) => [
              styles.dashboardButton,
              pressed && styles.dashboardButtonPressed,
            ]}
          >
            <Text style={styles.dashboardButtonText}>
              {t('dashboard.title')}
            </Text>
            <Text style={styles.dashboardButtonArrow}>→</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          listings.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />

      <Pressable
        onPress={handleCreate}
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
        ]}
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  dashboardButtonPressed: {
    opacity: 0.8,
  },
  dashboardButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  dashboardButtonArrow: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  listContentEmpty: {
    flex: 1,
  },
  listingCard: {
    padding: Spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardAddress: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  cardDetails: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  cardDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  cardDetailDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  cardDetailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  cardDetailValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  cardDetailValueHighlight: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  statusDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  fabPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.95 }],
  },
  fabIcon: {
    fontSize: 28,
    color: Colors.white,
    fontWeight: FontWeight.bold,
    lineHeight: 30,
  },
});
