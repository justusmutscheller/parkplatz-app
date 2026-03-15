import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTranslation } from '@/node_modules/react-i18next';
import { Button, Card } from '@/components/common';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from '@/constants/theme';

interface IDnowVerificationProps {
  onComplete: (success: boolean) => void;
  isActive: boolean;
}

export function IDnowVerification({
  onComplete,
  isActive,
}: IDnowVerificationProps) {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive || !isScanning) return;

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      setIsScanning(false);
      setIsComplete(true);
      onComplete(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
      progressAnim.setValue(0);
    };
  }, [isActive, isScanning, onComplete, progressAnim]);

  const handleStartScan = () => {
    setIsScanning(true);
    progressAnim.setValue(0);
  };

  if (isComplete) {
    return (
      <Card style={styles.successCard}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>
          {t('verification.faceScan')} abgeschlossen
        </Text>
        <Text style={styles.successSubtitle}>
          Ihre Identität wurde erfolgreich verifiziert.
        </Text>
      </Card>
    );
  }

  if (isActive && isScanning) {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.scanContainer}>
        <View style={styles.scanFrame}>
          <View style={styles.scanCircle}>
            <Text style={styles.scanEmoji}>📸</Text>
          </View>
          <Text style={styles.scanInstruction}>
            Bitte halten Sie Ihr Gesicht in den Rahmen
          </Text>
          <Text style={styles.scanSubtext}>IDnow Verifizierung läuft...</Text>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Card style={styles.infoCard}>
      <Text style={styles.infoIcon}>📸</Text>
      <Text style={styles.infoTitle}>{t('verification.faceScan')}</Text>
      <Text style={styles.infoText}>
        Für die Verifizierung wird ein kurzer Gesichtsscan durchgeführt. Dies
        dauert nur wenige Sekunden.
      </Text>
      <Button
        title="Gesichtsscan starten"
        onPress={handleStartScan}
        variant="primary"
        fullWidth
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoIcon: {
    fontSize: 48,
  },
  infoTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  scanFrame: {
    backgroundColor: Colors.black,
    padding: Spacing.xl,
    alignItems: 'center',
    minHeight: 320,
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    gap: Spacing.lg,
  },
  scanCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanEmoji: {
    fontSize: 56,
  },
  scanInstruction: {
    fontSize: FontSize.md,
    color: Colors.white,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  scanSubtext: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  successCard: {
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successIcon: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  successSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
