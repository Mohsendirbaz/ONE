# AggregatedSubPlots.py

**Purpose**: Data Processing

**Functions**: parse_versions, parse_properties, preprocess_json_string, format_number, extract_selected_properties and 5 more

**Dependencies**: os, pandas, numpy, json, logging and 3 more

**Keywords**: import, pandas, numpy, json, logging, sys, from

## Key Code Sections

### Imports

```
import os
import pandas as pd
import numpy as np
import json
import logging
# ...and 3 more imports
```

### Function: parse_versions

```
def parse_versions(versions_str):
    """Convert comma-separated version string to list of integers"""
    return list(map(int, versions_str.split(',')))

```

### Function: parse_properties

```
def parse_properties(properties_str):
    """Convert comma-separated properties string to list of strings"""
    return properties_str.split(',')

```

### Function: preprocess_json_string

```
def preprocess_json_string(json_str):
    """Remove redundant double quotes from JSON string"""
    json_str = re.sub(r'""', '"', json_str)  # Remove redundant double quotes
    return json_str


```

## File Info

- **Size**: 35.1 KB
- **Lines**: 861
- **Complexity**: 16

## Additional Details

### Line Statistics

- Average line length: 39.7 characters
- Longest line: 136 characters
- Number of blank lines: 127

### Content Samples

Beginning:
```
import os
import pandas as pd
import numpy as np
import json
import logging
import re
import sys
fro
```

Middle:
```
version
    version_dir = os.path.join(uploads_dir, f'Batch({version})', f'Results({version})')
    
```

End:
```
    else:
            logging.info(f"All HTML content successfully saved for metric {metric_name}")

```


================================================================================
End of file summary
================================================================================
