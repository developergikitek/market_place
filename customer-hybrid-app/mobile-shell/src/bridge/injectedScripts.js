export function getInjectedJavaScriptBeforeContentLoaded(platform, version) {
  return `
    (function() {
      window.IS_NATIVE_SHELL = true;
      window.NATIVE_PLATFORM = "${platform}";
      window.NATIVE_SHELL_VERSION = "${version}";
      window.AUTH_SESSION = {
        token: "jwt_sample_token_xyz987",
        userId: "usr_active_901",
      };
      // Suppress duplicate web header since Native Shell renders the top header permanently.
      // Also fix Android WebView touch handling: overflow-x:auto containers eat all touch events
      // unless touch-action:manipulation is set, which tells the browser not to wait for double-tap.
      var style = document.createElement('style');
      style.id = 'native-header-suppression';
      style.innerHTML = [
        '.navy-hero-container > .location-row-header, .navy-hero-container > .shopping-mode-selector, .navy-hero-container > .search-input-wrapper { display: none !important; }',
        '.categories-header-bar, .categories-search-container { display: none !important; }',
        // Cart bar is rendered natively above the tab bar (a fixed web bar drifts while the WebView resizes)
        '.cart-bar { display: none !important; }',
        // Eliminate 300ms tap delay and allow overflow-x scroll containers to pass taps through
        'a, button, [role="button"], [onclick], .store-retail-card, .retail-product-mini-card, .product-add-btn, .product-stepper-btn, .store-products-tray-scroll { touch-action: manipulation; }',
        // Prevent horizontal scroll containers from swallowing vertical taps
        '.store-products-tray-scroll { -webkit-overflow-scrolling: touch; }',
        // Top spacer under the floating native header (location + service cards). Native sets its
        // height per screen; it scrolls away with the page while the header slides up.
        'body::before { content: ""; display: block; height: var(--shell-top-inset, 0px); background: var(--hero-from, #F3F5FA); }'
      ].join(' ');

      window.__shellSetTopInset = function(px) {
        document.documentElement.style.setProperty('--shell-top-inset', px + 'px');
      };
      // Native is the source of truth for the header state; it reports every change here
      window.__shellSyncCollapsed = function(collapsed) {
        isCollapsedState = !!collapsed;
      };
      if (document.head) {
        document.head.appendChild(style);
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          document.head.appendChild(style);
        });
      }

      // Real-time Ultra-Smooth Page Scroll Listener for Collapsible Sticky Header
      var isCollapsedState = false;
      var scrollTicking = false;

      function updateScroll() {
        var scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        // Only collapse when there's clearly more content than the header covers; on short pages
        // sliding the header away would just show empty space.
        var maxScroll = (document.documentElement.scrollHeight || 0) - window.innerHeight;
        var canCollapse = maxScroll > 260;
        if (scrollY > 50 && !isCollapsedState && canCollapse) {
          isCollapsedState = true;
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              action: 'SET_HEADER_COLLAPSED',
              payload: { collapsed: true }
            }));
          }
        } else if (scrollY < 20 && isCollapsedState) {
          isCollapsedState = false;
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              action: 'SET_HEADER_COLLAPSED',
              payload: { collapsed: false }
            }));
          }
        }
        scrollTicking = false;
      }

      function onScrollThrottled() {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(updateScroll);
        }
      }

      window.addEventListener('scroll', onScrollThrottled, { passive: true });
      document.addEventListener('scroll', onScrollThrottled, { passive: true });

      console.log('[NativeBridge] Injected shell environment, header suppression, and scroll sync.');
    })();
    true;
  `;
}
