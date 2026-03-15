import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/node_modules/react-i18next';
import { Button } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifySmsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { phone, verifySmsCode, sendSmsCode, isLoading, pendingRegistration, completePendingRegistration, loginWithPhone } = useAuthStore();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) newCode[index + i] = d;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    setError(null);
    const fullCode = code.join('');
    const isValid = verifySmsCode(fullCode);
    if (isValid) {
      if (pendingRegistration) {
        completePendingRegistration();
        router.replace('/(tabs)');
      } else {
        loginWithPhone();
        router.replace('/(tabs)');
      }
    } else {
      setError(t('auth.invalidCode'));
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    setCountdown(RESEND_COOLDOWN);
    await sendSmsCode();
  };

  const fullCode = code.join('');
  const canVerify = fullCode.length === CODE_LENGTH;

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
          <Text style={styles.title}>{t('auth.smsVerification')}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            {t('auth.codeSentTo', { phone: phone || '' })}
          </Text>

          <View style={styles.demoHint}>
            <Text style={styles.demoHintText}>{t('auth.demoHint')}</Text>
          </View>

          <View style={styles.codeInputs}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[styles.codeInput, error && styles.codeInputError]}
                value={digit}
                onChangeText={(value) => handleCodeChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.verifyButton}>
            <Button
              title={t('auth.verify')}
              onPress={handleVerify}
              disabled={!canVerify}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          <View style={styles.resendSection}>
            {countdown > 0 ? (
              <Text style={styles.countdown}>
                {t('auth.resendIn', { seconds: countdown })}
              </Text>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.resendLink, pressed && styles.resendLinkPressed]}
                onPress={handleResend}
              >
                <Text style={styles.resendLinkText}>{t('auth.resendCode')}</Text>
              </Pressable>
            )}
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  demoHint: {
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  demoHintText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: FontWeight.medium as unknown as '500',
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold as unknown as '600',
    color: Colors.text,
    textAlign: 'center',
    backgroundColor: Colors.surface,
  },
  codeInputError: {
    borderColor: Colors.error,
  },
  error: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  verifyButton: {
    marginBottom: Spacing.xl,
  },
  resendSection: {
    alignItems: 'center',
  },
  countdown: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  resendLink: {
    padding: Spacing.md,
  },
  resendLinkPressed: {
    opacity: 0.7,
  },
  resendLinkText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium as unknown as '500',
  },
});
