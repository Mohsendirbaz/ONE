# entity_analyzer.js

**Purpose**: Ui Component

**Classes**: EntityAnalyzer

**Dependencies**: fs, path, glob-promise, fs

**Keywords**: import, from, options, this, projectroot, excludedirs, includenodemodules

## Key Code Sections

### Imports

```
import React from 'react';
import * as ReactParser from './react_parser';
import * as DependencyMapper from './dependency_mapper';
import * as PropFlowAnalyzer from './prop_flow_analyzer';
import * as HookAnalyzer from './hook_analyzer';
```

## File Info

- **Size**: 15.7 KB
- **Lines**: 489
- **Complexity**: 7

## Additional Details

### Line Statistics

- Average line length: 30.8 characters
- Longest line: 100 characters
- Number of blank lines: 72

### Content Samples

Beginning:
```
import React from 'react';
import * as ReactParser from './react_parser';
import * as DependencyMapp
```

Middle:
```
s at file level
      this.analysisResults.imports[filePath] = imports;
      this.analysisResults.e
```

End:
```
      contexts[contextName].providers.push(componentName);
          }
        }
      }
    }
  }
}
```

