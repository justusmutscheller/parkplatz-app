import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/node_modules/react-i18next';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '@/constants/theme';
import { Button } from '@/components/common';
import { DocumentUpload } from '@/components/verification';
import { identityService } from '@/services/identity';

interface DocumentEntry {
  label: string;
  description: string;
  type: 'land_register' | 'rental_agreement' | 'management_confirmation';
  fileName: string | null;
  isUploading: boolean;
  isUploaded: boolean;
}

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentEntry[]>([
    {
      label: t('verification.proofTypes.landRegister'),
      description: 'Grundbuchauszug als Eigentumsnachweis hochladen',
      type: 'land_register',
      fileName: null,
      isUploading: false,
      isUploaded: false,
    },
    {
      label: t('verification.proofTypes.rentalAgreement'),
      description: 'Mietvertrag mit Untermietgenehmigung vorlegen',
      type: 'rental_agreement',
      fileName: null,
      isUploading: false,
      isUploaded: false,
    },
    {
      label: t('verification.proofTypes.managementConfirmation'),
      description: 'Schriftliche Genehmigung der Hausverwaltung',
      type: 'management_confirmation',
      fileName: null,
      isUploading: false,
      isUploaded: false,
    },
  ]);

  const handleFileSelected = useCallback(
    async (index: number, uri: string, name: string) => {
      setDocuments((prev) =>
        prev.map((doc, i) =>
          i === index ? { ...doc, isUploading: true, fileName: name } : doc
        )
      );

      try {
        await identityService.uploadDocument(
          documents[index].type,
          uri,
          name
        );
        setDocuments((prev) =>
          prev.map((doc, i) =>
            i === index
              ? { ...doc, isUploading: false, isUploaded: true }
              : doc
          )
        );
      } catch {
        setDocuments((prev) =>
          prev.map((doc, i) =>
            i === index
              ? { ...doc, isUploading: false, fileName: null }
              : doc
          )
        );
      }
    },
    [documents]
  );

  const allUploaded = documents.some((d) => d.isUploaded);

  return (
    <SafeAreaView style={styles.container}>
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
              {t('verification.documentUpload')}
            </Text>
            <Text style={styles.subtitle}>
              Laden Sie die erforderlichen Dokumente hoch, um Ihre Berechtigung
              nachzuweisen.
            </Text>
          </View>

          {documents.map((doc, index) => (
            <View key={doc.type} style={styles.documentCard}>
              <DocumentUpload
                label={doc.label}
                description={doc.description}
                onFileSelected={(uri, name) =>
                  handleFileSelected(index, uri, name)
                }
                uploadedFileName={doc.fileName}
                isUploading={doc.isUploading}
                isUploaded={doc.isUploaded}
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={t('common.save')}
            onPress={() => router.back()}
            variant="primary"
            fullWidth
            disabled={!allUploaded}
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
  documentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadow.md,
  },
});
