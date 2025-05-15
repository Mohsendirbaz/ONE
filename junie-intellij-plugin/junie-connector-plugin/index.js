/**
 * Junie Connector Plugin
 * 
 * This plugin connects to the Junie plugin which is already installed in the IDE
 * and provides functionality to initialize sessions.
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const pluginDirectory = require('./plugin-directory');

/**
 * JunieConnector class provides methods to interact with the Junie plugin
 */
class JunieConnector {
  constructor(options = {}) {
    this.options = {
      juniePath: options.juniePath || path.join(process.cwd(), '.junie'),
      logLevel: options.logLevel || 'info',
      ...options
    };

    this.sessionActive = false;
    this.sessionId = null;
    this.junieValidated = false;

    // We'll validate asynchronously, but don't wait for it in the constructor
    this.validateJunieInstallation()
      .then(valid => {
        this.junieValidated = valid;
        if (valid) {
          console.log('Junie validation completed successfully');
        } else {
          console.warn('Junie validation failed');
        }
      })
      .catch(error => {
        console.error('Error during Junie validation:', error);
        this.junieValidated = false;
      });
  }

  /**
   * Validates that Junie is installed and accessible
   * @returns {Promise<boolean>} - True if Junie is installed and accessible
   */
  async validateJunieInstallation() {
    try {
      // First try to initialize the JVM Interop Layer
      const jvmInitialized = await this.initializeJvmInteropLayer();
      if (jvmInitialized) {
        console.log('JVM Interop Layer initialized successfully');

        // Check if the ActionManager and DataContext are available
        const actionManagerAvailable = await this.isActionManagerAvailable();
        const dataContextAvailable = await this.isDataContextAvailable();

        if (actionManagerAvailable && dataContextAvailable) {
          console.log('ActionManager and DataContext are available');
        } else {
          console.warn('ActionManager or DataContext not available');
        }

        // Get the IDE version
        const ideVersion = await this.getIdeVersion();
        if (ideVersion) {
          console.log(`IDE version: ${ideVersion}`);
        } else {
          console.warn('IDE version not available');
        }

        // Try to find Junie plugin using the JVM Interop Layer
        const juniePluginPath = await this.getJuniePluginPath();
        if (juniePluginPath) {
          console.log(`Junie plugin found at ${juniePluginPath}`);

          // If we found the plugin but the .junie directory doesn't exist,
          // we'll create it to store our session data
          if (!fs.existsSync(this.options.juniePath)) {
            fs.ensureDirSync(this.options.juniePath);

            // Create a basic guidelines.md file if it doesn't exist
            const guidelinesPath = path.join(this.options.juniePath, 'guidelines.md');
            if (!fs.existsSync(guidelinesPath)) {
              fs.writeFileSync(guidelinesPath, '# Project Guidelines\n\nThis is a placeholder of the project guidelines for Junie.');
            }
          }

          return true;
        }
      } else {
        console.warn('JVM Interop Layer initialization failed, falling back to directory check');
      }

      // Fall back to checking for the .junie directory
      if (!fs.existsSync(this.options.juniePath)) {
        throw new Error(`Junie directory not found at ${this.options.juniePath}`);
      }

      const guidelinesPath = path.join(this.options.juniePath, 'guidelines.md');
      if (!fs.existsSync(guidelinesPath)) {
        throw new Error(`Junie guidelines not found at ${guidelinesPath}`);
      }

      console.log(`Junie installation validated at ${this.options.juniePath}`);
      return true;
    } catch (error) {
      console.error(`Error validating Junie installation: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets the installation path of the Junie plugin
   * @returns {Promise<string|null>} - The path to the Junie plugin directory, or null if not found
   */
  async getJuniePluginPath() {
    try {
      return await pluginDirectory.getJuniePluginPath();
    } catch (error) {
      console.error(`Error getting Junie plugin path: ${error.message}`);
      return null;
    }
  }

  /**
   * Gets the standard plugins directory path
   * @returns {Promise<string>} - The path to the plugins directory
   */
  async getPluginsPath() {
    try {
      return await pluginDirectory.getPluginsPath();
    } catch (error) {
      console.error(`Error getting plugins path: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets the installation path of a plugin by its ID
   * @param {string} pluginId - The ID of the plugin
   * @returns {Promise<string|null>} - The path to the plugin directory, or null if not found
   */
  async getPluginPath(pluginId) {
    try {
      return await pluginDirectory.getPluginPath(pluginId);
    } catch (error) {
      console.error(`Error getting path for plugin ${pluginId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Gets the IDE version
   * @returns {Promise<string|null>} - The IDE version, or null if not available
   */
  async getIdeVersion() {
    try {
      return await pluginDirectory.getIdeVersion();
    } catch (error) {
      console.error(`Error getting IDE version: ${error.message}`);
      return null;
    }
  }

  /**
   * Checks if the ActionManager is available
   * @returns {Promise<boolean>} - True if the ActionManager is available
   */
  async isActionManagerAvailable() {
    try {
      return await pluginDirectory.isActionManagerAvailable();
    } catch (error) {
      console.error(`Error checking ActionManager availability: ${error.message}`);
      return false;
    }
  }

  /**
   * Checks if the DataContext is available
   * @returns {Promise<boolean>} - True if the DataContext is available
   */
  async isDataContextAvailable() {
    try {
      return await pluginDirectory.isDataContextAvailable();
    } catch (error) {
      console.error(`Error checking DataContext availability: ${error.message}`);
      return false;
    }
  }

  /**
   * Initializes the JVM Interop Layer
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initializeJvmInteropLayer() {
    try {
      return await pluginDirectory.initializeJvmInteropLayer();
    } catch (error) {
      console.error(`Error initializing JVM Interop Layer: ${error.message}`);
      return false;
    }
  }

  /**
   * Terminates the JVM process
   * @returns {Promise<void>}
   */
  async terminateJvmProcess() {
    try {
      await pluginDirectory.terminateJvmProcess();
    } catch (error) {
      console.error(`Error terminating JVM process: ${error.message}`);
    }
  }

  /**
   * Initializes a new session with Junie
   * @param {Object} sessionConfig - Configuration for the session
   * @returns {Promise<String>} - Session ID if successful, null otherwise
   */
  async initializeSession(sessionConfig = {}) {
    try {
      // Ensure Junie is installed before initializing a session
      if (!this.junieValidated) {
        const isValid = await this.validateJunieInstallation();
        if (!isValid) {
          throw new Error('Junie is not installed or accessible');
        }
        this.junieValidated = true;
      }

      if (this.sessionActive) {
        console.warn('A session is already active. Terminating the current session before starting a new one.');
        await this.terminateSession();
      }

      // Initialize the JVM Interop Layer if not already initialized
      await this.initializeJvmInteropLayer();

      // Try to get the Junie plugin path to include in the session data
      const juniePluginPath = await this.getJuniePluginPath();

      // Try to get the IDE version to include in the session data
      let ideVersion = null;
      try {
        ideVersion = await this.getIdeVersion();
      } catch (versionError) {
        console.warn(`Could not get IDE version for session initialization: ${versionError.message}`);
      }

      // Check if the ActionManager and DataContext are available
      let actionManagerAvailable = false;
      let dataContextAvailable = false;
      try {
        actionManagerAvailable = await this.isActionManagerAvailable();
        dataContextAvailable = await this.isDataContextAvailable();
      } catch (error) {
        console.warn(`Could not check ActionManager and DataContext availability: ${error.message}`);
      }

      // Generate a unique session ID
      this.sessionId = `junie-session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Create session directory if it doesn't exist
      const sessionDir = path.join(this.options.juniePath, 'sessions');
      fs.ensureDirSync(sessionDir);

      // Create session file with configuration
      const sessionFile = path.join(sessionDir, `${this.sessionId}.json`);
      const sessionData = {
        id: this.sessionId,
        createdAt: new Date().toISOString(),
        config: sessionConfig,
        status: 'active',
        juniePluginPath: juniePluginPath || 'unknown',
        ideVersion: ideVersion || 'unknown',
        actionManagerAvailable,
        dataContextAvailable,
        jvmInteropLayerInitialized: true
      };

      fs.writeJsonSync(sessionFile, sessionData, { spaces: 2 });

      this.sessionActive = true;
      console.log(`Session initialized with ID: ${this.sessionId}`);

      return this.sessionId;
    } catch (error) {
      console.error(`Error initializing session: ${error.message}`);
      return null;
    }
  }

  /**
   * Terminates the current session
   * @returns {Promise<Boolean>} - True if successful
   */
  async terminateSession() {
    try {
      if (!this.sessionActive || !this.sessionId) {
        console.warn('No active session to terminate');
        return false;
      }

      const sessionDir = path.join(this.options.juniePath, 'sessions');
      const sessionFile = path.join(sessionDir, `${this.sessionId}.json`);

      if (fs.existsSync(sessionFile)) {
        const sessionData = fs.readJsonSync(sessionFile);
        sessionData.status = 'terminated';
        sessionData.terminatedAt = new Date().toISOString();

        // Try to get the Junie plugin path to include in the session data
        try {
          const juniePluginPath = await this.getJuniePluginPath();
          if (juniePluginPath) {
            sessionData.juniePluginPath = juniePluginPath;
          }
        } catch (pathError) {
          console.warn(`Could not get Junie plugin path for session termination: ${pathError.message}`);
        }

        // Try to get the IDE version to include in the session data
        try {
          const ideVersion = await this.getIdeVersion();
          if (ideVersion) {
            sessionData.ideVersion = ideVersion;
          }
        } catch (versionError) {
          console.warn(`Could not get IDE version for session termination: ${versionError.message}`);
        }

        fs.writeJsonSync(sessionFile, sessionData, { spaces: 2 });
      }

      this.sessionActive = false;
      console.log(`Session ${this.sessionId} terminated`);
      this.sessionId = null;

      // Terminate the JVM process when the session is terminated
      await this.terminateJvmProcess();

      return true;
    } catch (error) {
      console.error(`Error terminating session: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets the current session status
   * @returns {Promise<Object>} - Session status information
   */
  async getSessionStatus() {
    if (!this.sessionActive || !this.sessionId) {
      return { active: false };
    }

    try {
      const sessionDir = path.join(this.options.juniePath, 'sessions');
      const sessionFile = path.join(sessionDir, `${this.sessionId}.json`);

      if (fs.existsSync(sessionFile)) {
        const sessionData = fs.readJsonSync(sessionFile);

        // Try to get the current Junie plugin path
        try {
          const juniePluginPath = await this.getJuniePluginPath();
          if (juniePluginPath) {
            sessionData.currentJuniePluginPath = juniePluginPath;
          }
        } catch (pathError) {
          console.warn(`Could not get current Junie plugin path: ${pathError.message}`);
        }

        // Try to get the plugins directory path
        try {
          const pluginsPath = await this.getPluginsPath();
          if (pluginsPath) {
            sessionData.pluginsPath = pluginsPath;
          }
        } catch (pathError) {
          console.warn(`Could not get plugins path: ${pathError.message}`);
        }

        // Try to get the IDE version
        try {
          const ideVersion = await this.getIdeVersion();
          if (ideVersion) {
            sessionData.ideVersion = ideVersion;
          }
        } catch (versionError) {
          console.warn(`Could not get IDE version: ${versionError.message}`);
        }

        // Check if the ActionManager and DataContext are available
        try {
          const actionManagerAvailable = await this.isActionManagerAvailable();
          const dataContextAvailable = await this.isDataContextAvailable();
          sessionData.actionManagerAvailable = actionManagerAvailable;
          sessionData.dataContextAvailable = dataContextAvailable;
        } catch (error) {
          console.warn(`Could not check ActionManager and DataContext availability: ${error.message}`);
        }

        return {
          active: this.sessionActive,
          id: this.sessionId,
          ...sessionData
        };
      }

      return { 
        active: this.sessionActive,
        id: this.sessionId,
        error: 'Session file not found'
      };
    } catch (error) {
      console.error(`Error getting session status: ${error.message}`);
      return { 
        active: this.sessionActive,
        id: this.sessionId,
        error: error.message
      };
    }
  }
}

// Export the JunieConnector class
module.exports = JunieConnector;
