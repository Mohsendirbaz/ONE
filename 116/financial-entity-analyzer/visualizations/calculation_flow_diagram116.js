# calculation_flow_diagram.js

**Purpose**: Data Processing

**Functions**: renderCalculationFlowDiagram, zoomed, dragstarted, dragged, dragended and 4 more

**Keywords**: options, import, from, export, function, rendercalculationflowdiagram, container

## Key Code Sections

### Imports

```
import * as d3 from 'd3';
```

### Function: renderCalculationFlowDiagram

```
function renderCalculationFlowDiagram(container, data, options = {}) {
  const { 
    width = 900, 
    height = 600,
    nodeRadius = 8,
    # ... more lines ...
```

### Function: zoomed

```
function zoomed(event) {
    svg.selectAll("g").attr("transform", event.transform);
  }

  // Drag event handlers
    # ... more lines ...
```

## File Info

- **Size**: 12.7 KB
- **Lines**: 432
- **Complexity**: 6
