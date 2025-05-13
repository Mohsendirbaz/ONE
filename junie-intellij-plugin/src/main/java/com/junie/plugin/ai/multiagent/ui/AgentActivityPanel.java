package com.junie.plugin.ai.multiagent.ui;

import com.intellij.openapi.project.Project;
import com.intellij.ui.components.JBLabel;
import com.intellij.ui.components.JBPanel;
import com.intellij.ui.components.JBScrollPane;
import com.intellij.util.ui.JBUI;
import com.junie.plugin.ai.multiagent.services.AgentCoordinatorService;

import javax.swing.*;
import java.awt.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Panel for visualizing agent activity and resource utilization
 */
public class AgentActivityPanel extends JBPanel<AgentActivityPanel> {
    private final Project project;
    private final AgentCoordinatorService coordinatorService;
    private final Map<String, JLabel> agentStatusLabels = new HashMap<>();
    private final Map<String, JProgressBar> agentUtilizationBars = new HashMap<>();
    private final JPanel tasksPanel;
    private Timer refreshTimer;
    
    public AgentActivityPanel(Project project, AgentCoordinatorService coordinatorService) {
        super(new BorderLayout());
        this.project = project;
        this.coordinatorService = coordinatorService;
        
        // Create a panel for agent status
        JBPanel<JBPanel> agentStatusPanel = createAgentStatusPanel();
        
        // Create a panel for tasks
        tasksPanel = new JPanel(new GridBagLayout());
        JBScrollPane tasksScrollPane = new JBScrollPane(tasksPanel);
        tasksScrollPane.setBorder(BorderFactory.createTitledBorder("Active Tasks"));
        
        // Create a panel for task controls
        JBPanel<JBPanel> taskControlsPanel = createTaskControlsPanel();
        
        // Add panels to the main panel
        JBPanel<JBPanel> topPanel = new JBPanel<>(new BorderLayout());
        topPanel.add(agentStatusPanel, BorderLayout.CENTER);
        topPanel.add(taskControlsPanel, BorderLayout.SOUTH);
        
        add(topPanel, BorderLayout.NORTH);
        add(tasksScrollPane, BorderLayout.CENTER);
        
        // Start refresh timer
        startRefreshTimer();
    }
    
    /**
     * Create a panel for agent status
     */
    private JBPanel<JBPanel> createAgentStatusPanel() {
        JBPanel<JBPanel> panel = new JBPanel<>(new GridBagLayout());
        panel.setBorder(BorderFactory.createTitledBorder("Agent Status"));
        
        // Add column headers
        GridBagConstraints headerConstraints = new GridBagConstraints();
        headerConstraints.gridx = 0;
        headerConstraints.gridy = 0;
        headerConstraints.anchor = GridBagConstraints.WEST;
        headerConstraints.insets = JBUI.insets(5, 5, 5, 10);
        panel.add(new JBLabel("Agent"), headerConstraints);
        
        headerConstraints.gridx = 1;
        panel.add(new JBLabel("Status"), headerConstraints);
        
        headerConstraints.gridx = 2;
        panel.add(new JBLabel("Utilization"), headerConstraints);
        
        // Add agent rows
        int row = 1;
        
        // Architect agent
        addAgentStatusRow(panel, row++, "ArchitectAgent", "Architect");
        
        // Observer agent
        addAgentStatusRow(panel, row++, "ObserverAgent", "Observer");
        
        // Code Editor agent
        addAgentStatusRow(panel, row++, "CodeEditorAgent", "Code Editor");
        
        return panel;
    }
    
    /**
     * Add a row for agent status
     */
    private void addAgentStatusRow(JBPanel<JBPanel> panel, int row, String agentId, String displayName) {
        // Agent name
        GridBagConstraints nameConstraints = new GridBagConstraints();
        nameConstraints.gridx = 0;
        nameConstraints.gridy = row;
        nameConstraints.anchor = GridBagConstraints.WEST;
        nameConstraints.insets = JBUI.insets(5, 5, 5, 10);
        panel.add(new JBLabel(displayName), nameConstraints);
        
        // Agent status
        JLabel statusLabel = new JLabel("Idle");
        agentStatusLabels.put(agentId, statusLabel);
        GridBagConstraints statusConstraints = new GridBagConstraints();
        statusConstraints.gridx = 1;
        statusConstraints.gridy = row;
        statusConstraints.anchor = GridBagConstraints.WEST;
        statusConstraints.insets = JBUI.insets(5, 5, 5, 10);
        panel.add(statusLabel, statusConstraints);
        
        // Agent utilization
        JProgressBar utilizationBar = new JProgressBar(0, 100);
        utilizationBar.setValue(0);
        utilizationBar.setStringPainted(true);
        agentUtilizationBars.put(agentId, utilizationBar);
        GridBagConstraints utilizationConstraints = new GridBagConstraints();
        utilizationConstraints.gridx = 2;
        utilizationConstraints.gridy = row;
        utilizationConstraints.fill = GridBagConstraints.HORIZONTAL;
        utilizationConstraints.weightx = 1.0;
        utilizationConstraints.insets = JBUI.insets(5, 5, 5, 5);
        panel.add(utilizationBar, utilizationConstraints);
    }
    
    /**
     * Create a panel for task controls
     */
    private JBPanel<JBPanel> createTaskControlsPanel() {
        JBPanel<JBPanel> panel = new JBPanel<>(new FlowLayout(FlowLayout.LEFT));
        panel.setBorder(BorderFactory.createTitledBorder("Task Controls"));
        
        // Add a button to start a new task
        JButton startTaskButton = new JButton("Start New Task");
        startTaskButton.addActionListener(e -> startNewTask());
        panel.add(startTaskButton);
        
        return panel;
    }
    
    /**
     * Start a new task
     */
    private void startNewTask() {
        // Show a dialog to get task description and file paths
        JTextField descriptionField = new JTextField(30);
        JTextField filePathsField = new JTextField(30);
        
        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints constraints = new GridBagConstraints();
        constraints.gridx = 0;
        constraints.gridy = 0;
        constraints.anchor = GridBagConstraints.WEST;
        constraints.insets = JBUI.insets(5, 5, 5, 5);
        panel.add(new JLabel("Task Description:"), constraints);
        
        constraints.gridx = 1;
        constraints.fill = GridBagConstraints.HORIZONTAL;
        constraints.weightx = 1.0;
        panel.add(descriptionField, constraints);
        
        constraints.gridx = 0;
        constraints.gridy = 1;
        constraints.weightx = 0.0;
        panel.add(new JLabel("File Paths (comma-separated):"), constraints);
        
        constraints.gridx = 1;
        constraints.weightx = 1.0;
        panel.add(filePathsField, constraints);
        
        int result = JOptionPane.showConfirmDialog(
                this,
                panel,
                "Start New Task",
                JOptionPane.OK_CANCEL_OPTION,
                JOptionPane.PLAIN_MESSAGE
        );
        
        if (result == JOptionPane.OK_OPTION) {
            String description = descriptionField.getText().trim();
            String filePathsText = filePathsField.getText().trim();
            
            if (description.isEmpty()) {
                JOptionPane.showMessageDialog(
                        this,
                        "Task description cannot be empty",
                        "Error",
                        JOptionPane.ERROR_MESSAGE
                );
                return;
            }
            
            // Parse file paths
            List<String> filePaths = List.of(filePathsText.split(","));
            
            // Start the task
            coordinatorService.startTask(description, filePaths)
                    .thenAccept(result1 -> {
                        SwingUtilities.invokeLater(() -> {
                            JOptionPane.showMessageDialog(
                                    this,
                                    "Task started successfully",
                                    "Success",
                                    JOptionPane.INFORMATION_MESSAGE
                            );
                            refreshTasksPanel();
                        });
                    })
                    .exceptionally(ex -> {
                        SwingUtilities.invokeLater(() -> {
                            JOptionPane.showMessageDialog(
                                    this,
                                    "Error starting task: " + ex.getMessage(),
                                    "Error",
                                    JOptionPane.ERROR_MESSAGE
                            );
                        });
                        return null;
                    });
        }
    }
    
    /**
     * Start the refresh timer
     */
    private void startRefreshTimer() {
        refreshTimer = new Timer(1000, e -> refreshUI());
        refreshTimer.start();
    }
    
    /**
     * Refresh the UI
     */
    private void refreshUI() {
        // Update agent status
        updateAgentStatus();
        
        // Update tasks panel
        refreshTasksPanel();
    }
    
    /**
     * Update agent status
     */
    private void updateAgentStatus() {
        // In a real implementation, this would get the actual status from the agents
        // For now, we'll just simulate some activity
        
        // Simulate agent status
        for (Map.Entry<String, JLabel> entry : agentStatusLabels.entrySet()) {
            String agentId = entry.getKey();
            JLabel statusLabel = entry.getValue();
            
            // Get active tasks
            List<Map<String, Object>> tasks = coordinatorService.getAllTaskInfo();
            boolean hasActiveTasks = tasks.stream()
                    .anyMatch(task -> "in-progress".equals(task.get("status")));
            
            // Update status label
            if (hasActiveTasks) {
                statusLabel.setText("Active");
                statusLabel.setForeground(Color.GREEN.darker());
            } else {
                statusLabel.setText("Idle");
                statusLabel.setForeground(Color.GRAY);
            }
        }
        
        // Simulate agent utilization
        for (Map.Entry<String, JProgressBar> entry : agentUtilizationBars.entrySet()) {
            JProgressBar utilizationBar = entry.getValue();
            
            // Get active tasks
            List<Map<String, Object>> tasks = coordinatorService.getAllTaskInfo();
            int activeTaskCount = (int) tasks.stream()
                    .filter(task -> "in-progress".equals(task.get("status")))
                    .count();
            
            // Update utilization bar
            int utilization = activeTaskCount > 0 ? 50 : 0;
            utilizationBar.setValue(utilization);
        }
    }
    
    /**
     * Refresh the tasks panel
     */
    private void refreshTasksPanel() {
        // Clear the panel
        tasksPanel.removeAll();
        
        // Get active tasks
        List<Map<String, Object>> tasks = coordinatorService.getAllTaskInfo();
        
        // Add column headers
        GridBagConstraints headerConstraints = new GridBagConstraints();
        headerConstraints.gridx = 0;
        headerConstraints.gridy = 0;
        headerConstraints.anchor = GridBagConstraints.WEST;
        headerConstraints.insets = JBUI.insets(5, 5, 5, 10);
        tasksPanel.add(new JBLabel("Task ID"), headerConstraints);
        
        headerConstraints.gridx = 1;
        tasksPanel.add(new JBLabel("Description"), headerConstraints);
        
        headerConstraints.gridx = 2;
        tasksPanel.add(new JBLabel("Status"), headerConstraints);
        
        // Add task rows
        int row = 1;
        for (Map<String, Object> task : tasks) {
            String taskId = (String) task.get("taskId");
            String description = (String) task.get("description");
            String status = (String) task.get("status");
            
            // Task ID
            GridBagConstraints idConstraints = new GridBagConstraints();
            idConstraints.gridx = 0;
            idConstraints.gridy = row;
            idConstraints.anchor = GridBagConstraints.WEST;
            idConstraints.insets = JBUI.insets(5, 5, 5, 10);
            tasksPanel.add(new JBLabel(taskId.substring(0, 8) + "..."), idConstraints);
            
            // Description
            GridBagConstraints descConstraints = new GridBagConstraints();
            descConstraints.gridx = 1;
            descConstraints.gridy = row;
            descConstraints.anchor = GridBagConstraints.WEST;
            descConstraints.insets = JBUI.insets(5, 5, 5, 10);
            tasksPanel.add(new JBLabel(description), descConstraints);
            
            // Status
            JLabel statusLabel = new JBLabel(status);
            if ("completed".equals(status)) {
                statusLabel.setForeground(Color.GREEN.darker());
            } else if ("failed".equals(status)) {
                statusLabel.setForeground(Color.RED);
            } else if ("in-progress".equals(status)) {
                statusLabel.setForeground(Color.BLUE);
            }
            GridBagConstraints statusConstraints = new GridBagConstraints();
            statusConstraints.gridx = 2;
            statusConstraints.gridy = row;
            statusConstraints.anchor = GridBagConstraints.WEST;
            statusConstraints.insets = JBUI.insets(5, 5, 5, 5);
            tasksPanel.add(statusLabel, statusConstraints);
            
            row++;
        }
        
        // Add a message if there are no tasks
        if (tasks.isEmpty()) {
            GridBagConstraints messageConstraints = new GridBagConstraints();
            messageConstraints.gridx = 0;
            messageConstraints.gridy = 1;
            messageConstraints.gridwidth = 3;
            messageConstraints.anchor = GridBagConstraints.CENTER;
            messageConstraints.insets = JBUI.insets(10, 5, 10, 5);
            tasksPanel.add(new JBLabel("No active tasks"), messageConstraints);
        }
        
        // Revalidate and repaint
        tasksPanel.revalidate();
        tasksPanel.repaint();
    }
    
    /**
     * Dispose the panel
     */
    public void dispose() {
        if (refreshTimer != null) {
            refreshTimer.stop();
            refreshTimer = null;
        }
    }
}