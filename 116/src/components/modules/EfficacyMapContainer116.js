# EfficacyMapContainer.js

**Purpose**: Config

**Functions**: onParameterUpdate, to, to, EfficacyMapContainer, getColorForPercentage and 1 more

**Dependencies**: ../../styles/HomePage.CSS/EfficacyMapContainer.css

**Keywords**: usestate, const, import, from, plantlifetime, configurableversions, false

## Key Code Sections

### Imports

```
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TimeParameterMatrix from './TimeParameterMatrix';
import ConflictResolutionPanel from './ConflictResolutionPanel';
import CapacityMapPanel from './CapacityMapPanel';
import capacityTracker from '../../services/CapacityTrackingService';
# ...and 1 more imports
```

### Function: EfficacyMapContainer

```
const EfficacyMapContainer = ({
  parameters = {},
  scalingGroups = {},
  plantLifetime = 20,
  configurableVersions = 20,
   

... (truncated to meet size target) ...
