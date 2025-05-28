package com.junie.plugin.ai.multiagent;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.editor.Document;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.EditorFactory;
import com.intellij.openapi.fileEditor.FileDocumentManager;
import com.intellij.openapi.fileEditor.FileEditorManager;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.psi.PsiDocumentManager;
import com.intellij.psi.PsiFile;
import com.intellij.psi.PsiManager;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Agent responsible for observing and providing feedback on activities
 */
public class ObserverAgent extends BaseAgent {
    // Tracks edits by file path
    private final Map<String, List<Map<String, Object>>> fileEditHistory = new ConcurrentHashMap<>();
    
    // Tracks when observations were last provided
    private final Map<String, Long> lastObservationTimes = new ConcurrentHashMap<>();
    
    // Configurable observation frequency in milliseconds
    private long observationFrequency = 30000; // Default: 30 seconds
    
    public ObserverAgent(Project project, MessageBus messageBus) {
        super(project, messageBus);
    }
    
    @Override
    public void initialize() {
        LOG.info("Observer agent initialized");
        
        // Initialize isolated context
        addToContext("observationHistory", new HashMap<String, List<String>>());
        addToContext("activeObservations", new HashMap<String, Object>());
        
        // Start tracking document changes
        setupDocumentListeners();
        
        // Announce initialization
        sendMessage("all", MessageType.AGENT_INITIALIZED, "Observer agent ready");
    }
    
    @Override
    protected void processMessage(AgentMessage message) {
        switch (message.getType()) {
            case MessageType.OBSERVATION_REQUIRED:
                handleObservationRequest(message);
                break;
                
            case MessageType.EDIT_COMPLETED:
                recordEditCompletion(message);
                break;
                
            case MessageType.DESIGN_COMPLETED:
                evaluateDesign(message);
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
     * Set up document change listeners to observe editing activity
     */
    private void setupDocumentListeners() {
        ApplicationManager.getApplication().invokeLater(() -> {
            EditorFactory.getInstance().getEventMulticaster().addDocumentListener(
                new com.intellij.openapi.editor.event.DocumentListener() {
                    @Override
                    public void documentChanged(com.intellij.openapi.editor.event.DocumentEvent event) {
                        Document document = event.getDocument();
                        VirtualFile file = FileDocumentManager.getInstance().getFile(document);
                        
                        if (file != null) {
                            String filePath = file.getPath();
                            
                            // Record edit in history
                            Map<String, Object> editInfo = new HashMap<>();
                            editInfo.put("timestamp", System.currentTimeMillis());
                            editInfo.put("offset", event.getOffset());
                            editInfo.put("oldText", event.getOldFragment().toString());
                            editInfo.put("newText", event.getNewFragment().toString());
                            
                            fileEditHistory.computeIfAbsent(filePath, k -> new ArrayList<>()).add(editInfo);
                            
                            // Check if it's time for a periodic observation
                            String activeTaskId = (String) getFromContext("activeTaskId");
                            if (activeTaskId != null) {
                                long lastObservation = lastObservationTimes.getOrDefault(activeTaskId, 0L);
                                long currentTime = System.currentTimeMillis();
                                
                                if (currentTime - lastObservation > observationFrequency) {
                                    lastObservationTimes.put(activeTaskId, currentTime);
                                    performPeriodicObservation(activeTaskId);
                                }
                            }
                        }
                    }
                },
                project.getDisposed()
            );
        });
    }
    
    /**
     * Handle a request for observation
     */
    private void handleObservationRequest(AgentMessage message) {
        Map<String, Object> request = (Map<String, Object>) message.getPayload();
        String taskId = (String) request.get("taskId");
        
        // Store active task ID in context
        addToContext("activeTaskId", taskId);
        
        // Record this as the start of a new observation series
        Map<String, Object> activeObservations = (Map<String, Object>) getFromContext("activeObservations");
        activeObservations.put(taskId, request);
        
        // Reset observation time tracker
        lastObservationTimes.put(taskId, System.currentTimeMillis());
        
        // If this is a design plan evaluation, handle it specifically
        if (request.containsKey("designPlan")) {
            evaluateDesign(message);
            return;
        }
        
        // Otherwise, perform a general observation
        CompletableFuture<List<String>> observationFuture = performObservation(taskId, request);
        
        observationFuture.thenAccept(observations -> {
            // Store observations in history
            Map<String, List<String>> observationHistory = 
                    (Map<String, List<String>>) getFromContext("observationHistory");
            observationHistory.put(taskId, observations);
            
            // Send observation results
            Map<String, Object> result = new HashMap<>();
            result.put("taskId", taskId);
            result.put("observations", observations);
            
            AgentMessage response = message.createResponse(
                    MessageType.OBSERVATION_COMPLETED,
                    result
            );
            messageBus.publish(response);
        });
    }
    
    /**
     * Perform a general observation of the current project state
     */
    private CompletableFuture<List<String>> performObservation(String taskId, Map<String, Object> context) {
        CompletableFuture<List<String>> future = new CompletableFuture<>();
        
        ApplicationManager.getApplication().executeOnPooledThread(() -> {
            try {
                List<String> observations = new ArrayList<>();
                
                // Get currently open files
                Editor[] editors = EditorFactory.getInstance().getAllEditors();
                List<String> openFiles = new ArrayList<>();
                
                for (Editor editor : editors) {
                    Document doc = editor.getDocument();
                    VirtualFile file = FileDocumentManager.getInstance().getFile(doc);
                    if (file != null) {
                        openFiles.add(file.getPath());
                    }
                }
                
                // Analyze recent edits
                Map<String, List<Map<String, Object>>> recentEdits = new HashMap<>();
                for (Map.Entry<String, List<Map<String, Object>>> entry : fileEditHistory.entrySet()) {
                    String filePath = entry.getKey();
                    List<Map<String, Object>> edits = entry.getValue();
                    
                    // Get only the most recent edits (last 10)
                    List<Map<String, Object>> recentFileEdits = edits.size() <= 10 ? 
                            new ArrayList<>(edits) :
                            new ArrayList<>(edits.subList(edits.size() - 10, edits.size()));
                    
                    recentEdits.put(filePath, recentFileEdits);
                }
                
                // Generate observations based on current state
                observations.add("Currently open files: " + String.join(", ", openFiles));
                observations.add("Detected edit patterns: " + analyzeEditPatterns(recentEdits));
                observations.add("Current development focus appears to be on: " + identifyFocus(recentEdits));
                
                // Add code quality observations if available
                List<String> qualityObservations = analyzeCodeQuality();
                if (!qualityObservations.isEmpty()) {
                    observations.addAll(qualityObservations);
                }
                
                future.complete(observations);
            } catch (Exception e) {
                LOG.error("Error performing observation", e);
                future.completeExceptionally(e);
            }
        });
        
        return future;
    }
    
    /**
     * Perform a periodic observation based on ongoing activity
     */
    private void performPeriodicObservation(String taskId) {
        Map<String, Object> activeObservations = (Map<String, Object>) getFromContext("activeObservations");
        Map<String, Object> context = (Map<String, Object>) activeObservations.get(taskId);
        
        if (context == null) return;
        
        // Perform the observation
        CompletableFuture<List<String>> observationFuture = performObservation(taskId, context);
        
        observationFuture.thenAccept(observations -> {
            // Store observations in history
            Map<String, List<String>> observationHistory = 
                    (Map<String, List<String>>) getFromContext("observationHistory");
            observationHistory.put(taskId + "-" + System.currentTimeMillis(), observations);
            
            // Send periodic feedback
            Map<String, Object> feedback = new HashMap<>();
            feedback.put("taskId", taskId);
            feedback.put("observations", observations);
            feedback.put("isPeriodic", true);
            
            sendMessage("all", MessageType.FEEDBACK_PROVIDED, feedback);
        });
    }
    
    /**
     * Record the completion of an edit
     */
    private void recordEditCompletion(AgentMessage message) {
        Map<String, Object> editResult = (Map<String, Object>) message.getPayload();
        String taskId = (String) editResult.get("taskId");
        String filePath = (String) editResult.get("filePath");
        
        // For significant edits, trigger an observation
        if (editResult.containsKey("significant") && (boolean) editResult.get("significant")) {
            // Reset the observation timer
            lastObservationTimes.put(taskId, System.currentTimeMillis());
            
            // Trigger observation
            Map<String, Object> activeObservations = (Map<String, Object>) getFromContext("activeObservations");
            Map<String, Object> context = (Map<String, Object>) activeObservations.get(taskId);
            
            if (context != null) {
                performPeriodicObservation(taskId);
            }
        }
    }
    
    /**
     * Evaluate a design plan
     */
    private void evaluateDesign(AgentMessage message) {
        Map<String, Object> payload = (Map<String, Object>) message.getPayload();
        Map<String, Object> designPlan = (Map<String, Object>) payload.get("designPlan");
        String taskId = (String) designPlan.get("taskId");
        
        // Store design plan in context
        addToContext("currentDesignPlan-" + taskId, designPlan);
        
        // Reset observation time
        lastObservationTimes.put(taskId, System.currentTimeMillis());
        
        // Analyze the design plan
        CompletableFuture<List<String>> evaluationFuture = evaluateDesignPlan(designPlan);
        
        evaluationFuture.thenAccept(observations -> {
            // Store observations
            Map<String, List<String>> observationHistory = 
                    (Map<String, List<String>>) getFromContext("observationHistory");
            observationHistory.put("design-" + taskId, observations);
            
            // Send evaluation results
            Map<String, Object> result = new HashMap<>();
            result.put("taskId", taskId);
            result.put("observations", observations);
            
            AgentMessage response = message.createResponse(
                    MessageType.OBSERVATION_COMPLETED,
                    result
            );
            messageBus.publish(response);
        });
    }
    
    /**
     * Evaluate a design plan for feasibility and improvements
     */
    private CompletableFuture<List<String>> evaluateDesignPlan(Map<String, Object> designPlan) {
        CompletableFuture<List<String>> future = new CompletableFuture<>();
        
        ApplicationManager.getApplication().executeOnPooledThread(() -> {
            try {
                List<String> observations = new ArrayList<>();
                
                // Extract plan details
                String taskId = (String) designPlan.get("taskId");
                String description = (String) designPlan.get("description");
                List<Map<String, Object>> fileAnalysis = 
                        (List<Map<String, Object>>) designPlan.get("fileAnalysis");
                List<Map<String, Object>> requiredChanges = 
                        (List<Map<String, Object>>) designPlan.get("requiredChanges");
                
                // Evaluate completeness
                observations.add("Design plan completeness: " + 
                                 evaluateCompleteness(description, requiredChanges));
                
                // Evaluate coherence
                observations.add("Design coherence: " + 
                                 evaluateCoherence(requiredChanges));
                
                // Evaluate feasibility
                observations.add("Implementation feasibility: " + 
                                 evaluateFeasibility(requiredChanges, fileAnalysis));
                
                // Suggest improvements
                List<String> improvements = suggestImprovements(designPlan);
                observations.add("Suggested improvements:");
                observations.addAll(improvements);
                
                future.complete(observations);
            } catch (Exception e) {
                LOG.error("Error evaluating design plan", e);
                future.completeExceptionally(e);
            }
        });
        
        return future;
    }
    
    /**
     * Evaluate the completeness of a design plan
     */
    private String evaluateCompleteness(String description, List<Map<String, Object>> requiredChanges) {
        // In a real implementation, this would analyze the task description and changes
        // to determine if all requirements are covered
        
        if (requiredChanges.isEmpty()) {
            return "Incomplete - no changes specified";
        }
        
        // Check if key terms in the description are addressed in the changes
        String[] keyTerms = description.toLowerCase().split("\\s+");
        Set<String> addressedTerms = new HashSet<>();
        
        for (Map<String, Object> change : requiredChanges) {
            String changeDescription = change.toString().toLowerCase();
            for (String term : keyTerms) {
                if (term.length() > 4 && changeDescription.contains(term)) {
                    addressedTerms.add(term);
                }
            }
        }
        
        double coveragePercent = (double) addressedTerms.size() / keyTerms.length * 100;
        if (coveragePercent < 50) {
            return "Potentially incomplete - low coverage of requirements";
        } else if (coveragePercent < 80) {
            return "Moderate completeness - some requirements may need more attention";
        } else {
            return "Good completeness - most requirements appear to be addressed";
        }
    }
    
    /**
     * Evaluate the coherence of the required changes
     */
    private String evaluateCoherence(List<Map<String, Object>> requiredChanges) {
        // In a real implementation, this would analyze the changes for conflicts,
        // redundancies, and logical relationships
        
        if (requiredChanges.size() <= 1) {
            return "N/A - too few changes to evaluate coherence";
        }
        
        // Check for potential conflicts or redundancies
        boolean hasConflicts = false;
        boolean hasRedundancies = false;
        
        // This is a simplified check - real implementation would be more sophisticated
        Set<String> targetPaths = new HashSet<>();
        for (Map<String, Object> change : requiredChanges) {
            String targetPath = (String) change.get("targetFile");
            if (targetPath != null && !targetPaths.add(targetPath)) {
                // Multiple changes to the same file - potential conflict or redundancy
                hasConflicts = true;
            }
        }
        
        if (hasConflicts) {
            return "Potential conflicts detected - multiple changes to the same files";
        } else if (hasRedundancies) {
            return "Potential redundancies detected - some changes may be consolidated";
        } else {
            return "Good coherence - changes appear to be well-organized";
        }
    }
    
    /**
     * Evaluate the feasibility of implementing the required changes
     */
    private String evaluateFeasibility(
            List<Map<String, Object>> requiredChanges, 
            List<Map<String, Object>> fileAnalysis) {
        
        // In a real implementation, this would analyze whether the changes are
        // technically feasible given the codebase structure
        
        boolean allTargetsExist = true;
        
        for (Map<String, Object> change : requiredChanges) {
            String targetFile = (String) change.get("targetFile");
            String targetClass = (String) change.get("targetClass");
            
            boolean fileExists = false;
            boolean classExists = false;
            
            // Check if target file exists
            for (Map<String, Object> fileInfo : fileAnalysis) {
                String filePath = (String) fileInfo.get("filePath");
                if (targetFile.equals(filePath)) {
                    fileExists = true;
                    
                    // Check if target class exists (if specified)
                    if (targetClass != null) {
                        List<Map<String, Object>> elements = 
                                (List<Map<String, Object>>) fileInfo.get("elements");
                        
                        for (Map<String, Object> element : elements) {
                            if ("class".equals(element.get("type")) && 
                                targetClass.equals(element.get("name"))) {
                                classExists = true;
                                break;
                            }
                        }
                    } else {
                        classExists = true; // No specific class targeted
                    }
                    
                    break;
                }
            }
            
            if (!fileExists || !classExists) {
                allTargetsExist = false;
                break;
            }
        }
        
        if (!allTargetsExist) {
            return "Low feasibility - some target files or classes don't exist";
        } else {
            return "Good feasibility - all targets exist and changes appear implementable";
        }
    }
    
    /**
     * Suggest improvements to the design plan
     */
    private List<String> suggestImprovements(Map<String, Object> designPlan) {
        // In a real implementation, this would analyze the design plan and suggest
        // specific improvements based on best practices and project context
        
        List<String> improvements = new ArrayList<>();
        
        improvements.add("- Consider adding explicit error handling for edge cases");
        improvements.add("- Ensure changes are covered by unit tests");
        improvements.add("- Document public APIs that are being modified");
        improvements.add("- Consider impact on existing functionality and backward compatibility");
        
        return improvements;
    }
    
    /**
     * Analyze edit patterns in recent edits
     */
    private String analyzeEditPatterns(Map<String, List<Map<String, Object>>> recentEdits) {
        // In a real implementation, this would analyze edit patterns to identify 
        // developer behavior and potential issues
        
        if (recentEdits.isEmpty()) {
            return "No recent edits detected";
        }
        
        int totalEdits = 0;
        int bigEdits = 0;
        int smallEdits = 0;
        
        for (List<Map<String, Object>> fileEdits : recentEdits.values()) {
            totalEdits += fileEdits.size();
            
            for (Map<String, Object> edit : fileEdits) {
                String newText = (String) edit.get("newText");
                if (newText != null) {
                    if (newText.length() > 50) {
                        bigEdits++;
                    } else {
                        smallEdits++;
                    }
                }
            }
        }
        
        if (bigEdits > smallEdits * 2) {
            return "Large, infrequent changes - consider more incremental development";
        } else if (smallEdits > bigEdits * 5) {
            return "Many small, frequent changes - possibly fine-tuning or experimentation";
        } else {
            return "Balanced mix of edit sizes - good development rhythm";
        }
    }
    
    /**
     * Identify the current focus of development
     */
    private String identifyFocus(Map<String, List<Map<String, Object>>> recentEdits) {
        // Identify which files have the most activity
        if (recentEdits.isEmpty()) {
            return "Unknown - no recent activity";
        }
        
        // Find the file with the most edits
        String mostActiveFile = null;
        int mostEdits = 0;
        
        for (Map.Entry<String, List<Map<String, Object>>> entry : recentEdits.entrySet()) {
            int edits = entry.getValue().size();
            if (edits > mostEdits) {
                mostEdits = edits;
                mostActiveFile = entry.getKey();
            }
        }
        
        if (mostActiveFile != null) {
            // Extract the file name from the path
            String fileName = mostActiveFile.substring(mostActiveFile.lastIndexOf('/') + 1);
            return fileName + " (" + mostEdits + " recent edits)";
        } else {
            return "Unknown - no clear focus";
        }
    }
    
    /**
     * Analyze code quality of recent changes
     */
    private List<String> analyzeCodeQuality() {
        List<String> observations = new ArrayList<>();
        
        // Get currently open file for analysis
        FileEditorManager fileEditorManager = FileEditorManager.getInstance(project);
        VirtualFile[] openFiles = fileEditorManager.getSelectedFiles();
        
        for (VirtualFile file : openFiles) {
            PsiFile psiFile = PsiManager.getInstance(project).findFile(file);
            if (psiFile != null) {
                // For Java files, perform simple quality checks
                if (psiFile instanceof com.intellij.psi.PsiJavaFile) {
                    com.intellij.psi.PsiJavaFile javaFile = (com.intellij.psi.PsiJavaFile) psiFile;
                    
                    // Check for missing documentation
                    boolean hasMissingDocs = false;
                    for (com.intellij.psi.PsiClass psiClass : javaFile.getClasses()) {
                        if (psiClass.getDocComment() == null) {
                            hasMissingDocs = true;
                            break;
                        }
                        
                        for (com.intellij.psi.PsiMethod method : psiClass.getMethods()) {
                            if (method.getModifierList().hasModifierProperty(com.intellij.psi.PsiModifier.PUBLIC) &&
                                method.getDocComment() == null) {
                                hasMissingDocs = true;
                                break;
                            }
                        }
                    }
                    
                    if (hasMissingDocs) {
                        observations.add("Missing documentation for public methods in " + file.getName());
                    }
                    
                    // Check for excessively long methods
                    for (com.intellij.psi.PsiClass psiClass : javaFile.getClasses()) {
                        for (com.intellij.psi.PsiMethod method : psiClass.getMethods()) {
                            if (method.getBody() != null) {
                                int lines = method.getBody().getText().split("\n").length;
                                if (lines > 30) {
                                    observations.add("Method " + method.getName() + 
                                                     " in " + file.getName() + 
                                                     " is excessively long (" + lines + " lines)");
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return observations;
    }
    
    /**
     * Share requested context with other agents
     */
    private void shareRequestedContext(AgentMessage message) {
        Map<String, Object> request = (Map<String, Object>) message.getPayload();
        String taskId = (String) request.get("taskId");
        String contextKey = (String) request.get("contextKey");
        
        // Get requested context
        Object contextValue = null;
        
        if ("observations".equals(contextKey)) {
            Map<String, List<String>> observationHistory = 
                    (Map<String, List<String>>) getFromContext("observationHistory");
            contextValue = observationHistory.get(taskId);
        } else if (getFromContext(contextKey + "-" + taskId) != null) {
            contextValue = getFromContext(contextKey + "-" + taskId);
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
    
    /**
     * Set the observation frequency
     */
    public void setObservationFrequency(long milliseconds) {
        this.observationFrequency = milliseconds;
    }
}