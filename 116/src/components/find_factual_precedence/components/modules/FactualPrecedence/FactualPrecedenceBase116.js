# FactualPrecedenceBase.js

**Purpose**: Database

**Functions**: passed, getParameterContext, formLabel, CorporateEvolutionInsights, getParamTypeDescription and 6 more

**Keywords**: import, from, react, usestate, useeffect, fontawesomeicon, fatimes

## Key Code Sections

### Imports

```
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
```

### Function: passed

```
function passed as prop - implementation varies based on data source
      const data = await getPrecedenceData(id, formValues[id]);
      setFactualData(data);
    } catch (error) {
      console.error('Error fetching factual precedence:', error);
    # ... more lines ...
```

### Function: getParameterContext

```
const getParameterContext = (itemId, formValue) => {
  // Determine parameter type and context
  let paramType = 'general';
  if (itemId.includes('Amount1')) paramType = 'investment';
  else if (itemId.includes('Amount2')) paramType = 'loan';
    # ... more lines ...
```

## File Info

- **Size**: 19.7 KB
- **Lines**: 488
- **Complexity**: 19
