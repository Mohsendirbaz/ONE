# ExtendedScaling.js

**Purpose**: Config

**Functions**: for, to, Tooltip, CumulativeDocumentation, DraggableScalingItem and 3 more

**Dependencies**: ../process_economics/styles/ScalingGroupsPreview.css, ../../styles/HomePage.CSS/HCSS.css, ./styles/DeleteConfirmationModal.css

**Keywords**: import, from, react, usestate, useeffect, usecallback, useref

## Key Code Sections

### Imports

```
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tab } from '@headlessui/react';
import { ArrowPathIcon, PlusIcon, TrashIcon, LockClosedIcon, LockOpenIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import * as math from 'mathjs';
import ScalingSummary from './ScalingSummary';
# ...and 9 more imports
```

### Function: for

```
function for tab configurations
  const syncTabConfigs = useCallback(() => {
    const newTabConfigs = scalingGroups.map(group => ({
      id: group.id,
      label: group.name,
    # ... more lines ...
```

### Function: to

```
function to determine the correct insertion index
  const determineInsertionIndex = useCallback((groupNumber, groups) => {
    // Look for the position where this group should be inserted based on numbering
    for (let i = 0; i < groups.length; i++) {
      const match = groups[i].name.match(/Scaling Group (\d+)/);
    # ... more lines ...
```

## File Info

- **Size**: 62.6 KB
- **Lines**: 1747
- **Complexity**: 20

## Additional Details

### Line Statistics

- Average line length: 34.7 characters
- Longest line: 209 characters
- Number of blank lines: 176

### Content Samples

Beginning:
```
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tab } from '@headl
```

Middle:
```

            : cost.baseValue || 0;

        return {
          ...cost,
          originalBaseValue
```

End:
```
) => {},
  activeGroupIndex: 0,
  onActiveGroupChange: () => {}
};

export default ExtendedScaling;

```


================================================================================
End of file summary
================================================================================
