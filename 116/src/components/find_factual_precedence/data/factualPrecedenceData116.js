# factualPrecedenceData.js

**Purpose**: Data Processing

**Description**: * Enhanced Factual Precedence Data with richer context and corporate evolution insights

**Functions**: getParameterType, getPrePopulatedPrecedenceData, getContextAwareRecommendations

## Key Code Sections

### Function: getParameterType

```
const getParameterType = (itemId) => {
  if (itemId.includes('lifetime') || itemId.includes('Amount10')) return 'lifetime';
  if (itemId.includes('priceAmount') || itemId.includes('Amount13')) return 'price';
  if (itemId.includes('costAmount') || itemId.includes('Amount14')) return 'cost';
  if (itemId.includes('investmentAmount') || itemId.includes('Amount11')) return 'investment';
    # ... more lines ...
```

### Function: getPrePopulatedPrecedenceData

```
const getPrePopulatedPrecedenceData = (itemId, formValue) => {
  // Get the basic data for this parameter
  const baseData = factualPrecedenceData[itemId] || null;

  if (!baseData) {
    # ... more lines ...
```

## File Info

- **Size**: 21.0 KB
- **Lines**: 422
- **Complexity**: 6

## Additional Details

### Line Statistics

- Average line length: 49.0 characters
- Longest line: 220 characters
- Number of blank lines: 28


=====================================================
End of file summary
=====================================================
