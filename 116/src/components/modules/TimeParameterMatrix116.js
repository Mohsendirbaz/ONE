# TimeParameterMatrix.js

**Purpose**: Ui Component

**Functions**: TimeParameterMatrix, hasConflict, isActive, getCellClass, handleCellClick and 3 more

**Classes**: based

**Dependencies**: ../../styles/HomePage.CSS/TimeParameterMatrix.css

**Keywords**: usestate, const, null, import, from, react, useeffect

## Key Code Sections

### Imports

```
import React, { useState, useEffect, useMemo } from 'react';
import capacityTracker from '../../services/CapacityTrackingService';
import '../../styles/HomePage.CSS/TimeParameterMatrix.css';
```

### Function: TimeParameterMatrix

```
const TimeParameterMatrix = ({ 
  parameters, 
  scalingGroups = {}, 
  plantLifetime = 20, 
  onConflictClick 
    # ... more lin

... (truncated to meet size target) ...
