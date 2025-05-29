# locking_utils.py

## Overview

Locking Utilities Module

This module contains utility functions for locking operations.

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/utils/locking_utils.py`

## Dependencies

- `filelock`
- `flask`
- `functools`
- `logging`
- `threading`
- `typing`

## Constants

- `PIPELINE_ACTIVE`
- `PAYLOAD_REGISTERED`
- `BASELINE_COMPLETED`
- `CONFIG_COMPLETED`
- `RUNS_COMPLETED`
- `SENSITIVITY_COMPLETED`
- `VISUALIZATION_COMPLETED`
- `GLOBAL_PAYLOAD_LOCK`
- `GLOBAL_BASELINE_LOCK`
- `GLOBAL_CONFIG_LOCK`
- `GLOBAL_RUN_LOCK`
- `GLOBAL_SENSITIVITY_LOCK`
- `GLOBAL_VISUALIZE_LOCK`
- `PAYLOAD_LOCK_FILE`
- `BASELINE_LOCK_FILE`
- `CONFIG_LOCK_FILE`
- `RUN_LOCK_FILE`
- `SENSITIVITY_LOCK_FILE`
- `VISUALIZATION_LOCK_FILE`

## Functions

### `with_file_lock(lock_file_path, operation_name)`

Decorator to create a file lock for the decorated function

Args:
    lock_file_path (str): Path to the lock file
    operation_name (str): Name of the operation for error messages
    
Returns:
    Callable: Decorated function

### `with_memory_lock(lock_obj, operation_name)`

Decorator to apply a threading lock for the decorated function

Args:
    lock_obj (threading.Lock): Lock object
    operation_name (str): Name of the operation for error messages
    
Returns:
    Callable: Decorated function

### `with_pipeline_check(required_event, next_event, operation_name)`

Decorator to check pipeline status and validate required events

Args:
    required_event (threading.Event, optional): Event that must be set before function execution
    next_event (threading.Event, optional): Event to set after successful function execution
    operation_name (str): Name of the operation for error messages
    
Returns:
    Callable: Decorated function

### `reset_pipeline_state()`

Reset all pipeline events to their initial state

### `initialize_pipeline()`

Initialize the pipeline by setting the PIPELINE_ACTIVE event

### `get_pipeline_status()`

Get the current status of all pipeline events

Returns:
    dict: Status of all pipeline events

## Usage

```python
from backend.utils.locking_utils import ...
```

## Integration Notes

- Provides utility functions for other modules
- Import as needed for common operations
