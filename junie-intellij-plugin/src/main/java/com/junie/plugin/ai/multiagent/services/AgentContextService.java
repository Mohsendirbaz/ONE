package com.junie.plugin.ai.multiagent.services;

import com.intellij.openapi.components.Service;
import com.intellij.openapi.project.Project;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service that manages shared context between the main assistant thread and agents
 */
@Service(Service.Level.PROJECT)
public final class AgentContextService {
    private final Project project;
    private final AgentCoordinatorService coordinatorService;
    
    // Shared context that can be accessed by both main thread and agents
    private final Map<String, Object> sharedContext = new ConcurrentHashMap<>();
    
    public AgentContextService(Project project) {
        this.project = project;
        this.coordinatorService = project.getService(AgentCoordinatorService.class);
    }
    
    /**
     * Store a value in the shared context
     */
    public void storeValue(String key, Object value) {
        sharedContext.put(key, value);
    }
    
    /**
     * Get a value from the shared context
     */
    public Object getValue(String key) {
        return sharedContext.get(key);
    }
    
    /**
     * Get a value from an agent's isolated context
     */
    public Object getFromAgentContext(String agentId, String contextKey) {
        return coordinatorService.getAgentContextData(agentId, contextKey);
    }
    
    /**
     * Get information about all tasks
     */
    public Map<String, Object> getAllTaskInfo() {
        Map<String, Object> result = new HashMap<>();
        coordinatorService.getAllTaskInfo().forEach(task -> {
            String taskId = (String) task.get("taskId");
            result.put(taskId, task);
        });
        return result;
    }
    
    /**
     * Get detailed information about a specific task
     */
    public Map<String, Object> getTaskDetails(String taskId) {
        Map<String, Object> taskInfo = coordinatorService.getTaskInfo(taskId);
        if (taskInfo == null) {
            return null;
        }
        
        // Enrich with information from each agent
        Map<String, Object> result = new HashMap<>(taskInfo);
        
        // Get design plan from architect
        Object designPlan = getFromAgentContext("ArchitectAgent", "designPlan-" + taskId);
        if (designPlan != null) {
            result.put("designPlan", designPlan);
        }
        
        // Get observations from observer
        Object observations = getFromAgentContext("ObserverAgent", "observations-" + taskId);
        if (observations != null) {
            result.put("observations", observations);
        }
        
        // Get completed edits from code editor
        Object completedEdits = getFromAgentContext("CodeEditorAgent", "completedEdits-" + taskId);
        if (completedEdits != null) {
            result.put("completedEdits", completedEdits);
        }
        
        return result;
    }
}