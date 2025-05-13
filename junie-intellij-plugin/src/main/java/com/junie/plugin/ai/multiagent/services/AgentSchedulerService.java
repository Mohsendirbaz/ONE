package com.junie.plugin.ai.multiagent.services;

import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;

import java.util.HashMap;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.TimeUnit;

/**
 * Service that manages the scheduling of agent activities
 */
@Service(Service.Level.PROJECT)
public final class AgentSchedulerService {
    private static final Logger LOG = Logger.getInstance(AgentSchedulerService.class);
    
    private final Project project;
    private final AgentCoordinatorService coordinatorService;
    private final Timer schedulerTimer = new Timer(true);
    private final Map<String, AgentScheduleConfig> agentSchedules = new HashMap<>();
    
    public AgentSchedulerService(Project project) {
        this.project = project;
        this.coordinatorService = project.getService(AgentCoordinatorService.class);
        
        LOG.info("Initializing agent scheduler service");
        
        // Initialize default schedules
        initializeDefaultSchedules();
    }
    
    /**
     * Initialize default schedules for agents
     */
    private void initializeDefaultSchedules() {
        // Observer agent - check every 30 seconds
        agentSchedules.put("ObserverAgent", new AgentScheduleConfig(
                "ObserverAgent",
                TimeUnit.SECONDS.toMillis(30),
                true
        ));
        
        // Apply the schedules
        for (AgentScheduleConfig config : agentSchedules.values()) {
            applySchedule(config);
        }
    }
    
    /**
     * Apply a schedule configuration
     */
    private void applySchedule(AgentScheduleConfig config) {
        if ("ObserverAgent".equals(config.agentId)) {
            // Set observation frequency
            coordinatorService.setObservationFrequency(config.intervalMs);
        }
        
        LOG.info("Applied schedule for " + config.agentId + 
                 ": interval=" + config.intervalMs + "ms, enabled=" + config.enabled);
    }
    
    /**
     * Update the schedule for an agent
     */
    public void updateSchedule(String agentId, long intervalMs, boolean enabled) {
        AgentScheduleConfig config = new AgentScheduleConfig(agentId, intervalMs, enabled);
        agentSchedules.put(agentId, config);
        applySchedule(config);
    }
    
    /**
     * Get the current schedule for an agent
     */
    public AgentScheduleConfig getSchedule(String agentId) {
        return agentSchedules.get(agentId);
    }
    
    /**
     * Get all agent schedules
     */
    public Map<String, AgentScheduleConfig> getAllSchedules() {
        return new HashMap<>(agentSchedules);
    }
    
    /**
     * Dispose the scheduler
     */
    public void dispose() {
        schedulerTimer.cancel();
        LOG.info("Agent scheduler disposed");
    }
    
    /**
     * Agent schedule configuration
     */
    public static class AgentScheduleConfig {
        public final String agentId;
        public final long intervalMs;
        public final boolean enabled;
        
        public AgentScheduleConfig(String agentId, long intervalMs, boolean enabled) {
            this.agentId = agentId;
            this.intervalMs = intervalMs;
            this.enabled = enabled;
        }
    }
}