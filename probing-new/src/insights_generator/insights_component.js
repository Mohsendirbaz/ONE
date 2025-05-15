/**
 * Insights Generator Component
 * 
 * This component provides a React-based interface for generating and displaying
 * insights from code and financial data.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * InsightsComponent - A React component for generating and displaying insights
 * 
 * @param {Object} props - Component props
 * @param {Object} props.initialData - Initial insights data
 * @param {Object} props.options - Options for the component
 * @param {Function} props.onInsightsGenerated - Callback when insights are generated
 * @returns {JSX.Element} - The rendered component
 */
const InsightsComponent = ({
  initialData,
  options = {},
  onInsightsGenerated
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insightsData, setInsightsData] = useState(initialData || null);

  const generateInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the API to generate insights
      const response = await fetch('/api/probing/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error(`Failed to generate insights: ${response.statusText}`);
      }

      const result = await response.json();
      setInsightsData(result);

      // Call the callback
      if (onInsightsGenerated) {
        onInsightsGenerated(result);
      }
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="insights-component">
      <div className="insights-controls">
        <button 
          className="generate-insights-button"
          onClick={generateInsights}
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
        </div>
      )}
      
      {insightsData && !loading && !error && (
        <div className="insights-display">
          <div className="insights-content">
            <h3>Generated Insights</h3>
            <div className="insights-summary">
              <p>Timestamp: {insightsData.timestamp}</p>
              <p>Total Insights: {insightsData.totalInsights}</p>
            </div>
            <div className="insights-details">
              <h4>Key Findings</h4>
              <ul className="insights-list">
                {insightsData.insights && insightsData.insights.map((insight, index) => (
                  <li key={`insight-${index}`} className="insight-item">
                    <div className="insight-header">
                      <span className="insight-type">{insight.type}</span>
                      <span className="insight-confidence">{insight.confidence}% confidence</span>
                    </div>
                    <div className="insight-description">{insight.description}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

InsightsComponent.propTypes = {
  initialData: PropTypes.object,
  options: PropTypes.object,
  onInsightsGenerated: PropTypes.func
};

export { InsightsComponent };