import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '@/constants/theme';
import { Card, Button, Badge, Divider } from '@/components/common';
import { useListingStore } from '@/stores/listingStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice } from '@/utils/format';
import type { ParkingListing, Booking } from '@/types';

const KPI_COLORS = {
  blue: Colors.primary,
  green: Colors.accent,
  purple: '#8B5CF6',
  orange: '#F59E0B',
};

type TimeRange = '30d' | '12m';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const listings = useListingStore((s) => s.listings);
  const selectListing = useListingStore((s) => s.selectListing);
  const bookings = useBookingStore((s) => s.bookings);
  const user = useAuthStore((s) => s.user);

  const [chartRange, setChartRange] = useState<TimeRange>('30d');
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [pricePercentage, setPricePercentage] = useState('');

  const companyName =
    user?.businessInfo?.companyName ?? t('dashboard.defaultCompany');

  const totalSpots = useMemo(
    () => listings.reduce((sum, l) => sum + l.totalSpots, 0),
    [listings],
  );

  const totalRevenue = useMemo(
    () => bookings.reduce((sum, b) => sum + b.totalPrice, 0),
    [bookings],
  );

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [bookings],
  );

  const activeListings = useMemo(
    () => listings.filter((l) => l.availableSpots > 0),
    [listings],
  );

  const getMockMonthlyRevenue = useCallback((listing: ParkingListing) => {
    const base = listing.pricing[0]?.price ?? 10;
    return base * 30 * listing.totalSpots * 0.6;
  }, []);

  const getStatusBadgeVariant = useCallback(
    (status: Booking['status']): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
      switch (status) {
        case 'confirmed':
        case 'active':
          return 'success';
        case 'completed':
          return 'info';
        case 'cancelled':
          return 'error';
        case 'pending':
          return 'warning';
        default:
          return 'neutral';
      }
    },
    [],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleListingPress = useCallback(
    (listing: ParkingListing) => {
      selectListing(listing);
      router.push('/listing/manage');
    },
    [selectListing, router],
  );

  const handlePauseAll = useCallback(() => {
    Alert.alert(
      t('dashboard.pauseAllTitle'),
      t('dashboard.pauseAllMessage'),
      [
        { text: t('dashboard.cancel'), style: 'cancel' },
        {
          text: t('dashboard.confirm'),
          onPress: () =>
            Alert.alert(t('dashboard.success'), t('dashboard.allPaused')),
        },
      ],
    );
  }, [t]);

  const handleCsvImport = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        Alert.alert(
          t('dashboard.success'),
          t('dashboard.csvImportSuccess', {
            name: result.assets[0].name,
          }),
        );
      }
    } catch {
      Alert.alert(t('dashboard.error'), t('dashboard.csvImportError'));
    }
  }, [t]);

  const handlePriceAdjust = useCallback(() => {
    const pct = parseFloat(pricePercentage);
    if (isNaN(pct)) {
      Alert.alert(t('dashboard.error'), t('dashboard.invalidPercentage'));
      return;
    }
    setPriceModalVisible(false);
    setPricePercentage('');
    Alert.alert(
      t('dashboard.success'),
      t('dashboard.priceAdjusted', { pct: pct > 0 ? `+${pct}` : `${pct}` }),
    );
  }, [pricePercentage, t]);

  const handleExportReport = useCallback(() => {
    Alert.alert(t('dashboard.success'), t('dashboard.reportExported'));
  }, [t]);

  const handleCreateListing = useCallback(() => {
    router.push('/listing/create');
  }, [router]);

  const handleAllBookings = useCallback(() => {
    router.push('/(tabs)/my-bookings');
  }, [router]);

  const kpiCards = useMemo(
    () => [
      {
        id: 'listings',
        icon: '🅿️',
        label: t('dashboard.parkingSpaces'),
        value: listings.length,
        color: KPI_COLORS.blue,
      },
      {
        id: 'spots',
        icon: '📍',
        label: t('dashboard.spots'),
        value: totalSpots,
        color: KPI_COLORS.green,
      },
      {
        id: 'bookings',
        icon: '📅',
        label: t('dashboard.bookings'),
        value: bookings.length,
        color: KPI_COLORS.purple,
      },
      {
        id: 'revenue',
        icon: '💰',
        label: t('dashboard.revenue'),
        value: formatPrice(totalRevenue),
        color: KPI_COLORS.orange,
      },
    ],
    [listings.length, totalSpots, bookings.length, totalRevenue, t],
  );

  const renderListingCard = useCallback(
    ({ item }: { item: ParkingListing }) => (
      <Pressable
        onPress={() => handleListingPress(item)}
        style={({ pressed }) => [
          styles.compactListingCard,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.compactCardHeader}>
          <Text style={styles.compactCardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.availableSpots > 0 ? Colors.success : Colors.error,
                },
              ]}
            />
          </View>
        </View>
        <Text style={styles.compactCardDetail}>
          {item.availableSpots}/{item.totalSpots} {t('dashboard.available')}
        </Text>
        <Text style={styles.compactCardRevenue}>
          ~{formatPrice(getMockMonthlyRevenue(item))}/{t('dashboard.month')}
        </Text>
      </Pressable>
    ),
    [handleListingPress, getMockMonthlyRevenue, t],
  );

  const formatBookingDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>{t('dashboard.title')}</Text>
            <Text style={styles.subtitle}>{companyName}</Text>
          </View>
        </View>

        {/* KPI Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiRow}
        >
          {kpiCards.map((kpi) => (
            <View
              key={kpi.id}
              style={[styles.kpiCard, { borderLeftColor: kpi.color }]}
            >
              <Text style={styles.kpiIcon}>{kpi.icon}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Revenue Chart Placeholder */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('dashboard.revenueChart')}
          </Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderIcon}>📊</Text>
            <Text style={styles.chartPlaceholderText}>
              {t('dashboard.chartLoading')}
            </Text>
          </View>
          <View style={styles.chartToggleRow}>
            <Pressable
              onPress={() => setChartRange('30d')}
              style={[
                styles.chartToggle,
                chartRange === '30d' && styles.chartToggleActive,
              ]}
            >
              <Text
                style={[
                  styles.chartToggleText,
                  chartRange === '30d' && styles.chartToggleTextActive,
                ]}
              >
                {t('dashboard.last30Days')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setChartRange('12m')}
              style={[
                styles.chartToggle,
                chartRange === '12m' && styles.chartToggleActive,
              ]}
            >
              <Text
                style={[
                  styles.chartToggleText,
                  chartRange === '12m' && styles.chartToggleTextActive,
                ]}
              >
                {t('dashboard.last12Months')}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Active Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('dashboard.activeListings')}
            </Text>
            <Badge
              text={`${activeListings.length}`}
              variant="info"
            />
          </View>
          <FlatList
            data={activeListings}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={renderListingCard}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listingsList}
            scrollEnabled={true}
          />
        </View>

        {/* Recent Bookings */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('dashboard.recentBookings')}
          </Text>
          {recentBookings.length === 0 ? (
            <Text style={styles.emptyText}>
              {t('dashboard.noBookings')}
            </Text>
          ) : (
            recentBookings.map((booking, index) => (
              <React.Fragment key={booking.id}>
                <View style={styles.bookingRow}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingTitle} numberOfLines={1}>
                      {booking.parkingTitle}
                    </Text>
                    <Text style={styles.bookingDetail}>
                      {booking.spotLabel} · {formatBookingDate(booking.startTime)}
                    </Text>
                  </View>
                  <View style={styles.bookingRight}>
                    <Text style={styles.bookingPrice}>
                      {formatPrice(booking.totalPrice)}
                    </Text>
                    <Badge
                      text={booking.status}
                      variant={getStatusBadgeVariant(booking.status)}
                    />
                  </View>
                </View>
                {index < recentBookings.length - 1 && (
                  <Divider spacing={Spacing.sm} />
                )}
              </React.Fragment>
            ))
          )}
        </Card>

        {/* Bulk Management */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('dashboard.bulkManagement')}
          </Text>

          <View style={styles.bulkActions}>
            <Button
              title={t('dashboard.pauseAll')}
              variant="outline"
              onPress={handlePauseAll}
              fullWidth
            />

            <View style={styles.bulkActionItem}>
              <Button
                title={t('dashboard.csvImport')}
                variant="secondary"
                onPress={handleCsvImport}
                fullWidth
              />
              <Text style={styles.bulkActionDescription}>
                {t('dashboard.csvImportDescription')}
              </Text>
            </View>

            <View style={styles.bulkActionItem}>
              <Button
                title={t('dashboard.adjustPrices')}
                variant="secondary"
                onPress={() => setPriceModalVisible(true)}
                fullWidth
              />
              <Text style={styles.bulkActionDescription}>
                {t('dashboard.adjustPricesDescription')}
              </Text>
            </View>

            <Button
              title={t('dashboard.exportReport')}
              variant="ghost"
              onPress={handleExportReport}
              fullWidth
            />
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('dashboard.quickActions')}
          </Text>
          <View style={styles.quickActionsRow}>
            <Pressable
              onPress={handleCreateListing}
              style={({ pressed }) => [
                styles.quickActionButton,
                pressed && styles.quickActionPressed,
              ]}
            >
              <Text style={styles.quickActionIcon}>➕</Text>
              <Text style={styles.quickActionLabel}>
                {t('dashboard.createListing')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAllBookings}
              style={({ pressed }) => [
                styles.quickActionButton,
                pressed && styles.quickActionPressed,
              ]}
            >
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionLabel}>
                {t('dashboard.allBookings')}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Price Adjustment Modal */}
      <Modal
        visible={priceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPriceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t('dashboard.adjustPrices')}
            </Text>
            <Text style={styles.modalDescription}>
              {t('dashboard.adjustPricesDescription')}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+10 / -5"
              value={pricePercentage}
              onChangeText={setPricePercentage}
              keyboardType="numeric"
              placeholderTextColor={Colors.textTertiary}
            />
            <Text style={styles.modalHint}>
              {t('dashboard.percentageHint')}
            </Text>
            <View style={styles.modalActions}>
              <Button
                title={t('dashboard.cancel')}
                variant="ghost"
                onPress={() => {
                  setPriceModalVisible(false);
                  setPricePercentage('');
                }}
              />
              <Button
                title={t('dashboard.apply')}
                variant="primary"
                onPress={handlePriceAdjust}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  backButtonText: {
    fontSize: FontSize.xl,
    color: Colors.text,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  kpiRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  kpiCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    minWidth: 140,
    borderLeftWidth: 4,
    ...Shadow.md,
  },
  kpiIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  kpiLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  sectionCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  chartPlaceholderIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  chartPlaceholderText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  chartToggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chartToggle: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
  },
  chartToggleActive: {
    backgroundColor: Colors.primary,
  },
  chartToggleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  chartToggleTextActive: {
    color: Colors.white,
  },
  listingsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  compactListingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: 200,
    ...Shadow.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  compactCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  compactCardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusIndicator: {
    padding: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  compactCardDetail: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  compactCardRevenue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  bookingTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  bookingDetail: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  bookingRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  bookingPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  bulkActions: {
    gap: Spacing.md,
  },
  bulkActionItem: {
    gap: Spacing.xs,
  },
  bulkActionDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.xs,
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  quickActionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
});
