# Front_Subtab_HTML.py

## Architectural Overview

The `Front_Subtab_HTML.py` module is a Flask-based microservice running on port 8009 that serves as the HTML content processor and provider for the frontend visualization system. It implements a sophisticated file discovery and content delivery mechanism for HTML-based visualizations generated from batch processing results.

### Key Design Principles
- **Microservice Architecture**: Independent Flask service with dedicated port (8009)
- **RESTful API Design**: Clean endpoints for HTML content discovery and retrieval
- **Robust Error Handling**: Comprehensive error recovery with fallback mechanisms
- **Performance Optimization**: Request timeout management and content size limits
- **Logging Infrastructure**: Circular buffer-based logging with API access

## Core Data Processing Functionality

### HTML File Discovery Engine
The service implements a multi-tiered directory scanning algorithm to locate HTML files within the batch results structure:

```python
# Directory structure pattern:
# Original/
#   ├── Batch({version})/
#   │   └── Results({version})/
#   │       ├── HTML_v{version}_{plot_type}/
#   │       ├── v{version}_{plot_type}_Plot/
#   │       └── v{version}_Cumulative_Plot/
```

### Processing Pipeline
1. **Version Detection**: Scans for batch directories and extracts version identifiers
2. **Directory Prioritization**: Prioritizes HTML-specific directories for faster discovery
3. **Content Validation**: Ensures HTML content validity with fallback mechanisms
4. **Album Organization**: Groups HTML files by their visualization type and version

### Key Processing Features
- **Timeout Protection**: 30-second request timeout with graceful degradation
- **Content Size Limits**: 1MB limit per HTML file to prevent memory issues
- **Unicode Handling**: Robust encoding error recovery with replacement characters
- **Empty Content Detection**: Validates HTML structure and provides error placeholders

## API Endpoints and Serving Capabilities

### Primary Endpoints

#### 1. `/api/album_html/<version>` (GET)
Retrieves all HTML files for a specific version with comprehensive metadata.

**Response Structure**:
```json
[
  {
    "name": "visualization.html",
    "content": "<html>...</html>",
    "album": "HTML_v1_2_Annual_Cash_Flows",
    "display_name": "Annual Cash Flows for versions [1, 2]",
    "path": "/full/path/to/file.html",
    "content_length": 12345,
    "has_valid_content": true
  }
]
```

#### 2. `/api/album_html_content/<album>` (GET)
Fetches HTML content for a specific album/visualization type.

**Features**:
- Version extraction from album names
- Partial directory matching for flexibility
- Single file retrieval optimization

#### 3. `/api/album_html_all` (GET)
Bulk retrieval of HTML content across multiple versions.

**Query Parameters**:
- `version`: Can be specified multiple times for multi-version retrieval

#### 4. `/static/html/<version>/<album>/<filename>` (GET)
Direct file serving endpoint for static HTML resources.

### Utility Endpoints

#### 5. `/test` (GET)
Simple health check endpoint returning server status.

#### 6. `/test/album_endpoints` (GET)
Comprehensive testing suite for all album-related endpoints with detailed diagnostics.

#### 7. `/api/logs` (GET)
Access to the circular log buffer for debugging and monitoring.

**Query Parameters**:
- `count`: Number of log entries (max 100)
- `level`: Filter by log level (INFO, WARNING, ERROR)
- `search`: Text search within log messages

## Data Structures and Formats

### Album Naming Conventions
The service recognizes and processes multiple album formats:

1. **Organized Albums**: `HTML_v{version1}_{version2}_{plot_type}`
2. **Legacy Plot Directories**: `v{version}_{plot_type}_Plot`
3. **Cumulative Plots**: `v{version}_Cumulative_Plot`

### Display Name Generation
Intelligent display name formatting based on album structure:
- Multi-version plots: "Plot Type for versions [1, 2, 3]"
- Single version plots: "Plot Type for version 1"
- Cumulative plots: "Cumulative Plot for version 1"

### Error Response Format
Consistent error handling with descriptive messages:
```json
{
  "error": "Detailed error message",
  "type": "ErrorClassName",
  "details": "Additional context"
}
```

## Integration with Frontend Components

### Frontend Tab System Integration
The service is designed to integrate seamlessly with the frontend's tab-based visualization system:

1. **PlotsTabs Component**: Consumes the HTML content for rendering in iframe containers
2. **Dynamic Loading**: Supports lazy loading of HTML content based on tab selection
3. **Album Navigation**: Provides metadata for building album selection interfaces

### CORS Configuration
Full CORS support enabled for cross-origin requests from the React frontend.

### Content Delivery Optimization
- **Streaming Support**: Large HTML files are streamed rather than loaded entirely into memory
- **Compression Ready**: Response structure supports gzip compression
- **Cache Headers**: Proper cache control for static HTML content

## Performance and Caching Strategies

### Request Timeout Management
Sophisticated timeout handling to prevent server lockup:
- 30-second hard timeout per request
- Progressive timeout checks during processing
- Early termination when approaching timeout threshold

### Processing Optimization
1. **Directory Prioritization**: HTML-specific directories processed first
2. **Limited File Processing**: Caps processing at 5 files per directory
3. **Batch Size Control**: Limits total files returned to prevent payload bloat

### Memory Management
- **Content Size Limits**: 1MB cap per HTML file
- **Circular Log Buffer**: Fixed-size log storage (100 entries)
- **Streaming File Reading**: Efficient file I/O operations

### Scalability Considerations
- **Stateless Design**: No session state maintained between requests
- **Horizontal Scaling Ready**: Can run multiple instances behind a load balancer
- **Resource Pooling**: Efficient file handle management

### Monitoring and Debugging
- **Comprehensive Logging**: All operations logged with timestamps
- **Performance Metrics**: Request duration tracking
- **Error Categorization**: Detailed error types for troubleshooting
- **Live Log Access**: Real-time log viewing through API endpoint

The service provides a robust, scalable solution for serving HTML visualizations with careful attention to performance, error handling, and integration requirements.