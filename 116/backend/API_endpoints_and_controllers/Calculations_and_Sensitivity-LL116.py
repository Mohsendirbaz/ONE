# Calculations_and_Sensitivity-LL.py

**Purpose**: Data Processing

**Functions**: get_calculation_script, get_sensitivity_calculation_script, __init__, _get_paths_for_parameter, store_calculation_result and 66 more

**Classes**: SensitivityFileManager:

**Dependencies**: flask, flask_cors, subprocess, os, json and 24 more

**Keywords**: import, from, matplotlib, flask, datetime, request, jsonify

## Key Code Sections

### Imports

```
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import subprocess
import os
import json
# ...and 24 more imports
```

### Function: get_sensitivity_calculation_script

```
def get_sensitivity_calculation_script():
    """Get the CFA-b.py script for sensitivity analysis"""
    script_path = os.path.join(SCRIPT_DIR, "Core_calculation_engines", "CFA-b.py")
    if os.path.exists(script_path):
        return script_path
    # ... more lines ...
```

### Function: _get_paths_for_parameter

```
def _get_paths_for_parameter(self, version, param_id, mode="percentage", compare_to_key="S13"):
        """
        Generate standard paths for parameter results.

        Args:
    # ... more lines ...
```

### Function: store_calculation_result

```
def store_calculation_result(self, version, param_id, result_data, mode="percentage", compare_to_key="S13"):
        """
        Store calculation results in the expected location.

        Args:
    # ... more lines ...
```

### Class: SensitivityFileManager:

```
class SensitivityFileManager:
    """
    Manages the storage and retrieval of sensitivity analysis files.
    Integrated directly into the file for self-sufficiency.
    """
    def __init__(self, base_dir):
        self.base_dir = base_dir
    # ... more lines ...
```

## File Info

- **Size**: 173.4 KB
- **Lines**: 4297
- **Complexity**: 28

## Additional Details

### Line Statistics

- Average line length: 39.3 characters
- Longest line: 152 characters
- Number of blank lines: 663

### Content Samples

Beginning:
```
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import su
```

Middle:
```
     param_config (dict): Parameter configuration

    Returns:
        dict: Result data structure

```

End:
```
ze event flags
    reset_execution_pipeline()

    app.run(debug=True, host='127.0.0.1', port=2500)

```


================================================================================
End of file summary
================================================================================
