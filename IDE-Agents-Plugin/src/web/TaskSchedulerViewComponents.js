import React from 'react';

// List View Component
export const ListView = ({ 
  filteredTasks, 
  isCreatingBundle, 
  selectedTasks, 
  toggleTaskSelection, 
  deployTask, 
  isCreatingTask, 
  newTask, 
  setNewTask, 
  handleCreateTask, 
  setIsCreatingTask, 
  setIsCreatingBundle, 
  newBundle, 
  setNewBundle, 
  handleCreateBundle, 
  setSelectedTasks 
}) => {
  console.log('[DEBUG] Rendering ListView component');
  console.log('[DEBUG] ListView props - filteredTasks:', filteredTasks.length, 'isCreatingBundle:', isCreatingBundle, 'selectedTasks:', selectedTasks.length);

  return (
    <div>
      <h2 className="font-semibold text-gray-700 mb-4">Tasks</h2>

      {/* Bundle creation action row */}
      {!isCreatingBundle && !isCreatingTask && filteredTasks.filter(t => t.status === 'pending').length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setIsCreatingBundle(true)}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-500 mr-2"
          >
            Create Bundle
          </button>
        </div>
      )}

      {/* Task List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isCreatingBundle && (
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
              )}
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size/Priority
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <tr 
                key={task.id} 
                className={`hover:bg-gray-50 ${task.highlighted ? 'bg-indigo-50' : ''}`}
              >
                {isCreatingBundle && (
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      disabled={task.status !== 'pending'}
                    />
                  </td>
                )}
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{task.title}</div>
                  <div className="text-sm text-gray-500">{task.assignee}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {task.size}
                  </span>
                  <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {task.priority}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    {task.agent === 'architect' ? 'Architect' :
                     task.agent === 'observer' ? 'Observer' : 'Code Editor'}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{task.dueDate}</div>
                  <div className="text-xs text-gray-500">{task.estimatedTime} min</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {task.status === 'pending' ? 'Pending' : 
                     task.status === 'in-progress' ? 'In Progress' : 'Completed'}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  {task.status === 'pending' && (
                    <button 
                      onClick={() => deployTask(task.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Deploy
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No tasks match the current filter
        </div>
      )}
    </div>
  );
};

// Calendar View Component
export const CalendarView = ({ tasks, bundles }) => {
  console.log('[DEBUG] Rendering CalendarView component');
  console.log('[DEBUG] CalendarView props - tasks:', tasks.length, 'bundles:', bundles.length);

  return (
    <div>
      <h2 className="font-semibold text-gray-700 mb-4">Calendar View</h2>
      <div className="border rounded-md">
        <div className="flex justify-between items-center bg-gray-50 p-3 border-b">
          <button className="p-1 rounded-full hover:bg-gray-200">
            ▼
          </button>
          <h3 className="font-medium text-gray-700">May 2025</h3>
          <button className="p-1 rounded-full hover:bg-gray-200">
            ▲
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Kanban View Component
export const KanbanView = ({ tasks, deployTask }) => {
  console.log('[DEBUG] Rendering KanbanView component');
  console.log('[DEBUG] KanbanView props - tasks:', tasks.length);
  console.log('[DEBUG] KanbanView task status counts - pending:', tasks.filter(t => t.status === 'pending').length, 
    'in-progress:', tasks.filter(t => t.status === 'in-progress').length, 
    'completed:', tasks.filter(t => t.status === 'completed').length);

  return (
    <div>
      <h2 className="font-semibold text-gray-700 mb-4">Kanban Board</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Column */}
        <div className="border rounded-md bg-gray-50">
          <div className="p-3 border-b bg-yellow-50">
            <h3 className="font-medium text-gray-700 flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
              Pending
              <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === 'pending').length}
              </span>
            </h3>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="border rounded-md bg-gray-50">
          <div className="p-3 border-b bg-blue-50">
            <h3 className="font-medium text-gray-700 flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-400 mr-2"></span>
              In Progress
              <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === 'in-progress').length}
              </span>
            </h3>
          </div>
        </div>

        {/* Completed Column */}
        <div className="border rounded-md bg-gray-50">
          <div className="p-3 border-b bg-green-50">
            <h3 className="font-medium text-gray-700 flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>
              Completed
              <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === 'completed').length}
              </span>
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bundles View Component
export const BundlesView = ({ bundles, tasks, deployBundle, acceptBundle, setIsCreatingBundle }) => {
  console.log('[DEBUG] Rendering BundlesView component');
  console.log('[DEBUG] BundlesView props - bundles:', bundles.length, 'tasks:', tasks.length);
  console.log('[DEBUG] BundlesView bundle status counts - suggested:', bundles.filter(b => b.status === 'suggested').length, 
    'scheduled:', bundles.filter(b => b.status === 'scheduled').length, 
    'in-progress:', bundles.filter(b => b.status === 'in-progress').length);

  return (
    <div>
      <h2 className="font-semibold text-gray-700 mb-4">Task Bundles</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {bundles.map(bundle => (
          <div 
            key={bundle.id} 
            className="border rounded-md shadow-sm bg-white"
          >
            <div className="p-3 border-b flex justify-between items-center">
              <h3 className="font-medium text-gray-800">{bundle.title}</h3>
              <span className="px-2 py-1 text-xs rounded-full font-semibold bg-yellow-100 text-yellow-800">
                {bundle.status}
              </span>
            </div>

            <div className="p-3">
              <p className="text-sm text-gray-600 mb-2">{bundle.description}</p>

              {bundle.scheduledTime && (
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  Scheduled: {new Date(bundle.scheduledTime).toLocaleString()}
                </div>
              )}

              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Tasks in bundle: {bundle.tasks.length}</div>
              </div>

              <div className="flex justify-end space-x-2">
                {bundle.status === 'suggested' && (
                  <button 
                    onClick={() => acceptBundle(bundle.id)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500"
                  >
                    Accept
                  </button>
                )}

                {bundle.status === 'scheduled' && (
                  <button 
                    onClick={() => deployBundle(bundle.id)}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500"
                  >
                    Deploy
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {bundles.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No task bundles yet
        </div>
      )}

      {/* Create bundle action */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setIsCreatingBundle(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
        >
          Create New Bundle
        </button>
      </div>
    </div>
  );
};
