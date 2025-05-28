import React, { useState } from 'react';

// Agent Status Sidebar Component
export const AgentStatusSidebar = ({ agentStatus, agentUtilization, getTotalScheduledTime, getCompletedTasksCount, getPendingTasksCount, bundles }) => {
  console.log('[DEBUG] Rendering AgentStatusSidebar component');
  console.log('[DEBUG] AgentStatusSidebar props - agentStatus:', agentStatus, 'totalScheduledTime:', getTotalScheduledTime());
  console.log('[DEBUG] AgentStatusSidebar stats - completed:', getCompletedTasksCount(), 'pending:', getPendingTasksCount(), 'bundles:', bundles.length);

  return (
    <div className="w-64 bg-white rounded-lg shadow-sm p-4">
      <h2 className="font-semibold text-gray-700 mb-4">Agent Status</h2>

      <div className="space-y-4">
        <div className="border rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Architect</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              agentStatus.architect === 'idle' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
            }`}>
              {agentStatus.architect === 'idle' ? 'Idle' : 'Active'}
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (agentUtilization.architect / getTotalScheduledTime()) * 100)}%` }}
            ></div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {Math.round((agentUtilization.architect / getTotalScheduledTime()) * 100)}% utilization
          </div>
        </div>

        <div className="border rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Observer</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              agentStatus.observer === 'idle' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
            }`}>
              {agentStatus.observer === 'idle' ? 'Idle' : 'Active'}
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (agentUtilization.observer / getTotalScheduledTime()) * 100)}%` }}
            ></div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {Math.round((agentUtilization.observer / getTotalScheduledTime()) * 100)}% utilization
          </div>
        </div>

        <div className="border rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Code Editor</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              agentStatus.codeEditor === 'idle' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
            }`}>
              {agentStatus.codeEditor === 'idle' ? 'Idle' : 'Active'}
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="bg-teal-500 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (agentUtilization.codeEditor / getTotalScheduledTime()) * 100)}%` }}
            ></div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {Math.round((agentUtilization.codeEditor / getTotalScheduledTime()) * 100)}% utilization
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-gray-700 mb-2">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="border rounded-md p-2 bg-blue-50">
            <div className="text-sm text-gray-600">Total Tasks</div>
            <div className="text-lg font-semibold">{getCompletedTasksCount() + getPendingTasksCount()}</div>
          </div>
          <div className="border rounded-md p-2 bg-green-50">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-lg font-semibold">{getCompletedTasksCount()}</div>
          </div>
          <div className="border rounded-md p-2 bg-amber-50">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-lg font-semibold">{getPendingTasksCount()}</div>
          </div>
          <div className="border rounded-md p-2 bg-purple-50">
            <div className="text-sm text-gray-600">Bundles</div>
            <div className="text-lg font-semibold">{bundles.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// View Toggle Component
export const ViewToggle = ({ activeView, setActiveView, filter, setFilter, setIsCreatingTask }) => {
  console.log('[DEBUG] Rendering ViewToggle component');
  console.log('[DEBUG] ViewToggle props - activeView:', activeView, 'filter:', filter);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-1">
          <button 
            onClick={() => setActiveView('list')}
            className={`px-3 py-2 rounded-md flex items-center ${
              activeView === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <span className="mr-1">List</span>
          </button>
          <button 
            onClick={() => setActiveView('calendar')}
            className={`px-3 py-2 rounded-md flex items-center ${
              activeView === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <span className="mr-1">Calendar</span>
          </button>
          <button 
            onClick={() => setActiveView('kanban')}
            className={`px-3 py-2 rounded-md flex items-center ${
              activeView === 'kanban' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <span className="mr-1">Kanban</span>
          </button>
          <button 
            onClick={() => setActiveView('bundles')}
            className={`px-3 py-2 rounded-md flex items-center ${
              activeView === 'bundles' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <span className="mr-1">Bundles</span>
          </button>
        </div>

        <div className="flex space-x-2">
          <select 
            className="border rounded-md px-3 py-2 text-sm bg-white text-gray-700"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <button 
            onClick={() => setIsCreatingTask(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-md text-sm flex items-center">
            <span className="mr-1">+</span>
            New Task
          </button>
        </div>
      </div>
    </div>
  );
};

// Deployment Status Component
export const DeploymentStatus = ({ deploymentStatus }) => {
  if (!deploymentStatus) return null;

  return (
    <div className={`mb-4 p-3 rounded-md flex items-center ${
      deploymentStatus.status === 'deploying' ? 'bg-blue-50 border border-blue-200' :
      deploymentStatus.status === 'deployed' ? 'bg-green-50 border border-green-200' :
      'bg-red-50 border border-red-200'
    }`}>
      {deploymentStatus.status === 'deploying' && (
        <>
          <div className="animate-spin w-5 h-5 mr-2 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-blue-700">
            {deploymentStatus.type === 'task' ? 'Deploying task...' : 'Deploying bundle...'}
          </span>
        </>
      )}
      {deploymentStatus.status === 'deployed' && (
        <>
          <span className="w-5 h-5 mr-2 text-green-500">✓</span>
          <span className="text-green-700">
            {deploymentStatus.type === 'task' ? 'Task successfully deployed!' : 'Bundle successfully deployed!'}
          </span>
        </>
      )}
      {deploymentStatus.status === 'failed' && (
        <>
          <span className="w-5 h-5 mr-2 text-red-500">⚠</span>
          <span className="text-red-700">
            {deploymentStatus.type === 'task' ? 'Task deployment failed!' : 'Bundle deployment failed!'}
          </span>
        </>
      )}
    </div>
  );
};

// Task Creation Form Component
export const TaskCreationForm = ({ newTask, setNewTask, handleCreateTask, setIsCreatingTask }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await handleCreateTask();
    } catch (err) {
      setError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-4 p-4 border border-dashed border-indigo-300 rounded-md bg-indigo-50">
      <h3 className="font-medium text-indigo-800 mb-3">Create New Task</h3>
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-md" 
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border rounded-md" 
              value={newTask.dueDate}
              onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={newTask.size}
              onChange={(e) => setNewTask({...newTask, size: e.target.value})}
            >
              <option value="small">Small (30 min)</option>
              <option value="medium">Medium (1 hour)</option>
              <option value="large">Large (3 hours)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={newTask.agent}
              onChange={(e) => setNewTask({...newTask, agent: e.target.value})}
            >
              <option value="architect">Architect</option>
              <option value="observer">Observer</option>
              <option value="codeEditor">Code Editor</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <button 
            type="button"
            onClick={() => setIsCreatingTask(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:bg-indigo-300"
            disabled={!newTask.title || submitting}
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Bundle Creation Form Component
export const BundleCreationForm = ({ newBundle, setNewBundle, handleCreateBundle, setIsCreatingBundle, setSelectedTasks }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await handleCreateBundle();
    } catch (err) {
      setError(err.message || 'Failed to create bundle. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 p-4 border border-dashed border-indigo-300 rounded-md bg-indigo-50">
      <h3 className="font-medium text-indigo-800 mb-3">Create Task Bundle</h3>
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Title</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-md" 
              value={newBundle.title}
              onChange={(e) => setNewBundle({...newBundle, title: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Time</label>
            <input 
              type="datetime-local" 
              className="w-full px-3 py-2 border rounded-md" 
              value={newBundle.scheduledTime}
              onChange={(e) => setNewBundle({...newBundle, scheduledTime: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              className="w-full px-3 py-2 border rounded-md" 
              value={newBundle.description}
              onChange={(e) => setNewBundle({...newBundle, description: e.target.value})}
              rows={2}
            ></textarea>
          </div>
        </div>
        <div className="mt-2 text-sm text-indigo-600">
          {newBundle.tasks.length} tasks selected for this bundle
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <button 
            type="button"
            onClick={() => {
              setIsCreatingBundle(false);
              setSelectedTasks([]);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:bg-indigo-300"
            disabled={!newBundle.title || newBundle.tasks.length === 0 || submitting}
          >
            {submitting ? 'Creating...' : 'Create Bundle'}
          </button>
        </div>
      </form>
    </div>
  );
};
