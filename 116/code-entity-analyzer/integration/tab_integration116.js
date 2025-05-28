# tab_integration.js

**Purpose**: Config

**Description**: * Tab Integration
 * 
 * This module handles the integration of code entity analyzer visualizations
 * into the application's tab system, allowing users to view dif...

**Functions**: createTabIntegration

**Classes**: */, TabIntegration

**Dependencies**: ../visualizations/component_graph, ../visualizations/state_flow_diagram, ../visualizations/dependency_heatmap

**Keywords**: true, function, createtabintegration, tabsystem, options, const, defaultoptions

## Key Code Sections

### Function: createTabIntegration

```
function createTabIntegration(tabSystem, options = {}) {
  const defaultOptions = {
    tabPrefix: 'code-analyzer-',
    defaultTabTitle: 'Code Analysis',
    tabIcon: 'code',
    # ... mor

... (truncated to meet size target) ...
