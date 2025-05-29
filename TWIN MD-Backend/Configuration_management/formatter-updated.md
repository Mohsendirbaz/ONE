# Formatter Module (Updated) - Configuration File Processor

## Overview
The `formatter-updated.py` module is responsible for processing and sanitizing configuration files in the matrix-based form values system. It reads raw configuration data, processes it into a standardized format, and writes sanitized configuration files that can be used by other modules in the system.

## Core Functionality

### Main Purpose
The module handles the transformation of raw configuration data from matrix-based form values into properly formatted and sanitized configuration files, ensuring data consistency and type safety.

### Key Features
1. **Matrix-Based Processing**: Handles new matrix-based format with efficacy periods
2. **Legacy Format Support**: Falls back to medieval parsing for older formats
3. **Type Conversion**: Automatically converts values to appropriate types (int, float, bool, string)
4. **Vector Processing**: Special handling for Amount4, Amount5, Amount6, and Amount7 vectors
5. **JSON Output**: Generates filtered values in JSON format for downstream processing

## Main Functions

### `check_write_permissions(directory)`
Verifies write permissions for the target directory.

**Parameters:**
- `directory` (Path or str): Directory path to check

**Output:**
- Prints permission status to console

### `format_value(value, quote=True)`
Formats values according to configuration requirements.

**Parameters:**
- `value`: The value to format
- `quote`: Boolean indicating if the value should be quoted

**Returns:**
- Formatted value as string

### `process_matrix_filtered_values(content)`
Processes filtered values from the new matrix-based form values format.

**Parameters:**
- `content` (str): Raw matrix-based filtered values content

**Returns:**
- tuple: (sanitized_lines, filtered_values_json)

### `medieval_parse_and_sanitize(content)`
Legacy parser for processing configuration content using string manipulation.

**Parameters:**
- `content` (str): Raw configuration content

**Returns:**
- tuple: (sanitized_lines, filtered_values_json)

### `sanitize_file(version)`
Main entry point that processes and sanitizes configuration files for a specific version.

**Parameters:**
- `version` (str or int): Version number for configuration processing

**Returns:**
- dict: Result status with either success message or error

### `create_formatter_api()`
Creates a Flask API for the formatter module.

**Returns:**
- Flask app: Application with formatter endpoints

## Data Processing Flow

### Matrix-Based Format Processing
1. Parse JSON content
2. Extract filtered values with properties (id, value, start, end, remarks)
3. Convert values to appropriate types
4. Handle vector assignments for special properties
5. Generate sanitized configuration lines

### Legacy Format Processing ("Medieval")
1. Extract filteredValues array using string search
2. Parse individual values and IDs
3. Handle special cases (booleans, vectors)
4. Process filteredValue entries with regex
5. Generate output with proper formatting

## Vector Handling

The module processes four special vector types:
- **variable_costsAmount4**: Variable costs (10 elements)
- **amounts_per_unitAmount5**: Per-unit amounts (10 elements)
- **variable_RevAmount6**: Revenue quantities (10 elements)
- **amounts_per_unitRevAmount7**: Revenue prices (10 elements)

### Vector Assignment Logic
- Extracts index from ID (e.g., `variableCostsAmount4_1` → index 0)
- Fills vector slots sequentially for legacy format
- Maintains None values for empty slots

## File Structure

### Input File
`Original/Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py`

### Output File
`Original/Batch({version})/ConfigurationPlotSpec({version})/configurations({version}).py`

### Output Format
```python
# Sanitized configuration lines
parameter1='value1'
parameter2=123
parameter3=True

# Vector values
variable_costsAmount4=[100, 200, None, None, ...]
amounts_per_unitAmount5=[10, 20, 30, None, ...]

# Filtered values JSON
filtered_values_json=[
    '{"filteredValue":{"id":"param1","value":"val1","start":"0","end":"20","remarks":""}}',
    ...
]
```

## Error Handling
- Directory creation errors
- File reading/writing errors
- JSON parsing errors (falls back to legacy parser)
- Value conversion errors (keeps original value)

## API Mode
When run with "server" argument, the module starts a Flask server on port 3050:

```bash
python formatter-updated.py <version> server
```

**Endpoint:**
- `GET /formatter/<version>`: Runs formatter for specified version

## Integration Points
- **Input**: Raw configuration files from matrix-based form submissions
- **Output**: Sanitized configuration files for use by other modules
- **Used By**: `config-modules-updated.py`, calculation engines

## Usage Examples

### Command Line
```bash
# Process version 1 configuration
python formatter-updated.py 1

# Start as API server
python formatter-updated.py 1 server
```

### Python Import
```python
from formatter_updated import sanitize_file

result = sanitize_file(version=1)
if "error" in result:
    print(f"Error: {result['error']}")
else:
    print(f"Success: {result['message']}")
```

## Notes
- The "medieval" parser name reflects the string-based parsing approach used for legacy formats
- Supports both old and new matrix-based configuration formats
- Automatically detects and handles different value types
- Maintains backward compatibility while supporting new features