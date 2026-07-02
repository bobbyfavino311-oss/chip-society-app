import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initializeSentry() {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] SENTRY_DSN not configured — crash reporting disabled');
    return;
  }
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    enabled: !__DEV__,
    tracesSampleRate: 0.2,
    environment: __DEV__ ? 'development' : 'production',
  });
}

export function reportError(error: Error, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error('[Sentry] captured error:', error, context);
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
