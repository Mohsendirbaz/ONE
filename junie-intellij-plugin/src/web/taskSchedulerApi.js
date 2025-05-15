/**
 * Task Scheduler API Service
 * Handles all API calls for the Task Scheduler components
 */

// Base API URL for task scheduler endpoints
const API_BASE_URL = '/api/task-scheduler';

/**
 * Creates a new task via the backend API
 * @param {Object} taskData - Task data to be created
 * @returns {Promise<Object>} - Created task object
 */
export const createTask = async (taskData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create task');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * Creates a new task bundle via the backend API
 * @param {Object} bundleData - Bundle data to be created
 * @returns {Promise<Object>} - Created bundle object
 */
export const createBundle = async (bundleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bundles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bundleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create bundle');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating bundle:', error);
    throw error;
  }
};

/**
 * Deploys a task to be executed by the appropriate agent
 * @param {string} taskId - ID of the task to deploy
 * @returns {Promise<Object>} - Updated task object
 */
export const deployTask = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to deploy task');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deploying task:', error);
    throw error;
  }
};

/**
 * Deploys a bundle of tasks to be executed by the appropriate agents
 * @param {string} bundleId - ID of the bundle to deploy
 * @returns {Promise<Object>} - Updated bundle object
 */
export const deployBundle = async (bundleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bundles/${bundleId}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to deploy bundle');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deploying bundle:', error);
    throw error;
  }
};

/**
 * Fetches all tasks from the backend
 * @returns {Promise<Array>} - Array of task objects
 */
export const getTasks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch tasks');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

/**
 * Fetches all bundles from the backend
 * @returns {Promise<Array>} - Array of bundle objects
 */
export const getBundles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/bundles`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch bundles');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching bundles:', error);
    throw error;
  }
};

/**
 * Helper function to get the current project ID from IntelliJ
 * @returns {string} - Current project ID
 */
export const getCurrentProjectId = () => {
  // This would be implemented by the IntelliJ plugin to provide the current project ID
  // For now, we'll return a placeholder
  return window.intellijApi?.getProjectId() || 'default-project';
};

/**
 * Helper function to get the currently selected file paths from IntelliJ
 * @returns {Array<string>} - Array of selected file paths
 */
export const getSelectedFilePaths = () => {
  // This would be implemented by the IntelliJ plugin to provide the selected file paths
  // For now, we'll return an empty array
  return window.intellijApi?.getSelectedFilePaths() || [];
};

export default {
  createTask,
  createBundle,
  deployTask,
  deployBundle,
  getTasks,
  getBundles,
  getCurrentProjectId,
  getSelectedFilePaths
};