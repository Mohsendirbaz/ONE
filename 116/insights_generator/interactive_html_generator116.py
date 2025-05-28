# interactive_html_generator.py

**Purpose**: Ui Component

**Description**: Interactive HTML Generator Module

This module provides the InteractiveHTMLGenerator class for generating an interactive
HTML output from the insights data. It uses D3.js for network visualizations an...

**Functions**: __init__, generate_html, _create_html_content, _create_overview_section, _create_network_analysis_section and 5 more

**Classes**: for, InteractiveHTMLGenerator:, from, to

**Dependencies**: os, json, typing, os, datetime and 1 more

**Keywords**: import, self, insights, from, str, dict, any

## Key Code Sections

### Imports

```
import os
import json
from typing import Dict, List, Any, Union, Optional
from os import PathLike
from datetime import datetime
# ...and 1 more imports
```

### Function: __init__

```
def __init__(self, insights: Dict[str, Any]):
        """
        Initialize the interactive HTML generator.

        Args:
    # ... more lines ...
```

### Function: generate_html

```
def generate_html(self, output_path: Union[str, PathLike]) -> str:
        """
        Generate an interactive HTML file from the insights data.

        Args:
    # ... more lines ...
```

### Function: _create_html_content

```
def _create_html_content(self) -> str:
        """
        Create the HTML content from the insights data.

        Returns:
    # ... more lines ...
```

### Class: for

```
class for generating an interactive
HTML output from the insights data. It uses D3.js for network visualizations and
provides a responsive, searchable interface with multiple visualization modes.
"""

import os
import json
    # ... more lines ...
```

## File Info

- **Size**: 32.5 KB
- **Lines**: 813
- **Complexity**: 22

## Additional Details

### Line Statistics

- Average line length: 39.0 characters
- Longest line: 212 characters
- Number of blank lines: 84


=============================================================================
End of file summary
=============================================================================
