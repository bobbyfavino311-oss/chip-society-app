/**
 * Expo config plugin — copies PrivacyInfo.xcprivacy into the iOS app bundle
 * during EAS Build (managed workflow). Required by Apple since May 2024.
 *
 * Usage in app.json:
 *   "plugins": ["./plugins/withPrivacyManifest"]
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/** @type {import('@expo/config-plugins').ConfigPlugin} */
const withPrivacyManifest = (config) =>
  withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const platformRoot = modConfig.modRequest.platformProjectRoot;
      const projectName = modConfig.modRequest.projectName;

      const src  = path.join(projectRoot, 'PrivacyInfo.xcprivacy');
      const dest = path.join(platformRoot, projectName, 'PrivacyInfo.xcprivacy');

      if (!fs.existsSync(src)) {
        console.warn('[withPrivacyManifest] PrivacyInfo.xcprivacy not found at project root — skipping.');
        return modConfig;
      }

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      console.log('[withPrivacyManifest] Copied PrivacyInfo.xcprivacy →', dest);

      return modConfig;
    },
  ]);

module.exports = withPrivacyManifest;
