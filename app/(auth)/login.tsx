import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/node_modules/react-i18next';
import { Button, Input } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

const COUNTRY_CODE = '+49';
const GERMANY_FLAG = '🇩🇪';

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { phone, setPhone, sendSmsCode, isLoading } = useAuthStore();
  const [localPhone, setLocalPhone] = useState(phone || '');
  const [error, setError] = useState<string | null>(null);
  const currentLang = i18n.language;

  const handleSendSmsCode = async () => {
    setError(null);
    const fullPhone = localPhone.startsWith('+') ? localPhone : `${COUNTRY_CODE}${localPhone.replace(/^0+/, '')}`;
    setPhone(fullPhone);

    if (fullPhone.length < 10) {
      setError('Telefonnummer zu kurz');
      return;
    }

    try {
      await sendSmsCode();
      router.push('/(auth)/verify-sms');
    } catch {
      setError('Fehler beim Senden des Codes');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>P</Text>
          <Text style={styles.title}>ParkPlatz</Text>
          <Text style={styles.heading}>{t('auth.welcomeTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>

          <View style={styles.inputSection}>
            <Input
              label={t('auth.phoneNumber')}
              value={localPhone}
              onChangeText={(text) => setLocalPhone(text.replace(/\D/g, ''))}
              placeholder="170 1234567"
              keyboardType="phone-pad"
              error={error || undefined}
              maxLength={15}
              leftIcon={
                <Text style={styles.prefixText}>{GERMANY_FLAG} {COUNTRY_CODE}</Text>
              }
            />

            <Button
              title={t('auth.sendSmsCode')}
              onPress={handleSendSmsCode}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.registerLink, pressed && styles.registerLinkPressed]}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.registerLinkText}>{t('auth.noAccountYet')}</Text>
          </Pressable>

          <View style={styles.langRow}>
            <Pressable
              style={[styles.langButton, currentLang === 'de' && styles.langButtonActive]}
              onPress={() => i18n.changeLanguage('de')}
            >
              <Text style={[styles.langButtonText, currentLang === 'de' && styles.langButtonTextActive]}>Deutsch</Text>
            </Pressable>
            <Pressable
              style={[styles.langButton, currentLang === 'en' && styles.langButtonActive]}
              onPress={() => i18n.changeLanguage('en')}
            >
              <Text style={[styles.langButtonText, currentLang === 'en' && styles.langButtonTextActive]}>English</Text>
            </Pressable>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: FontWeight.bold as unknown as '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold as unknown as '700',
    color: Colors.text,
    marginBottom: Spacing.xxl,
  },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold as unknown as '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  inputSection: {
    width: '100%',
    maxWidth: 340,
  },
  prefixText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium as unknown as '500',
  },
  registerLink: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },
  registerLinkPressed: {
    opacity: 0.7,
  },
  registerLinkText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium as unknown as '500',
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  langButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
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
});
