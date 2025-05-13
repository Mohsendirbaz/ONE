package com.junie.plugin.ai.multiagent;

/**
 * Common message types for agent communication
 */
public class MessageType {
    // Architecture-related messages
    public static final String DESIGN_REQUIRED = "DESIGN_REQUIRED";
    public static final String DESIGN_COMPLETED = "DESIGN_COMPLETED";
    
    // Observation-related messages
    public static final String OBSERVATION_REQUIRED = "OBSERVATION_REQUIRED";
    public static final String OBSERVATION_COMPLETED = "OBSERVATION_COMPLETED";
    
    // Code editing messages
    public static final String EDIT_REQUIRED = "EDIT_REQUIRED";
    public static final String EDIT_COMPLETED = "EDIT_COMPLETED";
    
    // Feedback messages
    public static final String FEEDBACK_PROVIDED = "FEEDBACK_PROVIDED";
    
    // Coordination messages
    public static final String TASK_STARTED = "TASK_STARTED";
    public static final String TASK_COMPLETED = "TASK_COMPLETED";
    public static final String TASK_FAILED = "TASK_FAILED";
    
    // Context messages
    public static final String CONTEXT_UPDATED = "CONTEXT_UPDATED";
    public static final String CONTEXT_REQUESTED = "CONTEXT_REQUESTED";
    
    // Agent lifecycle messages
    public static final String AGENT_INITIALIZED = "AGENT_INITIALIZED";
    public static final String AGENT_TERMINATED = "AGENT_TERMINATED";
}