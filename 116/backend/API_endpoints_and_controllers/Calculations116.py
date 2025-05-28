# Calculations.py

**Purpose**: Data Processing

**Functions**: log_state_parameters, run_script, process_version, __init__, _get_status_file_path and 11 more

**Classes**: PriceOptimizationMonitor:

**Dependencies**: flask, flask_cors, subprocess, os, logging and 9 more

**Keywords**: import, from, flask, queue, tabulate, datetime, request

## Key Code Sections

### Imports

```
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import subprocess
import os
import logging
# ...and 9 more imports
```

### Function: log_state_parameters

```
def log_state_parameters(versions, v_states, f_states,r_states, rf_states, calculation_option, target_row,
                        tolerance_lower, tolerance_upper, increase_rate, decrease_rate, sen_parameters):
    """Log state parameters in a structured, tabulated format"""

    # Log versions
    # ... more lines ...
```

### Function: __init__

```
def __init__(self, version):
        """Initialize the monitor for a specific version."""
        self.version = version
        self.status_file_path = self._get_status_file_path()
        self.running = False
    # ... more lines ...
```

### Function: _get_status_file_path

```
def _get_status_file_path(self):
        """Get the path to the status file for this version."""
        # Construct path to the status file
        results_folder = os.path.join(SCRIPT_DIR, "..", "..", "Original", 
            f"Batch({self.version})", f"Results({self.version})"
    # ... more lines ...
```

## File Info

- **Size**: 28.5 KB
- **Lines**: 678
- **Complexity**: 20

## Additional Details

### Line Statistics

- Average line length: 41.0 characters
- Longest line: 133 characters
- Number of blank lines: 111

