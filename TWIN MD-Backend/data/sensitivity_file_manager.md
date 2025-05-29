# sensitivity_file_manager.py

## Overview

Sensitivity File Manager Module

This module contains the SensitivityFileManager class for managing
the storage and retrieval of sensitivity analysis files.

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/data/sensitivity_file_manager.py`

## Dependencies

- `filelock`
- `json`
- `logging`
- `os`
- `pathlib`
- `pickle`
- `shutil`
- `tempfile`
- `typing`

## Classes

### SensitivityFileManager

Manages the storage and retrieval of sensitivity analysis files.

#### Methods

- **`__init__(self, base_dir)`**
- **`store_calculation_result(self, version, param_id, result_data, mode, compare_to_key)`**
  - Store calculation results in the expected location.
- **`retrieve_calculation_result(self, version, param_id, mode, compare_to_key)`**
  - Retrieve calculation results from the expected location.
- **`store_datapoints(self, version, datapoints_data)`**
  - Store sensitivity datapoints for plotting.

## Usage

```python
from backend.data.sensitivity_file_manager import ...
```

## Integration Notes

- This module can be imported and used as needed
