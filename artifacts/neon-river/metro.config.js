const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Transform packages that use private class fields (#field syntax)
// which older Hermes versions cannot compile natively.
config.transformer.transformIgnorePatterns = [
  "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-web|@shopify/.*|react-native-purchases|@sentry/.*)",
];

module.exports = config;
