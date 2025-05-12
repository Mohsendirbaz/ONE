# parameter_influence_graph.js

**Purpose**: Data Processing

**Functions**: renderParameterInfluenceGraph, processInfluenceData, calculateInfluenceMetrics, createHierarchicalLayout, stratifyNodes and 14 more

**Keywords**: options, true, import, from, export, function, renderparameterinfluencegraph

## Key Code Sections

### Imports

```
import * as d3 from 'd3';
```

### Function: processInfluenceData

```
function processInfluenceData(data) {
  const nodes = [];
  const links = [];

  // Extract nodes from parameters
    # ... more lines ...
```

### Function: calculateInfluenceMetrics

```
function calculateInfluenceMetrics(nodes, links) {
  // Calculate in-degree and out-degree for each node
  const inDegree = {};
  const outDegree = {};

    # ... more lines ...
```

### Function: createHierarchicalLayout

```
function createHierarchicalLayout(nodes, links) {
  // Group nodes into layers based on their relationship to financial metrics
  const layers = {
    metrics: [],    

... (truncated to meet size target) ...
