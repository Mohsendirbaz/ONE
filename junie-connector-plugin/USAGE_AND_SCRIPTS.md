# Junie Connector Plugin: Usage and Script Execution Guide

This document provides detailed instructions on how to use the Junie Connector Plugin and execute its scripts. It covers installation, basic usage, advanced features, and troubleshooting.

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Script Execution](#script-execution)
5. [Advanced Usage](#advanced-usage)
6. [IDE Integration](#ide-integration)
7. [Plugin Directory Access](#plugin-directory-access)
8. [Troubleshooting](#troubleshooting)
9. [Examples](#examples)

## Introduction

The Junie Connector Plugin is a Node.js package that connects to the Junie plugin already installed in your IDE (primarily IntelliJ IDEA) and provides functionality to initialize and manage sessions. It consists of several components:

- **Core Module**: Provides basic session management functionality
- **IDE Integration Module**: Extends the core functionality for IDE-specific use cases
- **Plugin Directory Access Module**: Provides access to plugin installation directories
- **Java Plugin**: A Java-based IntelliJ IDEA plugin that exposes plugin directory information via REST API

## Installation

### Prerequisites

- Node.js (version 12 or higher)
- npm (version 6 or higher)
- IntelliJ IDEA with the Junie plugin installed

### Installing the Node.js Package

```bash
# Install from npm
npm install junie-connector-plugin

# Or install from a local directory
npm install /path/to/junie-connector-plugin
```

### Installing the Java Plugin

The Java plugin (`junie-intellij-plugin`) needs to be installed in IntelliJ IDEA:

1. Open IntelliJ IDEA
2. Go to File > Settings > Plugins
3. Click the gear icon and select "Install Plugin from Disk..."
4. Navigate to the `junie-intellij-plugin` directory and select it
5. Click "OK" and restart IntelliJ IDEA when prompted

## Basic Usage

### Importing the Plugin

```javascript
// Import the core module
const JunieConnector = require('junie-connector-plugin');

// Create a new instance
const junieConnector = new JunieConnector();
```

### Session Management

```javascript
// All methods are async/await compatible
async function example() {
  try {
    // Initialize a session
    const sessionId = await junieConnector.initializeSession({
      name: 'My Session',
      description: 'A session for testing purposes'
    });
    
    // Get session status
    const status = await junieConnector.getSessionStatus();
    console.log('Session status:', status);
    
    // Terminate the session when done
    await junieConnector.terminateSession();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
example();
```

## Script Execution

The Junie Connector Plugin provides several scripts that can be executed using npm or Node.js directly.

### Using npm Scripts

The package.json defines the following npm scripts:

```bash
# Start the plugin (runs index.js)
npm start

# Run tests (currently not implemented)
npm test
```

### Running Example Scripts

The plugin includes example scripts that demonstrate its functionality:

```bash
# Run the basic example
node junie-connector-plugin/example.js

# Run the IDE integration example
node junie-connector-plugin/ide-integration.js
```

### Creating and Running Custom Scripts

You can create custom scripts that use the Junie Connector Plugin:

1. Create a new JavaScript file (e.g., `my-script.js`)
2. Import and use the Junie Connector Plugin
3. Run the script using Node.js

```javascript
// my-script.js
const JunieConnector = require('junie-connector-plugin');
const junieConnector = new JunieConnector();

async function main() {
  try {
    // Your custom logic here
    const sessionId = await junieConnector.initializeSession({
      name: 'Custom Script Session',
      description: 'A session created by my custom script'
    });
    
    console.log(`Session initialized with ID: ${sessionId}`);
    
    // Do something with the session
    
    await junieConnector.terminateSession();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

Run the script:

```bash
node my-script.js
```

## Advanced Usage

### Custom Configuration

You can customize the JunieConnector by passing options to the constructor:

```javascript
const junieConnector = new JunieConnector({
  // Custom path to the Junie directory
  juniePath: '/path/to/junie',
  
  // Log level (info, warn, error)
  logLevel: 'info'
});
```

### Accessing Plugin Directories

The plugin provides methods to access plugin installation directories:

```javascript
async function accessPluginDirectories() {
  try {
    // Get the Junie plugin path
    const juniePluginPath = await junieConnector.getJuniePluginPath();
    console.log('Junie plugin path:', juniePluginPath);
    
    // Get the plugins directory path
    const pluginsPath = await junieConnector.getPluginsPath();
    console.log('Plugins directory path:', pluginsPath);
    
    // Get path for a specific plugin by ID
    const pluginPath = await junieConnector.getPluginPath('com.intellij.modules.platform');
    console.log('Platform plugin path:', pluginPath);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## IDE Integration

For IDE integration, use the `JunieIdeIntegration` class:

```javascript
const JunieIdeIntegration = require('junie-connector-plugin/ide-integration');
const integration = new JunieIdeIntegration();

async function ideExample() {
  try {
    // Initialize a session for a specific project
    const projectId = 'my-project-123';
    const sessionInfo = await integration.initializeProjectSession(projectId, {
      name: 'IDE Project Session',
      description: 'A session for an IDE project'
    });
    
    // Get session status for the project
    const status = await integration.getProjectSessionStatus(projectId);
    
    // Terminate the session for the project
    await integration.terminateProjectSession(projectId);
    
    // Get all active sessions
    const allSessions = integration.getAllActiveSessions();
    
    // Terminate all active sessions
    await integration.terminateAllSessions();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Plugin Directory Access

You can use the Plugin Directory Access module directly:

```javascript
const pluginDirectory = require('junie-connector-plugin/plugin-directory');

async function accessPluginDirectories() {
  try {
    // Get the Junie plugin path
    const juniePluginPath = await pluginDirectory.getJuniePluginPath();
    console.log('Junie plugin path:', juniePluginPath);
    
    // Get the plugins directory path
    const pluginsPath = await pluginDirectory.getPluginsPath();
    console.log('Plugins directory path:', pluginsPath);
    
    // Get path for a specific plugin by ID
    const pluginPath = await pluginDirectory.getPluginPath('com.intellij.modules.platform');
    console.log('Platform plugin path:', pluginPath);
    
    // Get path for a specific plugin by directory name
    const directoryPath = await pluginDirectory.getPluginPathByDirectoryName('junie');
    console.log('Junie directory path:', directoryPath);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Troubleshooting

### Common Issues

#### Junie Plugin Not Found

If the Junie plugin is not found, the connector will try to create a basic `.junie` directory and `guidelines.md` file. If this fails, you may need to:

1. Ensure the Junie plugin is installed in IntelliJ IDEA
2. Check that the `.junie` directory exists in your project root
3. Verify that the `guidelines.md` file exists in the `.junie` directory

#### REST API Connection Issues

If the connector cannot connect to the REST API provided by the Java plugin:

1. Ensure the Java plugin is installed in IntelliJ IDEA
2. Check that IntelliJ IDEA is running
3. Verify that the built-in REST API is running on port 63342
4. Check for any firewall or network issues that might block the connection

#### Session Initialization Fails

If session initialization fails:

1. Check the error message for details
2. Ensure the Junie plugin is properly installed
3. Verify that the `.junie` directory exists and is writable
4. Check that the `sessions` directory exists in the `.junie` directory or can be created

### Debugging

You can enable more verbose logging by setting the `logLevel` option:

```javascript
const junieConnector = new JunieConnector({
  logLevel: 'debug' // Use 'debug' for more detailed logging
});
```

## Examples

### Basic Example

```javascript
const JunieConnector = require('junie-connector-plugin');
const junieConnector = new JunieConnector();

async function basicExample() {
  try {
    // Initialize a session
    const sessionId = await junieConnector.initializeSession({
      name: 'Basic Example Session',
      description: 'A session for the basic example'
    });
    
    console.log(`Session initialized with ID: ${sessionId}`);
    
    // Get session status
    const status = await junieConnector.getSessionStatus();
    console.log('Session status:', status);
    
    // Simulate some work
    console.log('Doing some work...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Work completed.');
    
    // Terminate the session
    await junieConnector.terminateSession();
    console.log('Session terminated.');
  } catch (error) {
    console.error('Error:', error);
  }
}

basicExample();
```

### IDE Integration Example

```javascript
const JunieIdeIntegration = require('junie-connector-plugin/ide-integration');
const integration = new JunieIdeIntegration();

async function ideExample() {
  try {
    // Initialize sessions for multiple projects
    const projects = ['project-1', 'project-2', 'project-3'];
    
    for (const projectId of projects) {
      console.log(`Initializing session for project ${projectId}...`);
      await integration.initializeProjectSession(projectId, {
        name: `${projectId} Session`,
        description: `A session for ${projectId}`
      });
    }
    
    // Get all active sessions
    const activeSessions = integration.getAllActiveSessions();
    console.log(`Active sessions: ${activeSessions.length}`);
    
    // Get status for each session
    for (const session of activeSessions) {
      const status = await integration.getProjectSessionStatus(session.projectId);
      console.log(`Status for ${session.projectId}:`, status);
    }
    
    // Terminate all sessions
    const result = await integration.terminateAllSessions();
    console.log(`Terminated ${result.terminatedCount} out of ${result.totalCount} sessions.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

ideExample();
```

### Plugin Directory Access Example

```javascript
const pluginDirectory = require('junie-connector-plugin/plugin-directory');

async function pluginDirectoryExample() {
  try {
    // Get the plugins directory path
    const pluginsPath = await pluginDirectory.getPluginsPath();
    console.log('Plugins directory path:', pluginsPath);
    
    // Get the Junie plugin path
    const juniePluginPath = await pluginDirectory.getJuniePluginPath();
    console.log('Junie plugin path:', juniePluginPath);
    
    // Get paths for various plugins by ID
    const pluginIds = [
      'com.intellij.modules.platform',
      'com.intellij.modules.lang',
      'com.intellij.modules.java'
    ];
    
    for (const pluginId of pluginIds) {
      const pluginPath = await pluginDirectory.getPluginPath(pluginId);
      console.log(`Path for plugin ${pluginId}:`, pluginPath);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

pluginDirectoryExample();
```