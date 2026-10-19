import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Linking,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNetworkState } from 'expo-network';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile, editProfile, syncProfile } from '../profile/profileStore';
import { simulateRemoteEdit } from '../profile/mockProfileServer';

const INK = '#0F1B2D';
const MUTED = '#5B6B80';
const FAINT = '#94A3B8';
const LINE = '#E2E8F0';

/** "2:40 PM", or "15 Oct, 2:40 PM" when not today */
function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const h = d.getHours();
  const time = `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  if (d.toDateString() === new Date().toDateString()) return time;
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  return `${d.getDate()} ${month}, ${time}`;
}

const needsInternet = (what) =>
  Alert.alert('Needs internet', `${what} needs an internet connection. Please try again once you're online.`);

function Sheet({ visible, title, onClose, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.sheetRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Feather name="x" size={20} color={MUTED} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MenuRow({ icon, tint, title, subtitle, tail, onPress, last }) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, !last && styles.menuRowDivider]}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: tint.bg }]}>
        <Feather name={icon} size={17} color={tint.fg} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.menuSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {tail}
      {onPress ? <Feather name="chevron-right" size={18} color={FAINT} /> : null}
    </TouchableOpacity>
  );
}

const TINTS = {
  purple: { bg: '#F3E8FF', fg: '#7C3AED' },
  green: { bg: '#DCFCE7', fg: '#15803D' },
  indigo: { bg: '#E0E7FF', fg: '#4338CA' },
  amber: { bg: '#FEF3C7', fg: '#B45309' },
  teal: { bg: '#CCFBF1', fg: '#0F766E' },
};

/**
 * Native Account screen. Reads the stored profile, so it opens instantly and works offline;
 * edits go through profileStore (applied at once, synced when online).
 * `sheet` / `onSheetChange` let the header wallet button open the Wallet sheet directly.
 */
export function NativeProfileScreen({ theme, appVersion, sheet, onSheetChange, onOpenOrders }) {
  const { profile, fetchedAt, pendingFields, syncing, hydrated } = useProfile();
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  const [pulling, setPulling] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const closeSheet = () => onSheetChange(null);

  const refresh = async () => {
    setPulling(true);
    await syncProfile();
    setPulling(false);
  };

  // Never loaded on this phone (fresh install) and no internet to load it now
  if (!profile) {
    if (!hydrated) return <View style={styles.screen} />;
    return (
      <View style={[styles.screen, styles.emptyState]}>
        <View style={[styles.emptyIcon, { backgroundColor: theme.gradient[1] }]}>
          <Feather name={offline ? 'wifi-off' : 'user'} size={34} color={theme.accent} />
        </View>
        <Text style={styles.emptyTitle}>{offline ? "You're offline" : 'Loading your profile'}</Text>
        <Text style={styles.emptyMessage}>
          {offline
            ? 'Connect to the internet to load your profile. After that it will open even without internet.'
            : 'Fetching your details…'}
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          activeOpacity={0.85}
          onPress={() => syncProfile()}
          disabled={syncing}
        >
          <Feather name="refresh-cw" size={16} color={theme.accentInk} />
          <Text style={[styles.primaryButtonText, { color: theme.accentInk }]}>
            {syncing ? 'Loading…' : 'Retry'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openEdit = () => {
    setForm({ name: profile.name, phone: profile.phone, email: profile.email });
    onSheetChange('EDIT');
  };

  const saveEdit = () => {
    const changes = {};
    ['name', 'phone', 'email'].forEach((field) => {
      const value = form[field].trim();
      if (value && value !== profile[field]) changes[field] = value;
    });
    if (!form.name.trim()) return Alert.alert('Name required', 'Please enter your full name.');
    if (form.email.trim() && !form.email.includes('@')) return Alert.alert('Check email', 'Please enter a valid email address.');
    if (Object.keys(changes).length) {
      editProfile(changes);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    closeSheet();
  };

  const selectDefaultAddress = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    editProfile({
      savedAddresses: profile.savedAddresses.map((addr) => ({ ...addr, isDefault: addr.id === id })),
    });
  };

  const openOrders = () => (offline ? needsInternet('My Orders') : onOpenOrders());
  const addresses = profile.savedAddresses || [];
  const defaultAddress = addresses.find((a) => a.isDefault);

  return (
    <View style={styles.screen}>
      {offline ? (
        <View style={styles.offlineBar}>
          <Feather name="wifi-off" size={13} color="#FFFFFF" />
          <Text style={styles.offlineBarText}>You&apos;re offline · showing saved details</Text>
        </View>
      ) : null}
      {pendingFields.length ? (
        <View style={styles.pendingBar}>
          <Feather name={offline ? 'clock' : 'upload-cloud'} size={13} color="#92400E" />
          <Text style={styles.pendingBarText}>
            {offline ? 'Your changes will sync when you’re online' : 'Saving your changes…'}
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={refresh} colors={[theme.accent]} tintColor={theme.accent} />
        }
      >
        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={[styles.avatar, { backgroundColor: theme.gradient[1] }]}>
              <Text style={[styles.avatarText, { color: theme.accent }]}>
                {profile.name?.trim()?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.userText}>
              <Text style={styles.userName} numberOfLines={1}>
                {profile.name}
              </Text>
              <Text style={styles.userContact} numberOfLines={1}>
                {profile.phone}
              </Text>
              <Text style={styles.userContact} numberOfLines={1}>
                {profile.email}
              </Text>
            </View>
            <TouchableOpacity style={[styles.editButton, { borderColor: theme.accent }]} onPress={openEdit}>
              <Text style={[styles.editButtonText, { color: theme.accent }]}>EDIT</Text>
            </TouchableOpacity>
          </View>

          {/* Membership */}
          <TouchableOpacity style={styles.memberBanner} activeOpacity={0.85} onPress={() => onSheetChange('MEMBERSHIP')}>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>ONE</Text>
            </View>
            <View style={styles.menuText}>
              <Text style={styles.memberTitle}>BuildWell One · {profile.membershipTier}</Text>
              <Text style={styles.memberSubtitle}>{profile.membershipValidity}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#B45309" />
          </TouchableOpacity>
        </View>

        <View style={styles.group}>
          <MenuRow
            icon="shopping-bag"
            tint={TINTS.purple}
            title="My Orders"
            subtitle="Past orders, live tracking & invoices"
            onPress={openOrders}
            last
          />
        </View>

        <View style={styles.group}>
          <MenuRow
            icon="credit-card"
            tint={TINTS.green}
            title="BuildWell Wallet"
            subtitle={offline ? `Last known balance · ${formatTime(fetchedAt)}` : 'Cashback & refunds'}
            tail={<Text style={styles.balancePill}>₹{profile.cashbackBalance}</Text>}
            onPress={() => onSheetChange('WALLET')}
          />
          <MenuRow
            icon="map-pin"
            tint={TINTS.indigo}
            title="Manage Addresses"
            subtitle={defaultAddress ? `Delivering to ${defaultAddress.tag}` : `${addresses.length} saved`}
            onPress={() => onSheetChange('ADDRESSES')}
          />
          <MenuRow
            icon="file-text"
            tint={TINTS.amber}
            title="GST Details"
            subtitle={profile.gstDetails ? `${profile.gstDetails.gstin} · ${profile.gstDetails.registeredName}` : 'Not added'}
            tail={profile.gstDetails?.verified ? <Text style={styles.verifiedPill}>VERIFIED</Text> : null}
            last
          />
        </View>

        <View style={styles.group}>
          <MenuRow
            icon="headphones"
            tint={TINTS.teal}
            title="Help & Support"
            subtitle="Chat or call about orders, returns & invoices"
            onPress={() => onSheetChange('HELP')}
            last
          />
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => Alert.alert('Log out', 'Login isn’t set up in this build yet.')}
        >
          <Feather name="log-out" size={16} color="#DC2626" />
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          App Version {appVersion}
          {fetchedAt ? ` · Profile updated ${formatTime(fetchedAt)}` : ''}
        </Text>

        {__DEV__ ? (
          <TouchableOpacity
            style={styles.devButton}
            onPress={async () => {
              const version = await simulateRemoteEdit();
              Alert.alert(
                'Edited on "another phone"',
                `Server is now at version ${version}; this phone still has its old copy. Pull to refresh, reopen the app, or go offline and back online to see it sync.`
              );
            }}
          >
            <Text style={styles.devButtonText}>DEV · Simulate edit from another phone</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* Edit profile */}
      <Sheet visible={sheet === 'EDIT'} title="Edit Profile" onClose={closeSheet}>
        {[
          { key: 'name', label: 'Full Name', keyboardType: 'default' },
          { key: 'phone', label: 'Phone Number', keyboardType: 'phone-pad' },
          { key: 'email', label: 'Email Address', keyboardType: 'email-address' },
        ].map((field) => (
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={form[field.key]}
              onChangeText={(text) => setForm((f) => ({ ...f, [field.key]: text }))}
              keyboardType={field.keyboardType}
              autoCapitalize={field.key === 'name' ? 'words' : 'none'}
              autoCorrect={false}
            />
          </View>
        ))}
        {offline ? <Text style={styles.sheetNote}>You&apos;re offline. Changes save on this phone now and sync later.</Text> : null}
        <TouchableOpacity style={[styles.primaryButton, styles.sheetButton, { backgroundColor: theme.accent }]} onPress={saveEdit}>
          <Text style={[styles.primaryButtonText, { color: theme.accentInk }]}>Save Changes</Text>
        </TouchableOpacity>
      </Sheet>

      {/* Addresses */}
      <Sheet visible={sheet === 'ADDRESSES'} title="Saved Worksites & Addresses" onClose={closeSheet}>
        <ScrollView style={styles.sheetScroll}>
          {addresses.map((addr) => (
            <TouchableOpacity
              key={addr.id}
              style={[styles.addressCard, addr.isDefault && { borderColor: theme.accent, backgroundColor: theme.gradient[1] }]}
              activeOpacity={0.8}
              onPress={() => !addr.isDefault && selectDefaultAddress(addr.id)}
            >
              <View style={styles.addressTagRow}>
                <Text style={styles.addressTag}>{addr.tag}</Text>
                <Text style={[styles.addressState, addr.isDefault && { color: theme.accent }]}>
                  {addr.isDefault ? '✓ DELIVER HERE' : 'Tap to select'}
                </Text>
              </View>
              <Text style={styles.addressLine}>{addr.addressLine1}</Text>
              <Text style={styles.addressSub}>
                {addr.landmark}, {addr.city}
              </Text>
              <Text style={styles.addressSub}>Contact: {addr.contactPerson}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Alert.alert('Add worksite', 'Adding a new address is coming soon.')}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>+ Add New Delivery Worksite</Text>
        </TouchableOpacity>
      </Sheet>

      {/* Wallet */}
      <Sheet visible={sheet === 'WALLET'} title="BuildWell Wallet & Credits" onClose={closeSheet}>
        <View style={[styles.walletBox, { backgroundColor: theme.gradient[1] }]}>
          <Text style={styles.walletLabel}>TOTAL AVAILABLE BALANCE</Text>
          <Text style={[styles.walletSum, { color: theme.ink }]}>₹{profile.cashbackBalance}</Text>
          <Text style={styles.walletSub}>
            {offline ? `Last known balance · as of ${formatTime(fetchedAt)}` : `Updated ${formatTime(fetchedAt)}`}
          </Text>
        </View>
        <Text style={styles.perk}>⚡ 1-tap checkout on all hardware orders</Text>
        <Text style={styles.perk}>💰 Instant refunds straight into your wallet</Text>
        <TouchableOpacity
          style={[styles.primaryButton, styles.sheetButton, { backgroundColor: theme.accent }]}
          onPress={() => (offline ? needsInternet('Adding money') : Alert.alert('Add money', 'Top-ups are coming soon.'))}
        >
          <Text style={[styles.primaryButtonText, { color: theme.accentInk }]}>+ Add Money to Wallet</Text>
        </TouchableOpacity>
      </Sheet>

      {/* Membership */}
      <Sheet visible={sheet === 'MEMBERSHIP'} title="BuildWell One Membership" onClose={closeSheet}>
        <View style={styles.memberSheetBanner}>
          <Text style={styles.memberTitle}>{profile.membershipTier}</Text>
          <Text style={styles.memberSubtitle}>{profile.membershipValidity}</Text>
        </View>
        {[
          ['🚚', 'Unlimited Free Delivery', 'On orders above ₹199 from all verified stores'],
          ['🏷️', 'Extra 5% Off Wholesale', 'On top of retail discounts on tools & fasteners'],
          ['🛡️', 'Priority Support', 'A dedicated manager for dispatch disputes'],
        ].map(([emoji, title, desc]) => (
          <View key={title} style={styles.benefitRow}>
            <Text style={styles.benefitEmoji}>{emoji}</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{title}</Text>
              <Text style={styles.menuSubtitle}>{desc}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={[styles.primaryButton, styles.sheetButton, { backgroundColor: theme.accent }]} onPress={closeSheet}>
          <Text style={[styles.primaryButtonText, { color: theme.accentInk }]}>Got It</Text>
        </TouchableOpacity>
      </Sheet>

      {/* Help */}
      <Sheet visible={sheet === 'HELP'} title="Help & Customer Support" onClose={closeSheet}>
        <MenuRow
          icon="message-circle"
          tint={TINTS.teal}
          title="Chat with Customer Care"
          subtitle="Wait time under 1 minute"
          onPress={() => (offline ? needsInternet('Chat') : Alert.alert('Chat', 'Chat is coming soon.'))}
        />
        <MenuRow
          icon="phone"
          tint={TINTS.green}
          title="Call Priority Helpline"
          subtitle="1800-419-8989 · 9 AM – 10 PM"
          onPress={() => Linking.openURL('tel:18004198989').catch(() => {})}
        />
        <MenuRow
          icon="package"
          tint={TINTS.purple}
          title="Issue with an existing order"
          subtitle="Track an order or request a replacement"
          onPress={() => {
            closeSheet();
            openOrders();
          }}
          last
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 32,
  },
  offlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#475569',
    paddingVertical: 7,
  },
  offlineBarText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
  },
  pendingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 7,
  },
  pendingBarText: {
    color: '#92400E',
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 22,
  },
  userText: {
    flex: 1,
  },
  userName: {
    color: INK,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 17,
    marginBottom: 2,
  },
  userContact: {
    color: MUTED,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
  },
  editButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 11.5,
    letterSpacing: 0.4,
  },
  memberBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#F5D58A',
  },
  memberBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  memberBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  memberTitle: {
    color: '#78350F',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
  },
  memberSubtitle: {
    color: '#B45309',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11.5,
    marginTop: 1,
  },
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  menuRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    color: INK,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
  },
  menuSubtitle: {
    color: MUTED,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11.5,
    marginTop: 2,
  },
  balancePill: {
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  verifiedPill: {
    color: '#15803D',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 9.5,
    letterSpacing: 0.4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 13,
    marginTop: 4,
  },
  logoutText: {
    color: '#DC2626',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  footerText: {
    color: FAINT,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
  },
  devButton: {
    marginTop: 14,
    alignSelf: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: FAINT,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  devButtonText: {
    color: MUTED,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: INK,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    color: MUTED,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 8,
    maxHeight: '85%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: LINE,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    color: INK,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 16,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetNote: {
    color: '#92400E',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    marginBottom: 4,
  },
  sheetButton: {
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: MUTED,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    color: INK,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
  },
  addressCard: {
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  addressTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressTag: {
    color: INK,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
  },
  addressState: {
    color: FAINT,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
  },
  addressLine: {
    color: INK,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12.5,
  },
  addressSub: {
    color: MUTED,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11.5,
    marginTop: 2,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  secondaryButtonText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 13,
  },
  walletBox: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  walletLabel: {
    color: MUTED,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  walletSum: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 32,
    marginVertical: 4,
  },
  walletSub: {
    color: MUTED,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11.5,
  },
  perk: {
    color: INK,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12.5,
    marginBottom: 8,
  },
  memberSheetBanner: {
    backgroundColor: '#FFF7E6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  benefitEmoji: {
    fontSize: 22,
  },
});
