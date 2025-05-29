# Front_Subtab_Table.py

## Architectural Overview

The `Front_Subtab_Table.py` module is a streamlined Flask microservice running on port 8007 that specializes in processing and serving CSV data from batch results. This service represents the tabular data component of the visualization trinity (HTML, PNG, CSV), providing structured data for frontend table visualizations.

### Core Architecture Principles
- **Microservice Pattern**: Independent service with dedicated port (8007)
- **Data Transformation Focus**: Converts CSV files to JSON format for web consumption
- **Pandas Integration**: Leverages pandas for robust CSV parsing and data manipulation
- **Minimal Footprint**: Concise implementation focusing on essential functionality

### Service Profile
- **Port**: 8007
- **Framework**: Flask with CORS support
- **Data Engine**: Pandas for CSV processing
- **Output Format**: JSON with null handling

## Core Data Processing Functionality

### CSV Discovery and Processing
The service implements a comprehensive file discovery and transformation pipeline:

```python
# Directory traversal pattern:
# Original/
#   ├── Batch({version})/
#   │   └── Results({version})/
#   │       ├── *.csv files (any depth)
#   │       └── subdirectories/
#   │           └── *.csv files
```

### Data Processing Pipeline
1. **Recursive Directory Scanning**: Uses `os.walk()` for deep directory traversal
2. **CSV File Detection**: Case-insensitive matching for `.csv` extensions
3. **Pandas DataFrame Loading**: Robust CSV parsing with error handling
4. **Null Value Handling**: Replaces NaN values with "null" string for JSON compatibility
5. **JSON Transformation**: Converts DataFrame to records-oriented JSON

### Key Processing Features
- **Deep Directory Support**: Scans all subdirectories within Results folder
- **Error Resilience**: Continues processing even if individual files fail
- **Memory Efficiency**: Processes files individually without bulk loading
- **Type Preservation**: Maintains data types through pandas processing

## API Endpoints and Serving Capabilities

### Primary Endpoint

#### `/api/csv-files/<version>` (GET)
Retrieves all CSV files for a specified version as JSON data.

**Request Parameters**:
- `version`: The batch version identifier (string)

**Response Structure**:
```json
[
  {
    "name": "results_summary.csv",
    "data": [
      {
        "column1": "value1",
        "column2": 123.45,
        "column3": "null"
      },
      {
        "column1": "value2",
        "column2": 678.90,
        "column3": "data"
      }
    ]
  },
  {
    "name": "sensitivity_analysis.csv",
    "data": [...]
  }
]
```

**Response Characteristics**:
- Always returns an array (empty if no files found)
- Each file represented as an object with name and data
- Data formatted as array of row objects
- Null values explicitly converted to "null" string

### Error Handling
- **Missing Directory**: Returns empty array with warning log
- **File Processing Errors**: Logs error and continues with remaining files
- **No CSV Files**: Returns empty array

## Data Structures and Formats

### CSV File Object Structure
```python
{
    "name": str,           # Original filename
    "data": List[Dict]     # Array of row dictionaries
}
```

### Data Transformation Details

#### Pandas to JSON Conversion
The service uses pandas' `to_dict(orient='records')` which creates:
- Each row as a dictionary
- Column names as keys
- Cell values as dictionary values
- Preserves column order

#### Null Handling Strategy
```python
df.fillna("null")  # Replaces all NaN/None values
```
This ensures:
- Consistent null representation
- Valid JSON output
- Frontend predictability

### Type System
Through pandas processing, the service maintains:
- **Numeric Types**: Integers and floats preserved
- **String Types**: Text data maintained
- **Date Types**: Converted to string representation
- **Boolean Types**: Preserved as true/false

## Integration with Frontend Components

### Frontend Table Components
The service is designed for seamless integration with React table components:

1. **Data Grid Integration**:
   - Direct consumption by AG-Grid or similar libraries
   - Row-based data structure for easy iteration
   - Column detection from object keys

2. **Dynamic Table Generation**:
   - Frontend can auto-generate columns from data keys
   - Supports variable column structures across files
   - Enables sorting and filtering on structured data

3. **Multi-File Support**:
   - Each CSV file can be rendered in separate tabs
   - File names provide natural tab labels
   - Maintains file context for user reference

### CORS Configuration
Full CORS enablement for frontend access:
```python
CORS(app)  # Permissive CORS for development
```

### Data Volume Considerations
- No built-in pagination (frontend responsibility)
- Full file contents returned (suitable for moderate-sized CSVs)
- Memory usage scales with CSV file sizes

## Performance and Caching Strategies

### Processing Efficiency

#### Lazy Loading Approach
- Files processed on-demand per request
- No pre-loading or caching at startup
- Minimal memory footprint when idle

#### Error Isolation
Individual file failures don't affect overall response:
```python
try:
    df = pd.read_csv(file_path)
    # Process file
except Exception as e:
    logging.error(f"Failed to process {file}: {e}")
    # Continue with next file
```

### Performance Characteristics
1. **I/O Bound Operations**: Performance limited by file system access
2. **Linear Scaling**: Processing time proportional to total CSV size
3. **Memory Usage**: Temporary DataFrame allocation per file

### Optimization Opportunities

#### Potential Enhancements
1. **Streaming Processing**: For large CSV files
2. **Compression Support**: Gzip response compression
3. **Partial Loading**: Row/column subsetting
4. **Caching Layer**: Redis or in-memory caching

#### Scalability Patterns
- **Horizontal Scaling**: Multiple instances for load distribution
- **File System Optimization**: SSD storage for faster I/O
- **Async Processing**: Non-blocking file operations

### Monitoring and Logging

#### Logging Strategy
The service implements strategic logging:

```python
# Success logging
logging.info(f"Processing request for version: {version}")
logging.info(f"Processed {file}")

# Warning logging
logging.warning(f"Directory not found: {directory}")
logging.warning(f"Results folder not found: {results_path}")

# Error logging
logging.error(f"Failed to process {file}: {e}")
```

#### Operational Metrics
Key metrics for monitoring:
- Request count per version
- File processing success/failure rates
- Average response times
- Memory usage patterns

### Deployment Considerations

#### Configuration Management
- **BASE_PATH**: Configurable via environment variable
- **Port**: Hardcoded but can be parameterized
- **Debug Mode**: Should be disabled in production

#### Production Readiness
Recommendations for production deployment:
1. Add request timeouts for large files
2. Implement response size limits
3. Add authentication/authorization
4. Enable compression middleware
5. Implement proper CORS restrictions

The Front_Subtab_Table service provides a clean, efficient solution for CSV data transformation and delivery, completing the data visualization pipeline with structured tabular data support.