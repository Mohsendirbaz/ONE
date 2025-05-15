/**
 * IDE Integration Example for Junie Connector Plugin
 * 
 * This file demonstrates how to integrate the Junie Connector Plugin
 * with an IDE environment. It provides a simple API that can be used
 * by IDE extensions or plugins to interact with the Junie plugin.
 */

const JunieConnector = require('./index');

/**
 * JunieIdeIntegration class provides methods for IDE integration
 */
class JunieIdeIntegration {
  constructor(options = {}) {
    this.connector = new JunieConnector(options);
    this.activeSessions = new Map();
  }

  /**
   * Initializes a new session for a specific IDE project
   * @param {String} projectId - Unique identifier for the IDE project
   * @param {Object} config - Session configuration
   * @returns {Promise<Object>} - Session information
   */
  async initializeProjectSession(projectId, config = {}) {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Check if a session already exists for this project
    if (this.activeSessions.has(projectId)) {
      console.warn(`A session already exists for project ${projectId}. Terminating the existing session.`);
      await this.terminateProjectSession(projectId);
    }

    // Try to get the Junie plugin path to include in the session configuration
    let juniePluginPath = null;
    try {
      juniePluginPath = await this.connector.getJuniePluginPath();
    } catch (error) {
      console.warn(`Could not get Junie plugin path: ${error.message}`);
    }

    // Initialize a new session with project-specific configuration
    const sessionConfig = {
      ...config,
      projectId,
      ideIntegration: true,
      startedAt: new Date().toISOString(),
      juniePluginPath: juniePluginPath || 'unknown'
    };

    const sessionId = await this.connector.initializeSession(sessionConfig);

    if (!sessionId) {
      throw new Error(`Failed to initialize session for project ${projectId}`);
    }

    // Store the session information
    const sessionInfo = {
      id: sessionId,
      projectId,
      startedAt: new Date(),
      config: sessionConfig,
      juniePluginPath
    };

    this.activeSessions.set(projectId, sessionInfo);

    return sessionInfo;
  }

  /**
   * Terminates a session for a specific IDE project
   * @param {String} projectId - Unique identifier for the IDE project
   * @returns {Promise<Boolean>} - True if successful
   */
  async terminateProjectSession(projectId) {
    if (!projectId || !this.activeSessions.has(projectId)) {
      console.warn(`No active session found for project ${projectId}`);
      return false;
    }

    const sessionInfo = this.activeSessions.get(projectId);

    // Set the current session ID in the connector
    this.connector.sessionId = sessionInfo.id;
    this.connector.sessionActive = true;

    // Terminate the session
    const terminated = await this.connector.terminateSession();

    if (terminated) {
      this.activeSessions.delete(projectId);
      return true;
    }

    return false;
  }

  /**
   * Gets the status of a session for a specific IDE project
   * @param {String} projectId - Unique identifier for the IDE project
   * @returns {Promise<Object>} - Session status information
   */
  async getProjectSessionStatus(projectId) {
    if (!projectId || !this.activeSessions.has(projectId)) {
      return { active: false, projectId };
    }

    const sessionInfo = this.activeSessions.get(projectId);

    // Set the current session ID in the connector
    this.connector.sessionId = sessionInfo.id;
    this.connector.sessionActive = true;

    // Get the session status
    const status = await this.connector.getSessionStatus();

    // Try to get the current Junie plugin path
    try {
      const juniePluginPath = await this.connector.getJuniePluginPath();
      if (juniePluginPath) {
        status.currentJuniePluginPath = juniePluginPath;
      }
    } catch (error) {
      console.warn(`Could not get current Junie plugin path: ${error.message}`);
    }

    return {
      ...status,
      projectId
    };
  }

  /**
   * Gets all active sessions
   * @returns {Array} - List of active sessions
   */
  getAllActiveSessions() {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Terminates all active sessions
   * @returns {Promise<Object>} - Result with count of terminated sessions
   */
  async terminateAllSessions() {
    const projectIds = Array.from(this.activeSessions.keys());
    let terminatedCount = 0;

    for (const projectId of projectIds) {
      if (await this.terminateProjectSession(projectId)) {
        terminatedCount++;
      }
    }

    return {
      success: true,
      terminatedCount,
      totalCount: projectIds.length
    };
  }
}

// Export the JunieIdeIntegration class
module.exports = JunieIdeIntegration;

// Example usage in an IDE plugin
if (require.main === module) {
  const integration = new JunieIdeIntegration();

  // Example: Initialize a session for a project
  (async () => {
    try {
      const projectId = 'example-project-123';

      console.log(`Initializing session for project ${projectId}...`);
      const sessionInfo = await integration.initializeProjectSession(projectId, {
        name: 'IDE Integration Example',
        description: 'A session created from the IDE integration example'
      });

      console.log('Session initialized:', sessionInfo);

      // Example: Get session status
      const status = await integration.getProjectSessionStatus(projectId);
      console.log('Session status:', status);

      // Example: Terminate the session
      console.log(`Terminating session for project ${projectId}...`);
      const terminated = await integration.terminateProjectSession(projectId);
      console.log('Session terminated:', terminated);

    } catch (error) {
      console.error('Error in IDE integration example:', error.message);
    }
  })();
}
