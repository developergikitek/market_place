import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  StyleSheet,
} from 'react-native';
import { useInstantSelection } from './useInstantSelection';
import {
  MapPinSvgIcon,
  ChevronDownSvgIcon,
  WalletSvgIcon,
  SearchSvgIcon,
  MicSvgIcon,
} from './NativeIcons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

// Service sections shown as cards; ids match App.js SERVICE_SECTIONS
const SERVICE_CARDS = [
  { id: 'retail', label: 'Quick', art: '⚡', badge: '30 MIN', badgeColor: '#2563EB' },
  { id: 'wholesale', label: 'Bulk', art: '📦' },
  { id: 'bazaar', label: 'Bazaar', art: '🛍️' },
  { id: 'construction', label: 'Construction', art: '🏗️', badge: 'NEW', badgeColor: '#E11D74' },
];
const HEADER_PADDING_TOP = 12;
const HEADER_PADDING_BOTTOM = 8;
// Categories keeps the full header too, so switching Home <-> Categories never changes its size
const SECTION_HOMES = ['home', 'stores', 'categories', 'wholesale', 'bazaar', 'construction'];

/** Screens that show the location row + service cards above the search bar. */
export const isSectionHome = (layoutTab) => SECTION_HOMES.includes(layoutTab);

export function NativeHeader({
  config,
  activeTab,
  layoutTab,
  activeService,
  searchQuery,
  fastOnly,
  headerCollapseAnim,
  panHandlers,
  onOpenLocation,
  onOpenWallet,
  onServiceChange,
  onSearchChange,
  onOpenSearch,
  onVoiceSearch,
  onToggleFast,
  onUpperLayout,
  onBaseLayout,
  theme,
}) {
  // Collapse location + service-selector for categories and store detail pages.
  // layoutTab drives this (not activeTab, which stays 'home' inside a store for Swiggy-style tab bar).
  const effectiveTab = layoutTab || activeTab;
  // Location + service cards stay visible on every section home
  const collapseUpperSection = !isSectionHome(effectiveTab);
  // Card highlight swaps on touch-down, before the app finishes switching sections
  const [shownService, pressServiceProps] = useInstantSelection(activeService);

  // The header never changes height while scrolling: App.js slides the whole header up by the
  // upper section's height (native-driver transform) and the WebView keeps a fixed size, so the
  // page never re-lays out mid-scroll. Here the upper section only fades.
  return (
    <View style={[styles.nativeHeaderContainer, { backgroundColor: theme.gradient[1] }]} {...panHandlers}>
      {/* Soft vertical gradient; its bottom colour is the web hero's top colour */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="headerGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.gradient[0]} />
            <Stop offset="1" stopColor={theme.gradient[1]} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#headerGradient)" />
      </Svg>
      {/* Upper Header (Location Row + service cards); not shown on detail pages */}
      <Animated.View
        onLayout={(e) => !collapseUpperSection && onUpperLayout?.(e.nativeEvent.layout.height)}
        style={[
          styles.collapsibleUpperHeader,
          collapseUpperSection
            ? styles.hidden
            : {
                opacity: headerCollapseAnim.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [1, 0.15, 0],
                }),
              },
        ]}
      >
        {/* Location Bar Row */}
        <View style={styles.locationRow}>
          <TouchableOpacity
            style={styles.locationButton}
            activeOpacity={0.8}
            onPress={onOpenLocation}
          >
            <View style={styles.locationTitleRow}>
              <MapPinSvgIcon size={16} color={theme.accent} />
              <Text style={[styles.locationTitle, { color: theme.ink }]}>
                {config.header?.locationTitle || 'Indore Central'}
              </Text>
              <ChevronDownSvgIcon size={14} color={theme.ink} />
            </View>
            <Text style={[styles.locationSubtitle, { color: theme.muted }]} numberOfLines={1}>
              {config.header?.address || 'B400c, Scheme No 54, Near C21 Mall, Vijay Nagar, Indore'}
            </Text>
          </TouchableOpacity>

          {/* Wallet Button */}
          <TouchableOpacity
            style={styles.walletButton}
            activeOpacity={0.8}
            onPress={onOpenWallet}
            accessibilityRole="button"
            accessibilityLabel="Wallet"
          >
            <WalletSvgIcon width={44} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* Service cards (Swiggy Food / Instamart / Dineout style) */}
        <View style={styles.serviceCardRow}>
          {SERVICE_CARDS.map((card) => {
            const on = shownService === card.id;
            return (
              <Pressable
                key={card.id}
                style={[styles.serviceCard, on && styles.serviceCardActive, on && { borderColor: theme.accent }]}
                {...pressServiceProps(card.id, () => onServiceChange(card.id))}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={card.label}
              >
                <View style={styles.serviceArtWrap}>
                  <Text style={styles.serviceArt}>{card.art}</Text>
                  {card.badge ? (
                    <View style={[styles.serviceBadge, { backgroundColor: card.badgeColor }]}>
                      <Text style={styles.serviceBadgeText}>{card.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[styles.serviceCardLabel, { color: theme.muted }, on && [styles.serviceCardLabelActive, { color: theme.ink }]]}
                  numberOfLines={1}
                >
                  {card.label}
                </Text>
                {on && <View style={[styles.serviceCardIndicator, { backgroundColor: theme.accent }]} />}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Native Sticky Search Bar Row (Persistent - always rests at the top) */}
      {/* Reports the always-visible part (search row + header padding): App.js places the WebView
          below it, so the WebView top is the same on every screen and never jumps on a tab switch. */}
      <View
        style={styles.searchBarRow}
        onLayout={(e) => onBaseLayout?.(e.nativeEvent.layout.height + HEADER_PADDING_TOP + HEADER_PADDING_BOTTOM)}
      >
        <View style={styles.searchInputBox}>
          <SearchSvgIcon size={16} color="#64748B" />
          {/* Opens the web search sheet (stores & items) instead of typing here */}
          <TouchableOpacity
            style={styles.searchTapArea}
            activeOpacity={0.7}
            onPress={onOpenSearch}
            accessibilityRole="search"
            accessibilityLabel="Search for stores and items"
          >
            <Text style={styles.searchPlaceholderText} numberOfLines={1}>
              {effectiveTab === 'wholesale'
                ? 'Search bulk products: cement, TMT, wires...'
                : activeTab === 'categories'
                  ? 'Search stores in all categories...'
                  : "Search for 'Bosch Drill', 'UltraTech', 'Havells'..."}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.voiceMicBtn}
            activeOpacity={0.7}
            onPress={onOpenSearch}
          >
            <MicSvgIcon size={16} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* Same-Day Express Capsule Toggle */}
        <TouchableOpacity
          style={[styles.fastToggleBtn, fastOnly && styles.fastToggleBtnActive]}
          activeOpacity={0.8}
          onPress={onToggleFast}
        >
          <Text style={styles.fastToggleLabel}>SAME DAY</Text>
          <View style={[styles.toggleTrack, fastOnly && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, fastOnly && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeHeaderContainer: {
    backgroundColor: '#031B3B',
    paddingHorizontal: 16,
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: HEADER_PADDING_BOTTOM,
  },
  collapsibleUpperHeader: {
    overflow: 'hidden',
  },
  hidden: {
    display: 'none',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationButton: {
    flex: 1,
    marginRight: 10,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationTitle: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  locationSubtitle: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    marginTop: 1,
  },
  walletButton: {
    padding: 4,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  serviceCardRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  serviceCard: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  serviceCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  serviceArtWrap: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceArt: {
    fontSize: 28,
    lineHeight: 36,
  },
  serviceBadge: {
    position: 'absolute',
    bottom: -3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  serviceBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 8,
    letterSpacing: 0.2,
  },
  serviceCardLabel: {
    marginTop: 5,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 11.5,
    color: '#94A3B8',
  },
  serviceCardLabelActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  serviceCardIndicator: {
    position: 'absolute',
    bottom: -1,
    width: 26,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: '#FFA64C',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 11,
    height: 42,
    gap: 9,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  searchTapArea: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  searchPlaceholderText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    color: '#94A3B8',
  },
  voiceMicBtn: {
    padding: 3,
  },
  fastToggleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(15, 27, 45, 0.06)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 9,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fastToggleBtnActive: {
    backgroundColor: '#E8F7ED',
    borderColor: '#22C55E',
  },
  fastToggleLabel: {
    color: '#0E8A42',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 8,
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  toggleTrack: {
    width: 20,
    height: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 27, 45, 0.18)',
    padding: 1,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#22C55E',
  },
  toggleThumb: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});
