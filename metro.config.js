const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import("expo/metro-config").MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("geojson", "sqlite");

module.exports = withNativewind(config, { inlineRem: 16 });
