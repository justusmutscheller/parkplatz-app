import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '@/constants/theme';

interface DocumentUploadProps {
  label: string;
  description: string;
  onFileSelected: (uri: string, name: string) => void;
  uploadedFileName: string | null;
  isUploading: boolean;
  isUploaded: boolean;
}

export function DocumentUpload({
  label,
  description,
  onFileSelected,
  uploadedFileName,
  isUploading,
  isUploaded,
}: DocumentUploadProps) {
  const { t } = useTranslation();

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onFileSelected(asset.uri, asset.name ?? 'document.pdf');
      }
    } catch {
      // User cancelled or error
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() ?? 'photo.jpg';
        onFileSelected(asset.uri, fileName);
      }
    } catch {
      // User cancelled or error
    }
  };

  const isImageFile = uploadedFileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>{description}</Text>

      <Pressable
        style={[
          styles.uploadArea,
          isUploaded && styles.uploadAreaSuccess,
          isUploading && styles.uploadAreaUploading,
        ]}
        onPress={handlePickDocument}
        disabled={isUploading}
      >
        {isUploading ? (
          <View style={styles.uploadingContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.uploadingText}>{t('common.loading')}</Text>
          </View>
        ) : isUploaded && uploadedFileName ? (
          <View style={styles.uploadedContent}>
            {isImageFile ? (
              <Image
                source={{ uri: uploadedFileName }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.uploadIcon}>✅</Text>
            )}
            <Text style={styles.uploadedFileName} numberOfLines={1}>
              {uploadedFileName.split('/').pop()}
            </Text>
            <Text style={styles.uploadedHint}>
              {t('verification.selectDocument')}
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContent}>
            <Text style={styles.uploadIcon}>📁</Text>
            <Text style={styles.emptyText}>
              {t('verification.selectDocument')}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.smallButton, isUploading && styles.smallButtonDisabled]}
          onPress={handlePickDocument}
          disabled={isUploading}
        >
          <Text style={styles.smallButtonText}>PDF hochladen</Text>
        </Pressable>
        <Pressable
          style={[styles.smallButton, isUploading && styles.smallButtonDisabled]}
          onPress={handleTakePhoto}
          disabled={isUploading}
        >
          <Text style={styles.smallButtonText}>
            {t('verification.takePhoto')}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.fileSizeNote}>Max. 10 MB, PDF oder Bild</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    backgroundColor: Colors.surfaceSecondary,
  },
  uploadAreaSuccess: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  uploadAreaUploading: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  emptyContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  uploadIcon: {
    fontSize: 36,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  uploadingContent: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  uploadingText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  uploadedContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  uploadedFileName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.medium,
    maxWidth: 200,
  },
  uploadedHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  smallButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  smallButtonDisabled: {
    opacity: 0.5,
  },
  smallButtonText: {
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
});
