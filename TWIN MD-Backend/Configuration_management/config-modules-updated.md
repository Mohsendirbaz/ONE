# Config Modules Updated - Configuration Module Processor

## Overview
This module (`config-modules-updated.py`) is responsible for processing configuration matrices and creating distinct configuration modules for different time intervals. It serves as a critical component in the matrix-based form values system, transforming configuration data from CSV matrices into JSON configuration files.

## Core Functionality

### Main Purpose
The module reads configuration data from matrices created by `module1.py` and generates JSON configuration files for each time interval with appropriately filtered values.

### Key Features
1. **Matrix Processing**: Reads configuration matrices from CSV files
2. **Interval-Based Configuration**: Creates distinct configuration modules for each time interval
3. **Value Filtering**: Processes filtered values for each interval
4. **Vector Value Handling**: Special handling for vector values (Amount4, Amount5, Amount6, Amount7)
5. **JSON Export**: Saves configuration modules as JSON files

## Main Functions

### `parse_filtered_values(filtered_values)`
Parses a filtered_values string into a Python dictionary.

**Parameters:**
- `filtered_values` (str): JSON string representation of filtered values

**Returns:**
- list or dict: Parsed filtered values as a Python object (empty list if parsing fails)

### `strip_value(value)`
Strips quotes from numeric values and converts them to appropriate types.

**Parameters:**
- `value` (str or other): The value to process

**Returns:**
- int, float, or original type: Converted value if possible, otherwise original value

### `find_index_from_id(fv_id)`
Extracts the numeric index from an ID string for vector mapping.

**Parameters:**
- `fv_id` (str): ID string containing a numeric part

**Returns:**
- int or None: 0-based index extracted from the ID

### `ensure_clean_directory(file_path)`
Ensures the directory exists and removes existing files before saving.

**Parameters:**
- `file_path` (str): Full path to the file to be saved

### `update_and_save_config_module(config_received, config_matrix_df, results_folder, version)`
The core function that updates configuration modules with filtered values and saves them as JSON files.

**Parameters:**
- `config_received`: Base configuration object with default values
- `config_matrix_df` (DataFrame): DataFrame containing configuration matrix data
- `results_folder` (str): Path to the folder where results will be saved
- `version` (str or int): Version number for the configuration

## Special Handling

### Vector Values
The module provides special handling for vector values:
- **variable_costsAmount4**: Variable costs vector (Amount4)
- **amounts_per_unitAmount5**: Per-unit amounts vector (Amount5)
- **variable_RevAmount6**: Variable revenue vector (Amount6)
- **amounts_per_unitRevAmount7**: Per-unit revenue amounts vector (Amount7)

### Matrix Field Mapping
- **vAmount fields**: Maps to variableCostsAmount4 vector (e.g., vAmount40 → index 0)
- **rAmount fields**: Maps to amounts_per_unitAmount5 vector (e.g., rAmount60 → index 0)

## Data Flow
1. Reads configuration matrix from CSV
2. Iterates through each time interval row
3. Parses filtered values from JSON strings
4. Creates distinct configuration module for each interval
5. Updates module attributes based on filtered values
6. Handles special vector value updates
7. Saves configuration as JSON file

## Error Handling
- JSON parsing errors are caught and logged
- Index out of bounds errors are handled gracefully
- General exceptions are caught, logged, and re-raised

## Logging
The module uses Python's logging module to track operations:
- Log file: `config_modules.log`
- Logs successful updates and errors
- Console output for debugging

## Integration Points
- **Input**: Configuration matrices from `module1.py`
- **Output**: JSON configuration files for each time interval
- **Dependencies**: pandas, json, importlib, logging

## Usage Example
```python
# Read configuration matrix
config_matrix_df = pd.read_csv('config_matrix.csv')

# Update and save configuration modules
update_and_save_config_module(
    config_received=base_config,
    config_matrix_df=config_matrix_df,
    results_folder='./results',
    version='v1'
)
```

## Notes
- Skips "Default entry" remarks to avoid overriding with default values
- Creates deep copies of configuration objects to prevent cross-interval contamination
- Supports both legacy and new ID formats for vector indexing