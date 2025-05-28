# dependency_mapper.js

**Purpose**: Ui Component

**Description**: * Dependency Mapper Module
 * 
 * Provides utilities for parsing imports and exports in JavaScript/JSX files
 * to map dependencies between modules.

**Functions**: parseImportsAndExports, parseImports, parseExports, exports, exports and 11 more

**Classes**: exports, exports, exports.push(, const

**Dependencies**: path, path, path, path

**Keywords**: filepath, imports, content, exports, error, const, export

## Key Code Sections

### Function: resolveImport

```
function resolveImport(sourceFile, importPath, files) {
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const path = require('path');
    const basePath = path.dirname(sourceFile);
    # ... more lines ...
```

### Function: buildIndirectDependencies

```
function buildIndirectDependencies(parseResults) {
  const indirectDeps = {};

  // Analyze component props and state usage
  for (const file of Object.keys(parseResults)) {
    # ... more lines ...
```

## File Info

- **Size**: 19.5 KB
- **Lines**: 653
- **Complexity**: 11
