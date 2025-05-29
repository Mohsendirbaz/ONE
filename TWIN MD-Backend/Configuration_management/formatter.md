# Formatter Module - Configuration File Processor

## Architectural Overview

The `formatter.py` module serves as the entry point to the configuration management pipeline, responsible for transforming raw, unprocessed configuration files into sanitized, standardized formats that can be consumed by downstream modules. It acts as a data sanitizer and parser, ensuring configuration data meets the required format specifications.

### Position in Architecture
```
formatter.py → module1.py → config_modules.py → Table.py
     ↓              ↓              ↓                ↓
 Sanitizes    Builds Matrix   Creates Modules   Builds Table
```

### Core Purpose
- **Data Sanitization**: Cleans and standardizes raw configuration input
- **Format Conversion**: Transforms unstructured data into structured format
- **Vector Processing**: Collects and organizes vector property values
- **JSON Generation**: Creates properly formatted filtered values for downstream processing

## Core Features and Functionality

### 1. Permission Verification
```python
def check_write_permissions(directory):
    """
    Verifies write permissions before processing
    Critical for preventing runtime failures
    """
```
- Proactive permission checking prevents file operation failures
- Provides clear error messages for permission issues
- Executes automatically on module load

### 2. Value Formatting
```python
def format_value(value, quote=True):
    """
    Standardizes value formatting for consistency
    Handles quoting requirements for different value types
    """
```
- Ensures consistent string quoting
- Strips whitespace from values
- Configurable quoting behavior

### 3. Medieval Parse and Sanitize
```python
def medieval_parse_and_sanitize(content):
    """
    Core parsing engine using string manipulation
    Named 'medieval' due to archaic but effective approach
    """
```

The function performs comprehensive content processing:

#### Phase 1: FilteredValues Array Processing
```python
# Locates and extracts the filteredValues array
filtered_values_start = content.find('"filteredValues":[')
# Processes each id-value pair within the array
```

#### Phase 2: Value Type Handling
Special cases handled:
- **Boolean values**: Converts `"True"/"False"` strings to Python booleans
- **Vector values**: Strips and preserves numeric values for Amount4-7
- **String values**: Converts double quotes to single quotes for Python compatibility
- **Numeric values**: Converts strings to int/float where appropriate

#### Phase 3: Vector Collection
Manages four 10-element vectors:
```python
variable_costsAmount4 = [None] * 10      # Variable costs
amounts_per_unitAmount5 = [None] * 10    # Per-unit amounts
variable_RevAmount6 = [None] * 10        # Revenue quantities
amounts_per_unitRevAmount7 = [None] * 10 # Revenue prices
```

#### Phase 4: FilteredValue Entry Processing
Uses regex patterns to extract:
- Start year
- End year  
- Value
- ID
- Remarks

### 4. File Sanitization
```python
def sanitize_file(version):
    """
    Main entry point for file processing
    Handles complete sanitization workflow
    """
```

Workflow steps:
1. Construct file paths based on version
2. Create necessary directories
3. Read raw content from `U_configurations({version}).py`
4. Process content through medieval parser
5. Write sanitized output to `configurations({version}).py`

## Data Structures and Processing Logic

### Input File Format
Raw configuration file (`U_configurations({version}).py`) contains:
```python
{
    "filteredValues": [
        {"id": "plantLifetimeAmount10", "value": 25},
        {"id": "bECAmount11", "value": "1000000"},
        {"id": "variable_costsAmount4_1", "value": 100}
    ],
    "filteredValue": {
        "id": "numberOfUnitsAmount12",
        "value": 5,
        "start": 1,
        "end": 10,
        "remarks": "Initial configuration"
    }
}
```

### Output File Format
Sanitized configuration file (`configurations({version}).py`) contains:
```python
plantLifetimeAmount10=25
bECAmount11='1000000'
numberOfUnitsAmount12=5
variable_costsAmount4=[100, 200, 300, None, None, None, None, None, None, None]
amounts_per_unitAmount5=[10, 20, 30, None, None, None, None, None, None, None]
variable_RevAmount6=[1000, 2000, 3000, None, None, None, None, None, None, None]
amounts_per_unitRevAmount7=[50, 100, 150, None, None, None, None, None, None, None]

filtered_values_json=[
   '{"filteredValue":{"id":"numberOfUnitsAmount12","value":"5","start":"1","end":"10","remarks":"Initial configuration"}}',
]
```

### Processing Rules

#### String Value Processing
- Double quotes → Single quotes for Python compatibility
- Whitespace stripped from all values
- Empty strings preserved as `''`

#### Numeric Value Processing
- Integer strings → Python integers
- Float strings → Python floats
- Non-numeric strings remain as strings

#### Boolean Value Processing
- `"True"` string → `True` boolean
- `"False"` string → `False` boolean
- Special handling for `use_direct_operating_expensesAmount18`

#### Vector Value Processing
- Collected into 10-element arrays
- First available slot assignment
- None values for empty slots

## Integration with Other Configuration Components

### File Dependencies
```
Original/
└── Batch({version})/
    └── ConfigurationPlotSpec({version})/
        ├── U_configurations({version}).py     # Input (raw)
        └── configurations({version}).py        # Output (sanitized)
```

### Downstream Dependencies
1. **module1.py**: Requires sanitized configuration file
2. **config_modules.py**: Uses filtered_values_json from output
3. **Other modules**: Import sanitized configuration as Python module

### Integration Pattern
```python
# Downstream modules import sanitized configuration
import importlib.util
spec = importlib.util.spec_from_file_location("config", f"configurations({version}).py")
config_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config_module)
```

## Usage Patterns

### Command Line Execution
```bash
python formatter.py [version]
# Example: python formatter.py 1
```

### Programmatic Usage
```python
from formatter import sanitize_file

# Sanitize configuration for version 1
result = sanitize_file(version=1)
if "error" in result:
    print(f"Sanitization failed: {result['error']}")
else:
    print(f"Success: {result['message']}")
```

### Return Values
Success:
```python
{"message": "Sanitized file written successfully"}
```

Error:
```python
{"error": "Error description"}
```

## Best Practices

### 1. Input Validation
- Always verify input file exists before processing
- Check file encoding (UTF-8 expected)
- Validate JSON-like structure before parsing

### 2. Error Handling
- Graceful degradation for malformed input
- Detailed error messages for debugging
- Continue processing when possible

### 3. Vector Management
- Initialize all vectors with consistent size (10 elements)
- Use None for empty slots to maintain array structure
- Validate vector indices before assignment

### 4. File Operations
- Create directories with parents=True for safety
- Use Path objects for cross-platform compatibility
- Always specify encoding when reading/writing files

### 5. Logging and Debugging
- Print statements for operation tracking
- Return structured error/success messages
- Preserve original content for debugging

## Common Issues and Solutions

### Malformed JSON Input
**Issue**: "Error parsing filtered_values"
**Solution**: Check for:
- Proper quote escaping
- Complete JSON structures
- Valid array/object syntax

### Permission Errors
**Issue**: "No write permission for directory"
**Solution**: 
- Check directory permissions
- Run with appropriate user privileges
- Verify parent directory exists

### Vector Assignment Failures
**Issue**: Vector values not properly collected
**Solution**:
- Verify Amount4-7 ID patterns
- Check vector initialization size
- Debug with print statements in vector assignment section

### File Encoding Issues
**Issue**: Unicode decode errors
**Solution**:
- Ensure input file is UTF-8 encoded
- Add encoding parameter to file operations
- Handle BOM if present

## Extension Points

### Adding New Vector Properties
To add support for new vector properties (e.g., Amount8):
1. Initialize new vector in medieval_parse_and_sanitize
2. Add collection logic in value processing
3. Append vector to output

### Custom Value Processors
Extend value processing for special cases:
```python
# Add custom processor
if id_value == "special_property":
    value_value = custom_processor(value_value)
```

### Output Format Variations
Modify output format for different requirements:
- JSON output instead of Python
- XML configuration format
- YAML configuration support

## Performance Considerations

### Memory Efficiency
- Processes content in single pass
- Minimal memory footprint for vector storage
- No unnecessary data duplication

### String Operations
- Uses efficient string methods (find, split)
- Regex only where necessary
- Avoids repeated string concatenation

### File I/O
- Single read operation for input
- Single write operation for output
- Buffered I/O for large files

## Security Considerations

### Input Sanitization
- No code execution from input files
- Safe string operations only
- No dynamic imports from user data

### File System Safety
- Restricted to specific directory structure
- No arbitrary file access
- Path traversal prevention through Path objects

This module provides the critical first step in configuration processing, ensuring all downstream modules receive clean, standardized data in the expected format.