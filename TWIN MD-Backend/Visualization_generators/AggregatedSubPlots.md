# AggregatedSubPlots.py

## Overview

This module provides functionality for data visualization and plotting.

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/Visualization_generators/AggregatedSubPlots.py`

## Dependencies

- `json`
- `logging`
- `numpy`
- `os`
- `pandas`
- `pathlib`
- `re`
- `sys`

## Constants

- `BACKEND_DIR`
- `ORIGINAL_DIR`
- `LOGS_DIR`

## Functions

### `parse_versions(versions_str)`

Convert comma-separated version string to list of integers

### `parse_properties(properties_str)`

Convert comma-separated properties string to list of strings

### `preprocess_json_string(json_str)`

Remove redundant double quotes from JSON string

### `format_number(value, prop_id)`

Format numeric values based on property type

Args:
    value: The numeric value to format
    prop_id: The property ID to determine formatting rules

Returns:
    Formatted string representation of the value

### `extract_selected_properties(config_file, selected_properties, include_remarks)`

Extract selected properties from U_configurations file

Args:
    config_file: Path to the configuration file
    selected_properties: List of property IDs to extract
    include_remarks: Whether to include remarks in the output

Returns:
    Tuple of (version_headers, properties list)

### `sanitize_for_html(text)`

Sanitize text for safe inclusion in HTML

Args:
    text: The text to sanitize

Returns:
    Sanitized text safe for HTML inclusion

### `extract_hover_text(filtered_values_str, include_remarks, customized_features)`

Extract hover text from filtered values string

Args:
    filtered_values_str: JSON string containing filtered values
    include_remarks: Whether to include remarks in hover text
    customized_features: Whether customized features are enabled

Returns:
    HTML-formatted hover text or None if customized features are disabled and remarks not included

### `combine_hover_texts(interval_hover_text_CF, interval_hover_text_SP)`

Combine hover texts from configuration matrix and selected properties

Args:
    interval_hover_text_CF: Hover text from configuration matrix
    interval_hover_text_SP: Hover text from selected properties

Returns:
    Combined hover text with HTML formatting

### `sanitize_filename(filename)`

Sanitize a filename to ensure it's valid across platforms

Args:
    filename: The filename to sanitize

Returns:
    Sanitized filename safe for use in file paths

### `save_html_content(html_content, metric_name, version, versions_identifier)`

Save the HTML content in both Results(versions_identifier) and Results(version) folders.

Args:
    html_content: The HTML content to save
    metric_name: The name of the metric (used in file naming)
    version: The version number
    versions_identifier: String identifier for the combination of versions

Returns:
    bool: True if successful, False if any errors occurred

## Usage

```python
from backend.Visualization_generators.AggregatedSubPlots import ...
```

## Integration Notes

- This module can be imported and used as needed
