# Customer Hybrid App (Expo + Next.js + OTA Architecture)

Production-grade Hybrid Architecture tailored for zero-store-update customer applications.

---

## 🏗️ Architecture Blueprint

```
customer-hybrid-app/
├── .agents/
│   └── rules/
│       └── hybrid-app-architecture.md  <-- Enforces this exact stack across all IDE chats
├── AGENTS.md                           <-- Workspace guidelines for AI assistants
├── mobile-shell/                       <-- React Native (Expo) Native Shell
│   ├── App.js                          <-- Native Header + react-native-webview + JS Bridge
│   ├── app.json                        <-- Configured with expo-updates (EAS OTA)
│   └── src/
│       ├── bridge/nativeBridgeHandler.js <-- UPI, Haptics, Native Share, Alerts
│       ├── config/appConfig.js         <-- Remote Config fetcher & fallback
│       └── updates/otaManager.js       <-- expo-updates checker
└── web-frontend/                       <-- Next.js Customer Microfrontend
    └── src/
        ├── app/
        │   ├── page.js                 <-- Dynamic UI with live feature toggles
        │   └── api/config/route.js     <-- Real-time Remote Config API
        └── lib/nativeBridge.js         <-- Bidirectional JS Bridge for web
```

---

## 🚀 How to Run

### 1. Start the Next.js Webview Server:
```bash
npm run web
# Runs at http://localhost:3000
```

### 2. Start the React Native Expo Shell:
In a separate terminal:
```bash
npm run mobile
# Press 'a' for Android emulator or scan QR code with Expo Go on your physical phone!
```

---

## 🔄 The "Zero Store Update" Trifecta

1. **Next.js Webview Hosted Live:**
   Deploy `web-frontend` to Vercel/Cloudflare. Any code changes, promotions, banners, or page redesigns go live immediately with `git push`.
2. **Server-Driven Remote Config (`/api/config`):**
   Toggle buttons (UPI, festive banners, VIP cards) on/off in real-time without recompiling or shipping any mobile build.
3. **Expo OTA Updates (`eas update`):**
   Push JavaScript and native shell logic updates directly over-the-air with:
   ```bash
   npm run mobile:ota
   ```

---

## 🌉 JS Bridge Protocol

* **Web to Native:**
  ```javascript
  import { sendToNative } from '@/lib/nativeBridge';
  sendToNative('TRIGGER_UPI', { amount: 799, merchant: 'Store' });
  ```

* **Native to Web:**
  Handled in `App.js` via `webViewRef.current.postMessage(...)` and received in web through `subscribeToNativeEvents(...)`.
