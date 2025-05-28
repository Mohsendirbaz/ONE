package com.junie.plugin.ai;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;
import com.junie.plugin.JvmInteropLayer;

import java.nio.file.Path;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * Integrates the AI assistant with the Junie Connector Plugin.
 * This class is responsible for connecting the AI assistant to the existing JVM Interop Layer.
 */
@Service
public final class JunieAIIntegration {
    private static final Logger LOG = Logger.getInstance(JunieAIIntegration.class);
    private boolean initialized = false;
    
    /**
     * Gets the instance of the service.
     *
     * @return The service instance
     */
    public static JunieAIIntegration getInstance() {
        return ApplicationManager.getApplication().getService(JunieAIIntegration.class);
    }
    
    /**
     * Initializes the integration.
     *
     * @return True if initialization was successful, false otherwise
     */
    public boolean initialize() {
        if (initialized) {
            return true;
        }
        
        try {
            // Initialize the JVM Interop Layer
            boolean jvmInitialized = JvmInteropLayer.initialize();
            if (!jvmInitialized) {
                LOG.error("Failed to initialize JVM Interop Layer");
                return false;
            }
            
            LOG.info("JVM Interop Layer initialized successfully");
            
            // Check if the Junie plugin is installed
            Optional<Path> juniePath = JvmInteropLayer.getJuniePluginPath();
            if (!juniePath.isPresent()) {
                LOG.warn("Junie plugin not found");
            } else {
                LOG.info("Junie plugin found at: " + juniePath.get());
            }
            
            initialized = true;
            return true;
        } catch (Exception e) {
            LOG.error("Error initializing JunieAIIntegration", e);
            return false;
        }
    }
    
    /**
     * Spawns a sequential agent with isolated context for a specific task.
     *
     * @param context The context for the agent
     * @return A CompletableFuture that will be completed with the agent's result
     */
    public CompletableFuture<String> spawnSequentialAgent(String context) {
        if (!initialized && !initialize()) {
            LOG.error("JunieAIIntegration not initialized");
            return CompletableFuture.completedFuture(null);
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                LOG.info("Spawning sequential agent with context: " + 
                        context.substring(0, Math.min(50, context.length())) + "...");
                
                // In a real implementation, this would use the JVM Interop Layer to
                // communicate with the Junie plugin and spawn a sequential agent
                
                // For demonstration purposes, we'll return a simple suggestion based on the context
                if (context.endsWith("public void ")) {
                    return "myMethod() {\n    // TODO: Implement\n}";
                } else if (context.endsWith("for (")) {
                    return "int i = 0; i < list.size(); i++) {\n    \n}";
                } else if (context.endsWith("if (")) {
                    return "condition) {\n    \n}";
                } else if (context.endsWith("try {")) {
                    return "\n    // Code that might throw an exception\n} catch (Exception e) {\n    // Handle exception\n}";
                }
                
                return "";
            } catch (Exception e) {
                LOG.error("Error in sequential agent", e);
                return null;
            }
        });
    }
    
    /**
     * Checks if the integration is initialized.
     *
     * @return True if initialized, false otherwise
     */
    public boolean isInitialized() {
        return initialized;
    }
}