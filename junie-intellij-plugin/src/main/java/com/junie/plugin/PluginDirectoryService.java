package com.junie.plugin;

import com.intellij.openapi.components.Service;
import com.intellij.openapi.components.ServiceManager;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;

import java.nio.file.Path;
import java.util.Optional;

/**
 * Service that provides access to plugin installation directories.
 */
@Service
public final class PluginDirectoryService {
    private static final Logger LOG = Logger.getInstance(PluginDirectoryService.class);

    /**
     * Gets the instance of the service for the given project.
     *
     * @param project The project
     * @return The service instance
     */
    public static PluginDirectoryService getInstance(Project project) {
        return project.getService(PluginDirectoryService.class);
    }

    /**
     * Gets the installation path of a plugin by its ID.
     *
     * @param pluginId The ID of the plugin
     * @return Optional containing the path if found, empty otherwise
     */
    public Optional<Path> getPluginPath(String pluginId) {
        return PluginDirectoryAccessor.getPluginPath(pluginId);
    }

    /**
     * Gets the installation path of the Junie plugin.
     *
     * @return Optional containing the path if found, empty otherwise
     */
    public Optional<Path> getJuniePluginPath() {
        return PluginDirectoryAccessor.getJuniePluginPath();
    }

    /**
     * Gets the standard plugins directory path.
     *
     * @return The path to the plugins directory
     */
    public Path getPluginsPath() {
        return PluginDirectoryAccessor.getPluginsPath();
    }

    /**
     * Gets the path to a specific plugin in the standard plugins directory.
     *
     * @param pluginDirectoryName The name of the plugin directory
     * @return The path to the plugin directory
     */
    public Path getPluginPathByDirectoryName(String pluginDirectoryName) {
        return PluginDirectoryAccessor.getPluginPathByDirectoryName(pluginDirectoryName);
    }

    /**
     * Logs information about the Junie plugin if found.
     */
    public void logJuniePluginInfo() {
        PluginDirectoryAccessor.logJuniePluginInfo();
    }
}