package com.junie.plugin.ai.multiagent.services;

import com.junie.plugin.ai.multiagent.ArchitectAgent;
import com.junie.plugin.ai.multiagent.BaseAgent;
import com.junie.plugin.ai.multiagent.CodeEditorAgent;
import com.junie.plugin.ai.multiagent.ObserverAgent;
import com.junie.plugin.ai.multiagent.AgentMessage;
import com.junie.plugin.ai.multiagent.MessageBus;
import com.junie.plugin.ai.multiagent.MessageType;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service that coordinates the activity of multiple agents
 */
@Service(Service.Level.PROJECT)
public final class AgentCoordinatorService {
    private static final Logger LOG = Logger.getInstance(AgentCoordinatorService.class);

    private final Project project;
    private final MessageBus messageBus = new MessageBus();
    private final Map<String, BaseAgent> agents = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> activeTasks = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> activeBundles = new ConcurrentHashMap<>();

    public AgentCoordinatorService(Project project) {
        this.project = project;

        // Initialize the message bus
        LOG.info("Initializing agent coordinator service");

        // Initialize agents
        initializeAgents();

        // Listen for task status updates
        messageBus.subscribe(this::handleMessage);
    }

    /**
     * Initialize the agent system
     */
    private void initializeAgents() {
        // Create agents
        ArchitectAgent architectAgent = new ArchitectAgent(project, messageBus);
        ObserverAgent observerAgent = new ObserverAgent(project, messageBus);
        CodeEditorAgent codeEditorAgent = new CodeEditorAgent(project, messageBus);

        // Register agents
        agents.put("ArchitectAgent", architectAgent);
        agents.put("ObserverAgent", observerAgent);
        agents.put("CodeEditorAgent", codeEditorAgent);

        // Initialize agents
        for (BaseAgent agent : agents.values()) {
            agent.initialize();
        }

        LOG.info("Initialized " + agents.size() + " agents");
    }

    /**
     * Handle messages addressed to the coordinator
     */
    private void handleMessage(AgentMessage message) {
        if (!"AgentCoordinator".equals(message.getTargetAgentId()) && 
            !"all".equals(message.getTargetAgentId())) {
            return; // Not for us
        }

        switch (message.getType()) {
            case MessageType.TASK_STARTED:
                handleTaskStarted(message);
                break;

            case MessageType.TASK_COMPLETED:
                handleTaskCompleted(message);
                break;

            case MessageType.TASK_FAILED:
                handleTaskFailed(message);
                break;

            default:
                // Ignore other messages
                break;
        }
    }

    /**
     * Handle a task start notification
     */
    private void handleTaskStarted(AgentMessage message) {
        Map<String, Object> taskInfo = (Map<String, Object>) message.getPayload();
        String taskId = (String) taskInfo.get("taskId");

        LOG.info("Task started: " + taskId);

        // Store task information
        activeTasks.put(taskId, taskInfo);
    }

    /**
     * Handle a task completion notification
     */
    private void handleTaskCompleted(AgentMessage message) {
        Map<String, Object> result = (Map<String, Object>) message.getPayload();
        String taskId = (String) result.get("taskId");

        LOG.info("Task completed: " + taskId);

        // Update task status
        Map<String, Object> taskInfo = activeTasks.get(taskId);
        if (taskInfo != null) {
            taskInfo.put("status", "completed");
            taskInfo.put("completionTime", System.currentTimeMillis());
            taskInfo.put("result", result);
        }
    }

    /**
     * Handle a task failure notification
     */
    private void handleTaskFailed(AgentMessage message) {
        Map<String, Object> error = (Map<String, Object>) message.getPayload();
        String taskId = (String) error.get("taskId");

        LOG.error("Task failed: " + taskId + " - " + error.get("message"));

        // Update task status
        Map<String, Object> taskInfo = activeTasks.get(taskId);
        if (taskInfo != null) {
            taskInfo.put("status", "failed");
            taskInfo.put("error", error);
        }
    }

    /**
     * Start a new task
     */
    public CompletableFuture<Map<String, Object>> startTask(String description, List<String> filePaths) {
        // Generate a unique task ID
        String taskId = UUID.randomUUID().toString();

        LOG.info("Starting task: " + taskId + " - " + description);

        // Create task info
        Map<String, Object> taskInfo = new HashMap<>();
        taskInfo.put("taskId", taskId);
        taskInfo.put("description", description);
        taskInfo.put("filePaths", filePaths);
        taskInfo.put("startTime", System.currentTimeMillis());
        taskInfo.put("status", "started");

        // Store the task
        activeTasks.put(taskId, taskInfo);

        // Announce task start
        AgentMessage startMessage = new AgentMessage(
                UUID.randomUUID().toString(),
                MessageType.TASK_STARTED,
                "AgentCoordinator",
                "all",
                taskInfo,
                null
        );
        messageBus.publish(startMessage);

        // Start the task with the code editor agent
        AgentMessage editMessage = new AgentMessage(
                UUID.randomUUID().toString(),
                MessageType.EDIT_REQUIRED,
                "AgentCoordinator",
                "CodeEditorAgent",
                taskInfo,
                null
        );
        messageBus.publish(editMessage);

        // Create a future that will be completed when the task is done
        CompletableFuture<Map<String, Object>> future = new CompletableFuture<>();

        // Set up a periodic check for task completion
        scheduleTaskCompletionCheck(taskId, future);

        return future;
    }

    /**
     * Schedule a periodic check for task completion
     */
    private void scheduleTaskCompletionCheck(String taskId, CompletableFuture<Map<String, Object>> future) {
        Timer timer = new Timer(true);
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                Map<String, Object> taskInfo = activeTasks.get(taskId);
                if (taskInfo != null) {
                    String status = (String) taskInfo.get("status");
                    if ("completed".equals(status)) {
                        future.complete(taskInfo);
                        timer.cancel();
                    } else if ("failed".equals(status)) {
                        future.completeExceptionally(
                                new RuntimeException("Task failed: " + taskInfo.get("error")));
                        timer.cancel();
                    }
                }
            }
        }, 1000, 1000); // Check every second
    }

    /**
     * Get information about a task
     */
    public Map<String, Object> getTaskInfo(String taskId) {
        return activeTasks.get(taskId);
    }

    /**
     * Get information about all active tasks
     */
    public List<Map<String, Object>> getAllTaskInfo() {
        return new ArrayList<>(activeTasks.values());
    }

    /**
     * Get information from an agent's context to share with the main assistant
     */
    public Object getAgentContextData(String agentId, String contextKey) {
        BaseAgent agent = agents.get(agentId);
        if (agent != null) {
            return agent.shareWithMainThread(contextKey);
        }
        return null;
    }

    /**
     * Set the observation frequency for the ObserverAgent
     */
    public void setObservationFrequency(long milliseconds) {
        ObserverAgent observerAgent = (ObserverAgent) agents.get("ObserverAgent");
        if (observerAgent != null) {
            observerAgent.setObservationFrequency(milliseconds);
            LOG.info("Set observation frequency to " + milliseconds + " ms");
        }
    }

    /**
     * Create a task bundle for batch execution
     * 
     * @param bundleConfig Configuration for the bundle
     * @return Bundle information
     */
    public Map<String, Object> createTaskBundle(Map<String, Object> bundleConfig) {
        // Generate a unique bundle ID
        String bundleId = UUID.randomUUID().toString();

        // Create bundle information
        Map<String, Object> bundleInfo = new HashMap<>(bundleConfig);
        bundleInfo.put("bundleId", bundleId);
        bundleInfo.put("createdTime", System.currentTimeMillis());
        bundleInfo.put("status", "scheduled");

        // Store the bundle
        activeBundles.put(bundleId, bundleInfo);

        // Associate tasks with this bundle
        List<String> taskIds = (List<String>) bundleConfig.get("tasks");
        if (taskIds != null) {
            for (String taskId : taskIds) {
                Map<String, Object> taskInfo = activeTasks.get(taskId);
                if (taskInfo != null) {
                    taskInfo.put("bundleId", bundleId);
                }
            }
        }

        LOG.info("Created task bundle: " + bundleId + " with " + (taskIds != null ? taskIds.size() : 0) + " tasks");

        // Return the bundle info
        return bundleInfo;
    }

    /**
     * Deploy a bundle of tasks
     * 
     * @param bundleId ID of the bundle to deploy
     * @return Future that completes when all tasks in the bundle are complete
     */
    public CompletableFuture<Map<String, Object>> deployBundle(String bundleId) {
        Map<String, Object> bundleInfo = activeBundles.get(bundleId);
        if (bundleInfo == null) {
            CompletableFuture<Map<String, Object>> future = new CompletableFuture<>();
            future.completeExceptionally(new IllegalArgumentException("Bundle not found: " + bundleId));
            return future;
        }

        // Update bundle status
        bundleInfo.put("status", "in-progress");
        bundleInfo.put("startedAt", System.currentTimeMillis());

        // Get the tasks in this bundle
        List<String> taskIds = (List<String>) bundleInfo.get("tasks");
        if (taskIds == null || taskIds.isEmpty()) {
            CompletableFuture<Map<String, Object>> future = new CompletableFuture<>();
            future.completeExceptionally(new IllegalArgumentException("Bundle has no tasks: " + bundleId));
            return future;
        }

        LOG.info("Deploying bundle: " + bundleId + " with " + taskIds.size() + " tasks");

        // Start all tasks in the bundle
        List<CompletableFuture<Map<String, Object>>> taskFutures = new ArrayList<>();
        for (String taskId : taskIds) {
            Map<String, Object> taskInfo = activeTasks.get(taskId);
            if (taskInfo != null) {
                // Update task status
                taskInfo.put("status", "in-progress");
                taskInfo.put("startedAt", System.currentTimeMillis());

                // Create a message to deploy the task
                AgentMessage deployMessage = new AgentMessage(
                    UUID.randomUUID().toString(),
                    MessageType.EDIT_REQUIRED,
                    "AgentCoordinator",
                    "CodeEditorAgent",
                    taskInfo,
                    null
                );
                messageBus.publish(deployMessage);

                // Create a future for this task
                CompletableFuture<Map<String, Object>> taskFuture = new CompletableFuture<>();
                scheduleTaskCompletionCheck(taskId, taskFuture);
                taskFutures.add(taskFuture);
            }
        }

        // Create a future for the bundle
        CompletableFuture<Map<String, Object>> bundleFuture = new CompletableFuture<>();

        // Complete the bundle future when all tasks are done
        CompletableFuture.allOf(taskFutures.toArray(new CompletableFuture[0]))
            .thenAccept(v -> {
                bundleInfo.put("status", "completed");
                bundleInfo.put("completedAt", System.currentTimeMillis());
                bundleFuture.complete(bundleInfo);
                LOG.info("Bundle completed: " + bundleId);
            })
            .exceptionally(ex -> {
                bundleInfo.put("status", "failed");
                bundleInfo.put("error", ex.getMessage());
                bundleFuture.completeExceptionally(ex);
                LOG.error("Bundle failed: " + bundleId + " - " + ex.getMessage());
                return null;
            });

        return bundleFuture;
    }

    /**
     * Get information about a bundle
     * 
     * @param bundleId ID of the bundle
     * @return Bundle information
     */
    public Map<String, Object> getBundleInfo(String bundleId) {
        return activeBundles.get(bundleId);
    }

    /**
     * Get information about all bundles
     * 
     * @return List of bundle information
     */
    public List<Map<String, Object>> getAllBundleInfo() {
        return new ArrayList<>(activeBundles.values());
    }

    /**
     * Dispose the coordinator and all agents
     */
    public void dispose() {
        for (BaseAgent agent : agents.values()) {
            agent.dispose();
        }

        messageBus.shutdown();
        LOG.info("Agent coordinator disposed");
    }
}
