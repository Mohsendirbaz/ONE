# optimization_convergence_plot.js

**Purpose**: Data Processing

**Functions**: renderOptimizationConvergencePlot, createPathTooltip, createStepTooltip, processOptimizationData, createSampleOptimizationData

**Keywords**: true, options, function, renderoptimizationconvergenceplot, container, data, const

## Key Code Sections

### Function: renderOptimizationConvergencePlot

```
function renderOptimizationConvergencePlot(container, data, options = {}) {
  const {
    width = 900,
    height = 600,
    margin = { top: 50, right: 150, bottom: 70, left: 80 },
    # ... more lines ...
```

### Function: processOptimizationData

```
function processOptimizationData(data) {
  const optimizationPaths = [];
  const metrics = [];

  // Extract optimization paths
    # ... more lines ...
```

### Function: createSampleOptimizationData

```
function createSampleOptimizationData(numPaths = 3, stepsPerPath = 20) {
  const optimizationPaths = [];
  const metrics = [
    { name: 'NPV', targetValue: 0, description: 'Net Present Value' },
    { name: '

... (truncated to meet size target) ...
