package com.junie.plugin.ai.multiagent;

import java.util.UUID;

/**
 * Message passed between agents
 */
public class AgentMessage {
    private final String id;
    private final String type;
    private final String sourceAgentId;
    private final String targetAgentId;
    private final Object payload;
    private final String correlationId;
    
    public AgentMessage(String id, String type, String sourceAgentId, 
                        String targetAgentId, Object payload, String correlationId) {
        this.id = id != null ? id : UUID.randomUUID().toString();
        this.type = type;
        this.sourceAgentId = sourceAgentId;
        this.targetAgentId = targetAgentId;
        this.payload = payload;
        this.correlationId = correlationId;
    }
    
    public String getId() {
        return id;
    }
    
    public String getType() {
        return type;
    }
    
    public String getSourceAgentId() {
        return sourceAgentId;
    }
    
    public String getTargetAgentId() {
        return targetAgentId;
    }
    
    public Object getPayload() {
        return payload;
    }
    
    public String getCorrelationId() {
        return correlationId;
    }
    
    /**
     * Create a response message to this message
     */
    public AgentMessage createResponse(String type, Object payload) {
        return new AgentMessage(
                UUID.randomUUID().toString(),
                type,
                targetAgentId,  // Swap target and source
                sourceAgentId,
                payload,
                correlationId   // Keep the same correlation ID
        );
    }
}