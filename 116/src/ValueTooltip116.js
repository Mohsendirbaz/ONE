# ValueTooltip.js

**Purpose**: Utility

**Functions**: ValueTooltip, formatNumber, getTooltipPosition, getTooltipSize

## Key Code Sections

### Imports

```
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import { efficacyAwareScalingGroupsAtom } from '../../atoms/efficacyMatrix';
import { versionsAtom, zonesAtom } from '../../atoms/matrixFormValues';
```

### Function: ValueTooltip

```
const ValueTooltip = ({
                          children,
                          ite

... (truncated to meet size target) ...
