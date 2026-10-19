import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useInstantSelection } from './useInstantSelection';

// Wholesale mode has no categories or cart: requirements and quotes live on Home.
const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'orders', label: 'Orders', icon: 'box' },
  { id: 'account', label: 'Profile', icon: 'user', also: ['profile'] },
];

const ACTIVE = '#5B4FD9'; // wholesale accent (matches the web wholesale screens)
const IDLE = '#94A3B8';

export function NativeWholesaleTabBar({ activeTab = 'home', onTabPress, activeColor = ACTIVE }) {
  // Highlight swaps on touch-down, before the app finishes switching screens
  const [shownTab, pressProps] = useInstantSelection(activeTab);

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const on = shownTab === tab.id || tab.also?.includes(shownTab);
        return (
          <Pressable
            key={tab.id}
            style={styles.tab}
            {...pressProps(tab.id, () => onTabPress(tab.id))}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={tab.label}
          >
            {on && <View style={[styles.indicator, { backgroundColor: activeColor }]} />}
            <Feather name={tab.icon} size={20} color={on ? activeColor : IDLE} />
            <Text style={[styles.label, on && [styles.labelOn, { color: activeColor }]]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E4E1F7',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: ACTIVE,
  },
  label: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 10.5,
    color: IDLE,
    marginTop: 3,
  },
  labelOn: {
    color: ACTIVE,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
