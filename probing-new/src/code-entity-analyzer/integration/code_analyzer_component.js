/**
 * Code Analyzer Component
 * 
 * This component provides a React-based interface for interacting with
 * the code entity analyzer provided by the probing module.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './code_analyzer_component.css';

/**
 * CodeAnalyzerComponent - A React component for analyzing and visualizing code entities
 * 
 * @param {Object} props - Component props
 * @param {string} props.analyzerType - The type of analyzer to use
 * @param {string} props.code - The code to analyze
 * @param {Object} props.options - Options for the analyzer
 * @param {Function} props.onAnalysisComplete - Callback when analysis is complete
 * @param {Function} props.onAnalysisError - Callback when an error occurs
 * @returns {JSX.Element} - The rendered component
 */
const CodeAnalyzerComponent = ({
  analyzerType,
  code,
  options = {},
  onAnalysisComplete,
  onAnalysisError
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const analyzeCode = async () => {
      if (!code || !analyzerType) return;

      try {
        setLoading(true);
        setError(null);

        // Call the API to analyze the code
        const response = await fetch('/api/probing/code-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            analyzerType,
            code,
            options
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to analyze code: ${response.statusText}`);
        }

        const result = await response.json();
        setAnalysisResult(result);

        // Call the callback
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        }
      } catch (err) {
        console.error('Error analyzing code:', err);
        setError(err.message);

        if (onAnalysisError) {
          onAnalysisError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    analyzeCode();
  }, [analyzerType, code, options, onAnalysisComplete, onAnalysisError]);

  return (
    <div className="code-analyzer-component">
      {loading && (
        <div className="analysis-loading">
          <div className="spinner"></div>
          <p>Analyzing code...</p>
        </div>
      )}

      {error && (
        <div className="analysis-error">
          <p>Error: {error}</p>
        </div>
      )}

      {analysisResult && !loading && !error && (
        <div 
          ref={containerRef} 
          className="analysis-result-container"
        >
          <div className="analysis-summary">
            <h3>Analysis Summary</h3>
            <p>Analyzer: {analyzerType}</p>
            <p>Entities found: {analysisResult.entities?.length || 0}</p>
            <p>Dependencies found: {analysisResult.dependencies?.length || 0}</p>
          </div>

          {analysisResult.entities && analysisResult.entities.length > 0 && (
            <div className="entities-section">
              <h4>Entities</h4>
              <ul className="entity-list">
                {analysisResult.entities.map((entity, index) => (
                  <li key={`entity-${index}`} className={`entity-item entity-type-${entity.type}`}>
                    <div className="entity-header">
                      <span className="entity-type">{entity.type}</span>
                      {entity.name && <span className="entity-name">{entity.name}</span>}
                      {entity.line && <span className="entity-line">Line: {entity.line}</span>}
                    </div>
                    {entity.properties && entity.properties.length > 0 && (
                      <ul className="entity-properties">
                        {entity.properties.map((prop, propIndex) => (
                          <li key={`prop-${propIndex}`}>{prop.name}: {prop.value}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysisResult.dependencies && analysisResult.dependencies.length > 0 && (
            <div className="dependencies-section">
              <h4>Dependencies</h4>
              <ul className="dependency-list">
                {analysisResult.dependencies.map((dep, index) => (
                  <li key={`dep-${index}`} className={`dependency-item dependency-type-${dep.type}`}>
                    <div className="dependency-header">
                      <span className="dependency-type">{dep.type}</span>
                      {dep.source && <span className="dependency-source">From: {dep.source}</span>}
                      {dep.imported && <span className="dependency-imported">Import: {dep.imported}</span>}
                      {dep.line && <span className="dependency-line">Line: {dep.line}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

CodeAnalyzerComponent.propTypes = {
  analyzerType: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  options: PropTypes.object,
  onAnalysisComplete: PropTypes.func,
  onAnalysisError: PropTypes.func
};

/**
 * CodeAnalyzerSelector - A component for selecting and configuring code analyzers
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onAnalyzerSelected - Callback when an analyzer is selected
 * @returns {JSX.Element} - The rendered component
 */
const CodeAnalyzerSelector = ({ onAnalyzerSelected }) => {
  const [availableAnalyzers, setAvailableAnalyzers] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAvailableAnalyzers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/probing/code-analyzers');

        if (!response.ok) {
          throw new Error(`Failed to fetch analyzers: ${response.statusText}`);
        }

        const result = await response.json();
        setAvailableAnalyzers(result.available_types || []);

        if (result.available_types && result.available_types.length > 0) {
          setSelectedType(result.available_types[0]);
        }
      } catch (err) {
        console.error('Error fetching analyzers:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableAnalyzers();
  }, []);

  const handleAnalyzerSelect = (e) => {
    const type = e.target.value;
    setSelectedType(type);

    if (onAnalyzerSelected) {
      onAnalyzerSelected(type);
    }
  };

  return (
    <div className="code-analyzer-selector">
      <h3>Select Code Analyzer</h3>

      {loading && <p>Loading available analyzers...</p>}

      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <div className="selector-controls">
          <select 
            value={selectedType} 
            onChange={handleAnalyzerSelect}
            disabled={availableAnalyzers.length === 0}
          >
            {availableAnalyzers.length === 0 && (
              <option value="">No analyzers available</option>
            )}

            {availableAnalyzers.map(type => (
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

CodeAnalyzerSelector.propTypes = {
  onAnalyzerSelected: PropTypes.func
};

/**
 * CodeEditor - A simple code editor component
 * 
 * @param {Object} props - Component props
 * @param {string} props.code - The code to edit
 * @param {Function} props.onChange - Callback when code changes
 * @returns {JSX.Element} - The rendered component
 */
const CodeEditor = ({ code, onChange }) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="code-editor">
      <textarea
        className="code-textarea"
        value={code}
        onChange={handleChange}
        placeholder="Enter code to analyze..."
        rows={15}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
    </div>
  );
};

CodeEditor.propTypes = {
  code: PropTypes.string,
  onChange: PropTypes.func
};

export { CodeAnalyzerComponent, CodeAnalyzerSelector, CodeEditor };
