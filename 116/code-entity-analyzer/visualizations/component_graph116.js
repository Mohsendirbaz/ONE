# component_graph.js

**Purpose**: Data Processing

**Description**: * Component Graph Visualization
 * 
 * This module creates an interactive visualization of the component hierarchy
 * and relationships in a React-based financial modeling application.

**Functions**: createComponentGraph, createChildren

**Classes**: */, ComponentGraphVisualization

**Dependencies**: d3

**Keywords**: true, const, require, function, createcomponentgraph, data, containerid

## Key Code Sections

### Function: createComponentGraph

```
function createComponentGraph(data, containerId, options = {}) {
  const defaultOptions = {
    width: 900,
    height: 600,
    nodeRadius: 10,
    # ... more lines ...
```

### Function: createChildren

```
const createChildren = (nodeId) => {
      const childLinks = this.data.links.filter(link => 
        (link.source.id || link.source) === nodeId
      );
      
    # ... more lines ...
```

## File Info

- **Size**: 20.1 KB
- **Lines**: 681
- **Complexity**: 6

## Additional Details

### Line Statistics

- Average line length: 28.3 characters
- Longest line: 94 characters
- Number of blank lines: 78


======================================================
End of file summary
======================================================
