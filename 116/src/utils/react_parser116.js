# react_parser.js

**Purpose**: Ui Component

**Functions**: parseComponent, components, components, isReactComponent, isFunctionComponent and 24 more

**Classes**: components, extends, methods, property

**Keywords**: import, from, babelparser, content, const, traverse, export

## Key Code Sections

### Imports

```
import * as babelParser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
```

### Function: parseComponent

```
function parseComponent(content, filePath) {
  const ast = babelParser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties']
  });
    # ... more lines ...
```

### Function: components

```
function components
    FunctionDeclaration(path) {
      if (isFunctionComponent(path)) {
        result.components.push({
          type: 'function',
    # ... more lines ...
```

## File Info

- **Size**: 18.9 KB
- **Lines**: 642
- **Complexity**: 9

## Additional Details

### Line Statistics

- Average line length: 28.2 characters
- Longest line: 101 characters
- Number of blank lines: 59


==============================
End of file summary
==============================
