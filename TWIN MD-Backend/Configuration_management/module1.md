# Module1 - Configuration Matrix Builder

## Architectural Overview

The `module1.py` module serves as the configuration matrix builder in the pipeline, transforming sanitized configuration data from `formatter.py` into structured matrices that define configuration intervals and their associated values. It creates the temporal framework that enables time-based configuration management.

### Position in Architecture
```
formatter.py → module1.py → config_modules.py → Table.py
     ↓              ↓              ↓                ↓
 Sanitizes    Builds Matrix   Creates Modules   Builds Table
```

### Core Purpose
- **Matrix Construction**: Builds configuration matrices from filtered values
- **Interval Management**: Creates time-based intervals for configuration changes
- **Property Mapping**: Applies human-readable names to technical IDs
- **Data Organization**: Structures configuration data for downstream processing

## Core Features and Functionality

### 1. Property Mapping Application
```python
def apply_property_mapping(filtered_value_intervals):
    """
    Replaces technical IDs with human-readable names
    Enhances readability of output files
    """
```

Comprehensive mapping includes:
- Financial parameters (costs, revenues, taxes)
- Operational parameters (plant lifetime, units)
- Construction parameters (contingencies, years)
- Vector properties (v40-v59, r60-r79)

### 2. Matrix Building Logic
```python
def apply_filtered_values_and_build_matrix(config_received, filtered_values_json):
    """
    Core function that processes filtered values and builds two types of matrices
    Returns both interval-based and continuous matrices
    """
```

Creates two distinct matrix types:

#### Config Matrix (Interval-Based)
- Based on actual change points in configuration
- Optimal intervals minimize redundancy
- Used for efficient storage and processing

#### General Config Matrix (Continuous)
- One row per year of plant lifetime
- Provides year-by-year granularity
- Used for time-series analysis

### 3. Interval Generation
```python
# Collect all unique start/end points
start_end_points = set([1, config_received.plantLifetimeAmount10])
# Add points from filtered values
start_end_points.update([start_year, end_year])
# Create intervals from adjacent points
intervals = [(sorted_points[i], sorted_points[i+1]) for i in range(len(sorted_points)-1)]
```

Process:
1. Initialize with plant lifetime boundaries (1, lifetime)
2. Add all configuration change points
3. Sort points chronologically
4. Create intervals between adjacent points

### 4. Filtered Value Assignment
```python
for fv_tuple in filtered_value_intervals:
    for row in config_matrix:
        if hs > row['end'] or he < row['start']:
            continue
        # Value applies to this interval
        row['filtered_values'].append(item)
```

Assignment logic:
- Check if filtered value overlaps with interval
- Add to interval's filtered_values list
- Handle remarks and metadata

### 5. Directory Management
```python
def empty_folder(folder_path):
    """
    Cleans results folder before writing new files
    Ensures no stale data persists
    """
```
- Removes all existing files and subdirectories
- Maintains folder structure
- Handles permission errors gracefully

## Data Structures and Processing Logic

### Input Data Structure
From `formatter.py`:
```python
filtered_values_json = [
    '{"filteredValue":{"id":"plantLifetimeAmount10","value":"25","start":"1","end":"25","remarks":"Base config"}}',
    '{"filteredValue":{"id":"bECAmount11","value":"1000000","start":"1","end":"10","remarks":"Initial BEC"}}',
    '{"filteredValue":{"id":"bECAmount11","value":"1500000","start":"11","end":"25","remarks":"Updated BEC"}}'
]
```

### Intermediate Data Structures

#### Filtered Value Intervals
```python
filtered_value_intervals = [
    ("plantLifetimeAmount10", 1, 25, "25", "Base config"),
    ("bECAmount11", 1, 10, "1000000", "Initial BEC"),
    ("bECAmount11", 11, 25, "1500000", "Updated BEC")
]
```

#### Sorted Points
```python
sorted_points = [1, 10, 11, 25]  # All unique start/end points
```

### Output Data Structures

#### Configuration Matrix
```csv
start,end,length,filtered_values
1,10,10,"[{""id"":""plantLifetimeAmount10"",""value"":""25""},{""id"":""bECAmount11"",""value"":""1000000""}]"
10,11,2,"[{""id"":""plantLifetimeAmount10"",""value"":""25""},{""id"":""bECAmount11"",""value"":""1000000""}]"
11,25,15,"[{""id"":""plantLifetimeAmount10"",""value"":""25""},{""id"":""bECAmount11"",""value"":""1500000""}]"
```

#### General Configuration Matrix
```csv
start,end,length,filtered_values
1,1,1,"[{""id"":""plantLifetimeAmount10"",""value"":""25""},{""id"":""bECAmount11"",""value"":""1000000""}]"
2,2,1,"[{""id"":""plantLifetimeAmount10"",""value"":""25""},{""id"":""bECAmount11"",""value"":""1000000""}]"
...
```

#### Filtered Value Intervals (with mapping)
```csv
ID,Start,End,Value,Remarks
Plant Lifetime,1,25,25,Base config
Bare Erected Cost,1,10,1000000,Initial BEC
Bare Erected Cost,11,25,1500000,Updated BEC
```

## Integration with Other Configuration Components

### Dependencies

1. **formatter.py Output**:
   - Requires: `configurations({version}).py`
   - Contains: Sanitized configuration with filtered_values_json

2. **Base Configuration**:
   - Loads configuration module dynamically
   - Extracts plantLifetimeAmount10 for matrix dimensions

3. **Directory Structure**:
   ```
   Original/
   └── Batch({version})/
       ├── ConfigurationPlotSpec({version})/
       │   └── configurations({version}).py
       └── Results({version})/           # Output directory
           ├── Configuration_Matrix({version}).csv
           ├── General_Configuration_Matrix({version}).csv
           ├── Sorted_Points({version}).csv
           └── Filtered_Value_Intervals({version}).csv
   ```

### Output Files

1. **Configuration_Matrix**: Optimal intervals based on change points
2. **General_Configuration_Matrix**: Year-by-year configuration
3. **Sorted_Points**: All configuration change points
4. **Filtered_Value_Intervals**: Human-readable interval definitions

## Usage Patterns

### Command Line Execution
```bash
python module1.py [version]
# Example: python module1.py 1
```

### Programmatic Usage
```python
from module1 import test_list_building
import importlib.util

# Load configuration
spec = importlib.util.spec_from_file_location("config", config_file)
config_received = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config_received)

# Build matrices
result = test_list_building(version=1, config_received=config_received)
```

### Output Access
```python
import pandas as pd

# Load configuration matrix
config_matrix = pd.read_csv(f"Results({version})/Configuration_Matrix({version}).csv")

# Load general matrix for time-series analysis
general_matrix = pd.read_csv(f"Results({version})/General_Configuration_Matrix({version}).csv")
```

## Best Practices

### 1. Matrix Design
- Use config_matrix for efficient storage
- Use general_config_matrix for time-series operations
- Validate interval continuity (no gaps)

### 2. Property Management
- Keep property_mapping synchronized with system
- Document new properties when added
- Use consistent naming conventions

### 3. Error Handling
- Validate plant lifetime before processing
- Check for overlapping intervals
- Handle missing required fields gracefully

### 4. Performance Optimization
- Empty results folder to prevent accumulation
- Use efficient interval algorithms
- Minimize matrix size where possible

### 5. Data Validation
- Ensure start <= end for all intervals
- Verify all intervals cover [1, plant_lifetime]
- Check for duplicate property definitions

## Common Issues and Solutions

### Missing Configuration File
**Issue**: "FileNotFoundError: configurations({version}).py"
**Solution**: Ensure formatter.py has run successfully first

### Invalid Plant Lifetime
**Issue**: Zero or negative plant lifetime
**Solution**: Validate configuration before processing

### Overlapping Intervals
**Issue**: Same property defined multiple times for same period
**Solution**: Later definitions override earlier ones (last-write-wins)

### Memory Issues with Large Configurations
**Issue**: Out of memory for long plant lifetimes
**Solution**: Process in chunks or use streaming approach

## Extension Points

### Custom Matrix Types
Add new matrix types for specific analyses:
```python
# Add sensitivity matrix
sensitivity_matrix = build_sensitivity_matrix(filtered_values)
```

### Additional Property Mappings
Extend property_mapping for new configuration items:
```python
property_mapping.update({
    "newPropertyAmount100": "New Property Description",
    "customValueAmount101": "Custom Value"
})
```

### Matrix Validation
Add validation functions:
```python
def validate_matrix(matrix):
    # Check interval continuity
    # Verify property consistency
    # Validate value types
```

### Export Formats
Support additional output formats:
- Excel workbooks with multiple sheets
- JSON for API consumption
- Binary formats for large datasets

## Performance Considerations

### Algorithm Efficiency
- O(n log n) for sorting points
- O(n × m) for interval assignment (n intervals, m values)
- Linear time for matrix construction

### Memory Usage
- Proportional to plant lifetime × number of properties
- JSON serialization adds overhead
- Consider streaming for very large configurations

### I/O Optimization
- Batch file operations
- Use pandas' efficient CSV writers
- Clean directory once, not per file

## Data Flow Visualization

```
Filtered Values JSON → Parse → Extract Intervals → Sort Points
                                      ↓
                              Create Intervals
                                      ↓
                         ┌────────────┴────────────┐
                         ↓                         ↓
                  Config Matrix            General Matrix
                  (Optimal Intervals)      (Year-by-Year)
                         ↓                         ↓
                    CSV Output               CSV Output
```

This module provides the critical transformation from flat configuration data to structured matrices, enabling efficient time-based configuration management throughout the system.