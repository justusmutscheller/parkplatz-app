import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/node_modules/react-i18next';
import * as ImagePicker from 'expo-image-picker';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '@/constants/theme';
import { Button, Input, Card } from '@/components/common';
import { useListingStore } from '@/stores/listingStore';
import { useAuthStore } from '@/stores/authStore';
import type {
  ParkingCategory,
  PricingUnit,
  ParkingFeatures,
  PricingOption,
  AvailabilityWindow,
} from '@/types';

const TOTAL_STEPS = 5;

interface SpotDefinition {
  row: string;
  number: string;
}

const CATEGORIES: { key: ParkingCategory; emoji: string; labelKey: string }[] = [
  { key: 'underground', emoji: '🏢', labelKey: 'listing.category.underground' },
  { key: 'lot', emoji: '🅿️', labelKey: 'listing.category.lot' },
  { key: 'private_spot', emoji: '🏠', labelKey: 'listing.category.privateSpot' },
  { key: 'garage', emoji: '🏗️', labelKey: 'listing.category.garage' },
  { key: 'street', emoji: '🛣️', labelKey: 'listing.category.street' },
];

const PRICING_UNITS: { key: PricingUnit; labelKey: string }[] = [
  { key: 'hour', labelKey: 'listing.pricing.hour' },
  { key: 'day', labelKey: 'listing.pricing.day' },
  { key: 'week', labelKey: 'listing.pricing.week' },
  { key: 'month', labelKey: 'listing.pricing.month' },
];

const WEEKDAYS = [
  'listing.weekday.monday',
  'listing.weekday.tuesday',
  'listing.weekday.wednesday',
  'listing.weekday.thursday',
  'listing.weekday.friday',
  'listing.weekday.saturday',
  'listing.weekday.sunday',
];

const FEATURE_KEYS: { key: keyof Omit<ParkingFeatures, 'heightLimit' | 'widthLimit'>; labelKey: string }[] = [
  { key: 'covered', labelKey: 'listing.feature.covered' },
  { key: 'gated', labelKey: 'listing.feature.gated' },
  { key: 'illuminated', labelKey: 'listing.feature.illuminated' },
  { key: 'surveillance', labelKey: 'listing.feature.surveillance' },
  { key: 'evCharging', labelKey: 'listing.feature.evCharging' },
  { key: 'handicapAccessible', labelKey: 'listing.feature.handicapAccessible' },
];

export default function CreateListingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createListing = useListingStore((s) => s.createListing);
  const isLoading = useListingStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(1);

  // Step 1
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');

  // Step 2
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ParkingCategory | null>(null);

  // Step 3
  const [totalSpots, setTotalSpots] = useState('1');
  const [nameIndividualSpots, setNameIndividualSpots] = useState(false);
  const [spotDefinitions, setSpotDefinitions] = useState<SpotDefinition[]>([
    { row: '', number: '1' },
  ]);

  // Step 4
  const [pricingOptions, setPricingOptions] = useState<
    { unit: PricingUnit; price: string }[]
  >([{ unit: 'hour', price: '' }]);
  const [alwaysAvailable, setAlwaysAvailable] = useState(true);
  const [selectedDays, setSelectedDays] = useState<boolean[]>(
    Array(7).fill(false)
  );
  const [dayTimes, setDayTimes] = useState<{ from: string; to: string }[]>(
    Array(7)
      .fill(null)
      .map(() => ({ from: '08:00', to: '18:00' }))
  );

  // Step 5
  const [photos, setPhotos] = useState<string[]>([]);
  const [features, setFeatures] = useState<
    Record<keyof Omit<ParkingFeatures, 'heightLimit' | 'widthLimit'>, boolean>
  >({
    covered: false,
    gated: false,
    illuminated: false,
    surveillance: false,
    evCharging: false,
    handicapAccessible: false,
  });
  const [heightLimit, setHeightLimit] = useState('');
  const [widthLimit, setWidthLimit] = useState('');

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
    else router.back();
  }, [step, router]);

  const addSpot = useCallback(() => {
    setSpotDefinitions((prev) => [
      ...prev,
      { row: '', number: String(prev.length + 1) },
    ]);
  }, []);

  const removeSpot = useCallback((index: number) => {
    setSpotDefinitions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateSpot = useCallback(
    (index: number, field: keyof SpotDefinition, value: string) => {
      setSpotDefinitions((prev) =>
        prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const addPricingOption = useCallback(() => {
    setPricingOptions((prev) => [...prev, { unit: 'day', price: '' }]);
  }, []);

  const removePricingOption = useCallback((index: number) => {
    setPricingOptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePricingUnit = useCallback(
    (index: number, unit: PricingUnit) => {
      setPricingOptions((prev) =>
        prev.map((p, i) => (i === index ? { ...p, unit } : p))
      );
    },
    []
  );

  const updatePricingPrice = useCallback((index: number, price: string) => {
    setPricingOptions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, price } : p))
    );
  }, []);

  const toggleDay = useCallback((index: number) => {
    setSelectedDays((prev) => prev.map((d, i) => (i === index ? !d : d)));
  }, []);

  const updateDayTime = useCallback(
    (dayIndex: number, field: 'from' | 'to', value: string) => {
      setDayTimes((prev) =>
        prev.map((dt, i) => (i === dayIndex ? { ...dt, [field]: value } : dt))
      );
    },
    []
  );

  const pickPhoto = useCallback(async () => {
    if (photos.length >= 10) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }, [photos.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleFeature = useCallback(
    (key: keyof Omit<ParkingFeatures, 'heightLimit' | 'widthLimit'>) => {
      setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  const buildSpots = useCallback(() => {
    const count = parseInt(totalSpots, 10) || 1;
    if (nameIndividualSpots) {
      return spotDefinitions.map((s) => ({
        label: s.row
          ? `${t('listing.spotRow')} ${s.row}, ${t('listing.spotPlace')} ${s.number}`
          : `${t('listing.spotPlace')} ${s.number}`,
        row: s.row || undefined,
        number: parseInt(s.number, 10) || 1,
      }));
    }
    return Array.from({ length: count }, (_, i) => ({
      label: `${t('listing.spotPlace')} ${i + 1}`,
      number: i + 1,
    }));
  }, [totalSpots, nameIndividualSpots, spotDefinitions, t]);

  const handlePublish = useCallback(async () => {
    if (
      user &&
      user.identityVerificationStatus !== 'verified'
    ) {
      router.push('/listing/verify-ownership');
      return;
    }

    const spots = buildSpots();
    const pricing: PricingOption[] = pricingOptions
      .filter((p) => p.price)
      .map((p) => ({
        unit: p.unit,
        price: parseFloat(p.price) || 0,
        currency: 'EUR',
      }));

    const availability: AvailabilityWindow[] = alwaysAvailable
      ? Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          startTime: '00:00',
          endTime: '23:59',
        }))
      : selectedDays
          .map((selected, i) =>
            selected
              ? {
                  dayOfWeek: i,
                  startTime: dayTimes[i].from,
                  endTime: dayTimes[i].to,
                }
              : null
          )
          .filter(Boolean) as AvailabilityWindow[];

    const featuresData: ParkingFeatures = {
      ...features,
      heightLimit: heightLimit ? parseFloat(heightLimit) : undefined,
      widthLimit: widthLimit ? parseFloat(widthLimit) : undefined,
    };

    try {
      await createListing({
        title,
        description,
        category: category || 'lot',
        location: {
          latitude: 52.52,
          longitude: 13.405,
          address: `${street} ${houseNumber}`,
          city,
          postalCode,
          country,
        },
        spots,
        totalSpots: spots.length,
        pricing,
        availability,
        features: featuresData,
        photos,
      });
      Alert.alert(
        t('listing.publishSuccess'),
        t('listing.publishSuccessMessage'),
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/my-listings'),
          },
        ]
      );
    } catch {
      Alert.alert(t('common.error'), t('listing.publishError'));
    }
  }, [
    user,
    router,
    buildSpots,
    pricingOptions,
    alwaysAvailable,
    selectedDays,
    dayTimes,
    features,
    heightLimit,
    widthLimit,
    title,
    description,
    category,
    street,
    houseNumber,
    city,
    postalCode,
    country,
    photos,
    createListing,
    t,
  ]);

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <Text style={styles.stepText}>
        {t('listing.stepOf', { current: step, total: TOTAL_STEPS })}
      </Text>
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const dotStep = i + 1;
          const isCompleted = dotStep < step;
          const isCurrent = dotStep === step;
          return (
            <React.Fragment key={dotStep}>
              {i > 0 && (
                <View
                  style={[
                    styles.dotLine,
                    isCompleted && styles.dotLineCompleted,
                  ]}
                />
              )}
              <View
                style={[
                  styles.dot,
                  isCompleted && styles.dotCompleted,
                  isCurrent && styles.dotCurrent,
                ]}
              />
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text style={styles.heading}>{t('listing.createTitle')}</Text>
      <View style={styles.row}>
        <View style={styles.flex3}>
          <Input
            label={t('listing.street')}
            value={street}
            onChangeText={setStreet}
            placeholder={t('listing.streetPlaceholder')}
          />
        </View>
        <View style={styles.flex1}>
          <Input
            label={t('listing.houseNumber')}
            value={houseNumber}
            onChangeText={setHouseNumber}
            placeholder="12"
          />
        </View>
      </View>
      <Input
        label={t('listing.postalCode')}
        value={postalCode}
        onChangeText={setPostalCode}
        placeholder="10115"
        keyboardType="numeric"
      />
      <Input
        label={t('listing.city')}
        value={city}
        onChangeText={setCity}
        placeholder="Berlin"
      />
      <Input
        label={t('listing.country')}
        value={country}
        onChangeText={setCountry}
        placeholder="Deutschland"
      />

      <Pressable style={styles.mapButton} onPress={() => {}}>
        <Text style={styles.mapButtonText}>
          {t('listing.showOnMap')}
        </Text>
      </Pressable>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderEmoji}>📍</Text>
        <Text style={styles.mapPlaceholderText}>
          {t('listing.mapPlaceholder')}
        </Text>
      </View>

      <Text style={styles.noteText}>{t('listing.pinNote')}</Text>

      <Button
        title={t('listing.next')}
        onPress={goNext}
        fullWidth
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.heading}>{t('listing.detailsTitle')}</Text>
      <Input
        label={t('listing.titleLabel')}
        value={title}
        onChangeText={setTitle}
        placeholder={t('listing.titlePlaceholder')}
      />
      <Input
        label={t('listing.descriptionLabel')}
        value={description}
        onChangeText={setDescription}
        placeholder={t('listing.descriptionPlaceholder')}
        multiline
      />

      <Text style={styles.sectionLabel}>{t('listing.categoryLabel')}</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            onPress={() => setCategory(cat.key)}
            style={[
              styles.categoryCard,
              category === cat.key && styles.categoryCardSelected,
            ]}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.categoryLabel,
                category === cat.key && styles.categoryLabelSelected,
              ]}
            >
              {t(cat.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        title={t('listing.next')}
        onPress={goNext}
        fullWidth
      />
    </View>
  );

  const renderStep3 = () => {
    const count = parseInt(totalSpots, 10) || 0;
    const previewSpots = nameIndividualSpots
      ? spotDefinitions.map((s) =>
          s.row
            ? `${t('listing.spotRow')} ${s.row}, ${t('listing.spotPlace')} ${s.number}`
            : `${t('listing.spotPlace')} ${s.number}`
        )
      : Array.from({ length: count }, (_, i) => `${t('listing.spotPlace')} ${i + 1}`);

    return (
      <View>
        <Text style={styles.heading}>{t('listing.spotsTitle')}</Text>
        <Input
          label={t('listing.spotCount')}
          value={totalSpots}
          onChangeText={(val) => {
            setTotalSpots(val);
            if (!nameIndividualSpots) return;
            const num = parseInt(val, 10) || 0;
            setSpotDefinitions((prev) => {
              if (num > prev.length) {
                return [
                  ...prev,
                  ...Array.from({ length: num - prev.length }, (_, i) => ({
                    row: '',
                    number: String(prev.length + i + 1),
                  })),
                ];
              }
              return prev.slice(0, num);
            });
          }}
          keyboardType="numeric"
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            {t('listing.nameIndividualSpots')}
          </Text>
          <Switch
            value={nameIndividualSpots}
            onValueChange={setNameIndividualSpots}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={nameIndividualSpots ? Colors.primary : Colors.textTertiary}
          />
        </View>

        {nameIndividualSpots && (
          <View style={styles.spotList}>
            {spotDefinitions.map((spot, index) => (
              <View key={index} style={styles.spotRow}>
                <View style={styles.spotInputRow}>
                  <View style={styles.flex1}>
                    <Input
                      label={t('listing.spotRowLabel')}
                      value={spot.row}
                      onChangeText={(val) => updateSpot(index, 'row', val)}
                      placeholder="A"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Input
                      label={t('listing.spotNumber')}
                      value={spot.number}
                      onChangeText={(val) => updateSpot(index, 'number', val)}
                      placeholder="3"
                      keyboardType="numeric"
                    />
                  </View>
                  <Pressable
                    onPress={() => removeSpot(index)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </Pressable>
                </View>
                <Text style={styles.spotPreviewLabel}>
                  {spot.row
                    ? `${t('listing.spotRow')} ${spot.row}, ${t('listing.spotPlace')} ${spot.number}`
                    : `${t('listing.spotPlace')} ${spot.number}`}
                </Text>
              </View>
            ))}
            <Button
              title={t('listing.addSpot')}
              onPress={addSpot}
              variant="outline"
              fullWidth
              size="sm"
            />
          </View>
        )}

        {previewSpots.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionLabel}>{t('listing.spotPreview')}</Text>
            <View style={styles.previewChips}>
              {previewSpots.slice(0, 20).map((label, i) => (
                <View key={i} style={styles.previewChip}>
                  <Text style={styles.previewChipText}>{label}</Text>
                </View>
              ))}
              {previewSpots.length > 20 && (
                <Text style={styles.moreText}>
                  +{previewSpots.length - 20} {t('listing.more')}
                </Text>
              )}
            </View>
          </View>
        )}

        <Button
          title={t('listing.next')}
          onPress={goNext}
          fullWidth
        />
      </View>
    );
  };

  const renderStep4 = () => (
    <View>
      <Text style={styles.heading}>{t('listing.pricingTitle')}</Text>

      <Text style={styles.sectionLabel}>{t('listing.pricingOptions')}</Text>
      {pricingOptions.map((opt, index) => (
        <View key={index} style={styles.pricingRow}>
          <View style={styles.unitSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {PRICING_UNITS.map((pu) => (
                <Pressable
                  key={pu.key}
                  onPress={() => updatePricingUnit(index, pu.key)}
                  style={[
                    styles.unitChip,
                    opt.unit === pu.key && styles.unitChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      opt.unit === pu.key && styles.unitChipTextSelected,
                    ]}
                  >
                    {t(pu.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={styles.priceInputRow}>
            <View style={styles.flex1}>
              <Input
                label={t('listing.price')}
                value={opt.price}
                onChangeText={(val) => updatePricingPrice(index, val)}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.currencyLabel}>€</Text>
            {pricingOptions.length > 1 && (
              <Pressable
                onPress={() => removePricingOption(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
      <Button
        title={t('listing.addPricingOption')}
        onPress={addPricingOption}
        variant="outline"
        fullWidth
        size="sm"
      />

      <View style={styles.spacer} />
      <Text style={styles.sectionLabel}>{t('listing.availability')}</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('listing.alwaysAvailable')}</Text>
        <Switch
          value={alwaysAvailable}
          onValueChange={setAlwaysAvailable}
          trackColor={{ false: Colors.border, true: Colors.primaryLight }}
          thumbColor={alwaysAvailable ? Colors.primary : Colors.textTertiary}
        />
      </View>

      {!alwaysAvailable && (
        <View style={styles.availabilityList}>
          {WEEKDAYS.map((dayKey, index) => (
            <View key={index} style={styles.dayRow}>
              <Pressable
                onPress={() => toggleDay(index)}
                style={styles.dayCheckbox}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedDays[index] && styles.checkboxChecked,
                  ]}
                >
                  {selectedDays[index] && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.dayName}>{t(dayKey)}</Text>
              </Pressable>
              {selectedDays[index] && (
                <View style={styles.timeInputs}>
                  <View style={styles.timeInputWrapper}>
                    <Input
                      label={t('listing.from')}
                      value={dayTimes[index].from}
                      onChangeText={(val) =>
                        updateDayTime(index, 'from', val)
                      }
                      placeholder="08:00"
                    />
                  </View>
                  <View style={styles.timeInputWrapper}>
                    <Input
                      label={t('listing.to')}
                      value={dayTimes[index].to}
                      onChangeText={(val) =>
                        updateDayTime(index, 'to', val)
                      }
                      placeholder="18:00"
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.spacer} />
      <Button
        title={t('listing.next')}
        onPress={goNext}
        fullWidth
      />
    </View>
  );

  const renderStep5 = () => (
    <View>
      <Text style={styles.heading}>{t('listing.photosTitle')}</Text>

      <Text style={styles.sectionLabel}>{t('listing.photos')}</Text>
      <Text style={styles.photoCount}>
        {t('listing.photoCount', { current: photos.length, max: 10 })}
      </Text>
      <View style={styles.photoGrid}>
        {photos.map((uri, index) => (
          <View key={index} style={styles.photoItem}>
            <View style={styles.photoThumb}>
              <Text style={styles.photoThumbText}>📷</Text>
            </View>
            <Pressable
              onPress={() => removePhoto(index)}
              style={styles.photoRemove}
            >
              <Text style={styles.photoRemoveText}>✕</Text>
            </Pressable>
          </View>
        ))}
        {photos.length < 10 && (
          <Pressable onPress={pickPhoto} style={styles.photoAdd}>
            <Text style={styles.photoAddEmoji}>📸</Text>
            <Text style={styles.photoAddText}>
              {t('listing.addPhoto')}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.spacer} />
      <Text style={styles.sectionLabel}>{t('listing.featuresLabel')}</Text>
      {FEATURE_KEYS.map((feat) => (
        <View key={feat.key} style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t(feat.labelKey)}</Text>
          <Switch
            value={features[feat.key]}
            onValueChange={() => toggleFeature(feat.key)}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={
              features[feat.key] ? Colors.primary : Colors.textTertiary
            }
          />
        </View>
      ))}

      <View style={styles.spacer} />
      <Text style={styles.sectionLabel}>{t('listing.limits')}</Text>
      <View style={styles.row}>
        <View style={styles.flex1}>
          <Input
            label={t('listing.heightLimit')}
            value={heightLimit}
            onChangeText={setHeightLimit}
            placeholder="2.10"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.flex1}>
          <Input
            label={t('listing.widthLimit')}
            value={widthLimit}
            onChangeText={setWidthLimit}
            placeholder="2.50"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <Button
        title={t('listing.publish')}
        onPress={handlePublish}
        fullWidth
        loading={isLoading}
      />
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backButton}>
            <Text style={styles.backText}>{t('listing.back')}</Text>
          </Pressable>
        </View>
        {renderStepIndicator()}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>
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
  flex1: {
    flex: 1,
  },
  flex3: {
    flex: 3,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  stepIndicatorContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  stepText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
  },
  dotCompleted: {
    backgroundColor: Colors.primary,
  },
  dotCurrent: {
    backgroundColor: Colors.primary,
    width: 14,
    height: 14,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  dotLine: {
    width: 28,
    height: 2,
    backgroundColor: Colors.border,
  },
  dotLineCompleted: {
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mapButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mapButtonText: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  mapPlaceholderEmoji: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  mapPlaceholderText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  noteText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    width: '47%',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    ...Shadow.sm,
  },
  categoryCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  switchLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  spotList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  spotRow: {
    marginBottom: Spacing.sm,
  },
  spotInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  removeButtonText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  spotPreviewLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.xs,
  },
  previewSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  previewChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  previewChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  previewChipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  moreText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    alignSelf: 'center',
    marginLeft: Spacing.xs,
  },
  pricingRow: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  unitSelector: {
    marginBottom: Spacing.sm,
  },
  unitChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    marginRight: Spacing.xs,
  },
  unitChipSelected: {
    backgroundColor: Colors.primary,
  },
  unitChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  unitChipTextSelected: {
    color: Colors.white,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currencyLabel: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  spacer: {
    height: Spacing.lg,
  },
  availabilityList: {
    marginTop: Spacing.md,
  },
  dayRow: {
    marginBottom: Spacing.sm,
  },
  dayCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  dayName: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingLeft: Spacing.xl,
  },
  timeInputWrapper: {
    flex: 1,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  photoCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  photoItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoThumbText: {
    fontSize: 28,
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  photoAdd: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  photoAddEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  photoAddText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
});
