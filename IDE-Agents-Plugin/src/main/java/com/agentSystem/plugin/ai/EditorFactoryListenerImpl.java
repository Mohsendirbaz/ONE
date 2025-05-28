package com.junie.plugin.ai;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.editor.Document;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.EditorFactory;
import com.intellij.openapi.editor.event.DocumentEvent;
import com.intellij.openapi.editor.event.DocumentListener;
import com.intellij.openapi.editor.event.EditorFactoryEvent;
import com.intellij.openapi.editor.event.EditorFactoryListener;
import com.intellij.openapi.fileEditor.FileDocumentManager;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.project.ProjectUtil;
import com.intellij.openapi.vfs.VirtualFile;
import org.jetbrains.annotations.NotNull;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Listens for editor events and triggers AI suggestions.
 */
public class EditorFactoryListenerImpl implements EditorFactoryListener {
    private static final Logger LOG = Logger.getInstance(EditorFactoryListenerImpl.class);
    private final Map<Document, DocumentListener> documentListeners = new HashMap<>();
    
    @Override
    public void editorCreated(@NotNull EditorFactoryEvent event) {
        Editor editor = event.getEditor();
        Document document = editor.getDocument();
        
        // Create a debouncing document listener for each editor
        DocumentListener listener = new DebouncingDocumentListener(editor);
        document.addDocumentListener(listener);
        documentListeners.put(document, listener);
        
        LOG.info("Editor created, added document listener");
    }
    
    @Override
    public void editorReleased(@NotNull EditorFactoryEvent event) {
        Editor editor = event.getEditor();
        Document document = editor.getDocument();
        
        // Remove the listener when editor is closed
        DocumentListener listener = documentListeners.remove(document);
        if (listener != null) {
            document.removeDocumentListener(listener);
            LOG.info("Editor released, removed document listener");
        }
    }
    
    /**
     * Document listener that debounces typing events to avoid excessive AI calls.
     */
    private static class DebouncingDocumentListener implements DocumentListener {
        private final Editor editor;
        private final AtomicLong lastChangeTimestamp = new AtomicLong();
        private static final long DEBOUNCE_DELAY = 1000; // 1 second
        
        DebouncingDocumentListener(Editor editor) {
            this.editor = editor;
        }
        
        @Override
        public void documentChanged(@NotNull DocumentEvent event) {
            // Skip if we're in bulk mode or if changes are too large
            if (ApplicationManager.getApplication().isUnitTestMode() || 
                    event.getNewLength() > 100) {
                return;
            }
            
            Document document = event.getDocument();
            VirtualFile file = FileDocumentManager.getInstance().getFile(document);
            if (file == null) return;
            
            Project project = ProjectUtil.guessProjectForFile(file);
            if (project == null) return;
            
            // Update timestamp and schedule suggestion after delay
            lastChangeTimestamp.set(System.currentTimeMillis());
            
            ApplicationManager.getApplication().executeOnPooledThread(() -> {
                try {
                    // Wait to ensure typing has stopped
                    TimeUnit.MILLISECONDS.sleep(DEBOUNCE_DELAY);
                    
                    // Check if this is still the most recent change
                    long currentTime = System.currentTimeMillis();
                    if (currentTime - lastChangeTimestamp.get() >= DEBOUNCE_DELAY) {
                        // If enough time has passed, trigger suggestion
                        int caretOffset = editor.getCaretModel().getOffset();
                        AIAssistantService.getInstance().suggestCompletion(editor, project, caretOffset);
                        LOG.info("Triggered AI suggestion at offset " + caretOffset);
                    }
                } catch (InterruptedException ignored) {
                    // Ignore interruption
                }
            });
        }
    }
}