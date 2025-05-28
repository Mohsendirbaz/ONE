# sensitivity_heat_map.js

**Purpose**: Data Processing

**Functions**: renderSensitivityHeatMap, createTooltipContent, processSensitivityData, calculateSensitivityMatrix, metricChange

**Keywords**: options, true, function, rendersensitivityheatmap, container, data, const

## Key Code Sections

### Function: renderSensitivityHeatMap

```
function renderSensitivityHeatMap(container, data, options = {}) {
  const {
    width = 900,
    height = 600,
    margin = { top: 50, right: 50, bottom: 100, left: 150 },
    # ... more lines ...
```

### Function: processSensitivityData

```
function processSensitivityData(data) {
  const parameters = [];
  const metrics = [];
  const sensitivityMatrix = [];

    # 

... (truncated to meet size target) ...
