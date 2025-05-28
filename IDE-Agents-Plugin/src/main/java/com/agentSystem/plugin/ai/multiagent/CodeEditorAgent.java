package com.junie.plugin.ai.multiagent;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.command.CommandProcessor;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.editor.Document;
import com.intellij.openapi.fileEditor.FileDocumentManager;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.vfs.LocalFileSystem;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.psi.*;
import com.intellij.psi.util.PsiTreeUtil;

import java.io.File;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Agent responsible for making code changes
 */
public class CodeEditorAgent extends BaseAgent {
    
    public CodeEditorAgent(Project project, MessageBus messageBus) {
        super(project, messageBus);
    }
    
    @Override
    public void initialize() {
        LOG.info("Code Editor agent initialized");
        
        // Initialize isolated context
        addToContext("pendingEdits", new HashMap<String, Object>());
        addToContext("completedEdits", new HashMap<String, List<Map<String, Object>>>());
        
        // Announce initialization
        sendMessage("all", MessageType.AGENT_INITIALIZED, "Code Editor agent ready");
    }
    
    @Override
    protected void processMessage(AgentMessage message) {
        switch (message.getType()) {
            case MessageType.EDIT_REQUIRED:
                handleEditRequest(message);
                break;
                
            case MessageType.DESIGN_COMPLETED:
                processDesignPlan(message);
                break;
                
            case MessageType.CONTEXT_REQUESTED:
                shareRequestedContext(message);
                break;
                
            case MessageType.FEEDBACK_PROVIDED:
                incorporateFeedback(message);
                break;
                
            default:
                // Ignore messages we don't handle
                break;
        }
    }
    
    /**
     * Handle a request to make edits
     */
    private void handleEditRequest(AgentMessage message) {
        Map<String, Object> request = (Map<String, Object>) message.getPayload();
        String taskId = (String) request.get("taskId");
        
        // Store the edit request in the pending edits
        Map<String, Object> pendingEdits = (Map<String, Object>) getFromContext("pendingEdits");
        pendingEdits.put(taskId, request);
        
        LOG.info("Received edit request for task: " + taskId);
        
        // If this already includes specific edits, process them directly
        if (request.containsKey("edits")) {
            List<Map<String, Object>> edits = (List<Map<String, Object>>) request.get("edits");
            executeEdits(taskId, edits, message);
        } 
        // Otherwise, we need a design plan
        else {
            // Request design plan if not already provided
            if (!request.containsKey("designPlan")) {
                LOG.info("Requesting design plan for task: " + taskId);
                
                // Make a copy of the request for the architect
                Map<String, Object> designRequest = new HashMap<>(request);
                
                sendMessage("ArchitectAgent", MessageType.DESIGN_REQUIRED, designRequest);
            } else {
                // We already have a design plan, process it
                processDesignPlan(message);
            }
        }
    }
    
    /**
     * Process a completed design plan
     */
    private void processDesignPlan(AgentMessage message) {
        Map<String, Object> payload = (Map<String, Object>) message.getPayload();
        Map<String, Object> designPlan;
        
        // Extract the design plan from the payload
        if (payload.containsKey("designPlan")) {
            designPlan = (Map<String, Object>) payload.get("designPlan");
        } else {
            designPlan = payload; // The payload itself is the design plan
        }
        
        String taskId = (String) designPlan.get("taskId");
        LOG.info("Processing design plan for task: " + taskId);
        
        // Extract required changes from the design plan
        List<Map<String, Object>> requiredChanges = 
                (List<Map<String, Object>>) designPlan.get("requiredChanges");
        
        if (requiredChanges == null || requiredChanges.isEmpty()) {
            LOG.warn("No changes specified in design plan for task: " + taskId);
            
            // Notify that no changes were made
            Map<String, Object> result = new HashMap<>();
            result.put("taskId", taskId);
            result.put("status", "no_changes");
            result.put("message", "No changes were specified in the design plan");
            
            AgentMessage response = message.createResponse(
                    MessageType.EDIT_COMPLETED,
                    result
            );
            messageBus.publish(response);
            return;
        }
        
        // Store the design plan in context
        addToContext("designPlan-" + taskId, designPlan);
        
        // Process the dependency graph to determine execution order
        List<List<String>> dependencyGraph = 
                (List<List<String>>) designPlan.get("dependencyGraph");
        
        // Convert required changes to edits and execute them
        executeEdits(taskId, requiredChanges, message);
    }
    
    /**
     * Execute a set of edits
     */
    private void executeEdits(String taskId, List<Map<String, Object>> edits, AgentMessage originalMessage) {
        LOG.info("Executing " + edits.size() + " edits for task: " + taskId);
        
        // Process edits one by one
        CompletableFuture<Void> future = CompletableFuture.completedFuture(null);
        List<Map<String, Object>> completedEdits = new ArrayList<>();
        
        for (Map<String, Object> edit : edits) {
            future = future.thenCompose(v -> executeEdit(taskId, edit))
                    .thenAccept(result -> {
                        if (result != null) {
                            completedEdits.add(result);
                        }
                    });
        }
        
        // When all edits are complete, send a response
        future.thenRun(() -> {
            // Store completed edits in context
            Map<String, List<Map<String, Object>>> allCompletedEdits = 
                    (Map<String, List<Map<String, Object>>>) getFromContext("completedEdits");
            allCompletedEdits.put(taskId, completedEdits);
            
            // Remove from pending edits
            Map<String, Object> pendingEdits = (Map<String, Object>) getFromContext("pendingEdits");
            pendingEdits.remove(taskId);
            
            // Send completion message
            Map<String, Object> result = new HashMap<>();
            result.put("taskId", taskId);
            result.put("status", "completed");
            result.put("editCount", completedEdits.size());
            result.put("completedEdits", completedEdits);
            result.put("significant", completedEdits.size() > 0);
            
            AgentMessage response = originalMessage.createResponse(
                    MessageType.EDIT_COMPLETED,
                    result
            );
            messageBus.publish(response);
            
            LOG.info("Completed all edits for task: " + taskId);
        }).exceptionally(ex -> {
            LOG.error("Error executing edits for task: " + taskId, ex);
            
            // Send error message
            Map<String, Object> result = new HashMap<>();
            result.put("taskId", taskId);
            result.put("status", "error");
            result.put("message", ex.getMessage());
            
            AgentMessage response = originalMessage.createResponse(
                    MessageType.TASK_FAILED,
                    result
            );
            messageBus.publish(response);
            
            return null;
        });
    }
    
    /**
     * Execute a single edit
     */
    private CompletableFuture<Map<String, Object>> executeEdit(String taskId, Map<String, Object> edit) {
        CompletableFuture<Map<String, Object>> future = new CompletableFuture<>();
        
        ApplicationManager.getApplication().invokeLater(() -> {
            try {
                String editType = (String) edit.get("type");
                String targetFilePath = (String) edit.get("targetFile");
                
                LOG.info("Executing edit type " + editType + " on file " + targetFilePath);
                
                // Find the target file
                VirtualFile targetFile = findOrCreateFile(targetFilePath);
                if (targetFile == null) {
                    throw new IllegalStateException("Could not find or create target file: " + targetFilePath);
                }
                
                // Get document from file
                Document document = FileDocumentManager.getInstance().getDocument(targetFile);
                if (document == null) {
                    throw new IllegalStateException("Could not get document for file: " + targetFilePath);
                }
                
                // Get PSI file from document
                PsiFile psiFile = PsiDocumentManager.getInstance(project).getPsiFile(document);
                if (psiFile == null) {
                    throw new IllegalStateException("Could not get PSI file for document: " + targetFilePath);
                }
                
                // Execute the edit based on its type
                Map<String, Object> result = new HashMap<>(edit);
                result.put("filePath", targetFilePath);
                
                CommandProcessor.getInstance().executeCommand(project, () -> {
                    ApplicationManager.getApplication().runWriteAction(() -> {
                        try {
                            switch (editType) {
                                case "ADD_METHOD":
                                    addMethod(psiFile, document, edit, result);
                                    break;
                                    
                                case "MODIFY_METHOD":
                                    modifyMethod(psiFile, document, edit, result);
                                    break;
                                    
                                case "ADD_CLASS":
                                    addClass(psiFile, document, edit, result);
                                    break;
                                    
                                case "ADD_IMPORT":
                                    addImport(psiFile, document, edit, result);
                                    break;
                                    
                                case "REPLACE_TEXT":
                                    replaceText(document, edit, result);
                                    break;
                                    
                                default:
                                    throw new IllegalArgumentException("Unsupported edit type: " + editType);
                            }
                            
                            // Save the document
                            FileDocumentManager.getInstance().saveDocument(document);
                            
                            result.put("status", "completed");
                            future.complete(result);
                        } catch (Exception e) {
                            LOG.error("Error executing edit", e);
                            result.put("status", "error");
                            result.put("error", e.getMessage());
                            future.complete(result);
                        }
                    });
                }, "AI Assistant Edit", null);
            } catch (Exception e) {
                LOG.error("Error preparing edit", e);
                Map<String, Object> result = new HashMap<>(edit);
                result.put("status", "error");
                result.put("error", e.getMessage());
                future.complete(result);
            }
        });
        
        return future;
    }
    
    /**
     * Find or create a file
     */
    private VirtualFile findOrCreateFile(String filePath) {
        // First try to find the file
        VirtualFile file = LocalFileSystem.getInstance().findFileByPath(filePath);
        
        if (file != null) {
            return file;
        }
        
        // If the file doesn't exist, create it
        try {
            File ioFile = new File(filePath);
            if (!ioFile.exists()) {
                // Ensure parent directories exist
                if (ioFile.getParentFile() != null) {
                    ioFile.getParentFile().mkdirs();
                }
                
                // Create the file
                ioFile.createNewFile();
            }
            
            // Refresh the VFS to see the new file
            VirtualFile parentDir = LocalFileSystem.getInstance().refreshAndFindFileByPath(
                    ioFile.getParent().replace('\\', '/'));
            
            if (parentDir != null) {
                parentDir.refresh(false, true);
                return LocalFileSystem.getInstance().findFileByPath(filePath);
            }
        } catch (Exception e) {
            LOG.error("Error creating file: " + filePath, e);
        }
        
        return null;
    }
    
    /**
     * Add a method to a class
     */
    private void addMethod(PsiFile psiFile, Document document, 
                          Map<String, Object> edit, Map<String, Object> result) {
        
        if (!(psiFile instanceof PsiJavaFile)) {
            throw new IllegalArgumentException("File is not a Java file");
        }
        
        PsiJavaFile javaFile = (PsiJavaFile) psiFile;
        String targetClassName = (String) edit.get("targetClass");
        String methodName = (String) edit.get("methodName");
        String methodBody = (String) edit.get("methodBody");
        String returnType = (String) edit.getOrDefault("returnType", "void");
        
        // Find the target class
        PsiClass targetClass = null;
        for (PsiClass psiClass : javaFile.getClasses()) {
            if (targetClassName.equals(psiClass.getName())) {
                targetClass = psiClass;
                break;
            }
        }
        
        if (targetClass == null) {
            throw new IllegalArgumentException("Target class not found: " + targetClassName);
        }
        
        // Check if method already exists
        for (PsiMethod existingMethod : targetClass.getMethods()) {
            if (methodName.equals(existingMethod.getName())) {
                throw new IllegalArgumentException("Method already exists: " + methodName);
            }
        }
        
        // Generate method text
        String methodText = "public " + returnType + " " + methodName + "() {\n" +
                            methodBody + "\n" +
                            "}";
        
        // Find position to insert method
        int insertPosition = targetClass.getTextRange().getEndOffset() - 1;
        
        // Insert the method
        document.insertString(insertPosition, "\n\n    " + methodText);
        
        // Commit document changes
        PsiDocumentManager.getInstance(project).commitDocument(document);
        
        result.put("insertPosition", insertPosition);
        result.put("insertedText", methodText);
    }
    
    /**
     * Modify an existing method
     */
    private void modifyMethod(PsiFile psiFile, Document document, 
                             Map<String, Object> edit, Map<String, Object> result) {
        
        if (!(psiFile instanceof PsiJavaFile)) {
            throw new IllegalArgumentException("File is not a Java file");
        }
        
        PsiJavaFile javaFile = (PsiJavaFile) psiFile;
        String targetClassName = (String) edit.get("targetClass");
        String methodName = (String) edit.get("methodName");
        String newMethodBody = (String) edit.get("newMethodBody");
        
        // Find the target class
        PsiClass targetClass = null;
        for (PsiClass psiClass : javaFile.getClasses()) {
            if (targetClassName.equals(psiClass.getName())) {
                targetClass = psiClass;
                break;
            }
        }
        
        if (targetClass == null) {
            throw new IllegalArgumentException("Target class not found: " + targetClassName);
        }
        
        // Find the target method
        PsiMethod targetMethod = null;
        for (PsiMethod method : targetClass.getMethods()) {
            if (methodName.equals(method.getName())) {
                targetMethod = method;
                break;
            }
        }
        
        if (targetMethod == null) {
            throw new IllegalArgumentException("Target method not found: " + methodName);
        }
        
        // Get the method body
        PsiCodeBlock body = targetMethod.getBody();
        if (body == null) {
            throw new IllegalArgumentException("Method has no body: " + methodName);
        }
        
        // Replace the method body
        int startOffset = body.getFirstChild().getTextOffset() + 1; // Skip the opening brace
        int endOffset = body.getLastChild().getTextOffset(); // Up to the closing brace
        
        document.replaceString(startOffset, endOffset, "\n        " + newMethodBody + "\n    ");
        
        // Commit document changes
        PsiDocumentManager.getInstance(project).commitDocument(document);
        
        result.put("modifiedMethod", methodName);
        result.put("originalText", body.getText());
        result.put("newText", "{\n        " + newMethodBody + "\n    }");
    }
    
    /**
     * Add a new class to a file
     */
    private void addClass(PsiFile psiFile, Document document, 
                         Map<String, Object> edit, Map<String, Object> result) {
        
        if (!(psiFile instanceof PsiJavaFile)) {
            throw new IllegalArgumentException("File is not a Java file");
        }
        
        PsiJavaFile javaFile = (PsiJavaFile) psiFile;
        String className = (String) edit.get("className");
        String classBody = (String) edit.getOrDefault("classBody", "");
        
        // Check if class already exists
        for (PsiClass existingClass : javaFile.getClasses()) {
            if (className.equals(existingClass.getName())) {
                throw new IllegalArgumentException("Class already exists: " + className);
            }
        }
        
        // Generate class text
        String packageStatement = javaFile.getPackageName().isEmpty() ? 
                "" : "package " + javaFile.getPackageName() + ";\n\n";
        
        String classText = "public class " + className + " {\n" +
                          classBody + "\n" +
                          "}";
        
        // For new files, replace the entire content
        if (document.getTextLength() == 0) {
            document.setText(packageStatement + classText);
        } else {
            // For existing files, add the class at the end
            document.insertString(document.getTextLength(), "\n\n" + classText);
        }
        
        // Commit document changes
        PsiDocumentManager.getInstance(project).commitDocument(document);
        
        result.put("addedClass", className);
        result.put("insertedText", classText);
    }
    
    /**
     * Add an import statement to a file
     */
    private void addImport(PsiFile psiFile, Document document, 
                          Map<String, Object> edit, Map<String, Object> result) {
        
        if (!(psiFile instanceof PsiJavaFile)) {
            throw new IllegalArgumentException("File is not a Java file");
        }
        
        PsiJavaFile javaFile = (PsiJavaFile) psiFile;
        String importStatement = (String) edit.get("import");
        
        // Check if import already exists
        for (PsiImportStatement existingImport : javaFile.getImportList().getImportStatements()) {
            if (existingImport.getQualifiedName().equals(importStatement)) {
                // Import already exists, nothing to do
                result.put("status", "skipped");
                result.put("reason", "Import already exists");
                return;
            }
        }
        
        // Find position to insert import
        int insertPosition = 0;
        
        // After package statement if it exists
        PsiPackageStatement packageStatement = javaFile.getPackageStatement();
        if (packageStatement != null) {
            insertPosition = packageStatement.getTextRange().getEndOffset() + 1;
        }
        
        // After existing imports if any
        PsiImportList importList = javaFile.getImportList();
        if (importList != null && importList.getImportStatements().length > 0) {
            insertPosition = importList.getTextRange().getEndOffset() + 1;
        }
        
        // Insert the import
        String importText = "import " + importStatement + ";\n";
        document.insertString(insertPosition, importText);
        
        // Commit document changes
        PsiDocumentManager.getInstance(project).commitDocument(document);
        
        result.put("addedImport", importStatement);
        result.put("insertPosition", insertPosition);
    }
    
    /**
     * Replace text in a document
     */
    private void replaceText(Document document, Map<String, Object> edit, Map<String, Object> result) {
        int startOffset = ((Number) edit.get("startOffset")).intValue();
        int endOffset = ((Number) edit.get("endOffset")).intValue();
        String newText = (String) edit.get("newText");
        
        // Validate offsets
        if (startOffset < 0 || endOffset > document.getTextLength() || startOffset > endOffset) {
            throw new IllegalArgumentException("Invalid text range: " + 
                                             startOffset + "-" + endOffset);
        }
        
        // Get original text
        String originalText = document.getText(new com.intellij.openapi.util.TextRange(startOffset, endOffset));
        
        // Replace the text
        document.replaceString(startOffset, endOffset, newText);
        
        // Commit document changes
        PsiDocumentManager.getInstance(project).commitDocument(document);
        
        result.put("startOffset", startOffset);
        result.put("endOffset", endOffset);
        result.put("originalText", originalText);
        result.put("newText", newText);
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
        
        if ("completedEdits".equals(contextKey)) {
            Map<String, List<Map<String, Object>>> completedEdits = 
                    (Map<String, List<Map<String, Object>>>) getFromContext("completedEdits");
            contextValue = completedEdits.get(taskId);
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
     * Incorporate feedback from the observer
     */
    private void incorporateFeedback(AgentMessage message) {
        Map<String, Object> feedback = (Map<String, Object>) message.getPayload();
        String taskId = (String) feedback.get("taskId");
        List<String> observations = (List<String>) feedback.get("observations");
        boolean isPeriodic = feedback.containsKey("isPeriodic") && (boolean) feedback.get("isPeriodic");
        
        // For periodic feedback, adjust current work if necessary
        if (isPeriodic) {
            Map<String, Object> pendingEdits = (Map<String, Object>) getFromContext("pendingEdits");
            Map<String, Object> taskEdits = (Map<String, Object>) pendingEdits.get(taskId);
            
            if (taskEdits != null) {
                // Store the feedback
                if (!taskEdits.containsKey("feedback")) {
                    taskEdits.put("feedback", new ArrayList<List<String>>());
                }
                
                List<List<String>> allFeedback = (List<List<String>>) taskEdits.get("feedback");
                allFeedback.add(observations);
                
                // Adjust current work based on feedback
                // This is a simplified implementation - a real system would analyze
                // the feedback and make appropriate adjustments
                LOG.info("Received periodic feedback for task: " + taskId);
            }
        }
    }
}