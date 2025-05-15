/**
 * Enhanced File Associations Component
 * 
 * This component provides a React-based interface for interacting with
 * the file associations functionality provided by the probing module.
 * Enhanced to work with the new connector architecture.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import probingApiClient from '../api/probingApiClient';

/**
 * FileAssociationsComponent - A React component for displaying file associations
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - The file associations data
 * @param {Object} props.options - Options for the component
 * @param {Function} props.onDataLoaded - Callback when data is loaded
 * @returns {JSX.Element} - The rendered component
 */
const FileAssociationsComponent = ({
  data,
  options = {},
  onDataLoaded
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [associationsData, setAssociationsData] = useState(data || null);

  useEffect(() => {
    const fetchData = async () => {
      if (data) {
        setAssociationsData(data);
        if (onDataLoaded) {
          onDataLoaded(data);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Call the API to fetch file associations data
        const result = await probingApiClient.getLatestFileAssociations();
        setAssociationsData(result);

        // Call the callback
        if (onDataLoaded) {
          onDataLoaded(result);
        }
      } catch (err) {
        console.error('Error fetching file associations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [data, onDataLoaded]);

  const calculateTotalFiles = () => {
    if (!associationsData) return 'Unknown';
    
    if (associationsData.totalFiles) return associationsData.totalFiles;
    
    if (associationsData.file_associations) {
      return Object.keys(associationsData.file_associations).length;
    }
    
    return 'Unknown';
  };
  
  const calculateTotalAssociations = () => {
    if (!associationsData) return 'Unknown';
    
    if (associationsData.totalAssociations) return associationsData.totalAssociations;
    
    if (associationsData.file_associations) {
      return Object.values(associationsData.file_associations)
        .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    }
    
    return 'Unknown';
  };

  return (
    <div className="file-associations-component">
      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading file associations...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button 
            className="retry-button" 
            onClick={() => {
              probingApiClient.getLatestFileAssociations()
                .then(result => {
                  setAssociationsData(result);
                  if (onDataLoaded) {
                    onDataLoaded(result);
                  }
                })
                .catch(err => setError(err.message));
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {associationsData && !loading && !error && (
        <div className="file-associations-display">
          <div className="file-associations-summary">
            <h3>Summary</h3>
            <p>Timestamp: {associationsData.timestamp || new Date().toISOString()}</p>
            <p>Total Files: {calculateTotalFiles()}</p>
            <p>Total Associations: {calculateTotalAssociations()}</p>
          </div>
          
          <div className="file-associations-visualization">
            <h3>Visualization</h3>
            <p>This visualization shows the connections between files based on their associations.</p>
            <div className="visualization-placeholder" style={{
              minHeight: '200px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              borderRadius: '4px',
              border: '1px dashed #ccc'
            }}>
              <p>
                File association visualization will appear here when the backend integration is complete.
              </p>
            </div>
          </div>
          
          <div className="file-associations-details">
            <h3>Details</h3>
            <p>For detailed file associations, use the API or download the data.</p>
            <button 
              className="download-button"
              onClick={() => window.open(probingApiClient.getFileAssociationsDownloadUrl(), '_blank')}
            >
              Download File Associations Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

FileAssociationsComponent.propTypes = {
  data: PropTypes.object,
  options: PropTypes.object,
  onDataLoaded: PropTypes.func
};

export { FileAssociationsComponent };