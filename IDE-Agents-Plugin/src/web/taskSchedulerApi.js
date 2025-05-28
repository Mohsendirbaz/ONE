/**
 * Task Scheduler API Service
 * Handles all API calls for the Task Scheduler components
 */

// Base API URL for task scheduler endpoints
const API_BASE_URL = '/api/task-scheduler';

console.log('[DEBUG] Task Scheduler API initialized with base URL:', API_BASE_URL);

/**
 * Creates a new task via the backend API
 * @param {Object} taskData - Task data to be created
 * @returns {Promise<Object>} - Created task object
 */
export const createTask = async (taskData) => {
  console.log('[DEBUG] Creating task with data:', taskData);
  try {
    console.log('[DEBUG] Sending POST request to:', `${API_BASE_URL}/tasks`);
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    console.log('[DEBUG] Received response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('[DEBUG] Error response data:', errorData);
      throw new Error(errorData.message || 'Failed to create task');
    }

    const responseData = await response.json();
    console.log('[DEBUG] Task created successfully:', responseData);
    return responseData;
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
  console.log('[DEBUG] Creating bundle with data:', bundleData);
  try {
    console.log('[DEBUG] Sending POST request to:', `${API_BASE_URL}/bundles`);
    const response = await fetch(`${API_BASE_URL}/bundles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bundleData),
    });
    console.log('[DEBUG] Received response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('[DEBUG] Error response data:', errorData);
      throw new Error(errorData.message || 'Failed to create bundle');
    }

    const responseData = await response.json();
    console.log('[DEBUG] Bundle created successfully:', responseData);
    return responseData;
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
  console.log('[DEBUG] Deploying task with ID:', taskId);
  try {
    console.log('[DEBUG] Sending POST request to:', `${API_BASE_URL}/tasks/${taskId}/deploy`);
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('[DEBUG] Received response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('[DEBUG] Error response data:', errorData);
      throw new Error(errorData.message || 'Failed to deploy task');
    }

    const responseData = await response.json();
    console.log('[DEBUG] Task deployed successfully:', responseData);
    return responseData;
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
  console.log('[DEBUG] Deploying bundle with ID:', bundleId);
  try {
    console.log('[DEBUG] Sending POST request to:', `${API_BASE_URL}/bundles/${bundleId}/deploy`);
    const response = await fetch(`${API_BASE_URL}/bundles/${bundleId}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('[DEBUG] Received response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('[DEBUG] Error response data:', errorData);
      throw new Error(errorData.message || 'Failed to deploy bundle');
    }

    const responseData = await response.json();
    console.log('[DEBUG] Bundle deployed successfully:', responseData);
    return responseData;
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
  console.log('[DEBUG] Fetching all tasks');
  try {
    console.log('[DEBUG] Sending GET request to:', `${API_BASE_URL}/tasks`);
    const response = await fetch(`${API_BASE_URL}/tasks`);
    console.log('[DEBUG] Received response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('[DEBUG] Error response data:', errorData);
      throw new Error(errorData.message || 'Failed to fetch tasks');
    }

    const responseData = await response.json();
    console.log('[DEBUG] Tasks fetched successfully, count:', responseData.length);
    return responseData;
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
  console.log('[DEBUG] Fetching all bundles');
  try {
    console.log('[DEBUG] Sending GET request to:', `${API_BASE_URL}/bundles`);
    const response = await fetch(`${API_BASE_URL}/bundles`);
    console.log('[DEBUG] Received response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('[DEBUG] Error response data:', errorData);
      throw new Error(errorData.message || 'Failed to fetch bundles');
    }

    const responseData = await response.json();
    console.log('[DEBUG] Bundles fetched successfully, count:', responseData.length);
    return responseData;
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
  console.log('[DEBUG] Getting current project ID');
  // This would be implemented by the IntelliJ plugin to provide the current project ID
  // For now, we'll return a placeholder
  const projectId = window.intellijApi?.getProjectId() || 'default-project';
  console.log('[DEBUG] Current project ID:', projectId);
  return projectId;
};

/**
 * Helper function to get the currently selected file paths from IntelliJ
 * @returns {Array<string>} - Array of selected file paths
 */
export const getSelectedFilePaths = () => {
  console.log('[DEBUG] Getting selected file paths');
  // This would be implemented by the IntelliJ plugin to provide the selected file paths
  // For now, we'll return an empty array
  const filePaths = window.intellijApi?.getSelectedFilePaths() || [];
  console.log('[DEBUG] Selected file paths:', filePaths);
  return filePaths;
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
