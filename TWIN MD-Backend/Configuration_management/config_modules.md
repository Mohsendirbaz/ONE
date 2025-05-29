# Config_Modules - Configuration Module Processor

## Architectural Overview

The `config_modules.py` module serves as the configuration module generator in the configuration management pipeline. It processes configuration matrices created by `module1.py` and generates distinct JSON configuration modules for each time interval, effectively creating time-sliced snapshots of the configuration state.

### Position in Architecture
```
formatter.py → module1.py → config_modules.py → Table.py
     ↓              ↓              ↓                ↓
 Sanitizes    Builds Matrix   Creates Modules   Builds Table
```

### Core Purpose
- **Module Generation**: Creates separate configuration modules for each time interval
- **Value Application**: Applies filtered values to base configuration
- **Vector Handling**: Special processing for vector properties (Amount4-7)
- **JSON Serialization**: Outputs configuration modules as JSON files

## Core Features and Functionality

### 1. Filtered Value Parsing
```python
def parse_filtered_values(filtered_values):
    """
    Converts JSON string representation to Python dictionary
    Handles escaped quotes and malformed JSON
    """
```
- Robust JSON parsing with error handling
- Fixes common JSON formatting issues (double-double quotes)
- Returns empty list on parse failure to prevent crashes

### 2. Value Type Conversion
```python
def strip_value(value):
    """
    Converts string values to appropriate numeric types
    Maintains type safety while enabling proper calculations
    """
```
Type conversion hierarchy:
1. Integer conversion for whole numbers
2. Float conversion for decimals
3. String preservation for non-numeric values
4. Pass-through for non-string types

### 3. Vector Index Extraction
```python
def find_index_from_id(fv_id):
    """
    Extracts numeric index from property IDs
    Converts to 0-based indexing for array access
    """
```
Examples:
- `variableCostsAmount4_1` → index 0
- `amounts_per_unitAmount5_3` → index 2
- Returns None for invalid formats

### 4. Configuration Module Creation
```python
def update_and_save_config_module(config_received, config_matrix_df, results_folder, version):
    """
    Core function that creates configuration modules
    Processes each interval in the configuration matrix
    """
```

Processing steps:
1. Iterate through configuration matrix rows
2. Create new module for each interval
3. Deep copy base configuration attributes
4. Apply filtered values for the interval
5. Handle vector property updates
6. Save as JSON file

## Data Structures and Processing Logic

### Input Data Structure
Configuration matrix from `module1.py`:
```csv
start,end,length,filtered_values
1,5,5,"[{""id"":""plantLifetimeAmount10"",""value"":25,""remarks"":""User defined""}]"
5,10,5,"[{""id"":""bECAmount11"",""value"":1500000,""remarks"":""Updated value""}]"
```

### Module Structure
Each configuration module contains:
```python
{
    "plantLifetimeAmount10": 25,
    "bECAmount11": 1000000,
    "numberOfUnitsAmount12": 5,
    "variable_costsAmount4": [100, 200, 300, ...],
    "amounts_per_unitAmount5": [10, 20, 30, ...],
    "variable_RevAmount6": [1000, 2000, 3000, ...],
    "amounts_per_unitRevAmount7": [50, 100, 150, ...],
    # ... other properties
}
```

### Vector Property Processing
Special handling for four vector properties:
1. **variable_costsAmount4**: Variable costs array
2. **amounts_per_unitAmount5**: Per-unit amounts array
3. **variable_RevAmount6**: Revenue quantities array
4. **amounts_per_unitRevAmount7**: Revenue prices array

Update logic:
```python
if 'Amount4' in fv_id:
    vector_to_update = getattr(config_module, 'variable_costsAmount4', None)
    if vector_to_update is not None:
        index = find_index_from_id(fv_id)
        if index is not None and 0 <= index < len(vector_to_update):
            vector_to_update[index] = value
```

## Integration with Other Configuration Components

### Dependencies

1. **module1.py Output**:
   - Reads: `General_Configuration_Matrix({version}).csv`
   - Contains intervals and filtered values

2. **Base Configuration**:
   - Reads: `configurations({version}).py`
   - Python module with default configuration values

3. **Directory Structure**:
   ```
   Original/
   └── Batch({version})/
       ├── ConfigurationPlotSpec({version})/
       │   └── configurations({version}).py
       └── Results({version})/
           ├── General_Configuration_Matrix({version}).csv
           └── {version}_config_module_{start_year}.json  # Output
   ```

### Output Files
Creates JSON files named: `{version}_config_module_{start_year}.json`
- One file per interval in the configuration matrix
- Start year indicates when the configuration becomes active
- Contains complete configuration state for that time period

## Usage Patterns

### Command Line Execution
```bash
python config_modules.py [version]
# Example: python config_modules.py 1
```

### Programmatic Usage
```python
from config_modules import update_and_save_config_module
import pandas as pd

# Load configuration matrix
config_matrix_df = pd.read_csv(f"General_Configuration_Matrix({version}).csv")

# Process and save modules
update_and_save_config_module(config_received, config_matrix_df, results_folder, version)
```

### Module Import Pattern
```python
# Dynamically import base configuration
spec = importlib.util.spec_from_file_location("config", config_file)
config_received = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config_received)
```

## Best Practices

### 1. Configuration Integrity
- Always use deep copy when creating new modules to prevent cross-contamination
- Verify base configuration exists before processing
- Validate vector indices before updating

### 2. Error Handling
- Gracefully handle JSON parsing errors
- Log all configuration updates for audit trail
- Continue processing even if individual updates fail

### 3. File Management
```python
def ensure_clean_directory(file_path):
    """Best practice for file operations"""
    # Create directory if needed
    # Remove existing file to prevent append issues
```

### 4. Vector Property Management
- Verify vector bounds before updating
- Log out-of-bounds access attempts
- Maintain consistent vector sizes across modules

### 5. Performance Optimization
- Process modules sequentially to manage memory
- Use JSON streaming for large configurations
- Clean up module objects after saving

## Common Issues and Solutions

### JSON Parsing Errors
**Issue**: "Error parsing filtered_values"
**Solution**: Check for properly escaped quotes in the CSV file

### Missing Base Configuration
**Issue**: "Config file not found"
**Solution**: Ensure formatter.py has created the base configuration file

### Vector Index Out of Bounds
**Issue**: "Index X for Amount4 is out of bounds"
**Solution**: Verify vector initialization size matches expected indices

### Module Attribute Errors
**Issue**: "AttributeError: module has no attribute X"
**Solution**: Check base configuration contains all required properties

## Extension Points

### Adding New Vector Properties
1. Add vector initialization in base configuration
2. Add handling in the vector update section:
   ```python
   elif 'Amount8' in fv_id:
       vector_to_update = getattr(config_module, 'new_vectorAmount8', None)
       # ... update logic
   ```
3. Update index extraction logic if needed

### Custom Module Formats
- Modify the module-to-dictionary conversion
- Add custom serialization for special data types
- Implement module validation before saving

### Enhanced Filtering
- Add support for conditional value application
- Implement value interpolation between intervals
- Create module inheritance chains

## Performance Considerations

### Memory Management
- Each module is processed independently
- Deep copying prevents memory reference issues
- Modules are garbage collected after saving

### File I/O Optimization
- Directory creation is checked once
- Files are removed before writing to prevent corruption
- JSON files use indentation for readability

### Logging Strategy
- Info level for successful operations
- Error level for failures
- Detailed logging for vector updates

## Module Lifecycle

1. **Initialization**: Load base configuration and matrix
2. **Iteration**: Process each interval in the matrix
3. **Creation**: Build new module with deep-copied attributes
4. **Update**: Apply filtered values and vector updates
5. **Serialization**: Convert to dictionary and save as JSON
6. **Cleanup**: Module object is released

This lifecycle ensures clean separation between intervals and prevents configuration bleed-through.