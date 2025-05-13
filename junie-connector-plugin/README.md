# Junie Connector Plugin

A plugin to connect to the Junie plugin which is already installed in the IDE and initialize sessions.

## Installation

```bash
npm install junie-connector-plugin
```

## Usage

### Basic Usage

```javascript
const JunieConnector = require('junie-connector-plugin');

// Create a new instance of the JunieConnector
const junieConnector = new JunieConnector();

// All methods are now async/await compatible
async function example() {
  try {
    // Initialize a session
    const sessionId = await junieConnector.initializeSession({
      // Optional session configuration
      name: 'My Session',
      description: 'A session for testing purposes'
    });

    // Get session status
    const status = await junieConnector.getSessionStatus();
    console.log('Session status:', status);

    // Terminate the session when done
    await junieConnector.terminateSession();

    // Access plugin installation directories
    const juniePluginPath = await junieConnector.getJuniePluginPath();
    console.log('Junie plugin path:', juniePluginPath);

    const pluginsPath = await junieConnector.getPluginsPath();
    console.log('Plugins directory path:', pluginsPath);

    // Get path for a specific plugin by ID
    const pluginPath = await junieConnector.getPluginPath('com.intellij.modules.platform');
    console.log('Platform plugin path:', pluginPath);
  } catch (error) {
    console.error('Error:', error);
  }
}

example();
```

### Advanced Configuration

You can customize the JunieConnector by passing options to the constructor:

```javascript
const junieConnector = new JunieConnector({
  // Custom path to the Junie directory
  juniePath: '/path/to/junie',

  // Log level (info, warn, error)
  logLevel: 'info',

  // Other custom options
  // ...
});
```

### IDE Integration

For IDE integration, use the `JunieIdeIntegration` class:

```javascript
const JunieIdeIntegration = require('junie-connector-plugin/ide-integration');

// Create a new instance of the JunieIdeIntegration
const integration = new JunieIdeIntegration();

// All methods are now async/await compatible
async function ideExample() {
  try {
    // Initialize a session for a specific project
    const projectId = 'my-project-123';
    const sessionInfo = await integration.initializeProjectSession(projectId, {
      name: 'IDE Project Session',
      description: 'A session for an IDE project'
    });

    // The session info includes the Junie plugin path if available
    console.log('Junie plugin path:', sessionInfo.juniePluginPath);

    // Get session status for the project
    const status = await integration.getProjectSessionStatus(projectId);

    // The status includes plugin directory information
    console.log('Current Junie plugin path:', status.currentJuniePluginPath);
    console.log('Plugins directory path:', status.pluginsPath);

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

ideExample();
```

See the `ide-integration.js` file for a complete example of IDE integration.

## API Reference

### JunieConnector

#### `JunieConnector(options)`

Creates a new instance of the JunieConnector.

**Parameters:**
- `options` (Object, optional): Configuration options
  - `juniePath` (String): Path to the Junie directory (default: '.junie' in current directory)
  - `logLevel` (String): Log level (default: 'info')

#### `validateJunieInstallation()`

Validates that Junie is installed and accessible.

**Returns:**
- `Promise<Boolean>`: True if Junie is installed and accessible, false otherwise

#### `getJuniePluginPath()`

Gets the installation path of the Junie plugin.

**Returns:**
- `Promise<String|null>`: The path to the Junie plugin directory, or null if not found

#### `getPluginsPath()`

Gets the standard plugins directory path.

**Returns:**
- `Promise<String>`: The path to the plugins directory

#### `getPluginPath(pluginId)`

Gets the installation path of a plugin by its ID.

**Parameters:**
- `pluginId` (String): The ID of the plugin

**Returns:**
- `Promise<String|null>`: The path to the plugin directory, or null if not found

#### `initializeSession(sessionConfig)`

Initializes a new session with Junie.

**Parameters:**
- `sessionConfig` (Object, optional): Configuration for the session

**Returns:**
- `Promise<String>`: Session ID if successful, null otherwise

#### `terminateSession()`

Terminates the current session.

**Returns:**
- `Promise<Boolean>`: True if successful, false otherwise

#### `getSessionStatus()`

Gets the current session status.

**Returns:**
- `Promise<Object>`: Session status information
  - `active` (Boolean): Whether a session is active
  - `id` (String): Session ID (if active)
  - `juniePluginPath` (String): Path to the Junie plugin (if found)
  - `currentJuniePluginPath` (String): Current path to the Junie plugin (if found)
  - `pluginsPath` (String): Path to the plugins directory (if found)
  - Other session data if available

### JunieIdeIntegration

#### `JunieIdeIntegration(options)`

Creates a new instance of the JunieIdeIntegration.

**Parameters:**
- `options` (Object, optional): Configuration options passed to the underlying JunieConnector

#### `initializeProjectSession(projectId, config)`

Initializes a new session for a specific IDE project.

**Parameters:**
- `projectId` (String): Unique identifier for the IDE project
- `config` (Object, optional): Session configuration

**Returns:**
- `Promise<Object>`: Session information
  - `id` (String): Session ID
  - `projectId` (String): Project ID
  - `startedAt` (Date): Session start time
  - `config` (Object): Session configuration
  - `juniePluginPath` (String): Path to the Junie plugin (if found)

#### `terminateProjectSession(projectId)`

Terminates a session for a specific IDE project.

**Parameters:**
- `projectId` (String): Unique identifier for the IDE project

**Returns:**
- `Promise<Boolean>`: True if successful, false otherwise

#### `getProjectSessionStatus(projectId)`

Gets the status of a session for a specific IDE project.

**Parameters:**
- `projectId` (String): Unique identifier for the IDE project

**Returns:**
- `Promise<Object>`: Session status information
  - `active` (Boolean): Whether a session is active
  - `id` (String): Session ID (if active)
  - `projectId` (String): Project ID
  - `juniePluginPath` (String): Path to the Junie plugin (if found)
  - `currentJuniePluginPath` (String): Current path to the Junie plugin (if found)
  - `pluginsPath` (String): Path to the plugins directory (if found)
  - Other session data if available

#### `getAllActiveSessions()`

Gets all active sessions.

**Returns:**
- `Array`: List of active sessions

#### `terminateAllSessions()`

Terminates all active sessions.

**Returns:**
- `Promise<Object>`: Result with count of terminated sessions
  - `success` (Boolean): Whether the operation was successful
  - `terminatedCount` (Number): Number of sessions terminated
  - `totalCount` (Number): Total number of sessions

## Plugin Directory Access

The plugin provides access to IntelliJ IDEA plugin installation directories through the `plugin-directory.js` module. This module communicates with the Junie Plugin Directory Access plugin via REST API.

### Direct Usage

You can use the module directly if needed:

```javascript
const pluginDirectory = require('junie-connector-plugin/plugin-directory');

async function example() {
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

example();
```

### Plugin Directory API Reference

#### `getPluginsPath()`

Gets the standard plugins directory path.

**Returns:**
- `Promise<String>`: The path to the plugins directory

#### `getPluginPath(pluginId)`

Gets the installation path of a plugin by its ID.

**Parameters:**
- `pluginId` (String): The ID of the plugin

**Returns:**
- `Promise<String|null>`: The path to the plugin directory, or null if not found

#### `getJuniePluginPath()`

Gets the installation path of the Junie plugin.

**Returns:**
- `Promise<String|null>`: The path to the Junie plugin directory, or null if not found

#### `getPluginPathByDirectoryName(directoryName)`

Gets the path to a specific plugin in the standard plugins directory.

**Parameters:**
- `directoryName` (String): The name of the plugin directory

**Returns:**
- `Promise<String>`: The path to the plugin directory

## Directory Structure

The plugin creates the following directory structure:

```
.junie/
  ├── guidelines.md
  └── sessions/
      └── [session-id].json
```

Each session file contains:
- Session ID
- Creation timestamp
- Session configuration
- Session status
- Junie plugin path (if found)

## License

ISC
