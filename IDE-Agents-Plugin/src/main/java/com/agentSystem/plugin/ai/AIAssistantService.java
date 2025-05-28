package com.junie.plugin.ai;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.project.Project;
import org.jetbrains.annotations.NotNull;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Service that provides AI-powered code suggestions.
 * This service uses a sequential agent with isolated context for generating suggestions.
 */
@Service
public final class AIAssistantService {
    private static final Logger LOG = Logger.getInstance(AIAssistantService.class);
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();
    private final SequentialAgentManager agentManager = new SequentialAgentManager();
    
    /**
     * Gets the instance of the service.
     *
     * @return The service instance
     */
    public static AIAssistantService getInstance() {
        return ApplicationManager.getApplication().getService(AIAssistantService.class);
    }
    
    /**
     * Suggests code completion at the current cursor position.
     *
     * @param editor The editor
     * @param project The project
     * @param offset The cursor offset
     */
    public void suggestCompletion(@NotNull Editor editor, @NotNull Project project, int offset) {
        // Submit task to background thread to avoid blocking EDT
        executorService.submit(() -> {
            try {
                // Get current context from the editor
                String context = getEditorContext(editor, offset);
                
                // Spawn a sequential agent with isolated context for this specific task
                agentManager.spawnAgent(context, suggestion -> {
                    // Apply suggestion in the editor when the agent returns it
                    if (suggestion != null && !suggestion.isEmpty()) {
                        applySuggestion(editor, project, offset, suggestion);
                    }
                });
            } catch (Exception e) {
                LOG.error("Error generating AI suggestion", e);
            }
        });
    }
    
    /**
     * Gets the context from the editor.
     *
     * @param editor The editor
     * @param offset The cursor offset
     * @return The context
     */
    private String getEditorContext(@NotNull Editor editor, int offset) {
        // Get text before cursor for context (simplified)
        // In a real implementation, you'd include more context and language-specific parsing
        String text = editor.getDocument().getText();
        int startOffset = Math.max(0, offset - 500); // Get last 500 chars for context
        return text.substring(startOffset, offset);
    }
    
    /**
     * Applies the suggestion to the editor.
     *
     * @param editor The editor
     * @param project The project
     * @param offset The cursor offset
     * @param suggestion The suggestion
     */
    private void applySuggestion(@NotNull Editor editor, @NotNull Project project, int offset, String suggestion) {
        // Must run UI updates on EDT thread
        ApplicationManager.getApplication().invokeLater(() -> {
            // Show suggestion as inline element
            InlineSuggestionManager.getInstance().showSuggestion(editor, offset, suggestion);
        });
    }
}