/**
 * InsightsList Component
 * 
 * This component renders a list of insights extracted from various data sources.
 */

import React from 'react';
import PropTypes from 'prop-types';
import InsightItem from './InsightItem';

/**
 * InsightsList - A React component for rendering a list of insights
 * 
 * @param {Object} props - Component props
 * @param {Object} props.insightsData - The insights data to render
 * @returns {JSX.Element} - The rendered component
 */
const InsightsList = ({ insightsData }) => {
  // Check if we have insights in the traditional format
  if (insightsData.insights && Array.isArray(insightsData.insights)) {
    return (
      <ul className="insights-list">
        {insightsData.insights.map((insight, index) => (
          <InsightItem
            key={`insight-${index}`}
            type={insight.type}
            confidence={insight.confidence}
            description={insight.description}
          />
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
          <InsightItem
            key={insight.key}
            type={insight.type}
            confidence={insight.confidence}
            description={insight.description}
          />
        ))}
      </ul>
    );
  }
  
  // Fallback if no insights could be extracted
  return <p>No specific insights found in the data.</p>;
};

InsightsList.propTypes = {
  insightsData: PropTypes.object.isRequired
};

export default InsightsList;