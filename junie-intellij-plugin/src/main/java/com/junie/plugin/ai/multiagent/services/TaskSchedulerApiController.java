package com.junie.plugin.ai.multiagent.services;

import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.project.ProjectManager;
import com.intellij.openapi.util.text.StringUtil;
import com.intellij.util.io.HttpRequests;
import com.intellij.util.io.HttpResponseStatus;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.jetbrains.ide.RestService;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

/**
 * REST controller that provides API endpoints for the Task Scheduler.
 */
public class TaskSchedulerApiController extends RestService {
    private static final Logger LOG = Logger.getInstance(TaskSchedulerApiController.class);
    private static final String API_PREFIX = "/api/task-scheduler";
    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    @NotNull
    @Override
    protected String getServiceName() {
        return "task-scheduler-api";
    }

    @Override
    protected boolean isMethodSupported(@NotNull HttpMethod method) {
        return method == HttpMethod.GET || method == HttpMethod.POST;
    }

    @Override
    protected boolean isOriginAllowed(@NotNull String origin) {
        return true; // Allow all origins for simplicity
    }

    @Override
    public boolean process(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response, @NotNull String path) throws IOException {
        if (!path.startsWith(API_PREFIX)) {
            return false;
        }

        String subPath = path.substring(API_PREFIX.length());
        AgentCoordinatorService coordinatorService = getCoordinatorService();

        if (coordinatorService == null) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Agent coordinator service not available");
            return true;
        }

        // Handle different API endpoints
        try {
            if (request.getMethod().equals("POST")) {
                // POST endpoints
                if (subPath.equals("/tasks")) {
                    handleCreateTaskEndpoint(request, response, coordinatorService);
                    return true;
                }

                if (subPath.equals("/bundles")) {
                    handleCreateBundleEndpoint(request, response, coordinatorService);
                    return true;
                }

                if (subPath.matches("/tasks/[^/]+/deploy")) {
                    String taskId = subPath.substring("/tasks/".length(), subPath.indexOf("/deploy"));
                    handleDeployTaskEndpoint(request, response, coordinatorService, taskId);
                    return true;
                }

                if (subPath.matches("/bundles/[^/]+/deploy")) {
                    String bundleId = subPath.substring("/bundles/".length(), subPath.indexOf("/deploy"));
                    handleDeployBundleEndpoint(request, response, coordinatorService, bundleId);
                    return true;
                }
            } else if (request.getMethod().equals("GET")) {
                // GET endpoints
                if (subPath.equals("/tasks")) {
                    handleGetTasksEndpoint(request, response, coordinatorService);
                    return true;
                }

                if (subPath.equals("/bundles")) {
                    handleGetBundlesEndpoint(request, response, coordinatorService);
                    return true;
                }

                if (subPath.matches("/tasks/[^/]+")) {
                    String taskId = subPath.substring("/tasks/".length());
                    handleGetTaskEndpoint(request, response, coordinatorService, taskId);
                    return true;
                }

                if (subPath.matches("/bundles/[^/]+")) {
                    String bundleId = subPath.substring("/bundles/".length());
                    handleGetBundleEndpoint(request, response, coordinatorService, bundleId);
                    return true;
                }
            }
        } catch (Exception e) {
            LOG.error("Error processing request: " + path, e);
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error processing request: " + e.getMessage());
            return true;
        }

        response.sendError(HttpServletResponse.SC_NOT_FOUND, "Unknown path: " + path);
        return true;
    }

    // Handle task creation endpoint
    private void handleCreateTaskEndpoint(HttpServletRequest request, HttpServletResponse response, 
                                        AgentCoordinatorService coordinatorService) throws IOException {
        // Parse request body
        String body = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
        Map<String, Object> taskData = gson.fromJson(body, Map.class);

        // Extract task information
        String title = (String) taskData.get("title");
        String description = title; // Use title as description for simplicity
        List<String> filePaths = (List<String>) taskData.get("filePaths");

        try {
            // Start a new task using the coordinator service
            CompletableFuture<Map<String, Object>> taskFuture = 
                coordinatorService.startTask(description, filePaths);

            // Return the task ID immediately, don't wait for completion
            Map<String, Object> result = new HashMap<>();
            result.put("id", taskFuture.get(5, TimeUnit.SECONDS).get("taskId"));
            result.put("title", title);
            result.put("status", "pending");
            result.put("size", taskData.get("size"));
            result.put("priority", taskData.get("priority"));
            result.put("dueDate", taskData.get("dueDate"));
            result.put("agent", taskData.get("agent"));
            result.put("estimatedTime", taskData.get("estimatedTime"));
            result.put("assignee", taskData.get("assignee"));

            // Send response
            response.setContentType("application/json");
            response.getWriter().write(gson.toJson(result));
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                     "Error creating task: " + e.getMessage());
        }
    }

    // Handle bundle creation endpoint
    private void handleCreateBundleEndpoint(HttpServletRequest request, HttpServletResponse response, 
                                         AgentCoordinatorService coordinatorService) throws IOException {
        // Parse request body
        String body = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
        Map<String, Object> bundleData = gson.fromJson(body, Map.class);

        try {
            // Extract bundle information
            String title = (String) bundleData.get("title");
            String description = (String) bundleData.get("description");
            List<String> taskIds = (List<String>) bundleData.get("tasks");

            // Prepare bundle config
            Map<String, Object> bundleConfig = new HashMap<>(bundleData);

            // Create the bundle using the coordinator service
            Map<String, Object> bundleInfo = coordinatorService.createTaskBundle(bundleConfig);

            // Convert bundleId to id for frontend compatibility
            bundleInfo.put("id", bundleInfo.get("bundleId"));

            // Send response
            response.setContentType("application/json");
            response.getWriter().write(gson.toJson(bundleInfo));
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                      "Error creating bundle: " + e.getMessage());
        }
    }

    // Handle deploy task endpoint
    private void handleDeployTaskEndpoint(HttpServletRequest request, HttpServletResponse response, 
                                       AgentCoordinatorService coordinatorService, String taskId) throws IOException {
        try {
            // Get task information
            Map<String, Object> taskInfo = coordinatorService.getTaskInfo(taskId);
            if (taskInfo == null) {
                sendError(response, HttpServletResponse.SC_NOT_FOUND, "Task not found: " + taskId);
                return;
            }

            // Update task status
            taskInfo.put("status", "in-progress");
            taskInfo.put("deployedTime", System.currentTimeMillis());

            // Send response
            response.setContentType("application/json");
            response.getWriter().write(gson.toJson(taskInfo));
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                     "Error deploying task: " + e.getMessage());
        }
    }

    // Handle deploy bundle endpoint
    private void handleDeployBundleEndpoint(HttpServletRequest request, HttpServletResponse response, 
                                         AgentCoordinatorService coordinatorService, String bundleId) throws IOException {
        try {
            // Deploy the bundle using the coordinator service
            CompletableFuture<Map<String, Object>> bundleFuture = coordinatorService.deployBundle(bundleId);

            // Get the initial bundle info (don't wait for completion)
            Map<String, Object> bundleInfo = coordinatorService.getBundleInfo(bundleId);
            if (bundleInfo == null) {
                sendError(response, HttpServletResponse.SC_NOT_FOUND, "Bundle not found: " + bundleId);
                return;
            }

            // Convert bundleId to id for frontend compatibility
            if (bundleInfo.containsKey("bundleId")) {
                bundleInfo.put("id", bundleInfo.get("bundleId"));
            }

            // Send response
            response.setContentType("application/json");
            response.getWriter().write(gson.toJson(bundleInfo));
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                     "Error deploying bundle: " + e.getMessage());
        }
    }

    // Handle get tasks endpoint
    private void handleGetTasksEndpoint(HttpServletRequest request, HttpServletResponse response, 
                                     AgentCoordinatorService coordinatorService) throws IOException {
        try {
            // Get all tasks
            List<Map<String, Object>> tasks = coordinatorService.getAllTaskInfo();

            // Send response
            response.setContentType("application/json");
            response.getWriter().write(gson.toJson(tasks));
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                     "Error getting tasks: " + e.getMessage());
        }
    }

    // Handle get bundles endpoint
    private void handleGetBundlesEndpoint(HttpServletRequest request, HttpServletResponse response, 
                                       AgentCoordinatorService coordinatorService) throws IOException {
        try {
            // Get all bundles from the coordinator service
            List<Map<String, Object>> bundles = coordinatorService.getAllBundleInfo();

            // Convert bundleId to id for frontend compatibility
            for (Map<String, Object> bundle : bundles) {
                if (bundle.containsKey("bundleId")) {
                    bundle.put("id", bundle.get("bundleId"));
                }
            }

            // Send response
            response.setContentType("application/json");
            response.getWriter().write(gson.toJson(bundles));
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                     "Error getting bundles: " + e.getMessage());
        }
    }

    // Handle get task endpoint
    private void handleGetTaskEndpoint(HttpServletRequest request, HttpServletResponse response, 
                                    AgentCoordinatorService coordinatorService, String taskId) throws IOException {
        try {
            // Get task information
            Map<String, Object> taskInfo = coordinatorService.getTaskInfo(taskId);
            if (taskInfo == null) {
                sendError(response, HttpServletResponse.SC_NOT_FOUND, "Task not found: " + taskId);
                return;
            }

            // Send response
            response.setContentType("application/json");
            response.getWriter().write(gson.toJson(taskInfo));
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                     "Error getting task: " + e.getMessage());
        }
    }

    // Handle get bundle endpoint
    private void handleGetBundleEndpoint(HttpServletRequest request, HttpServletResponse response, 
                                      AgentCoordinatorService coordinatorService, String bundleId) throws IOException {
        try {
            // Get bundle information from the coordinator service
            Map<String, Object> bundleInfo = coordinatorService.getBundleInfo(bundleId);
            if (bundleInfo == null) {
                sendError(response, HttpServletResponse.SC_NOT_FOUND, "Bundle not found: " + bundleId);
                return;
            }

            // Convert bundleId to id for frontend compatibility
            if (bundleInfo.containsKey("bundleId")) {
                bundleInfo.put("id", bundleInfo.get("bundleId"));
            }

            // Send response
            response.setContentType("application/json");
            response.getWriter().write(gson.toJson(bundleInfo));
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                     "Error getting bundle: " + e.getMessage());
        }
    }

    // Helper method to send error response
    private void sendError(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json");
        Map<String, Object> error = new HashMap<>();
        error.put("error", message);
        response.getWriter().write(gson.toJson(error));
    }

    // Helper method to get the coordinator service
    @Nullable
    private AgentCoordinatorService getCoordinatorService() {
        Project[] openProjects = ProjectManager.getInstance().getOpenProjects();
        if (openProjects.length > 0) {
            return openProjects[0].getService(AgentCoordinatorService.class);
        }
        return null;
    }
}
