import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/node_modules/react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '@/constants/theme';
import { Button, Card, Badge, Divider, LoadingOverlay } from '@/components/common';
import { IDnowVerification } from '@/components/verification';
import { identityService } from '@/services/identity';
import { useAuthStore } from '@/stores/authStore';

type ProofType = 'land_register' | 'rental_agreement' | 'management_confirmation';
type UploadState = 'empty' | 'uploading' | 'done';

interface ProofOption {
  type: ProofType;
  icon: string;
  title: string;
  description: string;
}

export default function VerifyOwnershipScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const proofOptions: ProofOption[] = [
    {
      type: 'land_register',
      icon: '📄',
      title: t('verification.proofTypes.landRegister'),
      description: 'Eigentum nachweisen durch Grundbuchauszug',
    },
    {
      type: 'rental_agreement',
      icon: '📋',
      title: t('verification.proofTypes.rentalAgreement'),
      description: 'Mietvertrag mit Untermietgenehmigung vorlegen',
    },
    {
      type: 'management_confirmation',
      icon: '🏢',
      title: t('verification.proofTypes.managementConfirmation'),
      description: 'Schriftliche Genehmigung der Hausverwaltung',
    },
  ];

  // Part A state
  const [selectedProof, setSelectedProof] = useState<ProofType | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [proofFileUri, setProofFileUri] = useState<string | null>(null);
  const [proofUploadState, setProofUploadState] = useState<UploadState>('empty');
  const proofProgress = useRef(new Animated.Value(0)).current;

  // Part B state
  const [idFrontUri, setIdFrontUri] = useState<string | null>(null);
  const [idBackUri, setIdBackUri] = useState<string | null>(null);
  const [idFrontState, setIdFrontState] = useState<UploadState>('empty');
  const [idBackState, setIdBackState] = useState<UploadState>('empty');
  const [faceScanDone, setFaceScanDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ownershipDone = proofUploadState === 'done';
  const idCardDone = idFrontState === 'done' && idBackState === 'done';
  const allDone = ownershipDone && idCardDone && faceScanDone;

  useEffect(() => {
    if (proofUploadState === 'uploading') {
      proofProgress.setValue(0);
      Animated.timing(proofProgress, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    }
  }, [proofUploadState, proofProgress]);

  const handleSelectProof = useCallback((type: ProofType) => {
    setSelectedProof(type);
    setProofFileName(null);
    setProofFileUri(null);
    setProofUploadState('empty');
  }, []);

  const handleUploadProofDocument = useCallback(async () => {
    if (!selectedProof) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setProofFileName(asset.name ?? 'document.pdf');
      setProofFileUri(asset.uri);
      setProofUploadState('uploading');

      await identityService.uploadDocument(
        selectedProof,
        asset.uri,
        asset.name ?? 'document.pdf'
      );
      setProofUploadState('done');
    } catch {
      setProofUploadState('empty');
      setProofFileName(null);
    }
  }, [selectedProof]);

  const handleTakeProofPhoto = useCallback(async () => {
    if (!selectedProof) return;

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileName = asset.uri.split('/').pop() ?? 'photo.jpg';
      setProofFileName(fileName);
      setProofFileUri(asset.uri);
      setProofUploadState('uploading');

      await identityService.uploadDocument(selectedProof, asset.uri, fileName);
      setProofUploadState('done');
    } catch {
      setProofUploadState('empty');
      setProofFileName(null);
    }
  }, [selectedProof]);

  const handleCaptureId = useCallback(async (side: 'front' | 'back') => {
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
      await identityService.uploadDocument(docType as any, uri, fileName);
      setState('done');
    } catch {
      const setState = side === 'front' ? setIdFrontState : setIdBackState;
      setState('empty');
    }
  }, []);

  const handleFaceScanComplete = useCallback((success: boolean) => {
    setFaceScanDone(success);
  }, []);

  const handleFinish = useCallback(async () => {
    if (!allDone) return;
    setIsSubmitting(true);

    try {
      updateUser({
        identityVerificationStatus: 'verified',
        documentVerificationStatus: 'verified',
      });
      router.replace('/listing/create');
    } finally {
      setIsSubmitting(false);
    }
  }, [allDone, updateUser, router]);

  const renderProofOption = (option: ProofOption) => {
    const isSelected = selectedProof === option.type;

    return (
      <Pressable
        key={option.type}
        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
        onPress={() => handleSelectProof(option.type)}
      >
        <View style={styles.optionHeader}>
          <View
            style={[
              styles.radioOuter,
              isSelected && styles.radioOuterSelected,
            ]}
          >
            {isSelected && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.optionIcon}>{option.icon}</Text>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.uploadSection}>
            <Pressable
              style={[
                styles.uploadArea,
                proofUploadState === 'done' && styles.uploadAreaDone,
                proofUploadState === 'uploading' && styles.uploadAreaUploading,
              ]}
              onPress={handleUploadProofDocument}
              disabled={proofUploadState === 'uploading'}
            >
              {proofUploadState === 'uploading' ? (
                <View style={styles.uploadContent}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.uploadProgressText}>
                    {t('common.loading')}
                  </Text>
                  <View style={styles.progressTrack}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: proofProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : proofUploadState === 'done' && proofFileUri ? (
                <View style={styles.uploadContent}>
                  {proofFileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <Image
                      source={{ uri: proofFileUri }}
                      style={styles.proofThumbnail}
                    />
                  ) : (
                    <Text style={styles.uploadEmoji}>✅</Text>
                  )}
                  <Text style={styles.uploadedName} numberOfLines={1}>
                    {proofFileName}
                  </Text>
                </View>
              ) : (
                <View style={styles.uploadContent}>
                  <Text style={styles.uploadEmoji}>📁</Text>
                  <Text style={styles.uploadPlaceholder}>
                    {t('verification.selectDocument')}
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={styles.uploadButtonRow}>
              <Pressable
                style={[
                  styles.uploadSmallBtn,
                  proofUploadState === 'uploading' && styles.disabledBtn,
                ]}
                onPress={handleUploadProofDocument}
                disabled={proofUploadState === 'uploading'}
              >
                <Text style={styles.uploadSmallBtnText}>
                  {t('verification.uploadDocument')}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.uploadSmallBtn,
                  proofUploadState === 'uploading' && styles.disabledBtn,
                ]}
                onPress={handleTakeProofPhoto}
                disabled={proofUploadState === 'uploading'}
              >
                <Text style={styles.uploadSmallBtnText}>
                  {t('verification.takePhoto')}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.fileSizeNote}>Max. 10 MB, PDF oder Bild</Text>
          </View>
        )}
      </Pressable>
    );
  };

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
            <Text style={styles.idCheckmark}>✅</Text>
          </View>
        ) : state === 'uploading' ? (
          <View style={styles.idBoxContent}>
            <ActivityIndicator size="small" color={Colors.primary} />
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

  const getStatusIcon = (done: boolean, inProgress: boolean) => {
    if (done) return '✅';
    if (inProgress) return '⏳';
    return '❌';
  };

  const getStatusVariant = (done: boolean, inProgress: boolean) => {
    if (done) return 'success' as const;
    if (inProgress) return 'warning' as const;
    return 'error' as const;
  };

  const ownershipInProgress = selectedProof !== null && !ownershipDone;
  const idInProgress =
    (idFrontState !== 'empty' || idBackState !== 'empty') && !idCardDone;

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
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ═══════════════ PART A: Eigentumsnachweis ═══════════════ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('verification.ownershipProof')}
            </Text>
            <Text style={styles.sectionInfo}>
              Um Ihren Parkplatz auf ParkPlatz anbieten zu können, benötigen wir
              einen Nachweis Ihres Eigentums oder Ihrer Nutzungsrechte. Dies
              schützt sowohl Sie als auch unsere Nutzer.
            </Text>

            <View style={styles.optionsList}>
              {proofOptions.map(renderProofOption)}
            </View>

            {ownershipDone && (
              <View style={styles.continueSection}>
                <Button
                  title="Weiter zur Identitätsprüfung"
                  onPress={() =>
                    scrollRef.current?.scrollTo({ y: 600, animated: true })
                  }
                  variant="secondary"
                  fullWidth
                />
              </View>
            )}
          </View>

          {/* ═══════════════ PART B: Identitätsprüfung ═══════════════ */}
          {ownershipDone && (
            <>
              <Divider />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('verification.identityVerification')}
                </Text>
                <Text style={styles.sectionInfo}>
                  Zur Sicherheit aller Nutzer verifizieren wir Ihre Identität
                  mit einem gültigen Ausweisdokument und einem kurzen
                  Gesichtsscan.
                </Text>

                {/* Step 1: Personalausweis */}
                <View style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepNumber}>1</Text>
                    </View>
                    <Text style={styles.stepTitle}>
                      Personalausweis hochladen
                    </Text>
                  </View>
                  <Text style={styles.stepSubtitle}>
                    Fotografieren Sie die Vorder- und Rückseite Ihres
                    Personalausweises.
                  </Text>

                  <View style={styles.idRow}>
                    {renderIdUploadBox('front', idFrontUri, idFrontState)}
                    {renderIdUploadBox('back', idBackUri, idBackState)}
                  </View>
                </View>

                {/* Step 2: Face Scan */}
                <View style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepNumber}>2</Text>
                    </View>
                    <Text style={styles.stepTitle}>
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
              </View>
            </>
          )}

          {/* ═══════════════ Status Overview ═══════════════ */}
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Verifizierungsstatus</Text>

            <View style={styles.statusRow}>
              <Text style={styles.statusEmoji}>
                {getStatusIcon(ownershipDone, ownershipInProgress)}
              </Text>
              <Text style={styles.statusLabel}>
                {t('verification.ownershipProof')}
              </Text>
              <Badge
                text={
                  ownershipDone
                    ? t('verification.verificationStatus.verified')
                    : ownershipInProgress
                      ? t('verification.verificationStatus.pending')
                      : t('verification.verificationStatus.pending')
                }
                variant={getStatusVariant(ownershipDone, ownershipInProgress)}
              />
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusEmoji}>
                {getStatusIcon(idCardDone, idInProgress)}
              </Text>
              <Text style={styles.statusLabel}>Personalausweis</Text>
              <Badge
                text={
                  idCardDone
                    ? t('verification.verificationStatus.verified')
                    : idInProgress
                      ? t('verification.verificationStatus.pending')
                      : t('verification.verificationStatus.pending')
                }
                variant={getStatusVariant(idCardDone, idInProgress)}
              />
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusEmoji}>
                {getStatusIcon(faceScanDone, false)}
              </Text>
              <Text style={styles.statusLabel}>
                {t('verification.faceScan')}
              </Text>
              <Badge
                text={
                  faceScanDone
                    ? t('verification.verificationStatus.verified')
                    : t('verification.verificationStatus.pending')
                }
                variant={faceScanDone ? 'success' : 'neutral'}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Verifizierung abschließen"
            onPress={handleFinish}
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionInfo: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  optionsList: {
    gap: Spacing.md,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  optionIcon: {
    fontSize: 28,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  optionDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  uploadSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.borderDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    backgroundColor: Colors.surfaceSecondary,
  },
  uploadAreaDone: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
    borderStyle: 'solid',
  },
  uploadAreaUploading: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  uploadContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  uploadEmoji: {
    fontSize: 36,
  },
  uploadPlaceholder: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  uploadProgressText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  progressTrack: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  proofThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  uploadedName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.medium,
    maxWidth: 200,
  },
  uploadButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  uploadSmallBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  uploadSmallBtnText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  fileSizeNote: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  continueSection: {
    marginTop: Spacing.lg,
  },
  stepContainer: {
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
  stepTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  stepSubtitle: {
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
  idCheckmark: {
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
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.md,
    marginBottom: Spacing.md,
  },
  statusTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusEmoji: {
    fontSize: 18,
  },
  statusLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadow.md,
  },
});
