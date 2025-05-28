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
import './insights_component.css';

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

  const renderInsightsList = () => {
    // Check if we have insights in the traditional format
    if (insightsData.insights && Array.isArray(insightsData.insights)) {
      return (
          <ul className="insights-list">
            {insightsData.insights.map((insight, index) => (
                <li key={`insight-${index}`} className="insight-item">
                  <div className="insight-header">
                    <span className="insight-type">{insight.type}</span>
                    <span className="insight-confidence">{insight.confidence}% confidence</span>
                  </div>
                  <div className="insight-description">{insight.description}</div>
                </li>
            ))}
          </ul>
      );
    }

    // Otherwise, try to extract insights from the enhanced structure
    const allInsights = [];

    // Add code entity insights
    if (insightsData.code_entity && insightsData.code_entity.code_entities) {
      insightsData.code_entity.code_entities.forEach((entity, index) => {
        allInsights.push({
          key: `code-entity-${index}`,
          type: `Code Entity: ${entity.type || 'Unknown'}`,
          confidence: 100,
          description: `Found ${entity.type || 'entity'} "${entity.name || 'unnamed'}"${entity.line ? ` at line ${entity.line}` : ''}`
        });
      });
    }

    // Add financial entity insights
    if (insightsData.financial_entity && insightsData.financial_entity.financial_entities) {
      insightsData.financial_entity.financial_entities.forEach((entity, index) => {
        allInsights.push({
          key: `financial-entity-${index}`,
          type: `Financial Entity: ${entity.type || 'Unknown'}`,
          confidence: 100,
          description: `Found ${entity.type || 'entity'} "${entity.name || 'unnamed'}"${entity.value ? ` with value ${entity.value}` : ''}`
        });
      });
    }

    // Add file association metrics as insights
    if (insightsData.file_associations && insightsData.file_associations.metrics) {
      insightsData.file_associations.metrics.forEach((metric, index) => {
        allInsights.push({
          key: `file-metric-${index}`,
          type: `File Metric: ${metric.name || 'Unknown'}`,
          confidence: 100,
          description: metric.description || `${metric.name || 'Metric'}: ${metric.value}`
        });
      });
    }

    // Add relationships as insights
    if (insightsData.code_entity && insightsData.code_entity.relationships) {
      insightsData.code_entity.relationships.forEach((relationship, index) => {
        allInsights.push({
          key: `code-relationship-${index}`,
          type: `Code Relationship: ${relationship.type || 'Unknown'}`,
          confidence: 90,
          description: relationship.source && relationship.imported
              ? `Dependency from ${relationship.source} to ${relationship.imported}`
              : `Code relationship at line ${relationship.line || 'unknown'}`
        });
      });
    }

    if (insightsData.financial_entity && insightsData.financial_entity.relationships) {
      insightsData.financial_entity.relationships.forEach((relationship, index) => {
        allInsights.push({
          key: `financial-relationship-${index}`,
          type: `Financial Relationship: ${relationship.type || 'Unknown'}`,
          confidence: 95,
          description: relationship.from && relationship.to
              ? `Dependency from ${relationship.from} to ${relationship.to} with strength ${relationship.strength || 1}`
              : `Financial relationship`
        });
      });
    }

    // If we found insights, render them
    if (allInsights.length > 0) {
      return (
          <ul className="insights-list">
            {allInsights.map(insight => (
                <li key={insight.key} className="insight-item">
                  <div className="insight-header">
                    <span className="insight-type">{insight.type}</span>
                    <span className="insight-confidence">{insight.confidence}% confidence</span>
                  </div>
                  <div className="insight-description">{insight.description}</div>
                </li>
            ))}
          </ul>
      );
    }

    // Fallback if no insights could be extracted
    return <p>No specific insights found in the data.</p>;
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
              <button
                  className="retry-button"
                  onClick={generateInsights}
              >
                Try Again
              </button>
            </div>
        )}

        {insightsData && !loading && !error && (
            <div className="insights-display">
              <div className="insights-content">
                <h3>Generated Insights</h3>
                <div className="insights-summary">
                  <p>Timestamp: {insightsData.timestamp || new Date().toISOString()}</p>
                  <p>Total Insights: {
                      insightsData.totalInsights ||
                      (insightsData.insights ? insightsData.insights.length :
                              ((insightsData.code_entity?.code_entities?.length || 0) +
                                  (insightsData.financial_entity?.financial_entities?.length || 0) +
                                  (insightsData.file_associations?.metrics?.length || 0))
                      )
                  }</p>
                </div>
                <div className="insights-details">
                  <h4>Key Findings</h4>
                  {renderInsightsList()}
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
  onInsightsGenerated: PropTypes.func,
  directGenerateInsights: PropTypes.func
};

export { InsightsComponent };
