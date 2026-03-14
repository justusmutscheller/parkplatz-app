import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '@/constants/theme';
import type { ParkingSpot } from '@/types';

interface SpotSelectorProps {
  spots: ParkingSpot[];
  selectedSpotId: string | null;
  onSelectSpot: (id: string) => void;
}

export function SpotSelector({
  spots,
  selectedSpotId,
  onSelectSpot,
}: SpotSelectorProps) {
  const { t } = useTranslation();

  const availableCount = spots.filter((s) => s.isAvailable).length;
  const rows = new Set(spots.filter((s) => s.row).map((s) => s.row));
  const hasRows = rows.size > 0;

  const groupedByRow = hasRows
    ? spots.reduce<Record<string, ParkingSpot[]>>((acc, spot) => {
        const row = spot.row ?? '_';
        if (!acc[row]) acc[row] = [];
        acc[row].push(spot);
        return acc;
      }, {})
    : { _: spots };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Verfügbar: {availableCount} / {spots.length}
        </Text>
      </View>

      {Object.entries(groupedByRow).map(([row, rowSpots]) => (
        <View key={row} style={styles.rowContainer}>
          {hasRows && row !== '_' && (
            <Text style={styles.rowLabel}>
              {t('listing.row')} {row}
            </Text>
          )}
          <View style={styles.grid}>
            {rowSpots.map((spot) => {
              const isSelected = spot.id === selectedSpotId;
              const isAvailable = spot.isAvailable;

              return (
                <TouchableOpacity
                  key={spot.id}
                  style={[
                    styles.spotBox,
                    isAvailable
                      ? isSelected
                        ? styles.spotSelected
                        : styles.spotAvailable
                      : styles.spotUnavailable,
                  ]}
                  onPress={() => isAvailable && onSelectSpot(spot.id)}
                  activeOpacity={isAvailable ? 0.7 : 1}
                  disabled={!isAvailable}
                >
                  <Text
                    style={[
                      styles.spotLabel,
                      isSelected && styles.spotLabelSelected,
                      !isAvailable && styles.spotLabelUnavailable,
                    ]}
                  >
                    {spot.label}
                  </Text>
                  {!isAvailable && (
                    <Text style={styles.belegtText}>Belegt</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  headerText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  rowContainer: {
    marginBottom: Spacing.md,
  },
  rowLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  spotBox: {
    width: 90,
    height: 72,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    ...Shadow.sm,
  },
  spotAvailable: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  spotSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  spotUnavailable: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
  },
  spotLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  spotLabelSelected: {
    color: Colors.primary,
  },
  spotLabelUnavailable: {
    color: Colors.textTertiary,
  },
  belegtText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
