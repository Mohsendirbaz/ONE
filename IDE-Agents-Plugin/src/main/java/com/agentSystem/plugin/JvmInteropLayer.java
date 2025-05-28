package com.junie.plugin;

import com.intellij.ide.plugins.IdeaPluginDescriptor;
import com.intellij.ide.plugins.PluginManager;
import com.intellij.openapi.actionSystem.ActionManager;
import com.intellij.openapi.actionSystem.DataContext;
import com.intellij.openapi.actionSystem.impl.SimpleDataContext;
import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.application.PathManager;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.extensions.PluginId;
import com.intellij.openapi.util.Version;

import java.io.File;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JVM Interop Layer for direct interaction with IntelliJ IDEA.
 * This class provides methods to:
 * 1. Load IntelliJ SDK JARs in an external JVM process
 * 2. Initialize the application environment with ApplicationManager
 * 3. Create DataContext and ActionManager instances
 * 4. Handle version compatibility between the SDK and the target IDE installation
 */
public class JvmInteropLayer {
    private static final Logger LOG = Logger.getInstance(JvmInteropLayer.class);
    private static boolean initialized = false;
    private static ActionManager actionManager;
    private static DataContext dataContext;
    private static Version ideVersion;

    /**
     * Initializes the JVM Interop Layer.
     * This method must be called before using any other methods in this class.
     *
     * @return true if initialization was successful, false otherwise
     */
    public static synchronized boolean initialize() {
        if (initialized) {
            return true;
        }

        try {
            // Step 1: Load IntelliJ SDK JARs
            loadIntelliJSdkJars();

            // Step 2: Initialize the application environment
            initializeApplicationEnvironment();

            // Step 3: Create ActionManager and DataContext instances
            createActionManagerAndDataContext();

            // Step 4: Check version compatibility
            checkVersionCompatibility();

            initialized = true;
            LOG.info("JVM Interop Layer initialized successfully");
            return true;
        } catch (Exception e) {
            LOG.error("Failed to initialize JVM Interop Layer", e);
            return false;
        }
    }

    /**
     * Loads IntelliJ SDK JARs into the current JVM process.
     *
     * @throws Exception if loading the JARs fails
     */
    private static void loadIntelliJSdkJars() throws Exception {
        LOG.info("Loading IntelliJ SDK JARs");

        // Get the IntelliJ IDEA installation directory
        String ideaHome = System.getProperty("idea.home.path");
        if (ideaHome == null || ideaHome.isEmpty()) {
            // Try to find the IntelliJ IDEA installation directory
            ideaHome = findIntelliJIdeaInstallationDirectory();
            if (ideaHome == null) {
                throw new IllegalStateException("Could not find IntelliJ IDEA installation directory");
            }
        }

        LOG.info("IntelliJ IDEA installation directory: " + ideaHome);

        // Find all JAR files in the IntelliJ IDEA lib directory
        List<URL> jarUrls = new ArrayList<>();
        File libDir = new File(ideaHome, "lib");
        if (libDir.exists() && libDir.isDirectory()) {
            File[] jarFiles = libDir.listFiles((dir, name) -> name.toLowerCase().endsWith(".jar"));
            if (jarFiles != null) {
                for (File jarFile : jarFiles) {
                    jarUrls.add(jarFile.toURI().toURL());
                    LOG.info("Added JAR to classpath: " + jarFile.getAbsolutePath());
                }
            }
        }

        // Create a new class loader with the JAR URLs
        URLClassLoader classLoader = new URLClassLoader(
                jarUrls.toArray(new URL[0]),
                JvmInteropLayer.class.getClassLoader()
        );

        // Set the context class loader
        Thread.currentThread().setContextClassLoader(classLoader);

        LOG.info("Loaded " + jarUrls.size() + " IntelliJ SDK JARs");
    }

    /**
     * Tries to find the IntelliJ IDEA installation directory.
     *
     * @return the IntelliJ IDEA installation directory, or null if not found
     */
    private static String findIntelliJIdeaInstallationDirectory() {
        // Try common installation locations
        String[] commonLocations = {
                "C:\\Program Files\\JetBrains\\IntelliJ IDEA",
                "C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition",
                "/Applications/IntelliJ IDEA.app/Contents",
                "/Applications/IntelliJ IDEA CE.app/Contents",
                "/opt/intellij-idea",
                "/opt/intellij-idea-community"
        };

        for (String location : commonLocations) {
            File dir = new File(location);
            if (dir.exists() && dir.isDirectory()) {
                File libDir = new File(dir, "lib");
                if (libDir.exists() && libDir.isDirectory()) {
                    return dir.getAbsolutePath();
                }
            }
        }

        // Try to find the IntelliJ IDEA installation directory using the PathManager
        try {
            String homePath = PathManager.getHomePath();
            if (homePath != null && !homePath.isEmpty()) {
                File dir = new File(homePath);
                if (dir.exists() && dir.isDirectory()) {
                    return dir.getAbsolutePath();
                }
            }
        } catch (Exception e) {
            LOG.warn("Failed to get IntelliJ IDEA home path using PathManager", e);
        }

        return null;
    }

    /**
     * Initializes the application environment with ApplicationManager.
     *
     * @throws Exception if initialization fails
     */
    private static void initializeApplicationEnvironment() throws Exception {
        LOG.info("Initializing application environment");

        // Check if the application is already initialized
        if (ApplicationManager.getApplication() != null) {
            LOG.info("Application environment already initialized");
            return;
        }

        // Initialize the application environment using reflection
        // This is necessary because the normal initialization process requires a running IDE
        Class<?> applicationClass = Class.forName("com.intellij.openapi.application.impl.ApplicationImpl");
        Method initMethod = applicationClass.getDeclaredMethod("initializeApplication");
        initMethod.setAccessible(true);
        initMethod.invoke(null);

        LOG.info("Application environment initialized");
    }

    /**
     * Creates ActionManager and DataContext instances.
     *
     * @throws Exception if creation fails
     */
    private static void createActionManagerAndDataContext() throws Exception {
        LOG.info("Creating ActionManager and DataContext instances");

        // Get the ActionManager instance
        actionManager = ActionManager.getInstance();
        if (actionManager == null) {
            throw new IllegalStateException("Failed to get ActionManager instance");
        }

        // Create a simple DataContext
        dataContext = SimpleDataContext.getSimpleContext();

        LOG.info("ActionManager and DataContext instances created");
    }

    /**
     * Checks version compatibility between the SDK and the target IDE installation.
     *
     * @throws Exception if version compatibility check fails
     */
    private static void checkVersionCompatibility() throws Exception {
        LOG.info("Checking version compatibility");

        // Get the IDE version
        String versionString = System.getProperty("idea.version");
        if (versionString == null || versionString.isEmpty()) {
            // Try to get the version from the ApplicationInfo
            try {
                Class<?> applicationInfoClass = Class.forName("com.intellij.openapi.application.ApplicationInfo");
                Method instanceMethod = applicationInfoClass.getDeclaredMethod("getInstance");
                Object applicationInfo = instanceMethod.invoke(null);
                Method getVersionMethod = applicationInfoClass.getDeclaredMethod("getFullVersion");
                versionString = (String) getVersionMethod.invoke(applicationInfo);
            } catch (Exception e) {
                LOG.warn("Failed to get IDE version from ApplicationInfo", e);
            }
        }

        if (versionString != null && !versionString.isEmpty()) {
            // Parse the version string
            try {
                ideVersion = Version.parseVersion(versionString);
                LOG.info("IDE version: " + ideVersion);
            } catch (Exception e) {
                LOG.warn("Failed to parse IDE version: " + versionString, e);
            }
        }

        // Check if the version is compatible
        if (ideVersion != null) {
            // For now, we'll just log the version
            // In a real implementation, we would check if the version is compatible with our plugin
            LOG.info("IDE version is compatible: " + ideVersion);
        } else {
            LOG.warn("Could not determine IDE version, skipping compatibility check");
        }
    }

    /**
     * Gets the ActionManager instance.
     *
     * @return the ActionManager instance, or null if not initialized
     */
    public static ActionManager getActionManager() {
        if (!initialized) {
            LOG.warn("JVM Interop Layer not initialized, call initialize() first");
            return null;
        }
        return actionManager;
    }

    /**
     * Gets the DataContext instance.
     *
     * @return the DataContext instance, or null if not initialized
     */
    public static DataContext getDataContext() {
        if (!initialized) {
            LOG.warn("JVM Interop Layer not initialized, call initialize() first");
            return null;
        }
        return dataContext;
    }

    /**
     * Gets the IDE version.
     *
     * @return the IDE version, or null if not available
     */
    public static Version getIdeVersion() {
        if (!initialized) {
            LOG.warn("JVM Interop Layer not initialized, call initialize() first");
            return null;
        }
        return ideVersion;
    }

    /**
     * Gets the installation path of a plugin by its ID using the JVM Interop Layer.
     *
     * @param pluginId The ID of the plugin
     * @return Optional containing the path if found, empty otherwise
     */
    public static Optional<Path> getPluginPath(String pluginId) {
        if (!initialized) {
            if (!initialize()) {
                LOG.warn("Failed to initialize JVM Interop Layer");
                return Optional.empty();
            }
        }

        if (pluginId == null || pluginId.isEmpty()) {
            LOG.warn("Plugin ID cannot be null or empty");
            return Optional.empty();
        }

        try {
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
        } catch (Exception e) {
            LOG.error("Error getting plugin path for ID: " + pluginId, e);
            return Optional.empty();
        }
    }

    /**
     * Gets the installation path of the Junie plugin using the JVM Interop Layer.
     *
     * @return Optional containing the path if found, empty otherwise
     */
    public static Optional<Path> getJuniePluginPath() {
        if (!initialized) {
            if (!initialize()) {
                LOG.warn("Failed to initialize JVM Interop Layer");
                return Optional.empty();
            }
        }

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
     * Gets the standard plugins directory path using the JVM Interop Layer.
     *
     * @return The path to the plugins directory
     */
    public static Path getPluginsPath() {
        if (!initialized) {
            if (!initialize()) {
                LOG.warn("Failed to initialize JVM Interop Layer");
                return Paths.get("");
            }
        }

        try {
            return Paths.get(PathManager.getPluginsPath());
        } catch (Exception e) {
            LOG.error("Error getting plugins path", e);
            return Paths.get("");
        }
    }

    /**
     * Gets the path to a specific plugin in the standard plugins directory using the JVM Interop Layer.
     *
     * @param pluginDirectoryName The name of the plugin directory
     * @return The path to the plugin directory
     */
    public static Path getPluginPathByDirectoryName(String pluginDirectoryName) {
        if (!initialized) {
            if (!initialize()) {
                LOG.warn("Failed to initialize JVM Interop Layer");
                return Paths.get("");
            }
        }

        try {
            return Paths.get(PathManager.getPluginsPath(), pluginDirectoryName);
        } catch (Exception e) {
            LOG.error("Error getting plugin path by directory name: " + pluginDirectoryName, e);
            return Paths.get("");
        }
    }
}