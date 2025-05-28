# active-files-tracker.js

**Purpose**: Data Processing

**Description**: * @fileoverview Rule to differentiate between active and inactive project files

**Functions**: resolveImportPath, that, extractImports, that, buildDependencyGraph and 6 more

**Dependencies**: path, fs, ./path/file.css, ./path/file.css

**Keywords**: const, require, path

## Key Code Sections

### Function: resolveImportPath

```
function resolveImportPath(importPath, currentFilePath) {
  // Skip node_modules and non-relative imports
  if (!importPath.startsWith(".")) {
    return null;
  }
    # ... more lines ...
```

### Function: extractImports

```
function extractImports(filePath) {
  // Check cache first
  if (importCache.has(filePath)) {
    return importCache.get(filePath);
  }
    # ... more lines ...
```

### Function: buildDependencyGraph

```
function buildDependencyGraph(entryPoint) {
  const dependencyGraph = new Map();
  const activeFiles = new Set();
  const processedFiles = new Set();
  const dependencyLayers = new Map(); // Track dependency depth for each file
    # ... more lines ...
```

## File Info

- **Size**: 34.4 KB
- **Lines**: 901
- **Complexity**: 10

## Additional Details

### Line Statistics

- Average line length: 37.2 characters
- Longest line: 184 characters
- Number of blank lines: 139

### Content Samples

Beginning:
```
/**
 * @fileoverview Rule to differentiate between active and inactive project files
 */
"use strict
```

Middle:
```

          console.log("This analysis is only running because ANALYZE_ACTIVE_FILES=true");

        
```

End:
```
e files. Report written to active-files-report.json`,
          });
        }
      }
    };
  }
};

```


================================================================================
End of file summary
================================================================================
