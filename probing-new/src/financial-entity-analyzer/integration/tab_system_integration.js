import React, { useState, useEffect } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { CalculationFlowAnalyzer } from '../core/calculation_flow_analyzer';
import { ParameterDependencyTracker } from '../core/parameter_dependency_tracker';
import { SensitivityModelAnalyzer } from '../core/sensitivity_model_analyzer';
import { OptimizationPathAnalyzer } from '../core/optimization_path_analyzer';
import { FinancialConstantsAnalyzer } from '../core/financial_constants_analyzer';
import { renderCalculationFlowDiagram } from '../visualizations/calculation_flow_diagram';
import { renderParameterInfluenceGraph } from '../visualizations/parameter_influence_graph';
import { renderSensitivityHeatMap } from '../visualizations/sensitivity_heat_map';
import { renderOptimizationConvergencePlot, createSampleOptimizationData } from '../visualizations/optimization_convergence_plot';
import { generateFinancialInsights } from '../insights/financial_optimization_insights';

/**
 * Financial Entity Analysis Tab Component that integrates with the existing tab system
 */
const FinancialEntityAnalysisTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('calculationFlow');
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [fileContent, setFileContent] = useState({});
  const [error, setError] = useState(null);

  // Fetch file content on component mount or version change
  useEffect(() => {
    fetchFileContent();
  }, [currentVersion]);

  // Fetch file content for analysis
  const fetchFileContent = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Fetch relevant Python files for analysis
      const pythonFiles = await fetchPythonFiles(currentVersion);

      // Analyze the files
      const analysisResults = await analyzeFiles(pythonFiles);

      // Update state with analysis results
      setAnalysisData(analysisResults);
      setFileContent(pythonFiles);

      // Generate insights
      const generatedInsights = generateFinancialInsights(analysisResults);
      setInsights(generatedInsights);

    } catch (error) {
      console.error('Error analyzing files:', error);
      setError(`Error analyzing files: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetch Python files for analysis
  const fetchPythonFiles = async (version) => {
    // This would typically fetch files from a server
    // For now, we'll simulate this with a mock implementation
    
    try {
      // Example files to fetch - in a real implementation, this would be an API call
      const filesToFetch = [
        `financial_model_${version}.py`,
        `constants_${version}.py`,
        `optimization_${version}.py`
      ];
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock file contents
      return {
        [`financial_model_${version}.py`]: getMockFinancialModelCode(version),
        [`constants_${version}.py`]: getMockConstantsCode(version),
        [`optimization_${version}.py`]: getMockOptimizationCode(version)
      };
    } catch (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }
  };

  // Analyze files
  const analyzeFiles = async (files) => {
    // Create analyzers
    const flowAnalyzer = new CalculationFlowAnalyzer();
    const dependencyTracker = new ParameterDependencyTracker();
    const sensitivityAnalyzer = new SensitivityModelAnalyzer();
    const optimizationAnalyzer = new OptimizationPathAnalyzer();
    const constantsAnalyzer = new FinancialConstantsAnalyzer();

    // Analysis results
    const results = {
      calculationFlows: {},
      parameterDependencies: {},
      sensitivityModels: {},
      optimizationPaths: {},
      financialConstants: {}
    };

    // Analyze each file
    for (const [filePath, content] of Object.entries(files)) {
      const language = filePath.endsWith('.py') ? 'python' : 'javascript';
      
      // Analyze calculation flows
      results.calculationFlows[filePath] = flowAnalyzer.analyzeCalculationFlow(content, filePath);

      // Analyze parameter dependencies
      results.parameterDependencies[filePath] = dependencyTracker.analyzeParameterDependencies(content, language);

      // Analyze sensitivity models
      results.sensitivityModels[filePath] = sensitivityAnalyzer.analyzeSensitivityModels(content, language);

      // Analyze optimization paths
      results.optimizationPaths[filePath] = optimizationAnalyzer.analyzeOptimizationPaths(content, filePath);

      // Analyze financial constants
      results.financialConstants[filePath] = constantsAnalyzer.analyzeFinancialConstants(content, language);
    }

    // Combine results across files
    const combinedResults = combineAnalysisResults(results);

    return combinedResults;
  };

  // Combine analysis results across files
  const combineAnalysisResults = (results) => {
    // Combine calculation flows
    const calculationBlocks = {};
    const iterativeProcesses = [];
    const financialMetrics = [];
    
    Object.values(results.calculationFlows).forEach(flow => {
      // Combine calculation blocks
      Object.entries(flow.calculationBlocks).forEach(([blockType, blocks]) => {
        if (!calculationBlocks[blockType]) {
          calculationBlocks[blockType] = [];
        }
        calculationBlocks[blockType].push(...blocks);
      });
      
      // Combine iterative processes
      if (flow.iterativeProcesses) {
        iterativeProcesses.push(...flow.iterativeProcesses);
      }
      
      // Combine financial metrics
      if (flow.financialMetrics) {
        financialMetrics.push(...flow.financialMetrics);
      }
    });
    
    // Combine parameter dependencies
    const parameters = [];
    const dependencies = [];
    
    Object.values(results.parameterDependencies).forEach(deps => {
      // Combine parameters
      if (deps.parameters) {
        parameters.push(...deps.parameters);
      }
      
      // Combine dependencies
      if (deps.dependencies) {
        dependencies.push(...deps.dependencies);
      }
    });
    
    // Combine sensitivity models
    const sensitivityParameters = [];
    const variationMethods = {};
    
    Object.values(results.sensitivityModels).forEach(model => {
      // Combine sensitivity parameters
      if (model.sensitivityParameters) {
        sensitivityParameters.push(...model.sensitivityParameters);
      }
      
      // Combine variation methods
      if (model.variationMethods) {
        Object.entries(model.variationMethods).forEach(([method, instances]) => {
          if (!variationMethods[method]) {
            variationMethods[method] = [];
          }
          variationMethods[method].push(...instances);
        });
      }
    });
    
    // Combine optimization paths
    const optimizationLoops = [];
    const convergencePaths = {};
    
    Object.values(results.optimizationPaths).forEach(path => {
      // Combine optimization loops
      if (path.optimizationLoops) {
        optimizationLoops.push(...path.optimizationLoops);
      }
      
      // Combine convergence paths
      if (path.convergencePaths) {
        Object.entries(path.convergencePaths).forEach(([id, convergence]) => {
          convergencePaths[id] = convergence;
        });
      }
    });
    
    // Combine financial constants
    const constants = [];
    const constantCategories = {
      rates: [],
      taxes: [],
      timeframes: [],
      thresholds: [],
      other: []
    };
    
    Object.values(results.financialConstants).forEach(consts => {
      // Combine constants
      if (consts.constants) {
        constants.push(...consts.constants);
      }
      
      // Combine constant categories
      if (consts.categories) {
        Object.entries(consts.categories).forEach(([category, items]) => {
          if (constantCategories[category]) {
            constantCategories[category].push(...items);
          }
        });
      }
    });
    
    // Create sample data for visualizations
    const sampleOptimizationData = createSampleOptimizationData();
    
    // Return combined results
    return {
      calculationFlow: {
        calculationBlocks,
        iterativeProcesses,
        financialMetrics
      },
      parameterDependencies: {
        parameters,
        dependencies
      },
      sensitivityModel: {
        parameters: sensitivityParameters,
        variationMethods
      },
      optimizationPaths: {
        optimizationLoops,
        convergencePaths,
        sampleData: sampleOptimizationData
      },
      financialConstants: {
        constants,
        categories: constantCategories
      }
    };
  };

  // Render the flow diagram when data is available
  useEffect(() => {
    if (analysisData && !isAnalyzing && activeSubTab === 'calculationFlow') {
      const container = document.getElementById('calculation-flow-container');
      if (container) {
        renderCalculationFlowDiagram(container, analysisData.calculationFlow, {
          onNodeClick: handleNodeClick
        });
      }
    }
  }, [analysisData, isAnalyzing, activeSubTab]);

  // Render the parameter influence graph when data is available
  useEffect(() => {
    if (analysisData && !isAnalyzing && activeSubTab === 'parameterInfluence') {
      const container = document.getElementById('parameter-influence-container');
      if (container) {
        renderParameterInfluenceGraph(container, analysisData.parameterDependencies, {
          onNodeClick: handleNodeClick
        });
      }
    }
  }, [analysisData, isAnalyzing, activeSubTab]);

  // Render the sensitivity heat map when data is available
  useEffect(() => {
    if (analysisData && !isAnalyzing && activeSubTab === 'sensitivityAnalysis') {
      const container = document.getElementById('sensitivity-container');
      if (container) {
        // Create sample sensitivity data
        const sensitivityData = {
          parameters: analysisData.parameterDependencies.parameters.map(p => ({
            name: Array.isArray(p) ? p[0] : p.name || p,
            type: Array.isArray(p) ? p[1]?.type : p.type
          })),
          metrics: analysisData.calculationFlow.financialMetrics.map(m => ({
            name: m.name || m,
            description: m.description
          }))
        };
        
        renderSensitivityHeatMap(container, sensitivityData, {
          onCellClick: handleSensitivityCellClick
        });
      }
    }
  }, [analysisData, isAnalyzing, activeSubTab]);

  // Render the optimization convergence plot when data is available
  useEffect(() => {
    if (analysisData && !isAnalyzing && activeSubTab === 'optimizationPaths') {
      const container = document.getElementById('optimization-container');
      if (container) {
        renderOptimizationConvergencePlot(container, analysisData.optimizationPaths.sampleData, {
          onPointClick: handleOptimizationPointClick
        });
      }
    }
  }, [analysisData, isAnalyzing, activeSubTab]);

  // Handle node click in visualizations
  const handleNodeClick = (entity) => {
    setSelectedEntity(entity);
  };

  // Handle sensitivity cell click
  const handleSensitivityCellClick = (cell) => {
    setSelectedEntity({
      name: `${cell.parameter} → ${cell.metric}`,
      type: 'sensitivity',
      sensitivity: cell.sensitivity,
      description: cell.description
    });
  };

  // Handle optimization point click
  const handleOptimizationPointClick = (point) => {
    setSelectedEntity({
      name: `Iteration ${point.index}`,
      type: 'optimization_point',
      metricValue: point.metricValue,
      parameterValue: point.parameterValue,
      delta: point.delta
    });
  };

  // Handle version change
  const handleVersionChange = (event) => {
    setCurrentVersion(parseInt(event.target.value, 10));
  };

  // Get mock financial model code
  const getMockFinancialModelCode = (version) => {
    return `
# Financial Model v${version}
import numpy as np
from constants_${version} import *

def calculate_revenue(units_sold, price_per_unit):
    return units_sold * price_per_unit

def calculate_costs(units_sold, fixed_costs, variable_cost_per_unit):
    return fixed_costs + (units_sold * variable_cost_per_unit)

def calculate_depreciation(initial_investment, salvage_value, useful_life_years):
    return (initial_investment - salvage_value) / useful_life_years

def calculate_taxes(profit, tax_rate):
    return profit * tax_rate

def calculate_npv(cash_flows, discount_rate):
    npv = 0
    for i, cf in enumerate(cash_flows):
        npv += cf / ((1 + discount_rate) ** i)
    return npv

def calculate_irr(cash_flows, initial_investment):
    # Simplified IRR calculation
    total_return = sum(cash_flows) - initial_investment
    years = len(cash_flows)
    return (total_return / initial_investment) ** (1 / years) - 1

def find_optimal_price(initial_price, target_npv, tolerance=0.001):
    price = initial_price
    npv = -999  # Placeholder
    
    while abs(npv - target_npv) > tolerance:
        # Calculate NPV with current price
        revenue = calculate_revenue(UNITS_SOLD, price)
        costs = calculate_costs(UNITS_SOLD, FIXED_COSTS, VARIABLE_COST_PER_UNIT)
        profit = revenue - costs - DEPRECIATION
        taxes = calculate_taxes(profit, TAX_RATE)
        net_profit = profit - taxes
        
        cash_flows = [net_profit + DEPRECIATION for _ in range(PROJECT_LIFE_YEARS)]
        npv = calculate_npv(cash_flows, DISCOUNT_RATE)
        
        # Adjust price based on NPV comparison
        if npv < target_npv:
            price *= 1.02  # Increase price by 2%
        else:
            price *= 0.99  # Decrease price by 1%
    
    return price
`;
  };

  // Get mock constants code
  const getMockConstantsCode = (version) => {
    return `
# Financial Constants v${version}

# Project parameters
PROJECT_LIFE_YEARS = 10
INITIAL_INVESTMENT = 1000000
SALVAGE_VALUE = 100000

# Financial rates
DISCOUNT_RATE = 0.08
TAX_RATE = 0.25

# Operational parameters
UNITS_SOLD = 50000
PRICE_PER_UNIT = 20
FIXED_COSTS = 200000
VARIABLE_COST_PER_UNIT = 10

# Calculated constants
DEPRECIATION = (INITIAL_INVESTMENT - SALVAGE_VALUE) / PROJECT_LIFE_YEARS
`;
  };

  // Get mock optimization code
  const getMockOptimizationCode = (version) => {
    return `
# Optimization Module v${version}
import numpy as np
from financial_model_${version} import *

def sensitivity_analysis(parameter_name, base_value, variation_percentage=0.1):
    """
    Perform sensitivity analysis on a parameter
    """
    results = []
    variations = np.linspace(base_value * (1 - variation_percentage), 
                            base_value * (1 + variation_percentage), 
                            5)
    
    for value in variations:
        # Create a copy of the base parameters
        params = {
            'units_sold': UNITS_SOLD,
            'price_per_unit': PRICE_PER_UNIT,
            'fixed_costs': FIXED_COSTS,
            'variable_cost_per_unit': VARIABLE_COST_PER_UNIT,
            'initial_investment': INITIAL_INVESTMENT,
            'salvage_value': SALVAGE_VALUE,
            'useful_life_years': PROJECT_LIFE_YEARS,
            'discount_rate': DISCOUNT_RATE,
            'tax_rate': TAX_RATE
        }
        
        # Update the parameter being varied
        params[parameter_name] = value
        
        # Calculate financial metrics
        revenue = calculate_revenue(params['units_sold'], params['price_per_unit'])
        costs = calculate_costs(params['units_sold'], params['fixed_costs'], 
                               params['variable_cost_per_unit'])
        depreciation = calculate_depreciation(params['initial_investment'], 
                                             params['salvage_value'], 
                                             params['useful_life_years'])
        profit = revenue - costs - depreciation
        taxes = calculate_taxes(profit, params['tax_rate'])
        net_profit = profit - taxes
        
        cash_flows = [net_profit + depreciation for _ in range(params['useful_life_years'])]
        npv = calculate_npv(cash_flows, params['discount_rate'])
        irr = calculate_irr(cash_flows, params['initial_investment'])
        
        results.append({
            'parameter_value': value,
            'npv': npv,
            'irr': irr,
            'profit': profit
        })
    
    return results

def optimize_multiple_parameters(target_npv, max_iterations=100):
    """
    Optimize multiple parameters to achieve a target NPV
    """
    # Starting values
    price = PRICE_PER_UNIT
    units = UNITS_SOLD
    
    # Optimization loop
    for i in range(max_iterations):
        # Calculate NPV with current parameters
        revenue = calculate_revenue(units, price)
        costs = calculate_costs(units, FIXED_COSTS, VARIABLE_COST_PER_UNIT)
        profit = revenue - costs - DEPRECIATION
        taxes = calculate_taxes(profit, TAX_RATE)
        net_profit = profit - taxes
        
        cash_flows = [net_profit + DEPRECIATION for _ in range(PROJECT_LIFE_YEARS)]
        npv = calculate_npv(cash_flows, DISCOUNT_RATE)
        
        # Check if we've reached the target
        if abs(npv - target_npv) < 0.01 * target_npv:  # Within 1% of target
            break
        
        # Adjust parameters based on NPV comparison
        if npv < target_npv:
            # Need to increase NPV
            if i % 2 == 0:  # Alternate between adjusting price and units
                price *= 1.05  # Increase price by 5%
            else:
                units *= 1.03  # Increase units by 3%
        else:
            # Need to decrease NPV
            if i % 2 == 0:
                price *= 0.97  # Decrease price by 3%
            else:
                units *= 0.98  # Decrease units by 2%
    
    return {
        'optimal_price': price,
        'optimal_units': units,
        'iterations': i + 1,
        'final_npv': npv
    }
`;
  };

  return (
    <div className="financial-entity-analysis">
      <h2>Financial Model Analysis</h2>

      <div className="analysis-controls">
        <div className="version-selector">
          <label htmlFor="version-input">Version:</label>
          <input
            id="version-input"
            type="number"
            value={currentVersion}
            onChange={handleVersionChange}
            min="1"
          />
        </div>

        <button 
          className="analyze-button" 
          onClick={fetchFileContent}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Model'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {isAnalyzing ? (
        <div className="analysis-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing financial model...</p>
        </div>
      ) : (
        <Tabs 
          selectedIndex={
            activeSubTab === 'calculationFlow' ? 0 : 
            activeSubTab === 'parameterInfluence' ? 1 : 
            activeSubTab === 'sensitivityAnalysis' ? 2 : 
            activeSubTab === 'optimizationPaths' ? 3 : 
            activeSubTab === 'insights' ? 4 : 0
          }
          onSelect={(index) => 
            setActiveSubTab(
              index === 0 ? 'calculationFlow' : 
              index === 1 ? 'parameterInfluence' : 
              index === 2 ? 'sensitivityAnalysis' : 
              index === 3 ? 'optimizationPaths' : 
              'insights'
            )
          }
        >
          <TabList className="sub-tab-buttons">
            <Tab className="sub-tab-button">Calculation Flow</Tab>
            <Tab className="sub-tab-button">Parameter Influence</Tab>
            <Tab className="sub-tab-button">Sensitivity Analysis</Tab>
            <Tab className="sub-tab-button">Optimization Paths</Tab>
            <Tab className="sub-tab-button">Model Insights</Tab>
          </TabList>

          <TabPanel>
            <div className="visualization-container">
              <div id="calculation-flow-container" className="flow-container"></div>

              {selectedEntity && (
                <div className="entity-details">
                  <h3>{selectedEntity.name}</h3>
                  <div className="entity-info">
                    <div className="info-item">
                      <span className="info-label">Type:</span>
                      <span className="info-value">{selectedEntity.type}</span>
                    </div>
                    {selectedEntity.formula && (
                      <div className="info-item">
                        <span className="info-label">Formula:</span>
                        <span className="info-value formula">{selectedEntity.formula}</span>
                      </div>
                    )}
                    {selectedEntity.description && (
                      <div className="info-item">
                        <span className="info-label">Description:</span>
                        <span className="info-value">{selectedEntity.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel>
            <div className="visualization-container">
              <div id="parameter-influence-container" className="influence-container"></div>

              {selectedEntity && (
                <div className="entity-details parameter-details">
                  <h3>{selectedEntity.name}</h3>
                  <div className="parameter-info">
                    <div className="info-item">
                      <span className="info-label">Type:</span>
                      <span className="info-value">{selectedEntity.type}</span>
                    </div>
                    {selectedEntity.impact !== undefined && (
                      <div className="info-item">
                        <span className="info-label">Impact Score:</span>
                        <span className="info-value">{selectedEntity.impact.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedEntity.inDegree !== undefined && (
                      <div className="info-item">
                        <span className="info-label">Incoming Dependencies:</span>
                        <span className="info-value">{selectedEntity.inDegree}</span>
                      </div>
                    )}
                    {selectedEntity.outDegree !== undefined && (
                      <div className="info-item">
                        <span className="info-label">Outgoing Dependencies:</span>
                        <span className="info-value">{selectedEntity.outDegree}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel>
            <div className="visualization-container">
              <div id="sensitivity-container" className="sensitivity-container"></div>

              {selectedEntity && selectedEntity.type === 'sensitivity' && (
                <div className="entity-details sensitivity-details">
                  <h3>{selectedEntity.name}</h3>
                  <div className="sensitivity-info">
                    <div className="info-item">
                      <span className="info-label">Sensitivity Value:</span>
                      <span className="info-value">{selectedEntity.sensitivity.toFixed(4)}</span>
                    </div>
                    {selectedEntity.description && (
                      <div className="info-item">
                        <span className="info-label">Description:</span>
                        <span className="info-value">{selectedEntity.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel>
            <div className="visualization-container">
              <div id="optimization-container" className="optimization-container"></div>

              {selectedEntity && selectedEntity.type === 'optimization_point' && (
                <div className="entity-details optimization-details">
                  <h3>{selectedEntity.name}</h3>
                  <div className="optimization-info">
                    <div className="info-item">
                      <span className="info-label">Metric Value:</span>
                      <span className="info-value">{selectedEntity.metricValue.toFixed(4)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Parameter Value:</span>
                      <span className="info-value">{selectedEntity.parameterValue.toFixed(4)}</span>
                    </div>
                    {selectedEntity.delta !== undefined && (
                      <div className="info-item">
                        <span className="info-label">Change:</span>
                        <span className="info-value">
                          {selectedEntity.delta > 0 ? '+' : ''}
                          {selectedEntity.delta.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel>
            <div className="insights-recommendations">
              <h3>Financial Model Insights</h3>
              {insights ? (
                <div className="insights-container">
                  {insights.keyInsights && insights.keyInsights.length > 0 && (
                    <div className="insight-section">
                      <h4>Key Insights</h4>
                      <ul className="insight-list">
                        {insights.keyInsights.map((insight, index) => (
                          <li key={index} className={`insight-item ${insight.importance}`}>
                            <div className="insight-title">{insight.title}</div>
                            <div className="insight-description">{insight.description}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insights.optimizationOpportunities && insights.optimizationOpportunities.length > 0 && (
                    <div className="insight-section">
                      <h4>Optimization Opportunities</h4>
                      <ul className="insight-list">
                        {insights.optimizationOpportunities.map((opportunity, index) => (
                          <li key={index} className={`insight-item ${opportunity.potential}`}>
                            <div className="insight-title">{opportunity.title}</div>
                            <div className="insight-description">{opportunity.description}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insights.sensitivityRecommendations && insights.sensitivityRecommendations.length > 0 && (
                    <div className="insight-section">
                      <h4>Sensitivity Analysis Recommendations</h4>
                      <ul className="insight-list">
                        {insights.sensitivityRecommendations.map((recommendation, index) => (
                          <li key={index} className="insight-item">
                            <div className="insight-title">{recommendation.title}</div>
                            <div className="insight-description">{recommendation.description}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insights.modelStructureInsights && insights.modelStructureInsights.length > 0 && (
                    <div className="insight-section">
                      <h4>Model Structure Insights</h4>
                      <ul className="insight-list">
                        {insights.modelStructureInsights.map((insight, index) => (
                          <li key={index} className="insight-item">
                            <div className="insight-title">{insight.title}</div>
                            <div className="insight-description">{insight.description}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p>No insights available. Run analysis first.</p>
              )}
            </div>
          </TabPanel>
        </Tabs>
      )}
    </div>
  );
};