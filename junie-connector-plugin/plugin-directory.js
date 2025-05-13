/**
 * Plugin Directory Access Module
 * 
 * This module provides functions to access plugin installation directories in IntelliJ IDEA
 * by communicating with the Junie Plugin Directory Access plugin via REST API.
 */

const http = require('http');
const https = require('https');
const url = require('url');

/**
 * Base URL for the REST API
 * This assumes the IntelliJ IDEA built-in REST API is running on port 63342
 */
const BASE_URL = 'http://localhost:63342/api/plugin-directory';

/**
 * Gets the standard plugins directory path
 * @returns {Promise<string>} - The path to the plugins directory
 */
async function getPluginsPath() {
  try {
    const response = await makeRequest('/');
    return response.pluginsPath;
  } catch (error) {
    console.error('Error getting plugins path:', error.message);
    throw error;
  }
}

/**
 * Gets the installation path of a plugin by its ID
 * @param {string} pluginId - The ID of the plugin
 * @returns {Promise<string|null>} - The path to the plugin directory, or null if not found
 */
async function getPluginPath(pluginId) {
  try {
    const response = await makeRequest(`/plugin/${encodeURIComponent(pluginId)}`);
    return response.pluginPath;
  } catch (error) {
    console.error(`Error getting path for plugin ${pluginId}:`, error.message);
    return null;
  }
}

/**
 * Gets the installation path of the Junie plugin
 * @returns {Promise<string|null>} - The path to the Junie plugin directory, or null if not found
 */
async function getJuniePluginPath() {
  try {
    const response = await makeRequest('/junie');
    return response.pluginPath;
  } catch (error) {
    console.error('Error getting Junie plugin path:', error.message);
    return null;
  }
}

/**
 * Gets the path to a specific plugin in the standard plugins directory
 * @param {string} directoryName - The name of the plugin directory
 * @returns {Promise<string>} - The path to the plugin directory
 */
async function getPluginPathByDirectoryName(directoryName) {
  try {
    const response = await makeRequest(`/directory/${encodeURIComponent(directoryName)}`);
    return response.pluginPath;
  } catch (error) {
    console.error(`Error getting path for plugin directory ${directoryName}:`, error.message);
    throw error;
  }
}

/**
 * Makes an HTTP request to the REST API
 * @param {string} path - The path to request
 * @returns {Promise<Object>} - The parsed JSON response
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const requestUrl = `${BASE_URL}${path}`;
    const parsedUrl = url.parse(requestUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (error) {
            reject(new Error(`Error parsing JSON response: ${error.message}`));
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });
    
    req.end();
  });
}

module.exports = {
  getPluginsPath,
  getPluginPath,
  getJuniePluginPath,
  getPluginPathByDirectoryName
};