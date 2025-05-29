# Remove_batch.py - Batch Management API

## Overview
Flask API service for managing batch directories and log files. Provides endpoints to remove batch folders and clear log files with thread-safe operations.

## Key Functionality

### Endpoints

1. **POST /Remove_batch**: Remove batch directories from multiple locations
2. **POST /clear-log**: Clear contents of specified log files

### Core Operations

1. **Batch Removal**
   - Removes batch folders from both main and original locations
   - Thread-safe directory deletion using locks
   - Returns updated max version after removal

2. **Log File Management**
   - Clears log file contents without deletion
   - Validates file existence before clearing
   - Maintains file structure while removing content

3. **Version Discovery**
   - Scans directories for batch folders
   - Extracts version numbers from folder names
   - Returns sorted list of available versions

## Data Structures

### Remove Batch Request
```json
{
  "version": 4,
  "path": "/path/to/log/file.log"  // Optional log path
}
```

### Remove Batch Response
```json
{
  "rb": {
    "status": "success",
    "message": "Batch(4) removed from both locations."
  },
  "max_version": 3,
  "log_result": {
    "status": "success",
    "message": "File cleared: /path/to/log/file.log"
  }
}
```

### Clear Log Request
```json
{
  "path": "/path/to/log/file.log"
}
```

## Integration Points

- **File System**: Direct interaction with batch directories
- **Thread Safety**: Uses threading locks for concurrent access
- **Error Handling**: Comprehensive error messages for failures

## Directory Structure
```
BASE_DIR/
├── Original/
│   ├── Batch(1)/
│   ├── Batch(2)/
│   └── ...
└── backend/
    └── Original/
        ├── Batch(1)/
        ├── Batch(2)/
        └── ...
```

## Port Configuration
- Default port: 7001
- Debug mode enabled