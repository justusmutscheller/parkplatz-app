import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '@/node_modules/react-i18next';
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '@/constants/theme';

interface PayPalButtonProps {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const PAYPAL_YELLOW = '#FFC439';
const PAYPAL_TEXT = '#111827';

export function PayPalButton({
  amount,
  currency,
  onSuccess,
  onError,
}: PayPalButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err : new Error('PayPal error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={PAYPAL_TEXT} size="small" />
      ) : (
        <Text style={styles.buttonText}>
          💳 {t('booking.paypal')} – {amount.toFixed(2).replace('.', ',')} {currency}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: PAYPAL_YELLOW,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Shadow.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: PAYPAL_TEXT,
  },
});
