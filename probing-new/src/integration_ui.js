/**
 * Probing Integration UI (DEPRECATED)
 * 
 * This file is deprecated and has been replaced by integration-ui.js.
 * Please use integration-ui.js instead.
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

// Import API client
import probingApiClient from './api/probing-api-client';

// Import the visualization components
import { VisualizationComponent, VisualizationSelector } from './financial_entity_visualizations/visualization_component';

// Import the code analyzer components
import { CodeAnalyzerComponent, CodeAnalyzerSelector, CodeEditor } from './code-entity-analyzer/integration/code_analyzer_component';

// Import the file associations component
import { FileAssociationsComponent } from './file_associations/file_associations_component';

// Import the insights component
import { InsightsComponent } from './insights_generator/insights_component';

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
            <InsightsComponent 
              initialData={insightsData}
              onInsightsGenerated={(data) => setInsightsData(data)}
            />
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
