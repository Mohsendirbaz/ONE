# Version_service.py - Version Discovery API

## Overview
Flask API service for discovering and listing all available batch versions in the system. Supports both integer and decimal version numbers.

## Key Functionality

### Endpoint
- **GET /versions**: Returns sorted list of all available versions

### Core Operations

1. **Version Scanning**
   - Recursively walks through Original directory
   - Identifies Batch folders with pattern `Batch(X)` or `Batch(X.Y)`
   - Extracts version numbers using regex

2. **Version Processing**
   - Handles both integer versions (e.g., 4) and decimal versions (e.g., 4.5)
   - Maintains numeric precision (integers remain integers)
   - Deduplicates versions using set operations

3. **Sorting & Response**
   - Returns versions in ascending numerical order
   - Provides clean JSON response format

## Response Structure

```json
{
  "versions": [1, 2, 3, 4, 4.5, 5]
}
```

## Directory Patterns
```
Original/
├── Batch(1)/
├── Batch(2)/
├── Batch(4.5)/
└── Batch(5)/
```

## Error Handling

- Creates Original directory if missing
- Skips invalid batch folder names
- Returns error details on scanning failure

## Integration Points

- **File System**: Direct directory scanning
- **Batch Management**: Version discovery for other services
- **Frontend**: Version selection dropdowns

## Port Configuration
- Default port: 8002
- Debug mode enabled