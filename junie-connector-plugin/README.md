# Junie Connector Plugin

A plugin to connect to the Junie plugin which is already installed in the IDE and initialize sessions.

## Installation

### Node.js Package

```bash
npm install junie-connector-plugin
```

### Java Plugin

The Java plugin (`junie-intellij-plugin`) needs to be installed in IntelliJ IDEA:

1. Build the plugin:
   ```bash
   cd junie-intellij-plugin
   ./gradlew buildPlugin
   ```

2. Install the plugin in IntelliJ IDEA:
   - Open IntelliJ IDEA
   - Go to File > Settings > Plugins
   - Click the gear icon and select "Install Plugin from Disk..."
   - Navigate to `junie-intellij-plugin/build/distributions` and select the ZIP file
   - Click "OK" and restart IntelliJ IDEA when prompted

### Requirements

- Node.js (version 12 or higher)
- Java Development Kit (JDK) 11 or higher
- IntelliJ IDEA (version 2020.1 or higher)

## Usage

### Basic Usage

```javascript
const JunieConnector = require('junie-connector-plugin');

// Create a new instance of the JunieConnector
const junieConnector = new JunieConnector();

// All methods are now async/await compatible
async function example() {
  try {
    // Initialize the JVM Interop Layer
    const initialized = await junieConnector.initializeJvmInteropLayer();
    console.log('JVM Interop Layer initialized:', initialized);

    // Check if the ActionManager and DataContext are available
    const actionManagerAvailable = await junieConnector.isActionManagerAvailable();
    console.log('ActionManager available:', actionManagerAvailable);

    const dataContextAvailable = await junieConnector.isDataContextAvailable();
    console.log('DataContext available:', dataContextAvailable);

    // Get the IDE version
    const ideVersion = await junieConnector.getIdeVersion();
    console.log('IDE version:', ideVersion);

    // Initialize a session
    const sessionId = await junieConnector.initializeSession({
      // Optional session configuration
      name: 'My Session',
      description: 'A session for testing purposes'
    });

    // Get session status
    const status = await junieConnector.getSessionStatus();
    console.log('Session status:', status);

    // Access plugin installation directories
    const juniePluginPath = await junieConnector.getJuniePluginPath();
    console.log('Junie plugin path:', juniePluginPath);

    const pluginsPath = await junieConnector.getPluginsPath();
    console.log('Plugins directory path:', pluginsPath);

    // Get path for a specific plugin by ID
    const pluginPath = await junieConnector.getPluginPath('com.intellij.modules.platform');
    console.log('Platform plugin path:', pluginPath);

    // Terminate the session when done
    await junieConnector.terminateSession();
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

Validates that Junie is installed and accessible. This method now uses the JVM Interop Layer to check for the Junie plugin and IDE functionality.

**Returns:**
- `Promise<Boolean>`: True if Junie is installed and accessible, false otherwise

#### `initializeJvmInteropLayer()`

Initializes the JVM Interop Layer, which provides direct interaction with IntelliJ IDEA.

**Returns:**
- `Promise<Boolean>`: True if initialization was successful, false otherwise

#### `terminateJvmProcess()`

Terminates the JVM process used by the JVM Interop Layer.

**Returns:**
- `Promise<void>`

#### `getJuniePluginPath()`

Gets the installation path of the Junie plugin using the JVM Interop Layer.

**Returns:**
- `Promise<String|null>`: The path to the Junie plugin directory, or null if not found

#### `getPluginsPath()`

Gets the standard plugins directory path using the JVM Interop Layer.

**Returns:**
- `Promise<String>`: The path to the plugins directory

#### `getPluginPath(pluginId)`

Gets the installation path of a plugin by its ID using the JVM Interop Layer.

**Parameters:**
- `pluginId` (String): The ID of the plugin

**Returns:**
- `Promise<String|null>`: The path to the plugin directory, or null if not found

#### `getIdeVersion()`

Gets the IDE version using the JVM Interop Layer.

**Returns:**
- `Promise<String|null>`: The IDE version, or null if not available

#### `isActionManagerAvailable()`

Checks if the ActionManager is available using the JVM Interop Layer.

**Returns:**
- `Promise<Boolean>`: True if the ActionManager is available, false otherwise

#### `isDataContextAvailable()`

Checks if the DataContext is available using the JVM Interop Layer.

**Returns:**
- `Promise<Boolean>`: True if the DataContext is available, false otherwise

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

## JVM Interop Layer

The plugin now uses a JVM Interop Layer to directly interact with IntelliJ IDEA. This provides more powerful capabilities than the previous REST API approach.

### Direct Usage

You can use the module directly if needed:

```javascript
const pluginDirectory = require('junie-connector-plugin/plugin-directory');

async function example() {
  try {
    // Initialize the JVM Interop Layer
    await pluginDirectory.initializeJvmInteropLayer();
    console.log('JVM Interop Layer initialized');

    // Get the IDE version
    const ideVersion = await pluginDirectory.getIdeVersion();
    console.log('IDE version:', ideVersion);

    // Check if the ActionManager and DataContext are available
    const actionManagerAvailable = await pluginDirectory.isActionManagerAvailable();
    console.log('ActionManager available:', actionManagerAvailable);

    const dataContextAvailable = await pluginDirectory.isDataContextAvailable();
    console.log('DataContext available:', dataContextAvailable);

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

    // Terminate the JVM process when done
    await pluginDirectory.terminateJvmProcess();
  } catch (error) {
    console.error('Error:', error);
  }
}

example();
```

### JVM Interop Layer API Reference

#### `initializeJvmInteropLayer()`

Initializes the JVM Interop Layer, which provides direct interaction with IntelliJ IDEA.

**Returns:**
- `Promise<Boolean>`: True if initialization was successful, false otherwise

#### `terminateJvmProcess()`

Terminates the JVM process used by the JVM Interop Layer.

**Returns:**
- `Promise<void>`

#### `getPluginsPath()`

Gets the standard plugins directory path using the JVM Interop Layer.

**Returns:**
- `Promise<String>`: The path to the plugins directory

#### `getPluginPath(pluginId)`

Gets the installation path of a plugin by its ID using the JVM Interop Layer.

**Parameters:**
- `pluginId` (String): The ID of the plugin

**Returns:**
- `Promise<String|null>`: The path to the plugin directory, or null if not found

#### `getJuniePluginPath()`

Gets the installation path of the Junie plugin using the JVM Interop Layer.

**Returns:**
- `Promise<String|null>`: The path to the Junie plugin directory, or null if not found

#### `getPluginPathByDirectoryName(directoryName)`

Gets the path to a specific plugin in the standard plugins directory using the JVM Interop Layer.

**Parameters:**
- `directoryName` (String): The name of the plugin directory

**Returns:**
- `Promise<String>`: The path to the plugin directory

#### `getIdeVersion()`

Gets the IDE version using the JVM Interop Layer.

**Returns:**
- `Promise<String|null>`: The IDE version, or null if not available

#### `isActionManagerAvailable()`

Checks if the ActionManager is available using the JVM Interop Layer.

**Returns:**
- `Promise<Boolean>`: True if the ActionManager is available, false otherwise

#### `isDataContextAvailable()`

Checks if the DataContext is available using the JVM Interop Layer.

**Returns:**
- `Promise<Boolean>`: True if the DataContext is available, false otherwise

## AI Assistant

The plugin now includes an AI assistant that provides inline code suggestions in IntelliJ IDEA. The AI assistant is implemented as a set of Java classes in the `com.junie.plugin.ai` package.

### Features

- **Inline Code Suggestions**: The AI assistant provides inline code suggestions as you type.
- **Sequential Agent Architecture**: Uses a sequential agent with isolated context for generating suggestions.
- **Integration with JVM Interop Layer**: Leverages the JVM Interop Layer to interact with IntelliJ IDEA.
- **Fallback Mechanism**: Provides a fallback mechanism for when the JVM Interop Layer fails.

### Usage

The AI assistant is automatically activated when you install the Java plugin (`junie-intellij-plugin`) in IntelliJ IDEA. It will provide inline suggestions as you type in the editor.

- Press `Tab` to accept a suggestion
- Press `Escape` to dismiss a suggestion

### Components

1. **AIAssistantService**: Main service for generating AI suggestions.
2. **SequentialAgentManager**: Manages sequential agents with isolated contexts for specific tasks.
3. **EditorFactoryListenerImpl**: Listens for editor events and triggers suggestions.
4. **InlineSuggestionManager**: Manages the display of inline suggestions in the editor.
5. **JunieAIIntegration**: Integrates the AI assistant with the Junie Connector Plugin.

### Customization

You can customize the AI assistant behavior by modifying the plugin.xml file:

```xml
<extensions defaultExtensionNs="com.intellij">
    <!-- AI Assistant -->
    <applicationService serviceImplementation="com.junie.plugin.ai.AIAssistantService"/>
    <applicationService serviceImplementation="com.junie.plugin.ai.InlineSuggestionManager"/>
    <applicationService serviceImplementation="com.junie.plugin.ai.JunieAIIntegration"/>
    <editorFactoryListener implementation="com.junie.plugin.ai.EditorFactoryListenerImpl"/>
</extensions>
```

## Directory Structure

The plugin creates the following directory structure:

```
.junie/
  ├── guidelines.md
  └── sessions/
      └── [session-id].json

junie-connector-plugin/
  ├── index.js (core module)
  ├── ide-integration.js (IDE integration module)
  ├── plugin-directory.js (plugin directory access module)
  ├── example.js (example usage)
  ├── package.json (dependencies and configuration)
  ├── README.md (documentation)
  └── IMPLEMENTATION.md (implementation details)

junie-intellij-plugin/
  ├── src/
  │   ├── main/
  │   │   ├── java/
  │   │   │   └── com/
  │   │   │       └── junie/
  │   │   │           └── plugin/
  │   │   │               ├── ai/
  │   │   │               │   ├── AIAssistantService.java
  │   │   │               │   ├── EditorFactoryListenerImpl.java
  │   │   │               │   ├── InlineSuggestionManager.java
  │   │   │               │   ├── JunieAIIntegration.java
  │   │   │               │   └── SequentialAgentManager.java
  │   │   │               ├── JvmInteropLayer.java
  │   │   │               ├── JvmInteropLauncher.java
  │   │   │               ├── PluginDirectoryAccessor.java
  │   │   │               ├── PluginDirectoryService.java
  │   │   │               └── PluginDirectoryController.java
  │   │   └── resources/
  │   │       └── META-INF/
  │   │           └── plugin.xml
  └── [build files]
```

Each session file contains:
- Session ID
- Creation timestamp
- Session configuration
- Session status
- Junie plugin path (if found)
- IDE version (if available)
- ActionManager availability
- DataContext availability
- JVM Interop Layer initialization status

## License

ISC
