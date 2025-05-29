# Table Module (Updated) - Configuration Table Generator

## Overview
The `table-updated.py` module is responsible for building comprehensive tables of configuration properties from multiple configuration modules. It reads JSON configuration modules created by `config_modules.py` and combines them into a single time-series table showing how property values change over time.

## Core Functionality

### Main Purpose
The module consolidates configuration data from multiple time intervals into a single comprehensive table, enabling easy analysis of configuration changes over the project lifetime.

### Key Features
1. **Module Loading**: Loads all configuration modules for a specific version
2. **Property Extraction**: Extracts properties including vector properties from modules
3. **Vector Expansion**: Expands vector properties into individual numbered items
4. **Time-Series Table**: Creates tables with years as rows and properties as columns
5. **Forward Filling**: Ensures value continuity by forward-filling missing values
6. **Property Mapping**: Applies human-readable names to technical property IDs

## Main Functions

### `expand_vector_properties(properties, prop_name, vector)`
Expands vector properties into individual numbered properties.

**Parameters:**
- `properties` (list): List of property dictionaries to append to
- `prop_name` (str): Name of the property
- `vector` (list): List of values to expand

**Returns:**
- list: Updated properties list with expanded vector items

### `collect_properties_from_config_module(config_module)`
Extracts all properties from a configuration module.

**Parameters:**
- `config_module` (dict): Configuration module dictionary from JSON

**Returns:**
- list: List of dictionaries with 'Property Name' and 'Value' keys

### `load_config_modules(results_folder, version)`
Loads all configuration modules from the results folder.

**Parameters:**
- `results_folder` (str or Path): Path to folder containing module files
- `version` (str or int): Version number to filter files

**Returns:**
- list: List of tuples (start_year, config_module) sorted by year

### `build_and_save_table(version)`
Main function that builds and saves the configuration table.

**Parameters:**
- `version` (str or int): Version number for the configuration

**Returns:**
- dict: Result status with file path or error message

### `create_table_api()`
Creates a Flask API for the Table module.

**Returns:**
- Flask app: Application with table endpoints

## Data Processing Flow

1. **Load Modules**: Scan results folder for `{version}_config_module_*.json` files
2. **Extract Start Years**: Parse start year from each filename
3. **Collect Properties**: Extract all properties from first module to define columns
4. **Create DataFrame**: Initialize table with years as rows, properties as columns
5. **Fill Values**: Populate table with values from each configuration module
6. **Forward Fill**: Fill missing values to ensure continuity
7. **Export CSV**: Save the complete table as `Variable_Table({version}).csv`

## Vector Property Handling

The module specially handles four vector types:
- **variable_costsAmount4**: Expands to "Variable Costs_1" through "Variable Costs_10"
- **amounts_per_unitAmount5**: Expands to "Amounts Per Unit_1" through "Amounts Per Unit_10"
- **variable_RevAmount6**: Expands to "Variable Rev_1" through "Variable Rev_10"
- **amounts_per_unitRevAmount7**: Expands to "Amounts Per Unit Rev_1" through "Amounts Per Unit Rev_10"

### Matrix-Based Values
Also handles special matrix-based form values:
- **vAmount properties**: Maps to readable names (e.g., vAmount40 → "v40")
- **rAmount properties**: Maps to readable names (e.g., rAmount60 → "r60")

## Property Mapping
Extensive mapping dictionary converts technical IDs to human-readable names:
```python
"plantLifetimeAmount10": "Plant Lifetime"
"bECAmount11": "Bare Erected Cost"
"numberOfUnitsAmount12": "Number of Units"
# ... and many more
```

## File Structure

### Input Directory
`Original/Batch({version})/Results({version})/`

### Input Files
`{version}_config_module_{start_year}.json`

### Output File
`Original/Batch({version})/Results({version})/Variable_Table({version}).csv`

### Output Format
```csv
Year,Plant Lifetime,Bare Erected Cost,Variable Costs_1,...
1,20,1000000,100,...
2,20,1000000,100,...
...
```

## Table Structure

### Rows
- Years from 1 to plant lifetime
- Each row represents configuration values for that year

### Columns
- All configuration properties including:
  - Standard properties (mapped to readable names)
  - Expanded vector properties (numbered items)
  - Matrix-based form values

### Value Propagation
- Values from each configuration module are placed at their start year
- Forward filling ensures values persist until changed
- Missing values are filled with previous year's values

## Error Handling
- Module loading errors
- JSON parsing errors
- File I/O errors
- All errors are logged to `Table.log`

## Logging
- Log file: `Table.log` (overwritten each run)
- Simple message format without timestamps
- Tracks module loading and table creation

## API Mode
When run with "server" argument:
```bash
python table-updated.py <version> server
```

**Endpoint:**
- `GET /table/<version>`: Builds table for specified version

## Integration Points
- **Input**: JSON configuration modules from `config-modules-updated.py`
- **Output**: CSV table for analysis and reporting
- **Dependencies**: pandas, json, logging

## Usage Examples

### Command Line
```bash
# Build table for version 1
python table-updated.py 1

# Start as API server
python table-updated.py 1 server
```

### Python Import
```python
from table_updated import build_and_save_table

result = build_and_save_table(version=1)
if "error" in result:
    print(f"Error: {result['error']}")
else:
    print(f"Success: Table saved to {result['file']}")
```

## Notes
- Uses pandas with future behavior settings to avoid deprecation warnings
- Automatically creates results folder if it doesn't exist
- Provides comprehensive view of configuration changes over time
- Essential for tracking how configuration evolves throughout project lifetime