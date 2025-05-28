import React, { useState } from 'react';

const TaskControls = ({ activeTasks, onControlTask }) => {
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const handleControlAction = (taskId, action, options = {}) => {
    onControlTask(taskId, action, options);
  };

  const toggleExpandTask = (taskId) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  return (
    <div className="task-controls">
      <h3>Active Agent Tasks</h3>

      {activeTasks.length === 0 ? (
        <div className="no-tasks">
          No active tasks at the moment.
        </div>
      ) : (
        <div className="tasks-list">
          {activeTasks.map(task => (
            <div key={task.id} className="task-item">
              <div className="task-header" onClick={() => toggleExpandTask(task.id)}>
                <div className="task-title">
                  <span className={`status-dot ${task.status}`}></span>
                  <span className="title-text">{task.title}</span>
                </div>
                <div className="task-meta">
                  <span className="agent-type">{task.agent}</span>
                  <span className="expand-icon">
                    {expandedTaskId === task.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {expandedTaskId === task.id && (
                <div className="task-details">
                  <div className="task-info">
                    <div className="info-row">
                      <div className="info-label">Status:</div>
                      <div className="info-value">{task.status}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Started:</div>
                      <div className="info-value">
                        {new Date(task.startTime).toLocaleString()}
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Elapsed Time:</div>
                      <div className="info-value">
                        {formatElapsedTime(task.startTime)}
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Progress:</div>
                      <div className="info-value">
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar"
                            style={{ width: `${task.progress || 0}%` }}
                          ></div>
                          <span className="progress-text">{task.progress || 0}%</span>
                        </div>
                      </div>
                    </div>
                    {task.currentActivity && (
                      <div className="info-row">
                        <div className="info-label">Current Activity:</div>
                        <div className="info-value">{task.currentActivity}</div>
                      </div>
                    )}
                  </div>

                  <div className="task-actions">
                    <button
                      className="action-btn stop-btn"
                      onClick={() => handleControlAction(task.id, 'stop')}
                    >
                      Stop Task
                    </button>
                    <button
                      className="action-btn pause-btn"
                      onClick={() => handleControlAction(task.id, 'pause')}
                      disabled={task.status === 'paused'}
                    >
                      {task.status === 'paused' ? 'Paused' : 'Pause'}
                    </button>
                    <button
                      className="action-btn resume-btn"
                      onClick={() => handleControlAction(task.id, 'resume')}
                      disabled={task.status !== 'paused'}
                    >
                      Resume
                    </button>
                    <button
                      className="action-btn priority-btn"
                      onClick={() => handleControlAction(task.id, 'prioritize')}
                    >
                      Prioritize
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to format elapsed time
const formatElapsedTime = (startTime) => {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const elapsed = now - start;

  const seconds = Math.floor(elapsed / 1000) % 60;
  const minutes = Math.floor(elapsed / (1000 * 60)) % 60;
  const hours = Math.floor(elapsed / (1000 * 60 * 60));

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default TaskControls;