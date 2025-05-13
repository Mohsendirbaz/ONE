package com.junie.plugin;

import com.intellij.ide.plugins.IdeaPluginDescriptor;
import com.intellij.ide.plugins.PluginManager;
import com.intellij.openapi.application.PathManager;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.extensions.PluginId;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

/**
 * Provides methods to access plugin installation directories in IntelliJ IDEA.
 */
public class PluginDirectoryAccessor {
    private static final Logger LOG = Logger.getInstance(PluginDirectoryAccessor.class);

    /**
     * Gets the installation path of a plugin by its ID.
     *
     * @param pluginId The ID of the plugin
     * @return Optional containing the path if found, empty otherwise
     */
    public static Optional<Path> getPluginPath(String pluginId) {
        if (pluginId == null || pluginId.isEmpty()) {
            LOG.warn("Plugin ID cannot be null or empty");
            return Optional.empty();
        }

        PluginId id = PluginId.findId(pluginId);
        if (id == null) {
            LOG.warn("Could not find plugin ID: " + pluginId);
            return Optional.empty();
        }

        IdeaPluginDescriptor plugin = PluginManager.getPlugin(id);
        if (plugin == null) {
            LOG.warn("Could not find plugin with ID: " + pluginId);
            return Optional.empty();
        }

        return Optional.of(plugin.getPluginPath());
    }

    /**
     * Gets the installation path of the Junie plugin.
     *
     * @return Optional containing the path if found, empty otherwise
     */
    public static Optional<Path> getJuniePluginPath() {
        // Try with the actual Junie plugin ID
        Optional<Path> path = getPluginPath("com.jetbrains.junie");
        if (path.isPresent()) {
            return path;
        }

        // If not found, try alternative IDs that might be used
        path = getPluginPath("com.intellij.junie");
        if (path.isPresent()) {
            return path;
        }

        // Try other potential IDs
        path = getPluginPath("junie");
        if (path.isPresent()) {
            return path;
        }

        LOG.warn("Could not find Junie plugin path with any known plugin ID");
        return Optional.empty();
    }

    /**
     * Gets the standard plugins directory path.
     *
     * @return The path to the plugins directory
     */
    public static Path getPluginsPath() {
        return Paths.get(PathManager.getPluginsPath());
    }

    /**
     * Gets the path to a specific plugin in the standard plugins directory.
     *
     * @param pluginDirectoryName The name of the plugin directory
     * @return The path to the plugin directory
     */
    public static Path getPluginPathByDirectoryName(String pluginDirectoryName) {
        return Paths.get(PathManager.getPluginsPath(), pluginDirectoryName);
    }

    /**
     * Logs information about the Junie plugin if found.
     */
    public static void logJuniePluginInfo() {
        Optional<Path> juniePath = getJuniePluginPath();
        if (juniePath.isPresent()) {
            LOG.info("Junie plugin found at: " + juniePath.get());
        } else {
            LOG.warn("Junie plugin not found");
        }
    }
}