import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
import { Card, Badge, Button, Divider, Input } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import type { VerificationStatus, UserAddress, SavedPaymentMethod } from '@/types';

function getVerificationBadge(
  status: VerificationStatus,
  t: (key: string) => string,
) {
  switch (status) {
    case 'verified':
      return { text: t('profile.verified'), variant: 'success' as const };
    case 'pending':
      return { text: t('profile.pending'), variant: 'warning' as const };
    default:
      return { text: t('profile.notVerified'), variant: 'error' as const };
  }
}

interface MenuRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

function MenuRow({ label, value, onPress, rightElement, showChevron = true }: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={({ pressed }) => [
        styles.menuRow,
        pressed && onPress && styles.menuRowPressed,
      ]}
    >
      <Text style={styles.menuRowLabel}>{label}</Text>
      <View style={styles.menuRowRight}>
        {value ? <Text style={styles.menuRowValue}>{value}</Text> : null}
        {rightElement ?? null}
        {showChevron && onPress && !rightElement ? (
          <Text style={styles.chevron}>›</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [editingPersonalData, setEditingPersonalData] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [placeOfBirth, setPlaceOfBirth] = useState(user?.placeOfBirth ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [street, setStreet] = useState(user?.address?.street ?? '');
  const [houseNumber, setHouseNumber] = useState(user?.address?.houseNumber ?? '');
  const [postalCode, setPostalCode] = useState(user?.address?.postalCode ?? '');
  const [city, setCity] = useState(user?.address?.city ?? '');
  const [country, setCountry] = useState(user?.address?.country ?? '');

  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentModalStep, setPaymentModalStep] = useState<'choose' | 'stripe' | 'paypal'>('choose');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalConnecting, setPaypalConnecting] = useState(false);

  const [businessMode, setBusinessMode] = useState(user?.accountType === 'business');
  const [companyName, setCompanyName] = useState(user?.businessInfo?.companyName ?? '');
  const [vatId, setVatId] = useState(user?.businessInfo?.vatId ?? '');
  const [tradeRegister, setTradeRegister] = useState(
    user?.businessInfo?.tradeRegisterNumber ?? '',
  );

  const currentLang = i18n.language === 'de' ? t('profile.german') : t('profile.english');

  const toggleLanguage = useCallback(() => {
    const next = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(next);
  }, [i18n]);

  const handleSavePersonalData = useCallback(() => {
    const address: UserAddress = { street, houseNumber, postalCode, city, country };
    updateUser({ firstName, lastName, dateOfBirth, placeOfBirth, email, phone, address });
    setEditingPersonalData(false);
  }, [
    updateUser, firstName, lastName, dateOfBirth, placeOfBirth,
    email, phone, street, houseNumber, postalCode, city, country,
  ]);

  const handleSaveBusinessInfo = useCallback(() => {
    updateUser({
      accountType: businessMode ? 'business' : 'private',
      businessInfo: businessMode
        ? { companyName, vatId, tradeRegisterNumber: tradeRegister }
        : undefined,
    });
  }, [updateUser, businessMode, companyName, vatId, tradeRegister]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace('/(auth)/login');
  }, [logout, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  }, [t, logout, router]);

  const handleSetDefaultPayment = useCallback((paymentId: string) => {
    if (!user?.savedPaymentMethods) return;
    const updated = user.savedPaymentMethods.map((pm) => ({
      ...pm,
      isDefault: pm.id === paymentId,
    }));
    updateUser({ savedPaymentMethods: updated });
  }, [user, updateUser]);

  const handleOpenPaymentModal = useCallback(() => {
    setPaymentModalStep('choose');
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardHolder('');
    setPaypalEmail('');
    setPaypalConnecting(false);
    setPaymentModalVisible(true);
  }, []);

  const handleAddStripeCard = useCallback(() => {
    const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '0000';
    const newPm: SavedPaymentMethod = {
      id: 'pm-' + Date.now(),
      type: 'stripe',
      label: `Visa ****${last4}`,
      icon: '💳',
      isDefault: (user?.savedPaymentMethods ?? []).length === 0,
    };
    updateUser({
      savedPaymentMethods: [...(user?.savedPaymentMethods ?? []), newPm],
    });
    setPaymentModalVisible(false);
  }, [cardNumber, user, updateUser]);

  const handleAddPaypal = useCallback(() => {
    setPaypalConnecting(true);
    setTimeout(() => {
      const newPm: SavedPaymentMethod = {
        id: 'pm-' + Date.now(),
        type: 'paypal',
        label: `PayPal ${paypalEmail}`,
        icon: '🅿️',
        isDefault: (user?.savedPaymentMethods ?? []).length === 0,
      };
      updateUser({
        savedPaymentMethods: [...(user?.savedPaymentMethods ?? []), newPm],
      });
      setPaypalConnecting(false);
      setPaymentModalVisible(false);
    }, 1500);
  }, [paypalEmail, user, updateUser]);

  const formatCardNumber = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    setCardNumber(groups ? groups.join(' ') : digits);
  }, []);

  const formatExpiry = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
  }, []);

  const isCardValid = cardNumber.replace(/\s/g, '').length === 16
    && cardExpiry.length === 5
    && cardCvc.length >= 3
    && cardHolder.length >= 2;

  const isPaypalValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail);

  const pickProfileImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  }, []);

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : '👤';

  const identityBadge = getVerificationBadge(
    user?.identityVerificationStatus ?? 'none',
    t,
  );
  const documentBadge = getVerificationBadge(
    user?.documentVerificationStatus ?? 'none',
    t,
  );
  const needsVerification =
    user?.identityVerificationStatus !== 'verified' ||
    user?.documentVerificationStatus !== 'verified';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.profileHeader}>
          <Pressable onPress={pickProfileImage} style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitials}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>📷</Text>
            </View>
          </Pressable>
          <Text style={styles.userName}>
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : t('profile.myProfile')}
          </Text>
          {user?.email ? (
            <Text style={styles.userEmail}>{user.email}</Text>
          ) : null}
          {user?.phone ? (
            <Text style={styles.userPhone}>{user.phone}</Text>
          ) : null}
          <Badge
            text={
              user?.accountType === 'business'
                ? t('profile.businessAccount')
                : t('profile.privateAccount')
            }
            variant={user?.accountType === 'business' ? 'info' : 'neutral'}
          />
        </View>

        {/* Verification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('profile.verificationStatus')}</Text>
          <Card>
            <View style={styles.verificationRow}>
              <Text style={styles.verificationLabel}>{t('profile.identity')}</Text>
              <Badge text={identityBadge.text} variant={identityBadge.variant} />
            </View>
            <Divider spacing={Spacing.sm} />
            <View style={styles.verificationRow}>
              <Text style={styles.verificationLabel}>{t('profile.documents')}</Text>
              <Badge text={documentBadge.text} variant={documentBadge.variant} />
            </View>
            {needsVerification && (
              <View style={styles.verifyButtonWrapper}>
                <Button
                  title={t('profile.verifyNow')}
                  onPress={() => router.push('/verification/identity')}
                  variant="primary"
                  size="sm"
                  fullWidth
                />
              </View>
            )}
          </Card>
        </View>

        {/* Konto Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('profile.account')}</Text>
          <Card>
            <MenuRow
              label={t('profile.editPersonalData')}
              onPress={() => setEditingPersonalData(!editingPersonalData)}
              showChevron
            />

            {editingPersonalData && (
              <View style={styles.editForm}>
                <Input
                  label={t('profile.firstName')}
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <Input
                  label={t('profile.lastName')}
                  value={lastName}
                  onChangeText={setLastName}
                />
                <Input
                  label={t('profile.dateOfBirth')}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="YYYY-MM-DD"
                />
                <Input
                  label={t('profile.placeOfBirth')}
                  value={placeOfBirth}
                  onChangeText={setPlaceOfBirth}
                />
                <Input
                  label={t('profile.email')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <Input
                  label={t('profile.phone')}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
                <Input
                  label={t('profile.street')}
                  value={street}
                  onChangeText={setStreet}
                />
                <Input
                  label={t('profile.houseNumber')}
                  value={houseNumber}
                  onChangeText={setHouseNumber}
                />
                <Input
                  label={t('profile.postalCode')}
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="numeric"
                />
                <Input
                  label={t('profile.city')}
                  value={city}
                  onChangeText={setCity}
                />
                <Input
                  label={t('profile.country')}
                  value={country}
                  onChangeText={setCountry}
                />
                <Button
                  title={t('profile.saveChanges')}
                  onPress={handleSavePersonalData}
                  variant="primary"
                  fullWidth
                />
              </View>
            )}

            <Divider spacing={Spacing.sm} />

            <MenuRow
              label={t('profile.accountType')}
              showChevron={false}
              rightElement={
                <View style={styles.accountTypeRow}>
                  <Text style={styles.menuRowValue}>
                    {t('profile.rentAsBusiness')}
                  </Text>
                  <Switch
                    value={businessMode}
                    onValueChange={setBusinessMode}
                    trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                    thumbColor={businessMode ? Colors.primary : Colors.textTertiary}
                  />
                </View>
              }
            />

            {businessMode && user?.accountType !== 'business' && (
              <View style={styles.editForm}>
                <Input
                  label={t('profile.companyName')}
                  value={companyName}
                  onChangeText={setCompanyName}
                />
                <Input
                  label={t('profile.vatId')}
                  value={vatId}
                  onChangeText={setVatId}
                />
                <Input
                  label={t('profile.tradeRegister')}
                  value={tradeRegister}
                  onChangeText={setTradeRegister}
                />
                <Button
                  title={t('common.save')}
                  onPress={handleSaveBusinessInfo}
                  variant="primary"
                  fullWidth
                />
              </View>
            )}
          </Card>
        </View>

        {/* Zahlungsmethoden Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('profile.paymentMethods')}</Text>
          <Card>
            {(user?.savedPaymentMethods ?? []).map((pm, idx) => (
              <React.Fragment key={pm.id}>
                {idx > 0 && <Divider spacing={Spacing.sm} />}
                <Pressable
                  style={styles.paymentRow}
                  onPress={() => handleSetDefaultPayment(pm.id)}
                >
                  <Text style={styles.paymentIcon}>{pm.icon}</Text>
                  <Text style={[styles.paymentLabel, { flex: 1 }]}>{pm.label}</Text>
                  {pm.isDefault && (
                    <Badge text="Standard" variant="success" />
                  )}
                </Pressable>
              </React.Fragment>
            ))}
            {(user?.savedPaymentMethods ?? []).length === 0 && (
              <Text style={styles.noPaymentText}>Keine Zahlungsmethode hinterlegt</Text>
            )}
            <Divider spacing={Spacing.sm} />
            <Button
              title={t('profile.addPaymentMethod')}
              onPress={handleOpenPaymentModal}
              variant="outline"
              size="sm"
              fullWidth
            />
          </Card>
        </View>

        {/* Einstellungen Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('profile.settings')}</Text>
          <Card>
            <MenuRow
              label={t('profile.language')}
              onPress={toggleLanguage}
              rightElement={
                <Text style={styles.menuRowValue}>{currentLang}</Text>
              }
              showChevron
            />
            <Divider spacing={Spacing.sm} />
            <MenuRow
              label={t('profile.notifications')}
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={notificationsEnabled ? Colors.primary : Colors.textTertiary}
                />
              }
            />
            <Divider spacing={Spacing.sm} />
            <MenuRow
              label={t('profile.privacy')}
              onPress={() => Alert.alert(t('profile.privacy'))}
            />
            <Divider spacing={Spacing.sm} />
            <MenuRow
              label={t('profile.terms')}
              onPress={() => Alert.alert(t('profile.terms'))}
            />
            <Divider spacing={Spacing.sm} />
            <MenuRow
              label={t('profile.helpSupport')}
              onPress={() => Alert.alert(t('profile.helpSupport'))}
            />
          </Card>
        </View>

        {/* Konto-Aktionen Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('profile.accountActions')}</Text>
          <Card>
            <Button
              title={t('profile.logout')}
              onPress={handleLogout}
              variant="outline"
              fullWidth
              icon={<Text>🚪</Text>}
            />
            <View style={styles.deleteButtonWrapper}>
              <Pressable
                onPress={handleDeleteAccount}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.deleteButtonPressed,
                ]}
              >
                <Text style={styles.deleteButtonText}>
                  {t('profile.deleteAccount')}
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Payment Method Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            {/* Close button */}
            <Pressable
              style={styles.modalClose}
              onPress={() => setPaymentModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>

            {/* Step: Choose provider */}
            {paymentModalStep === 'choose' && (
              <>
                <Text style={styles.modalTitle}>Zahlungsmethode hinzufügen</Text>
                <Text style={styles.modalSubtitle}>
                  Wähle deinen Zahlungsanbieter
                </Text>

                <Pressable
                  style={styles.providerOption}
                  onPress={() => setPaymentModalStep('stripe')}
                >
                  <View style={styles.providerIconBox}>
                    <Text style={styles.providerIconText}>💳</Text>
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>Kreditkarte / Debitkarte</Text>
                    <Text style={styles.providerDesc}>Visa, Mastercard, AMEX via Stripe</Text>
                  </View>
                  <Text style={styles.providerChevron}>›</Text>
                </Pressable>

                <Pressable
                  style={styles.providerOption}
                  onPress={() => setPaymentModalStep('paypal')}
                >
                  <View style={[styles.providerIconBox, { backgroundColor: '#FFF3CD' }]}>
                    <Text style={styles.providerIconText}>🅿️</Text>
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>PayPal</Text>
                    <Text style={styles.providerDesc}>Mit PayPal-Konto verknüpfen</Text>
                  </View>
                  <Text style={styles.providerChevron}>›</Text>
                </Pressable>
              </>
            )}

            {/* Step: Stripe card form */}
            {paymentModalStep === 'stripe' && (
              <>
                <Pressable
                  style={styles.modalBackBtn}
                  onPress={() => setPaymentModalStep('choose')}
                >
                  <Text style={styles.modalBackText}>← Zurück</Text>
                </Pressable>

                <Text style={styles.modalTitle}>Karte hinzufügen</Text>
                <Text style={styles.modalSubtitle}>
                  Kartendaten eingeben (Demo)
                </Text>

                <View style={styles.cardForm}>
                  <Text style={styles.cardFormLabel}>Karteninhaber</Text>
                  <TextInput
                    style={styles.cardFormInput}
                    placeholder="Max Mustermann"
                    placeholderTextColor={Colors.textTertiary}
                    value={cardHolder}
                    onChangeText={setCardHolder}
                    autoCapitalize="words"
                  />

                  <Text style={styles.cardFormLabel}>Kartennummer</Text>
                  <TextInput
                    style={styles.cardFormInput}
                    placeholder="4242 4242 4242 4242"
                    placeholderTextColor={Colors.textTertiary}
                    value={cardNumber}
                    onChangeText={formatCardNumber}
                    keyboardType="number-pad"
                    maxLength={19}
                  />

                  <View style={styles.cardFormRow}>
                    <View style={styles.cardFormHalf}>
                      <Text style={styles.cardFormLabel}>Ablaufdatum</Text>
                      <TextInput
                        style={styles.cardFormInput}
                        placeholder="MM/JJ"
                        placeholderTextColor={Colors.textTertiary}
                        value={cardExpiry}
                        onChangeText={formatExpiry}
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                    </View>
                    <View style={styles.cardFormHalf}>
                      <Text style={styles.cardFormLabel}>CVC</Text>
                      <TextInput
                        style={styles.cardFormInput}
                        placeholder="123"
                        placeholderTextColor={Colors.textTertiary}
                        value={cardCvc}
                        onChangeText={(t) => setCardCvc(t.replace(/\D/g, '').slice(0, 4))}
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View style={styles.demoHint}>
                    <Text style={styles.demoHintText}>
                      Demo: Verwende 4242 4242 4242 4242 mit beliebigem Datum und CVC
                    </Text>
                  </View>

                  <Button
                    title="Karte speichern"
                    onPress={handleAddStripeCard}
                    variant="primary"
                    fullWidth
                    disabled={!isCardValid}
                  />
                </View>
              </>
            )}

            {/* Step: PayPal connect */}
            {paymentModalStep === 'paypal' && (
              <>
                <Pressable
                  style={styles.modalBackBtn}
                  onPress={() => setPaymentModalStep('choose')}
                >
                  <Text style={styles.modalBackText}>← Zurück</Text>
                </Pressable>

                <Text style={styles.modalTitle}>PayPal verknüpfen</Text>
                <Text style={styles.modalSubtitle}>
                  Melde dich mit deinem PayPal-Konto an
                </Text>

                <View style={styles.paypalForm}>
                  <View style={styles.paypalLogo}>
                    <Text style={styles.paypalLogoText}>Pay</Text>
                    <Text style={styles.paypalLogoTextBold}>Pal</Text>
                  </View>

                  <Text style={styles.cardFormLabel}>E-Mail-Adresse</Text>
                  <TextInput
                    style={styles.cardFormInput}
                    placeholder="deine@email.de"
                    placeholderTextColor={Colors.textTertiary}
                    value={paypalEmail}
                    onChangeText={setPaypalEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <View style={styles.demoHint}>
                    <Text style={styles.demoHintText}>
                      Demo: Gib eine beliebige E-Mail-Adresse ein
                    </Text>
                  </View>

                  <Pressable
                    style={[
                      styles.paypalButton,
                      (!isPaypalValid || paypalConnecting) && styles.paypalButtonDisabled,
                    ]}
                    onPress={handleAddPaypal}
                    disabled={!isPaypalValid || paypalConnecting}
                  >
                    {paypalConnecting ? (
                      <Text style={styles.paypalButtonText}>Verbindung wird hergestellt...</Text>
                    ) : (
                      <Text style={styles.paypalButtonText}>Mit PayPal verbinden</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    ...Shadow.sm,
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarEditIcon: {
    fontSize: 14,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#000000',
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSize.md,
    color: '#374151',
    marginBottom: Spacing.xs,
  },
  userPhone: {
    fontSize: FontSize.md,
    color: '#374151',
    marginBottom: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  verificationLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  verifyButtonWrapper: {
    marginTop: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  menuRowPressed: {
    opacity: 0.6,
  },
  menuRowLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuRowValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: FontSize.xl,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  accountTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editForm: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  paymentIcon: {
    fontSize: FontSize.lg,
  },
  paymentLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  noPaymentText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  deleteButtonWrapper: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  deleteButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  deleteButtonPressed: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: FontWeight.medium,
  },

  // Payment Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
  },
  modalClose: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  modalBackBtn: {
    marginBottom: Spacing.sm,
  },
  modalBackText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },

  providerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  providerIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  providerIconText: {
    fontSize: 24,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  providerDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  providerChevron: {
    fontSize: FontSize.xxl,
    color: Colors.textTertiary,
  },

  cardForm: {
    gap: Spacing.xs,
  },
  cardFormLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  cardFormInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardFormRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardFormHalf: {
    flex: 1,
  },
  demoHint: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  demoHintText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    textAlign: 'center',
  },

  paypalForm: {
    gap: Spacing.xs,
  },
  paypalLogo: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  paypalLogoText: {
    fontSize: 28,
    color: '#003087',
    fontWeight: FontWeight.medium,
  },
  paypalLogoTextBold: {
    fontSize: 28,
    color: '#009cde',
    fontWeight: FontWeight.bold,
  },
  paypalButton: {
    backgroundColor: '#0070BA',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  paypalButtonDisabled: {
    opacity: 0.5,
  },
  paypalButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
