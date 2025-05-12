# sense_config_base.py

**Purpose**: Config

**Description**: Sensitivity Configuration Base Module

This module provides functionality to copy configuration modules for sensitivity analysis.
It is designed to work independently from the main calculation orchest...

**Functions**: setup_logging, import_sensitivity_functions, generate_sensitivity_datapoints, process_config_modules, check_sensitivity_config_status and 3 more

**Dependencies**: flask, flask_cors, subprocess, os, logging and 7 more

**Keywords**: import, from, flask, request, jsonify, flask_cors, cors

## Key Code Sections

### Imports

```
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import logging
# ...and 7 more imports
```

### Function: import_sensitivity_functions

```
def import_sensitivity_functions():
    """Import necessary functions from Sen_Config module."""
    sensitivity_logger = logging.getLogger('sensitivity')

    try:
    # ... more lines ...
```

### Function: generate_sensitivity_datapoints

```
def generate_sensitivity_datapoints(version, SenParameters):
    """
    Generate SensitivityPlotDatapoints_{version}.json file with baseline and variation points.
    Uses actual modified values from configuration modules.

    # ... more lines ...
```

### Function: process_config_modules

```
def process_config_modules(version, SenParameters):
    """
    Process all configuration modules (1-100) for all parameter variations.
    Apply sensitivity variations and save modified configurations.

    # ... more lines ...
```

## File Info

- **Size**: 28.8 KB
- **Lines**: 675
- **Complexity**: 14
