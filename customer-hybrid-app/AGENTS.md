# Agent Guidelines: Customer Hybrid App (Expo + Next.js + OTA)

This repository follows a strict architecture for zero-store-update mobile experiences:

1. **`mobile-shell/`**: React Native (Expo) app powered by `react-native-webview` and `expo-updates` (EAS Update).
2. **`web-frontend/`**: Next.js app serving dynamic customer screens, promotions, and microfrontends.
3. **JS Bridge Protocol**: All communication between Native and WebView flows through typed messages (`type` and `payload`).
4. **Remote Configuration**: Features and buttons are toggled dynamically through remote configuration without needing store updates.
