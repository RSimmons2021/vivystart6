const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix import.meta issues in SDK 52
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Ensure proper module resolution
config.resolver = {
  ...config.resolver,
  unstable_enableSymlinks: false,
  unstable_enablePackageExports: false,
};

module.exports = config; 