# PNG.py

**Purpose**: Api Client

**Description**: .strip())

def validate_request_data(data):

**Functions**: emit, log_properties_as_table, log_sensitivity_parameters, validate_request_data, run_scripts and 5 more

**Classes**: ImmediateFileHandler

**Dependencies**: flask, flask_cors, subprocess, os, logging and 5 more

**Keywords**: import, from, flask, datetime, request, jsonify, send_file

## Key Code Sections

### Imports

```
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import subprocess
import os
import logging
# ...and 5 more imports
```

### Function: log_properties_as_table

```
def log_properties_as_table(properties):
    """
    Create a formatted table of properties in the log file.

    Args:
    # ... more lines ...
```

### Function: log_sensitivity_parameters

```
def log_sensitivity_parameters(sensitivity_params):
    """
    Log sensitivity analysis configuration in a structured format.

    Args:
    # ... more lines ...
```

### Function: validate_request_data

```
def validate_request_data(data):
    """
    Validate and extract required parameters from request data.
    """
    try:
    # ... more lines ...
```

### Class: ImmediateFileHandler

```
class ImmediateFileHandler(logging.FileHandler):
    def emit(self, record):
        super().emit(record)
        self.close()
        # Reopen for next write
        self.stream = self._open()

```

## File Info

- **Size**: 24.4 KB
- **Lines**: 599
- **Complexity**: 16
