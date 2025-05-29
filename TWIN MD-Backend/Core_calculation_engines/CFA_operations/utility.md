# utility.py - Common Utilities and Logging Infrastructure

## Architectural Overview

The utility module provides foundational infrastructure for the CFA operations system, including logging configuration, file management utilities, and common helper functions. It serves as the shared foundation for all operation modules, ensuring consistent logging and utility function access.

### Core Components
- Dual-logger system setup
- File management utilities
- Array manipulation helpers
- Centralized logging configuration

## Logging Infrastructure

### Logger Architecture

The module implements a sophisticated dual-logger system:

```python
# Price optimization logger
price_logger = logging.getLogger('price_optimization')
price_handler = logging.FileHandler(price_optimization_log)
price_handler.setLevel(logging.INFO)
price_logger.addHandler(price_handler)

# CFA process logger
cfa_logger = logging.getLogger('app_cfa')
cfa_handler = logging.FileHandler(app_cfa_log)
cfa_handler.setLevel(logging.INFO)
cfa_logger.addHandler(cfa_handler)
```

### Logger Configuration

**Basic Configuration**:
```python
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
)
```

**Log Files**:
- `price_optimization.log`: Price optimization process tracking
- `app_CFA.log`: General CFA calculation logging

### Logging Strategy

1. **Separation of Concerns**: Different loggers for different processes
2. **File-Based Logging**: Persistent logs for analysis
3. **Consistent Formatting**: Timestamp-prefixed messages
4. **Appropriate Levels**: INFO level for operational visibility

## Utility Functions

### `remove_existing_file(file_path)`

File cleanup utility for managing output files:

```python
def remove_existing_file(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)
        logging.debug(f"Removed existing file: {file_path}")
    else:
        logging.debug(f"No existing file to remove: {file_path}")
```

**Purpose**:
- Ensures clean file writes
- Prevents file corruption
- Provides operation logging

**Usage Pattern**:
```python
output_file = "results.csv"
remove_existing_file(output_file)
df.to_csv(output_file)  # Clean write
```

### `pad_or_trim(costs, target_length)`

Array size normalization utility:

```python
def pad_or_trim(costs, target_length):
    if len(costs) < target_length:
        return costs + [0] * (target_length - len(costs))
    return costs[:target_length]
```

**Purpose**:
- Ensures consistent array sizes
- Handles variable input lengths
- Prevents index errors in tables

**Use Cases**:
1. **Padding**: `[1, 2, 3]` → `[1, 2, 3, 0, 0]` (target: 5)
2. **Trimming**: `[1, 2, 3, 4, 5, 6]` → `[1, 2, 3, 4, 5]` (target: 5)
3. **No Change**: `[1, 2, 3, 4, 5]` → `[1, 2, 3, 4, 5]` (target: 5)

## System Information Output

### Environment Diagnostics

The module outputs system information on import:
```python
print(sys.executable)  # Python interpreter path
print(sys.path)        # Python module search paths
```

**Purpose**:
- Debugging environment issues
- Verifying correct Python installation
- Module resolution troubleshooting

## Directory Management

### Log Directory Setup

```python
log_directory = os.getcwd()
os.makedirs(log_directory, exist_ok=True)
```

**Features**:
- Uses current working directory
- Creates directory if missing
- Handles existing directories gracefully

### Path Construction

```python
price_optimization_log = os.path.join(log_directory, 'price_optimization.log')
app_cfa_log = os.path.join(log_directory, 'app_CFA.log')
```

**Benefits**:
- Platform-independent paths
- Centralized log location
- Easy log file discovery

## Integration Patterns

### Logger Usage in Other Modules

```python
from .utility import price_logger, cfa_logger

# In calculation functions
price_logger.info(f"Current NPV: ${npv:.2f}")
cfa_logger.info("Starting CFA calculation")
```

### Utility Function Usage

```python
from .utility import remove_existing_file, pad_or_trim

# File operations
remove_existing_file(output_path)

# Array operations
normalized_costs = pad_or_trim(cost_array, 5)
```

## Performance Considerations

### Logging Performance

1. **File I/O**: Logs written to disk (slower but persistent)
2. **Level Filtering**: Only INFO and above logged
3. **Handler Efficiency**: Separate handlers prevent interference
4. **Format Simplicity**: Minimal formatting overhead

### Utility Performance

1. **File Operations**: Direct OS calls for efficiency
2. **Array Operations**: List concatenation/slicing (O(n))
3. **Path Operations**: os.path for platform optimization

## Best Practices

### Logging Guidelines

1. **Use Appropriate Levels**:
   - DEBUG: Detailed diagnostic information
   - INFO: General operational messages
   - WARNING: Potential issues
   - ERROR: Actual problems

2. **Message Formatting**:
   ```python
   # Good
   logger.info(f"Calculated NPV: ${npv:,.2f}")
   
   # Avoid
   logger.info("NPV: " + str(npv))
   ```

3. **Context in Messages**:
   ```python
   logger.info(f"Processing period {start_year}-{end_year}")
   ```

### File Management

1. **Always Clean First**:
   ```python
   remove_existing_file(output_file)
   # Then write new file
   ```

2. **Handle Exceptions**:
   ```python
   try:
       remove_existing_file(file_path)
   except PermissionError:
       logger.warning(f"Could not remove {file_path}")
   ```

## Error Handling

### Current Implementation

- Basic existence checking in file removal
- Logging of all operations
- No exception raising

### Recommended Enhancements

```python
def remove_existing_file_safe(file_path, max_retries=3):
    """Enhanced file removal with retry logic"""
    for attempt in range(max_retries):
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logging.info(f"Removed file: {file_path}")
                return True
            return False
        except Exception as e:
            if attempt == max_retries - 1:
                logging.error(f"Failed to remove {file_path}: {e}")
                raise
            time.sleep(0.1)
```

## Future Enhancements

### Potential Additions

1. **Configuration-Based Logging**:
   ```python
   def setup_logging(config_file):
       """Setup logging from configuration file"""
   ```

2. **Additional Array Utilities**:
   ```python
   def normalize_arrays(arrays, target_length):
       """Normalize multiple arrays to same length"""
   
   def merge_arrays(arr1, arr2, operation='sum'):
       """Merge arrays with specified operation"""
   ```

3. **File Utilities**:
   ```python
   def ensure_directory(path):
       """Ensure directory exists"""
   
   def backup_file(file_path):
       """Create backup before modification"""
   ```

4. **Performance Monitoring**:
   ```python
   def log_performance(func):
       """Decorator for performance logging"""
   ```

## Module Dependencies

### Imports
- `os`: File and path operations
- `logging`: Logging infrastructure
- `sys`: System information

### No External Dependencies
- Pure Python implementation
- No third-party requirements
- Minimal overhead

## Conclusion

The utility module provides essential infrastructure for the CFA operations system. Its logging configuration ensures operational visibility, while utility functions standardize common operations. The module's simplicity and focus make it a reliable foundation for the entire calculation system.