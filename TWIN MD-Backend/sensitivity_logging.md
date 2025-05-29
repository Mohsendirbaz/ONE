# sensitivity_logging.py

## Overview

Logging module for sensitivity analysis.

This module provides specialized logging functions for sensitivity analysis,
helping to track the workflow and debug issues.

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/sensitivity_logging.py`

## Dependencies

- `functools`
- `json`
- `logging`
- `os`
- `time`

## Constants

- `LOGS_DIR`
- `SENSITIVITY_LOG_PATH`

## Functions

### `log_execution_flow(stage, message)`

Log execution flow with stage information.

Args:
    stage (str): Stage of execution (e.g., 'enter', 'exit', 'checkpoint', 'error')
    message (str): Log message

### `log_plot_generation_start(param_id, compare_to_key, plot_type, mode)`

Log the start of plot generation.

Args:
    param_id (str): Parameter ID (e.g., 'S34')
    compare_to_key (str): Parameter to compare against (e.g., 'S13')
    plot_type (str): Type of plot (e.g., 'waterfall', 'bar', 'point')
    mode (str): Analysis mode (e.g., 'symmetrical', 'multiple')

### `log_plot_generation_complete(param_id, compare_to_key, plot_type, mode, plot_path)`

Log the completion of plot generation.

Args:
    param_id (str): Parameter ID (e.g., 'S34')
    compare_to_key (str): Parameter to compare against (e.g., 'S13')
    plot_type (str): Type of plot (e.g., 'waterfall', 'bar', 'point')
    mode (str): Analysis mode (e.g., 'symmetrical', 'multiple')
    plot_path (str): Path to the generated plot

### `log_plot_generation_error(param_id, compare_to_key, plot_type, mode, error_msg)`

Log an error during plot generation.

Args:
    param_id (str): Parameter ID (e.g., 'S34')
    compare_to_key (str): Parameter to compare against (e.g., 'S13')
    plot_type (str): Type of plot (e.g., 'waterfall', 'bar', 'point')
    mode (str): Analysis mode (e.g., 'symmetrical', 'multiple')
    error_msg (str): Error message

### `log_plot_data_loading(param_id, compare_to_key, data_path, success, error_msg)`

Log the loading of plot data.

Args:
    param_id (str): Parameter ID (e.g., 'S34')
    compare_to_key (str): Parameter to compare against (e.g., 'S13')
    data_path (str): Path to the data file
    success (bool): Whether the data loading was successful
    error_msg (str, optional): Error message if loading failed

### `log_plot_data_processing(param_id, compare_to_key, success, error_msg)`

Log the processing of plot data.

Args:
    param_id (str): Parameter ID (e.g., 'S34')
    compare_to_key (str): Parameter to compare against (e.g., 'S13')
    success (bool): Whether the data processing was successful
    error_msg (str, optional): Error message if processing failed

### `log_plot_rendering(param_id, compare_to_key, plot_type, success, error_msg)`

Log the rendering of a plot.

Args:
    param_id (str): Parameter ID (e.g., 'S34')
    compare_to_key (str): Parameter to compare against (e.g., 'S13')
    plot_type (str): Type of plot (e.g., 'waterfall', 'bar', 'point')
    success (bool): Whether the rendering was successful
    error_msg (str, optional): Error message if rendering failed

### `log_plot_saving(param_id, compare_to_key, plot_type, plot_path, success, error_msg)`

Log the saving of a plot.

Args:
    param_id (str): Parameter ID (e.g., 'S34')
    compare_to_key (str): Parameter to compare against (e.g., 'S13')
    plot_type (str): Type of plot (e.g., 'waterfall', 'bar', 'point')
    plot_path (str): Path to save the plot
    success (bool): Whether the saving was successful
    error_msg (str, optional): Error message if saving failed

### `plot_generation_operation(func)`

Decorator for plot generation operations.

This decorator logs the start and end of a plot generation operation,
as well as any errors that occur.

Args:
    func: The function to decorate
    
Returns:
    The decorated function

### `log_sensitivity_config_status(status, run_id, version, config_dir, error)`

Log sensitivity configuration status to a JSON file.

Args:
    status (bool): Whether configurations are ready
    run_id (str, optional): Run ID
    version (int, optional): Version number
    config_dir (str, optional): Path to configuration directory
    error (str, optional): Error message if status is False
    
Returns:
    bool: True if logging was successful, False otherwise

### `get_sensitivity_config_status()`

Get sensitivity configuration status from the JSON file.

Returns:
    dict: Status data, or None if file doesn't exist or is invalid

## Usage

```python
from backend.sensitivity_logging import ...
```

## Integration Notes

- This module can be imported and used as needed
