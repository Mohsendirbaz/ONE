/**
 * Probing Integration UI (Enhanced)
 * 
 * This component provides a unified React-based interface for interacting with
 * all the functionality provided by the probing module, including:
 * - Financial entity visualizations
 * - Code entity analysis
 * - File associations
 * - Insights generation
 * 
 * This enhanced version uses the new API client to connect with the backend connector.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './integration_ui.css';

// Import API client
import probingApiClient from './api/probing-api-client';

// Import the visualization components
import { VisualizationComponent, VisualizationSelector } from './financial_entity_visualizations/visualization_component';

// Import the code analyzer components
import { CodeAnalyzerComponent, CodeAnalyzerSelector, CodeEditor } from './code-entity-analyzer/integration/code_analyzer_component';

// Import the file associations component
import { FileAssociationsComponent } from './file_associations/file-associations-component';

// Import the insights component
import { InsightsComponent } from './insights_generator/insights-component';

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
  const [integratedData, setIntegratedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateTimer, setUpdateTimer] = useState(null);

  // Fetch initial data
  useEffect(() => {
    console.log('[DEBUG] ProbingIntegrationUI: Component mounted with initialTab:', initialTab);

    const fetchInitialData = async () => {
      console.log('[DEBUG] ProbingIntegrationUI: Fetching initial data');
      try {
        setLoading(true);
        setError(null);

        // Fetch all integrated data
        try {
          console.log('[DEBUG] ProbingIntegrationUI: Fetching integrated data');
          const integratedResult = await probingApiClient.getIntegratedData();
          console.log('[DEBUG] ProbingIntegrationUI: Received integrated data', {
            hasFileAssociations: !!integratedResult.file_associations,
            hasVisualizations: !!integratedResult.visualizations,
            hasInsights: !!integratedResult.insights
          });
          setIntegratedData(integratedResult);

          // Extract specific data from integrated result
          if (integratedResult.file_associations) {
            setFileAssociationsData(integratedResult.file_associations);
          }

          if (integratedResult.visualizations) {
            setVisualizationData(integratedResult.visualizations);
          }

          if (integratedResult.insights) {
            setInsightsData(integratedResult.insights);
          }
        } catch (err) {
          console.warn('Could not fetch integrated data, falling back to individual sources');

          // Fetch file associations data
          try {
            const fileAssociationsResult = await probingApiClient.getLatestFileAssociations();
            setFileAssociationsData(fileAssociationsResult);
          } catch (e) {
            console.warn('Could not fetch file associations:', e);
          }

          // Fetch sample data for visualizations
          try {
            const visualizationDataResult = await probingApiClient.getVisualizationSampleData();
            setVisualizationData(visualizationDataResult);
          } catch (e) {
            console.warn('Could not fetch visualization data:', e);
          }
        }

        // Fetch sample code for analysis
        try {
          const sampleCodeResult = await probingApiClient.getSampleCode();
          setCodeToAnalyze(sampleCodeResult.code || '');
        } catch (e) {
          console.warn('Could not fetch sample code:', e);
          // Set fallback sample code
          setCodeToAnalyze(`
function calculateRevenue(price, quantity) {
  return price * quantity;
}

// Calculate expenses
function calculateExpenses(fixedCosts, variableCosts, quantity) {
  return fixedCosts + (variableCosts * quantity);
}

// Calculate profit
function calculateProfit(revenue, expenses) {
  return revenue - expenses;
}

// Main financial calculation
function financialCalculation(price, quantity, fixedCosts, variableCosts) {
  const revenue = calculateRevenue(price, quantity);
  const expenses = calculateExpenses(fixedCosts, variableCosts, quantity);
  const profit = calculateProfit(revenue, expenses);

  return {
    revenue,
    expenses,
    profit,
    profitMargin: profit / revenue
  };
}
          `);
        }

      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Set up automatic refresh timer (every 30 seconds)
    const timer = setInterval(() => {
      scanForChanges();
    }, 30000);

    setUpdateTimer(timer);

    // Clean up timer on component unmount
    return () => {
      if (updateTimer) {
        clearInterval(updateTimer);
      }
    };
  }, []);

  // Scan for changes in files
  const scanForChanges = async () => {
    console.log('[DEBUG] ProbingIntegrationUI: Scanning for changes');
    try {
      const result = await probingApiClient.scanForChanges();
      console.log('[DEBUG] ProbingIntegrationUI: Scan result', { 
        changesDetected: result.changes_detected,
        changedFiles: result.changed_files?.length || 0
      });

      // If changes were detected, update our data
      if (result.changes_detected) {
        console.log('[DEBUG] ProbingIntegrationUI: Changes detected, updating data');
        updateIntegratedData();
      }
    } catch (err) {
      console.error('Error scanning for changes:', err);
      console.log('[DEBUG] ProbingIntegrationUI: Error scanning for changes', { error: err.message });
      // Don't set error state to avoid UI disruption
    }
  };

  // Update integrated data
  const updateIntegratedData = async () => {
    console.log('[DEBUG] ProbingIntegrationUI: Updating integrated data');
    try {
      const result = await probingApiClient.getIntegratedData();
      console.log('[DEBUG] ProbingIntegrationUI: Received updated integrated data', {
        hasFileAssociations: !!result.file_associations,
        hasVisualizations: !!result.visualizations,
        hasInsights: !!result.insights
      });
      setIntegratedData(result);

      // Extract specific data from integrated result
      if (result.file_associations) {
        setFileAssociationsData(result.file_associations);
      }

      if (result.visualizations) {
        setVisualizationData(result.visualizations);
      }

      if (result.insights) {
        setInsightsData(result.insights);
      }
    } catch (err) {
      console.error('Error updating integrated data:', err);
      // Don't set error state to avoid UI disruption
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    console.log('[DEBUG] ProbingIntegrationUI: Tab changed', { from: activeTab, to: tab });
    setActiveTab(tab);

    // Trigger a data refresh when changing tabs
    console.log('[DEBUG] ProbingIntegrationUI: Refreshing data after tab change');
    updateIntegratedData();
  };

  // Handle visualization type selection
  const handleVisualizationSelected = (type) => {
    console.log('[DEBUG] ProbingIntegrationUI: Visualization type selected', { type });
    setVisualizationType(type);
  };

  // Handle analyzer type selection
  const handleAnalyzerSelected = (type) => {
    console.log('[DEBUG] ProbingIntegrationUI: Analyzer type selected', { type });
    setAnalyzerType(type);
  };

  // Handle code changes
  const handleCodeChange = (code) => {
    console.log('[DEBUG] ProbingIntegrationUI: Code changed', { 
      codeLength: code.length,
      firstChars: code.substring(0, 20) + (code.length > 20 ? '...' : '')
    });
    setCodeToAnalyze(code);
  };

  // Handle visualization rendered
  const handleVisualizationRendered = (result) => {
    console.log('[DEBUG] ProbingIntegrationUI: Visualization rendered', {
      visualizationType,
      resultType: result?.type,
      success: !!result
    });
  };

  // Handle analysis complete
  const handleAnalysisComplete = (result) => {
    console.log('[DEBUG] ProbingIntegrationUI: Analysis complete', {
      analyzerType,
      entities: result?.entities?.length || 0,
      dependencies: result?.dependencies?.length || 0
    });

    // If analysis generated new insights, refresh our data
    console.log('[DEBUG] ProbingIntegrationUI: Refreshing data after analysis');
    updateIntegratedData();
  };

  // Enhanced version of the VisualizationComponent that uses our API client
  const EnhancedVisualizationComponent = (props) => {
    console.log('[DEBUG] EnhancedVisualizationComponent: Rendering', { 
      visualizationType: props.visualizationType,
      hasData: !!props.data
    });

    const directVisualize = async (data, options) => {
      console.log('[DEBUG] EnhancedVisualizationComponent: Calling directVisualize', { 
        visualizationType: props.visualizationType,
        dataKeys: Object.keys(data || {}),
        options
      });

      try {
        const result = await probingApiClient.visualizeDataDirect(
          data, 
          props.visualizationType, 
          options
        );
        console.log('[DEBUG] EnhancedVisualizationComponent: Visualization successful', { 
          resultKeys: Object.keys(result.result || {})
        });
        return result.result;
      } catch (error) {
        console.error('Visualization error:', error);
        console.log('[DEBUG] EnhancedVisualizationComponent: Visualization error', { error: error.message });
        throw error;
      }
    };

    return (
      <VisualizationComponent
        {...props}
        directVisualize={directVisualize}
      />
    );
  };

  // Enhanced version of the CodeAnalyzerComponent that uses our API client
  const EnhancedCodeAnalyzerComponent = (props) => {
    console.log('[DEBUG] EnhancedCodeAnalyzerComponent: Rendering', { 
      analyzerType: props.analyzerType,
      codeLength: props.code?.length || 0
    });

    const directAnalyze = async (code) => {
      console.log('[DEBUG] EnhancedCodeAnalyzerComponent: Calling directAnalyze', { 
        analyzerType: props.analyzerType,
        codeLength: code?.length || 0
      });

      try {
        const result = await probingApiClient.analyzeCodeDirect(
          code,
          props.analyzerType
        );
        console.log('[DEBUG] EnhancedCodeAnalyzerComponent: Analysis successful', { 
          resultKeys: Object.keys(result.result || {})
        });
        return result.result;
      } catch (error) {
        console.error('Analysis error:', error);
        console.log('[DEBUG] EnhancedCodeAnalyzerComponent: Analysis error', { error: error.message });
        throw error;
      }
    };

    return (
      <CodeAnalyzerComponent
        {...props}
        directAnalyze={directAnalyze}
      />
    );
  };

  // Enhanced version of the InsightsComponent that uses our API client
  const EnhancedInsightsComponent = (props) => {
    console.log('[DEBUG] EnhancedInsightsComponent: Rendering', { 
      hasInitialData: !!props.initialData
    });

    const directGenerateInsights = async (options) => {
      console.log('[DEBUG] EnhancedInsightsComponent: Calling directGenerateInsights', { 
        options
      });

      try {
        const result = await probingApiClient.generateInsights(options);
        console.log('[DEBUG] EnhancedInsightsComponent: Insights generation successful', { 
          resultKeys: Object.keys(result || {})
        });
        return result;
      } catch (error) {
        console.error('Insights generation error:', error);
        console.log('[DEBUG] EnhancedInsightsComponent: Insights generation error', { error: error.message });
        throw error;
      }
    };

    return (
      <InsightsComponent
        {...props}
        directGenerateInsights={directGenerateInsights}
      />
    );
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
        <div 
          className={`probing-tab ${activeTab === 'integrated' ? 'active' : ''}`}
          onClick={() => handleTabChange('integrated')}
        >
          Integrated View
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
            <button 
              className="retry-button"
              onClick={updateIntegratedData}
            >
              Retry
            </button>
          </div>
        )}

        {/* Visualizations Tab */}
        {activeTab === 'visualizations' && (
          <div className="visualizations-tab">
            <h2>Financial Entity Visualizations</h2>
            <div className="visualization-controls">
              <VisualizationSelector onVisualizationSelected={handleVisualizationSelected} />
              <button 
                className="refresh-button"
                onClick={updateIntegratedData}
              >
                Refresh Data
              </button>
            </div>
            <div className="visualization-display">
              {visualizationType && visualizationData && (
                <EnhancedVisualizationComponent 
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
              <button 
                className="analyze-button"
                onClick={() => {
                  console.log('[DEBUG] ProbingIntegrationUI: Analyze button clicked', {
                    analyzerType,
                    codeLength: codeToAnalyze?.length || 0
                  });

                  if (analyzerType && codeToAnalyze) {
                    console.log('[DEBUG] ProbingIntegrationUI: Starting direct code analysis');
                    probingApiClient.analyzeCodeDirect(codeToAnalyze, analyzerType)
                      .then(result => {
                        console.log('[DEBUG] ProbingIntegrationUI: Direct analysis completed successfully');
                        handleAnalysisComplete(result);
                      })
                      .catch(err => {
                        console.log('[DEBUG] ProbingIntegrationUI: Direct analysis failed', { error: err.message });
                        setError(err.message);
                      });
                  } else {
                    console.log('[DEBUG] ProbingIntegrationUI: Analysis skipped - missing analyzer type or code');
                  }
                }}
                disabled={!analyzerType || !codeToAnalyze}
              >
                Analyze Code
              </button>
            </div>
            <div className="code-editor-container">
              <h3>Code to Analyze</h3>
              <CodeEditor code={codeToAnalyze} onChange={handleCodeChange} />
            </div>
            <div className="code-analysis-display">
              {analyzerType && codeToAnalyze && (
                <EnhancedCodeAnalyzerComponent 
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
            <div className="file-associations-controls">
              <button 
                className="refresh-button"
                onClick={updateIntegratedData}
              >
                Refresh Data
              </button>
            </div>
            <FileAssociationsComponent 
              data={fileAssociationsData}
              onDataLoaded={(data) => setFileAssociationsData(data)}
            />
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="insights-tab">
            <h2>Insights Generator</h2>
            <EnhancedInsightsComponent 
              initialData={insightsData}
              onInsightsGenerated={(data) => {
                setInsightsData(data);
                // Update integrated data after generating new insights
                updateIntegratedData();
              }}
            />
          </div>
        )}

        {/* Integrated View Tab */}
        {activeTab === 'integrated' && (
          <div className="integrated-tab">
            <h2>Integrated Probing View</h2>
            <div className="integrated-controls">
              <button 
                className="refresh-button"
                onClick={updateIntegratedData}
              >
                Refresh Data
              </button>
              <button 
                className="export-button"
                onClick={async () => {
                  console.log('[DEBUG] ProbingIntegrationUI: Export report button clicked');
                  try {
                    console.log('[DEBUG] ProbingIntegrationUI: Generating HTML report');
                    const result = await probingApiClient.generateReport('html');
                    console.log('[DEBUG] ProbingIntegrationUI: Report generated successfully', { 
                      reportPath: result.report_path 
                    });

                    if (result.report_path) {
                      const downloadUrl = probingApiClient.getReportDownloadUrl(result.report_path);
                      console.log('[DEBUG] ProbingIntegrationUI: Opening report download URL', { downloadUrl });
                      window.open(downloadUrl, '_blank');
                    } else {
                      console.log('[DEBUG] ProbingIntegrationUI: No report path returned');
                    }
                  } catch (err) {
                    console.error('Error generating report:', err);
                    console.log('[DEBUG] ProbingIntegrationUI: Error generating report', { error: err.message });
                    setError(err.message);
                  }
                }}
              >
                Export Integrated Report
              </button>
            </div>
            <div className="integrated-display">
              {integratedData ? (
                <div className="integrated-content">
                  <div className="integrated-summary">
                    <h3>Summary of Integrated Data</h3>
                    <div className="summary-stats">
                      <div className="stat-item">
                        <span className="stat-label">File Associations:</span>
                        <span className="stat-value">
                          {integratedData.file_associations ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Financial Entities:</span>
                        <span className="stat-value">
                          {integratedData.financial_entity ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Code Entities:</span>
                        <span className="stat-value">
                          {integratedData.code_entity ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Visualizations:</span>
                        <span className="stat-value">
                          {integratedData.visualizations && 
                           Object.keys(integratedData.visualizations).length > 0 ? 
                           Object.keys(integratedData.visualizations).length : 'None'}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Insights:</span>
                        <span className="stat-value">
                          {integratedData.insights ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="integrated-visualization">
                    <h3>Integrated Visualization</h3>
                    {visualizationData && visualizationData.calculation_flow && (
                      <EnhancedVisualizationComponent 
                        visualizationType="calculation_flow"
                        data={visualizationData.calculation_flow}
                        onVisualizationRendered={handleVisualizationRendered}
                      />
                    )}
                  </div>

                  <div className="integrated-insights">
                    <h3>Key Integrated Insights</h3>
                    {insightsData ? (
                      <ul className="integrated-insights-list">
                        {/* Display the top 5 insights across all categories */}
                        {[
                          ...(insightsData.insights || []),
                          ...(insightsData.code_entity && insightsData.code_entity.code_entities ? 
                              insightsData.code_entity.code_entities.slice(0, 2) : []),
                          ...(insightsData.financial_entity && insightsData.financial_entity.financial_entities ? 
                              insightsData.financial_entity.financial_entities.slice(0, 2) : []),
                          ...(insightsData.file_associations && insightsData.file_associations.metrics ? 
                              insightsData.file_associations.metrics.slice(0, 2) : [])
                        ].slice(0, 5).map((insight, index) => (
                          <li key={`integrated-insight-${index}`} className="integrated-insight-item">
                            <div className="insight-header">
                              <span className="insight-type">
                                {insight.type || (insight.name ? `Metric: ${insight.name}` : 'Insight')}
                              </span>
                            </div>
                            <div className="insight-description">
                              {insight.description || 
                               (insight.name ? `${insight.name}: ${insight.value}` : 
                                `${insight.type || 'Entity'}: ${insight.name || 'Unknown'}`)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No insights available. Generate insights from the Insights tab.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p>No integrated data available. Click the "Refresh Data" button to load data.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ProbingIntegrationUI.propTypes = {
  initialTab: PropTypes.string,
  config: PropTypes.object
};

export default ProbingIntegrationUI;
