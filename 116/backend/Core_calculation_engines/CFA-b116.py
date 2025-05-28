# CFA-b.py

**Purpose**: Config

**Functions**: get_paths_from_calsen, remove_existing_file, calculate_annual_revenue, calculate_annual_operating_expenses, pad_or_trim and 10 more

**Dependencies**: json, os, pandas, numpy, sys and 9 more

**Keywords**: import, matplotlib, patches, json, pandas, numpy, sys

## Key Code Sections

### Imports

```
import json
import os
import pandas as pd
import numpy as np
import sys
# ...and 9 more imports
```

### Function: get_paths_from_calsen

```
def get_paths_from_calsen(version, param_id, mode, variation, compare_to_key):
    """
    Request path information from CalSen service.

    Args:
    # ... more lines ...
```

### Function: autopct_filter

```
def autopct_filter(pct):
            """Show percentage only if >= 3%."""
            return f'{pct:.1f}%' if pct >= 3 else ''

        wedges, texts, autotexts = ax.pie(
    # ... more lines ...
```

### Function: main

```
def main(version, selected_v, selected_f, target_row):
    """
    Main function to calculate revenue and expenses from modules.

    Args:
    # ... more lines ...
```

## File Info

- **Size**: 46.8 KB
- **Lines**: 1041
- **Complexity**: 21

## Additional Details

### Line Statistics

- Average line length: 44.0 characters
- Longest line: 206 characters
- Number of blank lines: 183

### Content Samples

Beginning:
```
import json
import os
import pandas as pd
import numpy as np
import sys
import importlib.util
import
```

Middle:
```
ing Block Start ----------------

    # Populate the CFA matrix for construction years
    cumulativ
```

End:
```
xecution: {str(e)}"
        cfa_logger.error(error_msg, exc_info=True)
        sys.exit(1)  # Error

```


================================================================================
End of file summary
================================================================================
