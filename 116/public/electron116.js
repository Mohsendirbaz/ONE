# electron.js

**Purpose**: Ui Component

**Functions**: createWindow

## File Info

- **Size**: 1.9 KB
- **Lines**: 88
- **Complexity**: 6

## Additional Details

### Line Statistics

- Average line length: 20.5 characters
- Longest line: 65 characters
- Number of blank lines: 9

### Content Samples

Beginning:
```
const path = require('path');
const { app, BrowserWindow, Menu, dialog } = require('electron');
cons
```

Middle:
```
(data));
           }
         }
       },
       { type: 'separator' },
       { role: 'quit' }
   
```

End:
```
.on('activate', () => {
 if (BrowserWindow.getAllWindows().length === 0) {
   createWindow();
 }
});
```

