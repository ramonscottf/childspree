import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wickowaypoint.childspree',
  appName: 'Child Spree',
  webDir: 'dist',
  // Allow webview to talk to our Cloudflare Worker backends. Production builds
  // load `dist/index.html` from the bundled origin; HTTPS calls go out as normal.
  server: {
    androidScheme: 'https',
    // No explicit `url` here — we ship the bundled web build, not a remote URL.
    // For dev with hot-reload, override locally with: server.url = 'http://<dutchman-lan-ip>:5173'
  },
  android: {
    // Allow mixed content during dev only. Strip in production builds.
    allowMixedContent: false,
    // Capture WebView errors to native logs for easier debugging.
    captureInput: true,
  },
  ios: {
    // Match the existing daviskids/childspree theme color status bar.
    contentInset: 'automatic',
    // Prevent rubber-band scroll past the SPA viewport edges.
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#1B3A4B',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1B3A4B',
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
