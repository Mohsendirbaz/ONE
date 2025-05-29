# PNG.py - PNG Plot Generation and Management API

## Architectural Overview

The `PNG.py` module provides a comprehensive Flask-based API service for generating, managing, and serving PNG visualizations in the ModEcon Matrix System. It handles complex visualization requests including sensitivity analysis, manages plot organization, and serves generated images.

### Key Components

1. **Flask API Server** - Runs on port 5008 with CORS enabled
2. **Advanced Logging System** - Console-based logging with immediate file handling
3. **Path Management** - Robust path handling using pathlib
4. **Sensitivity Analysis** - Support for complex sensitivity parameters
5. **Plot Organization** - Automatic album organization
6. **Image Serving** - Direct image file serving capabilities

### System Architecture

```
Request → Validation → Script Execution → Plot Generation → Album Organization → Image Serving
            ↓              ↓                   ↓                 ↓
         Logging      Directory Setup    Results Storage    HTML Albums
```

## Core Features and Functionality

### 1. Advanced Logging System

**Custom File Handler Implementation:**
```python
class ImmediateFileHandler(logging.FileHandler):
    def emit(self, record):
        super().emit(record)
        self.close()
        # Reopen for next write
        self.stream = self._open()
```

This prevents file locking issues during Git operations.

### 2. Path Configuration

Uses pathlib for robust cross-platform path handling:

```python
ORIGINAL_DIR = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
BACKEND_DIR = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC_DIR = ORIGINAL_DIR / 'Original'
LOG_DIR = BACKEND_DIR / "Logs"
SCRIPT_DIR = BACKEND_DIR / "Visualization_generators"
```

### 3. Request Validation

Comprehensive validation with detailed error messages:

```python
def validate_request_data(data):
    # Validates versions, properties, remarks, customized features
    # Validates sensitivity parameters with Param_ID format checking
    # Returns success status and validated data or error message
```

### 4. Sensitivity Analysis Support

Handles complex sensitivity configurations:

```python
{
    "S": {
        "param1": {
            "enabled": true,
            "Param_ID": "S1",
            "mode": "range",
            "values": [0.8, 0.9, 1.0, 1.1, 1.2],
            "compareToKey": "baseline",
            "comparisonType": "percentage",
            "waterfall": true,
            "bar": false,
            "point": true
        }
    }
}
```

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
  "S": {
    "sensitivityParam1": {
      "enabled": true,
      "Param_ID": "S1",
      "mode": "discrete",
      "values": [100, 200, 300],
      "compareToKey": "baseline",
      "comparisonType": "absolute",
      "waterfall": true,
      "bar": true,
      "point": false
    }
  }
}
```

### Validation Rules

1. **Versions**: Must be positive integers
2. **Properties**: Must be a list (can be empty)
3. **Remarks**: Must be 'on' or 'off'
4. **Customized Features**: Must be 'on' or 'off'
5. **Param_ID**: Must match format 'S<number>'

## API Endpoints

### 1. POST /generate_png_plots

**Purpose:** Generate PNG visualizations with specified parameters

**Request:**
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body: Visualization parameters (see Request Structure)

**Response Codes:**
- `204 No Content` - Successful execution
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Execution error

**Process Flow:**

1. **Request Validation**
2. **Directory Setup** - Creates necessary batch/results directories
3. **Script Execution** - Runs PNG_PLOT.py with parameters
4. **Album Organization** - Organizes plots into albums
5. **Success Response**

### 2. GET /api/plots/<version>

**Purpose:** Retrieve all plots for a specific version

**Response:**
```json
[
  {
    "id": 1,
    "name": "revenue_analysis.png",
    "path": "Batch(1)/Results(1)/Economics/Revenue/revenue_analysis.png",
    "category": "Economics",
    "group": "Revenue"
  }
]
```

### 3. GET /api/plots/<version>/<category>/<group>

**Purpose:** Retrieve plots for specific category and group

**Parameters:**
- `version`: Batch version number
- `category`: Plot category (e.g., "Economics")
- `group`: Plot group (e.g., "Revenue")

### 4. GET /api/sensitivity-plots/<version>

**Purpose:** Retrieve sensitivity analysis plots

**Response:** Similar structure to regular plots, but from Sensitivity directory

### 5. GET /api/sensitivity-plots/<version>/<category>/<group>

**Purpose:** Retrieve sensitivity plots for specific category and group

### 6. GET /images/<path:filename>

**Purpose:** Serve image files directly

**Parameters:**
- `filename`: Path to image relative to PUBLIC_DIR

## Usage Patterns and Integration Points

### 1. Frontend Integration

```javascript
// Generate plots
async function generatePNGPlots(params) {
    const response = await fetch('http://localhost:5008/generate_png_plots', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            selectedVersions: [1, 2],
            selectedProperties: ['revenue', 'profit'],
            remarks: 'on',
            customizedFeatures: 'off',
            S: {
                priceMultiplier: {
                    enabled: true,
                    Param_ID: 'S1',
                    mode: 'range',
                    values: [0.8, 0.9, 1.0, 1.1, 1.2],
                    compareToKey: 'baseline',
                    comparisonType: 'percentage',
                    waterfall: true,
                    bar: false,
                    point: true
                }
            }
        })
    });
}

// Retrieve plots
async function getPlots(version) {
    const response = await fetch(`http://localhost:5008/api/plots/${version}`);
    const plots = await response.json();
    return plots;
}

// Display image
function displayPlot(plotPath) {
    const imageUrl = `http://localhost:5008/images/${plotPath}`;
    document.getElementById('plot-img').src = imageUrl;
}
```

### 2. Logging Features

#### Property Table Logging
```python
def log_properties_as_table(properties):
    # Creates formatted table in logs
    # Example output:
    # --------------------------------
    # Row   | Property
    # --------------------------------
    # 1     | initialSellingPriceAmount13
    # 2     | profitMargin
    # 3     | revenue
    # --------------------------------
```

#### Sensitivity Parameter Logging
```python
def log_sensitivity_parameters(sensitivity_params):
    # Logs structured sensitivity configuration
    # Example output:
    # Parameter: priceMultiplier
    # - Param_ID: S1
    # - Mode: range
    # - Values: [0.8, 0.9, 1.0, 1.1, 1.2]
    # - Comparison: baseline (percentage)
    # - Visualization Options:
    #   * Waterfall: True
    #   * Bar: False
    #   * Point: True
```

### 3. Directory Management

Automatic directory creation for each version:

```python
for version in selected_versions:
    batch_dir = PUBLIC_DIR / f'Batch({version})'
    results_dir = batch_dir / f'Results({version})'
    config_dir = batch_dir / f'ConfigurationPlotSpec({version})'
    
    # Create directories
    for directory in [batch_dir, results_dir, config_dir]:
        directory.mkdir(exist_ok=True)
    
    # Create default config if missing
    config_file = config_dir / f'U_configurations({version}).py'
    if not config_file.exists():
        with open(config_file, 'w') as f:
            f.write('filteredValues = []')
```

## Best Practices and Considerations

### 1. Error Handling

Comprehensive error handling at multiple levels:

```python
try:
    # Main execution
    result = subprocess.run(args, capture_output=True, text=True)
    
    # Log all output
    if result.stdout:
        logger.info(f"Script output: {result.stdout}")
    if result.stderr:
        logger.warning(f"Script stderr: {result.stderr}")
    
    if result.returncode != 0:
        error_msg = f"Error in {script_filename}: {result.stderr}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500
        
except Exception as e:
    logger.error(f"Error executing {script_filename}: {str(e)}", exc_info=True)
    return jsonify({"error": f"Error executing {script_filename}: {str(e)}"}), 500
```

### 2. Performance Monitoring

Request duration tracking:

```python
request_start_time = datetime.now()
# ... processing ...
request_duration = datetime.now() - request_start_time
logger.info(f"Request completed successfully in {request_duration}")
```

### 3. Security Considerations

1. **Path Validation** - Uses pathlib for safe path operations
2. **Input Validation** - Comprehensive parameter validation
3. **Subprocess Safety** - No shell execution, explicit arguments
4. **CORS Configuration** - Properly configured for frontend access

### 4. Scalability Features

1. **Album Organization** - Automatic organization for large plot sets
2. **Categorization** - Hierarchical organization (category/group)
3. **Version Isolation** - Each version has separate directories
4. **Efficient Serving** - Direct file serving for images

## Advanced Features

### 1. Sensitivity Analysis Visualization

Support for multiple visualization types:

- **Waterfall Charts** - Show incremental effects
- **Bar Charts** - Compare discrete values
- **Point Plots** - Show individual data points

### 2. Dynamic Configuration

Default values and fallbacks:

```python
selected_versions = result['selected_versions']
if not selected_versions:
    logger.warning("No versions selected, using default version [1]")
    selected_versions = [1]
```

### 3. Album Organization Integration

```python
try:
    sys.path.append(str(BACKEND_DIR))
    from Album_organizer import organize_plot_albums
    organize_plot_albums()
    logger.info("Album organization completed")
except Exception as e:
    logger.error(f"Error during album organization: {str(e)}")
    # Continue without failing the request
```

## Integration with Other Components

### 1. Visualization Generators

- **PNG_PLOT.py** - Main plotting script
- Receives parameters via command line
- Generates plots based on configuration

### 2. Configuration System

- Reads from U_configurations files
- Supports version-specific configurations
- Creates default configs when missing

### 3. Album Organizer

- Post-processes generated plots
- Creates HTML galleries
- Organizes by category and group

### 4. Frontend Components

- Plots tabs display generated images
- Sensitivity analysis UI
- Real-time plot updates

## Troubleshooting Guide

### Common Issues and Solutions

1. **"Script file not found"**
   - Verify PNG_PLOT.py exists in Visualization_generators
   - Check file permissions
   - Ensure correct working directory

2. **"Invalid Param_ID format"**
   - Param_ID must be 'S' followed by numbers
   - Example: 'S1', 'S2', 'S10'

3. **"No plots generated"**
   - Check script stderr output in logs
   - Verify input data validity
   - Ensure directories have write permissions

4. **"Image not found"**
   - Verify plot generation completed
   - Check file paths in response
   - Ensure PUBLIC_DIR is accessible

### Debug Techniques

1. **Enable Verbose Logging**
   ```python
   logger.info(f"Command arguments: {args}")
   logger.info(f"Script output: {result.stdout}")
   ```

2. **Test Script Directly**
   ```bash
   cd /path/to/Visualization_generators
   python PNG_PLOT.py "1,2" "prop1,prop2" "on" "off" '{"S1": {...}}'
   ```

3. **Check Directory Structure**
   ```bash
   tree Original/Batch\(1\)/
   ```

## Performance Optimization

1. **Parallel Processing** - Consider async execution for multiple versions
2. **Caching** - Implement plot caching for repeated requests
3. **Lazy Loading** - Load plot metadata without reading files
4. **Compression** - Serve compressed images for faster delivery