import React, { useState, useEffect } from 'react';
import { AgentStatusSidebar, ViewToggle, DeploymentStatus, TaskCreationForm, BundleCreationForm } from './TaskSchedulerViews';
import { ListView, CalendarView, KanbanView, BundlesView } from './TaskSchedulerViewComponents';
import MonitoringPanel from './components/monitoring/MonitoringPanel';
import StationManager from './components/StationManager';
import * as taskSchedulerApi from './taskSchedulerApi';
import { updateStationStatus, formatAgentTask } from './logic/reportingLogic';

const TaskSchedulerApp = () => {
  // Existing state variables...
  const [activeAgentTasks, setActiveAgentTasks] = useState([]);
  const [stationUpdates, setStationUpdates] = useState({});
  const [tasks, setTasks] = useState([]);
  const [stations, setStations] = useState([]);
  const [agentStatus, setAgentStatus] = useState({
    architect: 'available',
    observer: 'available',
    codeEditor: 'available'
  });
  const [agentUtilization, setAgentUtilization] = useState({
    architect: 0,
    observer: 0,
    codeEditor: 0
  });

  // Load initial data and start report polling
  useEffect(() => {
    // Load initial data
    const loadInitialData = async () => {
      try {
        // Load tasks
        const tasksData = await taskSchedulerApi.getTasks();
        setTasks(tasksData);

        // Load stations
        const stationsData = await taskSchedulerApi.getStations();
        setStations(stationsData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();

    // Start the agent reporting poll
    const reportingInterval = startAgentReporting();

    // Cleanup on unmount
    return () => {
      clearInterval(reportingInterval);
    };
  }, []);

  // Start agent reporting interval
  const startAgentReporting = () => {
    // Update active tasks and station status every 5 seconds
    return setInterval(() => {
      // Get current active tasks
      const activeTasks = tasks.filter(task => task.status === 'in-progress');

      // Format tasks for reporting
      const formattedTasks = activeTasks.map(task => {
        const agent = getAgentForTask(task);
        return formatAgentTask(task, agent);
      });

      // Update active agent tasks state for monitoring
      setActiveAgentTasks(formattedTasks);

      // Update each station with agent data
      updateStations(formattedTasks);

    }, 5000); // Every 5 seconds
  };

  // Get the agent for a task
  const getAgentForTask = (task) => {
    // Map agent string to agent object
    switch (task.agent) {
      case 'architect':
        return {
          type: 'Architect',
          status: agentStatus.architect,
          utilization: agentUtilization.architect
        };
      case 'observer':
        return {
          type: 'Observer',
          status: agentStatus.observer,
          utilization: agentUtilization.observer
        };
      case 'codeEditor':
        return {
          type: 'Code Editor',
          status: agentStatus.codeEditor,
          utilization: agentUtilization.codeEditor
        };
      default:
        return { type: 'Unknown', status: 'unknown', utilization: 0 };
    }
  };

  // Update stations with agent reporting data
  const updateStations = (activeTasks) => {
    // Group tasks by station
    const tasksByStation = {};

    activeTasks.forEach(task => {
      if (task.station && task.station.id) {
        if (!tasksByStation[task.station.id]) {
          tasksByStation[task.station.id] = [];
        }
        tasksByStation[task.station.id].push(task);
      }
    });

    // Update each station with agent data
    const updatedStations = stations.map(station => {
      // If no tasks for this station, just update timestamp
      if (!tasksByStation[station.id]) {
        return {
          ...station,
          lastUpdated: new Date().toISOString()
        };
      }

      // Generate mock agent reporting data
      // In a real implementation, this would come from the agents
      const stationTasks = tasksByStation[station.id];
      const agentReportData = {
        currentLoad: calculateStationLoad(stationTasks),
        cpuUsage: getRandomValue(20, 80),
        memoryUsage: getRandomValue(20, 70),
        diskSpace: getRandomValue(50, 95),
        errorRate: getRandomValue(0, 5),
        activeTasks: stationTasks.length,
        queueLength: getRandomValue(0, 3),
        throughput: getRandomValue(1, 5)
      };

      // Update the station
      return updateStationStatus(station, agentReportData);
    });

    // Update stations state
    setStations(updatedStations);
  };

  // Calculate station load based on active tasks
  const calculateStationLoad = (tasks) => {
    if (!tasks || tasks.length === 0) {
      return 0;
    }

    // Base load on number of tasks and their progress
    const baseLoad = Math.min(100, tasks.length * 25); // 25% per task, max 100%

    // Adjust for task progress
    const avgProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length;
    const progressFactor = 1 - (avgProgress / 200); // Factor decreases as progress increases

    return Math.round(baseLoad * progressFactor);
  };

  // Helper for generating random values
  const getRandomValue = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Handle task control actions from the monitoring panel
  const handleControlTask = (taskId, action, options = {}) => {
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Handle different control actions
    switch (action) {
      case 'stop':
        // Stop the task completely
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, status: 'terminated', terminationReason: 'User stopped task' } : t
        ));
        break;

      case 'pause':
        // Pause the task
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, status: 'paused', pausedAt: new Date().toISOString() } : t
        ));
        break;

      case 'resume':
        // Resume the task
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, status: 'in-progress', resumedAt: new Date().toISOString() } : t
        ));
        break;

      case 'prioritize':
        // Set task as high priority
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, priority: 'high', prioritizedAt: new Date().toISOString() } : t
        ));
        break;

      default:
        console.warn(`Unknown control action: ${action}`);
    }
  };

  // Handle sending prompts to agents
  const handleSendPrompt = (taskId, promptText, updatedConversation) => {
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // In a real implementation, this would send the prompt to the agent
    // For demo, we'll simulate a response
    setTimeout(() => {
      const agentMessage = {
        id: Date.now(),
        sender: 'agent',
        text: generateAgentResponse(task, promptText),
        timestamp: new Date().toISOString()
      };

      // Update conversation with agent response
      const conversation = [...updatedConversation, agentMessage];

      // Update task with the conversation
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, promptHistory: conversation } : t
      ));

    }, 1500); // Simulate agent thinking time
  };

  // Generate agent response to prompt
  const generateAgentResponse = (task, promptText) => {
    // Generate different responses based on the prompt content
    if (promptText.includes('stop')) {
      return `I've received your instruction to stop processing this task. The task has been stopped and resources have been released.`;
    }

    if (promptText.includes('pause')) {
      return `I'm pausing work on this task as requested. The current state has been saved and I'll await further instructions before continuing.`;
    }

    if (promptText.includes('explain')) {
      return `I'm currently working on "${task.title}". So far, I've completed the initial analysis and am now implementing the changes. The current progress is about ${task.progress || '30'}%. The next steps will involve testing and finalizing the implementation.`;
    }

    if (promptText.includes('priority')) {
      return `Understood. I've marked this task as high priority and am allocating additional resources to complete it more quickly.`;
    }

    // Default response
    return `I've received your instructions and will incorporate them into my work on this task. I'll continue processing with these new guidelines in mind.`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Existing header and content */}
      {/* ... */}

      {/* Monitoring Panel */}
      <MonitoringPanel
        stations={stations}
        activeAgentTasks={activeAgentTasks}
        onControlTask={handleControlTask}
        onSendPrompt={handleSendPrompt}
      />
    </div>
  );
};

export default TaskSchedulerApp;