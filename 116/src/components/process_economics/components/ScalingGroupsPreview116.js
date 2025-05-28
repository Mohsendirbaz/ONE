# ScalingGroupsPreview.js

**Purpose**: Ui Component

**Functions**: ScalingGroupsPreview, goToPreviousGroup, goToNextGroup

## File Info

- **Size**: 4.1 KB
- **Lines**: 112
- **Complexity**: 16

## Additional Details

### Line Statistics

- Average line length: 35.8 characters
- Longest line: 93 characters
- Number of blank lines: 12

### Content Samples

Beginning:
```
import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { ChevronLe
```

Middle:
```
ps.map((group, groupIndex) => (
              <Tab.Panel key={group.id || groupIndex} className="sca
```

End:
```
{scalingGroups.length}</span>
      </div>
    </div>
  );
};

export default ScalingGroupsPreview;

```

