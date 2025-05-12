# add_axis_labels.py

**Purpose**: Data Processing

**Functions**: calculate_modified_value, format_value, get_property_key_for_s_param, add_compare_to_key_label, add_axis_labels

**Dependencies**: os, json, argparse, sys, re

**Keywords**: import, json, argparse, sys

## Key Code Sections

### Imports

```
import os
import json
import argparse
import sys
import re
```

### Function: calculate_modified_value

```
def calculate_modified_value(original_value, mode, variation_value):
    """
    Calculate the modified value based on the variation mode and original value.

    Args:
    # ... more lines ...
```

### Function: format_value

```
def format_value(value):
    """Format the value for display in axis labels"""
    if isinstance(value, float):
        # Format as currency for values over 100
        if abs(value) >= 100:
    # ... more lines ...
```

### Function: get_property_key_for_s_param

```
def get_property_key_for_s_param(s_param):
    """
    Dynamically determine the property key for an S parameter.

    Args:
    # ... more lines ...
```

## File Info

- **Size**: 22.8 KB
- **Lines**: 561
- **Complexity**: 20

## Additional Details

### Line Statistics

- Average line length: 39.6 characters
- Longest line: 116 characters
- Number of blank lines: 80


===================================================================
End of file summary
===================================================================
