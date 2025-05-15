/**
 * Visualization Component
 * 
 * This component provides a React-based interface for interacting with
 * the financial entity visualizations provided by the probing module.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

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

        // Call the API to render the visualization
        const response = await fetch('/api/probing/visualization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            visualizationType,
            data,
            options
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to render visualization: ${response.statusText}`);
        }

        const result = await response.json();

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
        fetch(`/api/probing/visualization/${visualizationRef.current}`, {
          method: 'DELETE'
        }).catch(err => {
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
        fetch(`/api/probing/visualization/${visualizationRef.current}/resize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            width: containerRef.current?.clientWidth,
            height: containerRef.current?.clientHeight
          })
        }).catch(err => {
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

        const response = await fetch('/api/probing/visualizations');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch visualizations: ${response.statusText}`);
        }

        const result = await response.json();
        setAvailableVisualizations(result.available_types || []);
        
        if (result.available_types && result.available_types.length > 0) {
          setSelectedType(result.available_types[0]);
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