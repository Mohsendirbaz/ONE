# context_analyzer.js

**Purpose**: Ui Component

**Description**: * Context Analyzer for React applications
 * Analyzes the usage of React Context API across components

**Functions**: to, analyzeContexts, identifyContexts, identifyProviders, identifyConsumers and 2 more

**Classes**: components

**Keywords**: import, parsecomponent, from, export, async, function, analyzecontexts

## Key Code Sections

### Imports

```
import { parseComponent } from './react_parser';
```

### Function: identifyContexts

```
function identifyContexts(parseResult, filePath, contextAnalysis) {
  // Check for createContext imports
  const hasCreateContextImport = parseResult.imports.some(importItem => 
    importItem.source === 'react' && 
    importItem.specifiers.some(s => s.imported === 'createContext')
    # ... more lines ...
```

## File Info

- **Size**: 15.7 KB
- **Lines**: 452
- **Complexity**: 7
