# ItemDetailsModal.js

**Purpose**: Config

**Functions**: ItemDetailsModal, handleCopySnippet, formatDate

**Dependencies**: ../styles/ScalingGroupsPreview.css

**Keywords**: import, from, usestate, const, false, react, xmarkicon

## Key Code Sections

### Imports

```
import React, { useState } from 'react';
import { 
import { motion } from 'framer-motion';
import ScalingGroupsPreview from './ScalingGroupsPreview';
import '../styles/ScalingGroupsPreview.css';
# ...and 1 more imports
```

### Function: ItemDetailsModal

```
const ItemDetailsModal = ({ 
  item, 
  onClose,
  onImport,
  isPersonal
    # ... more lines ...
```

### Function: handleCopySnippet

```
const handleCopySnippet = () => {
    navigator.clipboard.writeText(configSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
    # ... more lines ...
```

## File Info

- **Size**: 15.0 KB
- **Lines**: 384
- **Complexity**: 17
