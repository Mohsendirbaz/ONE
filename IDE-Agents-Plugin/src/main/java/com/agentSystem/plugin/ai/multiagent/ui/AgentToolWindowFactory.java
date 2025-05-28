package com.junie.plugin.ai.multiagent.ui;

import com.intellij.openapi.project.Project;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowFactory;
import com.intellij.ui.content.Content;
import com.intellij.ui.content.ContentFactory;
import com.junie.plugin.ai.multiagent.services.AgentCoordinatorService;
import com.junie.plugin.ai.multiagent.services.AgentSchedulerService;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;
import java.awt.*;

/**
 * Factory for creating the AI Agents tool window
 */
public class AgentToolWindowFactory implements ToolWindowFactory {
    @Override
    public void createToolWindowContent(@NotNull Project project, @NotNull ToolWindow toolWindow) {
        // Get services
        AgentCoordinatorService coordinatorService = project.getService(AgentCoordinatorService.class);
        AgentSchedulerService schedulerService = project.getService(AgentSchedulerService.class);
        
        // Create configuration panel
        AgentConfigPanel configPanel = new AgentConfigPanel(project, schedulerService);
        
        // Create content
        ContentFactory contentFactory = ContentFactory.SERVICE.getInstance();
        Content configContent = contentFactory.createContent(configPanel, "Configuration", false);
        toolWindow.getContentManager().addContent(configContent);
        
        // Create monitoring panel
        JPanel monitoringPanel = createMonitoringPanel(project, coordinatorService);
        Content monitoringContent = contentFactory.createContent(monitoringPanel, "Monitoring", false);
        toolWindow.getContentManager().addContent(monitoringContent);
    }
    
    /**
     * Create the monitoring panel
     */
    private JPanel createMonitoringPanel(Project project, AgentCoordinatorService coordinatorService) {
        JPanel panel = new JPanel(new BorderLayout());
        
        // Create agent activity visualization
        AgentActivityPanel activityPanel = new AgentActivityPanel(project, coordinatorService);
        panel.add(activityPanel, BorderLayout.CENTER);
        
        return panel;
    }
}