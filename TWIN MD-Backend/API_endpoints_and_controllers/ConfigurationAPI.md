# ConfigurationAPI.py - Configuration File Management Service

## Architectural Overview

The `ConfigurationAPI.py` module is a specialized Flask service that provides:
- Custom parsing for non-standard JSON configuration files
- CRUD operations for configuration parameters
- Medieval parsing approach for complex JSON structures
- Management of time-segmented parameter customizations

### Multi-Level Architecture

#### Level 1: Service Components
```
┌─────────────────────────────────────────────────────────┐
│              Configuration API Service                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Medieval   │  │     CRUD     │  │     File      │  │
│  │    Parser    │  │  Operations  │  │  Management   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Level 2: Core Functionality
- **Medieval Parser**: Robust parsing for malformed or non-standard JSON
- **Configuration Loading**: Extraction of filteredValues and filteredValue objects
- **Parameter Deletion**: Safe removal of customized parameters
- **File Operations**: UTF-8 encoded file reading and writing

### Core Features and Functionality

#### 1. **Medieval Parsing System**
The parser handles non-standard JSON formats that standard parsers might fail on:
- Manual string parsing using regular expressions
- Handles both quoted and unquoted values
- Tolerates missing properties
- Preserves escape sequences

#### 2. **Dual Parameter Types**
- **filteredValues**: Standard configuration parameters
- **filteredValue**: Time-segmented customized parameters with start/end times

#### 3. **Safe File Modification**
- Preserves file structure during deletions
- Cleans up trailing commas
- Maintains JSON integrity

### Component Props and Data Structures

#### Configuration Parameter Structure
```javascript
// Standard parameters (filteredValues)
{
  "id": "ParameterName",
  "value": 12345,
  "remarks": "Optional description"
}

// Time-segmented parameters (filteredValue)
{
  "id": "CustomParameter",
  "value": 67890,
  "remarks": "Time-specific value",
  "start": 5,
  "end": 10
}
```

#### Response Structure
```javascript
{
  "filteredValues": [
    {
      "id": "BaseParameter1",
      "value": 100,
      "remarks": null
    }
  ],
  "filteredValue": [
    {
      "id": "TimeParameter1",
      "value": 200,
      "remarks": "Custom value for years 5-10",
      "start": 5,
      "end": 10
    }
  ]
}
```

### Key Functions

#### `medieval_parse_and_sanitize(content)`
A robust parser that handles non-standard JSON structures:

**Features**:
- Locates all `filteredValues` arrays and `filteredValue` objects
- Extracts id, value, and remarks fields
- Handles multiple data types (string, int, float, boolean)
- Manages missing or malformed properties
- Preserves escape sequences

**Processing Logic**:
1. Uses regex to find JSON sections
2. Manually parses each field
3. Converts values to appropriate types
4. Handles both array and object structures

### API Endpoints

#### POST `/load_configuration`
Load and parse configuration from U_configurations file.

**Request Body**:
```json
{
  "version": "1"
}
```

**Response**: Parsed configuration with both filteredValues and filteredValue arrays

**File Path**: `Original/Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py`

#### POST `/delete_custom_param`
Delete a specific customized parameter from the configuration.

**Request Body**:
```json
{
  "version": "1",
  "paramId": "someParameterId",
  "start": 5,
  "end": 10
}
```

**Response**:
- 200: Parameter deleted successfully
- 404: Parameter or file not found
- 400: Missing required parameters
- 500: Processing error

### Usage Patterns and Integration Points

#### 1. **Configuration Loading Flow**
```
Request with version → 
Read U_configurations file → 
Medieval parse content → 
Return structured data
```

#### 2. **Parameter Deletion Flow**
```
Request with param details → 
Find matching parameter → 
Remove from file content → 
Clean up formatting → 
Save updated file
```

### File Management

#### Directory Structure
```
Original/
└── Batch({version})/
    └── ConfigurationPlotSpec({version})/
        └── U_configurations({version}).py
```

#### File Format Handling
- Reads Python files containing JSON-like structures
- Handles non-standard formatting
- Preserves original file structure where possible

### Best Practices and Considerations

#### 1. **Error Handling**
- Comprehensive try-catch blocks
- Specific error messages
- Graceful degradation on parse failures

#### 2. **Data Integrity**
- Validates all required parameters
- Preserves file formatting
- Cleans up JSON syntax after modifications

#### 3. **Performance**
- Efficient regex-based parsing
- Single-pass file reading
- Minimal file I/O operations

### Medieval Parser Deep Dive

#### Why "Medieval" Parsing?
The parser is called "medieval" because it uses primitive, manual string parsing techniques rather than standard JSON parsers. This approach is necessary when:
- JSON is embedded in Python files
- Format is non-standard or malformed
- Standard parsers would fail

#### Parsing Strategy
1. **Pattern Matching**: Uses regex to find JSON sections
2. **Manual Extraction**: Character-by-character parsing for values
3. **Type Inference**: Automatic conversion to appropriate types
4. **Error Tolerance**: Continues parsing even with malformed sections

### Integration with Other Components

1. **Frontend Configuration UI**: Primary consumer of loaded configurations
2. **Sensitivity Analysis**: Uses configurations for parameter variations
3. **Calculation Engines**: Applies configuration values during processing

### Security Considerations

- Path traversal prevention through controlled file paths
- No execution of parsed content
- Input validation for all parameters
- Safe file writing with encoding specification

### Advanced Features

#### 1. **Flexible Value Parsing**
```python
# Handles various formats:
"value": 123        # Integer
"value": "123"      # String number
"value": 123.45     # Float
"value": true       # Boolean
"value": "text"     # String
```

#### 2. **Time Segment Support**
- Manages parameters that vary over time periods
- Supports overlapping time segments
- Maintains temporal parameter history

#### 3. **Escape Sequence Handling**
- Preserves backslashes in remarks
- Handles quoted strings within values
- Manages special characters

### Error Response Patterns

All endpoints follow consistent error response format:
```json
{
  "error": "Descriptive error message"
}
```

Status codes:
- 200: Success
- 400: Bad request (missing parameters)
- 404: Resource not found
- 500: Internal server error

### Logging and Debugging

While not explicitly implemented in the current version, the service structure supports:
- Request/response logging
- Parse error tracking
- File operation auditing

### Performance Characteristics

- **Load Time**: O(n) where n is file size
- **Parse Time**: O(n) linear scan through content
- **Delete Time**: O(n) for finding and removing parameter
- **Memory Usage**: Minimal, processes content in-place

### Future Enhancement Possibilities

1. **Batch Operations**: Support for multiple parameter operations
2. **Validation Rules**: Schema validation for parameters
3. **Backup System**: Automatic backup before modifications
4. **Change Tracking**: Audit trail for configuration changes