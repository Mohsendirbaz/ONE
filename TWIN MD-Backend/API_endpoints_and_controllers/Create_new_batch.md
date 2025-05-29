# Create_new_batch.py - Batch Management API

## Architectural Overview

The `Create_new_batch.py` module provides a Flask-based API service for managing batch configurations in the ModEcon Matrix System. It handles the creation of new batch directories, manages version numbering, and ensures proper file structure initialization.

### Key Components

1. **Flask API Server** - Runs on port 8001 with CORS enabled
2. **Thread-Safe Operations** - Uses threading locks for concurrent access
3. **Version Management** - Handles sequential and gap-filling version creation
4. **File System Operations** - Creates and manages batch directory structures

### Directory Structure

```
Original/
├── Batch(0)/                    # Template batch
│   └── ConfigurationPlotSpec(0)/ # Template configuration
├── Batch(1)/                    # User batch
│   ├── ConfigurationPlotSpec(1)/
│   └── Results(1)/
└── Batch(n)/                    # Additional batches
    ├── ConfigurationPlotSpec(n)/
    └── Results(n)/
```

## Core Features and Functionality

### 1. Version Management

**`get_all_versions()`**
- Scans the Original directory for existing batch folders
- Extracts version numbers from folder names
- Returns a sorted list of active versions

```python
def get_all_versions():
    batches = [d for d in os.listdir(STATIC_FOLDER) 
               if os.path.isdir(os.path.join(STATIC_FOLDER, d)) 
               and d.startswith('Batch')]
    versions = []
    for batch in batches:
        try:
            version = int(batch.replace('Batch(', '').replace(')', ''))
            versions.append(version)
        except ValueError:
            pass
    return sorted(versions)
```

### 2. Gap Detection and Filling

**`find_next_missing_versions(versions)`**
- Identifies missing version numbers in the sequence
- Calculates the next sequential version number
- Enables efficient version management

```python
def find_next_missing_versions(versions):
    max_version = max(versions) if versions else 0
    missing_versions = [i for i in range(1, max_version) if i not in versions]
    next_new_version = max_version + 1
    return missing_versions, next_new_version
```

### 3. Batch Creation

**`create_batch(version)`**
- Creates complete batch directory structure
- Copies template configuration from Batch(0)
- Renames files to match the new version number

### 4. File Renaming

**`rename_files_in_folder(folder, old_version, new_version)`**
- Recursively renames all files containing version references
- Maintains consistency across the batch structure

## Component Props and Data Structures

### Request/Response Structures

**POST /create_new_batch Request:**
```json
{
  // No body required - version is auto-determined
}
```

**Success Response:**
```json
{
  "message": "New batch created successfully",
  "NewBatchNumber": 5
}
```

**Error Response:**
```json
{
  "message": "Error creating new batches",
  "error": "Detailed error message"
}
```

### Internal Data Structures

**Version List:**
```python
versions = [1, 2, 4, 5]  # Example with gap at version 3
```

**Batch Structure:**
```python
{
    "batch_folder": "Batch(n)",
    "config_folder": "ConfigurationPlotSpec(n)",
    "results_folder": "Results(n)"
}
```

## API Endpoints

### POST /create_new_batch

**Purpose:** Creates a new batch with automatic version assignment

**Request:**
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body: None required

**Response Codes:**
- `200 OK` - Batch created successfully
- `500 Internal Server Error` - Creation failed

**Process Flow:**
1. Acquire thread lock
2. Get current versions
3. Find missing versions and next sequential
4. Create batches for all missing versions
5. Create new batch with next version
6. Release lock and return new batch number

## Usage Patterns and Integration Points

### 1. Frontend Integration

```javascript
// Create new batch
const response = await fetch('http://localhost:8001/create_new_batch', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
});

const data = await response.json();
console.log(`New batch created: Batch(${data.NewBatchNumber})`);
```

### 2. Batch Lifecycle

1. **Initialization** - Copy from Batch(0) template
2. **Configuration** - User modifies configuration files
3. **Processing** - Run calculations on batch
4. **Results** - Store outputs in Results folder

### 3. Multi-User Scenarios

The threading lock ensures safe concurrent access:

```python
lock = threading.Lock()

def create_new_batch():
    with lock:
        # Thread-safe batch creation
        current_versions = get_all_versions()
        # ... rest of logic
```

## Best Practices and Considerations

### 1. Template Management

- **Batch(0)** must always exist as the template
- Keep template configuration minimal and valid
- Don't modify Batch(0) after initial setup

### 2. Version Number Management

- Versions are positive integers starting from 1
- System automatically fills gaps in version sequence
- No manual version assignment needed

### 3. Error Handling

```python
try:
    NewBatchNumber = create_new_batch()
    return jsonify({
        "message": "New batch created successfully", 
        "NewBatchNumber": NewBatchNumber
    }), 200
except Exception as e:
    return jsonify({
        "message": "Error creating new batches", 
        "error": str(e)
    }), 500
```

### 4. File System Permissions

- Ensure write permissions on Original directory
- Handle disk space limitations gracefully
- Consider cleanup strategies for old batches

### 5. Scaling Considerations

- Lock mechanism may become bottleneck with many concurrent users
- Consider database-backed version tracking for large deployments
- Implement batch archival for inactive versions

## Integration with Other Components

1. **Configuration Management** - Created batches use U_configurations files
2. **Calculation Engines** - Process data from batch configurations
3. **Visualization Generators** - Read results from batch folders
4. **Version Service** - Tracks and manages batch versions

## Security Considerations

1. **Path Traversal** - Base directory is hardcoded to prevent attacks
2. **Input Validation** - Version numbers are strictly validated
3. **File Operations** - Limited to specific directory structure
4. **CORS** - Enabled for frontend integration

## Future Enhancements

1. **Batch Metadata** - Add creation timestamp, user info
2. **Batch Templates** - Support multiple template types
3. **Batch Cloning** - Copy from any existing batch
4. **Batch Deletion** - Safe removal with dependency checking
5. **Batch Export/Import** - Archive and restore batches