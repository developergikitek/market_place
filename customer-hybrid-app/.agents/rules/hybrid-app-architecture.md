# Customer Hybrid App Architecture & Development Standards

Whenever working on this project, ALWAYS adhere to the following architecture:

## 1. Core Architecture Stack
- **Mobile Native Shell**: **React Native with Expo** (`mobile-shell`)
- **Customer Webview / Micro-frontend**: **Next.js / React** (`web-frontend`)
- **Webview Container**: `react-native-webview`
- **Over-The-Air (OTA) Updates**: **Expo Updates (`expo-updates` / EAS Update)** for instant JavaScript runtime updates without App Store / Play Store releases.
- **Dynamic Feature Control**: **Remote Config / Server-Driven UI (SDUI)** to toggle buttons, banners, routes, and features remotely.

## 2. Communication Bridge (JS Bridge Standard)
- Standardized bidirectional message protocol between Native Shell and WebView:
  - **WebView -> Native**: `window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ACTION_NAME', payload: { ... } }))`
  - **Native -> WebView**: `webViewRef.current.postMessage(JSON.stringify({ type: 'EVENT_NAME', payload: { ... } }))`
  - Native handles: Hardware features (Haptics, Biometrics, Native Share, Camera, Payments/UPI, Device Info).
  - Web handles: Dynamic layouts, frequent promotion campaigns, complex business forms, dynamic screens.

## 3. Zero-App-Update Philosophy
- Any frequently changing UI/button must either:
  1. Live inside the deployed Webview (Next.js instant deployment), OR
  2. Be controlled via Remote Config toggles fetched on app launch, OR
  3. Be pushed via Expo OTA (`eas update`).
