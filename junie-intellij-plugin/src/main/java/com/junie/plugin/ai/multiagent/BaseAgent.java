package com.junie.plugin.ai.multiagent;

import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Base class for all specialized agents with isolated context
 */
public abstract class BaseAgent {
    protected final Logger LOG;
    protected final String agentId;
    protected final Project project;
    protected final MessageBus messageBus;
    
    // Isolated agent context - not shared with other agents
    protected final ConcurrentMap<String, Object> isolatedContext = new ConcurrentHashMap<>();
    
    // Tasks that are waiting for a response
    protected final ConcurrentMap<String, CompletableFuture<AgentMessage>> pendingTasks = new ConcurrentHashMap<>();
    
    public BaseAgent(Project project, MessageBus messageBus) {
        this.agentId = getClass().getSimpleName() + "-" + UUID.randomUUID().toString().substring(0, 8);
        this.project = project;
        this.messageBus = messageBus;
        this.LOG = Logger.getInstance(getClass());
        
        // Register for messages directed to this agent
        this.messageBus.subscribe(this::handleMessage);
    }
    
    /**
     * Process a message sent to this agent
     */
    protected void handleMessage(AgentMessage message) {
        if (!message.getTargetAgentId().equals(agentId) && 
            !message.getTargetAgentId().equals("all")) {
            return; // Message not for this agent
        }
        
        LOG.info("Agent " + agentId + " processing message: " + message.getType());
        
        // If this is a response to a pending task, complete the future
        String correlationId = message.getCorrelationId();
        if (correlationId != null && pendingTasks.containsKey(correlationId)) {
            CompletableFuture<AgentMessage> future = pendingTasks.remove(correlationId);
            if (future != null) {
                future.complete(message);
                return;
            }
        }
        
        // Otherwise, process the message based on its type
        processMessage(message);
    }
    
    /**
     * Process an incoming message - to be implemented by subclasses
     */
    protected abstract void processMessage(AgentMessage message);
    
    /**
     * Send a message to another agent
     */
    protected void sendMessage(String targetAgentId, String type, Object payload) {
        AgentMessage message = new AgentMessage(
                UUID.randomUUID().toString(),
                type,
                agentId,
                targetAgentId,
                payload,
                null  // No correlation ID for new messages
        );
        messageBus.publish(message);
    }
    
    /**
     * Send a message and wait for a response
     */
    protected CompletableFuture<AgentMessage> sendMessageAndWaitForResponse(
            String targetAgentId, String type, Object payload) {
        
        String correlationId = UUID.randomUUID().toString();
        CompletableFuture<AgentMessage> future = new CompletableFuture<>();
        pendingTasks.put(correlationId, future);
        
        AgentMessage message = new AgentMessage(
                UUID.randomUUID().toString(),
                type,
                agentId,
                targetAgentId,
                payload,
                correlationId
        );
        
        messageBus.publish(message);
        return future;
    }
    
    /**
     * Add data to this agent's isolated context
     */
    protected void addToContext(String key, Object value) {
        isolatedContext.put(key, value);
    }
    
    /**
     * Get data from this agent's isolated context
     */
    protected Object getFromContext(String key) {
        return isolatedContext.get(key);
    }
    
    /**
     * Clear this agent's isolated context
     */
    public void clearContext() {
        isolatedContext.clear();
    }
    
    /**
     * Share specific context data with the main assistant thread
     */
    public Object shareWithMainThread(String key) {
        return isolatedContext.get(key);
    }
    
    /**
     * Initialize the agent
     */
    public abstract void initialize();
    
    /**
     * Dispose the agent and clean up resources
     */
    public void dispose() {
        messageBus.unsubscribe(this::handleMessage);
        pendingTasks.values().forEach(future -> future.cancel(true));
        pendingTasks.clear();
    }
}