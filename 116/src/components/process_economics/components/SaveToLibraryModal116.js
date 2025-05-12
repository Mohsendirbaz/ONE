# SaveToLibraryModal.js

**Purpose**: Data Processing

**Functions**: SaveToLibraryModal, handleChange, handleAddTag, handleRemoveTag, handleSubmit

**Keywords**: import, usestate, from, const, react, xmarkicon, foldericon

## Key Code Sections

### Imports

```
import React, { useState } from 'react';
import { 
import { motion } from 'framer-motion';
import { categories } from '../data/categoryData';
```

### Function: SaveToLibraryModal

```
const SaveToLibraryModal = ({
  onClose,
  onSave,
  shelves = [],
  isLoadingSh

... (truncated to meet size target) ...
