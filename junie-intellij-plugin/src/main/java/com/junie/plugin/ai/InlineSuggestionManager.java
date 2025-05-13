package com.junie.plugin.ai;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.command.CommandProcessor;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.editor.Document;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.EditorCustomElementRenderer;
import com.intellij.openapi.editor.Inlay;
import com.intellij.openapi.editor.markup.TextAttributes;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.util.Key;
import com.intellij.ui.JBColor;
import org.jetbrains.annotations.NotNull;

import java.awt.*;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.util.ArrayList;
import java.util.List;

/**
 * Manages the display of inline suggestions in the editor.
 */
public class InlineSuggestionManager {
    private static final Logger LOG = Logger.getInstance(InlineSuggestionManager.class);
    private static final Key<List<Inlay<SuggestionRenderer>>> SUGGESTION_INLAYS_KEY = 
            Key.create("AI_SUGGESTION_INLAYS");
    
    /**
     * Gets the instance of the manager.
     *
     * @return The manager instance
     */
    public static InlineSuggestionManager getInstance() {
        return ApplicationManager.getApplication().getService(InlineSuggestionManager.class);
    }
    
    /**
     * Shows a suggestion at the specified offset in the editor.
     *
     * @param editor The editor
     * @param offset The offset
     * @param suggestion The suggestion
     */
    public void showSuggestion(@NotNull Editor editor, int offset, String suggestion) {
        // Clear any existing suggestions
        clearSuggestions(editor);
        
        // Add a key listener to apply suggestion on Tab
        editor.getContentComponent().addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                if (e.getKeyCode() == KeyEvent.VK_TAB) {
                    List<Inlay<SuggestionRenderer>> inlays = editor.getUserData(SUGGESTION_INLAYS_KEY);
                    if (inlays != null && !inlays.isEmpty()) {
                        e.consume(); // Consume tab key to prevent regular tab insertion
                        applySuggestion(editor, editor.getProject(), offset, suggestion);
                        clearSuggestions(editor);
                    }
                } else if (e.getKeyCode() == KeyEvent.VK_ESCAPE) {
                    clearSuggestions(editor);
                }
            }
        });
        
        // Create ghost text renderer
        SuggestionRenderer renderer = new SuggestionRenderer(suggestion);
        
        // Add inline element
        ApplicationManager.getApplication().runWriteAction(() -> {
            Inlay<SuggestionRenderer> inlay = editor.getInlayModel()
                    .addInlineElement(offset, true, renderer);
            
            // Store inlay reference for later removal
            List<Inlay<SuggestionRenderer>> inlays = 
                    editor.getUserData(SUGGESTION_INLAYS_KEY);
            if (inlays == null) {
                inlays = new ArrayList<>();
                editor.putUserData(SUGGESTION_INLAYS_KEY, inlays);
            }
            inlays.add(inlay);
            
            LOG.info("Showed suggestion at offset " + offset);
        });
    }
    
    /**
     * Clears all suggestions from the editor.
     *
     * @param editor The editor
     */
    public void clearSuggestions(@NotNull Editor editor) {
        List<Inlay<SuggestionRenderer>> inlays = editor.getUserData(SUGGESTION_INLAYS_KEY);
        if (inlays != null) {
            ApplicationManager.getApplication().runWriteAction(() -> {
                for (Inlay<SuggestionRenderer> inlay : inlays) {
                    if (!inlay.isValid()) continue;
                    inlay.dispose();
                }
                inlays.clear();
                LOG.info("Cleared suggestions");
            });
        }
    }
    
    /**
     * Applies a suggestion to the editor.
     *
     * @param editor The editor
     * @param project The project
     * @param offset The offset
     * @param suggestion The suggestion
     */
    private void applySuggestion(@NotNull Editor editor, Project project, int offset, String suggestion) {
        // Get document
        Document document = editor.getDocument();
        
        // Apply change through command processor for undo support
        CommandProcessor.getInstance().executeCommand(project, () -> {
            ApplicationManager.getApplication().runWriteAction(() -> {
                document.insertString(offset, suggestion);
                LOG.info("Applied suggestion at offset " + offset);
            });
        }, "AI Suggestion", null);
    }
    
    /**
     * Renderer for ghost text suggestions.
     */
    private static class SuggestionRenderer implements EditorCustomElementRenderer {
        private final String suggestionText;
        
        SuggestionRenderer(String suggestionText) {
            this.suggestionText = suggestionText;
        }
        
        @Override
        public int calcWidthInPixels(@NotNull Inlay inlay) {
            Editor editor = inlay.getEditor();
            FontMetrics fontMetrics = editor.getContentComponent().getFontMetrics(editor.getColorsScheme().getFont(null));
            return fontMetrics.stringWidth(suggestionText);
        }
        
        @Override
        public void paint(@NotNull Inlay inlay, @NotNull Graphics g, @NotNull Rectangle r, @NotNull TextAttributes textAttributes) {
            Editor editor = inlay.getEditor();
            
            // Set up gray, semi-transparent color for ghost text
            g.setColor(new JBColor(new Color(128, 128, 128, 180), new Color(192, 192, 192, 180)));
            g.setFont(editor.getColorsScheme().getFont(null));
            
            // Draw the suggestion text
            g.drawString(suggestionText, r.x, r.y + r.height - editor.getLineHeight() / 4);
        }
    }
}