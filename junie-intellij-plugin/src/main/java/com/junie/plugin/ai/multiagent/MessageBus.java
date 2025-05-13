package com.junie.plugin.ai.multiagent;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.diagnostic.Logger;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

/**
 * Message bus for agent communication
 */
public class MessageBus {
    private static final Logger LOG = Logger.getInstance(MessageBus.class);
    private final Set<Consumer<AgentMessage>> subscribers = ConcurrentHashMap.newKeySet();
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    
    /**
     * Subscribe to messages
     */
    public void subscribe(Consumer<AgentMessage> subscriber) {
        subscribers.add(subscriber);
    }
    
    /**
     * Unsubscribe from messages
     */
    public void unsubscribe(Consumer<AgentMessage> subscriber) {
        subscribers.remove(subscriber);
    }
    
    /**
     * Publish a message to all subscribers
     */
    public void publish(AgentMessage message) {
        LOG.info("Publishing message: " + message.getType() + 
                 " from " + message.getSourceAgentId() + 
                 " to " + message.getTargetAgentId());
        
        // Process messages asynchronously to avoid blocking
        executorService.submit(() -> {
            for (Consumer<AgentMessage> subscriber : subscribers) {
                try {
                    // Each subscriber gets its own thread to avoid one slow subscriber blocking others
                    ApplicationManager.getApplication().executeOnPooledThread(
                            () -> subscriber.accept(message));
                } catch (Exception e) {
                    LOG.error("Error delivering message to subscriber", e);
                }
            }
        });
    }
    
    /**
     * Shut down the message bus
     */
    public void shutdown() {
        executorService.shutdown();
    }
}