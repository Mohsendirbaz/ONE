# Load.py - Configuration Loading API

## Architectural Overview

The `Load.py` module provides a Flask-based API service for loading and parsing configuration files in the ModEcon Matrix System. It features a sophisticated parsing engine that can extract complex configuration data from Python files, handling both standard and time-segmented parameters.

### Key Components

1. **Flask API Server** - Runs on port 5000 with CORS enabled
2. **Medieval Parser** - Advanced parsing engine for configuration extraction
3. **Data Sanitization** - Ensures clean, structured output
4. **Type Conversion** - Automatic type detection and conversion
5. **Time Segment Support** - Handles time-based parameter configurations

### System Architecture

```
Configuration File → Medieval Parser → Data Sanitization → Type Conversion → JSON Response
                           ↓
                    Pattern Matching
                    Value Extraction
                    Structure Building
```

## Core Features and Functionality

### 1. Medieval Parse and Sanitize Engine

The `medieval_parse_and_sanitize` function is a sophisticated parser that extracts configuration data from Python files without executing them:

```python
def medieval_parse_and_sanitize(content):
    filtered_values_json = []      # Standard parameters
    filtered_value_objects = []     # Time-segmented parameters
    
    # Locate and parse all `filteredValues` and `filteredValue` sections
    filtered_values_matches = list(re.finditer(r'"filteredValues":\s*\[', content))
    filtered_value_matches = list(re.finditer(r'"filteredValue":\s*{', content))
```

### 2. Pattern Recognition

The parser recognizes two main configuration patterns:

#### Standard Parameters (filteredValues)
```python
"filteredValues": [
    {"id": "param1", "value": 100, "remarks": "Initial value"},
    {"id": "param2", "value": 200, "remarks": "Secondary value"}
]
```

#### Time-Segmented Parameters (filteredValue)
```python
"filteredValue": {
    "id": "timeParam1",
    "value": 150,
    "remarks": "Time-based parameter",
    "start": 0,
    "end": 100
}
```

### 3. Data Extraction Features

- **ID Extraction**: Captures parameter identifiers
- **Value Parsing**: Handles numbers, strings, and booleans
- **Remarks Handling**: Preserves comments with proper escaping
- **Time Segment Support**: Extracts start/end times for temporal parameters
- **Type Detection**: Automatically converts values to appropriate types

## Component Props and Data Structures

### Request Structure

```json
{
  "version": 1
}
```

### Response Structure

```json
{
  "filteredValues": [
    {
      "id": "initialSellingPriceAmount13",
      "value": 1000,
      "remarks": "Base selling price"
    },
    {
      "id": "profitMargin",
      "value": 0.25,
      "remarks": null
    }
  ],
  "filteredValue": [
    {
      "id": "timeBasedPrice",
      "value": 1200,
      "remarks": "Price for period",
      "start": 0,
      "end": 50
    },
    {
      "id": "timeBasedCost",
      "value": 800,
      "remarks": "Cost adjustment",
      "start": 50,
      "end": 100
    }
  ]
}
```

### Internal Data Processing

#### Value Type Conversion
```python
try:
    value_value = float(value_value) if '.' in value_value else int(value_value)
except ValueError:
    pass  # Keep as string if conversion fails
```

#### Boolean Handling
```python
if value_str == 'true':
    value_value = True
elif value_str == 'false':
    value_value = False
```

## API Endpoints

### POST /load_configuration

**Purpose:** Load and parse configuration file for a specific version

**Request:**
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body: `{ "version": <version_number> }`

**Response Codes:**
- `200 OK` - Configuration loaded successfully
- `400 Bad Request` - Version not provided
- `500 Internal Server Error` - File read or parsing error

**File Path Resolution:**
```python
original_file_path = os.path.join(
    UPLOAD_DIR, 
    f'Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py'
)
```

## Parsing Algorithm Details

### 1. Pattern Matching Strategy

The parser uses regular expressions to locate configuration sections:

```python
# Find all filteredValues arrays
filtered_values_matches = list(re.finditer(r'"filteredValues":\s*\[', content))

# Find all filteredValue objects
filtered_value_matches = list(re.finditer(r'"filteredValue":\s*{', content))
```

### 2. Value Extraction Process

For each configuration entry, the parser:

1. **Locates ID field**
   ```python
   id_start = filtered_values_content.find('"id":"')
   id_start += len('"id":"')
   id_end = filtered_values_content.find('"', id_start)
   id_value = filtered_values_content[id_start:id_end]
   ```

2. **Extracts value with type detection**
   ```python
   if filtered_values_content[value_start] == '"':
       # String value
       value_end = filtered_values_content.find('"', value_start + 1) + 1
       value_value = filtered_values_content[value_start:value_end].strip('"')
   else:
       # Numeric value
       value_end = filtered_values_content.find(',', value_start)
       value_value = filtered_values_content[value_start:value_end].strip()
   ```

3. **Handles remarks field**
   ```python
   remarks_match = re.search(r'"remarks":"(.*?)"', filtered_values_content[id_end:])
   if remarks_match:
       remarks_value = remarks_match.group(1).replace("\\\\", "\\")
   else:
       remarks_value = None
   ```

4. **Processes time segments (if present)**
   ```python
   time_match = re.search(r'"start":\s*(["\d]+).*?"end":\s*(["\d]+)', ...)
   if time_match:
       start_time = int(time_match.group(1).strip('"'))
       end_time = int(time_match.group(2).strip('"'))
   ```

### 3. Data Categorization

The parser automatically categorizes parameters:

- **Standard Parameters**: Go to `filteredValues` array
- **Time-Segmented Parameters**: Go to `filteredValue` array

```python
if start_time is not None and end_time is not None:
    filtered_value_objects.append({
        "id": id_value.strip('"'),
        "value": value_value,
        "remarks": remarks_value,
        "start": start_time,
        "end": end_time
    })
else:
    filtered_values_json.append({
        "id": id_value.strip('"'),
        "value": value_value,
        "remarks": remarks_value
    })
```

## Usage Patterns and Integration Points

### 1. Frontend Integration

```javascript
async function loadConfiguration(version) {
    const response = await fetch('http://localhost:5000/load_configuration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ version: version })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const config = await response.json();
    
    // Process standard parameters
    config.filteredValues.forEach(param => {
        console.log(`Parameter ${param.id}: ${param.value}`);
    });
    
    // Process time-segmented parameters
    config.filteredValue.forEach(param => {
        console.log(`Time parameter ${param.id}: ${param.value} (${param.start}-${param.end})`);
    });
    
    return config;
}
```

### 2. Configuration Processing

```javascript
function processConfiguration(config) {
    // Build parameter map
    const paramMap = new Map();
    
    // Add standard parameters
    config.filteredValues.forEach(param => {
        paramMap.set(param.id, {
            value: param.value,
            remarks: param.remarks,
            type: 'standard'
        });
    });
    
    // Add time-segmented parameters
    config.filteredValue.forEach(param => {
        if (!paramMap.has(param.id)) {
            paramMap.set(param.id, []);
        }
        paramMap.get(param.id).push({
            value: param.value,
            remarks: param.remarks,
            start: param.start,
            end: param.end,
            type: 'time-segmented'
        });
    });
    
    return paramMap;
}
```

### 3. Error Handling

```python
@app.route('/load_configuration', methods=['POST'])
def load_configuration():
    data = request.get_json()
    version = data.get('version')
    
    if not version:
        return jsonify({"error": "Version is required"}), 400

    original_file_path = os.path.join(...)
    
    try:
        with open(original_file_path, 'r', encoding='utf-8') as f:
            raw_content = f.read()
    except Exception as e:
        return jsonify({"error": f"Error reading from original file: {str(e)}"}), 500

    # Parse and sanitize the content
    parsed_data = medieval_parse_and_sanitize(raw_content)
    
    return jsonify(parsed_data)
```

## Best Practices and Considerations

### 1. Configuration File Format

Ensure configuration files follow expected patterns:

```python
# Standard format
"filteredValues": [
    {"id": "param1", "value": 100, "remarks": "Description"}
]

# Time-segmented format
"filteredValue": {
    "id": "timeParam",
    "value": 200,
    "remarks": "Time-based",
    "start": 0,
    "end": 100
}
```

### 2. Type Safety

The parser automatically handles type conversion:

- Integers: No decimal point
- Floats: Contains decimal point
- Booleans: 'true' or 'false' strings
- Strings: Everything else

### 3. Remarks Handling

Special character handling in remarks:

```python
remarks_value = remarks_match.group(1).replace("\\\\", "\\")
```

### 4. Missing Field Handling

The parser gracefully handles missing fields:

```python
if remarks_match:
    remarks_value = remarks_match.group(1).replace("\\\\", "\\")
else:
    remarks_value = None  # Explicitly set to None if missing
```

## Advanced Features

### 1. Multi-Section Support

The parser can handle multiple configuration sections in a single file:

```python
# Process all filteredValues arrays
for match in filtered_values_matches:
    # Extract and process each array
    
# Process all filteredValue objects
for match in filtered_value_matches:
    # Extract and process each object
```

### 2. Nested Structure Navigation

Complex regex patterns for robust parsing:

```python
# Handle quoted and unquoted numeric values
value_match = re.search(r'"value":\s*([\d".]+|true|false)', filtered_value_content)
```

### 3. Unicode Support

Full UTF-8 encoding support:

```python
with open(original_file_path, 'r', encoding='utf-8') as f:
    raw_content = f.read()
```

## Integration with Other Components

### 1. Version Management

- Works with batch versions from Create_new_batch
- Reads version-specific configuration files
- Supports multiple concurrent versions

### 2. Calculation Engines

- Provides parameter values for calculations
- Supports time-dependent calculations
- Maintains parameter metadata (remarks)

### 3. Visualization Systems

- Configuration data drives plot generation
- Time segments enable temporal visualizations
- Remarks provide context for displays

### 4. Sensitivity Analysis

- Base values from configurations
- Parameter ranges for sensitivity
- Metadata for result interpretation

## Security Considerations

1. **Path Traversal Prevention**
   ```python
   # Version is validated and used in controlled path construction
   f'Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py'
   ```

2. **No Code Execution**
   - Parser reads files as text only
   - No eval() or exec() used
   - Safe regex-based extraction

3. **Input Validation**
   - Version parameter required
   - File existence checked
   - Parsing errors handled gracefully

## Performance Optimization

1. **Efficient Parsing**
   - Single file read operation
   - Compiled regex patterns (implicit)
   - Linear parsing complexity

2. **Memory Management**
   - Streaming not required for typical configs
   - Garbage collection friendly
   - No persistent state

3. **Caching Opportunities**
   - Consider caching parsed configurations
   - Version-based cache keys
   - Invalidate on file changes

## Troubleshooting Guide

### Common Issues

1. **"Version is required" Error**
   - Ensure POST body includes version field
   - Check Content-Type header

2. **"Error reading from original file"**
   - Verify file exists at expected path
   - Check file permissions
   - Ensure version directory structure

3. **Empty Response**
   - Configuration file may be empty
   - Check file format matches expected patterns
   - Verify quotes and escaping

### Debug Techniques

1. **Log Raw Content**
   ```python
   print(f"Raw content length: {len(raw_content)}")
   print(f"First 500 chars: {raw_content[:500]}")
   ```

2. **Pattern Testing**
   ```python
   print(f"filteredValues matches: {len(filtered_values_matches)}")
   print(f"filteredValue matches: {len(filtered_value_matches)}")
   ```

3. **Step-by-Step Parsing**
   ```python
   # Add debug prints in parsing loops
   print(f"Processing ID: {id_value}, Value: {value_value}")
   ```

## Future Enhancements

1. **Schema Validation** - Validate parsed data against schema
2. **Streaming Parser** - Handle very large configuration files
3. **Format Detection** - Support multiple configuration formats
4. **Change Tracking** - Track configuration modifications
5. **Batch Loading** - Load multiple versions in one request