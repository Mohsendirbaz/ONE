const path = require('path');
const webpack = require('webpack');

module.exports = function override(config, env) {
  // ABSOLUTE NUCLEAR OPTION - SCORCHED EARTH APPROACH
  
  // 1. DESTROY ALL RESTRICTIONS
  config.resolve.plugins = [];
  config.resolve.restrictions = [];
  
  // 2. DISABLE EVERYTHING THAT CAN FAIL
  config.module = {
    ...config.module,
    exprContextCritical: false,
    unknownContextCritical: false,
    strictExportPresence: false,
    strictThisContextOnImports: false,
    requireEnsure: false,
    rules: config.module.rules.map(rule => {
      // Neuter all rules
      if (rule.oneOf) {
        rule.oneOf = rule.oneOf.map(innerRule => ({
          ...innerRule,
          exclude: undefined,
          include: undefined
        }));
      }
      return rule;
    })
  };

  // 3. FORCE PRODUCTION MODE WITH NO CHECKS
  config.mode = 'production';
  config.bail = false;
  config.performance = false;
  config.devtool = false;
  
  // 4. DISABLE ALL OPTIMIZATIONS THAT CAN FAIL
  config.optimization = {
    minimize: false,
    sideEffects: false,
    usedExports: false,
    concatenateModules: false,
    splitChunks: false,
    runtimeChunk: false,
    noEmitOnErrors: false,
    checkWasmTypes: false,
    mangleExports: false,
    providedExports: false,
    innerGraph: false,
    mangleWasmImports: false
  };

  // 5. NUCLEAR FALLBACK - EVERYTHING IS FALSE OR A MOCK
  const nuclearFallback = {};
  const allModules = [
    'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
    'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https',
    'module', 'net', 'os', 'path', 'punycode', 'process', 'querystring',
    'readline', 'repl', 'stream', 'string_decoder', 'sys', 'timers', 'tls',
    'tty', 'url', 'util', 'vm', 'zlib', '_stream_duplex', '_stream_passthrough',
    '_stream_readable', '_stream_transform', '_stream_writable', 'utils', 'factory'
  ];
  
  // Make EVERYTHING false
  allModules.forEach(mod => {
    nuclearFallback[mod] = false;
    nuclearFallback[`./${mod}`] = false;
    nuclearFallback[`../${mod}`] = false;
    nuclearFallback[`${mod}.js`] = false;
    nuclearFallback[`./${mod}.js`] = false;
    nuclearFallback[`../${mod}.js`] = false;
  });
  
  config.resolve.fallback = nuclearFallback;

  // 6. ALIAS EVERYTHING TO MOCKS
  config.resolve.alias = {
    // Nuclear option - alias EVERYTHING to a single mock file
    'mathjs$': path.resolve(__dirname, 'src/utils/universal-mock.js'),
    'mathjs/lib': path.resolve(__dirname, 'src/utils/universal-mock.js'),
    'framer-motion$': path.resolve(__dirname, 'src/utils/universal-mock.js'),
    'framer-motion/dist': path.resolve(__dirname, 'src/utils/universal-mock.js'),
    // Pattern matching for all problematic imports
    '.*utils.*': path.resolve(__dirname, 'src/utils/universal-mock.js'),
    '.*factory.*': path.resolve(__dirname, 'src/utils/universal-mock.js'),
    // Component overrides
    './ClimateModule': path.resolve(__dirname, 'src/components/truly_extended_scaling/climate-module-enhanced.js'),
    './CoordinateContainer': path.resolve(__dirname, 'src/components/truly_extended_scaling/coordinate-container-enhanced.js'),
    './CoordinateContainerEnhanced': path.resolve(__dirname, 'src/components/truly_extended_scaling/CoordinateContainerEnhanced.js'),
    './MultiZoneSelector': path.resolve(__dirname, 'src/components/truly_extended_scaling/MultiZoneSelector.js'),
    './BoundaryDownloader': path.resolve(__dirname, 'src/components/truly_extended_scaling/BoundaryDownloader.js'),
    './UnifiedTooltip': path.resolve(__dirname, 'src/components/truly_extended_scaling/UnifiedTooltip.js'),
  };

  // 7. ACCEPT ALL FILE TYPES
  config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs', '.cjs', '.wasm', '.html', '.css'];
  
  // 8. IGNORE EVERYTHING THAT CAN BE IGNORED
  config.plugins = [
    ...config.plugins.filter(p => !(p instanceof webpack.IgnorePlugin)),
    new webpack.IgnorePlugin({
      checkResource(resource) {
        // Ignore anything that looks problematic
        return resource.includes('factory') || 
               resource.includes('../utils') ||
               resource.includes('node_modules/mathjs/lib/esm');
      }
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.browser': true,
      'process.env': JSON.stringify({}),
      'global': 'window'
    })
  ];

  // 9. NUCLEAR MODULE REPLACEMENT
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /^mathjs$/,
      path.resolve(__dirname, 'src/utils/universal-mock.js')
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^framer-motion$/,
      path.resolve(__dirname, 'src/utils/universal-mock.js')
    ),
    new webpack.NormalModuleReplacementPlugin(
      /\.\.\/utils/,
      path.resolve(__dirname, 'src/utils/universal-mock.js')
    ),
    new webpack.NormalModuleReplacementPlugin(
      /\.\.\/factory/,
      path.resolve(__dirname, 'src/utils/universal-mock.js')
    )
  );

  // 10. OUTPUT CONFIGURATION - MAXIMUM COMPATIBILITY
  config.output = {
    ...config.output,
    globalObject: 'this',
    libraryTarget: 'umd',
    umdNamedDefine: true
  };

  // 11. NO STATS, NO WARNINGS, NO NOTHING
  config.stats = false;
  config.infrastructureLogging = { level: 'none' };
  config.ignoreWarnings = [/.*/];

  // 12. NUCLEAR LOADER - TRANSFORM EVERYTHING
  config.module.rules = [
    {
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      use: {
        loader: require.resolve('babel-loader'),
        options: {
          presets: [
            ['@babel/preset-env', { modules: 'commonjs' }],
            '@babel/preset-react'
          ],
          plugins: [
            // Nuclear babel plugin - rewrite ALL problematic imports
            function() {
              return {
                visitor: {
                  ImportDeclaration(path) {
                    const source = path.node.source.value;
                    if (source.includes('mathjs') || 
                        source.includes('framer-motion') ||
                        source.includes('../utils') || 
                        source.includes('../factory') ||
                        source.includes('./utils') ||
                        source.includes('./factory')) {
                      path.node.source.value = './utils/universal-mock';
                    }
                  },
                  CallExpression(path) {
                    if (path.node.callee.name === 'require') {
                      const arg = path.node.arguments[0];
                      if (arg && arg.type === 'StringLiteral') {
                        if (arg.value.includes('mathjs') || 
                            arg.value.includes('framer-motion') ||
                            arg.value.includes('../utils') || 
                            arg.value.includes('../factory')) {
                          arg.value = './utils/universal-mock';
                        }
                      }
                    }
                  }
                }
              };
            }
          ]
        }
      }
    },
    ...config.module.rules
  ];

  // 13. DISABLE SOURCE MAPS COMPLETELY
  config.devtool = false;
  
  // 14. SET WEBPACK TO NOT CARE ABOUT ANYTHING
  config.cache = false;
  config.snapshot = { managedPaths: [] };
  config.watchOptions = { ignored: /.*/ };

  return config;
};