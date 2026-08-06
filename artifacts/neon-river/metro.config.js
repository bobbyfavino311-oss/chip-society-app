const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// react-native-web ships class declarations (DOMRect, NodeList, etc.) that
// Hermes cannot compile. On iOS these are dead code — the app never calls
// DOM APIs. Return empty modules so Hermes never sees the problematic code.
const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "ios" &&
    (moduleName === "react-native-web" ||
      moduleName.startsWith("react-native-web/"))
  ) {
    return { type: "empty" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
