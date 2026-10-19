import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';

// Per-message logging, off by default: every scroll/route message went through console.log,
// which in debug builds is slow enough to delay page switches. Turn on when debugging the bridge.
const LOG_BRIDGE = false;

/**
 * Handles incoming messages sent from the Next.js WebView
 * and optionally dispatches a response back into the WebView.
 */
export async function handleWebViewMessage(messageRaw, webViewRef) {
  try {
    const data = typeof messageRaw === 'string' ? JSON.parse(messageRaw) : messageRaw;
    const { action, payload = {} } = data;

    if (LOG_BRIDGE) console.log('[NativeBridge] Received action:', action, payload);

    switch (action) {
      case 'TRIGGER_HAPTIC': {
        // Trigger native device haptics
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {
          // Haptics might not be supported in some emulators
        }
        sendToWebView(webViewRef, 'HAPTIC_TRIGGERED', { status: 'ok' });
        break;
      }

      case 'TRIGGER_TOAST': {
        Alert.alert(
          '🔔 Native Shell Alert',
          payload.message || 'Action triggered from inside the WebView!',
          [{ text: 'Great!', style: 'default' }]
        );
        sendToWebView(webViewRef, 'TOAST_SHOWN', { status: 'acknowledged' });
        break;
      }

      case 'TRIGGER_SHARE': {
        // Native Share Sheet
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          Alert.alert(
            '🎁 Native Share Sheet',
            `Sharing: ${payload.title || 'SuperApp'} (${payload.url || 'https://mysuperapp.com'})`,
            [
              {
                text: 'Simulate Share Complete',
                onPress: () => {
                  sendToWebView(webViewRef, 'SHARE_COMPLETED', { success: true });
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        } else {
          Alert.alert('Share', `Native sharing invoked: ${payload.url}`);
        }
        break;
      }

      case 'TRIGGER_UPI': {
        // Native UPI Payment Flow
        Alert.alert(
          '⚡ Native UPI Gateway',
          `Pay ₹${payload.amount || 499} to ${payload.merchant || 'SuperStore'} via UPI?`,
          [
            {
              text: 'Pay with GPay / PhonePe',
              onPress: async () => {
                try {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch {}
                sendToWebView(webViewRef, 'UPI_PAYMENT_SUCCESS', {
                  txnId: `TXN_${Date.now()}`,
                  amount: payload.amount,
                  status: 'SUCCESS',
                  timestamp: new Date().toISOString(),
                });
              }
            },
            {
              text: 'Decline',
              style: 'cancel',
              onPress: () => {
                sendToWebView(webViewRef, 'UPI_PAYMENT_CANCELLED', { status: 'CANCELLED' });
              }
            }
          ]
        );
        break;
      }

      case 'OPEN_OFFERS': {
        Alert.alert('🔥 Festive Promo', `Code applied: ${payload.promo || 'HYBRID30'}`);
        sendToWebView(webViewRef, 'PROMO_APPLIED', { promo: payload.promo });
        break;
      }

      // Navigation/state actions are handled directly in App.js onMessage
      case 'NAVIGATION_START':
      case 'SEARCH_CLOSED':
      case 'OPEN_SEARCH_REQUEST':
      case 'OVERLAY_OPEN':
      case 'OVERLAY_CLOSED':
      case 'WEB_READY':
      case 'TAB_CHANGED':
      case 'PAGE_VIEWED':
      case 'STORE_SELECTED':
      case 'OPEN_STORE':
      case 'CART_UPDATED':
      case 'PROFILE_REQUEST':
      case 'PROFILE_EDIT':
        break;

      default: {
        console.warn('[NativeBridge] Unhandled action:', action);
        sendToWebView(webViewRef, 'UNKNOWN_ACTION_ACK', { action });
      }
    }
  } catch (err) {
    console.error('[NativeBridge] Failed to parse message:', err);
  }
}

/**
 * Dispatch message from React Native Shell into Next.js WebView
 */
export function sendToWebView(webViewRef, type, payload = {}) {
  if (!webViewRef?.current) return;

  const eventPayload = JSON.stringify({
    type,
    payload,
    platform: Platform.OS,
    timestamp: Date.now(),
  });

  // Post message to webview
  webViewRef.current.postMessage(eventPayload);
  if (LOG_BRIDGE) console.log('[NativeBridge] Sent to WebView:', type);
}
