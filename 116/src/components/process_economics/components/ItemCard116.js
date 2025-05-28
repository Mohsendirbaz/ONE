# ItemCard.js

**Purpose**: Config

**Functions**: onImport, ItemCard, loadUsageStats, handleImport, handleViewDetails and 3 more

**Dependencies**: 
    );
    
    // Call the original import function
    onImport(item.configuration);
  };
  
  // Handle viewing item details with usage tracking
  const handleViewDetails = () => {
    // Track view event
    usageTracker.trackItemUsage(
      item.id, 
      getCurrentUserId(), 
      isPersonal ? 

## Key Code Sections

### Imports

```
import React, { useState, useEffect } from 'react';
import { 
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import ItemDetailsModal from './ItemDetailsModal';
# ...and 5 more imports
```

### Function: onImport

```
function
    onImport(item.configuration);
  };
  
  // Handle viewing item details with usage tracking
    # ... m

... (truncated to meet size target) ...
