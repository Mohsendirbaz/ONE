# sensitivity_api.py

**Purpose**: Config

**Description**: Sensitivity Analysis API with Sequential Event Processing
Provides endpoints for sequentially orchestrated sensitivity analysis.

**Functions**: init_orchestrator, get_status, configure_sensitivity, copy_config_modules, process_configs and 18 more

**Dependencies**: flask, os, logging, json, time and 2 more

## Key Code Sections

### Imports

```
from flask import Flask, request, jsonify, Blueprint
import os
import logging
import json
import time
# ...and 2 more imports
```

### Function: init_orchestrator

```
def init_orchestrator(base_dir, logger):
    """Initialize the global orchestrator instance."""
    global orchestrator
    orchestrator = SensitivityOrchestrator(base_dir, logger)
    logger.info("Sensitivity orchestrator initialized and registered with API")
    return orchestrator

```

### Function: get_status

```
def get_status():
    """Get the current status of the sensitivity analysis process."""
    logger = logging.getLogger('sensitivity')
    logger.info("Status check requested")

    # ... more lines ...
```

### Function: configure_sensitivity

```
def configure_sensitivity():
    """Configure sensitivity analysis and transition to CONFIGURED state."""
    logger = logging.getLogger('sensitivity')
    logger.info("Configure sensitivity request received")

    # ... more lines ...
```

## File Info

- **Size**: 69.2 KB
- **Lines**: 1625
- **Complexity**: 22

## Additional Details

### Line Statistics

- Average line length: 41.6 characters
- Longest line: 141 characters
- Number of blank lines: 293

### Content Samples

Beginning:
```
# New module: sensitivity_api.py

"""
Sensitivity Analysis API with Sequential Event Processing
Prov
```

Middle:
```
xtract configuration parameters
        version = state.version
        SenParameters = state.params
```

End:
```
ept Exception as e:
        logger.error(f"Error in visualizations handler: {str(e)}")
        raise
```


================================================================================
End of file summary
================================================================================
