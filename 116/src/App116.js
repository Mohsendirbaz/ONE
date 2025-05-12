# App.js

**Purpose**: Ui Component

**Functions**: getColorFromTheme, getAverageThemeColor, applyAverageColors, App, hexToRgb and 1 more

## File Info

- **Size**: 3.0 KB
- **Lines**: 94
- **Complexity**: 10

## Additional Details

### Line Statistics

- Average line length: 30.9 characters
- Longest line: 104 characters
- Number of blank lines: 17

### Content Samples

Beginning:
```
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 're
```

Middle:
```
16).padStart(2, "0")).join("");

    const rgbs = themes.map((theme) =>
        hexToRgb(getColorFro
```

End:
```
             </Routes>
            </Router>
        </ErrorBoundary>
    );
}

export default App;

```

