const { withAndroidManifest } = require("expo/config-plugins");

const SERVICE_NAME = "expo.modules.arowmocklocation.MockLocationService";

module.exports = function withArowMockLocation(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const permissions = manifest["uses-permission"] ?? [];
    for (const name of [
      "android.permission.ACCESS_MOCK_LOCATION",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_LOCATION",
    ]) {
      if (!permissions.some((item) => item.$["android:name"] === name)) {
        permissions.push({ $: { "android:name": name } });
      }
    }
    manifest["uses-permission"] = permissions;

    const application = manifest.application?.[0];
    if (application === undefined) {
      throw new Error("Android application manifest is missing");
    }
    const services = application.service ?? [];
    const matchingServices = services.filter(
      (item) => item.$["android:name"] === SERVICE_NAME,
    );
    if (matchingServices.length === 0) {
      const service = { $: { "android:name": SERVICE_NAME } };
      services.push(service);
      matchingServices.push(service);
    }
    for (const service of matchingServices) {
      service.$["android:exported"] = "false";
      service.$["android:foregroundServiceType"] = "location";
    }
    application.service = services;
    return config;
  });
};
