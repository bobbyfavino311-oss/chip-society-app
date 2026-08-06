/**
 * Config plugin: disables Hermes on iOS unconditionally.
 *
 * Strategy:
 *  1. Patch the Podfile so CocoaPods installs without hermes-engine
 *  2. Patch the Xcode project pbxproj so HERMES_ENABLED = NO in every build config
 *
 * This is belt-and-suspenders: either one alone is sufficient, but both
 * together guarantees hermesc is never invoked regardless of caching.
 */
const { withPodfile, withXcodeProject } = require("@expo/config-plugins");

function withDisableHermesInPodfile(config) {
  return withPodfile(config, (config) => {
    config.modResults.contents = config.modResults.contents
      .replace(/:hermes_enabled => pods_config\[:hermes_enabled\]/g, ":hermes_enabled => false")
      .replace(/:hermes_enabled => true/g, ":hermes_enabled => false")
      .replace(/hermes_enabled: true/g, "hermes_enabled: false")
      .replace(/\$RNHermesEnabled = true/g, "$RNHermesEnabled = false")
      .replace(/ENV\['USE_HERMES'\] = '1'/g, "ENV['USE_HERMES'] = '0'");
    return config;
  });
}

function withDisableHermesInXcode(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    // Set HERMES_ENABLED = NO in every build configuration
    const buildConfigs = project.pbxXCBuildConfigurationSection();
    for (const [, config2] of Object.entries(buildConfigs)) {
      if (config2 && typeof config2 === "object" && config2.buildSettings) {
        config2.buildSettings["HERMES_ENABLED"] = "NO";
      }
    }
    return config;
  });
}

module.exports = function withDisableHermes(config) {
  config = withDisableHermesInPodfile(config);
  config = withDisableHermesInXcode(config);
  return config;
};
