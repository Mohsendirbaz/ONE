const path = require('path');

module.exports = function override(config, env) {
  // Disable critical dependency warnings for dynamic requires
  config.module = config.module || {};
  config.module.exprContextCritical = false;

  // Add webpack-dev-server configuration to fix deprecation warnings
  // Always apply this configuration as the warnings only appear in development mode
  // Store references to the middleware functions if they exist
  const onBeforeSetupMiddleware = config.devServer?.onBeforeSetupMiddleware;
  const onAfterSetupMiddleware = config.devServer?.onAfterSetupMiddleware;

  // Create a new devServer config without the deprecated options
  config.devServer = {
    ...(config.devServer || {}),
    // Explicitly delete deprecated options
    onBeforeSetupMiddleware: undefined,
    onAfterSetupMiddleware: undefined,
    // Add the new setupMiddlewares function
    setupMiddlewares: (middlewares, devServer) => {
      // Handle any before middleware setup
      if (typeof onBeforeSetupMiddleware === 'function') {
        onBeforeSetupMiddleware(devServer);
      }

      // Handle any after middleware setup
      if (typeof onAfterSetupMiddleware === 'function') {
        onAfterSetupMiddleware(devServer);
      }

      return middlewares;
    }
  };

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
    "express": false,  // Tell webpack not to include express in the client bundle
    "express/lib/view": false,  // Explicitly exclude express view module
    "express/lib/router": false,  // Explicitly exclude express router module
    "express/lib/application": false  // Explicitly exclude express application module
  };

  // Add buffer and process polyfills
  const webpack = require('webpack');
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  );

  // Add alias for problematic modules
  config.resolve.alias = {
    ...config.resolve.alias,
    // Handle common naming mismatches
    './ClimateModule': path.resolve(__dirname, 'src/components/truly_extended_scaling/climate-module-enhanced.js'),
    './CoordinateContainer': path.resolve(__dirname, 'src/components/truly_extended_scaling/coordinate-container-enhanced.js'),
    './CoordinateContainerEnhanced': path.resolve(__dirname, 'src/components/truly_extended_scaling/CoordinateContainerEnhanced.js'),
    './MultiZoneSelector': path.resolve(__dirname, 'src/components/truly_extended_scaling/MultiZoneSelector.js'),
    './BoundaryDownloader': path.resolve(__dirname, 'src/components/truly_extended_scaling/BoundaryDownloader.js'),
    './UnifiedTooltip': path.resolve(__dirname, 'src/components/truly_extended_scaling/UnifiedTooltip.js'),
    // Handle utils.js default export issues
    '../utils.js': path.resolve(__dirname, 'src/utils/fallback-utils.js'),
    '../utils': path.resolve(__dirname, 'src/utils/fallback-utils.js'),
    // Use mock framer-motion to avoid import issues
    'framer-motion': path.resolve(__dirname, 'src/utils/framer-motion-mock.js')
  };

  // Make build more forgiving of missing modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    // Add fallbacks for problematic modules
    'utils': path.resolve(__dirname, 'src/utils/fallback-utils.js'),
    './utils': path.resolve(__dirname, 'src/utils/fallback-utils.js'),
    '../utils': path.resolve(__dirname, 'src/utils/fallback-utils.js')
  };

  // Handle module resolution errors more gracefully
  config.module.unknownContextCritical = false;
  config.module.exprContextCritical = false;

  // Add support for .mjs files and fix framer-motion issues
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto'
  });

  // Fix module resolution for .mjs files
  config.resolve.extensions = [...(config.resolve.extensions || []), '.mjs'];

  // Ignore certain warnings
  config.stats = 'errors-warnings';

  // Add IgnorePlugin for problematic imports
  config.plugins.push(
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\.\/utils$/,
      contextRegExp: /[\\/]/
    })
  );


  // Fix for "Cannot read properties of undefined (reading 'module')" errors
  // and "Critical dependency: the request of a dependency is an expression" warnings
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

  return config;
};
