# config_operations.py - Configuration Management Module

## Architectural Overview

The config_operations module provides centralized configuration management functionality for the CFA calculation system. It handles the loading and processing of configuration data from both JSON files and Python modules, serving as the configuration layer for all calculation operations.

### Core Responsibilities
- JSON configuration file reading
- Python module dynamic loading
- Configuration object instantiation
- Path resolution for configuration files

## Core Functions

### `read_config_module(file_path)`

**Purpose**: Reads and parses JSON configuration module files.

**Parameters**:
- `file_path` (str): Absolute path to the JSON configuration file

**Returns**:
- Dictionary containing the parsed JSON configuration data

**Implementation**:
```python
def read_config_module(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)
```

**Usage Example**:
```python
config_module = read_config_module("/path/to/version_config_module_1.json")
numberOfUnits = config_module['numberOfUnitsAmount12']
```

### `load_configuration(version, code_files_path)`

**Purpose**: Dynamically loads Python configuration modules for a specific version.

**Parameters**:
- `version` (int/str): Version identifier for the configuration
- `code_files_path` (str): Base path to the code files directory

**Returns**:
- Loaded Python module object with configuration attributes

**Implementation Details**:
1. Constructs the configuration file path using version and base path
2. Uses `importlib.util` for dynamic module loading
3. Creates module specification and executes the module
4. Returns the fully loaded configuration module

**Path Construction**:
```
{code_files_path}/Batch({version})/ConfigurationPlotSpec({version})/configurations({version}).py
```

## Data Flow and Integration

### Configuration File Types

1. **JSON Module Files** (`{version}_config_module_{period}.json`)
   - Period-specific configurations
   - Contains operational parameters
   - Read using `read_config_module()`

2. **Python Configuration Files** (`configurations({version}).py`)
   - Main version configuration
   - Contains global parameters
   - Loaded using `load_configuration()`

### Configuration Parameters

#### JSON Module Parameters (Period-Specific)
- `numberOfUnitsAmount12`: Production units
- `initialSellingPriceAmount13`: Base selling price
- `generalInflationRateAmount23`: Inflation rate
- `use_direct_operating_expensesAmount18`: Expense calculation mode
- `totalOperatingCostPercentageAmount14`: Direct cost percentage
- `variable_costsAmount4`: Variable cost array
- `amounts_per_unitAmount5`: Per-unit amounts
- `rawmaterialAmount34`: Raw material costs
- `laborAmount35`: Labor costs
- `utilityAmount36`: Utility costs
- `maintenanceAmount37`: Maintenance costs
- `insuranceAmount38`: Insurance costs

#### Python Module Attributes (Global)
- `plantLifetimeAmount10`: Total plant lifetime
- `numberofconstructionYearsAmount28`: Construction period
- `bECAmount11`: Base Equipment Cost
- `engineering_Procurement_and_Construction_EPC_Amount15`: EPC factor
- `process_contingency_PC_Amount16`: Process contingency
- `project_Contingency_PT_BEC_EPC_PCAmount17`: Project contingency
- `stateTaxRateAmount32`: State tax rate
- `federalTaxRateAmount33`: Federal tax rate
- `iRRAmount30`: Internal Rate of Return

## Integration with CFA System

### Usage in Main Calculation Flow

1. **Version Configuration Loading**
   ```python
   config_received = load_configuration(version, code_files_path)
   ```

2. **Period Configuration Reading**
   ```python
   for idx, row in config_matrix_df.iterrows():
       config_module_file = f"{version}_config_module_{row['start']}.json"
       config_module = read_config_module(config_module_file)
   ```

### Error Handling

The module includes basic error handling:
- File existence is checked by calling modules
- JSON parsing errors propagate to caller
- Module loading exceptions handled by importlib

## Performance Considerations

### Optimization Strategies
1. **Single Load**: Configuration loaded once per version
2. **JSON Parsing**: Efficient built-in JSON parser
3. **Module Caching**: Python caches imported modules

### Memory Management
- Configuration objects kept in memory during calculation
- No intermediate storage or caching
- Direct file-to-memory loading

## Best Practices

### File Organization
```
Original/
├── Batch({version})/
│   ├── ConfigurationPlotSpec({version})/
│   │   └── configurations({version}).py
│   └── Results({version})/
│       ├── {version}_config_module_1.json
│       ├── {version}_config_module_2.json
│       └── ...
```

### Configuration Validation
While not implemented in this module, calling code should:
1. Validate file existence before calling
2. Check required parameters presence
3. Validate parameter ranges
4. Handle missing optional parameters

## Future Enhancements

### Potential Improvements
1. **Schema Validation**: Add JSON schema validation
2. **Caching Layer**: Cache frequently accessed configurations
3. **Configuration Merging**: Support configuration inheritance
4. **Type Checking**: Add type hints and validation
5. **Async Loading**: Support asynchronous configuration loading

### Extended Configuration Support
```python
def load_configuration_with_defaults(version, code_files_path, defaults=None):
    """Load configuration with default value support"""
    
def validate_configuration(config_module, schema):
    """Validate configuration against schema"""
    
def merge_configurations(base_config, override_config):
    """Merge two configuration objects"""
```

## Security Considerations

### Current Implementation
- Trusts file paths provided by caller
- No sanitization of configuration values
- Direct execution of Python modules

### Recommended Practices
1. Validate file paths before passing
2. Restrict configuration directory access
3. Sanitize configuration values
4. Consider sandboxed execution for Python modules
5. Implement configuration signing/verification