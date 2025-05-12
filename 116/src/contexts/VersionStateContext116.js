# VersionStateContext.js

**Purpose**: Ui Component

**Functions**: VersionStateProvider, useVersionState

## File Info

- **Size**: 1.1 KB
- **Lines**: 38
- **Complexity**: 3

## Additional Details

### Line Statistics

- Average line length: 27.0 characters
- Longest line: 82 characters
- Number of blank lines: 7

### Content Samples

Beginning:
```
import React, { createContext, useContext, useState } from 'react';

// Create a context for version
```

Middle:
```
 [selectedVersions, setSelectedVersions] = useState([]);

  // Value object with just the state and 
```

End:
```
ow new Error('useVersionState must be used within a VersionStateProvider');
  }
  return context;
}

```

