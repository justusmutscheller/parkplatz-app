import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Divider, LoadingOverlay } from '@/components/common';
import { SpotSelector } from '@/components/parking';
import type { PaymentMethod } from '@/types';

type BookingStep = 1 | 2 | 3;

function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',');
}

function parseDateTimeToISO(date: string, time: string): string {
  const [day, month, year] = date.split('/');
  if (!day || !month || !year) return new Date().toISOString();
  return new Date(`${year}-${month}-${day}T${time || '00:00'}:00`).toISOString();
}

function getTodayFormatted(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getCurrentTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

function getTimePlusTwoHours(): string {
  const now = new Date();
  now.setHours(now.getHours() + 2);
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

function calculateHours(startISO: string, endISO: string): number {
  const diff = new Date(endISO).getTime() - new Date(startISO).getTime();
  return Math.max(0, diff / (1000 * 60 * 60));
}

export default function BookingScreen() {
  const { parkingId } = useLocalSearchParams<{ parkingId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { parkingSpots, searchNearby } = useParkingStore();
  const { createBooking, isLoading: bookingLoading } = useBookingStore();
  const user = useAuthStore((s) => s.user);
  const defaultPayment = user?.savedPaymentMethods?.find((pm) => pm.isDefault);

  const [step, setStep] = useState<BookingStep>(1);
  const [startDate, setStartDate] = useState(getTodayFormatted);
  const [startTime, setStartTime] = useState(getCurrentTime);
  const [endDate, setEndDate] = useState(getTodayFormatted);
  const [endTime, setEndTime] = useState(getTimePlusTwoHours);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (parkingSpots.length === 0) {
      searchNearby();
    }
  }, [parkingSpots.length, searchNearby]);

  const parking = parkingSpots.find((p) => p.id === parkingId);

  const startISO = startDate && startTime ? parseDateTimeToISO(startDate, startTime) : '';
  const endISO = endDate && endTime ? parseDateTimeToISO(endDate, endTime) : '';
  const durationHours = startISO && endISO ? calculateHours(startISO, endISO) : 0;

  const hourlyPrice = parking?.pricing.find((p) => p.unit === 'hour')?.price ?? 0;
  const estimatedPrice = Math.round(durationHours * hourlyPrice * 100) / 100;

  const selectedSpot = parking?.spots.find((s) => s.id === selectedSpotId);

  const canProceedStep1 = startDate.length >= 8 && startTime.length >= 4 && endDate.length >= 8 && endTime.length >= 4 && durationHours > 0;
  const canProceedStep2 = selectedSpotId !== null;

  const handleBooking = useCallback(async () => {
    if (!parking || !selectedSpotId || !startISO || !endISO) return;

    const paymentMethod: PaymentMethod =
      defaultPayment?.type === 'paypal' ? 'paypal' : 'stripe';

    try {
      const booking = await createBooking({
        parkingId: parking.id,
        spotId: selectedSpotId,
        startTime: startISO,
        endTime: endISO,
        paymentMethod,
      });
      setConfirmedBookingId(booking.id);
      setShowConfirmation(true);
    } catch {
      // Error handled by store
    }
  }, [parking, selectedSpotId, startISO, endISO, defaultPayment, createBooking]);

  if (!parking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingEmoji}>🅿️</Text>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (showConfirmation) {
    return (
      <View style={styles.confirmationContainer}>
        <View style={styles.confirmationContent}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>

          <Text style={styles.confirmationTitle}>Buchung bestätigt!</Text>

          {/* QR Code Placeholder */}
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>QR</Text>
          </View>

          {/* Booking Summary */}
          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationCardTitle}>{parking.title}</Text>
            <Text style={styles.confirmationCardSub}>
              {parking.location.address}, {parking.location.postalCode}{' '}
              {parking.location.city}
            </Text>
            <Divider spacing={Spacing.sm} />
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>{t('parking.spots')}</Text>
              <Text style={styles.confirmationValue}>
                {selectedSpot?.label ?? selectedSpotId}
              </Text>
            </View>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>{t('booking.startTime')}</Text>
              <Text style={styles.confirmationValue}>
                {startDate} {startTime}
              </Text>
            </View>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>{t('booking.endTime')}</Text>
              <Text style={styles.confirmationValue}>
                {endDate} {endTime}
              </Text>
            </View>
            <Divider spacing={Spacing.sm} />
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationTotalLabel}>
                {t('booking.totalPrice')}
              </Text>
              <Text style={styles.confirmationTotalValue}>
                {formatPrice(estimatedPrice)} €
              </Text>
            </View>
          </View>

          <View style={styles.confirmationActions}>
            <Button
              title="Zu meinen Buchungen"
              onPress={() => router.replace('/(tabs)/my-bookings')}
              variant="primary"
              size="lg"
              fullWidth
            />
            <Button
              title="Zurück zur Karte"
              onPress={() => router.replace('/(tabs)/')}
              variant="outline"
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={bookingLoading} message={t('common.loading')} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep((s) => (s - 1) as BookingStep) : router.back())}
          style={styles.headerBackBtn}
        >
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('booking.newBooking')}</Text>
          <Text style={styles.headerAddress} numberOfLines={1}>
            {parking.location.address}, {parking.location.postalCode} {parking.location.city}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepRow}>
            <View
              style={[
                styles.stepDot,
                s <= step ? styles.stepDotActive : styles.stepDotInactive,
              ]}
            >
              <Text
                style={[
                  styles.stepDotText,
                  s <= step
                    ? styles.stepDotTextActive
                    : styles.stepDotTextInactive,
                ]}
              >
                {s}
              </Text>
            </View>
            {s < 3 && (
              <View
                style={[
                  styles.stepLine,
                  s < step ? styles.stepLineActive : styles.stepLineInactive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Time Selection */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Wann möchten Sie parken?</Text>

            <View style={styles.dateTimeSection}>
              <Input
                label="Startdatum"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="TT/MM/JJJJ"
                keyboardType="number-pad"
              />
              <Input
                label="Startzeit"
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.dateTimeSection}>
              <Input
                label="Enddatum"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="TT/MM/JJJJ"
                keyboardType="number-pad"
              />
              <Input
                label="Endzeit"
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:MM"
                keyboardType="number-pad"
              />
            </View>

            {durationHours > 0 && (
              <View style={styles.estimateCard}>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Dauer</Text>
                  <Text style={styles.estimateValue}>
                    {durationHours.toFixed(1)} {t('parking.pricingUnits.hour')}(n)
                  </Text>
                </View>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>
                    {t('booking.totalPrice')} (geschätzt)
                  </Text>
                  <Text style={styles.estimatePriceValue}>
                    {formatPrice(estimatedPrice)} €
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Spot Selection */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Stellplatz auswählen</Text>
            <SpotSelector
              spots={parking.spots}
              selectedSpotId={selectedSpotId}
              onSelectSpot={setSelectedSpotId}
            />
          </View>
        )}

        {/* Step 3: Summary & Confirm */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Buchungsübersicht</Text>

            {/* Booking Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{parking.title}</Text>
              <Text style={styles.summaryAddress}>
                📍 {parking.location.address}, {parking.location.postalCode}{' '}
                {parking.location.city}
              </Text>
              <Divider spacing={Spacing.sm} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('parking.spots')}</Text>
                <Text style={styles.summaryValue}>
                  {selectedSpot?.label ?? '-'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('booking.startTime')}</Text>
                <Text style={styles.summaryValue}>
                  {startDate} {startTime}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('booking.endTime')}</Text>
                <Text style={styles.summaryValue}>
                  {endDate} {endTime}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Dauer</Text>
                <Text style={styles.summaryValue}>
                  {durationHours.toFixed(1)}h
                </Text>
              </View>

              <Divider spacing={Spacing.sm} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>
                  Geschätzter Preis
                </Text>
                <Text style={styles.summaryTotalValue}>
                  {formatPrice(estimatedPrice)} €
                </Text>
              </View>
            </View>

            {/* Payment Info */}
            <View style={styles.paymentInfoCard}>
              <Text style={styles.paymentInfoTitle}>Zahlungsmethode</Text>
              {defaultPayment ? (
                <View style={styles.paymentInfoRow}>
                  <Text style={styles.paymentInfoIcon}>{defaultPayment.icon}</Text>
                  <Text style={styles.paymentInfoLabel}>{defaultPayment.label}</Text>
                </View>
              ) : (
                <Text style={styles.paymentInfoMissing}>
                  Bitte hinterlege eine Zahlungsmethode in deinem Profil.
                </Text>
              )}
            </View>

            {/* Billing note */}
            <View style={styles.billingNote}>
              <Text style={styles.billingNoteIcon}>ℹ️</Text>
              <Text style={styles.billingNoteText}>
                Die Abrechnung erfolgt nach Ende der Parkzeit. Du zahlst nur die tatsächlich genutzte Dauer. Verlässt du den Parkplatz früher, wird der Preis entsprechend angepasst.
              </Text>
            </View>

            <Text style={styles.termsText}>
              Mit der Buchung akzeptierst du unsere AGB und verpflichtest dich zur Zahlung nach Nutzungsende.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      {!showConfirmation && (
        <View style={styles.bottomBar}>
          {step < 3 ? (
            <Button
              title={t('common.next')}
              onPress={() => setStep((s) => (s + 1) as BookingStep)}
              variant="primary"
              size="lg"
              fullWidth
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
            />
          ) : (
            <Button
              title={`Buchung bestätigen – ca. ${formatPrice(estimatedPrice)} €`}
              onPress={handleBooking}
              variant="primary"
              size="lg"
              fullWidth
              loading={bookingLoading}
              disabled={!defaultPayment}
            />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackText: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  headerAddress: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },

  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotInactive: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepDotText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  stepDotTextActive: {
    color: Colors.white,
  },
  stepDotTextInactive: {
    color: Colors.textTertiary,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: Spacing.xs,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  stepLineInactive: {
    backgroundColor: Colors.border,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },

  stepContainer: {
    padding: Spacing.lg,
  },
  stepTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },

  dateTimeSection: {
    marginBottom: Spacing.sm,
  },

  estimateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  estimateLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  estimateValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  estimatePriceValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  summaryTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  summaryAddress: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  summaryTotalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  summaryTotalValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  paymentInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  paymentInfoTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  paymentInfoIcon: {
    fontSize: FontSize.xl,
  },
  paymentInfoLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  paymentInfoMissing: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontStyle: 'italic',
  },

  billingNote: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  billingNoteIcon: {
    fontSize: FontSize.lg,
    marginTop: 2,
  },
  billingNoteText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },

  termsText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 18,
  },

  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadow.lg,
  },

  // Confirmation Screen
  confirmationContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  confirmationContent: {
    width: '100%',
    alignItems: 'center',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  checkMark: {
    fontSize: 40,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  confirmationTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.white,
  },
  qrText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
  },
  confirmationCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  confirmationCardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  confirmationCardSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  confirmationLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  confirmationValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  confirmationTotalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  confirmationTotalValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  confirmationActions: {
    width: '100%',
    gap: Spacing.sm,
  },
});
