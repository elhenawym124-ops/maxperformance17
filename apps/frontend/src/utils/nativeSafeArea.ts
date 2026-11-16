import { Capacitor } from '@capacitor/core';

let isApplied = false;

/**
 * Safely determines whether the application is running inside a native mobile runtime.
 */
function isNative(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (typeof Capacitor !== 'undefined' && typeof Capacitor.isNativePlatform === 'function') {
      return Capacitor.isNativePlatform();
    }
    const win = window as any;
    if (typeof win?.Capacitor?.isNativePlatform === 'function') {
      return win.Capacitor.isNativePlatform();
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Safely probes CSS env() inset values from the DOM.
 */
function readEnvInset(position: 'top' | 'bottom'): number {
  try {
    if (typeof document === 'undefined' || !document.documentElement) return 0;
    const probe = document.createElement('div');
    probe.style.position = 'fixed';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.height = '0px';
    probe.style.width = '0px';
    if (position === 'top') {
      probe.style.paddingTop = 'env(safe-area-inset-top, 0px)';
    } else {
      probe.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    }
    document.documentElement.appendChild(probe);
    const computed = window.getComputedStyle(probe);
    const val = parseFloat(position === 'top' ? computed.paddingTop : computed.paddingBottom) || 0;
    document.documentElement.removeChild(probe);
    return val;
  } catch {
    return 0;
  }
}

/**
 * Applies safe-area insets to CSS root variables (--app-safe-top, --app-safe-bottom)
 * and configures the native Capacitor StatusBar to avoid WebView underlap.
 * 
 * - Web safe: No-op on standard web browsers / SSR.
 * - Idempotent: Subsequent calls return immediately without duplicate processing.
 * - Exception safe: Any plugin or DOM access error is caught without throwing.
 */
export async function applyNativeSafeArea(): Promise<void> {
  // Web guard: Return immediately on standard browsers or SSR without touching DOM
  if (!isNative()) {
    return;
  }

  if (isApplied) {
    return;
  }
  isApplied = true;

  let measuredTop: number | null = null;
  let measuredBottom: number | null = null;

  // 1. Try reading standard env(safe-area-inset-*) if WebView engine populates them
  const envTop = readEnvInset('top');
  if (envTop > 0) {
    measuredTop = envTop;
  }

  const envBottom = readEnvInset('bottom');
  if (envBottom > 0) {
    measuredBottom = envBottom;
  }

  // 2. Interact with @capacitor/status-bar to disable webview overlays
  // and retrieve real status bar height
  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    if (StatusBar) {
      if (typeof StatusBar.setOverlaysWebView === 'function') {
        await StatusBar.setOverlaysWebView({ overlay: false });
      }
      if (typeof StatusBar.getInfo === 'function') {
        const info = await StatusBar.getInfo();
        if (typeof info?.height === 'number' && info.height > 0) {
          if (measuredTop === null || info.overlays) {
            measuredTop = info.height;
          }
        }
      }
    }
  } catch {
    // Graceful fallback if StatusBar plugin is missing or unsupported
  }

  // 3. Fallback measurement for top: window.visualViewport
  if (measuredTop === null && typeof window !== 'undefined' && window.visualViewport?.offsetTop) {
    if (window.visualViewport.offsetTop > 0) {
      measuredTop = window.visualViewport.offsetTop;
    }
  }

  // 4. Fallback measurement for bottom: screen available height vs window.innerHeight
  if (measuredBottom === null && typeof window !== 'undefined' && typeof screen !== 'undefined') {
    if (typeof screen.availHeight === 'number' && typeof window.innerHeight === 'number') {
      const diff = screen.availHeight - window.innerHeight;
      if (diff > 0 && diff <= 120) {
        measuredBottom = diff;
      }
    }
  }

  // Set CSS custom properties on documentElement if measurements exist
  if (typeof document !== 'undefined' && document.documentElement) {
    if (measuredTop !== null && measuredTop > 0) {
      document.documentElement.style.setProperty('--app-safe-top', `${measuredTop}px`);
    }
    if (measuredBottom !== null && measuredBottom > 0) {
      document.documentElement.style.setProperty('--app-safe-bottom', `${measuredBottom}px`);
    }
  }
}

/**
 * Resets the applied state flag (for testing purposes only).
 */
export function _resetNativeSafeAreaForTesting(): void {
  isApplied = false;
}
