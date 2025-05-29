# Front_Subtab_Plot.py

## Architectural Overview

The `Front_Subtab_Plot.py` module is a Flask-based microservice operating on port 8008 that specializes in serving PNG image files from batch processing results. This lightweight service forms a critical component of the visualization pipeline, providing static plot images to the frontend visualization tabs.

### Design Philosophy
- **Minimalist Architecture**: Focused solely on PNG file discovery and serving
- **RESTful Interface**: Clean API design for image file retrieval
- **Directory Pattern Recognition**: Intelligent album detection for both legacy and new formats
- **Logging-First Approach**: Comprehensive logging for debugging and monitoring

### Service Characteristics
- **Port**: 8008
- **Protocol**: HTTP with CORS enabled
- **Primary Function**: PNG file discovery and metadata provision
- **Integration**: Works in tandem with HTML and CSV processors

## Core Data Processing Functionality

### Directory Structure Navigation
The service navigates a hierarchical directory structure to locate PNG files:

```python
# Expected directory hierarchy:
# Original/
#   ├── Batch({version})/
#   │   └── Results({version})/
#   │       ├── {version}_PlotType_{identifier}/  # New format
#   │       └── {version}_AnnotatedStaticPlots/   # Legacy format
```

### Version Discovery Mechanism
```python
def get_available_versions(directory: str) -> List[str]:
    # Scans for Batch(X) directories
    # Extracts version numbers from directory names
    # Returns sorted list of available versions
```

### Album Validation Logic
The service implements sophisticated album detection:
1. **New Album Format**: Directories ending with `_PlotType_{identifier}`
2. **Legacy Format**: Directories containing `_AnnotatedStaticPlots`
3. **Flexible Matching**: Supports various naming conventions

### PNG File Processing Pipeline
1. **Directory Scanning**: Iterates through valid album directories
2. **File Type Filtering**: Identifies files with `.png` extension (case-insensitive)
3. **Metadata Construction**: Builds comprehensive file information objects
4. **Path Resolution**: Maintains full file paths for serving

## API Endpoints and Serving Capabilities

### Primary Endpoint

#### `/api/album/<version>` (GET)
Main endpoint for retrieving PNG files associated with a specific version.

**Request Parameters**:
- `version`: The batch version identifier (e.g., "1", "2", "3")

**Response Structure**:
```json
[
  {
    "name": "plot_image.png",
    "path": "/full/path/to/image.png",
    "album": "v1_2_PlotType_Annual_Cash_Flows"
  },
  {
    "name": "sensitivity_plot.png",
    "path": "/full/path/to/sensitivity.png",
    "album": "v1_AnnotatedStaticPlots"
  }
]
```

**Response Codes**:
- `200 OK`: PNG files found and returned
- `404 Not Found`: No version folder or no PNG files found

### Error Handling Strategy
- **Missing Version Folder**: Returns 404 with descriptive error message
- **Empty Results**: Returns 404 with "No PNG files found" message
- **Invalid Album Folders**: Logs warning and continues processing

### Logging Infrastructure
Comprehensive logging at multiple levels:
- **INFO**: Successful operations and file discoveries
- **WARNING**: Missing directories or unexpected structures
- **DEBUG**: Detailed server startup information

## Data Structures and Formats

### PNG File Metadata Object
Each PNG file is represented with the following structure:
```python
{
    "name": str,      # Filename including extension
    "path": str,      # Absolute file system path
    "album": str      # Parent album/directory name
}
```

### Album Naming Patterns
The service recognizes multiple album formats:

1. **Standard Plot Albums**: `{version}_PlotType_{plot_identifier}`
   - Example: `v1_PlotType_Annual_Cash_Flows`
   
2. **Multi-Version Albums**: `{version1}_{version2}_PlotType_{identifier}`
   - Example: `v1_2_PlotType_Sensitivity_Analysis`
   
3. **Legacy Annotated Plots**: `{version}_AnnotatedStaticPlots`
   - Example: `v1_AnnotatedStaticPlots`

### Version Identification
Versions are extracted from batch directory names:
- Pattern: `Batch({version})`
- Example: `Batch(1)` → version = "1"

## Integration with Frontend Components

### Frontend Visualization System
The service integrates with the React frontend's plot visualization components:

1. **PlotsTabs Component**: 
   - Fetches PNG metadata through this API
   - Renders images in dedicated plot tabs
   - Handles album-based organization

2. **Image Loading Strategy**:
   - Frontend receives file paths
   - Direct image loading using provided paths
   - Lazy loading support for performance

3. **Album Selection Interface**:
   - Metadata enables album filtering
   - Supports multi-album visualization
   - Maintains version context

### CORS Configuration
Full CORS support enabled for seamless frontend integration:
```python
CORS(app)  # Allows all origins by default
```

### Static File Serving
While the API provides metadata, actual PNG files can be served:
- Through Flask's static file handling
- Via reverse proxy configuration
- Direct file system access (if paths are accessible)

## Performance and Caching Strategies

### Startup Optimization
The service performs initial discovery operations at startup:
```python
# Pre-loads available versions
versions = get_available_versions(base_directory)
# Logs all PNG files for debugging
log_png_file_names_for_versions(versions, base_directory)
```

### Directory Scanning Efficiency
1. **Filtered Scanning**: Only processes directories matching album patterns
2. **Early Termination**: Stops scanning when no valid albums found
3. **Minimal Memory Footprint**: Returns metadata only, not file contents

### Scalability Features
- **Stateless Design**: No session or state management
- **Lightweight Operations**: File system operations only
- **Horizontal Scaling**: Multiple instances can run behind load balancer

### Performance Characteristics
- **Low Memory Usage**: Only metadata in memory
- **Fast Response Times**: Direct file system access
- **Minimal CPU Usage**: Simple directory traversal operations

### Caching Opportunities
While not implemented in the base service, caching can be added:
- **Version List Caching**: Cache available versions
- **Directory Structure Caching**: Cache album discoveries
- **Frontend Caching**: Leverage browser caching for images

### Monitoring and Debugging

#### Startup Logging
Comprehensive logging during initialization:
- Available versions discovery
- PNG file enumeration for all versions
- Full path logging for debugging

#### Request Logging
Each API request generates detailed logs:
- Incoming version parameter
- Directory existence checks
- File discovery results
- Error conditions

#### Debug Mode
The service runs in debug mode by default:
```python
app.run(debug=True, port=8008)
```

This enables:
- Automatic reloading on code changes
- Detailed error pages
- Enhanced logging output

The Front_Subtab_Plot service provides a focused, efficient solution for PNG file discovery and serving, forming an essential component of the overall visualization infrastructure.