import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '@/node_modules/react-i18next';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '@/constants/theme';
import { Input, Button } from '@/components/common';
import { PayPalButton } from './PayPalButton';
import { paymentService } from '@/services/payment';

interface PaymentSheetProps {
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal';
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentSheet({
  amount,
  currency,
  paymentMethod,
  onSuccess,
  onCancel,
}: PaymentSheetProps) {
  const { t } = useTranslation();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStripePayment = async () => {
    setLoading(true);
    try {
      const intent = await paymentService.createStripePaymentIntent(
        amount * 100,
        currency
      );
      await paymentService.confirmStripePayment(intent.id);
      onSuccess();
    } catch {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (paymentMethod === 'paypal') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('booking.paypal')}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>{t('booking.totalPrice')}</Text>
          <Text style={styles.amountValue}>
            {amount.toFixed(2).replace('.', ',')} {currency}
          </Text>
        </View>
        <PayPalButton
          amount={amount}
          currency={currency}
          onSuccess={onSuccess}
          onError={() => {}}
        />
        <Button
          title={t('common.cancel')}
          onPress={onCancel}
          variant="ghost"
          size="md"
          fullWidth
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('booking.stripe')}</Text>
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>{t('booking.totalPrice')}</Text>
        <Text style={styles.amountValue}>
          {amount.toFixed(2).replace('.', ',')} {currency}
        </Text>
      </View>

      <Input
        label="Kartennummer"
        value={cardNumber}
        onChangeText={setCardNumber}
        placeholder="4242 4242 4242 4242"
        keyboardType="number-pad"
        maxLength={19}
      />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="Ablaufdatum"
            value={expiry}
            onChangeText={setExpiry}
            placeholder="MM/JJ"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="CVC"
            value={cvc}
            onChangeText={setCvc}
            placeholder="123"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={`Bezahlen – ${amount.toFixed(2).replace('.', ',')} ${currency}`}
          onPress={handleStripePayment}
          variant="primary"
          size="lg"
          fullWidth
        />
        <Button
          title={t('common.cancel')}
          onPress={onCancel}
          variant="ghost"
          size="md"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  amountLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  loadingContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
