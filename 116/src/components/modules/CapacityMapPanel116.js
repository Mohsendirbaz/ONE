# CapacityMapPanel.js

**Purpose**: Config

**Functions**: CapacityMapPanel, calculateUsageMetrics, weightedAverage, handleCapacityChange, handleWeightChange and 3 more

**Keywords**: import, from, typography, const, react, usestate, useeffect

## Key Code Sections

### Imports

```
import React, { useState, useEffect } from 'react';
import { 
import { 
```

### Function: CapacityMapPanel

```
const CapacityMapPanel = ({ 
  currentState, 
  onCapacityConfigChange,
  onClose 
}) => {
    # ... more lines ...
```

### Function: calculateUsageMetrics

```
const calculateUsageMetrics = (currentState, capacityConfig) => {
    // Extract used values from current state
    const { 
      usedParameters = 50,
      scalingGroupsPerParameter = {},
    # ... more lines ...
```

### Function: weightedAverage

```
const weightedAverage = (values, weights) => {
    const sum = values.reduce((acc, val, idx) => acc + val * weights[idx], 0);
    const weightSum = weights.reduce((acc, w) => acc + w, 0);
    return sum / weightSum;
  };
    # ... more lines ...
```

## File Info

- **Size**: 22.4 KB
- **Lines**: 658
- **Complexity**: 18

## Additional Details

### Line Statistics

- Average line length: 32.8 characters
- Longest line: 163 characters
- Number of blank lines: 49


=======================================================
End of file summary
=======================================================
