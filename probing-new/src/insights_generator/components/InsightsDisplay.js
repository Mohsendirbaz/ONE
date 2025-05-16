/**
 * InsightsDisplay Component
 * 
 * This component renders the display of insights, including the summary and list of insights.
 */

import React from 'react';
import PropTypes from 'prop-types';
import InsightsSummary from './InsightsSummary';
import InsightsList from './InsightsList';

/**
 * InsightsDisplay - A React component for rendering the display of insights
 * 
 * @param {Object} props - Component props
 * @param {Object} props.insightsData - The insights data to display
 * @returns {JSX.Element} - The rendered component
 */
const InsightsDisplay = ({ insightsData }) => {
  if (!insightsData) {
    return null;
  }

  return (
    <div className="insights-display">
      <div className="insights-content">
        <h3>Generated Insights</h3>
        <InsightsSummary insightsData={insightsData} />
        <div className="insights-details">
          <h4>Key Findings</h4>
          <InsightsList insightsData={insightsData} />
        </div>
      </div>
    </div>
  );
};

InsightsDisplay.propTypes = {
  insightsData: PropTypes.object
};

export default InsightsDisplay;