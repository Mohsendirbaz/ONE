# process_sensitivity_results.py

**Purpose**: Config

**Description**: Process Sensitivity Results

This script runs independently after the main sensitivity calculation flow:
1. Waits for configuration modifications to complete
2. Execu...

**Functions**: extract_price_from_summary, load_sensitivity_config, store_results, check_configuration_readiness, main

**Dependencies**: os, sys, json, time, logging and 5 more

## Key Code Sections

### Imports

```
import os
import sys
import json
import time
import logging
# ...and 5 more imports
```

### Function: extract_price_from_summary

```
def extract_price_from_summary(version, param_id, variation):
    """
    Extract price value from economic summary for a specific parameter variation.
    
    Args:
    # ... more lin

... (truncated to meet size target) ...
