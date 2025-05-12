# mockDataService.js

**Purpose**: Database

**Functions**: getMockData

## Key Code Sections

### Function: getMockData

```
const getMockData = (category, filters = {}) => {
    let result;

    // Retrieve base data
    switch (category) {
    # ... more lines ...
```

## File Info

- **Size**: 27.6 KB
- **Lines**: 599
- **Complexity**: 18

## Additional Details

### Line Statistics

- Average line length: 45.1 characters
- Longest line: 121 characters
- Number of blank lines: 13

### Content Samples

Beginning:
```
// src/modules/processEconomics/services/mockDataService.js
/**
 * Central repository for mock data 
```

Middle:
```
:20:00Z',
                        exportedBy: "ScalingModule",
                        description: 
```

End:
```
rs.limit);
        }
    }

    return result;
};

export default {
    mockData,
    getMockData
};
```


================================================================================
End of file summary
================================================================================
