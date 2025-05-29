# CalSen.py - Configuration and Sensitivity Path Resolution Service

## Architectural Overview

The `CalSen.py` module is a dedicated microservice running on port 2750 that provides:
- Dynamic path resolution for sensitivity analysis configurations
- Service discovery for configuration files
- Standardized path building based on sensitivity parameters
- Directory structure navigation and validation

### Multi-Level Architecture

#### Level 1: Service Architecture
```
┌─────────────────────────────────────────────────────────┐
│                CalSen Service (Port 2750)                │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │Path Builder │  │ File Finder  │  │   Parameter   │  │
│  │   Engine    │  │   Service    │  │   Discovery   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Level 2: Core Functionality Map
- **Path Building Engine**: Constructs standardized paths for sensitivity variations
- **Configuration Discovery**: Locates existing configuration files with filtering
- **Parameter Management**: Lists and validates enabled sensitivity parameters
- **Mode Mapping**: Handles directory name conventions for different analysis modes

### Core Features and Functionality

#### 1. **Path Resolution System**
The service builds comprehensive path sets for each enabled sensitivity parameter:
- Parameter variation directories
- Configuration directories
- Matrix file locations
- Python configuration files

#### 2. **Mode Directory Mapping**
```python
mode_dir_mapping = {
    'percentage': 'Percentage',
    'directvalue': 'DirectValue',
    'absolutedeparture': 'AbsoluteDeparture',
    'montecarlo': 'MonteCarlo'
}
```

#### 3. **Dynamic Configuration Discovery**
- Automatic detection of sensitivity parameters from directory structure
- Fallback mechanisms for missing configuration files
- Support for both configured and discovered parameters

### Component Props and Data Structures

#### Path Set Structure
```javascript
{
  "S35": {
    "mode": "percentage",
    "variations": {
      "+10.00": {
        "param_var_dir": "/path/to/Sensitivity/S35/percentage/+10.00",
        "config_var_dir": "/path/to/Sensitivity/Percentage/Configuration/S35_+10.00",
        "config_matrix_file": "/path/to/General_Configuration_Matrix(1).csv",
        "config_file": "/path/to/configurations(1).py",
        "Econ_var_dir": "/path/to/Sensitivity/S35/percentage/Configuration/S35_+10.00",
        "mode": "percentage",
        "variation": 10.0,
        "variation_str": "+10.00"
      },
      "-10.00": {
        // Similar structure for negative variation
      }
    },
    "compareToKey": "S13",
    "comparisonType": "primary"
  }
}
```

#### Request/Response Formats

##### GET `/get_config_paths` Request
```javascript
{
  "version": 1,
  "payload": {
    "selectedVersions": [1],
    "SenParameters": {
      "S13": {
        "enabled": true,
        "mode": "percentage",
        "values": [10, -10],
        "compareToKey": "S15"
      }
    }
  }
}
```

##### GET `/find_config_files` Request
```javascript
{
  "version": 1,
  "param_id": "S35",      // Optional
  "mode": "percentage",    // Optional
  "variation": 10.0        // Optional
}
```

### Usage Patterns and Integration Points

#### 1. **Standard Path Resolution Flow**
```
Request with version → 
Load sensitivity config → 
Build path sets for enabled parameters → 
Return comprehensive path mapping
```

#### 2. **Configuration Discovery Flow**
```
Request with filters → 
Build search patterns → 
Glob file system → 
Return matching files
```

#### 3. **Parameter Discovery Flow**
```
Request version → 
Scan directory structure → 
Build parameter list → 
Return enabled parameters
```

### API Endpoints

#### GET `/health`
Service health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "service": "CalSen",
  "timestamp": "2024-01-15 10:30:00"
}
```

#### POST `/get_config_paths`
Build complete path sets for all enabled parameters.

**Response**: Comprehensive path mapping for sensitivity analysis

#### POST `/find_config_files`
Find configuration files with optional filtering.

**Response**: List of matching configuration file paths

#### POST `/list_parameters`
List all enabled sensitivity parameters for a version.

**Response**: Parameter details including modes and variations

### Directory Structure Management

The service manages the following directory structure:
```
Original/
├── Batch({version})/
│   ├── Results({version})/
│   │   ├── Sensitivity/
│   │   │   ├── {param_id}/
│   │   │   │   └── {mode}/
│   │   │   │       ├── Configuration/
│   │   │   │       │   └── {param_id}_{variation}/
│   │   │   │       └── {variation}/
│   │   │   │           └── config files
│   │   │   ├── {Mode}/  # Capitalized
│   │   │   │   └── Configuration/
│   │   │   │       └── {param_id}_{variation}/
│   │   │   └── Reports/
│   │   │       └── sensitivity_config.json
│   │   └── General_Configuration_Matrix({version}).csv
│   └── ConfigurationPlotSpec({version})/
│       └── configurations({version}).py
```

### Key Functions

#### `build_paths_for_version(version)`
Constructs complete path mappings for all enabled parameters:
- Loads sensitivity configuration
- Falls back to directory scanning if config missing
- Builds standardized paths for each variation
- Ensures directory existence

#### `find_configuration_files(version, param_id, mode, variation)`
Flexible file discovery with optional filtering:
- Supports wildcards for unspecified parameters
- Returns matching configuration files
- Handles case-insensitive mode matching

### Best Practices and Considerations

#### 1. **Error Handling**
- Comprehensive logging for debugging
- Graceful fallbacks for missing configurations
- Detailed error messages in responses

#### 2. **Path Consistency**
- Lowercase modes for directory names
- Standardized variation string formatting (+10.00, -10.00)
- Automatic directory creation

#### 3. **Service Reliability**
- Minimal dependencies
- Stateless operation
- Fast response times

### Integration with Other Components

1. **Calculations_and_Sensitivity-LL.py**: Primary consumer for path resolution
2. **Sensitivity Analysis Pipeline**: Uses paths for file operations
3. **Configuration Management**: Validates configuration file locations

### Configuration Discovery Logic

1. **Primary Method**: Load from `sensitivity_config.json`
2. **Fallback Method**: Scan directory structure
3. **Validation**: Ensure required paths exist or can be created

### Logging Architecture

- Log file: `Logs/CALSEN.log`
- Comprehensive request/response logging
- Error tracking with stack traces
- Service lifecycle events

### Security Considerations

- No direct file modification capabilities
- Path validation to prevent traversal
- Read-only operations on configuration files
- CORS enabled for controlled access

### Performance Optimization

- Efficient glob patterns for file discovery
- Directory existence caching
- Minimal file I/O operations
- Stateless design for scalability

### Service Management

- Runs as standalone Flask application
- Default port: 2750 (configurable via command line)
- Health check endpoint for monitoring
- Graceful error handling

### Advanced Features

1. **Dynamic Mode Detection**: Automatically detects analysis modes from directory names
2. **Variation Formatting**: Consistent formatting for positive/negative variations
3. **Multi-Level Path Building**: Handles both parameter-specific and mode-specific paths
4. **Flexible Filtering**: Supports partial parameter matching in discovery