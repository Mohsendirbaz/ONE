# Consolidated2.js

**Purpose**: Config

**Functions**: useMatrixFormValues, VersionZoneManager, MatrixValueEditor, EfficacyPeriodEditor, if and 7 more

**Classes**: EfficacyManager, MatrixConfigExporter, MatrixHistoryManager, MatrixInheritanceManager, MatrixValidator and 5 more

**Dependencies**: ./styles/HomePage.CSS/HCSS.css, ./styles/HomePage.CSS/Consolidated.css, express, cors

**Keywords**: import, from, react, usestate, useeffect, usecallback, atom

## Key Code Sections

### Imports

```
import React, { useState, useEffect, useCallback } from 'react';
import { atom, useAtom } from 'jotai';
import axios from 'axios';
import * as math from 'mathjs';
import './styles/HomePage.CSS/HCSS.css';
# ...and 2 more imports
```

### Function: handleReset

```
const handleReset = () => {
    setStartYear(0);
    setEndYear(plantLifetime);
  };

    # ... more lines ...
```

### Function: useMatrixFormValues

```
function useMatrixFormValues() {
  //=========================================================================
  // STATE DEFINITIONS
  //=========================================================================

    # ... more lines ...
```

### Class: EfficacyManager

```
class EfficacyManager {
  /**
   * Constructor
   * @param {Object}
```

## File Info

- **Size**: 100.6 KB
- **Lines**: 3558
- **Complexity**: 12

## Additional Details

### Line Statistics

- Average line length: 28.0 characters
- Longest line: 142 characters
- Number of blank lines: 471

### Content Samples

Beginning:
```
import React, { useState, useEffect, useCallback } from 'react';
import { atom, useAtom } from 'jota
```

Middle:
```
tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
```

End:
```
th || 0,
      parameters: Object.keys(this.matrixState.formMatrix || {}).length || 0
    });
  }
}

```


================================================================================
End of file summary
================================================================================
