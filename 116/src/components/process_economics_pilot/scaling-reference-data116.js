# scaling-reference-data.js

**Purpose**: Ui Component

**Description**: * Process Economics Reference Data
 * 
 * This module provides standard scaling factors and exponents for common process equipment
 * based on industry references to be used ...

**Functions**: adjustCostForInflation

## Key Code Sections

### Function: adjustCostForInflation

```
const adjustCostForInflation = (baseCost, referenceYear, currentYear = 2024, indexType = 'CEPCI') => {
  let indexData;
  
  // Select the appropriate cost index
  switch(indexType) {
    # ... more lines ...
```

## File Info

- **Size**: 14.4 KB
- **Lines**: 587
- **Complexity**: 6

## Additional Details

### Line Statistics

- Average line length: 24.1 characters
- Longest line: 110 characters
- Number of blank lines: 38

### Content Samples

Beginning:
```
/**
 * Process Economics Reference Data
 * 
 * This module provides standard scaling factors and exp
```

Middle:
```

    description: "Standard shell and tube heat exchanger with carbon steel construction",
    tags:
```

End:
```
tureFactors,
  installationFactors,
  costIndices,
  adjustCostForInflation,
  equipmentTemplates
};
```

