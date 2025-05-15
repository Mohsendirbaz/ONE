/**
 * Probing Integration UI
 * 
 * This component provides a unified React-based interface for interacting with
 * all the functionality provided by the probing module, including:
 * - Financial entity visualizations
 * - Code entity analysis
 * - File associations
 * - Insights generation
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './integration_ui.css';

// Import the visualization components
import { VisualizationComponent, VisualizationSelector } from '../financial_entity_visualizations/visualization_component';

// Import the code analyzer components
// Note: In a real implementation, you would need to adjust the import path based on your bundling setup
import { CodeAnalyzerComponent, CodeAnalyzerSelector, CodeEditor } from '../code-entity-analyzer/integration/code_analyzer_component';

/**
 * ProbingIntegrationUI - A React component that integrates all probing functionality
 * 
 * @param {Object} props - Component props
 * @param {string} props.initialTab - The initial tab to display
 * @param {Object} props.config - Configuration options
 * @returns {JSX.Element} - The rendered component
 */
const ProbingIntegrationUI = ({ initialTab = 'visualizations', config = {} }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [visualizationType, setVisualizationType] = useState('');
  const [visualizationData, setVisualizationData] = useState({});
  const [analyzerType, setAnalyzerType] = useState('');
  const [codeToAnalyze, setCodeToAnalyze] = useState('');
  const [fileAssociationsData, setFileAssociationsData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch file associations data
        const fileAssociationsResponse = await fetch('/api/probing/file-associations/latest');
        if (fileAssociationsResponse.ok) {
          const fileAssociationsResult = await fileAssociationsResponse.json();
          setFileAssociationsData(fileAssociationsResult);
        }

        // Fetch sample data for visualizations
        const visualizationDataResponse = await fetch('/api/probing/visualization-data/sample');
        if (visualizationDataResponse.ok) {
          const visualizationDataResult = await visualizationDataResponse.json();
          setVisualizationData(visualizationDataResult);
        }

        // Fetch sample code for analysis
        const sampleCodeResponse = await fetch('/api/probing/code-analysis/sample-code');
        if (sampleCodeResponse.ok) {
          const sampleCodeResult = await sampleCodeResponse.json();
          setCodeToAnalyze(sampleCodeResult.code || '');
        }

      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle visualization type selection
  const handleVisualizationSelected = (type) => {
    setVisualizationType(type);
  };

  // Handle analyzer type selection
  const handleAnalyzerSelected = (type) => {
    setAnalyzerType(type);
  };

  // Handle code changes
  const handleCodeChange = (code) => {
    setCodeToAnalyze(code);
  };

  // Handle visualization rendered
  const handleVisualizationRendered = (result) => {
    console.log('Visualization rendered:', result);
  };

  // Handle analysis complete
  const handleAnalysisComplete = (result) => {
    console.log('Analysis complete:', result);
  };

  return (
    <div className="probing-integration-ui">
      <div className="probing-tabs">
        <div 
          className={`probing-tab ${activeTab === 'visualizations' ? 'active' : ''}`}
          onClick={() => handleTabChange('visualizations')}
        >
          Financial Visualizations
        </div>
        <div 
          className={`probing-tab ${activeTab === 'code-analysis' ? 'active' : ''}`}
          onClick={() => handleTabChange('code-analysis')}
        >
          Code Analysis
        </div>
        <div 
          className={`probing-tab ${activeTab === 'file-associations' ? 'active' : ''}`}
          onClick={() => handleTabChange('file-associations')}
        >
          File Associations
        </div>
        <div 
          className={`probing-tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => handleTabChange('insights')}
        >
          Insights
        </div>
      </div>

      <div className="probing-content">
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Visualizations Tab */}
        {activeTab === 'visualizations' && (
          <div className="visualizations-tab">
            <h2>Financial Entity Visualizations</h2>
            <div className="visualization-controls">
              <VisualizationSelector onVisualizationSelected={handleVisualizationSelected} />
            </div>
            <div className="visualization-display">
              {visualizationType && (
                <VisualizationComponent 
                  visualizationType={visualizationType}
                  data={visualizationData[visualizationType] || {}}
                  onVisualizationRendered={handleVisualizationRendered}
                />
              )}
            </div>
          </div>
        )}

        {/* Code Analysis Tab */}
        {activeTab === 'code-analysis' && (
          <div className="code-analysis-tab">
            <h2>Code Entity Analysis</h2>
            <div className="code-analysis-controls">
              <CodeAnalyzerSelector onAnalyzerSelected={handleAnalyzerSelected} />
            </div>
            <div className="code-editor-container">
              <h3>Code to Analyze</h3>
              <CodeEditor code={codeToAnalyze} onChange={handleCodeChange} />
            </div>
            <div className="code-analysis-display">
              {analyzerType && codeToAnalyze && (
                <CodeAnalyzerComponent 
                  analyzerType={analyzerType}
                  code={codeToAnalyze}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              )}
            </div>
          </div>
        )}

        {/* File Associations Tab */}
        {activeTab === 'file-associations' && (
          <div className="file-associations-tab">
            <h2>File Associations</h2>
            {fileAssociationsData ? (
              <div className="file-associations-display">
                <div className="file-associations-summary">
                  <h3>Summary</h3>
                  <p>Timestamp: {fileAssociationsData.timestamp}</p>
                  <p>Total Files: {fileAssociationsData.totalFiles}</p>
                  <p>Total Associations: {fileAssociationsData.totalAssociations}</p>
                </div>
                <div className="file-associations-details">
                  <h3>Details</h3>
                  <p>For detailed file associations, use the API or download the data.</p>
                  <button 
                    className="download-button"
                    onClick={() => window.open('/api/probing/file-associations/download', '_blank')}
                  >
                    Download File Associations Data
                  </button>
                </div>
              </div>
            ) : (
              <p>No file associations data available.</p>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="insights-tab">
            <h2>Insights Generator</h2>
            <div className="insights-controls">
              <button 
                className="generate-insights-button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const response = await fetch('/api/probing/insights/generate', {
                      method: 'POST'
                    });
                    if (response.ok) {
                      const result = await response.json();
                      setInsightsData(result);
                    } else {
                      throw new Error(`Failed to generate insights: ${response.statusText}`);
                    }
                  } catch (err) {
                    console.error('Error generating insights:', err);
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Generate Insights
              </button>
            </div>
            <div className="insights-display">
              {insightsData ? (
                <div className="insights-content">
                  <h3>Generated Insights</h3>
                  <div className="insights-summary">
                    <p>Timestamp: {insightsData.timestamp}</p>
                    <p>Total Insights: {insightsData.totalInsights}</p>
                  </div>
                  <div className="insights-details">
                    <h4>Key Findings</h4>
                    <ul className="insights-list">
                      {insightsData.insights && insightsData.insights.map((insight, index) => (
                        <li key={`insight-${index}`} className="insight-item">
                          <div className="insight-header">
                            <span className="insight-type">{insight.type}</span>
                            <span className="insight-confidence">{insight.confidence}% confidence</span>
                          </div>
                          <div className="insight-description">{insight.description}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>No insights generated yet. Click the "Generate Insights" button to create insights.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Styles would typically be imported from a CSS file or styled-components */}
    </div>
  );
};

ProbingIntegrationUI.propTypes = {
  initialTab: PropTypes.string,
  config: PropTypes.object
};

export default ProbingIntegrationUI;
