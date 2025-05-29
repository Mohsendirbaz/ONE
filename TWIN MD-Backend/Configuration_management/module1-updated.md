# Module1 Updated - Configuration Matrix Builder

## Overview
The `module1-updated.py` module is responsible for building configuration matrices from filtered values in the matrix-based form values system. It processes configuration data and creates various matrices and data structures used by other modules in the system.

## Core Functionality

### Main Purpose
The module transforms filtered configuration values into structured matrices that represent configuration changes over time intervals, enabling time-based configuration management.

### Key Features
1. **Matrix Building**: Creates configuration matrices from filtered values
2. **Interval Management**: Handles time-based intervals for configuration changes
3. **Property Mapping**: Applies human-readable names to technical property IDs
4. **Dual Matrix Generation**: Creates both interval-based and year-by-year matrices
5. **CSV Export**: Saves all generated data structures to CSV files

## Main Functions

### `apply_property_mapping(filtered_value_intervals)`
Applies human-readable property names to filtered value intervals.

**Parameters:**
- `filtered_value_intervals` (list): List of tuples containing filtered value intervals

**Returns:**
- list: New list of tuples with IDs replaced by mapped names

**Example:**
```python
# Input: [("plantLifetimeAmount10", 1, 20, 25)]
# Output: [("Plant Lifetime", 1, 20, 25)]
```

### `apply_filtered_values_and_build_matrix(config_received, filtered_values_json)`
Core function that processes filtered values and builds configuration matrices.

**Parameters:**
- `config_received`: Configuration object containing plant lifetime and settings
- `filtered_values_json` (list): List of JSON strings representing filtered values

**Returns:**
- tuple: (config_matrix, sorted_points, filtered_value_intervals, general_config_matrix)

### `empty_folder(folder_path)`
Empties a folder by deleting all its contents while keeping the folder itself.

**Parameters:**
- `folder_path` (str or Path): Path to the folder to be emptied

### `test_list_building(version, config_received)`
Main entry point for building and saving configuration matrices.

**Parameters:**
- `version` (str or int): Version number for the configuration
- `config_received`: Configuration object containing filtered values

**Returns:**
- dict: Result status with file paths or error message

### `create_module1_api()`
Creates a Flask API for the module1 functionality.

**Returns:**
- Flask app: Application with module1 endpoints

## Data Structures

### Config Matrix
Matrix based on actual start/end points of filtered values:
```json
{
    "start": 1,
    "end": 5,
    "length": 5,
    "filtered_values": "[{\"id\": \"param1\", \"value\": 100}]"
}
```

### General Config Matrix
Matrix with continuous year-by-year intervals:
```json
{
    "start": 1,
    "end": 1,
    "length": 1,
    "filtered_values": "[{\"id\": \"param1\", \"value\": 100}]"
}
```

### Filtered Value Intervals
List of configuration changes with their time periods:
```csv
ID,Start,End,Value,Remarks
Plant Lifetime,1,20,25,Default entry
Bare Erected Cost,1,10,1000000,User defined
```

## Property Mapping
The module includes extensive property mapping for better readability:
- Technical IDs → Human-readable names
- Examples:
  - `plantLifetimeAmount10` → "Plant Lifetime"
  - `bECAmount11` → "Bare Erected Cost"
  - `vAmount40` → "v40" (variable costs)
  - `rAmount60` → "r60" (revenue amounts)

## File Structure

### Input
- Configuration file: `Original/Batch({version})/ConfigurationPlotSpec({version})/configurations({version}).py`

### Output Directory
`Original/Batch({version})/Results({version})/`

### Output Files
1. `Configuration_Matrix({version}).csv` - Interval-based matrix
2. `General_Configuration_Matrix({version}).csv` - Year-by-year matrix
3. `Sorted_Points({version}).csv` - Unique time points
4. `Filtered_Value_Intervals({version}).csv` - Human-readable intervals

## Processing Flow

1. **Load Configuration**: Import configuration file for specified version
2. **Extract Filtered Values**: Parse JSON strings to extract configuration values
3. **Identify Time Points**: Extract unique start/end points from all values
4. **Create Intervals**: Build intervals from adjacent time points
5. **Build Matrices**: Populate matrices with filtered values for each interval
6. **Apply Mapping**: Replace technical IDs with human-readable names
7. **Save Results**: Export all data structures to CSV files

## Interval Logic

### Overlap Detection
For each filtered value with period [hs, he] and each interval [start, end]:
- Skip if: `hs > end` OR `he < start`
- Include if: Periods overlap

### Matrix Population
- Config Matrix: Based on unique time points from filtered values
- General Matrix: Year-by-year from 1 to plant lifetime

## Error Handling
- File access errors
- Dynamic import failures
- JSON parsing errors
- All errors are logged and returned in result dictionary

## API Mode
When run with "server" argument:
```bash
python module1-updated.py <version> server
```

**Endpoint:**
- `GET /module1/<version>`: Builds matrices for specified version

## Integration Points
- **Input**: Sanitized configuration files from `formatter-updated.py`
- **Output**: CSV matrices used by `config-modules-updated.py`
- **Dependencies**: pandas, importlib, logging

## Usage Examples

### Command Line
```bash
# Process version 1 configuration
python module1-updated.py 1

# Start as API server
python module1-updated.py 1 server
```

### Python Import
```python
from module1_updated import test_list_building
import importlib.util

# Load configuration
spec = importlib.util.spec_from_file_location("config", "config_file.py")
config = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config)

# Build matrices
result = test_list_building(version=1, config_received=config)
```

## Notes
- The module cleans the results folder before writing new files
- Supports both legacy format and new matrix-based format
- Maintains backward compatibility while adding new features
- Logs all operations for debugging and audit purposes