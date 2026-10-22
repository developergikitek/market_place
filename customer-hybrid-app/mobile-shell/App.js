import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
  PanResponder,
  BackHandler,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { useFonts } from 'expo-font';
import { Feather } from '@expo/vector-icons';

// Modular Services & Bridge Handlers
import { DEFAULT_CONFIG, fetchRemoteConfig } from './src/config/appConfig';
import { handleWebViewMessage, sendToWebView } from './src/bridge/nativeBridgeHandler';
import { checkForOtaUpdates } from './src/updates/otaManager';
import { getInjectedJavaScriptBeforeContentLoaded } from './src/bridge/injectedScripts';

// Modular Presentation Components
import { NativeHeader, isSectionHome } from './src/components/NativeHeader';
import { themeFor } from './src/theme/sectionThemes';
import { LocationSplash, SPLASH_COLORS } from './src/components/LocationSplash';
import * as SplashScreen from 'expo-splash-screen';
import { canUseLocationWithoutPrompting, fetchDeliveryLocation } from './src/location/currentLocation';
import { NativeTabBar } from './src/components/NativeTabBar';
import { NativeWholesaleTabBar } from './src/components/NativeWholesaleTabBar';
import { NativeSkeletonScreen } from './src/components/NativeSkeletonScreen';
import { NativeCartBar } from './src/components/NativeCartBar';
import { NativeProfileScreen } from './src/components/NativeProfileScreen';
import {
  startProfileSync,
  subscribeToProfile,
  getProfileSnapshot,
  editProfile,
  refreshProfileIfStale,
} from './src/profile/profileStore';

// Keep the system launch screen up until LocationSplash (same colour + logo) has rendered
SplashScreen.preventAutoHideAsync().catch(() => {});

// Bottom tab -> web screen name (matches PAGE_VIEWED / NAVIGATION_START payloads)
const TAB_PAGES = {
  home: 'home',
  stores: 'home',
  categories: 'categories',
  cart: 'cart',
  orders: 'orders',
  account: 'profile',
  profile: 'profile',
};
// Header service cards → web section. `page` is the PAGE_VIEWED name and the header layout key.
const SERVICE_SECTIONS = {
  retail: { path: '/', page: 'home' },
  wholesale: { path: '/wholesale', page: 'wholesale' },
  bazaar: { path: '/bazaar', page: 'bazaar' },
  construction: { path: '/construction', page: 'construction' },
};
// Sections with their own top-level route; anything else that isn't shared belongs to Quick (retail)
const SECTION_ROUTES = ['bazaar', 'construction'];
const SKELETON_MIN_MS = 250;
// Screens used by both Retail and Wholesale: visiting them doesn't switch mode
const SHARED_PATHS = ['/orders', '/profile'];
const SHARED_PAGES = ['orders', 'profile'];
// Screens that show the floating "View Cart" bar
const CART_BAR_SCREENS = ['home', 'stores', 'categories', 'store', 'search'];
// Screens that draw their own header, so the native one is not mounted
const HEADERLESS_LAYOUTS = ['store', 'cart', 'orders', 'profile', 'search', 'wholesale-flow'];
// First-frame guesses until the header reports its measured size
const BASE_HEADER_HEIGHT_ESTIMATE = 62; // search row + padding
const UPPER_HEADER_HEIGHT_ESTIMATE = 165;
const SKELETON_MAX_MS = 6000;
// The skeleton overlay hides the old screen at once, but only draws its shimmer after this long:
// a switch that's ready sooner shows no shimmer at all, just the new screen (Swiggy-style)
const SHIMMER_DELAY_MS = 180;

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Load Plus Jakarta Sans (Matches web-frontend project typography 1:1)
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Medium': require('@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf'),
  });

  // Persistent Native State synced with WebView via Bridge
  const [activeTab, setActiveTab] = useState('home');
  const [currentLayoutTab, setCurrentLayoutTab] = useState('home');
  const [activeService, setActiveService] = useState('retail'); // 'retail' | 'wholesale'
  const [searchQuery, setSearchQuery] = useState('');
  const [fastOnly, setFastOnly] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartAmount, setCartAmount] = useState(0);
  const [cartStoreName, setCartStoreName] = useState('');
  // Web search sheet is open: native header, tab bar and cart bar step aside
  const [searchOpen, setSearchOpen] = useState(false);
  // A web popup (e.g. "Replace cart?") is open: hide native bars drawn above the WebView
  const [webOverlayOpen, setWebOverlayOpen] = useState(false);

  // Collapsible Sticky Header Animation State (Blinkit / Swiggy signature)
  // useState keeps one Animated.Value for the component's lifetime without reading a ref in render
  const [headerCollapseAnim] = useState(() => new Animated.Value(0)); // 0 = fully expanded, 1 = collapsed (only search bar rests)
  const isHeaderCollapsedRef = useRef(false);
  const [baseHeaderHeight, setBaseHeaderHeight] = useState(BASE_HEADER_HEIGHT_ESTIMATE);
  const [upperHeaderHeight, setUpperHeaderHeight] = useState(UPPER_HEADER_HEIGHT_ESTIMATE);

  const animateHeader = (collapsed) => {
    if (isHeaderCollapsedRef.current === collapsed) return;
    isHeaderCollapsedRef.current = collapsed;
    // Native driver: only transform/opacity animate, so scrolling never re-lays out the WebView
    Animated.timing(headerCollapseAnim, {
      toValue: collapsed ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
    // Keep the page's copy of the state in sync (it only sends "expand" when it thinks the
    // header is collapsed), including when the header was swiped or reset from native.
    webViewRef.current?.injectJavaScript(
      `window.__shellSyncCollapsed && window.__shellSyncCollapsed(${collapsed}); true;`
    );
  };

  // Pan Responder on Native Header to slide up (collapse) or slide down (expand)
  const [panResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        // Only swipe-down expands. Collapsing is driven by page scroll alone: swiping the header
        // up while the page is at the top would just uncover the empty top spacer.
        if (gestureState.dy > 12) {
          animateHeader(false);
        }
      },
    })
  );

  const webViewRef = useRef(null);

  // Route-transition skeleton: shown the moment a navigation starts, from anywhere (native tab,
  // section card, store open, or any web router call via NAVIGATION_START), and hidden only when
  // the target screen reports PAGE_VIEWED (or after a safety timeout). The old screen must never
  // be visible after a tap, not even for a frame.
  const [skeletonPage, setSkeletonPage] = useState('home');
  const pendingPageRef = useRef(null);
  const skeletonShownAtRef = useRef(0);
  const skeletonMinRef = useRef(SKELETON_MIN_MS);
  const skeletonTimersRef = useRef({ hide: null, safety: null });
  const visitedPagesRef = useRef(new Set());

  const showSkeleton = (page) => {
    const timers = skeletonTimersRef.current;
    clearTimeout(timers.hide);
    clearTimeout(timers.safety);
    pendingPageRef.current = page || null;

    // Already-opened screens stay alive in the WebView (Next.js keeps recent routes mounted and
    // hidden), so they usually come back within a few frames: no minimum shimmer time for them,
    // it lifts the moment the screen reports ready. First opens keep a short minimum so the
    // shimmer doesn't flash.
    skeletonMinRef.current = page && visitedPagesRef.current.has(page) ? 0 : SKELETON_MIN_MS;
    if (page) setSkeletonPage(page);
    skeletonShownAtRef.current = Date.now();
    setLoading(true);
    timers.safety = setTimeout(() => {
      pendingPageRef.current = null;
      setLoading(false);
    }, SKELETON_MAX_MS);
  };

  const markPageReady = (page) => {
    const pending = pendingPageRef.current;
    // Ignore late messages from the screen we are leaving
    if (pending && page && pending !== page) return;
    if (page) visitedPagesRef.current.add(page);
    pendingPageRef.current = null;
    const timers = skeletonTimersRef.current;
    clearTimeout(timers.safety);
    clearTimeout(timers.hide);
    // Ready before the shimmer was drawn: lift at once, nothing flashes. Once it's drawn, first
    // opens keep it up briefly so it doesn't flicker; revisits lift it at once.
    const elapsed = Date.now() - skeletonShownAtRef.current;
    const remaining = elapsed < SHIMMER_DELAY_MS ? 0 : SHIMMER_DELAY_MS + skeletonMinRef.current - elapsed;
    if (remaining > 0) timers.hide = setTimeout(() => setLoading(false), remaining);
    else setLoading(false);
  };

  // Launch: find the delivery location (Swiggy-style splash) while the WebView loads underneath.
  // Only when location is already allowed — launch never puts a permission dialog in the way.
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  // null while we check: the system launch screen still covers the app, so the user never sees
  // "Locating you..." flash on a device where we cannot actually locate them
  const [splashVisible, setSplashVisible] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await canUseLocationWithoutPrompting())) {
        if (!cancelled) setSplashVisible(false);
        return;
      }
      if (cancelled) return;
      setSplashVisible(true);
      const found = await fetchDeliveryLocation();
      if (!cancelled) setDeliveryLocation(found);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Skipping the splash means LocationSplash never mounts, and it is what normally hides the
  // system launch screen — so hide it here instead, once fonts are ready to avoid a bare frame
  useEffect(() => {
    if (splashVisible === false && fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [splashVisible, fontsLoaded]);

  // Profile is native-owned: load the stored copy, keep it in sync, and mirror every change into
  // the WebView so web screens (checkout, order details) use the same copy
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSheet, setProfileSheet] = useState(null); // null | 'EDIT' | 'ADDRESSES' | 'WALLET' | 'MEMBERSHIP' | 'HELP'
  const sendProfileToWeb = () => {
    const { profile, version, pendingFields } = getProfileSnapshot();
    if (profile) sendToWebView(webViewRef, 'PROFILE_UPDATED', { profile, version, pendingFields });
  };
  useEffect(() => {
    const stopSync = startProfileSync();
    const unsubscribe = subscribeToProfile(sendProfileToWeb);
    return () => {
      stopSync();
      unsubscribe();
    };
  }, []);

  // Initialize Remote Config and check OTA updates on start
  useEffect(() => {
    async function init() {
      const activeConfig = await fetchRemoteConfig();
      setConfig(activeConfig);
      await checkForOtaUpdates(true);
    }
    init();
  }, []);

  // Pre-inject Native Shell capabilities & suppress duplicate web header
  const injectedJavaScriptBeforeContentLoaded = getInjectedJavaScriptBeforeContentLoaded(
    Platform.OS,
    config.version
  );

  // Native Tab Switcher with Haptic Feedback & Instant SPA View Switch
  // Wholesale bar: Home -> /wholesale, Orders -> My Orders on its Wholesale tab, Profile shared
  // Profile is a native screen drawn over the WebView: no web navigation, so it opens instantly
  // and works offline. It is a flag, not a layout: the WebView underneath keeps its exact size and
  // top spacer, so closing it never re-lays out the page (that left a ghost copy on Android).
  const openProfile = () => {
    setActiveTab('account');
    setProfileOpen(true);
    refreshProfileIfStale();
  };

  // Leaving Profile. True when the target tab is the screen already under it: just uncover it.
  const closeProfileTo = (tabId, layout) => {
    if (!profileOpen) return false;
    setProfileOpen(false);
    setProfileSheet(null);
    if (currentLayoutTab !== layout) return false;
    setActiveTab(tabId);
    return true;
  };

  const handleWholesaleTabPress = (tabId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (tabId === 'account' || tabId === 'profile') {
      openProfile();
      return;
    }
    const layout = tabId === 'home' ? 'wholesale' : tabId;
    if (closeProfileTo(tabId, layout)) return;
    if (currentLayoutTab === layout) return;
    const url = {
      home: '/wholesale?native=1',
      orders: '/orders?type=wholesale&native=1',
    }[tabId];
    setActiveTab(tabId);
    setCurrentLayoutTab(layout);
    showSkeleton(tabId === 'home' ? 'wholesale' : TAB_PAGES[tabId]);
    webViewRef.current?.injectJavaScript(`
      if (window.nextRouter) { window.nextRouter.push('${url}'); } else { window.location.href = '${url}'; }
      true;
    `);
  };

  const handleTabPress = (tabId) => {
    if (activeService === 'wholesale') {
      handleWholesaleTabPress(tabId);
      return;
    }
    // Fire haptic without await — never block navigation on it
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (tabId === 'account' || tabId === 'profile') {
      openProfile();
      return;
    }
    if (closeProfileTo(tabId, tabId === 'stores' ? 'home' : tabId)) return;

    // Also allow re-tapping Home to escape from a store detail page
    if (tabId === activeTab && currentLayoutTab === activeTab) return;

    setActiveTab(tabId);
    setCurrentLayoutTab(tabId);
    showSkeleton(TAB_PAGES[tabId] || 'home');

    // Switch the web view at once: the skeleton is drawn by this same state update and the page
    // hides itself as the route changes (nativeBridge.js), so nothing old can show. (A one-frame
    // delay used to sit here; on a busy JS thread it cost far more than a frame.)
    if (tabId === 'categories') {
      webViewRef.current?.injectJavaScript(`
        if (window.nativeSwitchView) {
          window.nativeSwitchView('categories');
        } else if (window.nextRouter) {
          window.nextRouter.push('/categories?native=1', { scroll: false });
        } else {
          window.location.href = '/categories?native=1';
        }
        true;
      `);
    } else if (tabId === 'home' || tabId === 'stores') {
      webViewRef.current?.injectJavaScript(`
        if (window.nativeSwitchView) {
          window.nativeSwitchView('home');
        } else if (window.nextRouter) {
          window.nextRouter.push('/?native=1', { scroll: false });
        } else if (window.location.pathname !== '/') {
          window.location.href = '/?native=1';
        }
        true;
      `);
    } else if (tabId === 'cart') {
      webViewRef.current?.injectJavaScript(`
        if (window.nextRouter) {
          window.nextRouter.push('/cart?native=1');
        } else {
          window.location.href = '/cart?native=1';
        }
        true;
      `);
    } else if (tabId === 'orders') {
      webViewRef.current?.injectJavaScript(`
        if (window.nextRouter) {
          window.nextRouter.push('/orders?native=1');
        } else {
          window.location.href = '/orders?native=1';
        }
        true;
      `);
    }

    sendToWebView(webViewRef, 'NAVIGATE_TAB', { tabId });

  };

  const openSearch = (query = '') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Wholesale has no search sheet: search opens the bulk catalog (Create requirement)
    // with its search box focused, so found items go straight into the requirement.
    if (currentLayoutTab === 'wholesale') {
      setCurrentLayoutTab('wholesale-flow');
      showSkeleton('wholesale-new');
      webViewRef.current?.requestFocus?.();
      webViewRef.current?.injectJavaScript(`
        if (window.nextRouter) { window.nextRouter.push('/wholesale/new?search=1&native=1'); }
        else { window.location.href = '/wholesale/new?search=1&native=1'; }
        true;
      `);
      return;
    }
    setSearchOpen(true);
    // Android only shows the keyboard for a WebView input once the WebView has focus
    webViewRef.current?.requestFocus?.();
    sendToWebView(webViewRef, 'OPEN_SEARCH', { query });
  };

  // Android back on the native Profile screen returns Home (open sheets close themselves first)
  const isProfileScreen = profileOpen;
  useEffect(() => {
    if (!isProfileScreen) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleTabPress('home');
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfileScreen, activeService]);

  // Android back closes the search sheet first
  useEffect(() => {
    if (!searchOpen) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      sendToWebView(webViewRef, 'CLOSE_SEARCH', {});
      return true;
    });
    return () => sub.remove();
  }, [searchOpen]);

  // Native Search Query Dispatch
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    sendToWebView(webViewRef, 'SEARCH_QUERY', { query: text });
  };

  // Native service cards dispatch: each section is its own web route (see SERVICE_SECTIONS)
  const handleServiceChange = (service) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const section = SERVICE_SECTIONS[service];
    if (!section) return;
    if (service === activeService && currentLayoutTab === section.page) return;
    setActiveService(service);
    setActiveTab('home');
    setCurrentLayoutTab(section.page);
    showSkeleton(section.page);
    const url = `${section.path}?native=1`;
    webViewRef.current?.injectJavaScript(`
      if (window.nextRouter) { window.nextRouter.push('${url}'); } else { window.location.href = '${url}'; }
      true;
    `);
  };

  // Native Same-Day Express Toggle Dispatch
  const handleToggleFast = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { }
    const next = !fastOnly;
    setFastOnly(next);
    sendToWebView(webViewRef, 'TOGGLE_FAST', { fastOnly: next });
  };

  // Native Voice Search Dispatch
  const handleVoiceSearch = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }
    sendToWebView(webViewRef, 'TRIGGER_VOICE_SEARCH', {});
  };

  // Native Config Drawer Open Dispatch
  const isHomeTab = currentLayoutTab === 'home' || currentLayoutTab === 'stores';
  // Quick = green, Bulk = steel; matches the web section theme under the header
  const theme = themeFor(activeService);

  // Header overlay geometry. The header floats over the WebView; the WebView starts below the
  // search row, and on section homes the page gets a top spacer as tall as the upper section.
  const headerMounted = !searchOpen && !HEADERLESS_LAYOUTS.includes(currentLayoutTab);
  const upperVisible = headerMounted && isSectionHome(currentLayoutTab);
  const topInset = upperVisible ? upperHeaderHeight : 0;
  const contentTop = headerMounted ? baseHeaderHeight : 0;
  const headerTranslateY = headerCollapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -topInset],
  });

  // Tell the page how tall its top spacer must be (the part of the header floating over it).
  // Changes only when the screen type changes, never during scroll.
  const topInsetRef = useRef(topInset);
  const applyTopInset = (px) => {
    webViewRef.current?.injectJavaScript(
      `window.__shellSetTopInset && window.__shellSetTopInset(${Math.round(px)}); true;`
    );
  };
  useEffect(() => {
    topInsetRef.current = topInset;
    applyTopInset(topInset);
    // A new screen starts at the top, so show the full header again
    animateHeader(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topInset]);

  if (!fontsLoaded) {
    // Same colour the launch splash fades in from, so there is no flash before fonts are ready
    return (
      <View style={[styles.safeContainer, { backgroundColor: SPLASH_COLORS.to }]}>
        <StatusBar barStyle="light-content" backgroundColor={SPLASH_COLORS.from} />
      </View>
    );
  }

  // Header shows the found location; remote config stays the fallback
  const headerConfig =
    deliveryLocation?.status === 'found'
      ? {
          ...config,
          header: { ...config.header, locationTitle: deliveryLocation.title, address: deliveryLocation.address },
        }
      : config;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.safeContainer, { backgroundColor: theme.gradient[0] }]}
        edges={['top']}
      >
        {/* Status Bar — always dark since NativeHeader (navy) is always mounted */}
        <StatusBar
          barStyle={splashVisible ? 'light-content' : 'dark-content'}
          backgroundColor={splashVisible ? SPLASH_COLORS.from : theme.gradient[0]}
        />

        {/* MIDDLE VIEWPORT (WEBVIEW + ZERO-BUFFERING SKELETON SHIMMER), with the native header
            floating over its top (rendered last below so it draws on top). */}
        <View style={styles.contentArea}>
        <View
          style={[
            styles.webviewContainer,
            { marginTop: contentTop },
            !isHomeTab && { backgroundColor: '#F8FAFC' },
            // Under the skeleton the WebView gets a barely-lower opacity. Not to hide it (the
            // opaque skeleton covers it and the page hides itself on navigation), but because
            // Android only recomposites a WebView cleanly when its opacity changes: revealed
            // without one, it showed a stale faded copy of the previous screen. It must stay
            // high: near zero, Android throttled the WebView to ~3 fps (+0.5 s per switch).
            loading && !loadError && styles.webviewUnderSkeleton,
            // Also hidden under native Profile: an Android WebView fully covered by an opaque view
            // came back with stale tiles (a faded copy of the page); un-hiding recomposites it
            profileOpen && styles.webviewHidden,
          ]}
        >
          {loadError ? (
            <View style={[styles.errorContainer, { paddingTop: topInset }]}>
              <View style={[styles.errorIconCircle, { backgroundColor: theme.gradient[1] }]}>
                <Feather name="wifi-off" size={36} color={theme.accent} />
              </View>
              <Text style={styles.errorTitle}>Your internet seems a bit wonky</Text>
              <Text style={styles.errorMessage}>
                We couldn&apos;t load this page. Check your Wi-Fi or mobile data and try again.
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.accent }]}
                activeOpacity={0.85}
                onPress={() => {
                  setLoadError(null);
                  webViewRef.current?.reload();
                }}
              >
                <Feather name="refresh-cw" size={16} color={theme.accentInk} />
                <Text style={[styles.retryButtonText, { color: theme.accentInk }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              ref={webViewRef}
              source={{
                uri: config.webviewUrl?.includes('?')
                  ? `${config.webviewUrl}&native=1`
                  : `${config.webviewUrl}?native=1`,
              }}
              style={[styles.webview, !isHomeTab && { backgroundColor: '#F8FAFC' }]}
              injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
              onNavigationStateChange={(navState) => {
                // Header Retail/Wholesale tile follows the section on screen
                // Orders & Profile are shared: they keep whichever mode (and tab bar) you came from
                const sectionRoute = SECTION_ROUTES.find((s) => navState.url?.includes(`/${s}`));
                if (navState.url?.includes('/wholesale')) setActiveService('wholesale');
                else if (sectionRoute) setActiveService(sectionRoute);
                else if (!SHARED_PATHS.some((p) => navState.url?.includes(p))) setActiveService('retail');
                if (sectionRoute) {
                  setActiveTab('home');
                  setCurrentLayoutTab(sectionRoute);
                } else if (navState.url?.includes('/wholesale/')) {
                  // Wholesale sub-screens (create requirement, quotes) are full-screen
                  setActiveTab('home');
                  setCurrentLayoutTab('wholesale-flow');
                } else if (navState.url?.includes('/wholesale')) {
                  setActiveTab('home');
                  setCurrentLayoutTab('wholesale');
                } else if (navState.url?.includes('/search')) {
                  // Full-screen search results: own header, no tab bar (like a store page)
                  setActiveTab('home');
                  setCurrentLayoutTab('search');
                } else if (navState.url?.includes('/store')) {
                  // Home tab stays highlighted (Swiggy pattern).
                  // currentLayoutTab='store' collapses NativeHeader upper section immediately
                  // without waiting for PAGE_VIEWED — no flicker.
                  setActiveTab('home');
                  setCurrentLayoutTab('store');
                } else if (navState.url?.includes('/cart')) {
                  setActiveTab('cart');
                  setCurrentLayoutTab('cart');
                } else if (navState.url?.includes('/orders')) {
                  setActiveTab('orders');
                  setCurrentLayoutTab('orders');
                } else if (navState.url?.includes('/profile')) {
                  // A web link to the old profile route: show the native screen over it
                  setActiveTab('account');
                  setCurrentLayoutTab('profile');
                  setProfileOpen(true);
                } else if (navState.url?.includes('/categories')) {
                  setActiveTab('categories');
                  setCurrentLayoutTab('categories');
                } else if (navState.url?.endsWith('/') || navState.url?.includes('/?')) {
                  setActiveTab('home');
                  setCurrentLayoutTab('home');
                }
              }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.action === 'OPEN_SEARCH_REQUEST') {
                    openSearch(data.payload?.query || '');
                  } else if (data.action === 'OVERLAY_OPEN' || data.action === 'OVERLAY_CLOSED') {
                    setWebOverlayOpen(data.action === 'OVERLAY_OPEN');
                  } else if (data.action === 'SEARCH_CLOSED') {
                    setSearchOpen(false);
                  } else if (data.action === 'NAVIGATION_START') {
                    setWebOverlayOpen(false);
                    // Native tab presses already armed the skeleton for this page before pushing
                    // the route; re-arming would restart the grace/min timers for nothing
                    if (!data.payload?.page || data.payload.page !== pendingPageRef.current) {
                      showSkeleton(data.payload?.page);
                    }
                  } else if (data.action === 'WEB_READY') {
                    setHasLoadedOnce(true);
                    markPageReady(data.payload?.page || 'home');
                  } else if (data.action === 'TAB_CHANGED') {
                    if (data.payload?.tab) {
                      setActiveTab(data.payload.tab);
                      setCurrentLayoutTab(data.payload.tab);
                    }
                  } else if (data.action === 'PAGE_VIEWED') {
                    markPageReady(data.payload?.page);
                    const viewedSection = SECTION_ROUTES.includes(data.payload?.page) ? data.payload.page : null;
                    if (data.payload?.page?.startsWith('wholesale')) setActiveService('wholesale');
                    else if (viewedSection) setActiveService(viewedSection);
                    else if (!SHARED_PAGES.includes(data.payload?.page)) setActiveService('retail');
                    if (viewedSection) {
                      setActiveTab('home');
                      setCurrentLayoutTab(viewedSection);
                    } else if (data.payload?.page?.startsWith('wholesale-')) {
                      setActiveTab('home');
                      setCurrentLayoutTab('wholesale-flow');
                    } else if (data.payload?.page === 'wholesale') {
                      setActiveTab('home');
                      setCurrentLayoutTab('wholesale');
                    } else if (data.payload?.page === 'search') {
                      setActiveTab('home');
                      setCurrentLayoutTab('search');
                    } else if (data.payload?.page === 'store') {
                      setActiveTab('home');      // Home tab stays lit (Swiggy pattern)
                      setCurrentLayoutTab('store'); // Header collapses upper section
                    } else if (data.payload?.page === 'cart') {
                      setActiveTab('cart');
                      setCurrentLayoutTab('cart');
                    } else if (data.payload?.page === 'orders') {
                      setActiveTab('orders');
                      setCurrentLayoutTab('orders');
                    } else if (data.payload?.page === 'profile') {
                      setActiveTab('account');
                      setCurrentLayoutTab('profile');
                      setProfileOpen(true);
                    } else if (data.payload?.page === 'categories') {
                      setActiveTab('categories');
                      setCurrentLayoutTab('categories');
                    } else if (data.payload?.page === 'home' || data.payload?.page === 'stores') {
                      setActiveTab('home');
                      setCurrentLayoutTab('home');
                    }
                  } else if (data.action === 'STORE_SELECTED' || data.action === 'OPEN_STORE') {
                    setActiveTab('home');
                    setCurrentLayoutTab('store');
                    showSkeleton('store');
                    if (data.payload?.url) {
                      // Ensure WebView transitions immediately even if router push was throttled
                      const navScript = `
                        if (window.nextRouter) {
                          window.nextRouter.push("${data.payload.url}");
                        } else {
                          window.location.href = "${data.payload.url}";
                        }
                        true;
                      `;
                      webViewRef.current?.injectJavaScript(navScript);
                    }
                  } else if (data.action === 'CART_UPDATED') {
                    if (typeof data.payload?.count === 'number') {
                      setCartCount(data.payload.count);
                      setCartAmount(data.payload.amount || 0);
                      setCartStoreName(data.payload.storeName || '');
                    }
                  } else if (data.action === 'SET_HEADER_COLLAPSED') {
                    animateHeader(data.payload.collapsed);
                    return;
                  } else if (data.action === 'PROFILE_REQUEST') {
                    sendProfileToWeb();
                    return;
                  } else if (data.action === 'PROFILE_EDIT') {
                    // Web screens never save their own copy: native applies, stores and syncs it
                    editProfile(data.payload?.changes);
                    return;
                  }
                } catch { }
                handleWebViewMessage(event.nativeEvent.data, webViewRef);
              }}
              applicationNameForUserAgent="CustomerSuperAppMobileShell/1.0"
              originWhitelist={['*']}
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={(request) => {
                // Allow all internal web navigation, API calls, and local routes
                return true;
              }}
              onLoadStart={() => {
                // Only the first document load needs the generic skeleton. Android also fires this
                // for in-app route changes, which showed a stale skeleton on every tab switch.
                if (!hasLoadedOnce) showSkeleton(null);
              }}
              onLoadEnd={() => {
                // SSR HTML is on screen now; the page's PAGE_VIEWED after hydration also clears it
                if (!pendingPageRef.current) markPageReady(null);
                setHasLoadedOnce(true);
                sendToWebView(webViewRef, 'NATIVE_SHELL_INIT', { version: config.version });
                sendProfileToWeb();
                applyTopInset(topInsetRef.current);
              }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                // log, not warn: the friendly error screen already covers this, no LogBox toast
                console.log('WebView error: ', nativeEvent);
                setLoadError(nativeEvent.description || 'Connection failed');
                setLoading(false);
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mixedContentMode="always"
              pullToRefreshEnabled={true}
            />
          )}
        </View>

        {/* Native Skeleton Shimmer Placeholder (Swiggy / Blinkit style): covers only the content
            area so the native header and tab bar stay interactive during the switch. */}
        {loading && !loadError && (
          <View
            style={[styles.skeletonOverlay, { top: contentTop, paddingTop: topInset }]}
            pointerEvents="none"
          >
            <NativeSkeletonScreen activeTab={skeletonPage} delayMs={SHIMMER_DELAY_MS} />
          </View>
        )}

        {/* Native Profile screen over the WebView (also over its offline error screen) */}
        {isProfileScreen && (
          <View style={styles.profileOverlay}>
            <NativeProfileScreen
              theme={theme}
              appVersion={config.version}
              sheet={profileSheet}
              onSheetChange={setProfileSheet}
              onOpenOrders={() => handleTabPress('orders')}
            />
          </View>
        )}

        {/* PERSISTENT NATIVE TOP HEADER (SWIGGY / BLINKIT STYLE): store, cart, orders, profile,
            search and wholesale flows render their own headers. Slides up on scroll instead of
            shrinking, so the WebView below never resizes. */}
        {headerMounted && !profileOpen && (
          <Animated.View
            style={[styles.headerOverlay, { transform: [{ translateY: headerTranslateY }] }]}
          >
            <NativeHeader
              config={headerConfig}
              activeTab={activeTab}
              layoutTab={currentLayoutTab}
              activeService={activeService}
              searchQuery={searchQuery}
              fastOnly={fastOnly}
              headerCollapseAnim={headerCollapseAnim}
              panHandlers={panResponder.panHandlers}
              onOpenWallet={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setProfileSheet('WALLET');
                openProfile();
              }}
              onServiceChange={handleServiceChange}
              onSearchChange={handleSearchChange}
              onOpenSearch={() => openSearch()}
              onVoiceSearch={handleVoiceSearch}
              onToggleFast={handleToggleFast}
              onUpperLayout={setUpperHeaderHeight}
              onBaseLayout={setBaseHeaderHeight}
              theme={theme}
            />
          </Animated.View>
        )}

        {/* Floating cart bar: native so it stays pinned while the WebView resizes on fast scrolls */}
        {!searchOpen && !webOverlayOpen && !profileOpen && CART_BAR_SCREENS.includes(currentLayoutTab) && (
          <NativeCartBar
            count={cartCount}
            amount={cartAmount}
            storeName={cartStoreName}
            onPress={() => handleTabPress('cart')}
          />
        )}
        </View>

        {/* 3. PERSISTENT NATIVE BOTTOM NAVIGATION BAR (FIXED PINNED SHELL)
            Hidden on the store page: it's a full-screen detail view with its own back button
            and floating cart bar (Swiggy restaurant-page pattern). */}
        {/* White bottom inset under the tab bar (the top inset takes the header gradient colour) */}
        <SafeAreaView edges={['bottom']} style={styles.bottomInset}>
        {!searchOpen && !webOverlayOpen && !['store', 'search', 'wholesale-flow'].includes(currentLayoutTab) && (
          activeService === 'wholesale' ? (
            <NativeWholesaleTabBar activeTab={activeTab} onTabPress={handleTabPress} activeColor={theme.tabActive} />
          ) : (
            <NativeTabBar
              activeTab={activeTab}
              cartCount={cartCount}
              onTabPress={handleTabPress}
              activeColor={theme.tabActive}
            />
          )
        )}
        </SafeAreaView>

      </SafeAreaView>

      {/* Launch splash over everything (status bar area included) until the location is shown */}
      {splashVisible && (
        <LocationSplash location={deliveryLocation} onDone={() => setSplashVisible(false)} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#02132B',
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  bottomInset: {
    backgroundColor: '#FFFFFF',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 120,
    elevation: 6,
  },
  skeletonOverlay: {
    // StyleSheet.absoluteFillObject no longer exists in RN 0.86; spreading it silently did nothing
    // and laid the skeleton out below the WebView instead of on top of it.
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    zIndex: 99,
  },
  profileOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 110,
  },
  webviewUnderSkeleton: {
    opacity: 0.99,
  },
  webviewHidden: {
    // Not 0: Android skips drawing fully transparent views, which caused a blank frame on reveal
    opacity: 0.01,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  errorIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    color: '#0F1B2D',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#5B6B80',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 19,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  retryButtonText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 14,
  },
});
