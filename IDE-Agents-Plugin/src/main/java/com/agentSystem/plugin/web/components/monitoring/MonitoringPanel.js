import React, { useState, useEffect, useRef } from 'react';
import StationStatusMonitor from './StationStatusMonitor';
import AgentActivityLog from './AgentActivityLog';
import PromptChannel from './PromptChannel';
import TaskControls from './TaskControls';
import '../MonitoringPanel.css';

const MonitoringPanel = ({
  stations,
  activeAgentTasks,
  onControlTask,
  onSendPrompt
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('stations');
  const [notificationCount, setNotificationCount] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    // Check for new notifications when stations or tasks update
    const unreviewedUpdates = stations.filter(station => station.hasUnreviewedUpdates).length;
    setNotificationCount(unreviewedUpdates);
  }, [stations, activeAgentTasks]);

  const togglePanel = () => {
    setIsExpanded(!isExpanded);

    // Clear notifications when opening
    if (!isExpanded) {
      setNotificationCount(0);
      // Update station status to mark as reviewed
      stations.forEach(station => {
        if (station.hasUnreviewedUpdates) {
          station.hasUnreviewedUpdates = false;
        }
      });
    }
  };

  return (
    <div
      className={`monitoring-panel ${isExpanded ? 'expanded' : 'collapsed'}`}
      ref={panelRef}
    >
      <div className="monitoring-panel-header" onClick={togglePanel}>
        <div className="header-title">
          <h3>System Monitoring</h3>
          {notificationCount > 0 && !isExpanded && (
            <span className="notification-badge">{notificationCount}</span>
          )}
        </div>
        <button className="toggle-button">
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {isExpanded && (
        <div className="monitoring-panel-content">
          <div className="monitoring-tabs">
            <button
              className={activeTab === 'stations' ? 'active' : ''}
              onClick={() => setActiveTab('stations')}
            >
              Stations
            </button>
            <button
              className={activeTab === 'activities' ? 'active' : ''}
              onClick={() => setActiveTab('activities')}
            >
              Activities
            </button>
            <button
              className={activeTab === 'controls' ? 'active' : ''}
              onClick={() => setActiveTab('controls')}
            >
              Task Controls
            </button>
            <button
              className={activeTab === 'prompt' ? 'active' : ''}
              onClick={() => setActiveTab('prompt')}
            >
              Prompt Channel
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'stations' && (
              <StationStatusMonitor stations={stations} />
            )}

            {activeTab === 'activities' && (
              <AgentActivityLog activities={activeAgentTasks} />
            )}

            {activeTab === 'controls' && (
              <TaskControls
                activeTasks={activeAgentTasks}
                onControlTask={onControlTask}
              />
            )}

            {activeTab === 'prompt' && (
              <PromptChannel
                activeTasks={activeAgentTasks}
                onSendPrompt={onSendPrompt}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringPanel;