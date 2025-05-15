/**
 * Probing API Client
 * 
 * This module provides client-side access to the probing backend API.
 * It handles all communication between the React frontend and the backend services.
 */

import axios from 'axios';

// Base API URL - can be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/probing';

// Create an axios instance with consistent configuration
const probingApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Get the server status
 * @returns {Promise<Object>} Server status information
 */
export const getStatus = async () => {
  try {
    const response = await probingApiClient.get('/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching server status:', error);
    throw error;
  }
};

/**
 * Scan for changes in all monitored files
 * @returns {Promise<Object>} Information about detected changes
 */
export const scanForChanges = async () => {
  try {
    const response = await probingApiClient.post('/scan-changes');
    return response.data;
  } catch (error) {
    console.error('Error scanning for changes:', error);
    throw error;
  }
};

/**
 * Get integrated data from all sources
 * @returns {Promise<Object>} The integrated data
 */
export const getIntegratedData = async () => {
  try {
    const response = await probingApiClient.get('/integrated-data');
    return response.data;
  } catch (error) {
    console.error('Error fetching integrated data:', error);
    throw error;
  }
};

/**
 * Get the latest file associations data
 * @returns {Promise<Object>} The latest file associations data
 */
export const getLatestFileAssociations = async () => {
  try {
    const response = await probingApiClient.get('/file-associations/latest');
    return response.data;
  } catch (error) {
    console.error('Error fetching file associations:', error);
    throw error;
  }
};

/**
 * Get a download URL for file associations data
 * @returns {string} URL to download the file
 */
export const getFileAssociationsDownloadUrl = () => {
  return `${API_BASE_URL}/file-associations/download`;
};

/**
 * Get sample data for visualizations
 * @returns {Promise<Object>} Sample visualization data
 */
export const getVisualizationSampleData = async () => {
  try {
    const response = await probingApiClient.get('/visualization-data/sample');
    return response.data;
  } catch (error) {
    console.error('Error fetching visualization sample data:', error);
    throw error;
  }
};

/**
 * Get available visualization types
 * @returns {Promise<Array<string>>} List of available visualization types
 */
export const getAvailableVisualizations = async () => {
  try {
    const response = await probingApiClient.get('/visualizations');
    return response.data.available_types || [];
  } catch (error) {
    console.error('Error fetching available visualizations:', error);
    throw error;
  }
};

/**
 * Render a visualization
 * @param {string} visualizationType - Type of visualization to render
 * @param {Object} data - Data for the visualization
 * @param {Object} options - Options for the visualization
 * @returns {Promise<Object>} Visualization result
 */
export const renderVisualization = async (visualizationType, data, options = {}) => {
  try {
    const response = await probingApiClient.post('/visualization', {
      visualizationType,
      data,
      options
    });
    return response.data;
  } catch (error) {
    console.error('Error rendering visualization:', error);
    throw error;
  }
};

/**
 * Directly visualize data using connector
 * @param {Object} data - Data to visualize
 * @param {string} visualizationType - Type of visualization
 * @param {Object} options - Options for visualization
 * @returns {Promise<Object>} Visualization result
 */
export const visualizeDataDirect = async (data, visualizationType, options = {}) => {
  try {
    const response = await probingApiClient.post('/visualize-direct', {
      data,
      visualization_type: visualizationType,
      options
    });
    return response.data;
  } catch (error) {
    console.error('Error with direct visualization:', error);
    throw error;
  }
};

/**
 * Resize a visualization
 * @param {string} visualizationId - ID of the visualization to resize
 * @param {number} width - New width in pixels
 * @param {number} height - New height in pixels
 * @returns {Promise<Object>} Result of resize operation
 */
export const resizeVisualization = async (visualizationId, width, height) => {
  try {
    const response = await probingApiClient.post(`/visualization/${visualizationId}/resize`, {
      width,
      height
    });
    return response.data;
  } catch (error) {
    console.error('Error resizing visualization:', error);
    throw error;
  }
};

/**
 * Delete a visualization
 * @param {string} visualizationId - ID of the visualization to delete
 * @returns {Promise<Object>} Result of delete operation
 */
export const deleteVisualization = async (visualizationId) => {
  try {
    const response = await probingApiClient.delete(`/visualization/${visualizationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting visualization:', error);
    throw error;
  }
};

/**
 * Get available code analyzers
 * @returns {Promise<Array<string>>} List of available analyzer types
 */
export const getAvailableCodeAnalyzers = async () => {
  try {
    const response = await probingApiClient.get('/code-analysis/analyzers');
    return response.data.available_types || [];
  } catch (error) {
    console.error('Error fetching available analyzers:', error);
    throw error;
  }
};

/**
 * Get sample code for analysis
 * @returns {Promise<Object>} Sample code
 */
export const getSampleCode = async () => {
  try {
    const response = await probingApiClient.get('/code-analysis/sample-code');
    return response.data;
  } catch (error) {
    console.error('Error fetching sample code:', error);
    throw error;
  }
};

/**
 * Analyze code
 * @param {string} code - Code to analyze
 * @param {string} analyzerType - Type of analyzer to use
 * @param {Object} options - Options for analysis
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeCode = async (code, analyzerType, options = {}) => {
  try {
    const response = await probingApiClient.post('/code-analysis', {
      analyzerType,
      code,
      options
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing code:', error);
    throw error;
  }
};

/**
 * Directly analyze code using connector
 * @param {string} code - Code to analyze
 * @param {string} analyzerType - Type of analyzer
 * @param {Object} options - Options for analysis
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeCodeDirect = async (code, analyzerType, options = {}) => {
  try {
    const response = await probingApiClient.post('/analyze-direct', {
      code,
      analyzer_type: analyzerType,
      options
    });
    return response.data;
  } catch (error) {
    console.error('Error with direct code analysis:', error);
    throw error;
  }
};

/**
 * Generate insights
 * @param {Object} options - Options for insight generation
 * @returns {Promise<Object>} Generated insights
 */
export const generateInsights = async (options = {}) => {
  try {
    const response = await probingApiClient.post('/insights/generate', options);
    return response.data;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
};

/**
 * Generate integrated report
 * @param {string} formatType - Format for the report ('json' or 'html')
 * @returns {Promise<Object>} Information about the generated report
 */
export const generateReport = async (formatType = 'json') => {
  try {
    const response = await probingApiClient.post('/generate-report', {
      format_type: formatType
    });
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

/**
 * Get download URL for a report
 * @param {string} reportPath - Path to the report
 * @returns {string} URL to download the report
 */
export const getReportDownloadUrl = (reportPath) => {
  return `${API_BASE_URL}/download-report?path=${encodeURIComponent(reportPath)}`;
};

export default {
  getStatus,
  scanForChanges,
  getIntegratedData,
  getLatestFileAssociations,
  getFileAssociationsDownloadUrl,
  getVisualizationSampleData,
  getAvailableVisualizations,
  renderVisualization,
  visualizeDataDirect,
  resizeVisualization,
  deleteVisualization,
  getAvailableCodeAnalyzers,
  getSampleCode,
  analyzeCode,
  analyzeCodeDirect,
  generateInsights,
  generateReport,
  getReportDownloadUrl
};
