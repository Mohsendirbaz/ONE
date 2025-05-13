# Junie Connector Plugin Implementation

This document provides an overview of the implementation of the Junie Connector Plugin, which connects to the Junie plugin already installed in the IDE and initializes sessions.

## Architecture Overview

The plugin is designed with a modular architecture that separates core functionality from IDE integration:

1. **Core Module (`index.js`)**: Provides the base functionality for connecting to Junie and managing sessions.
2. **IDE Integration Module (`ide-integration.js`)**: Builds on the core module to provide IDE-specific functionality.
3. **JVM Interop Layer (`JvmInteropLayer.java`)**: Provides direct interaction with IntelliJ IDEA through JVM interop.
4. **JVM Interop Launcher (`JvmInteropLauncher.java`)**: Provides a command-line interface to the JVM Interop Layer.
5. **Plugin Directory Access Module (`plugin-directory.js`)**: Communicates with the JVM Interop Layer to access plugin installation directories and IDE functionality.
6. **Java Plugin (`junie-intellij-plugin`)**: A Java-based IntelliJ IDEA plugin that provides the JVM Interop Layer.
7. **Example Usage (`example.js`)**: Demonstrates how to use the core module in a standalone context.

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

### JVM Interop Layer

The `JvmInteropLayer` class provides direct interaction with IntelliJ IDEA through JVM interop:

- **SDK Loading**: Loads IntelliJ SDK JARs in an external JVM process.
- **Application Initialization**: Bootstraps the application environment with ApplicationManager.
- **Context Creation**: Constructs DataContext and ActionManager instances.
- **Version Compatibility**: Handles version compatibility between the SDK and the target IDE installation.
- **Plugin Path Retrieval**: Gets the installation path of a plugin by its ID.
- **Junie Plugin Path**: Gets the installation path of the Junie plugin specifically.
- **Plugins Directory**: Gets the standard plugins directory path.
- **Directory-Based Lookup**: Gets the path to a specific plugin in the standard plugins directory.

The JVM Interop Layer uses the following IntelliJ IDEA APIs:
- `PluginManager` to get plugin descriptors by ID
- `PathManager` to get the standard plugins directory path
- `IdeaPluginDescriptor` to get plugin paths
- `ApplicationManager` to access the application environment
- `ActionManager` to access actions
- `DataContext` to provide context for actions

### JVM Interop Launcher

The `JvmInteropLauncher` class provides a command-line interface to the JVM Interop Layer:

- **Initialization**: Initializes the JVM Interop Layer.
- **Command Processing**: Processes commands from standard input and writes results to standard output.
- **Plugin Path Commands**: Provides commands to get plugin paths.
- **IDE Version Command**: Provides a command to get the IDE version.
- **ActionManager Command**: Provides a command to check if the ActionManager is available.
- **DataContext Command**: Provides a command to check if the DataContext is available.

### Plugin Directory Access Module

The `plugin-directory.js` module communicates with the JVM Interop Layer to access plugin installation directories and IDE functionality:

- **JVM Process Management**: Spawns and manages the JVM process.
- **Command Queue**: Handles concurrent requests to the JVM process.
- **Plugin Path Retrieval**: Gets the installation path of a plugin by its ID.
- **Junie Plugin Path**: Gets the installation path of the Junie plugin specifically.
- **Plugins Directory**: Gets the standard plugins directory path.
- **Directory-Based Lookup**: Gets the path to a specific plugin in the standard plugins directory.
- **IDE Version**: Gets the IDE version.
- **ActionManager Availability**: Checks if the ActionManager is available.
- **DataContext Availability**: Checks if the DataContext is available.

The module uses the `child_process` module to spawn the JVM process and communicate with it using standard input/output.

### Java Plugin (junie-intellij-plugin)

The Java plugin is an IntelliJ IDEA plugin that provides the JVM Interop Layer:

- **JvmInteropLayer**: A class that provides direct interaction with IntelliJ IDEA through JVM interop.
- **JvmInteropLauncher**: A class that provides a command-line interface to the JVM Interop Layer.
- **PluginDirectoryAccessor**: A utility class that uses the IntelliJ IDEA API to access plugin installation directories.
- **PluginDirectoryService**: A service that provides access to plugin installation directories.
- **PluginDirectoryController**: A REST controller that exposes the plugin directory access methods as REST endpoints (legacy).

## Session Initialization Process

The session initialization process follows these steps:

1. **JVM Interop Layer Initialization**:
   - Initialize the JVM Interop Layer.
   - Load IntelliJ SDK JARs in an external JVM process.
   - Initialize the application environment with ApplicationManager.
   - Create DataContext and ActionManager instances.
   - Check version compatibility between the SDK and the target IDE installation.

2. **Validation**: 
   - Check if the ActionManager and DataContext are available.
   - Get the IDE version.
   - Try to find the Junie plugin using the JVM Interop Layer.
   - If found, use the plugin path for validation.
   - If not found, fall back to checking for the `.junie` directory and `guidelines.md` file.
   - If neither is found, create the `.junie` directory and a basic `guidelines.md` file.

3. **Plugin Path Retrieval**:
   - Get the Junie plugin path using the JVM Interop Layer.
   - Store the path in the session configuration.

4. **IDE Information Retrieval**:
   - Get the IDE version using the JVM Interop Layer.
   - Check if the ActionManager and DataContext are available.
   - Store this information in the session configuration.

5. **Session Creation**: 
   - Generate a unique session ID.
   - Create a session configuration with metadata, the Junie plugin path, IDE version, and ActionManager/DataContext availability.

6. **Storage**: 
   - Create a session directory if it doesn't exist.
   - Create a session file with the configuration and set the status to "active".

7. **Tracking**: 
   - For IDE integration, associate the session with a project ID.
   - Store the session information in the active sessions map.

## Session Termination Process

The session termination process follows these steps:

1. **Lookup**: 
   - Find the session by ID (or project ID for IDE integration).

2. **Plugin Path Retrieval**:
   - Get the current Junie plugin path using the JVM Interop Layer.
   - Add the path to the session data.

3. **IDE Information Retrieval**:
   - Get the IDE version using the JVM Interop Layer.
   - Add the version to the session data.

4. **Update**: 
   - Update the session file to mark the status as "terminated".
   - Add a termination timestamp.
   - Include the Junie plugin path and IDE version in the session data.

5. **Cleanup**: 
   - Remove the session from active tracking (for IDE integration).
   - Terminate the JVM process.

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
  │   │   │               ├── JvmInteropLayer.java (JVM interop layer)
  │   │   │               ├── JvmInteropLauncher.java (JVM interop launcher)
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
   - Primary validation now uses the JVM Interop Layer to find the Junie plugin and check IDE functionality.
   - Falls back to checking for the existence of `.junie/guidelines.md` if the JVM Interop Layer fails.
   - Creates the `.junie` directory and a basic `guidelines.md` file if neither is found but the plugin is installed.
3. **Session Format**: Designed a flexible session format that includes basic metadata, plugin paths, IDE version, ActionManager/DataContext availability, and allows for custom configuration.
4. **IDE Integration**: Created a separate module for IDE integration to keep the core functionality clean and focused.
5. **Plugin ID**: Assumed that the Junie plugin ID might be one of several possibilities (`com.jetbrains.junie`, `com.intellij.junie`, or simply `junie`).
6. **JVM Interop**: Implemented a direct JVM interop approach that loads IntelliJ SDK JARs in an external JVM process, initializes the application environment with ApplicationManager, and creates DataContext and ActionManager instances.
7. **Version Compatibility**: Added version compatibility checks between the SDK and the target IDE installation.
8. **Process Communication**: Used standard input/output for communication between the Node.js module and the JVM process.
9. **Asynchronous API**: Converted all API methods to be asynchronous to handle the communication with the JVM process.
10. **Error Handling**: Implemented fallback mechanisms for when the JVM Interop Layer fails, to ensure the connector still works even if the Java plugin is not installed or the JVM process cannot be started.

## AI Assistant Implementation

The plugin now includes an AI assistant that provides inline code suggestions in IntelliJ IDEA. The AI assistant is implemented as a set of Java classes in the `com.junie.plugin.ai` package:

### AI Assistant Components

1. **AIAssistantService**: Main service for generating AI suggestions.
   - Provides methods to suggest code completions at the current cursor position.
   - Uses a sequential agent with isolated context for generating suggestions.
   - Runs in a background thread to avoid blocking the EDT.

2. **SequentialAgentManager**: Manages sequential agents with isolated contexts for specific tasks.
   - Spawns agents with isolated contexts for generating suggestions.
   - Manages the communication between the agent and the main thread.
   - Provides a fallback mechanism for when the JunieAIIntegration is not available.

3. **EditorFactoryListenerImpl**: Listens for editor events and triggers suggestions.
   - Adds document listeners to editors when they are created.
   - Removes document listeners when editors are released.
   - Uses a debouncing mechanism to avoid excessive AI calls.

4. **InlineSuggestionManager**: Manages the display of inline suggestions in the editor.
   - Shows suggestions as ghost text in the editor.
   - Handles user interactions with suggestions (Tab to accept, Escape to dismiss).
   - Applies suggestions to the editor when accepted.

5. **JunieAIIntegration**: Integrates the AI assistant with the Junie Connector Plugin.
   - Connects the AI assistant to the existing JVM Interop Layer.
   - Provides methods to spawn sequential agents with isolated contexts.
   - Initializes the JVM Interop Layer and checks if the Junie plugin is installed.

### Sequential Agent Architecture

The AI assistant uses a sequential agent architecture to generate suggestions:

1. **Isolated Context**: Each agent has its own isolated context, which includes the code before the cursor.
2. **Task-Specific**: Each agent is spawned for a specific task (generating a suggestion for a specific context).
3. **Asynchronous Execution**: Agents run asynchronously in a background thread to avoid blocking the EDT.
4. **Callback Mechanism**: Agents communicate with the main thread using callbacks.

### Integration with Junie Connector Plugin

The AI assistant integrates with the existing Junie Connector Plugin through the JunieAIIntegration class:

1. **JVM Interop Layer**: Uses the JVM Interop Layer to interact with IntelliJ IDEA.
2. **Plugin Path Retrieval**: Gets the Junie plugin path using the JVM Interop Layer.
3. **Fallback Mechanism**: Provides a fallback mechanism for when the JVM Interop Layer fails.

### User Interaction

The AI assistant provides a seamless user experience:

1. **Inline Suggestions**: Suggestions are shown as ghost text in the editor.
2. **Tab to Accept**: Users can press Tab to accept a suggestion.
3. **Escape to Dismiss**: Users can press Escape to dismiss a suggestion.
4. **Debouncing**: Suggestions are only triggered after the user stops typing for a short period.

### Directory Structure

The AI assistant components are organized as follows:

```
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

## Future Enhancements

Potential future enhancements for the plugin include:

1. **Event System**: Add event emitters to notify about session lifecycle events.
2. **Authentication**: Add support for authenticated sessions if required.
3. **Persistence Options**: Support different storage backends for session data.
4. **Logging**: Enhance logging capabilities with configurable log levels and formats.
5. **Error Handling**: Improve error handling with more specific error types and recovery mechanisms.
6. **Plugin Discovery**: Enhance the plugin discovery mechanism to support more plugin IDs and search strategies.
7. **Plugin Content Access**: Add support for accessing plugin content (files, resources) in addition to the plugin directory.
8. **JVM Interop Extensions**: Extend the JVM Interop Layer to support more IntelliJ IDEA APIs and functionality.
9. **Action Execution**: Add support for executing IntelliJ IDEA actions programmatically.
10. **Plugin Installation**: Add support for installing and updating plugins programmatically.
11. **Plugin Configuration**: Add support for reading and modifying plugin configuration files.
12. **IDE Project Integration**: Add support for accessing and manipulating IDE projects.
13. **Editor Integration**: Add support for accessing and manipulating editor content.
14. **Debugging Integration**: Add support for debugging applications from the connector.
15. **Performance Optimization**: Optimize the JVM Interop Layer for better performance and lower memory usage.
16. **AI Model Integration**: Integrate with real AI models (OpenAI, Anthropic, local models) for better suggestions.
17. **Multi-File Context**: Support for collecting context from multiple files for more accurate suggestions.
18. **Language-Specific Parsing**: Add language-specific parsing for better context understanding.
19. **User Feedback**: Add mechanisms for users to provide feedback on suggestions to improve the AI model.
20. **Customizable Suggestions**: Allow users to customize the suggestion behavior and appearance.
