# parameter_influence_graph.js

**Purpose**: Data Processing

**Functions**: renderParameterInfluenceGraph, processInfluenceData, calculateInfluenceMetrics, createHierarchicalLayout, stratifyNodes and 14 more

**Keywords**: options, true, function, renderparameterinfluencegraph, container, data, const

## Key Code Sections

### Function: renderParameterInfluenceGraph

```
function renderParameterInfluenceGraph(container, data, options = {}) {
  const {
    width = 900,
    height = 600,
    showLabels = true,
    # ... more lines ...
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

## File Info

- **Size**: 16.9 KB
- **Lines**: 584
- **Complexity**: 8
