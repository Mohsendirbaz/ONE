/**
 * InsightsSummary Component
 * 
 * This component renders a summary of insights, including timestamp and total count.
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * InsightsSummary - A React component for rendering a summary of insights
 * 
 * @param {Object} props - Component props
 * @param {Object} props.insightsData - The insights data to summarize
 * @returns {JSX.Element} - The rendered component
 */
const InsightsSummary = ({ insightsData }) => {
  // Calculate total insights
  const totalInsights = insightsData.totalInsights || 
    (insightsData.insights ? insightsData.insights.length : 
      ((insightsData.code_entity?.code_entities?.length || 0) + 
       (insightsData.financial_entity?.financial_entities?.length || 0) + 
       (insightsData.file_associations?.metrics?.length || 0))
    );

  return (
    <div className="insights-summary">
      <p>Timestamp: {insightsData.timestamp || new Date().toISOString()}</p>
      <p>Total Insights: {totalInsights}</p>
    </div>
  );
};

InsightsSummary.propTypes = {
  insightsData: PropTypes.object.isRequired
};

export default InsightsSummary;