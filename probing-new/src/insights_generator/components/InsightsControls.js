/**
 * InsightsControls Component
 * 
 * This component renders the controls for generating insights, including
 * the generate button and loading/error states.
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * InsightsControls - A React component for rendering insights generation controls
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Whether insights are currently being generated
 * @param {string} props.error - Error message, if any
 * @param {Function} props.onGenerate - Function to call when generate button is clicked
 * @returns {JSX.Element} - The rendered component
 */
const InsightsControls = ({ loading, error, onGenerate }) => {
  return (
    <>
      <div className="insights-controls">
        <button 
          className="generate-insights-button"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Insights'}
        </button>
      </div>
      
      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Generating insights...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button 
            className="retry-button"
            onClick={onGenerate}
          >
            Try Again
          </button>
        </div>
      )}
    </>
  );
};

InsightsControls.propTypes = {
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onGenerate: PropTypes.func.isRequired
};

export default InsightsControls;