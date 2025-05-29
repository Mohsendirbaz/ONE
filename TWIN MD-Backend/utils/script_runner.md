# script_runner.py

## Overview

Script Runner Module

This module contains utility functions for running scripts.

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/utils/script_runner.py`

## Dependencies

- `filelock`
- `json`
- `logging`
- `os`
- `shutil`
- `subprocess`
- `tempfile`
- `threading`
- `typing`

## Functions

### `run_script(script_name)`

Thread-safe script execution with proper error handling

Args:
    script_name (str): Path to the script to run
    *args: Arguments to pass to the script
    script_type (str): Type of script ('python' or 'Rscript')
    
Returns:
    Tuple[bool, Optional[str]]: (success, error_message)

### `process_version(version, calculation_script, selected_v, selected_f, target_row, calculation_option, sen_parameters, common_scripts)`

Thread-safe version processing with proper locking

Args:
    version (str): Version number
    calculation_script (str): Path to the calculation script
    selected_v (dict): Selected V parameters
    selected_f (dict): Selected F parameters
    target_row (dict): Target row
    calculation_option (str): Calculation option
    sen_parameters (dict): Sensitivity parameters
    common_scripts (List[str], optional): List of common scripts to run
    
Returns:
    Optional[str]: Error message if any, None if successful

### `create_sensitivity_directories(version, sen_parameters, base_dir)`

Thread-safe directory creation with proper locking

Args:
    version (str): Version number
    sen_parameters (dict): Sensitivity parameters
    base_dir (str): Base directory
    
Returns:
    Tuple[str, str]: (sensitivity_dir, reports_dir)

## Usage

```python
from backend.utils.script_runner import ...
```

## Integration Notes

- This module can be imported and used as needed
