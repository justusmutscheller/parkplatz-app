import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
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
import { Card, Badge, Button, Divider, EmptyState, BottomModal } from '@/components/common';
import { useBookingStore } from '@/stores/bookingStore';
import { formatDate, formatTime, formatPrice } from '@/utils/format';
import type { Booking, BookingStatus } from '@/types';

type TabFilter = 'active' | 'past' | 'cancelled';

const TAB_TO_STATUSES: Record<TabFilter, BookingStatus[]> = {
  active: ['pending', 'confirmed', 'active'],
  past: ['completed'],
  cancelled: ['cancelled'],
};

function getStatusBadge(status: BookingStatus, t: (key: string) => string) {
  switch (status) {
    case 'active':
    case 'confirmed':
    case 'pending':
      return { text: t('booking.status.active'), variant: 'success' as const };
    case 'completed':
      return { text: t('booking.status.completed'), variant: 'neutral' as const };
    case 'cancelled':
      return { text: t('booking.status.cancelled'), variant: 'error' as const };
  }
}

function getPaymentBadge(method: 'stripe' | 'paypal') {
  return method === 'stripe'
    ? { text: '💳 Stripe', variant: 'info' as const }
    : { text: 'PP PayPal', variant: 'info' as const };
}

export default function MyBookingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const bookings = useBookingStore((s) => s.bookings);
  const cancelBooking = useBookingStore((s) => s.cancelBooking);
  const getBookings = useBookingStore((s) => s.getBookings);

  const [activeTab, setActiveTab] = useState<TabFilter>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'active', label: t('booking.activeTab') },
    { key: 'past', label: t('booking.pastTab') },
    { key: 'cancelled', label: t('booking.cancelledTab') },
  ];

  const filteredBookings = useMemo(
    () => bookings.filter((b) => TAB_TO_STATUSES[activeTab].includes(b.status)),
    [bookings, activeTab],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await getBookings();
    setRefreshing(false);
  }, [getBookings]);

  const handleCancel = useCallback(
    (booking: Booking) => {
      Alert.alert(
        t('booking.cancelBooking'),
        t('booking.cancelConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: () => cancelBooking(booking.id),
          },
        ],
      );
    },
    [cancelBooking, t],
  );

  const handleShowQr = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setQrModalVisible(true);
  }, []);

  const handleBookAgain = useCallback(() => {
    router.push('/(tabs)/search');
  }, [router]);

  const handleLeaveReview = useCallback(() => {
    Alert.alert(t('booking.leaveReview'), '', [{ text: 'OK' }]);
  }, [t]);

  const renderActions = useCallback(
    (booking: Booking) => {
      const isActive = TAB_TO_STATUSES.active.includes(booking.status);
      const isCompleted = booking.status === 'completed';
      const isCancelled = booking.status === 'cancelled';

      return (
        <View style={styles.actionsRow}>
          {isActive && (
            <>
              <Button
                title={t('booking.showQrCode')}
                onPress={() => handleShowQr(booking)}
                variant="primary"
                size="sm"
              />
              <Pressable
                onPress={() => handleCancel(booking)}
                style={({ pressed }) => [
                  styles.textButton,
                  pressed && styles.textButtonPressed,
                ]}
              >
                <Text style={styles.cancelText}>{t('booking.cancelBooking')}</Text>
              </Pressable>
            </>
          )}
          {isCompleted && (
            <>
              <Button
                title={t('booking.leaveReview')}
                onPress={handleLeaveReview}
                variant="outline"
                size="sm"
              />
              <Button
                title={t('booking.bookAgain')}
                onPress={handleBookAgain}
                variant="primary"
                size="sm"
              />
            </>
          )}
          {isCancelled && (
            <Button
              title={t('booking.bookAgain')}
              onPress={handleBookAgain}
              variant="primary"
              size="sm"
            />
          )}
        </View>
      );
    },
    [t, handleShowQr, handleCancel, handleLeaveReview, handleBookAgain],
  );

  const renderItem = useCallback(
    ({ item }: { item: Booking }) => {
      const statusBadge = getStatusBadge(item.status, t);
      const paymentBadge = getPaymentBadge(item.paymentMethod);

      return (
        <Card style={styles.bookingCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.parkingTitle} numberOfLines={1}>
              {item.parkingTitle}
            </Text>
            <Badge text={statusBadge.text} variant={statusBadge.variant} />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText} numberOfLines={1}>
              {item.parkingAddress}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🅿️</Text>
            <Text style={styles.infoText}>
              {t('booking.spot')} {item.spotLabel}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoText}>
              {formatDate(item.startTime)}, {formatTime(item.startTime)} –{' '}
              {formatTime(item.endTime)}
            </Text>
          </View>

          <View style={styles.pricePaymentRow}>
            <Text style={styles.price}>
              {formatPrice(item.totalPrice, item.currency)}
            </Text>
            <Badge text={paymentBadge.text} variant={paymentBadge.variant} />
          </View>

          <Divider spacing={Spacing.sm} />

          {renderActions(item)}
        </Card>
      );
    },
    [t, renderActions],
  );

  const renderEmpty = useCallback(
    () => (
      <EmptyState
        icon="📋"
        title={t('booking.noBookingsTitle')}
        description={t('booking.noBookingsDescription')}
        actionLabel={t('booking.searchParking')}
        onAction={() => router.push('/(tabs)/search')}
      />
    ),
    [t, router],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('booking.myBookings')}</Text>
      </View>

      <View style={styles.segmentContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.segmentTab,
              activeTab === tab.key && styles.segmentTabActive,
            ]}
          >
            <Text
              style={[
                styles.segmentLabel,
                activeTab === tab.key && styles.segmentLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          filteredBookings.length === 0 && styles.listContentEmpty,
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

      <BottomModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        title={t('booking.qrCode')}
      >
        {selectedBooking && (
          <View style={styles.qrContent}>
            <Text style={styles.qrTitle}>{selectedBooking.parkingTitle}</Text>
            <Text style={styles.qrAddress}>{selectedBooking.parkingAddress}</Text>
            <Text style={styles.qrTime}>
              {formatDate(selectedBooking.startTime)},{' '}
              {formatTime(selectedBooking.startTime)} –{' '}
              {formatTime(selectedBooking.endTime)}
            </Text>

            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>QR</Text>
            </View>

            <Text style={styles.qrInstruction}>
              {t('booking.showAtParking')}
            </Text>
          </View>
        )}
      </BottomModal>
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
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  segmentTabActive: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  segmentLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  segmentLabelActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  listContentEmpty: {
    flex: 1,
  },
  bookingCard: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  parkingTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  infoIcon: {
    fontSize: FontSize.sm,
    marginRight: Spacing.sm,
    width: 20,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  pricePaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  price: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  textButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  textButtonPressed: {
    opacity: 0.6,
  },
  cancelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.error,
  },
  qrContent: {
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  qrTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  qrAddress: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  qrTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
  },
  qrPlaceholderText: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
  },
  qrInstruction: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
