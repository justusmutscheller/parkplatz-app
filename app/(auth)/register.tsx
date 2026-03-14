import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import { registrationSchema } from '@/utils/validation';
import type { RegistrationData } from '@/types';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  placeOfBirth: string;
  address: {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country: string;
  };
  accountType: 'private' | 'business';
  businessInfo?: {
    companyName: string;
    vatId: string;
    tradeRegisterNumber: string;
  };
};

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { phone, setPhone, sendSmsCode, setPendingRegistration } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localPhone, setLocalPhone] = useState(phone || '');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      placeOfBirth: '',
      address: {
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        country: t('auth.defaultCountry'),
      },
      accountType: 'private',
      businessInfo: undefined,
    },
  });

  const accountType = watch('accountType');

  useEffect(() => {
    if (accountType === 'business') {
      setValue('businessInfo', {
        companyName: '',
        vatId: '',
        tradeRegisterNumber: '',
      });
    } else {
      setValue('businessInfo', undefined);
    }
  }, [accountType, setValue]);
  const isBusiness = accountType === 'business';

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const fullPhone = localPhone.startsWith('+')
        ? localPhone
        : `+49${localPhone.replace(/^0+/, '')}`;
      const registrationData: RegistrationData = {
        phone: fullPhone,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        placeOfBirth: data.placeOfBirth,
        address: data.address,
        accountType: data.accountType,
        ...(isBusiness && data.businessInfo && { businessInfo: data.businessInfo }),
      };
      setPendingRegistration(registrationData);
      setPhone(fullPhone);
      await sendSmsCode();
      router.push('/(auth)/verify-sms');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>← {t('common.back')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('auth.createAccount')}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>{t('auth.personalData')}</Text>
          <Input
            label={t('auth.phoneNumber')}
            value={localPhone}
            onChangeText={(text) => setLocalPhone(text.replace(/\D/g, ''))}
            placeholder="170 1234567"
            keyboardType="phone-pad"
            leftIcon={<Text style={styles.prefixText}>🇩🇪 +49</Text>}
          />
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.firstName')}
                value={value}
                onChangeText={onChange}
                placeholder={t('auth.firstName')}
                error={errors.firstName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.lastName')}
                value={value}
                onChangeText={onChange}
                placeholder={t('auth.lastName')}
                error={errors.lastName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.dateOfBirth')}
                value={value}
                onChangeText={onChange}
                placeholder="DD.MM.YYYY"
                error={errors.dateOfBirth?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="placeOfBirth"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.placeOfBirth')}
                value={value}
                onChangeText={onChange}
                placeholder={t('auth.placeOfBirth')}
                error={errors.placeOfBirth?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.emailAddress')}
                value={value}
                onChangeText={onChange}
                placeholder={t('auth.emailAddress')}
                keyboardType="email-address"
                error={errors.email?.message}
              />
            )}
          />

          <Text style={styles.sectionTitle}>{t('auth.address')}</Text>
          <View style={styles.row}>
            <Controller
              control={control}
              name="address.street"
              render={({ field: { onChange, value } }) => (
                <View style={styles.halfInput}>
                  <Input
                    label={t('auth.street')}
                    value={value}
                    onChangeText={onChange}
                    placeholder={t('auth.street')}
                    error={errors.address?.street?.message}
                  />
                </View>
              )}
            />
            <Controller
              control={control}
              name="address.houseNumber"
              render={({ field: { onChange, value } }) => (
                <View style={styles.halfInput}>
                  <Input
                    label={t('auth.houseNumber')}
                    value={value}
                    onChangeText={onChange}
                    placeholder={t('auth.houseNumber')}
                    error={errors.address?.houseNumber?.message}
                  />
                </View>
              )}
            />
          </View>
          <View style={styles.row}>
            <Controller
              control={control}
              name="address.postalCode"
              render={({ field: { onChange, value } }) => (
                <View style={styles.halfInput}>
                  <Input
                    label={t('auth.postalCode')}
                    value={value}
                    onChangeText={onChange}
                    placeholder={t('auth.postalCode')}
                    keyboardType="number-pad"
                    error={errors.address?.postalCode?.message}
                  />
                </View>
              )}
            />
            <Controller
              control={control}
              name="address.city"
              render={({ field: { onChange, value } }) => (
                <View style={styles.halfInput}>
                  <Input
                    label={t('auth.city')}
                    value={value}
                    onChangeText={onChange}
                    placeholder={t('auth.city')}
                    error={errors.address?.city?.message}
                  />
                </View>
              )}
            />
          </View>
          <Controller
            control={control}
            name="address.country"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.country')}
                value={value}
                onChangeText={onChange}
                placeholder={t('auth.country')}
                error={errors.address?.country?.message}
              />
            )}
          />

          <Text style={styles.sectionTitle}>{t('auth.accountType')}</Text>
          <View style={styles.accountTypeRow}>
            <Controller
              control={control}
              name="accountType"
              render={({ field: { onChange, value } }) => (
                <>
                  <Pressable
                    style={[
                      styles.accountCard,
                      value === 'private' && styles.accountCardSelected,
                    ]}
                    onPress={() => onChange('private')}
                  >
                    <Text
                      style={[
                        styles.accountCardText,
                        value === 'private' && styles.accountCardTextSelected,
                      ]}
                    >
                      {t('auth.privatePerson')}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.accountCard,
                      value === 'business' && styles.accountCardSelected,
                    ]}
                    onPress={() => onChange('business')}
                  >
                    <Text
                      style={[
                        styles.accountCardText,
                        value === 'business' && styles.accountCardTextSelected,
                      ]}
                    >
                      {t('auth.business')}
                    </Text>
                  </Pressable>
                </>
              )}
            />
          </View>

          {isBusiness && (
            <>
              <Text style={styles.sectionTitle}>{t('business.companyDetails')}</Text>
              <Controller
                control={control}
                name="businessInfo.companyName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('auth.companyName')}
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder={t('auth.companyName')}
                    error={errors.businessInfo?.companyName?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="businessInfo.vatId"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('auth.vatId')}
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder={t('auth.vatId')}
                    error={errors.businessInfo?.vatId?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="businessInfo.tradeRegisterNumber"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('auth.tradeRegisterNumber')}
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder={t('auth.tradeRegisterNumber')}
                    error={errors.businessInfo?.tradeRegisterNumber?.message}
                  />
                )}
              />
            </>
          )}

          <View style={styles.submitButton}>
            <Button
              title={t('auth.createAccount')}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium as unknown as '500',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold as unknown as '600',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold as unknown as '600',
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  accountCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  accountCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  accountCardText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium as unknown as '500',
    color: Colors.text,
  },
  accountCardTextSelected: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold as unknown as '600',
  },
  prefixText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium as unknown as '500',
  },
  submitButton: {
    marginTop: Spacing.xxl,
  },
});
