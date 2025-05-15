/**
 * Plugin Directory Access Module
 * 
 * This module provides functions to access plugin installation directories in IntelliJ IDEA
 * by communicating with the Junie Plugin Directory Access plugin via JVM Interop Layer.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// JVM process instance
let jvmProcess = null;
// Command queue for handling concurrent requests
const commandQueue = [];
// Flag to indicate if the JVM process is ready to accept commands
let jvmProcessReady = false;
// Flag to indicate if the JVM process is currently processing a command
let processingCommand = false;

/**
 * Initializes the JVM Interop Layer
 * @returns {Promise<boolean>} - True if initialization was successful
 */
async function initializeJvmInteropLayer() {
  if (jvmProcess !== null) {
    return true;
  }

  return new Promise((resolve, reject) => {
    try {
      // Find the Java executable
      const javaHome = process.env.JAVA_HOME;
      if (!javaHome) {
        throw new Error('JAVA_HOME environment variable not set');
      }

      const javaExecutable = path.join(javaHome, 'bin', 'java');

      // Find the path to the junie-intellij-plugin JAR
      const pluginJarPath = findPluginJarPath();
      if (!pluginJarPath) {
        throw new Error('Could not find junie-intellij-plugin JAR');
      }

      // Build the classpath
      const classpath = pluginJarPath;

      // Spawn the JVM process
      jvmProcess = spawn(javaExecutable, [
        '-cp', classpath,
        'com.junie.plugin.JvmInteropLauncher'
      ]);

      // Handle process output
      jvmProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();

        // Check if the JVM process is ready
        if (output === 'JVM Interop Layer initialized successfully') {
          jvmProcessReady = true;
          processNextCommand();
          resolve(true);
          return;
        }

        // Handle command response
        if (commandQueue.length > 0 && processingCommand) {
          const { resolve: cmdResolve, reject: cmdReject } = commandQueue[0];

          if (output.startsWith('SUCCESS: ')) {
            cmdResolve(output.substring('SUCCESS: '.length));
          } else if (output.startsWith('ERROR: ')) {
            cmdReject(new Error(output.substring('ERROR: '.length)));
          } else {
            console.log('JVM process output:', output);
          }

          // Remove the processed command from the queue
          commandQueue.shift();
          processingCommand = false;

          // Process the next command in the queue
          processNextCommand();
        } else {
          console.log('JVM process output:', output);
        }
      });

      jvmProcess.stderr.on('data', (data) => {
        console.error('JVM process error:', data.toString().trim());
      });

      jvmProcess.on('close', (code) => {
        console.log(`JVM process exited with code ${code}`);
        jvmProcess = null;
        jvmProcessReady = false;

        // Reject all pending commands
        while (commandQueue.length > 0) {
          const { reject } = commandQueue.shift();
          reject(new Error(`JVM process exited with code ${code}`));
        }
      });

      // Set a timeout for initialization
      setTimeout(() => {
        if (!jvmProcessReady) {
          reject(new Error('Timeout waiting for JVM process to initialize'));
        }
      }, 30000);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Finds the path to the junie-intellij-plugin JAR
 * @returns {string|null} - The path to the JAR, or null if not found
 */
function findPluginJarPath() {
  // Try to find the JAR in common locations
  const possibleLocations = [
    // Development location
    path.join(__dirname, '..', 'junie-intellij-plugin', 'build', 'libs'),
    // Installation location
    path.join(__dirname, 'lib')
  ];

  for (const location of possibleLocations) {
    if (fs.existsSync(location)) {
      const files = fs.readdirSync(location);
      const jarFile = files.find(file => file.startsWith('junie-intellij-plugin') && file.endsWith('.jar'));
      if (jarFile) {
        return path.join(location, jarFile);
      }
    }
  }

  return null;
}

/**
 * Processes the next command in the queue
 */
function processNextCommand() {
  if (commandQueue.length > 0 && !processingCommand && jvmProcessReady) {
    processingCommand = true;
    const { command } = commandQueue[0];
    jvmProcess.stdin.write(command + '\n');
  }
}

/**
 * Sends a command to the JVM process
 * @param {string} command - The command to send
 * @returns {Promise<string>} - The command result
 */
async function sendCommand(command) {
  if (!jvmProcess || !jvmProcessReady) {
    await initializeJvmInteropLayer();
  }

  return new Promise((resolve, reject) => {
    commandQueue.push({ command, resolve, reject });
    processNextCommand();
  });
}

/**
 * Gets the standard plugins directory path
 * @returns {Promise<string>} - The path to the plugins directory
 */
async function getPluginsPath() {
  try {
    return await sendCommand('get-plugins-path');
  } catch (error) {
    console.error('Error getting plugins path:', error.message);
    throw error;
  }
}

/**
 * Gets the installation path of a plugin by its ID
 * @param {string} pluginId - The ID of the plugin
 * @returns {Promise<string|null>} - The path to the plugin directory, or null if not found
 */
async function getPluginPath(pluginId) {
  try {
    return await sendCommand(`get-plugin-path ${pluginId}`);
  } catch (error) {
    console.error(`Error getting path for plugin ${pluginId}:`, error.message);
    return null;
  }
}

/**
 * Gets the installation path of the Junie plugin
 * @returns {Promise<string|null>} - The path to the Junie plugin directory, or null if not found
 */
async function getJuniePluginPath() {
  try {
    return await sendCommand('get-junie-plugin-path');
  } catch (error) {
    console.error('Error getting Junie plugin path:', error.message);
    return null;
  }
}

/**
 * Gets the path to a specific plugin in the standard plugins directory
 * @param {string} directoryName - The name of the plugin directory
 * @returns {Promise<string>} - The path to the plugin directory
 */
async function getPluginPathByDirectoryName(directoryName) {
  try {
    return await sendCommand(`get-plugin-path-by-directory-name ${directoryName}`);
  } catch (error) {
    console.error(`Error getting path for plugin directory ${directoryName}:`, error.message);
    throw error;
  }
}

/**
 * Gets the IDE version
 * @returns {Promise<string|null>} - The IDE version, or null if not available
 */
async function getIdeVersion() {
  try {
    return await sendCommand('get-ide-version');
  } catch (error) {
    console.error('Error getting IDE version:', error.message);
    return null;
  }
}

/**
 * Checks if the ActionManager is available
 * @returns {Promise<boolean>} - True if the ActionManager is available
 */
async function isActionManagerAvailable() {
  try {
    await sendCommand('get-action-manager');
    return true;
  } catch (error) {
    console.error('Error checking ActionManager availability:', error.message);
    return false;
  }
}

/**
 * Checks if the DataContext is available
 * @returns {Promise<boolean>} - True if the DataContext is available
 */
async function isDataContextAvailable() {
  try {
    await sendCommand('get-data-context');
    return true;
  } catch (error) {
    console.error('Error checking DataContext availability:', error.message);
    return false;
  }
}

/**
 * Terminates the JVM process
 * @returns {Promise<void>}
 */
async function terminateJvmProcess() {
  if (jvmProcess) {
    try {
      await sendCommand('exit');
    } catch (error) {
      console.error('Error terminating JVM process:', error.message);
    } finally {
      jvmProcess = null;
      jvmProcessReady = false;
    }
  }
}

module.exports = {
  getPluginsPath,
  getPluginPath,
  getJuniePluginPath,
  getPluginPathByDirectoryName,
  getIdeVersion,
  isActionManagerAvailable,
  isDataContextAvailable,
  initializeJvmInteropLayer,
  terminateJvmProcess
};
