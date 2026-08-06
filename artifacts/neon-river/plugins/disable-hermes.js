/**
 * Config plugin: forces hermes_enabled => false in the Podfile regardless
 * of what expo prebuild generates. Use this if expo.jsEngine:"jsc" is not
 * being respected by the EAS build environment.
 */
const { withPodfile } = require("@expo/config-plugins");

module.exports = function withDisableHermes(config) {
  return withPodfile(config, (config) => {
    const podfile = config.modResults.contents;
    // Replace any hermes_enabled => true with false
    config.modResults.contents = podfile
      .replace(/:hermes_enabled => true/g, ":hermes_enabled => false")
      .replace(/hermes_enabled: true/g, "hermes_enabled: false");
    return config;
  });
};
