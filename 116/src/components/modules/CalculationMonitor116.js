# CalculationMonitor.js

**Purpose**: Data Processing

**Functions**: to, CalculationMonitor, getStatusDisplay, renderParameterUpdates, renderZoneUpdates

**Dependencies**: ../../styles/HomePage.CSS/HCSS.css

**Keywords**: import, react, usestate, useeffect, useref, from, const

## Key Code Sections

### Imports

```
import React, { useState, useEffect, useRef } from 'react';
import '../../styles/HomePage.CSS/HCSS.css';
```

### Function: CalculationMonitor

```
const CalculationMonitor = ({
                              selectedVersions,
                              updatePrice,
                              isActive,
                              currentVersion,
    # ... more lines ...
```

### Function: to

```
function to close all connections when component unmounts
    return () => {
      console.log('Cleaning up event sources');
      Object.values(eventSourcesRef.current).forEach(es => {
        if (es && es.readyState !== 2) { // 2 = CLOSED
    # ... more lines ...
```

## File Info

- **Size**: 18.1 KB
- **Lines**: 444
- **Complexity**: 19
