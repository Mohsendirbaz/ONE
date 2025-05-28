# Consolidated3.js

**Purpose**: Config

**Functions**: PropertySelector, handlePropertyChange, VersionSelector, handleVersionToggle, handleBatchSelect and 15 more

**Dependencies**: react-tabs/style/react-tabs.css, ./styles/HomePage.CSS/HCSS.css, ./styles/HomePage.CSS/Consolidated.css

**Keywords**: import, from, react, usestate, useeffect, usecallback, usememo

## Key Code Sections

### Imports

```
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
# ...and 23 more imports
```

### Function: PropertySelector

```
const PropertySelector = ({ selectedProperties, setSelectedProperties, formValues }) => {
    const handlePropertyChange = (event) => {
        const selectedOptions = Array.from(event.target.selectedOptions, (option) => option.value);
        const originalProperties = selectedOptions.map(displayProp =>
            Object.keys(formValues).find(key => formValues[key].label === displayProp));
    # ... more lines ...
```

### Function: VersionSelector

```
const VersionSelector = ({ maxVersions = 20, batchInfo = {} }) => {
    // Get state and setters from context
    const [selectedVersions, setSelectedVersions] = useState([]);

    // Group versions into batches
    # ... more lines ...
```

### Function: PlotsTabs

```
const PlotsTabs = ({ version, sensitivity = false }) => {
    const [plotCategories, setPlotCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [plotGroups, setPlotGroups] = useState({});
    const [selectedGroup, setSelectedGroup] = useState(null);
    # ... more lines ...
```

## File Info

- **Size**: 52.0 KB
- **Lines**: 1141
- **Complexity**: 26

## Additional Details

### Line Statistics

- Average line length: 44.7 characters
- Longest line: 133 characters
- Number of blank lines: 100

### Content Samples

Beginning:
```
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Tab, TabL
```

Middle:
```
put' : 'results')}>
                <TabList className="main-tabs">
                    <Tab>Input C
```

End:
```
el,
    ProcessingPanel,
    ResultsPanel,
    IndividualResultsPanel
};

export default MatrixApp;

```


================================================================================
End of file summary
================================================================================
