import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/node_modules/react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import { registrationSchema } from '@/utils/validation';
import type { RegistrationData } from '@/types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

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
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
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
          <View style={styles.headerTopRow}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>← {t('common.back')}</Text>
            </Pressable>
            <View style={styles.langRow}>
              <Pressable
                style={[styles.langButton, currentLang === 'de' && styles.langButtonActive]}
                onPress={() => i18n.changeLanguage('de')}
              >
                <Text style={[styles.langButtonText, currentLang === 'de' && styles.langButtonTextActive]}>DE</Text>
              </Pressable>
              <Pressable
                style={[styles.langButton, currentLang === 'en' && styles.langButtonActive]}
                onPress={() => i18n.changeLanguage('en')}
              >
                <Text style={[styles.langButtonText, currentLang === 'en' && styles.langButtonTextActive]}>EN</Text>
              </Pressable>
            </View>
          </View>
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
            render={({ field: { onChange } }) => {
              const [dobDay, setDobDay] = useState('');
              const [dobMonth, setDobMonth] = useState('');
              const [dobYear, setDobYear] = useState('');

              const days = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')), []);
              const months = useMemo(() => [
                { value: '01', label: 'Januar' },
                { value: '02', label: 'Februar' },
                { value: '03', label: 'März' },
                { value: '04', label: 'April' },
                { value: '05', label: 'Mai' },
                { value: '06', label: 'Juni' },
                { value: '07', label: 'Juli' },
                { value: '08', label: 'August' },
                { value: '09', label: 'September' },
                { value: '10', label: 'Oktober' },
                { value: '11', label: 'November' },
                { value: '12', label: 'Dezember' },
              ], []);

              const updateDob = (day: string, month: string, year: string) => {
                if (day && month && year.length === 4) {
                  onChange(`${day}.${month}.${year}`);
                }
              };

              return (
                <View>
                  <Text style={styles.dobLabel}>{t('auth.dateOfBirth')}</Text>
                  <View style={styles.dobRow}>
                    <View style={styles.dobPickerWrapper}>
                      <Text style={styles.dobPickerLabel}>Tag</Text>
                      <ScrollView style={styles.dobScrollPicker} nestedScrollEnabled>
                        {days.map((d) => (
                          <Pressable
                            key={d}
                            style={[styles.dobOption, dobDay === d && styles.dobOptionSelected]}
                            onPress={() => { setDobDay(d); updateDob(d, dobMonth, dobYear); }}
                          >
                            <Text style={[styles.dobOptionText, dobDay === d && styles.dobOptionTextSelected]}>{d}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={styles.dobPickerWrapper}>
                      <Text style={styles.dobPickerLabel}>Monat</Text>
                      <ScrollView style={styles.dobScrollPicker} nestedScrollEnabled>
                        {months.map((m) => (
                          <Pressable
                            key={m.value}
                            style={[styles.dobOption, dobMonth === m.value && styles.dobOptionSelected]}
                            onPress={() => { setDobMonth(m.value); updateDob(dobDay, m.value, dobYear); }}
                          >
                            <Text style={[styles.dobOptionText, dobMonth === m.value && styles.dobOptionTextSelected]}>{m.label}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={styles.dobYearWrapper}>
                      <Text style={styles.dobPickerLabel}>Jahr</Text>
                      <TextInput
                        style={styles.dobYearInput}
                        value={dobYear}
                        onChangeText={(text) => {
                          const digits = text.replace(/\D/g, '').slice(0, 4);
                          setDobYear(digits);
                          updateDob(dobDay, dobMonth, digits);
                        }}
                        placeholder="JJJJ"
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                  </View>
                  {errors.dateOfBirth?.message ? (
                    <Text style={styles.dobError}>{errors.dateOfBirth.message}</Text>
                  ) : null}
                </View>
              );
            }}
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  langButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  langButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium as unknown as '500',
    color: Colors.text,
  },
  langButtonTextActive: {
    color: Colors.white,
  },
  submitButton: {
    marginTop: Spacing.xxl,
  },
  dobLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium as unknown as '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dobRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dobPickerWrapper: {
    flex: 1,
  },
  dobYearWrapper: {
    flex: 1,
  },
  dobPickerLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  dobScrollPicker: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  dobOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dobOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  dobOptionText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  dobOptionTextSelected: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold as unknown as '600',
  },
  dobYearInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.surface,
    textAlign: 'center',
  },
  dobError: {
    fontSize: FontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
