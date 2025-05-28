import React, { useState } from 'react';

const AgentActivityLog = ({ activities }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter activities by agent type and search term
  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.agent.toLowerCase() === filter.toLowerCase();
    const matchesSearch = !searchTerm || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.currentActivity?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Get unique agent types for filter dropdown
  const agentTypes = ['all', ...new Set(activities.map(a => a.agent.toLowerCase()))];

  return (
    <div className="agent-activity-log">
      <div className="activity-filters">
        <div className="filter-group">
          <label htmlFor="agent-filter">Filter by agent:</label>
          <select
            id="agent-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            {agentTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Agents' : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="activity-search">Search:</label>
          <input
            id="activity-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activities..."
            className="search-input"
          />
        </div>
      </div>

      <div className="activities-list">
        {filteredActivities.length === 0 ? (
          <div className="no-activities">
            No activities match your filters.
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-header">
                <div className="activity-title">
                  <span className={`agent-badge ${activity.agent.toLowerCase()}`}>
                    {activity.agent}
                  </span>
                  <span className="activity-name">{activity.title}</span>
                </div>
                <div className="activity-meta">
                  <span className={`status-pill ${activity.status}`}>
                    {activity.status}
                  </span>
                  <span className="activity-time">
                    {new Date(activity.startTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              {activity.currentActivity && (
                <div className="current-activity">
                  <span className="activity-label">Current:</span>
                  <span className="activity-description">{activity.currentActivity}</span>
                </div>
              )}
              
              <div className="activity-progress">
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${activity.progress || 0}%` }}
                  ></div>
                  <span className="progress-text">{activity.progress || 0}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentActivityLog;