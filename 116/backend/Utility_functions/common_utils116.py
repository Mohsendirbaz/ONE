# common_utils.py

**Purpose**: Config

**Functions**: extract_properties

## File Info

- **Size**: 2.9 KB
- **Lines**: 83
- **Complexity**: 2

## Additional Details

### Line Statistics

- Average line length: 34.8 characters
- Longest line: 116 characters
- Number of blank lines: 5

### Content Samples

Beginning:
```
import importlib.util
import numpy as np

property_mapping = {
    "plantLifetimeAmount10": "Plant L
```

Middle:
```
e",
    "federalTaxRateAmount33": "Federal Tax Rate",
    "rawmaterialAmount34": "Feedstock Cost",
 
```

End:
```
rties = {key: getattr(config, key, None) for key in property_mapping.keys()}
    return properties


```

