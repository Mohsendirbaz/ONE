# SensitivityMonitor.js

**Purpose**: Config

**Functions**: to, SensitivityMonitor

**Dependencies**: ../../styles/HomePage.CSS/HCSS.css, ../../styles/HomePage.CSS/SensitivityMonitor.css

**Keywords**: import, from, react, usestate, useeffect, usecallback, usememo

## Key Code Sections

### Imports

```
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../../styles/HomePage.CSS/HCSS.css';
import '../../styles/HomePage.CSS/SensitivityMonitor.css';
import { useMatrixFormValues } from '../../Consolidated2';
import capacityTracker from '../../services/CapacityTrackingService';
```

### Function: to

```
function to apply mode-specific styling
  const formatParameterValues = useCallback((values, mode) => {
    if (!values || values.length === 0) return null;

    // Handle both numeric and string values (like F/V boxes)
    # ... more lines ...
```

### Function: SensitivityMonitor

```
const SensitivityMonitor = ({ S, setS, version, activeTab }) => {
  // Get form values
  const { formMatrix: formValues } = useMatrixFormValues();

  // Component state
    # ... more lines ...
```

## File Info

- **Size**: 31.6 KB
- **Lines**: 752
- **Complexity**: 25

## Additional Details

### Line Statistics

- Average line length: 41.1 characters
- Longest line: 157 characters
- Number of blank lines: 73

### Content Samples

Beginning:
```
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../../styles/HomeP
```

Middle:
```
                    </button>
                                  <button
                            
```

End:
```
v>
        )}
      </div>
  );
};

export { SensitivityMonitor as default, sensitivityActionRef };

```


================================================================================
End of file summary
================================================================================
