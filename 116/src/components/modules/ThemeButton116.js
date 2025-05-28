# ThemeButton.js

**Purpose**: Config

**Functions**: ThemeButton, handleButtonClick, handleEditClick

## File Info

- **Size**: 1.3 KB
- **Lines**: 45
- **Complexity**: 6

## Additional Details

### Line Statistics

- Average line length: 27.7 characters
- Longest line: 88 characters
- Number of blank lines: 7

### Content Samples

Beginning:
```
import React, { useState } from 'react';
import ThemeConfigurator from './ThemeConfigurator';
import
```

Middle:
```
ner ${currentTheme === theme ? 'active' : ''}`}>
      <button
        className={`theme-button ${cu
```

End:
```
se={() => setIsConfiguratorOpen(false)} />
      )}
    </div>
  );
};

export default ThemeButton;

```

