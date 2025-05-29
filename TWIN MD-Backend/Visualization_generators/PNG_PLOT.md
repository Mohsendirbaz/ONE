# PNG_PLOT.py

## Overview

This module provides functionality for data visualization and plotting.

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/Visualization_generators/PNG_PLOT.py`

## Dependencies

- `Utility_functions`
- `json`
- `logging`
- `matplotlib`
- `numpy`
- `os`
- `pandas`
- `pathlib`
- `shutil`
- `sys`

## Constants

- `BACKEND_DIR`
- `PUBLIC_DIR`
- `LOG_DIR`

## Functions

### `save_to_csv(data, filename)`

Function to save to csv.

### `parse_versions(versions_str)`

Function to parse versions.

### `parse_properties(properties_str)`

Function to parse properties.

### `extract_customized_features(filtered_value_intervals_file, include_customized_features, include_in_remarks)`

Function to extract customized features.

### `prepare_version_directory(directory)`

Function to prepare version directory.

### `format_number(value, prop_id)`

Function to format number.

### `extract_selected_properties(config_file, selected_properties, include_in_remarks)`

Function to extract selected properties.

### `get_colors_and_markers(num_versions)`

Get colors and markers for plotting.

### `plot_aggregated(datasets, title, xlabel, ylabel, filename, title_font, axis_font, legend_font, title_size, label_size)`

Function to plot aggregated.

## Usage

```python
from backend.Visualization_generators.PNG_PLOT import ...
```

## Integration Notes

- This module can be imported and used as needed
