const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// react-native-web ships class declarations (DOMRect, NodeList, etc.) that
// Hermes cannot parse unless Babel transforms them first.
// This RegExp tells Metro to run Babel on react-native-web (and all the usual
// React Native / Expo packages) instead of skipping them.
config.transformer.transformIgnorePatterns = [
  /node_modules\/(?!(react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?\/.*|@expo-google-fonts\/.*|react-navigation|@react-navigation\/.*|@unimodules\/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-web|@shopify\/.*|react-native-purchases|@sentry\/.*|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-reanimated)\/).*/,
];

module.exports = config;
