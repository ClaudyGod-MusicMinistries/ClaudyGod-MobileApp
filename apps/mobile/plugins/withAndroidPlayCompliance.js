const fs = require('node:fs');
const path = require('node:path');
const {
  withAndroidManifest,
  withAndroidStyles,
  withDangerousMod,
  withGradleProperties,
} = require('expo/config-plugins');

const PROGUARD_MARKER = '# ClaudyGod Google Play R8 rules';
const EXTRA_PROGUARD_RULES = `
${PROGUARD_MARKER}
-keepclassmembers class * {
  @android.webkit.JavascriptInterface <methods>;
}
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
`.trimStart();

function upsertGradleProperty(properties, key, value) {
  const existing = properties.find((item) => item.type === 'property' && item.key === key);
  if (existing) {
    existing.value = value;
  } else {
    properties.push({ type: 'property', key, value });
  }
}

/**
 * Configures Android release builds for Google Play compliance:
 * 1. Enables R8 minification, obfuscation, and resource shrinking so DEX
 *    optimization meets Google Play's >=25% obfuscation threshold.
 * 2. Removes orientation/resizability restrictions on MainActivity and
 *    Application for Android 16+ large-screen & foldable compatibility.
 * 3. Strips deprecated edge-to-edge status/nav bar color attributes from
 *    Android styles.xml for Android 15+ compliance.
 */
module.exports = function withAndroidPlayCompliance(config) {
  config = withGradleProperties(config, (modConfig) => {
    upsertGradleProperty(modConfig.modResults, 'android.enableMinifyInReleaseBuilds', 'true');
    upsertGradleProperty(modConfig.modResults, 'android.enableShrinkResourcesInReleaseBuilds', 'true');
    return modConfig;
  });

  config = withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    const application = manifest.application?.[0];
    if (application) {
      application.$ = application.$ || {};
      application.$['android:resizeableActivity'] = 'true';
      delete application.$['android:maxAspectRatio'];

      for (const activity of application.activity || []) {
        activity.$ = activity.$ || {};
        activity.$['android:resizeableActivity'] = 'true';
        delete activity.$['android:screenOrientation'];
        delete activity.$['android:maxAspectRatio'];
        delete activity.$['android:minAspectRatio'];
      }
    }
    return modConfig;
  });

  config = withAndroidStyles(config, (modConfig) => {
    const styles = modConfig.modResults.resources?.style || [];
    const deprecatedItems = new Set([
      'android:statusBarColor',
      'android:navigationBarColor',
      'android:windowTranslucentStatus',
      'android:windowTranslucentNavigation',
      'android:windowLayoutInDisplayCutoutMode',
    ]);
    for (const style of styles) {
      if (Array.isArray(style.item)) {
        style.item = style.item.filter((item) => !deprecatedItems.has(item.$?.name));
      }
    }
    return modConfig;
  });

  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const proguardPath = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      if (fs.existsSync(proguardPath)) {
        const current = fs.readFileSync(proguardPath, 'utf8');
        if (!current.includes(PROGUARD_MARKER)) {
          const separator = current.endsWith('\n') ? '\n' : '\n\n';
          fs.writeFileSync(proguardPath, `${current}${separator}${EXTRA_PROGUARD_RULES}`, 'utf8');
        }
      }
      return modConfig;
    },
  ]);

  return config;
};
