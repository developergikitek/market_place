import React, { useEffect, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

/**
 * NativeSkeletonScreen: Swiggy & Blinkit Exact Reference Layout
 * Replaces circular spinners with zero-latency shimmer placeholders.
 * Positioned in the middle content area between persistent Native Header & Native Bottom Nav.
 *
 * `delayMs`: draw nothing (the overlay's plain background still hides the previous screen) until
 * this long has passed, so a switch that is ready quickly shows no shimmer at all (Swiggy-style).
 */
export function NativeSkeletonScreen({ activeTab = 'home', delayMs = 0 }) {
  // useState keeps one Animated.Value for the component's lifetime without reading a ref in render
  const [pulseAnim] = useState(() => new Animated.Value(0.35));
  const [visible, setVisible] = useState(delayMs <= 0);

  useEffect(() => {
    if (visible) return undefined;
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [visible, delayMs]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  if (!visible) return null;

  if (activeTab === 'categories') {
    return (
      <View style={styles.nativeSkeletonContainer}>
        <View style={styles.skeletonFeedBody}>
          <Animated.View style={[styles.skeletonBox, styles.skeletonHeadingPill, { opacity: pulseAnim }]} />
          
          {/* 4-Column Grid of 12 Categories (Blinkit / Catalog Reference) */}
          <View style={styles.skeletonCatGrid4Col}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={styles.skeletonCatCardItem}>
                <Animated.View style={[styles.skeletonBox, styles.skeletonCatCutout, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBox, styles.skeletonCatLine1, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBox, styles.skeletonCatLine2, { opacity: pulseAnim }]} />
              </View>
            ))}
          </View>

          {/* Popular Stores Section Placeholder */}
          <Animated.View style={[styles.skeletonBox, styles.skeletonHeadingPill, { marginTop: 22, opacity: pulseAnim }]} />
          <View style={styles.skeletonStoresTray}>
            <Animated.View style={[styles.skeletonBox, styles.skeletonStoreCard, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonBox, styles.skeletonStoreCard, { opacity: pulseAnim }]} />
          </View>
        </View>
      </View>
    );
  }

  if (activeTab === 'store') {
    return (
      <View style={[styles.nativeSkeletonContainer, styles.skeletonWhiteBg]}>
        <View style={styles.skeletonFeedBody}>
          {/* Back + favourite row */}
          <View style={styles.skeletonRowBetween}>
            <Animated.View style={[styles.skeletonBox, { width: 28, height: 28, borderRadius: 8, opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonBox, { width: 28, height: 28, borderRadius: 14, opacity: pulseAnim }]} />
          </View>
          {/* Store logo + name / rating / delivery lines */}
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 18 }}>
            <Animated.View style={[styles.skeletonBox, { width: 64, height: 64, borderRadius: 14, opacity: pulseAnim }]} />
            <View style={{ flex: 1, gap: 8 }}>
              <Animated.View style={[styles.skeletonBox, { width: '85%', height: 20, opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonBox, { width: '65%', height: 12, opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonBox, { width: '75%', height: 12, opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonBox, { width: 60, height: 18, borderRadius: 9, opacity: pulseAnim }]} />
            </View>
          </View>
          {/* In-store search */}
          <Animated.View style={[styles.skeletonBox, { height: 44, borderRadius: 12, marginTop: 22, opacity: pulseAnim }]} />
          {/* Assurance strip */}
          <Animated.View style={[styles.skeletonBox, { height: 50, borderRadius: 12, marginTop: 14, opacity: pulseAnim }]} />
          {/* Best sellers */}
          <Animated.View style={[styles.skeletonBox, styles.skeletonHeadingPill, { marginTop: 22, opacity: pulseAnim }]} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <View key={i} style={styles.skeletonProductCard}>
                <Animated.View style={[styles.skeletonBox, { height: 100, borderRadius: 10, opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBox, { width: '85%', height: 12, opacity: pulseAnim }]} />
                <View style={styles.skeletonRowBetween}>
                  <Animated.View style={[styles.skeletonBox, { width: 54, height: 14, opacity: pulseAnim }]} />
                  <Animated.View style={[styles.skeletonBox, { width: 28, height: 28, borderRadius: 8, opacity: pulseAnim }]} />
                </View>
              </View>
            ))}
          </View>
          {/* Category circles */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Animated.View key={i} style={[styles.skeletonBox, { width: 56, height: 56, borderRadius: 28, opacity: pulseAnim }]} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (activeTab === 'search') {
    return (
      <View style={[styles.nativeSkeletonContainer, styles.skeletonWhiteBg]}>
        <View style={styles.skeletonFeedBody}>
          {/* Back + "Showing results" title */}
          <View style={[styles.skeletonRowBetween, { marginBottom: 14 }]}>
            <Animated.View style={[styles.skeletonBox, { width: 26, height: 26, borderRadius: 8, opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonBox, { width: 180, height: 14, opacity: pulseAnim }]} />
            <View style={{ width: 26 }} />
          </View>
          {/* Query box */}
          <Animated.View style={[styles.skeletonBox, { height: 50, borderRadius: 14, opacity: pulseAnim }]} />
          {/* Tabs */}
          <View style={{ flexDirection: 'row', gap: 28, marginTop: 18 }}>
            <Animated.View style={[styles.skeletonBox, { width: 64, height: 16, opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonBox, { width: 54, height: 16, opacity: pulseAnim }]} />
          </View>
          {/* Filter chips */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            {[86, 104, 92, 70].map((w, i) => (
              <Animated.View key={i} style={[styles.skeletonBox, { width: w, height: 36, borderRadius: 12, opacity: pulseAnim }]} />
            ))}
          </View>
          {/* Store groups with item cards */}
          {Array.from({ length: 2 }).map((_, g) => (
            <View key={g} style={[styles.skeletonWhiteCard, { marginTop: 18 }]}>
              <Animated.View style={[styles.skeletonBox, { width: '70%', height: 18, opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonBox, { width: '50%', height: 12, opacity: pulseAnim }]} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Animated.View style={[styles.skeletonBox, { flex: 1, height: 130, borderRadius: 16, opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBox, { width: 60, height: 130, borderRadius: 16, opacity: pulseAnim }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (activeTab === 'cart') {
    return (
      <View style={styles.nativeSkeletonContainer}>
        {/* Back + store name header */}
        <View style={styles.skeletonCartHeader}>
          <Animated.View style={[styles.skeletonBox, { width: 26, height: 26, borderRadius: 8, opacity: pulseAnim }]} />
          <View style={{ gap: 6 }}>
            <Animated.View style={[styles.skeletonBox, { width: 190, height: 16, opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonBox, { width: 140, height: 11, opacity: pulseAnim }]} />
          </View>
        </View>
        <View style={styles.skeletonFeedBody}>
          {/* Items card */}
          <View style={styles.skeletonWhiteCard}>
            <Animated.View style={[styles.skeletonBox, { width: 110, height: 14, opacity: pulseAnim }]} />
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Animated.View style={[styles.skeletonBox, { width: 44, height: 44, borderRadius: 10, opacity: pulseAnim }]} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Animated.View style={[styles.skeletonBox, { width: '80%', height: 12, opacity: pulseAnim }]} />
                  <Animated.View style={[styles.skeletonBox, { width: '50%', height: 10, opacity: pulseAnim }]} />
                </View>
                <Animated.View style={[styles.skeletonBox, { width: 72, height: 28, borderRadius: 8, opacity: pulseAnim }]} />
              </View>
            ))}
          </View>
          {/* Bill card */}
          <View style={[styles.skeletonWhiteCard, { marginTop: 12 }]}>
            <Animated.View style={[styles.skeletonBox, { width: 90, height: 14, opacity: pulseAnim }]} />
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={styles.skeletonRowBetween}>
                <Animated.View style={[styles.skeletonBox, { width: 100, height: 11, opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBox, { width: 56, height: 11, opacity: pulseAnim }]} />
              </View>
            ))}
          </View>
        </View>
        {/* Pay button bar */}
        <View style={styles.skeletonCartPayBar}>
          <Animated.View style={[styles.skeletonBox, { width: 180, height: 11, opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonBox, { height: 46, borderRadius: 12, opacity: pulseAnim }]} />
        </View>
      </View>
    );
  }

  // Orders-style card list also fits the wholesale screens (requirements, quotes)
  if (activeTab === 'orders' || activeTab?.startsWith?.('wholesale')) {
    return (
      <View style={styles.nativeSkeletonContainer}>
        <View style={styles.skeletonFeedBody}>
          <Animated.View style={[styles.skeletonBox, { width: 120, height: 24, borderRadius: 12, marginBottom: 14, opacity: pulseAnim }]} />
          {/* Segmented Filter bar placeholder */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <Animated.View style={[styles.skeletonBox, { width: 90, height: 32, borderRadius: 16, opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonBox, { width: 130, height: 32, borderRadius: 16, opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonBox, { width: 90, height: 32, borderRadius: 16, opacity: pulseAnim }]} />
          </View>
          {/* Order Cards */}
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={[styles.skeletonBox, { height: 160, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 12, gap: 10 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Animated.View style={[styles.skeletonBox, { width: 140, height: 16, opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBox, { width: 70, height: 16, borderRadius: 8, opacity: pulseAnim }]} />
              </View>
              <Animated.View style={[styles.skeletonBox, { width: '80%', height: 12, opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonBox, { width: '100%', height: 42, borderRadius: 10, opacity: pulseAnim }]} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (activeTab === 'account' || activeTab === 'profile') {
    return (
      <View style={styles.nativeSkeletonContainer}>
        <View style={styles.skeletonFeedBody}>
          {/* Profile Card */}
          <View style={[styles.skeletonBox, { height: 180, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 14, gap: 12 }]}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Animated.View style={[styles.skeletonBox, { width: 50, height: 50, borderRadius: 16, opacity: pulseAnim }]} />
              <View style={{ gap: 6, flex: 1 }}>
                <Animated.View style={[styles.skeletonBox, { width: 130, height: 18, opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBox, { width: 90, height: 12, opacity: pulseAnim }]} />
              </View>
            </View>
            <Animated.View style={[styles.skeletonBox, { width: '100%', height: 50, borderRadius: 12, opacity: pulseAnim }]} />
          </View>
          {/* Section card */}
          <View style={[styles.skeletonBox, { height: 130, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 14, gap: 10 }]}>
            <Animated.View style={[styles.skeletonBox, { width: 150, height: 16, opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonBox, { width: '100%', height: 50, borderRadius: 10, opacity: pulseAnim }]} />
          </View>
        </View>
      </View>
    );
  }

  // Home Screen: Exact Swiggy & Blinkit Reference Layout
  return (
    <View style={styles.nativeSkeletonContainer}>
      <View style={styles.skeletonFeedBody}>
        {/* SWIGGY SIGNATURE: 3 VERTICAL TALL ROUNDED CARDS */}
        <View style={styles.skeletonSwiggy3CardsRow}>
          <Animated.View style={[styles.skeletonBox, styles.skeletonSwiggyCard, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonBox, styles.skeletonSwiggyCard, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonBox, styles.skeletonSwiggyCard, { opacity: pulseAnim }]} />
        </View>

        {/* SWIGGY SIGNATURE: 2 HORIZONTAL PILL BARS */}
        <Animated.View style={[styles.skeletonBox, styles.skeletonSwiggyPill, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonBox, styles.skeletonSwiggyPill, { opacity: pulseAnim }]} />

        {/* BLINKIT SIGNATURE: 2x2 GRID OF PRODUCT / STORE CARDS */}
        <Animated.View style={[styles.skeletonBox, styles.skeletonHeadingPill, { marginTop: 22, opacity: pulseAnim }]} />
        <View style={styles.skeletonBlinkitGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.skeletonBlinkitCard}>
              <Animated.View style={[styles.skeletonBox, styles.skeletonBlinkitImg, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonBox, styles.skeletonBlinkitLine1, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonBox, styles.skeletonBlinkitLine2, { opacity: pulseAnim }]} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWhiteBg: {
    backgroundColor: '#FFFFFF',
  },
  skeletonRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonProductCard: {
    flex: 1,
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skeletonWhiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 14,
  },
  skeletonCartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  skeletonCartPayBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 10,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  nativeSkeletonContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  skeletonBox: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  skeletonFeedBody: {
    padding: 14,
  },
  skeletonHeadingPill: {
    width: 140,
    height: 18,
    borderRadius: 9,
    marginBottom: 12,
  },
  skeletonSwiggy3CardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  skeletonSwiggyCard: {
    flex: 1,
    height: 220,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  skeletonSwiggyPill: {
    width: '100%',
    height: 38,
    borderRadius: 19,
    marginBottom: 10,
  },
  skeletonBlinkitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  skeletonBlinkitCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 8,
  },
  skeletonBlinkitImg: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  skeletonBlinkitLine1: {
    width: '75%',
    height: 12,
    borderRadius: 6,
  },
  skeletonBlinkitLine2: {
    width: '50%',
    height: 10,
    borderRadius: 5,
  },
  skeletonCatGrid4Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  skeletonCatCardItem: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    alignItems: 'center',
    gap: 6,
  },
  skeletonCatCutout: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  skeletonCatLine1: {
    width: '80%',
    height: 8,
    borderRadius: 4,
  },
  skeletonCatLine2: {
    width: '55%',
    height: 7,
    borderRadius: 3.5,
  },
  skeletonStoresTray: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonStoreCard: {
    width: 180,
    height: 180,
    borderRadius: 16,
  },
});
