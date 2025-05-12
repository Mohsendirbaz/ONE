# FilteredFactualPrecedence.js

**Purpose**: Data Processing

**Functions**: FilterPanel, toggleCategory, handleFilterToggle, clearAllFilters, applySuggestedFilters and 5 more

**Keywords**: import, from, usestate, const, react, useeffect, factualprecedencebase

## Key Code Sections

### Imports

```
import React, { useState, useEffect } from 'react';
import FactualPrecedenceBase from './FactualPrecedenceBase';
import { keyPointsData, formValueKeyPointRelevance } from '../../../data/keyPointsMapping';
import axios from 'axios';
```

### Function: FilterPanel

```
const FilterPanel = ({ id, selectedFilters, onFilterChange, industryContext }) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [suggestedFilters, setS

... (truncated to meet size target) ...
