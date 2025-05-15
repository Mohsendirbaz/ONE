/**
 * File Associations Component
 * 
 * This component provides a React-based interface for interacting with
 * the file associations functionality provided by the probing module.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

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
        const response = await fetch('/api/probing/file-associations/latest');

        if (!response.ok) {
          throw new Error(`Failed to fetch file associations: ${response.statusText}`);
        }

        const result = await response.json();
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
        </div>
      )}
      
      {associationsData && !loading && !error && (
        <div className="file-associations-display">
          <div className="file-associations-summary">
            <h3>Summary</h3>
            <p>Timestamp: {associationsData.timestamp}</p>
            <p>Total Files: {associationsData.totalFiles}</p>
            <p>Total Associations: {associationsData.totalAssociations}</p>
          </div>
          <div className="file-associations-details">
            <h3>Details</h3>
            <p>For detailed file associations, use the API or download the data.</p>
            <button 
              className="download-button"
              onClick={() => window.open('/api/probing/file-associations/download', '_blank')}
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