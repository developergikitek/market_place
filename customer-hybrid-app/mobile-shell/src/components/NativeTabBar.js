import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useInstantSelection } from './useInstantSelection';

const IDLE = '#94A3B8';

const TABS = [
  { id: 'home', label: 'Home', Icon: Feather, icon: 'home', also: ['stores'] },
  { id: 'categories', label: 'Categories', Icon: Ionicons, icon: 'grid-outline' },
  { id: 'orders', label: 'Orders', Icon: Feather, icon: 'box' },
  { id: 'cart', label: 'Cart', Icon: Feather, icon: 'shopping-cart', badge: true },
  { id: 'account', label: 'Profile', Icon: Feather, icon: 'user', also: ['profile'] },
];

export function NativeTabBar({
  activeTab = 'home',
  cartCount = 0,
  onTabPress,
  activeColor = '#F97316', // section theme tabActive
}) {
  // Highlight swaps on touch-down, before the app finishes switching screens
  const [shownTab, pressProps] = useInstantSelection(activeTab);

  return (
    <View style={styles.nativeTabBar}>
      {TABS.map(({ id, label, Icon, icon, also, badge }) => {
        const on = shownTab === id || also?.includes(shownTab);
        const color = on ? activeColor : IDLE;
        return (
          <Pressable
            key={id}
            style={styles.tabButton}
            {...pressProps(id, () => onTabPress(id))}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={label}
          >
            <View>
              <Icon name={icon} size={20} color={color} />
              {badge && cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, on && [styles.tabLabelActive, { color }]]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nativeTabBar: {
    height: 56,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 10.5,
    color: IDLE,
    marginTop: 3,
  },
  tabLabelActive: {
    fontFamily: 'PlusJakartaSans-Bold',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 9.5,
  },
});
