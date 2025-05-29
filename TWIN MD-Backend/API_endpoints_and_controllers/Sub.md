# Sub.py - Subplot Generation API

## Architectural Overview

The `Sub.py` module provides a Flask-based API service for generating aggregated subplots in the ModEcon Matrix System. It orchestrates the execution of visualization scripts with user-specified parameters and manages the subplot generation pipeline.

### Key Components

1. **Flask API Server** - Runs on port 5009 with CORS enabled
2. **Script Orchestration** - Manages execution of visualization scripts
3. **Parameter Processing** - Handles complex visualization parameters
4. **Logging System** - Comprehensive logging for debugging and monitoring
5. **HTML Album Organization** - Post-processing for plot organization

### System Architecture

```
Client Request → Flask API → Script Execution → Plot Generation → Album Organization
                     ↓
                  Logging
```

## Core Features and Functionality

### 1. Request Processing

The API accepts complex visualization parameters:

- **Selected Versions** - Which batch versions to visualize
- **Selected Properties** - Data properties to plot
- **Remarks** - Toggle for annotation display
- **Customized Features** - Enable/disable custom visualizations
- **Subplot Selection** - Specific subplot configurations

### 2. Script Execution Pipeline

```python
script_dir = os.path.join(BASE_DIR, 'backend', 'Visualization_generators')
script_files = ['AggregatedSubPlots.py']
```

The system executes visualization scripts in sequence with proper parameter passing.

### 3. HTML Album Organization

After plot generation, the system automatically organizes plots into HTML albums for easy viewing.

## Component Props and Data Structures

### Request Structure

```json
{
  "selectedVersions": [1, 2, 3],
  "selectedProperties": [
    "initialSellingPriceAmount13",
    "profitMargin",
    "revenue"
  ],
  "remarks": "on",
  "customizedFeatures": "off",
  "subplotSelection": {
    "type": "grid",
    "layout": "2x2",
    "properties": ["prop1", "prop2"]
  }
}
```

### Internal Data Processing

```python
# Version formatting
selected_versions_str = ",".join(map(str, selected_versions))
# Example: [1, 2, 3] → "1,2,3"

# Properties formatting
selected_properties_str = ",".join(selected_properties)
# Example: ["prop1", "prop2"] → "prop1,prop2"

# Subplot selection serialization
json.dumps(subplot_selection)
```

## API Endpoints

### POST /runSub

**Purpose:** Execute subplot generation with specified parameters

**Request:**
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body: Visualization parameters (see Request Structure)

**Response Codes:**
- `204 No Content` - Successful execution
- `404 Not Found` - Script files not found
- `500 Internal Server Error` - Execution error

**Process Flow:**

1. **Parameter Extraction**
   ```python
   data = request.get_json()
   selected_versions = data.get('selectedVersions', [1])
   selected_properties = data.get('selectedProperties', ['initialSellingPriceAmount13'])
   remarks = data.get('remarks', 'on')
   customized_features = data.get('customizedFeatures', 'off')
   subplot_selection = data.get('subplotSelection', None)
   ```

2. **Script Execution**
   ```python
   result = subprocess.run(
       ['python', script_filename, selected_versions_str, 
        selected_properties_str, remarks, customized_features, 
        json.dumps(subplot_selection)],
       capture_output=True, text=True
   )
   ```

3. **Album Organization**
   ```python
   result = subprocess.run(
       ['python', organizer_path],
       capture_output=True, text=True
   )
   ```

## Usage Patterns and Integration Points

### 1. Frontend Integration

```javascript
async function generateSubplots(params) {
    const response = await fetch('http://localhost:5009/runSub', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            selectedVersions: params.versions,
            selectedProperties: params.properties,
            remarks: params.showRemarks ? 'on' : 'off',
            customizedFeatures: params.useCustom ? 'on' : 'off',
            subplotSelection: params.subplotConfig
        })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // No content returned on success
    console.log('Subplots generated successfully');
}
```

### 2. Visualization Pipeline

1. **Request Reception** - API receives visualization parameters
2. **Parameter Validation** - Ensures required fields are present
3. **Script Execution** - Runs AggregatedSubPlots.py with parameters
4. **Plot Generation** - Script creates plots in Results directory
5. **Album Organization** - HTML albums created for easy viewing

### 3. Error Handling Strategy

```python
try:
    # Change to script directory
    os.chdir(script_dir)
    
    # Execute scripts
    for script_filename in script_files:
        result = subprocess.run([...])
        
        if result.returncode != 0:
            logging.error(f"Error running {script_filename}: {result.stderr}")
            return f"Error running {script_filename}: {result.stderr}", 500
            
except FileNotFoundError:
    logging.error(f"File not found in directory: {script_dir}")
    return f"File not found in directory: {script_dir}", 404
except Exception as e:
    logging.error(f"Unexpected error: {e}")
    return f"Unexpected error: {e}", 500
```

## Logging System

### Log Configuration

```python
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Logs')
log_file_path = os.path.join(LOGS_DIR, 'Flask_Sub.log')

logging.basicConfig(
    filename=log_file_path,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
```

### Log Levels

- **INFO** - Request reception, parameter details
- **DEBUG** - Formatted parameter strings
- **ERROR** - Script execution failures
- **WARNING** - Non-critical issues

### Log Examples

```
2024-01-15 10:30:45 - INFO - Received data: {'selectedVersions': [1, 2], ...}
2024-01-15 10:30:45 - INFO - Changed working directory to: /path/to/scripts
2024-01-15 10:30:46 - ERROR - Error running AggregatedSubPlots.py: ...
```

## Best Practices and Considerations

### 1. Parameter Validation

Always validate input parameters before script execution:

```python
# Set defaults for missing parameters
selected_versions = data.get('selectedVersions', [1])
selected_properties = data.get('selectedProperties', ['initialSellingPriceAmount13'])
```

### 2. Working Directory Management

Change to script directory before execution:

```python
os.chdir(script_dir)
logging.info(f"Changed working directory to: {script_dir}")
```

### 3. Error Recovery

Continue with album organization even if it fails:

```python
try:
    result = subprocess.run(['python', organizer_path], ...)
except Exception as e:
    logging.error(f"Error during HTML album organization: {str(e)}")
    # Continue with normal flow, don't fail the request
```

### 4. Security Considerations

- Use subprocess with explicit arguments (no shell=True)
- Validate all input parameters
- Limit script execution to specific directory

### 5. Performance Optimization

- Run scripts sequentially to avoid resource conflicts
- Consider async execution for long-running plots
- Implement request queuing for high load

## Integration with Other Components

### 1. Visualization Generators

- **AggregatedSubPlots.py** - Main visualization script
- Receives formatted parameters via command line
- Outputs plots to version-specific Results directory

### 2. HTML Album Organizer

- **html_album_organizer.py** - Post-processing script
- Creates browsable HTML galleries
- Links generated plots for easy navigation

### 3. Version Management

- Works with batch versions from Create_new_batch
- Reads configurations from version directories
- Outputs to version-specific results folders

### 4. Property System

- Interfaces with property definitions
- Supports dynamic property selection
- Handles custom property configurations

## Advanced Features

### 1. Subplot Selection

Complex subplot configurations:

```json
{
  "subplotSelection": {
    "type": "grid",
    "layout": "3x3",
    "properties": ["prop1", "prop2", "prop3"],
    "grouping": "version",
    "comparison": true
  }
}
```

### 2. Customized Features

Enable advanced visualization options:

```python
customized_features = data.get('customizedFeatures', 'off')
# Passes to script for custom rendering logic
```

### 3. Remarks System

Toggle annotations and comments:

```python
remarks = data.get('remarks', 'on')
# Controls display of explanatory text on plots
```

## Troubleshooting Guide

### Common Issues

1. **Script Not Found**
   - Check script_dir path
   - Verify AggregatedSubPlots.py exists
   - Ensure proper file permissions

2. **Subprocess Errors**
   - Check Python path in subprocess
   - Verify script parameters format
   - Review script stderr output

3. **Album Organization Failures**
   - Non-critical, plots still generated
   - Check html_album_organizer.py path
   - Verify output directory permissions

### Debug Techniques

1. **Enable Debug Logging**
   ```python
   logging.debug(f"Formatted versions string: {selected_versions_str}")
   logging.debug(f"Formatted properties string: {selected_properties_str}")
   ```

2. **Capture Script Output**
   ```python
   if result.returncode != 0:
       logging.error(f"Script stdout: {result.stdout}")
       logging.error(f"Script stderr: {result.stderr}")
   ```

3. **Test Script Directly**
   ```bash
   python AggregatedSubPlots.py "1,2" "prop1,prop2" "on" "off" "{}"
   ```