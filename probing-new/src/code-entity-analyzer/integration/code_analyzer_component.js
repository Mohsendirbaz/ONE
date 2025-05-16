/**
 * Code Analyzer Component
 * 
 * This component provides a React-based interface for interacting with
 * the code entity analyzer provided by the probing module.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './code_analyzer_component.css';
import probingApiClient from '../../api/probing-api-client';

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
      if (!code || !analyzerType) {
        console.log('[DEBUG] CodeAnalyzerComponent: Missing code or analyzerType, skipping analysis');
        return;
      }

      console.log('[DEBUG] CodeAnalyzerComponent: Starting code analysis', { analyzerType, codeLength: code.length, options });

      try {
        setLoading(true);
        setError(null);

        // Call the API to analyze the code using the probing API client
        const result = await probingApiClient.analyzeCode(
          code,
          analyzerType,
          options
        );
        console.log('[DEBUG] CodeAnalyzerComponent: Analysis completed successfully', { 
          entities: result.entities?.length || 0,
          dependencies: result.dependencies?.length || 0
        });

        setAnalysisResult(result);

        // Call the callback
        if (onAnalysisComplete) {
          console.log('[DEBUG] CodeAnalyzerComponent: Calling onAnalysisComplete callback');
          onAnalysisComplete(result);
        }
      } catch (err) {
        console.error('Error analyzing code:', err);
        console.log('[DEBUG] CodeAnalyzerComponent: Analysis failed', { error: err.message });
        setError(err.message);

        if (onAnalysisError) {
          console.log('[DEBUG] CodeAnalyzerComponent: Calling onAnalysisError callback');
          onAnalysisError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    console.log('[DEBUG] CodeAnalyzerComponent: useEffect triggered', { analyzerType, hasCode: !!code });
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
      console.log('[DEBUG] CodeAnalyzerSelector: Fetching available analyzers');
      try {
        setLoading(true);
        setError(null);

        const availableTypes = await probingApiClient.getAvailableCodeAnalyzers();
        console.log('[DEBUG] CodeAnalyzerSelector: Received available analyzers', availableTypes);

        setAvailableAnalyzers(availableTypes);

        if (availableTypes && availableTypes.length > 0) {
          console.log('[DEBUG] CodeAnalyzerSelector: Setting default analyzer type', availableTypes[0]);
          setSelectedType(availableTypes[0]);
        } else {
          console.log('[DEBUG] CodeAnalyzerSelector: No analyzer types available');
        }
      } catch (err) {
        console.error('Error fetching analyzers:', err);
        console.log('[DEBUG] CodeAnalyzerSelector: Error fetching analyzers', { error: err.message });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    console.log('[DEBUG] CodeAnalyzerSelector: Component mounted');
    fetchAvailableAnalyzers();
  }, []);

  const handleAnalyzerSelect = (e) => {
    const type = e.target.value;
    console.log('[DEBUG] CodeAnalyzerSelector: Analyzer selected by user', { type });
    setSelectedType(type);

    if (onAnalyzerSelected) {
      console.log('[DEBUG] CodeAnalyzerSelector: Calling onAnalyzerSelected callback');
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
  console.log('[DEBUG] CodeEditor: Component rendered', { codeLength: code?.length || 0 });

  const handleChange = (e) => {
    const newCode = e.target.value;
    console.log('[DEBUG] CodeEditor: Code changed by user', { 
      codeLength: newCode.length,
      firstChars: newCode.substring(0, 20) + (newCode.length > 20 ? '...' : '')
    });

    if (onChange) {
      console.log('[DEBUG] CodeEditor: Calling onChange callback');
      onChange(newCode);
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
