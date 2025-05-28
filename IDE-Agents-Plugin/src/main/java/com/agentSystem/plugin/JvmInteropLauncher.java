package com.junie.plugin;

import com.intellij.openapi.actionSystem.ActionManager;
import com.intellij.openapi.actionSystem.DataContext;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.util.Version;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.nio.file.Path;
import java.util.Optional;

/**
 * Launcher for the JVM Interop Layer.
 * This class provides a main method that can be invoked from the command line,
 * and it initializes the JVM Interop Layer and provides a way to communicate with it.
 */
public class JvmInteropLauncher {
    private static final Logger LOG = Logger.getInstance(JvmInteropLauncher.class);

    /**
     * Main method that initializes the JVM Interop Layer and processes commands.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        try {
            // Initialize the JVM Interop Layer
            if (!JvmInteropLayer.initialize()) {
                System.err.println("Failed to initialize JVM Interop Layer");
                System.exit(1);
            }

            System.out.println("JVM Interop Layer initialized successfully");

            // Process commands from standard input
            processCommands();
        } catch (Exception e) {
            System.err.println("Error in JVM Interop Launcher: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    /**
     * Processes commands from standard input.
     * Commands are read from standard input, one per line, and results are written to standard output.
     * The following commands are supported:
     * - get-plugin-path <pluginId>: Gets the installation path of a plugin by its ID
     * - get-junie-plugin-path: Gets the installation path of the Junie plugin
     * - get-plugins-path: Gets the standard plugins directory path
     * - get-plugin-path-by-directory-name <directoryName>: Gets the path to a specific plugin in the standard plugins directory
     * - get-ide-version: Gets the IDE version
     * - exit: Exits the launcher
     */
    private static void processCommands() {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
             PrintWriter writer = new PrintWriter(System.out, true)) {

            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(" ", 2);
                String command = parts[0];

                switch (command) {
                    case "get-plugin-path":
                        if (parts.length < 2) {
                            writer.println("ERROR: Missing plugin ID");
                            break;
                        }
                        String pluginId = parts[1];
                        Optional<Path> pluginPath = JvmInteropLayer.getPluginPath(pluginId);
                        if (pluginPath.isPresent()) {
                            writer.println("SUCCESS: " + pluginPath.get());
                        } else {
                            writer.println("ERROR: Plugin not found: " + pluginId);
                        }
                        break;

                    case "get-junie-plugin-path":
                        Optional<Path> juniePath = JvmInteropLayer.getJuniePluginPath();
                        if (juniePath.isPresent()) {
                            writer.println("SUCCESS: " + juniePath.get());
                        } else {
                            writer.println("ERROR: Junie plugin not found");
                        }
                        break;

                    case "get-plugins-path":
                        Path pluginsPath = JvmInteropLayer.getPluginsPath();
                        writer.println("SUCCESS: " + pluginsPath);
                        break;

                    case "get-plugin-path-by-directory-name":
                        if (parts.length < 2) {
                            writer.println("ERROR: Missing directory name");
                            break;
                        }
                        String directoryName = parts[1];
                        Path directoryPath = JvmInteropLayer.getPluginPathByDirectoryName(directoryName);
                        writer.println("SUCCESS: " + directoryPath);
                        break;

                    case "get-ide-version":
                        Version ideVersion = JvmInteropLayer.getIdeVersion();
                        if (ideVersion != null) {
                            writer.println("SUCCESS: " + ideVersion);
                        } else {
                            writer.println("ERROR: IDE version not available");
                        }
                        break;

                    case "get-action-manager":
                        ActionManager actionManager = JvmInteropLayer.getActionManager();
                        if (actionManager != null) {
                            writer.println("SUCCESS: ActionManager available");
                        } else {
                            writer.println("ERROR: ActionManager not available");
                        }
                        break;

                    case "get-data-context":
                        DataContext dataContext = JvmInteropLayer.getDataContext();
                        if (dataContext != null) {
                            writer.println("SUCCESS: DataContext available");
                        } else {
                            writer.println("ERROR: DataContext not available");
                        }
                        break;

                    case "exit":
                        writer.println("SUCCESS: Exiting");
                        return;

                    default:
                        writer.println("ERROR: Unknown command: " + command);
                        break;
                }

                // Flush the output to ensure it's sent immediately
                writer.flush();
            }
        } catch (Exception e) {
            System.err.println("Error processing commands: " + e.getMessage());
            e.printStackTrace();
        }
    }
}