import React from 'react';
import { useState, useEffect } from 'react';
import { AgentStatusSidebar, ViewToggle, DeploymentStatus, TaskCreationForm, BundleCreationForm } from './TaskSchedulerViews';
import { ListView, CalendarView, KanbanView, BundlesView } from './TaskSchedulerViewComponents';

const TaskSchedulerApp = () => {
  // State management
  const [activeView, setActiveView] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingBundle, setIsCreatingBundle] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', size: 'medium', priority: 'medium', dueDate: '', status: 'pending', agent: 'architect' });
  const [newBundle, setNewBundle] = useState({ title: '', description: '', tasks: [], scheduledTime: '' });
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [agentStatus, setAgentStatus] = useState({
    architect: 'idle',
    observer: 'idle',
    codeEditor: 'idle'
  });
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [filter, setFilter] = useState('all');

  // Simulate fetching initial data
  useEffect(() => {
    // Sample data
    const sampleTasks = [
      { id: 1, title: 'Refactor authentication module', size: 'large', priority: 'high', dueDate: '2025-05-18', status: 'in-progress', agent: 'architect', assignee: 'John Doe', estimatedTime: 240 },
      { id: 2, title: 'Fix navigation bug in sidebar', size: 'small', priority: 'medium', dueDate: '2025-05-15', status: 'pending', agent: 'codeEditor', assignee: 'Jane Smith', estimatedTime: 45 },
      { id: 3, title: 'Implement new API endpoints', size: 'medium', priority: 'high', dueDate: '2025-05-20', status: 'pending', agent: 'architect', assignee: 'Alex Johnson', estimatedTime: 120 },
      { id: 4, title: 'Update dependencies', size: 'small', priority: 'low', dueDate: '2025-05-14', status: 'completed', agent: 'observer', assignee: 'Sam Wilson', estimatedTime: 30 },
      { id: 5, title: 'Code review for PR #142', size: 'medium', priority: 'medium', dueDate: '2025-05-16', status: 'pending', agent: 'observer', assignee: 'Lisa Chen', estimatedTime: 90 }
    ];

    const sampleBundles = [
      { id: 1, title: 'Sprint 45 Authentication Updates', description: 'All authentication related tasks for Sprint 45', tasks: [1, 3], scheduledTime: '2025-05-19T10:00', status: 'scheduled' },
      { id: 2, title: 'Maintenance Tasks', description: 'Regular system maintenance tasks', tasks: [2, 4], scheduledTime: '2025-05-16T14:00', status: 'pending' }
    ];

    setTasks(sampleTasks);
    setBundles(sampleBundles);
  }, []);

  // Calculate optimal task bundles based on agent type, size, and dependencies
  const suggestOptimalBundles = () => {
    // Group tasks by agent type
    const tasksByAgent = tasks.reduce((acc, task) => {
      if (task.status === 'pending') {
        if (!acc[task.agent]) acc[task.agent] = [];
        acc[task.agent].push(task);
      }
      return acc;
    }, {});

    // Generate suggested bundles
    const suggestedBundles = [];

    // Bundle for architect tasks
    if (tasksByAgent.architect && tasksByAgent.architect.length > 0) {
      suggestedBundles.push({
        title: 'Suggested Architecture Tasks',
        description: 'Architectural tasks grouped for efficient processing',
        tasks: tasksByAgent.architect.map(t => t.id),
        scheduledTime: getTomorrowWorkingHours()
      });
    }

    // Bundle for code editor tasks
    if (tasksByAgent.codeEditor && tasksByAgent.codeEditor.length > 0) {
      suggestedBundles.push({
        title: 'Suggested Implementation Tasks',
        description: 'Code implementation tasks grouped for efficient processing',
        tasks: tasksByAgent.codeEditor.map(t => t.id),
        scheduledTime: getTomorrowWorkingHours(3) // 3 hours after architect
      });
    }

    // Add suggested bundles
    setBundles([...bundles, ...suggestedBundles.map((bundle, idx) => ({
      ...bundle,
      id: bundles.length + idx + 1,
      status: 'suggested'
    }))]);
  };

  // Helper for scheduling suggestions
  const getTomorrowWorkingHours = (hoursOffset = 0) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9 + hoursOffset, 0, 0); // 9 AM + offset
    return tomorrow.toISOString().slice(0, 16);
  };

  // Create a new task
  const handleCreateTask = () => {
    const taskId = tasks.length + 1;

    // Calculate estimated time based on size
    let estimatedTime = 60; // Default to 1 hour
    if (newTask.size === 'small') estimatedTime = 30;
    if (newTask.size === 'large') estimatedTime = 180;

    setTasks([...tasks, { 
      ...newTask, 
      id: taskId,
      estimatedTime,
      assignee: getRandomAssignee()
    }]);
    setNewTask({ title: '', size: 'medium', priority: 'medium', dueDate: '', status: 'pending', agent: 'architect' });
    setIsCreatingTask(false);
  };

  // Helper for demo purposes
  const getRandomAssignee = () => {
    const assignees = ['John Doe', 'Jane Smith', 'Alex Johnson', 'Sam Wilson', 'Lisa Chen'];
    return assignees[Math.floor(Math.random() * assignees.length)];
  };

  // Create a new bundle
  const handleCreateBundle = () => {
    setBundles([...bundles, { 
      ...newBundle, 
      id: bundles.length + 1,
      status: 'pending'
    }]);
    setNewBundle({ title: '', description: '', tasks: [], scheduledTime: '' });
    setIsCreatingBundle(false);
    setSelectedTasks([]);
  };

  // Toggle task selection for bundling
  const toggleTaskSelection = (taskId) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }

    // Update new bundle tasks
    setNewBundle({
      ...newBundle,
      tasks: selectedTasks.includes(taskId) 
        ? newBundle.tasks.filter(id => id !== taskId)
        : [...newBundle.tasks, taskId]
    });
  };

  // Deploy a single task
  const deployTask = (taskId) => {
    // Simulate deployment process
    setDeploymentStatus({ type: 'task', id: taskId, status: 'deploying' });

    // Update agent status
    const task = tasks.find(t => t.id === taskId);
    setAgentStatus({ ...agentStatus, [task.agent]: 'active' });

    // Simulate agent processing
    setTimeout(() => {
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: 'in-progress' } : task
      ));

      setDeploymentStatus({ type: 'task', id: taskId, status: 'deployed' });

      // Reset after 2 seconds
      setTimeout(() => {
        setDeploymentStatus(null);
        setAgentStatus({ ...agentStatus, [task.agent]: 'idle' });
      }, 2000);
    }, 1500);
  };

  // Deploy a bundle of tasks
  const deployBundle = (bundleId) => {
    // Simulate deployment process
    setDeploymentStatus({ type: 'bundle', id: bundleId, status: 'deploying' });

    const bundle = bundles.find(b => b.id === bundleId);

    // Activate all relevant agents
    const bundleTasks = tasks.filter(t => bundle.tasks.includes(t.id));
    const agentsInvolved = [...new Set(bundleTasks.map(t => t.agent))];

    const newAgentStatus = { ...agentStatus };
    agentsInvolved.forEach(agent => {
      newAgentStatus[agent] = 'active';
    });
    setAgentStatus(newAgentStatus);

    // Simulate bundle deployment process
    setTimeout(() => {
      // Update bundle status
      setBundles(bundles.map(b => 
        b.id === bundleId ? { ...b, status: 'in-progress' } : b
      ));

      // Update all tasks in the bundle
      setTasks(tasks.map(task => 
        bundle.tasks.includes(task.id) ? { ...task, status: 'in-progress' } : task
      ));

      setDeploymentStatus({ type: 'bundle', id: bundleId, status: 'deployed' });

      // Reset after 2 seconds
      setTimeout(() => {
        setDeploymentStatus(null);

        // Return agents to idle
        setTimeout(() => {
          const resetAgentStatus = { ...newAgentStatus };
          agentsInvolved.forEach(agent => {
            resetAgentStatus[agent] = 'idle';
          });
          setAgentStatus(resetAgentStatus);
        }, 1000);
      }, 2000);
    }, 2000);
  };

  // Accept a suggested bundle
  const acceptBundle = (bundleId) => {
    setBundles(bundles.map(bundle => 
      bundle.id === bundleId ? { ...bundle, status: 'scheduled' } : bundle
    ));
  };

  // Reset task statuses for demo purposes
  const resetStatuses = () => {
    setTasks(tasks.map(task => ({ ...task, status: 'pending' })));
    setBundles(bundles.map(bundle => 
      bundle.status === 'in-progress' ? { ...bundle, status: 'pending' } : bundle
    ));
  };

  // Filter tasks based on current filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'in-progress') return task.status === 'in-progress';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  // Calculate usage metrics for dashboard
  const getTotalScheduledTime = () => {
    return tasks.reduce((total, task) => total + task.estimatedTime, 0);
  };

  const getCompletedTasksCount = () => {
    return tasks.filter(task => task.status === 'completed').length;
  };

  const getPendingTasksCount = () => {
    return tasks.filter(task => task.status === 'pending').length;
  };

  const getAgentUtilization = () => {
    const utilization = {
      architect: 0,
      observer: 0,
      codeEditor: 0
    };

    tasks.forEach(task => {
      utilization[task.agent] += task.estimatedTime;
    });

    return utilization;
  };

  const agentUtilization = getAgentUtilization();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold">AI Agent Task Scheduler</h1>
          <div className="flex space-x-4">
            <button 
              onClick={() => suggestOptimalBundles()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded flex items-center text-sm">
              Suggest Optimal Bundles
            </button>
            <button 
              onClick={() => resetStatuses()}
              className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm">
              Reset Demo
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 flex gap-4">
        {/* Left sidebar - Agent status */}
        <AgentStatusSidebar 
          agentStatus={agentStatus} 
          agentUtilization={agentUtilization} 
          getTotalScheduledTime={getTotalScheduledTime} 
          getCompletedTasksCount={getCompletedTasksCount} 
          getPendingTasksCount={getPendingTasksCount} 
          bundles={bundles} 
        />

        {/* Main content area */}
        <div className="flex-1">
          {/* View toggle and filters */}
          <ViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
            filter={filter} 
            setFilter={setFilter} 
            setIsCreatingTask={setIsCreatingTask} 
          />

          {/* Task deployment status indicator */}
          <DeploymentStatus deploymentStatus={deploymentStatus} />

          {/* View content */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            {/* List View */}
            {activeView === 'list' && (
              <>
                {isCreatingTask && (
                  <TaskCreationForm 
                    newTask={newTask} 
                    setNewTask={setNewTask} 
                    handleCreateTask={handleCreateTask} 
                    setIsCreatingTask={setIsCreatingTask} 
                  />
                )}

                <ListView 
                  filteredTasks={filteredTasks} 
                  isCreatingBundle={isCreatingBundle} 
                  selectedTasks={selectedTasks} 
                  toggleTaskSelection={toggleTaskSelection} 
                  deployTask={deployTask} 
                  isCreatingTask={isCreatingTask} 
                  newTask={newTask} 
                  setNewTask={setNewTask} 
                  handleCreateTask={handleCreateTask} 
                  setIsCreatingTask={setIsCreatingTask} 
                  setIsCreatingBundle={setIsCreatingBundle} 
                  newBundle={newBundle} 
                  setNewBundle={setNewBundle} 
                  handleCreateBundle={handleCreateBundle} 
                  setSelectedTasks={setSelectedTasks} 
                />

                {isCreatingBundle && (
                  <BundleCreationForm 
                    newBundle={newBundle} 
                    setNewBundle={setNewBundle} 
                    handleCreateBundle={handleCreateBundle} 
                    setIsCreatingBundle={setIsCreatingBundle} 
                    setSelectedTasks={setSelectedTasks} 
                  />
                )}
              </>
            )}

            {/* Calendar View */}
            {activeView === 'calendar' && (
              <CalendarView tasks={tasks} bundles={bundles} />
            )}

            {/* Kanban View */}
            {activeView === 'kanban' && (
              <KanbanView tasks={tasks} deployTask={deployTask} />
            )}

            {/* Bundles View */}
            {activeView === 'bundles' && (
              <BundlesView 
                bundles={bundles} 
                tasks={tasks} 
                deployBundle={deployBundle} 
                acceptBundle={acceptBundle} 
                setIsCreatingBundle={setIsCreatingBundle} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskSchedulerApp;
