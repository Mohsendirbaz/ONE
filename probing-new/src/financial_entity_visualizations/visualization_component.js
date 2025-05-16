/**
 * Visualization Component
 * 
 * This component provides a React-based interface for interacting with
 * the financial entity visualizations provided by the probing module.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './visualization_component.css';
import probingApiClient from '../api/probing-api-client';

/**
 * VisualizationComponent - A React component for rendering financial entity visualizations
 * 
 * @param {Object} props - Component props
 * @param {string} props.visualizationType - The type of visualization to render
 * @param {Object} props.data - The data for the visualization
 * @param {Object} props.options - Options for the visualization
 * @param {Function} props.onVisualizationRendered - Callback when visualization is rendered
 * @param {Function} props.onVisualizationError - Callback when an error occurs
 * @returns {JSX.Element} - The rendered component
 */
const VisualizationComponent = ({
  visualizationType,
  data,
  options = {},
  onVisualizationRendered,
  onVisualizationError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const visualizationRef = useRef(null);

  useEffect(() => {
    const renderVisualization = async () => {
      try {
        setLoading(true);
        setError(null);

        // Clear any existing visualization
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Call the API to render the visualization using the probing API client
        const result = await probingApiClient.renderVisualization(
          visualizationType,
          data,
          options
        );

        // Render the visualization in the container
        if (containerRef.current && result.html) {
          containerRef.current.innerHTML = result.html;

          // Execute any scripts that were returned
          if (result.scripts) {
            result.scripts.forEach(script => {
              const scriptElement = document.createElement('script');
              scriptElement.textContent = script;
              containerRef.current.appendChild(scriptElement);
            });
          }

          // Store the visualization reference
          visualizationRef.current = result.visualizationId;

          // Call the callback
          if (onVisualizationRendered) {
            onVisualizationRendered(result);
          }
        }
      } catch (err) {
        console.error('Error rendering visualization:', err);
        setError(err.message);

        if (onVisualizationError) {
          onVisualizationError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    renderVisualization();

    // Cleanup function
    return () => {
      if (visualizationRef.current) {
        // Clean up the visualization if needed
        probingApiClient.deleteVisualization(visualizationRef.current)
          .catch(err => {
            console.error('Error cleaning up visualization:', err);
          });
      }
    };
  }, [visualizationType, data, options, onVisualizationRendered, onVisualizationError]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (visualizationRef.current) {
        // Resize the visualization
        probingApiClient.resizeVisualization(
          visualizationRef.current,
          containerRef.current?.clientWidth,
          containerRef.current?.clientHeight
        ).catch(err => {
          console.error('Error resizing visualization:', err);
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="visualization-component">
      {loading && (
        <div className="visualization-loading">
          <div className="spinner"></div>
          <p>Loading visualization...</p>
        </div>
      )}

      {error && (
        <div className="visualization-error">
          <p>Error: {error}</p>
        </div>
      )}

      <div 
        ref={containerRef} 
        className="visualization-container"
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px',
          opacity: loading ? 0.5 : 1
        }}
      ></div>
    </div>
  );
};

VisualizationComponent.propTypes = {
  visualizationType: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  onVisualizationRendered: PropTypes.func,
  onVisualizationError: PropTypes.func
};

/**
 * VisualizationSelector - A component for selecting and configuring visualizations
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onVisualizationSelected - Callback when a visualization is selected
 * @returns {JSX.Element} - The rendered component
 */
const VisualizationSelector = ({ onVisualizationSelected }) => {
  const [availableVisualizations, setAvailableVisualizations] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAvailableVisualizations = async () => {
      try {
        setLoading(true);
        setError(null);

        const availableTypes = await probingApiClient.getAvailableVisualizations();
        setAvailableVisualizations(availableTypes);

        if (availableTypes && availableTypes.length > 0) {
          setSelectedType(availableTypes[0]);
        }
      } catch (err) {
        console.error('Error fetching visualizations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableVisualizations();
  }, []);

  const handleVisualizationSelect = (e) => {
    const type = e.target.value;
    setSelectedType(type);

    if (onVisualizationSelected) {
      onVisualizationSelected(type);
    }
  };

  return (
    <div className="visualization-selector">
      <h3>Select Visualization</h3>

      {loading && <p>Loading available visualizations...</p>}

      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <div className="selector-controls">
          <select 
            value={selectedType} 
            onChange={handleVisualizationSelect}
            disabled={availableVisualizations.length === 0}
          >
            {availableVisualizations.length === 0 && (
              <option value="">No visualizations available</option>
            )}

            {availableVisualizations.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

VisualizationSelector.propTypes = {
  onVisualizationSelected: PropTypes.func
};

export { VisualizationComponent, VisualizationSelector };
