package com.junie.plugin.ai.multiagent.ui;

import com.intellij.openapi.project.Project;
import com.intellij.ui.components.JBLabel;
import com.intellij.ui.components.JBPanel;
import com.intellij.ui.components.JBScrollPane;
import com.intellij.util.ui.JBUI;
import com.junie.plugin.ai.multiagent.services.AgentSchedulerService;
import com.junie.plugin.ai.multiagent.services.AgentSchedulerService.AgentScheduleConfig;

import javax.swing.*;
import java.awt.*;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Panel for configuring agent schedules
 */
public class AgentConfigPanel extends JBPanel<AgentConfigPanel> {
    private final Project project;
    private final AgentSchedulerService schedulerService;
    private final Map<String, JSpinner> intervalSpinners = new HashMap<>();
    private final Map<String, JCheckBox> enabledCheckboxes = new HashMap<>();
    
    public AgentConfigPanel(Project project, AgentSchedulerService schedulerService) {
        super(new BorderLayout());
        this.project = project;
        this.schedulerService = schedulerService;
        
        initUI();
    }
    
    /**
     * Initialize the UI
     */
    private void initUI() {
        // Create a panel for the agent configuration
        JBPanel<JBPanel> configPanel = new JBPanel<>(new GridBagLayout());
        configPanel.setBorder(JBUI.Borders.empty(10));
        
        // Add a title
        JBLabel titleLabel = new JBLabel("Agent Configuration");
        titleLabel.setFont(titleLabel.getFont().deriveFont(Font.BOLD, 16));
        GridBagConstraints titleConstraints = new GridBagConstraints();
        titleConstraints.gridx = 0;
        titleConstraints.gridy = 0;
        titleConstraints.gridwidth = 3;
        titleConstraints.anchor = GridBagConstraints.WEST;
        titleConstraints.insets = JBUI.insets(0, 0, 10, 0);
        configPanel.add(titleLabel, titleConstraints);
        
        // Add column headers
        JBLabel agentLabel = new JBLabel("Agent");
        agentLabel.setFont(agentLabel.getFont().deriveFont(Font.BOLD));
        GridBagConstraints agentHeaderConstraints = new GridBagConstraints();
        agentHeaderConstraints.gridx = 0;
        agentHeaderConstraints.gridy = 1;
        agentHeaderConstraints.anchor = GridBagConstraints.WEST;
        agentHeaderConstraints.insets = JBUI.insets(0, 0, 5, 10);
        configPanel.add(agentLabel, agentHeaderConstraints);
        
        JBLabel intervalLabel = new JBLabel("Interval (seconds)");
        intervalLabel.setFont(intervalLabel.getFont().deriveFont(Font.BOLD));
        GridBagConstraints intervalHeaderConstraints = new GridBagConstraints();
        intervalHeaderConstraints.gridx = 1;
        intervalHeaderConstraints.gridy = 1;
        intervalHeaderConstraints.anchor = GridBagConstraints.WEST;
        intervalHeaderConstraints.insets = JBUI.insets(0, 0, 5, 10);
        configPanel.add(intervalLabel, intervalHeaderConstraints);
        
        JBLabel enabledLabel = new JBLabel("Enabled");
        enabledLabel.setFont(enabledLabel.getFont().deriveFont(Font.BOLD));
        GridBagConstraints enabledHeaderConstraints = new GridBagConstraints();
        enabledHeaderConstraints.gridx = 2;
        enabledHeaderConstraints.gridy = 1;
        enabledHeaderConstraints.anchor = GridBagConstraints.WEST;
        enabledHeaderConstraints.insets = JBUI.insets(0, 0, 5, 0);
        configPanel.add(enabledLabel, enabledHeaderConstraints);
        
        // Add agent configuration rows
        int row = 2;
        
        // Observer agent
        addAgentConfigRow(configPanel, row++, "ObserverAgent", "Observer");
        
        // Add a spacer
        configPanel.add(Box.createVerticalStrut(10), new GridBagConstraints());
        
        // Add a button to apply changes
        JButton applyButton = new JButton("Apply Changes");
        applyButton.addActionListener(e -> applyChanges());
        GridBagConstraints applyButtonConstraints = new GridBagConstraints();
        applyButtonConstraints.gridx = 0;
        applyButtonConstraints.gridy = row;
        applyButtonConstraints.gridwidth = 3;
        applyButtonConstraints.anchor = GridBagConstraints.EAST;
        applyButtonConstraints.insets = JBUI.insets(10, 0, 0, 0);
        configPanel.add(applyButton, applyButtonConstraints);
        
        // Add the config panel to a scroll pane
        JBScrollPane scrollPane = new JBScrollPane(configPanel);
        scrollPane.setBorder(BorderFactory.createEmptyBorder());
        
        // Add the scroll pane to the main panel
        add(scrollPane, BorderLayout.CENTER);
        
        // Load current schedules
        loadSchedules();
    }
    
    /**
     * Add a row for configuring an agent
     */
    private void addAgentConfigRow(JBPanel<JBPanel> panel, int row, String agentId, String displayName) {
        // Agent name
        JBLabel nameLabel = new JBLabel(displayName);
        GridBagConstraints nameLabelConstraints = new GridBagConstraints();
        nameLabelConstraints.gridx = 0;
        nameLabelConstraints.gridy = row;
        nameLabelConstraints.anchor = GridBagConstraints.WEST;
        nameLabelConstraints.insets = JBUI.insets(5, 0, 0, 10);
        panel.add(nameLabel, nameLabelConstraints);
        
        // Interval spinner
        SpinnerNumberModel spinnerModel = new SpinnerNumberModel(30, 1, 3600, 1);
        JSpinner intervalSpinner = new JSpinner(spinnerModel);
        intervalSpinners.put(agentId, intervalSpinner);
        GridBagConstraints intervalSpinnerConstraints = new GridBagConstraints();
        intervalSpinnerConstraints.gridx = 1;
        intervalSpinnerConstraints.gridy = row;
        intervalSpinnerConstraints.anchor = GridBagConstraints.WEST;
        intervalSpinnerConstraints.insets = JBUI.insets(5, 0, 0, 10);
        panel.add(intervalSpinner, intervalSpinnerConstraints);
        
        // Enabled checkbox
        JCheckBox enabledCheckbox = new JCheckBox();
        enabledCheckbox.setSelected(true);
        enabledCheckboxes.put(agentId, enabledCheckbox);
        GridBagConstraints enabledCheckboxConstraints = new GridBagConstraints();
        enabledCheckboxConstraints.gridx = 2;
        enabledCheckboxConstraints.gridy = row;
        enabledCheckboxConstraints.anchor = GridBagConstraints.WEST;
        enabledCheckboxConstraints.insets = JBUI.insets(5, 0, 0, 0);
        panel.add(enabledCheckbox, enabledCheckboxConstraints);
    }
    
    /**
     * Load current schedules
     */
    private void loadSchedules() {
        Map<String, AgentScheduleConfig> schedules = schedulerService.getAllSchedules();
        
        for (Map.Entry<String, AgentScheduleConfig> entry : schedules.entrySet()) {
            String agentId = entry.getKey();
            AgentScheduleConfig config = entry.getValue();
            
            JSpinner intervalSpinner = intervalSpinners.get(agentId);
            if (intervalSpinner != null) {
                intervalSpinner.setValue((int) TimeUnit.MILLISECONDS.toSeconds(config.intervalMs));
            }
            
            JCheckBox enabledCheckbox = enabledCheckboxes.get(agentId);
            if (enabledCheckbox != null) {
                enabledCheckbox.setSelected(config.enabled);
            }
        }
    }
    
    /**
     * Apply changes to agent schedules
     */
    private void applyChanges() {
        for (Map.Entry<String, JSpinner> entry : intervalSpinners.entrySet()) {
            String agentId = entry.getKey();
            JSpinner intervalSpinner = entry.getValue();
            JCheckBox enabledCheckbox = enabledCheckboxes.get(agentId);
            
            if (intervalSpinner != null && enabledCheckbox != null) {
                int intervalSeconds = (Integer) intervalSpinner.getValue();
                boolean enabled = enabledCheckbox.isSelected();
                
                schedulerService.updateSchedule(
                        agentId,
                        TimeUnit.SECONDS.toMillis(intervalSeconds),
                        enabled
                );
            }
        }
        
        JOptionPane.showMessageDialog(
                this,
                "Agent schedules updated successfully",
                "Success",
                JOptionPane.INFORMATION_MESSAGE
        );
    }
}