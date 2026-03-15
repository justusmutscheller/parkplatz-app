import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
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
import { Card, Badge, Button, Divider, Input } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import type { VerificationStatus, UserAddress } from '@/types';

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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
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
            <View style={styles.paymentRow}>
              <Text style={styles.paymentIcon}>💳</Text>
              <Text style={styles.paymentLabel}>Visa ****4242</Text>
            </View>
            <Divider spacing={Spacing.sm} />
            <View style={styles.paymentRow}>
              <Text style={styles.paymentIcon}>🅿️</Text>
              <Text style={styles.paymentLabel}>PayPal max@example.de</Text>
            </View>
            <Divider spacing={Spacing.sm} />
            <Button
              title={t('profile.addPaymentMethod')}
              onPress={() => Alert.alert(t('profile.addPaymentMethod'))}
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  userPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
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
});
