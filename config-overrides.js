const path = require('path');
const webpack = require('webpack');

module.exports = function override(config, env) {
  // COMPLETELY DISABLE MODULE SCOPE PLUGIN
  config.resolve.plugins = config.resolve.plugins.filter(
    plugin => plugin.constructor.name !== 'ModuleScopePlugin'
  );

  // Disable ALL critical dependency warnings
  config.module = config.module || {};
  config.module.exprContextCritical = false;
  config.module.unknownContextCritical = false;
  config.module.strictExportPresence = false;

  // Remove the restriction on importing from outside src
  const scopePluginIndex = config.resolve.plugins.findIndex(
    ({ constructor }) => constructor && constructor.name === 'ModuleScopePlugin'
  );
  if (scopePluginIndex >= 0) {
    config.resolve.plugins.splice(scopePluginIndex, 1);
  }

  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "path": require.resolve("path-browserify"),
    "fs": false,
    "stream": require.resolve("stream-browserify"),
    "zlib": require.resolve("browserify-zlib"),
    "crypto": require.resolve("crypto-browserify"),
    "net": false,
    "tls": false,
    "os": false,
    "assert": require.resolve("assert/"),
    "util": require.resolve("util/"),
    "url": require.resolve("url/"),
    "buffer": require.resolve("buffer/"),
    "process": require.resolve("process/browser.js"),
    "vm": false,
    "async_hooks": false,
    "express": false,
    "express/lib/view": false,
    "express/lib/router": false,
    "express/lib/application": false,
    // Add utils fallbacks
    'utils': path.resolve(__dirname, 'src/utils/fallback-utils.js'),
    './utils': path.resolve(__dirname, 'src/utils/fallback-utils.js'),
    '../utils': path.resolve(__dirname, 'src/utils/fallback-utils.js')
  };

  // Add support for .mjs files
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto'
  });

  // Add aliases for ALL problematic modules
  config.resolve.alias = {
    ...config.resolve.alias,
    // Mock framer-motion
    'framer-motion': path.resolve(__dirname, 'src/utils/framer-motion-mock.js'),
    // Handle component naming mismatches
    './ClimateModule': path.resolve(__dirname, 'src/components/truly_extended_scaling/climate-module-enhanced.js'),
    './CoordinateContainer': path.resolve(__dirname, 'src/components/truly_extended_scaling/coordinate-container-enhanced.js'),
    './CoordinateContainerEnhanced': path.resolve(__dirname, 'src/components/truly_extended_scaling/CoordinateContainerEnhanced.js'),
    './MultiZoneSelector': path.resolve(__dirname, 'src/components/truly_extended_scaling/MultiZoneSelector.js'),
    './BoundaryDownloader': path.resolve(__dirname, 'src/components/truly_extended_scaling/BoundaryDownloader.js'),
    './UnifiedTooltip': path.resolve(__dirname, 'src/components/truly_extended_scaling/UnifiedTooltip.js'),
    // Utils fallbacks
    '../utils.js': path.resolve(__dirname, 'src/utils/fallback-utils.js'),
    '../utils': path.resolve(__dirname, 'src/utils/fallback-utils.js')
  };

  // Fix extensions
  config.resolve.extensions = [...(config.resolve.extensions || []), '.mjs', '.jsx'];

  // Add plugins
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  );

  // Fix for specific problematic modules
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /node_modules\/@react-dnd\/invariant\/dist\/index\.js$/,
      require.resolve('./webpack-patches/react-dnd-invariant-patch.js')
    ),
    new webpack.NormalModuleReplacementPlugin(
      /node_modules\/axios\/lib\/utils\.js$/,
      require.resolve('./webpack-patches/axios-utils-patch.js')
    ),
    new webpack.NormalModuleReplacementPlugin(
      /node_modules\/express\/lib\/view\.js$/,
      require.resolve('./webpack-patches/express-view-patch.js')
    )
  );

  // Override stats to suppress warnings
  config.stats = 'errors-only';
  
  // Ignore specific warnings
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Critical dependency/,
    /Module not found/
  ];

  // Fix dev server for development
  if (env === 'development' && config.devServer) {
    const onBeforeSetupMiddleware = config.devServer.onBeforeSetupMiddleware;
    const onAfterSetupMiddleware = config.devServer.onAfterSetupMiddleware;

    config.devServer = {
      ...config.devServer,
      onBeforeSetupMiddleware: undefined,
      onAfterSetupMiddleware: undefined,
      setupMiddlewares: (middlewares, devServer) => {
        if (typeof onBeforeSetupMiddleware === 'function') {
          onBeforeSetupMiddleware(devServer);
        }
        if (typeof onAfterSetupMiddleware === 'function') {
          onAfterSetupMiddleware(devServer);
        }
        return middlewares;
      }
    };
  }

  return config;
};