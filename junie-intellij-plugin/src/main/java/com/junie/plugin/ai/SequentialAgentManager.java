package com.junie.plugin.ai;

import com.intellij.openapi.diagnostic.Logger;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

/**
 * Manages sequential agents with isolated contexts for specific tasks.
 * This class is responsible for spawning agents and managing the communication
 * between the agent and the main thread.
 */
public class SequentialAgentManager {
    private static final Logger LOG = Logger.getInstance(SequentialAgentManager.class);
    private final ExecutorService agentExecutor = Executors.newCachedThreadPool();
    private final JunieAIIntegration aiIntegration;

    /**
     * Creates a new sequential agent manager.
     */
    public SequentialAgentManager() {
        this.aiIntegration = JunieAIIntegration.getInstance();
        // Initialize the AI integration
        if (!aiIntegration.isInitialized()) {
            boolean initialized = aiIntegration.initialize();
            if (!initialized) {
                LOG.warn("Failed to initialize JunieAIIntegration, falling back to local implementation");
            }
        }
    }

    /**
     * Spawns a new agent with an isolated context for a specific task.
     *
     * @param context The context for the agent
     * @param callback The callback to be called when the agent completes its task
     */
    public void spawnAgent(String context, Consumer<String> callback) {
        // If the AI integration is initialized, use it to spawn a sequential agent
        if (aiIntegration.isInitialized()) {
            LOG.info("Using JunieAIIntegration to spawn sequential agent");
            aiIntegration.spawnSequentialAgent(context)
                    .thenAccept(callback)
                    .exceptionally(ex -> {
                        LOG.error("Error in JunieAIIntegration.spawnSequentialAgent", ex);
                        // Fall back to local implementation
                        spawnLocalAgent(context, callback);
                        return null;
                    });
        } else {
            // Fall back to local implementation
            spawnLocalAgent(context, callback);
        }
    }

    /**
     * Spawns a local agent with an isolated context for a specific task.
     * This is used as a fallback when the AI integration is not available.
     *
     * @param context The context for the agent
     * @param callback The callback to be called when the agent completes its task
     */
    private void spawnLocalAgent(String context, Consumer<String> callback) {
        CompletableFuture.supplyAsync(() -> {
            try {
                LOG.info("Spawning local agent with context: " + context.substring(0, Math.min(50, context.length())) + "...");

                // Create a new agent with isolated context
                SequentialAgent agent = new SequentialAgent(context);

                // Execute the agent's task
                String result = agent.generateSuggestion();

                LOG.info("Local agent completed task, result: " + (result != null ? result.substring(0, Math.min(50, result.length())) + "..." : "null"));

                return result;
            } catch (Exception e) {
                LOG.error("Error in local agent execution", e);
                return null;
            }
        }, agentExecutor).thenAccept(callback);
    }

    /**
     * Shuts down the agent executor.
     */
    public void shutdown() {
        agentExecutor.shutdown();
    }

    /**
     * Sequential agent with isolated context for a specific task.
     * This is a local implementation used as a fallback when the AI integration is not available.
     */
    private static class SequentialAgent {
        private final String context;

        /**
         * Creates a new sequential agent with the given context.
         *
         * @param context The context for the agent
         */
        public SequentialAgent(String context) {
            this.context = context;
        }

        /**
         * Generates a suggestion based on the context.
         *
         * @return The generated suggestion
         */
        public String generateSuggestion() {
            // This is a simplified implementation
            // In a real implementation, this would use an AI model to generate a suggestion

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
        }
    }
}
