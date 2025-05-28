# calculation_flow_analyzer.js

**Purpose**: Data Processing

**Functions**: definitions, body

**Classes**: CalculationFlowAnalyzer

**Keywords**: import, from, options, esprima, estraverse, escodegen, export

## Key Code Sections

### Imports

```
import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';
```

### Function: definitions

```
function definitions
    const functionPattern = /def\s+(\w+)\s*\(/g;
    let match;
    while ((match = functionPattern.exec(code)) !== null) {
      const name = match[1];
    # ... more lines ...
```

### Function: body

```
function body (simplified)
      let endIndex = code.indexOf('\n\n', startIndex);
      if (endIndex === -1) endIndex = code.length;
      
      const functionBody = code.substring(startIndex, endIndex);
    # ... more lines ...
```

### Class: CalculationFlowAnalyzer

```
class CalculationFlowAnalyzer {
  constructor(options = {}
```

## File Info

- **Size**: 20.3 KB
- **Lines**: 626
- **Complexity**: 8

## Additional Details

### Line Statistics

- Average line length: 31.2 characters
- Longest line: 94 characters
- Number of blank lines: 81


=====================================
End of file summary
=====================================
