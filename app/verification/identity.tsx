import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '@/constants/theme';
import { Button, Card, Badge, LoadingOverlay } from '@/components/common';
import { IDnowVerification } from '@/components/verification';
import { identityService } from '@/services/identity';
import { useAuthStore } from '@/stores/authStore';

type UploadState = 'empty' | 'uploading' | 'done';

export default function IdentityVerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [idFrontUri, setIdFrontUri] = useState<string | null>(null);
  const [idBackUri, setIdBackUri] = useState<string | null>(null);
  const [idFrontState, setIdFrontState] = useState<UploadState>('empty');
  const [idBackState, setIdBackState] = useState<UploadState>('empty');
  const [faceScanDone, setFaceScanDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCaptureId = useCallback(
    async (side: 'front' | 'back') => {
      try {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
          aspect: [3, 2],
        });

        if (result.canceled || !result.assets?.[0]) return;

        const uri = result.assets[0].uri;
        const docType = side === 'front' ? 'id_front' : 'id_back';
        const setUri = side === 'front' ? setIdFrontUri : setIdBackUri;
        const setState = side === 'front' ? setIdFrontState : setIdBackState;

        setUri(uri);
        setState('uploading');

        const fileName = uri.split('/').pop() ?? `id_${side}.jpg`;
        await identityService.uploadDocument(docType, uri, fileName);
        setState('done');
      } catch {
        const setState = side === 'front' ? setIdFrontState : setIdBackState;
        setState('empty');
      }
    },
    []
  );

  const handleFaceScanComplete = useCallback((success: boolean) => {
    setFaceScanDone(success);
  }, []);

  const idCardDone = idFrontState === 'done' && idBackState === 'done';
  const allDone = idCardDone && faceScanDone;

  const handleSubmit = useCallback(async () => {
    if (!allDone) return;
    setIsSubmitting(true);

    try {
      updateUser({ identityVerificationStatus: 'verified' });
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  }, [allDone, updateUser, router]);

  const renderIdUploadBox = (
    side: 'front' | 'back',
    uri: string | null,
    state: UploadState
  ) => {
    const label =
      side === 'front'
        ? t('verification.frontSide')
        : t('verification.backSide');

    return (
      <Pressable
        style={[styles.idBox, state === 'done' && styles.idBoxDone]}
        onPress={() => handleCaptureId(side)}
      >
        {uri && state === 'done' ? (
          <View style={styles.idBoxContent}>
            <Image source={{ uri }} style={styles.idThumbnail} />
            <Text style={styles.idBoxCheckmark}>✅</Text>
          </View>
        ) : state === 'uploading' ? (
          <View style={styles.idBoxContent}>
            <Text style={styles.idBoxIcon}>⏳</Text>
            <Text style={styles.idBoxLabel}>{t('common.loading')}</Text>
          </View>
        ) : (
          <View style={styles.idBoxContent}>
            <Text style={styles.idBoxIcon}>📷</Text>
            <Text style={styles.idBoxLabel}>{label}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const getStatusBadge = (label: string, done: boolean) => (
    <View style={styles.statusRow}>
      <Text style={styles.statusIcon}>{done ? '✅' : '⏳'}</Text>
      <Text
        style={[styles.statusLabel, done && styles.statusLabelDone]}
      >
        {label}
      </Text>
      <Badge
        text={
          done
            ? t('verification.verificationStatus.verified')
            : t('verification.verificationStatus.pending')
        }
        variant={done ? 'success' : 'warning'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LoadingOverlay
        visible={isSubmitting}
        message={t('common.loading')}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('verification.identityVerification')}
            </Text>
            <Text style={styles.subtitle}>
              Verifizieren Sie Ihre Identität mit einem gültigen
              Personalausweis und einem kurzen Gesichtsscan.
            </Text>
          </View>

          {/* Step 1: ID Upload */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>
                {t('verification.idUpload')}
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Fotografieren Sie die Vorder- und Rückseite Ihres
              Personalausweises.
            </Text>

            <View style={styles.idRow}>
              {renderIdUploadBox('front', idFrontUri, idFrontState)}
              {renderIdUploadBox('back', idBackUri, idBackState)}
            </View>
          </View>

          {/* Step 2: Face Scan */}
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>
                {t('verification.faceScan')} via IDnow
              </Text>
            </View>

            <IDnowVerification
              onComplete={handleFaceScanComplete}
              isActive={idCardDone}
            />

            {!idCardDone && (
              <Text style={styles.disabledHint}>
                Bitte laden Sie zuerst Ihren Personalausweis hoch.
              </Text>
            )}
          </View>

          {/* Status Overview */}
          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>Status</Text>
            {getStatusBadge(t('verification.idUpload'), idCardDone)}
            {getStatusBadge(t('verification.faceScan'), faceScanDone)}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Verifizierung abschließen"
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            disabled={!allDone}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  idRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  idBox: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    backgroundColor: Colors.surfaceSecondary,
  },
  idBoxDone: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
    borderStyle: 'solid',
  },
  idBoxContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  idBoxIcon: {
    fontSize: 32,
  },
  idBoxLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  idBoxCheckmark: {
    fontSize: 20,
  },
  idThumbnail: {
    width: 80,
    height: 54,
    borderRadius: BorderRadius.sm,
  },
  disabledHint: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  statusSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  statusTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusIcon: {
    fontSize: 18,
  },
  statusLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  statusLabelDone: {
    color: Colors.text,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadow.md,
  },
});
