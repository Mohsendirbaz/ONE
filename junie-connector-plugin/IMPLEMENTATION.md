# Junie Connector Plugin Implementation

This document provides an overview of the implementation of the Junie Connector Plugin, which connects to the Junie plugin already installed in the IDE and initializes sessions.

## Architecture Overview

The plugin is designed with a modular architecture that separates core functionality from IDE integration:

1. **Core Module (`index.js`)**: Provides the base functionality for connecting to Junie and managing sessions.
2. **IDE Integration Module (`ide-integration.js`)**: Builds on the core module to provide IDE-specific functionality.
3. **Plugin Directory Access Module (`plugin-directory.js`)**: Provides access to plugin installation directories in IntelliJ IDEA.
4. **Java Plugin (`junie-intellij-plugin`)**: A Java-based IntelliJ IDEA plugin that provides REST endpoints for accessing plugin installation directories.
5. **Example Usage (`example.js`)**: Demonstrates how to use the core module in a standalone context.

## Implementation Details

### Core Module (JunieConnector)

The `JunieConnector` class in `index.js` provides the following functionality:

- **Validation**: Checks that Junie is installed and accessible by verifying the existence of the `.junie` directory and `guidelines.md` file.
- **Session Initialization**: Creates a new session with a unique ID and stores session configuration in a JSON file.
- **Session Termination**: Marks a session as terminated and updates its status in the session file.
- **Session Status**: Retrieves the current status of a session from its file.

The core module uses the following approach for session management:

1. Sessions are stored as JSON files in a `sessions` directory within the `.junie` directory.
2. Each session has a unique ID generated using a timestamp and random string.
3. Session files contain metadata such as creation time, configuration, and status.

### IDE Integration Module (JunieIdeIntegration)

The `JunieIdeIntegration` class in `ide-integration.js` extends the core functionality to support IDE-specific use cases:

- **Project-Based Sessions**: Associates sessions with specific IDE projects using project IDs.
- **Multiple Session Management**: Tracks and manages multiple active sessions across different projects.
- **Bulk Operations**: Provides methods to retrieve all active sessions or terminate all sessions at once.
- **Plugin Directory Access**: Accesses plugin installation directories in IntelliJ IDEA.

The IDE integration module uses a `Map` to track active sessions by project ID, allowing for efficient lookup and management of sessions.

### Plugin Directory Access Module

The `plugin-directory.js` module provides functions to access plugin installation directories in IntelliJ IDEA by communicating with the Junie Plugin Directory Access plugin via REST API:

- **Plugin Path Retrieval**: Gets the installation path of a plugin by its ID.
- **Junie Plugin Path**: Gets the installation path of the Junie plugin specifically.
- **Plugins Directory**: Gets the standard plugins directory path.
- **Directory-Based Lookup**: Gets the path to a specific plugin in the standard plugins directory.

The module uses HTTP requests to communicate with the REST API provided by the Java plugin.

### Java Plugin (junie-intellij-plugin)

The Java plugin is an IntelliJ IDEA plugin that provides REST endpoints for accessing plugin installation directories:

- **PluginDirectoryAccessor**: A utility class that uses the IntelliJ IDEA API to access plugin installation directories.
- **PluginDirectoryService**: A service that provides access to plugin installation directories.
- **PluginDirectoryController**: A REST controller that exposes the plugin directory access methods as REST endpoints.

The Java plugin uses the following IntelliJ IDEA APIs:
- `PluginManager` to get plugin descriptors by ID
- `PathManager` to get the standard plugins directory path
- `IdeaPluginDescriptor` to get plugin paths

## Session Initialization Process

The session initialization process follows these steps:

1. **Validation**: 
   - First, try to find the Junie plugin using the Plugin Directory Access module.
   - If found, use the plugin path for validation.
   - If not found, fall back to checking for the `.junie` directory and `guidelines.md` file.
   - If neither is found, create the `.junie` directory and a basic `guidelines.md` file.

2. **Plugin Path Retrieval**:
   - Get the Junie plugin path using the Plugin Directory Access module.
   - Store the path in the session configuration.

3. **Session Creation**: 
   - Generate a unique session ID.
   - Create a session configuration with metadata and the Junie plugin path.

4. **Storage**: 
   - Create a session directory if it doesn't exist.
   - Create a session file with the configuration and set the status to "active".

5. **Tracking**: 
   - For IDE integration, associate the session with a project ID.
   - Store the session information in the active sessions map.

## Session Termination Process

The session termination process follows these steps:

1. **Lookup**: 
   - Find the session by ID (or project ID for IDE integration).

2. **Plugin Path Retrieval**:
   - Get the current Junie plugin path using the Plugin Directory Access module.
   - Add the path to the session data.

3. **Update**: 
   - Update the session file to mark the status as "terminated".
   - Add a termination timestamp.
   - Include the Junie plugin path in the session data.

4. **Cleanup**: 
   - Remove the session from active tracking (for IDE integration).

## Directory Structure

The plugin creates and uses the following directory structure:

```
.junie/
  ├── guidelines.md (existing file)
  └── sessions/
      └── [session-id].json (created for each session)

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
  │   │   │               ├── PluginDirectoryAccessor.java (utility class)
  │   │   │               ├── PluginDirectoryService.java (service class)
  │   │   │               └── PluginDirectoryController.java (REST controller)
  │   │   └── resources/
  │   │       └── META-INF/
  │   │           └── plugin.xml (plugin configuration)
  └── [build files]
```

## Assumptions and Design Decisions

Due to limited information about the existing Junie plugin, several assumptions were made:

1. **Session Storage**: Assumed that storing sessions as JSON files in a `sessions` directory would be compatible with Junie.
2. **Validation Method**: 
   - Primary validation now uses the IntelliJ IDEA Plugin API to find the Junie plugin.
   - Falls back to checking for the existence of `.junie/guidelines.md` if the plugin cannot be found.
   - Creates the `.junie` directory and a basic `guidelines.md` file if neither is found but the plugin is installed.
3. **Session Format**: Designed a flexible session format that includes basic metadata, plugin paths, and allows for custom configuration.
4. **IDE Integration**: Created a separate module for IDE integration to keep the core functionality clean and focused.
5. **Plugin ID**: Assumed that the Junie plugin ID might be one of several possibilities (`com.jetbrains.junie`, `com.intellij.junie`, or simply `junie`).
6. **REST API**: Assumed that the IntelliJ IDEA built-in REST API is running on port 63342 and accessible from the Node.js connector.
7. **Asynchronous API**: Converted all API methods to be asynchronous to handle the network requests to the REST API.
8. **Error Handling**: Implemented fallback mechanisms for when the plugin directory access fails, to ensure the connector still works even if the Java plugin is not installed.

## Future Enhancements

Potential future enhancements for the plugin include:

1. **Event System**: Add event emitters to notify about session lifecycle events.
2. **Authentication**: Add support for authenticated sessions if required.
3. **Persistence Options**: Support different storage backends for session data.
4. **Logging**: Enhance logging capabilities with configurable log levels and formats.
5. **Error Handling**: Improve error handling with more specific error types and recovery mechanisms.
6. **Plugin Discovery**: Enhance the plugin discovery mechanism to support more plugin IDs and search strategies.
7. **Plugin Content Access**: Add support for accessing plugin content (files, resources) in addition to the plugin directory.
8. **WebSocket Communication**: Replace HTTP requests with WebSocket for more efficient communication between the Node.js connector and the Java plugin.
9. **Plugin Installation**: Add support for installing and updating plugins programmatically.
10. **Plugin Configuration**: Add support for reading and modifying plugin configuration files.
