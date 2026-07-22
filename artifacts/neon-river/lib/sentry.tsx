// Sentry is stubbed out — no DSN is configured for this build.
// Replace this file with the real @sentry/react-native integration
// once EXPO_PUBLIC_SENTRY_DSN is added to eas.json env vars.

export function initializeSentry() {
  // no-op
}

export function reportError(error: Error, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error('[Error]', error, context);
  }
}
