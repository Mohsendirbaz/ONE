# html_generator.py

**Purpose**: Ui Component

**Description**: HTML Generator Module

This module provides functions for generating HTML output from the insights data.
It creates a responsive, searchable interface with visualization components for
relationships a...

**Functions**: __init__, generate_html, _create_html_content, _create_overview_section, _create_directory_insights_section and 4 more

**Classes**: HTMLGenerator:, from, to

**Dependencies**: os, json, typing, os, datetime

**Keywords**: import, self, insights, from, str, dict, any

## Key Code Sections

### Imports

```
import os
import json
from typing import Dict, List, Any, Union, Optional
from os import PathLike
from datetime import datetime
```

### Function: __init__

```
def __init__(self, insights: Dict[str, Any]):
        """
        Initialize the HTML generator.

        Args:
    # ... more lines ...
```

### Function: generate_html

```
def generate_html(self, output_path: Union[str, PathLike]) -> str:
        """
        Generate an HTML file from the insights data.

        Args:
    # ... more lines ...
```

### Function: _create_html_content

```
def _create_html_content(self) -> str:
        """
        Create the HTML content from the insights data.

        Returns:
            The HTML content as a string
        """
        # Create the HTML structure
        html = f"""<!DOCTYPE html>
```

### Class: HTMLGenerator:

```
class HTMLGenerator:
    """Class for generating HTML output from insights data."""

    def __init__(self, insights: Dict[str, Any]):
        """
        Initialize the HTML generator.

    # ... more lines ...
```

## File Info

- **Size**: 32.7 KB
- **Lines**: 824
- **Complexity**: 22

## Additional Details

### Line Statistics

- Average line length: 38.7 characters
- Longest line: 210 characters
- Number of blank lines: 79


================================================================================
End of file summary
================================================================================
