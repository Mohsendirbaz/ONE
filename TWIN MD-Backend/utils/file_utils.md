# file_utils.py

## Overview

File Utilities Module

This module contains utility functions for file operations.

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/utils/file_utils.py`

## Dependencies

- `filelock`
- `json`
- `logging`
- `os`
- `pathlib`
- `pickle`
- `tempfile`
- `typing`

## Functions

### `atomic_read_json(filepath)`

Thread-safe reading of JSON file

Args:
    filepath (str): Path to the JSON file
    
Returns:
    dict: The JSON data or None if file doesn't exist

### `atomic_write_json(filepath, data)`

Thread-safe writing of JSON file

Args:
    filepath (str): Path to the JSON file
    data (dict): The data to write

### `atomic_read_pickle(filepath)`

Thread-safe reading of pickle file

Args:
    filepath (str): Path to the pickle file
    
Returns:
    Any: The unpickled data or None if file doesn't exist

### `atomic_write_pickle(filepath, data)`

Thread-safe writing of pickle file

Args:
    filepath (str): Path to the pickle file
    data (Any): The data to write

### `safe_json_dump(data, file_path)`

Safely write JSON data to a file with error handling

Args:
    data: The data to serialize to JSON
    file_path: Path to the output file
    
Returns:
    bool: True if successful, False on error

### `ensure_directory_exists(directory_path)`

Ensure the specified directory exists, creating it if necessary

Args:
    directory_path: Path to the directory

## Usage

```python
from backend.utils.file_utils import ...
```

## Integration Notes

- Provides utility functions for other modules
- Import as needed for common operations
