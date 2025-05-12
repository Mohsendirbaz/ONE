# component_graph.js

**Purpose**: Data Processing

**Functions**: renderComponentGraph, zoomed, dragstarted, dragged, dragended and 9 more

**Dependencies**: : 

**Keywords**: options, import, from, export, function, rendercomponentgraph, container

## Key Code Sections

### Imports

```
import * as d3 from 'd3';
```

### Function: processGraphData

```
function processGraphData(data) {
  // If data is already in the correct format, return it
  if (data.nodes && data.links) {
    return data;
  }
    # ... more lines ...
```

### Function: getNodeRadius

```
function getNodeRadius(node) {
  // Base radius
  const baseRadius = 10;

  // Adjust based on importance (if available)
    # ... more lines ...
```

### Function: getNodeColor

```
function getNodeColor(node) {
  // Type-based coloring
  const typeColors = {
    'core': '#ff5722',       // Deep orange
    'ui': '#2196f3',         // Blue
    # ... more lines ...
```

## File Info

- **Size**: 18.4 KB
- **Lines**: 658
- **Complexity**: 6

## Additional Details


==================================================
End of file summary
==================================================
