#!/usr/bin/env node
/**
 * Script to run the active-files-tracker ESLint rule
 * This will analyze the project and generate a report file
 * 
 * This is the core script that initiates the dependency analysis process
 * starting from the entry point (index.js) and recursively tracing all imports
 * 
 * Optimized for better performance with:
 * - Asynchronous execution
 * - Better error handling
 * - Progress reporting
 * - Conditional execution with command-line flags
 * - Dedicated logging for troubleshooting
 */

// Direct console output at script start to ensure visibility
console.log('Active Files Tracker - Script Starting');
console.log('---------------------------------------');

const { ESLint } = require('eslint');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const logger = require('./logger');

// Convert exec to a promise-based function
const execAsync = util.promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  skipRestore: args.includes('--skip-restore'),
  skipConfig: args.includes('--skip-config'),
  skipGraph: args.includes('--skip-graph'),
  skipMark: args.includes('--skip-mark'),
  forceRestore: args.includes('--force-restore'),
  verbose: args.includes('--verbose'),
  baseDir: args.find(arg => arg.startsWith('--base-dir='))?.split('=')[1] || null
};

// Helper function to log verbose messages
const logVerbose = (message) => {
  logger.verbose(message, options.verbose);
};

// Helper function to execute a command with proper error handling
const runCommand = async (command, description) => {
  try {
    logger.info(`\n${description}...`);
    const { stdout, stderr } = await execAsync(command);

    // Log the command execution
    logger.command(command, stdout);

    if (options.verbose && stdout) {
      logVerbose(stdout);
    }
    if (stderr) {
      logger.warn(`Warning during ${description.toLowerCase()}:`);
      logger.warn(stderr);
    }
    logger.info(`✓ ${description} completed successfully.`);
    return true;
  } catch (error) {
    logger.error(`Error during ${description.toLowerCase()}: ${error.message}`);
    if (options.verbose && error.stdout) {
      logVerbose(error.stdout);
    }
    if (error.stderr) {
      logger.error(error.stderr);
      logger.command(command, error.stderr, true);
    }
    return false;
  }
};

// Helper function to check if a file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    logger.error(`Error checking if file exists (${filePath}): ${error.message}`);
    return false;
  }
};

// Helper function to read and parse JSON file
const readJsonFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    logger.error(`Error reading JSON file (${filePath}): ${error.message}`);
    return null;
  }
};

async function main() {
  // Direct console output to ensure visibility in terminal
  console.log('=== Active Files Analysis ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('Initializing...');

  try {
    logger.info('Starting active files analysis...');
    logger.info('This will identify all files that are imported (directly or indirectly) from the entry point');
    logger.info(`Log file: ${logger.getLogFile()}`);

    if (options.verbose) {
      logger.info('\nCommand line options:');
      logger.info(JSON.stringify(options, null, 2));
    }

    // Check if the plugin is installed
    // Try both the current directory and one level up (project root)
    let pluginPath = path.resolve(__dirname, './eslint-plugin-active-files');
    if (!fileExists(pluginPath)) {
      // Try one level up (project root)
      pluginPath = path.resolve(__dirname, '../eslint-plugin-active-files');
      if (!fileExists(pluginPath)) {
        logger.error('Error: eslint-plugin-active-files not found.');
        logger.error('Checked locations:');
        logger.error(`- ${path.resolve(__dirname, './eslint-plugin-active-files')}`);
        logger.error(`- ${path.resolve(__dirname, '../eslint-plugin-active-files')}`);
        logger.info('Please make sure the plugin is installed in the project directory.');
        process.exit(1);
      } else {
        logger.info(`Found plugin at: ${pluginPath}`);
      }
    } else {
      logger.info(`Found plugin at: ${pluginPath}`);
    }

    // Restore original filenames before analysis if not skipped
    if (!options.skipRestore) {
      const restoreScriptPath = path.resolve(__dirname, './restore-filenames.js');
      if (fileExists(restoreScriptPath)) {
        const restoreCommand = options.forceRestore 
          ? `node "${restoreScriptPath}" --force` 
          : `node "${restoreScriptPath}"`;

        const restoreSuccess = await runCommand(
          restoreCommand, 
          'Restoring original filenames before analysis'
        );

        if (!restoreSuccess) {
          logger.warn('WARNING: Continuing with analysis, but results may be affected by unrestored filenames.');
        }
      } else {
        logger.warn('WARNING: restore-filenames.js not found. Running analysis without restoration may lead to prefix accumulation.');
      }
    } else {
      logger.info('Skipping filename restoration (--skip-restore flag detected)');
    }

    // Determine the project root directory
    let baseDir;
    if (options.baseDir) {
      // Use the provided base directory
      baseDir = path.resolve(options.baseDir);
      logger.info(`Using provided base directory: ${baseDir}`);
    } else {
      // Try to determine the project root directory automatically
      logger.info('No base directory provided, attempting to determine project root automatically...');

      // Start with the parent directory of the current script
      baseDir = path.resolve(__dirname, '..');
      logger.info(`Starting with directory: ${baseDir}`);

      // Check if this is a valid project root by looking for common project files
      const projectRootIndicators = [
        'package.json',
        '.git',
        'node_modules',
        '.eslintrc.js',
        '.eslintrc.json'
      ];

      let foundIndicators = projectRootIndicators.filter(indicator => 
        fileExists(path.join(baseDir, indicator))
      );

      if (foundIndicators.length > 0) {
        logger.info(`Found project root indicators: ${foundIndicators.join(', ')}`);
      } else {
        // If no indicators found, try going up one more level
        const parentDir = path.resolve(baseDir, '..');
        logger.info(`No project indicators found, trying parent directory: ${parentDir}`);

        foundIndicators = projectRootIndicators.filter(indicator => 
          fileExists(path.join(parentDir, indicator))
        );

        if (foundIndicators.length > 0) {
          baseDir = parentDir;
          logger.info(`Found project root indicators in parent directory: ${foundIndicators.join(', ')}`);
        } else {
          // If still no indicators found, fall back to current working directory
          baseDir = process.cwd();
          logger.info(`No project indicators found in parent directory either, falling back to current working directory: ${baseDir}`);
        }
      }
    }

    logger.info(`Using base directory: ${baseDir}`);

    // Check for entry point file in common locations
    const possibleEntryPoints = [
      path.resolve(baseDir, 'src/index.js'),
      path.resolve(baseDir, 'src/app.js'),
      path.resolve(baseDir, 'src/main.js'),
      path.resolve(baseDir, 'index.js'),
      path.resolve(baseDir, 'app.js'),
      path.resolve(baseDir, 'main.js')
    ];

    let entryPoint = null;
    for (const possibleEntryPoint of possibleEntryPoints) {
      if (fileExists(possibleEntryPoint)) {
        entryPoint = possibleEntryPoint;
        logger.info(`Found entry point at: ${entryPoint}`);
        break;
      }
    }

    if (!entryPoint) {
      logger.error('Error: Entry point file not found.');
      logger.error('Checked locations:');
      possibleEntryPoints.forEach(location => {
        logger.error(`- ${location}`);
      });
      logger.info('Please make sure the entry point file exists or update the entryPoint option in the ESLint rule configuration.');
      logger.info('You can specify a different base directory with --base-dir=path/to/project');
      process.exit(1);
    }

    logger.info(`\nAnalyzing project starting from: ${entryPoint}`);
    logger.info('This is the entry point from which all dependencies will be traced');

    // Set the environment variable to enable the analysis in the ESLint rule
    process.env.ANALYZE_ACTIVE_FILES = 'true';
    logVerbose('ANALYZE_ACTIVE_FILES environment variable set to true');

    // Create ESLint instance with overridden configuration to enable the rule
    // Use the path to the entry point relative to the base directory
    const entryPointRelative = path.relative(baseDir, entryPoint).replace(/\\/g, '/');
    logger.info(`Using relative entry point path for ESLint configuration: ${entryPointRelative}`);

    // Set the base directory as an environment variable for the ESLint rule
    process.env.PROJECT_BASE_DIR = baseDir;
    logVerbose(`PROJECT_BASE_DIR environment variable set to ${baseDir}`);

    // Determine the plugin path to use for ESLint
    // If we're in the Active-Inactive-Marking directory, we need to use the plugin from one level up
    const pluginPathForEslint = pluginPath.includes('Active-Inactive-Marking') 
      ? path.resolve('../eslint-plugin-active-files')
      : pluginPath;

    logger.info(`Using plugin path for ESLint: ${pluginPathForEslint}`);

    // Create a custom ESLint configuration that explicitly registers the plugin
    const eslint = new ESLint({
      useEslintrc: false, // Don't use the project's .eslintrc file
      resolvePluginsRelativeTo: path.dirname(pluginPathForEslint), // Tell ESLint where to find the plugin
      overrideConfig: {
        plugins: ['active-files'], // Register the plugin in the config
        parserOptions: {
          ecmaVersion: 2020, // Use a modern ECMAScript version
          sourceType: 'module', // Enable ES modules
          ecmaFeatures: {
            jsx: true // Enable JSX
          }
        },
        env: {
          es6: true, // Enable ES6 globals
          browser: true, // Enable browser globals
          node: true // Enable Node.js globals
        },
        rules: {
          // Temporarily set the rule to "warn" for analysis
          'active-files/active-files-tracker': [
            'warn', 
            { 
              entryPoint: entryPointRelative,
              silentMode: false // Explicitly disable silent mode for analysis
            }
          ]
        }
      }
    });

    logger.info('\nRunning ESLint with active-files-tracker rule...');
    logger.info('This will recursively trace all imports starting from index.js');

    // Run ESLint on the entry point to generate the report
    let results;
    try {
      // Ensure the entry point file is accessible and readable
      try {
        const entryPointContent = fs.readFileSync(entryPoint, 'utf8');
        logVerbose(`Successfully read entry point file (${entryPointContent.length} bytes)`);
      } catch (readError) {
        logger.error(`Error reading entry point file: ${readError.message}`);
        logger.error('This may prevent the ESLint rule from analyzing the file properly.');
        // Continue execution to see if ESLint can still process it
      }

      // Run ESLint on the entry point file
      logger.info(`Running ESLint on entry point: ${entryPoint}`);
      results = await eslint.lintFiles([entryPoint]);

      // Verify that results were returned for the entry point
      if (results.length === 0) {
        logger.warn('WARNING: ESLint did not return any results for the entry point file.');
        logger.warn('This may indicate that the file was not processed correctly.');
      } else {
        logVerbose(`ESLint analysis completed with ${results.length} result(s)`);

        // Check if the active-files-tracker rule was actually applied
        let ruleApplied = false;
        for (const result of results) {
          if (result.messages && result.messages.some(msg => msg.ruleId === 'active-files/active-files-tracker')) {
            ruleApplied = true;
            logVerbose('The active-files-tracker rule was successfully applied to the entry point file.');
            break;
          }
        }

        if (!ruleApplied) {
          logger.warn('WARNING: The active-files-tracker rule was not applied to the entry point file.');
          logger.warn('This may be due to a configuration issue with ESLint or the plugin.');
        }
      }
    } catch (error) {
      logger.error(`Error running ESLint analysis: ${error.message}`);
      process.exit(1);
    }

    // Process results
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);

    logger.info('\nAnalysis Results:');
    logger.info(resultText);

    // Check if the report file was generated in the base directory or alternative locations
    let reportPath = path.resolve(baseDir, 'active-files-report.json');

    // Check if the report file exists in the expected location
    if (!fileExists(reportPath)) {
      logger.info(`Report file not found at expected location: ${reportPath}`);
      logger.info('Checking alternative locations...');

      // Check alternative locations where the report might have been generated
      const alternativeLocations = [
        path.resolve(process.cwd(), 'active-files-report.json'),
        path.resolve(__dirname, 'active-files-report.json'),
        path.resolve(__dirname, '..', 'active-files-report.json')
      ];

      // Filter out duplicates (in case baseDir is the same as one of the alternatives)
      const uniqueLocations = alternativeLocations.filter(location => 
        location !== reportPath && fileExists(location)
      );

      // Check if the report file exists in any of the alternative locations
      if (uniqueLocations.length > 0) {
        reportPath = uniqueLocations[0];
        logger.info(`Found report file at alternative location: ${reportPath}`);
      } else {
        logger.error('Error: Report file was not generated.');
        logger.error('Checked locations:');
        logger.error(`- ${reportPath}`);
        alternativeLocations.forEach(location => {
          logger.error(`- ${location}`);
        });

        // Additional debugging information to help diagnose the issue
        logger.error('\nDebugging information:');

        // We already checked the entry point earlier, so just report its status
        logger.error(`- Entry point file: ${entryPoint}`);

        // We already checked the plugin earlier, so just report its status
        logger.error(`- ESLint plugin directory: ${pluginPath}`);

        // Check if the rule file exists
        const rulePath = path.join(pluginPath, 'rules/active-files-tracker.js');
        if (!fileExists(rulePath)) {
          logger.error(`- ESLint rule file not found: ${rulePath}`);
        } else {
          logger.error(`- ESLint rule file exists: ${rulePath}`);
        }

        // Check if the environment variables were properly set
        logger.error(`- ANALYZE_ACTIVE_FILES environment variable: ${process.env.ANALYZE_ACTIVE_FILES || 'not set'}`);
        logger.error(`- PROJECT_BASE_DIR environment variable: ${process.env.PROJECT_BASE_DIR || 'not set'}`);
        logger.error(`- ESLint configuration entry point: ${entryPointRelative}`);

        // Instead of creating an empty report file, exit with an error
        logger.error('\nThe analysis failed to generate a valid report file.');
        logger.error('This is likely due to a configuration issue with ESLint or the plugin.');
        logger.error('Please fix the issues above and run the analysis again.');

        // Exit with an error code to indicate failure
        process.exit(1);
      }
    } else {
      logger.info(`Found report file at expected location: ${reportPath}`);
    }

    // Read the report file
    const report = readJsonFile(reportPath);
    if (!report) {
      logger.error('Error: Failed to parse the report file.');
      process.exit(1);
    }

    // Validate the report file has meaningful content
    if (!report.activeFiles || !report.inactiveFiles) {
      logger.error('Error: Report file is missing required fields (activeFiles or inactiveFiles).');
      process.exit(1);
    }

    // Check if the report is empty (no active or inactive files)
    if (report.activeFiles.length === 0 && report.inactiveFiles.length === 0) {
      logger.error('Error: Report file contains no files. This indicates an issue with the analysis.');
      logger.error('Please check the entry point file and try again.');
      process.exit(1);
    }

    // Check if the report has the enhanced dependency information
    const hasEnhancedInfo = report.dependencyLayers && report.importedBy;

    logger.info('\nSummary:');
    logger.info(`Active files: ${report.activeFiles.length}`);
    logger.info(`Inactive files: ${report.inactiveFiles.length}`);
    logger.info(`Standalone files: ${report.standaloneFiles.length}`);
    logger.info(`Total files: ${report.activeFiles.length + report.inactiveFiles.length}`);

    // Display line count information if available
    if (report.fileLinesCount) {
      // Calculate total lines
      let totalActiveLines = 0;
      let totalInactiveLines = 0;
      let largestActiveFile = { file: '', lines: 0 };
      let largestInactiveFile = { file: '', lines: 0 };

      // Process active files
      report.activeFiles.forEach(file => {
        const lines = report.fileLinesCount[file] || 0;
        totalActiveLines += lines;

        // Track largest file
        if (lines > largestActiveFile.lines) {
          largestActiveFile = { file, lines };
        }
      });

      // Process inactive files
      report.inactiveFiles.forEach(file => {
        const lines = report.fileLinesCount[file] || 0;
        totalInactiveLines += lines;

        // Track largest file
        if (lines > largestInactiveFile.lines) {
          largestInactiveFile = { file, lines };
        }
      });

      logger.info('\nLine count information:');
      logger.info(`Total lines in active files: ${totalActiveLines}`);
      logger.info(`Total lines in inactive files: ${totalInactiveLines}`);
      logger.info(`Total lines in all files: ${totalActiveLines + totalInactiveLines}`);
      logger.info(`Average lines per active file: ${Math.round(totalActiveLines / (report.activeFiles.length || 1))}`);
      logger.info(`Average lines per inactive file: ${Math.round(totalInactiveLines / (report.inactiveFiles.length || 1))}`);

      // Display information about largest files
      logger.info('\nLargest files by line count:');
      if (largestActiveFile.file) {
        logger.info(`Largest active file: ${largestActiveFile.file} (${largestActiveFile.lines} lines)`);
      }
      if (largestInactiveFile.file) {
        logger.info(`Largest inactive file: ${largestInactiveFile.file} (${largestInactiveFile.lines} lines)`);
      }

      // Display top 5 largest active files
      if (report.activeFiles.length > 0) {
        logger.info('\nTop 5 largest active files:');
        report.activeFiles
          .map(file => ({ file, lines: report.fileLinesCount[file] || 0 }))
          .sort((a, b) => b.lines - a.lines)
          .slice(0, 5)
          .forEach((item, index) => {
            logger.info(`  ${index + 1}. ${item.file} (${item.lines} lines)`);
          });
      }
    }

    if (hasEnhancedInfo) {
      logger.info(`Dependency layers: ${Object.keys(report.dependencyLayers).length}`);

      // Log some statistics about the dependency layers
      const layerCounts = {};
      Object.keys(report.dependencyLayers).forEach(layer => {
        layerCounts[layer] = report.dependencyLayers[layer].length;
      });

      logger.info('\nFiles per dependency layer:');
      Object.keys(layerCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(layer => {
        logger.info(`  Layer ${layer}: ${layerCounts[layer]} files`);
      });
    }

    // Run additional steps in parallel for better performance
    const pendingTasks = [];

    // Update the ESLint configuration with the list of inactive files
    if (!options.skipConfig) {
      const updateConfigPath = path.resolve(__dirname, './update-eslint-config.js');
      if (fileExists(updateConfigPath)) {
        pendingTasks.push(
          runCommand(
            `node "${updateConfigPath}" --report="${reportPath}"`, 
            'Updating ESLint configuration with inactive files'
          )
        );
      } else {
        logger.warn('WARNING: update-eslint-config.js not found. Skipping ESLint configuration update.');
      }
    } else {
      logger.info('\nSkipping ESLint configuration update (--skip-config flag detected)');
    }

    // Generate the dependency graph visualization if the script exists
    if (!options.skipGraph && hasEnhancedInfo) {
      const visualizationScriptPath = path.resolve(__dirname, './generate-dependency-graph.js');
      if (fileExists(visualizationScriptPath)) {
        pendingTasks.push(
          runCommand(
            `node "${visualizationScriptPath}"`, 
            'Generating dependency graph visualization'
          )
        );
      } else {
        logger.info('\nSkipping dependency graph generation (generate-dependency-graph.js not found)');
      }
    } else {
      if (options.skipGraph) {
        logger.info('\nSkipping dependency graph generation (--skip-graph flag detected)');
      } else if (!hasEnhancedInfo) {
        logger.info('\nSkipping dependency graph generation (enhanced dependency information not available)');
      }
    }

    // Wait for all pending tasks to complete
    if (pendingTasks.length > 0) {
      logger.info(`\nExecuting ${pendingTasks.length} additional tasks in parallel...`);
      await Promise.all(pendingTasks);
      logger.info('All additional tasks completed.');
    }

    // Run the mark-active-files.js script (this should be run after all other tasks)
    if (!options.skipMark) {
      const markFilesPath = path.resolve(__dirname, './mark-active-files.js');
      if (fileExists(markFilesPath)) {
        // Pass the report path to the script
        await runCommand(
          `node "${markFilesPath}" --report="${reportPath}"`, 
          'Running mark-active-files.js to rename files'
        );
      } else {
        logger.warn('WARNING: mark-active-files.js not found. Skipping file marking.');
      }
    } else {
      logger.info('\nSkipping file marking (--skip-mark flag detected)');
    }

    logger.info('\nAnalysis complete!');
    logger.info(`Report file generated at: ${reportPath}`);
    logger.info(`Base directory used: ${baseDir}`);
    logger.info('\nTo restore original filenames, run:');
    logger.info('node restore-filenames.js');
    logger.info(`\nLog file has been saved to: ${logger.getLogFile()}`);

    logger.info('\nIf the analysis did not scan the correct project, you can specify a different base directory:');
    logger.info('node run-active-files-analysis.js --base-dir=path/to/project');

  } catch (error) {
    logger.error(`Error running analysis: ${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Display help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node run-active-files-analysis.js [options]

Options:
  --skip-restore    Skip restoring original filenames before analysis
  --skip-config     Skip updating ESLint configuration
  --skip-graph      Skip generating dependency graph visualization
  --skip-mark       Skip marking files with [A]_ or [I]_ prefixes
  --force-restore   Use force mode when restoring filenames
  --verbose         Display more detailed output
  --base-dir=path   Specify the base directory for the project (default: ..)
  --help, -h        Display this help message

Examples:
  node run-active-files-analysis.js --skip-mark --verbose
  node run-active-files-analysis.js --base-dir=C:\\path\\to\\project
  node run-active-files-analysis.js --base-dir=..\\another-project
`);
  process.exit(0);
}

main().then(() => {
  // Direct console output at script end to ensure visibility
  console.log('---------------------------------------');
  console.log('Active Files Tracker - Script Completed');
}).catch(error => {
  // If logger is initialized, use it; otherwise fall back to console.error
  if (typeof logger !== 'undefined') {
    logger.error(`Unhandled error: ${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
  } else {
    console.error('Unhandled error:', error);
  }
  // Direct console output for errors to ensure visibility
  console.log('---------------------------------------');
  console.log('Active Files Tracker - Script Failed');
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
