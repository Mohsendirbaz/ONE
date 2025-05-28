/**
 * InsightItem Component
 * 
 * This component renders a single insight item with its type, confidence, and description.
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * InsightItem - A React component for rendering a single insight
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - The type of insight
 * @param {number} props.confidence - The confidence level (0-100)
 * @param {string} props.description - The description of the insight
 * @returns {JSX.Element} - The rendered component
 */
const InsightItem = ({ type, confidence, description }) => {
  return (
    <li className="insight-item">
      <div className="insight-header">
        <span className="insight-type">{type}</span>
        <span className="insight-confidence">{confidence}% confidence</span>
      </div>
      <div className="insight-description">{description}</div>
    </li>
  );
};

InsightItem.propTypes = {
  type: PropTypes.string.isRequired,
  confidence: PropTypes.number.isRequired,
  description: PropTypes.string.isRequired
};

export default InsightItem;