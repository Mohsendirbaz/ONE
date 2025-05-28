# sensitivity_heat_map.js

**Purpose**: Data Processing

**Functions**: renderSensitivityHeatMap, createTooltipContent, processSensitivityData, calculateSensitivityMatrix, metricChange

**Keywords**: options, true, import, from, export, function, rendersensitivityheatmap

## Key Code Sections

### Imports

```
import * as d3 from 'd3';
```

### Function: processSensitivityData

```
function processSensitivityData(data) {
  const parameters = [];
  const metrics = [];
  const sensitivityMatrix = [];

    # ... more lines ...
```

### Function: renderSensitivityHeatMap

```
function renderSensitivityHeatMap(container, data, options = {}) {
  const {
    width = 900,
    height = 600,
    margin = { top: 50, 

... (truncated to meet size target) ...
