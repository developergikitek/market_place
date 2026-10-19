import React, { useEffect, useState } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * Swiggy-style floating cart bar, drawn natively above the tab bar.
 * Native so it stays pinned while the WebView resizes (header collapse) during fast scrolls.
 * Mirrors the web .cart-bar look; the web one is hidden inside the shell.
 */
export function NativeCartBar({ count, amount, storeName, onPress }) {
  // useState keeps one Animated.Value for the component's lifetime without reading a ref in render
  const [slide] = useState(() => new Animated.Value(0));
  const visible = count > 0;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      <TouchableOpacity style={styles.bar} activeOpacity={0.9} onPress={onPress}>
        <View style={styles.info}>
          <Text style={styles.summary}>
            {count} {count === 1 ? 'item' : 'items'} | ₹{Number(amount || 0).toLocaleString('en-IN')}
          </Text>
          {storeName ? (
            <Text style={styles.store} numberOfLines={1}>
              From {storeName}
            </Text>
          ) : null}
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>View Cart</Text>
          <Feather name="chevron-right" size={18} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#0E8A42',
    shadowColor: '#0E8A42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  summary: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14,
  },
  store: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 11.5,
    marginTop: 1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ctaText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14,
  },
});
