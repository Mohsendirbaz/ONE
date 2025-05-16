/**
 * Enhanced Insights Generator Component
 * 
 * This component provides a React-based interface for generating and displaying
 * insights from code and financial data.
 * Enhanced to work with the new connector architecture.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import probingApiClient from '../api/probing-api-client';
import { InsightsControls, InsightsDisplay } from './components';

/**
 * InsightsComponent - A React component for generating and displaying insights
 * 
 * @param {Object} props - Component props
 * @param {Object} props.initialData - Initial insights data
 * @param {Object} props.options - Options for the component
 * @param {Function} props.onInsightsGenerated - Callback when insights are generated
 * @param {Function} props.directGenerateInsights - Direct function for generating insights
 * @returns {JSX.Element} - The rendered component
 */
const InsightsComponent = ({
  initialData,
  options = {},
  onInsightsGenerated,
  directGenerateInsights
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insightsData, setInsightsData] = useState(initialData || null);

  const generateInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use direct function if provided, otherwise use API client
      const result = directGenerateInsights 
        ? await directGenerateInsights(options)
        : await probingApiClient.generateInsights(options);

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
      <InsightsControls 
        loading={loading} 
        error={error} 
        onGenerate={generateInsights} 
      />

      {insightsData && !loading && !error && (
        <InsightsDisplay insightsData={insightsData} />
      )}
    </div>
  );
};

InsightsComponent.propTypes = {
  initialData: PropTypes.object,
  options: PropTypes.object,
  onInsightsGenerated: PropTypes.func,
  directGenerateInsights: PropTypes.func
};

export { InsightsComponent };
