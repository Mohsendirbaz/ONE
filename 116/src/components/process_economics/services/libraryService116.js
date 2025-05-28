# libraryService.js

**Purpose**: Database

**Functions**: getPersonalLibrary, getGeneralLibrary, updatePersonalLibrary, getMyLibraryShelves, createShelf and 6 more

## Key Code Sections

### Imports

```
import {
import { v4 as uuidv4 } from 'uuid';
import { db, useMockFirebase } from '../../../firebase/config';
import { getMockData } from './mockDataService';
```

## File Info

- **Size**: 11.1 KB
- **Lines**: 421
- **Complexity**: 5

## Additional Details

### Line Statistics

- Average line length: 25.0 characters
- Longest line: 90 characters
- Number of blank lines: 56

### Content Samples

Beginning:
```
// src/modules/processEconomics/services/libraryService.js
import {
  collection,
  doc,
  getDoc,
 
```

Middle:
```
helves || ['favorites'];
      
      await updateDoc(userLibRef, {
        shelves: shelves.filter(
```

End:
```
  } catch (error) {
    console.error('Error saving configuration:', error);
    throw error;
  }
};
```

