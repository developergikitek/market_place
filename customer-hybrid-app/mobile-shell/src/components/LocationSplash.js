import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';

export const SPLASH_COLORS = { from: '#2F7FD8', to: '#0E2238' }; // launch gradient: Bulk section accent down to its ink (theme/sectionThemes.js)
// Must match the expo-splash-screen plugin in app.json (backgroundColor, imageWidth) so the
// hand-off from the system launch screen is seamless: same colour, logo in the same place.
const NATIVE_SPLASH_COLOR = '#0E2238';
const LOGO_SIZE = 220;
const MIN_VISIBLE_MS = 1500; // long enough to read, short enough not to feel slow
const HOLD_FOUND_MS = 900; // let the found address register before revealing the app
const HOLD_FALLBACK_MS = 300;

/**
 * Swiggy/Zomato-style launch: brand gradient, Makaano mark, and a location badge that pulses
 * while locating, then shows the area and address before the app is revealed.
 * `location` is null while locating, then { status, title?, address? }.
 */
export function LocationSplash({ location, onDone }) {
  const [enter] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [found] = useState(() => new Animated.Value(0));
  const [exit] = useState(() => new Animated.Value(0));
  const [mountedAt] = useState(() => Date.now());

  // Logo and badge rise in, then the badge pulses until a location arrives
  useEffect(() => {
    // This screen now covers the system launch screen exactly, so it can go
    SplashScreen.hideAsync().catch(() => {});
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [enter, pulse]);

  // Location resolved: show it, hold briefly, then fade the splash away
  useEffect(() => {
    if (!location) return undefined;
    Animated.spring(found, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start();
    const hold = location.status === 'found' ? HOLD_FOUND_MS : HOLD_FALLBACK_MS;
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - mountedAt)) + hold;
    const timer = setTimeout(() => {
      Animated.timing(exit, {
        toValue: 1,
        duration: 380,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => onDone?.());
    }, wait);
    return () => clearTimeout(timer);
  }, [location, found, exit, mountedAt, onDone]);

  const located = location?.status === 'found';
  const title = !location ? 'Locating you…' : located ? location.title : 'Set your delivery location';
  const address = located ? location.address : location ? 'Showing stores around you' : '';

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
        },
      ]}
      pointerEvents="none"
    >
      {/* Gradient fades in over the launch screen's flat violet */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: enter }]}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="splashGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={SPLASH_COLORS.from} />
            <Stop offset="1" stopColor={SPLASH_COLORS.to} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#splashGradient)" />
      </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.locationBlock,
          {
            opacity: enter,
            transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          },
        ]}
      >
        <View style={styles.badgeWrap}>
          {/* Expanding ring while locating */}
          {!location && (
            <Animated.View
              style={[
                styles.badgeRing,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                },
              ]}
            />
          )}
          <Animated.View
            style={[
              styles.badge,
              { transform: [{ scale: found.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.18, 1] }) }] },
            ]}
          >
            <Feather name={located ? 'map-pin' : 'navigation'} size={24} color="#FFFFFF" />
          </Animated.View>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Animated.Text
          style={[
            styles.address,
            {
              opacity: found,
              transform: [{ translateY: found.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            },
          ]}
          numberOfLines={2}
        >
          {address}
        </Animated.Text>
      </Animated.View>

      {/* Same image, size and centre as the system launch screen, so the logo never moves */}
      <View style={styles.logoWrap}>
        <Image source={require('../../assets/splash-icon.png')} style={styles.logo} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 50,
    alignItems: 'center',
    backgroundColor: NATIVE_SPLASH_COLOR,
  },
  locationBlock: {
    position: 'absolute',
    top: '20%',
    alignItems: 'center',
    paddingHorizontal: 28,
    width: '100%',
  },
  badgeWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badgeRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 24,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  address: {
    marginTop: 6,
    color: 'rgba(255, 255, 255, 0.82)',
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  logoWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
