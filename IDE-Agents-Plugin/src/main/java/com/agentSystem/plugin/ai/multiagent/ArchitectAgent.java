package com.junie.plugin.ai.multiagent;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.psi.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Agent responsible for architectural decisions and planning
 */
public class ArchitectAgent extends BaseAgent {
    
    public ArchitectAgent(Project project, MessageBus messageBus) {
        super(project, messageBus);
    }
    
    @Override
    public void initialize() {
        LOG.info("Architect agent initialized");
        
        // Subscribe to specific message types
        addToContext("activeDesignPlans", new HashMap<String, Object>());
        
        // Announce initialization
        sendMessage("all", MessageType.AGENT_INITIALIZED, "Architect agent ready");
    }
    
    @Override
    protected void processMessage(AgentMessage message) {
        switch (message.getType()) {
            case MessageType.DESIGN_REQUIRED:
                handleDesignRequest(message);
                break;
                
            case MessageType.OBSERVATION_COMPLETED:
                incorporateFeedback(message);
                break;
                
            case MessageType.CONTEXT_REQUESTED:
                shareRequestedContext(message);
                break;
                
            default:
                // Ignore messages we don't handle
                break;
        }
    }
    
    /**
     * Handle a request to create a design plan
     */
    private void handleDesignRequest(AgentMessage message) {
        LOG.info("Creating architectural design plan");
        
        try {
            // Extract task information from the message
            Map<String, Object> requestData = (Map<String, Object>) message.getPayload();
            String taskId = (String) requestData.get("taskId");
            String taskDescription = (String) requestData.get("description");
            List<String> filePaths = (List<String>) requestData.get("filePaths");
            
            // Store task details in isolated context
            Map<String, Object> taskContext = new HashMap<>();
            taskContext.put("description", taskDescription);
            taskContext.put("filePaths", filePaths);
            taskContext.put("status", "planning");
            
            // Add to design plans in context
            Map<String, Object> designPlans = (Map<String, Object>) getFromContext("activeDesignPlans");
            designPlans.put(taskId, taskContext);
            
            // Analyze the codebase to create a design plan
            CompletableFuture<Map<String, Object>> designPlanFuture = createDesignPlan(taskId, taskDescription, filePaths);
            
            // When the design plan is ready, send it back
            designPlanFuture.thenAccept(designPlan -> {
                // Update task status
                taskContext.put("status", "planned");
                taskContext.put("designPlan", designPlan);
                
                // Send the design plan as a response
                AgentMessage response = message.createResponse(
                        MessageType.DESIGN_COMPLETED,
                        designPlan
                );
                messageBus.publish(response);
                
                // Request observer to evaluate the plan
                Map<String, Object> observationRequest = new HashMap<>();
                observationRequest.put("taskId", taskId);
                observationRequest.put("designPlan", designPlan);
                sendMessage("ObserverAgent", MessageType.OBSERVATION_REQUIRED, observationRequest);
            });
        } catch (Exception e) {
            LOG.error("Error creating design plan", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            
            AgentMessage response = message.createResponse(
                    MessageType.TASK_FAILED,
                    errorResponse
            );
            messageBus.publish(response);
        }
    }
    
    /**
     * Create a design plan for a task
     */
    private CompletableFuture<Map<String, Object>> createDesignPlan(
            String taskId, String taskDescription, List<String> filePaths) {
        
        CompletableFuture<Map<String, Object>> future = new CompletableFuture<>();
        
        ApplicationManager.getApplication().executeOnPooledThread(() -> {
            try {
                // Analyze the files to understand their structure
                List<Map<String, Object>> fileAnalysis = new ArrayList<>();
                
                for (String filePath : filePaths) {
                    // Find virtual file
                    VirtualFile virtualFile = project.getBaseDir().findFileByRelativePath(filePath);
                    if (virtualFile == null) continue;
                    
                    // Get PSI file
                    PsiFile psiFile = PsiManager.getInstance(project).findFile(virtualFile);
                    if (psiFile == null) continue;
                    
                    // Analyze file structure
                    Map<String, Object> fileInfo = analyzeFileStructure(psiFile);
                    fileAnalysis.add(fileInfo);
                }
                
                // Create the overall design plan
                Map<String, Object> designPlan = new HashMap<>();
                designPlan.put("taskId", taskId);
                designPlan.put("description", taskDescription);
                designPlan.put("fileAnalysis", fileAnalysis);
                
                // Determine required changes based on the task description
                List<Map<String, Object>> requiredChanges = determineRequiredChanges(
                        taskDescription, fileAnalysis);
                designPlan.put("requiredChanges", requiredChanges);
                
                // Add architectural recommendations
                List<String> architecturalRecommendations = generateArchitecturalRecommendations(
                        taskDescription, fileAnalysis);
                designPlan.put("architecturalRecommendations", architecturalRecommendations);
                
                // Add dependencies and order of operations
                List<List<String>> dependencyGraph = createDependencyGraph(requiredChanges);
                designPlan.put("dependencyGraph", dependencyGraph);
                
                future.complete(designPlan);
            } catch (Exception e) {
                LOG.error("Error creating design plan", e);
                future.completeExceptionally(e);
            }
        });
        
        return future;
    }
    
    /**
     * Analyze a file's structure
     */
    private Map<String, Object> analyzeFileStructure(PsiFile psiFile) {
        Map<String, Object> fileInfo = new HashMap<>();
        fileInfo.put("filePath", psiFile.getVirtualFile().getPath());
        fileInfo.put("fileType", psiFile.getFileType().getName());
        
        List<Map<String, Object>> elements = new ArrayList<>();
        
        // For Java files, extract class/method structure
        if (psiFile instanceof PsiJavaFile) {
            PsiJavaFile javaFile = (PsiJavaFile) psiFile;
            
            fileInfo.put("packageName", javaFile.getPackageName());
            
            for (PsiClass psiClass : javaFile.getClasses()) {
                Map<String, Object> classInfo = new HashMap<>();
                classInfo.put("type", "class");
                classInfo.put("name", psiClass.getName());
                classInfo.put("qualifiedName", psiClass.getQualifiedName());
                
                List<Map<String, Object>> methods = new ArrayList<>();
                for (PsiMethod method : psiClass.getMethods()) {
                    Map<String, Object> methodInfo = new HashMap<>();
                    methodInfo.put("name", method.getName());
                    methodInfo.put("returnType", method.getReturnType() != null ? 
                                  method.getReturnType().getPresentableText() : "void");
                    methodInfo.put("parameters", method.getParameterList().getParametersCount());
                    methods.add(methodInfo);
                }
                
                classInfo.put("methods", methods);
                elements.add(classInfo);
            }
        }
        
        fileInfo.put("elements", elements);
        return fileInfo;
    }
    
    /**
     * Determine required changes based on task and file analysis
     */
    private List<Map<String, Object>> determineRequiredChanges(
            String taskDescription, List<Map<String, Object>> fileAnalysis) {
        
        // This is a simplified implementation - in a real system, this would use 
        // AI to analyze the task and determine necessary changes
        List<Map<String, Object>> changes = new ArrayList<>();
        
        // Example change based on the task description
        if (taskDescription.contains("add method")) {
            Map<String, Object> change = new HashMap<>();
            change.put("type", "ADD_METHOD");
            change.put("targetFile", fileAnalysis.get(0).get("filePath"));
            change.put("targetClass", 
                     ((List<Map<String, Object>>) fileAnalysis.get(0).get("elements")).get(0).get("name"));
            change.put("methodName", "newMethod");
            change.put("methodBody", "// TODO: Implement new method\nreturn null;");
            changes.add(change);
        }
        
        return changes;
    }
    
    /**
     * Generate architectural recommendations
     */
    private List<String> generateArchitecturalRecommendations(
            String taskDescription, List<Map<String, Object>> fileAnalysis) {
        
        // In a real implementation, this would use AI to generate recommendations
        List<String> recommendations = new ArrayList<>();
        recommendations.add("Consider extracting common functionality into a utility class");
        recommendations.add("Ensure proper error handling in all modified methods");
        recommendations.add("Add unit tests for new functionality");
        return recommendations;
    }
    
    /**
     * Create a dependency graph for the required changes
     */
    private List<List<String>> createDependencyGraph(List<Map<String, Object>> requiredChanges) {
        // Simplified implementation - in real system, would analyze dependencies between changes
        List<List<String>> dependencyGraph = new ArrayList<>();
        
        // For each change, create a list of changes it depends on
        for (int i = 0; i < requiredChanges.size(); i++) {
            List<String> dependencies = new ArrayList<>();
            // In this simple example, each change depends on all previous changes
            for (int j = 0; j < i; j++) {
                dependencies.add(requiredChanges.get(j).get("type").toString() + "-" + j);
            }
            dependencyGraph.add(dependencies);
        }
        
        return dependencyGraph;
    }
    
    /**
     * Incorporate feedback from the observer agent
     */
    private void incorporateFeedback(AgentMessage message) {
        Map<String, Object> feedback = (Map<String, Object>) message.getPayload();
        String taskId = (String) feedback.get("taskId");
        List<String> observations = (List<String>) feedback.get("observations");
        
        // Update the design plan with the feedback
        Map<String, Object> designPlans = (Map<String, Object>) getFromContext("activeDesignPlans");
        Map<String, Object> taskContext = (Map<String, Object>) designPlans.get(taskId);
        
        if (taskContext != null) {
            Map<String, Object> designPlan = (Map<String, Object>) taskContext.get("designPlan");
            designPlan.put("observerFeedback", observations);
            
            // Refine the design plan based on feedback
            refineDesignPlan(designPlan, observations);
            
            // Notify interested parties of the updated design
            sendMessage("all", MessageType.DESIGN_COMPLETED, designPlan);
        }
    }
    
    /**
     * Refine a design plan based on observer feedback
     */
    private void refineDesignPlan(Map<String, Object> designPlan, List<String> observations) {
        // In a real implementation, this would analyze the feedback and update the plan
        designPlan.put("refined", true);
        designPlan.put("refinementNotes", observations);
    }
    
    /**
     * Share requested context with other agents
     */
    private void shareRequestedContext(AgentMessage message) {
        Map<String, Object> request = (Map<String, Object>) message.getPayload();
        String taskId = (String) request.get("taskId");
        String contextKey = (String) request.get("contextKey");
        
        // Get requested context
        Map<String, Object> designPlans = (Map<String, Object>) getFromContext("activeDesignPlans");
        Map<String, Object> taskContext = (Map<String, Object>) designPlans.get(taskId);
        
        if (taskContext != null) {
            Object contextValue = null;
            
            if ("designPlan".equals(contextKey)) {
                contextValue = taskContext.get("designPlan");
            } else if (taskContext.containsKey(contextKey)) {
                contextValue = taskContext.get(contextKey);
            }
            
            if (contextValue != null) {
                // Send the requested context
                Map<String, Object> response = new HashMap<>();
                response.put("taskId", taskId);
                response.put("contextKey", contextKey);
                response.put("contextValue", contextValue);
                
                AgentMessage responseMsg = message.createResponse(
                        MessageType.CONTEXT_UPDATED,
                        response
                );
                messageBus.publish(responseMsg);
            }
        }
    }
}