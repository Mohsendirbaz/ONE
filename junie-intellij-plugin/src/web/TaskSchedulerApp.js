import React from 'react';
import { useState, useEffect } from 'react';
import { AgentStatusSidebar, ViewToggle, DeploymentStatus, TaskCreationForm, BundleCreationForm } from './TaskSchedulerViews';
import { ListView, CalendarView, KanbanView, BundlesView } from './TaskSchedulerViewComponents';
import * as taskSchedulerApi from './taskSchedulerApi';

const TaskSchedulerApp = () => {
  console.log('[DEBUG] Initializing TaskSchedulerApp component');

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

  console.log('[DEBUG] Initial state set up');

  // Simulate fetching initial data
  useEffect(() => {
    console.log('[DEBUG] useEffect: Loading initial data');

    // Sample data
    const sampleTasks = [
      { id: 1, title: 'Refactor authentication module', size: 'large', priority: 'high', dueDate: '2025-05-18', status: 'in-progress', agent: 'architect', assignee: 'John Doe', estimatedTime: 240 },
      { id: 2, title: 'Fix navigation bug in sidebar', size: 'small', priority: 'medium', dueDate: '2025-05-15', status: 'pending', agent: 'codeEditor', assignee: 'Jane Smith', estimatedTime: 45 },
      { id: 3, title: 'Implement new API endpoints', size: 'medium', priority: 'high', dueDate: '2025-05-20', status: 'pending', agent: 'architect', assignee: 'Alex Johnson', estimatedTime: 120 },
      { id: 4, title: 'Update dependencies', size: 'small', priority: 'low', dueDate: '2025-05-14', status: 'completed', agent: 'observer', assignee: 'Sam Wilson', estimatedTime: 30 },
      { id: 5, title: 'Code review for PR #142', size: 'medium', priority: 'medium', dueDate: '2025-05-16', status: 'pending', agent: 'observer', assignee: 'Lisa Chen', estimatedTime: 90 }
    ];
    console.log('[DEBUG] Sample tasks prepared:', sampleTasks.length);

    const sampleBundles = [
      { id: 1, title: 'Sprint 45 Authentication Updates', description: 'All authentication related tasks for Sprint 45', tasks: [1, 3], scheduledTime: '2025-05-19T10:00', status: 'scheduled' },
      { id: 2, title: 'Maintenance Tasks', description: 'Regular system maintenance tasks', tasks: [2, 4], scheduledTime: '2025-05-16T14:00', status: 'pending' }
    ];
    console.log('[DEBUG] Sample bundles prepared:', sampleBundles.length);

    setTasks(sampleTasks);
    setBundles(sampleBundles);
    console.log('[DEBUG] Initial data loaded');
  }, []);

  // Calculate optimal task bundles based on agent type, size, and dependencies
  const suggestOptimalBundles = () => {
    console.log('[DEBUG] Suggesting optimal bundles');

    // Group tasks by agent type
    const tasksByAgent = tasks.reduce((acc, task) => {
      if (task.status === 'pending') {
        if (!acc[task.agent]) acc[task.agent] = [];
        acc[task.agent].push(task);
      }
      return acc;
    }, {});
    console.log('[DEBUG] Tasks grouped by agent:', Object.keys(tasksByAgent));

    // Generate suggested bundles
    const suggestedBundles = [];

    // Bundle for architect tasks
    if (tasksByAgent.architect && tasksByAgent.architect.length > 0) {
      console.log('[DEBUG] Creating architect bundle with', tasksByAgent.architect.length, 'tasks');
      suggestedBundles.push({
        title: 'Suggested Architecture Tasks',
        description: 'Architectural tasks grouped for efficient processing',
        tasks: tasksByAgent.architect.map(t => t.id),
        scheduledTime: getTomorrowWorkingHours()
      });
    }

    // Bundle for code editor tasks
    if (tasksByAgent.codeEditor && tasksByAgent.codeEditor.length > 0) {
      console.log('[DEBUG] Creating code editor bundle with', tasksByAgent.codeEditor.length, 'tasks');
      suggestedBundles.push({
        title: 'Suggested Implementation Tasks',
        description: 'Code implementation tasks grouped for efficient processing',
        tasks: tasksByAgent.codeEditor.map(t => t.id),
        scheduledTime: getTomorrowWorkingHours(3) // 3 hours after architect
      });
    }

    console.log('[DEBUG] Created', suggestedBundles.length, 'suggested bundles');

    // Add suggested bundles
    const newBundles = [...bundles, ...suggestedBundles.map((bundle, idx) => ({
      ...bundle,
      id: bundles.length + idx + 1,
      status: 'suggested'
    }))];

    setBundles(newBundles);
    console.log('[DEBUG] Updated bundles state with suggested bundles, total count:', newBundles.length);
  };

  // Helper for scheduling suggestions
  const getTomorrowWorkingHours = (hoursOffset = 0) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9 + hoursOffset, 0, 0); // 9 AM + offset
    return tomorrow.toISOString().slice(0, 16);
  };

  // Create a new task
  const handleCreateTask = async () => {
    console.log('[DEBUG] handleCreateTask: Creating new task');
    try {
      // Validate required fields
      if (!newTask.title) {
        console.log('[DEBUG] Task creation validation failed: Title is required');
        throw new Error('Task title is required');
      }

      // Calculate estimated time based on size
      let estimatedTime = 60; // Default to 1 hour
      if (newTask.size === 'small') estimatedTime = 30;
      if (newTask.size === 'large') estimatedTime = 180;
      console.log('[DEBUG] Calculated estimated time:', estimatedTime, 'minutes for size:', newTask.size);

      // Prepare task data for API
      const taskData = {
        title: newTask.title,
        size: newTask.size, 
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        status: 'pending',
        agent: newTask.agent,
        estimatedTime,
        // Additional metadata needed by backend
        projectId: taskSchedulerApi.getCurrentProjectId(),
        filePaths: taskSchedulerApi.getSelectedFilePaths(),
        assignee: getRandomAssignee() // For demo purposes
      };
      console.log('[DEBUG] Prepared task data:', taskData);

      // API call to create task
      console.log('[DEBUG] Calling API to create task');
      const createdTask = await taskSchedulerApi.createTask(taskData);
      console.log('[DEBUG] Task created successfully:', createdTask);

      // Update local state with new task
      setTasks(prevTasks => {
        const newTasks = [...prevTasks, createdTask];
        console.log('[DEBUG] Updated tasks state, new count:', newTasks.length);
        return newTasks;
      });

      // Reset form
      setNewTask({ title: '', size: 'medium', priority: 'medium', dueDate: '', status: 'pending', agent: 'architect' });
      console.log('[DEBUG] Reset task form');

      // Hide form
      setIsCreatingTask(false);
      console.log('[DEBUG] Hid task creation form');

      return createdTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      console.log('[DEBUG] Task creation failed with error:', error.message);
      throw error;
    }
  };

  // Helper for demo purposes
  const getRandomAssignee = () => {
    const assignees = ['John Doe', 'Jane Smith', 'Alex Johnson', 'Sam Wilson', 'Lisa Chen'];
    return assignees[Math.floor(Math.random() * assignees.length)];
  };

  // Create a new bundle
  const handleCreateBundle = async () => {
    console.log('[DEBUG] handleCreateBundle: Creating new bundle');
    try {
      // Validate required fields
      if (!newBundle.title || newBundle.tasks.length === 0) {
        console.log('[DEBUG] Bundle creation validation failed: Title or tasks missing');
        throw new Error('Bundle title and at least one task are required');
      }

      // Prepare bundle data for API
      const bundleData = {
        title: newBundle.title,
        description: newBundle.description,
        tasks: newBundle.tasks,
        scheduledTime: newBundle.scheduledTime,
        status: 'pending',
        projectId: taskSchedulerApi.getCurrentProjectId()
      };
      console.log('[DEBUG] Prepared bundle data:', bundleData);

      // API call to create bundle
      console.log('[DEBUG] Calling API to create bundle');
      const createdBundle = await taskSchedulerApi.createBundle(bundleData);
      console.log('[DEBUG] Bundle created successfully:', createdBundle);

      // Update local state with new bundle
      setBundles(prevBundles => {
        const newBundles = [...prevBundles, createdBundle];
        console.log('[DEBUG] Updated bundles state, new count:', newBundles.length);
        return newBundles;
      });

      // Reset form and selections
      setNewBundle({ title: '', description: '', tasks: [], scheduledTime: '' });
      setSelectedTasks([]);
      console.log('[DEBUG] Reset bundle form and selected tasks');

      setIsCreatingBundle(false);
      console.log('[DEBUG] Hid bundle creation form');

      return createdBundle;
    } catch (error) {
      console.error('Failed to create bundle:', error);
      console.log('[DEBUG] Bundle creation failed with error:', error.message);
      throw error;
    }
  };

  // Toggle task selection for bundling
  const toggleTaskSelection = (taskId) => {
    // Update the selected tasks array
    setSelectedTasks(prevSelected => {
      if (prevSelected.includes(taskId)) {
        return prevSelected.filter(id => id !== taskId);
      } else {
        return [...prevSelected, taskId];
      }
    });

    // Update the bundle tasks
    setNewBundle(prevBundle => {
      const updatedTasks = prevBundle.tasks.includes(taskId)
        ? prevBundle.tasks.filter(id => id !== taskId)
        : [...prevBundle.tasks, taskId];

      return {
        ...prevBundle,
        tasks: updatedTasks
      };
    });

    // If creating a new bundle, highlight compatible tasks
    if (isCreatingBundle) {
      highlightCompatibleTasks(taskId);
    }
  };

  // Add a new function to highlight compatible tasks
  const highlightCompatibleTasks = (selectedTaskId) => {
    // Get the selected task
    const selectedTask = tasks.find(task => task.id === selectedTaskId);

    // If no task found, return
    if (!selectedTask) return;

    // Highlight tasks that are compatible with the selected task
    // For example, highlight tasks with the same agent or dependent tasks
    setTasks(prevTasks => prevTasks.map(task => ({
      ...task,
      highlighted: task.agent === selectedTask.agent && task.status === 'pending'
    })));
  };

  // Deploy a single task
  const deployTask = async (taskId) => {
    console.log('[DEBUG] deployTask: Deploying task with ID:', taskId);
    try {
      // Set deployment status to deploying
      setDeploymentStatus({ type: 'task', id: taskId, status: 'deploying' });
      console.log('[DEBUG] Set deployment status to deploying');

      // Get the task
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.log('[DEBUG] Task not found with ID:', taskId);
        throw new Error('Task not found');
      }
      console.log('[DEBUG] Found task to deploy:', task);

      // Update agent status
      setAgentStatus(prevStatus => {
        const newStatus = { ...prevStatus, [task.agent]: 'active' };
        console.log('[DEBUG] Updated agent status:', newStatus);
        return newStatus;
      });

      // Call API to deploy task
      console.log('[DEBUG] Calling API to deploy task');
      const updatedTask = await taskSchedulerApi.deployTask(taskId);
      console.log('[DEBUG] Task deployed successfully:', updatedTask);

      // Update task status in local state
      setTasks(prevTasks => {
        const newTasks = prevTasks.map(t => 
          t.id === taskId ? { ...t, status: 'in-progress' } : t
        );
        console.log('[DEBUG] Updated task status in local state');
        return newTasks;
      });

      // Set deployment status to deployed
      setDeploymentStatus({ type: 'task', id: taskId, status: 'deployed' });
      console.log('[DEBUG] Set deployment status to deployed');

      // Reset deployment status after 2 seconds
      setTimeout(() => {
        setDeploymentStatus(null);
        console.log('[DEBUG] Reset deployment status');
      }, 2000);

      // Return agent to idle after task is processed
      setTimeout(() => {
        setAgentStatus(prevStatus => {
          const newStatus = { ...prevStatus, [task.agent]: 'idle' };
          console.log('[DEBUG] Returned agent to idle status:', newStatus);
          return newStatus;
        });
      }, 3000);

      return updatedTask;
    } catch (error) {
      console.error('Failed to deploy task:', error);
      console.log('[DEBUG] Task deployment failed with error:', error.message);

      setDeploymentStatus({ type: 'task', id: taskId, status: 'failed', error: error.message });
      console.log('[DEBUG] Set deployment status to failed');

      // Reset deployment status after 3 seconds
      setTimeout(() => {
        setDeploymentStatus(null);
        console.log('[DEBUG] Reset deployment status after failure');
      }, 3000);

      // Reset agent status
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setAgentStatus(prevStatus => {
          const newStatus = { ...prevStatus, [task.agent]: 'idle' };
          console.log('[DEBUG] Reset agent status after failure:', newStatus);
          return newStatus;
        });
      }

      throw error;
    }
  };

  // Deploy a bundle of tasks
  const deployBundle = async (bundleId) => {
    console.log('[DEBUG] deployBundle: Deploying bundle with ID:', bundleId);
    try {
      // Set deployment status to deploying
      setDeploymentStatus({ type: 'bundle', id: bundleId, status: 'deploying' });
      console.log('[DEBUG] Set bundle deployment status to deploying');

      // Get the bundle
      const bundle = bundles.find(b => b.id === bundleId);
      if (!bundle) {
        console.log('[DEBUG] Bundle not found with ID:', bundleId);
        throw new Error('Bundle not found');
      }
      console.log('[DEBUG] Found bundle to deploy:', bundle);

      // Get tasks in the bundle
      const bundleTasks = tasks.filter(t => bundle.tasks.includes(t.id));
      console.log('[DEBUG] Tasks in bundle:', bundleTasks.length);

      // Get unique agents involved
      const agentsInvolved = [...new Set(bundleTasks.map(t => t.agent))];
      console.log('[DEBUG] Agents involved in bundle:', agentsInvolved);

      // Update agent statuses to active
      const newAgentStatus = { ...agentStatus };
      agentsInvolved.forEach(agent => {
        newAgentStatus[agent] = 'active';
      });
      setAgentStatus(newAgentStatus);
      console.log('[DEBUG] Updated agent statuses to active:', newAgentStatus);

      // Call API to deploy bundle
      console.log('[DEBUG] Calling API to deploy bundle');
      const updatedBundle = await taskSchedulerApi.deployBundle(bundleId);
      console.log('[DEBUG] Bundle deployed successfully:', updatedBundle);

      // Update bundle status in local state
      setBundles(prevBundles => {
        const newBundles = prevBundles.map(b => 
          b.id === bundleId ? { ...b, status: 'in-progress' } : b
        );
        console.log('[DEBUG] Updated bundle status in local state');
        return newBundles;
      });

      // Update all tasks in the bundle
      setTasks(prevTasks => {
        const newTasks = prevTasks.map(task => 
          bundle.tasks.includes(task.id) ? { ...task, status: 'in-progress' } : task
        );
        console.log('[DEBUG] Updated all tasks in bundle to in-progress');
        return newTasks;
      });

      // Set deployment status to deployed
      setDeploymentStatus({ type: 'bundle', id: bundleId, status: 'deployed' });
      console.log('[DEBUG] Set bundle deployment status to deployed');

      // Reset deployment status after 2 seconds
      setTimeout(() => {
        setDeploymentStatus(null);
        console.log('[DEBUG] Reset bundle deployment status');
      }, 2000);

      // Return agents to idle after bundle is processed
      setTimeout(() => {
        const resetAgentStatus = { ...newAgentStatus };
        agentsInvolved.forEach(agent => {
          resetAgentStatus[agent] = 'idle';
        });
        setAgentStatus(resetAgentStatus);
        console.log('[DEBUG] Returned all agents to idle status:', resetAgentStatus);
      }, 3000);

      return updatedBundle;
    } catch (error) {
      console.error('Failed to deploy bundle:', error);
      console.log('[DEBUG] Bundle deployment failed with error:', error.message);

      setDeploymentStatus({ type: 'bundle', id: bundleId, status: 'failed', error: error.message });
      console.log('[DEBUG] Set bundle deployment status to failed');

      // Reset deployment status after 3 seconds
      setTimeout(() => {
        setDeploymentStatus(null);
        console.log('[DEBUG] Reset bundle deployment status after failure');
      }, 3000);

      // Reset agent statuses
      const bundle = bundles.find(b => b.id === bundleId);
      if (bundle) {
        const bundleTasks = tasks.filter(t => bundle.tasks.includes(t.id));
        const agentsInvolved = [...new Set(bundleTasks.map(t => t.agent))];
        console.log('[DEBUG] Resetting agent statuses after failure for agents:', agentsInvolved);

        const resetAgentStatus = { ...agentStatus };
        agentsInvolved.forEach(agent => {
          resetAgentStatus[agent] = 'idle';
        });
        setAgentStatus(resetAgentStatus);
        console.log('[DEBUG] Reset agent statuses after failure:', resetAgentStatus);
      }

      throw error;
    }
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
