# calculation_flow_diagram.js

**Purpose**: Data Processing

**Functions**: renderCalculationFlowDiagram, zoomed, dragstarted, dragged, dragended and 4 more

**Keywords**: options, function, rendercalculationflowdiagram, container, data, const, width

## Key Code Sections

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

- **Size**: 12.6 KB
- **Lines**: 432
- **Complexity**: 6
