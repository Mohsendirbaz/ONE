# Table Module - Configuration Table Generator

## Architectural Overview

The `Table.py` module serves as the final stage in the configuration management pipeline, responsible for creating comprehensive time-series tables from configuration modules. It acts as a configuration aggregator that consolidates multiple configuration modules into a single, easily readable CSV table format.

### Position in Architecture
```
formatter.py → module1.py → config_modules.py → Table.py
     ↓              ↓              ↓                ↓
 Sanitizes    Builds Matrix   Creates Modules   Builds Table
```

### Core Purpose
- **Configuration Consolidation**: Merges multiple time-based configuration modules into a single table
- **Time-Series Representation**: Creates a year-by-year view of all configuration properties
- **Data Continuity**: Ensures property values persist across time periods through forward-filling
- **Property Mapping**: Translates technical IDs to human-readable property names

## Core Features and Functionality

### 1. Configuration Module Loading
```python
def load_config_modules(results_folder, version):
    """
    Scans results folder for configuration module JSON files
    Returns sorted list of (start_year, config_module) tuples
    """
```
- Automatically discovers all configuration modules for a version
- Extracts start year from filename pattern: `{version}_config_module_{start_year}.json`
- Sorts modules chronologically for proper time-series construction

### 2. Property Collection and Expansion
```python
def collect_properties_from_config_module(config_module):
    """
    Extracts all properties from a configuration module
    Handles special vector properties by expanding them
    """
```
- Processes both scalar and vector properties
- Expands vector properties (Amount4-7) into individual indexed properties
- Applies property mapping for readability

### 3. Vector Property Handling
```python
def expand_vector_properties(properties, prop_name, vector):
    """
    Expands vector properties into numbered individual properties
    Example: variable_costsAmount4 = [100, 200] → Variable Costs_1 = 100, Variable Costs_2 = 200
    """
```
Special handling for:
- `variable_costsAmount4`: Variable costs vector
- `amounts_per_unitAmount5`: Amounts per unit vector
- `variable_RevAmount6`: Revenue quantities vector
- `amounts_per_unitRevAmount7`: Revenue prices vector

### 4. Table Construction
```python
def build_and_save_table(version):
    """
    Main table building logic
    Creates DataFrame with years as rows and properties as columns
    """
```
- Initializes DataFrame with plant lifetime as row count
- Populates values from each configuration module
- Forward-fills missing values to ensure continuity
- Saves as CSV with year index

## Data Structures and Processing Logic

### Property Mapping Dictionary
```python
property_mapping = {
    "plantLifetimeAmount10": "Plant Lifetime",
    "bECAmount11": "Bare Erected Cost",
    "numberOfUnitsAmount12": "Number of Units",
    # ... 100+ property mappings
}
```
Comprehensive mapping covering:
- Financial parameters (costs, revenues, taxes)
- Operational parameters (plant lifetime, units)
- Construction parameters (years, contingencies)
- Vector properties (v40-v59, r60-r79)

### Data Flow
1. **Input**: Multiple JSON configuration modules from `config_modules.py`
2. **Processing**:
   - Load all modules for the version
   - Extract properties from first module to define columns
   - Create DataFrame with years 1 to plant lifetime
   - Populate values from each module at its start year
   - Forward-fill to propagate values forward in time
3. **Output**: CSV file `Variable_Table({version}).csv` with complete time-series data

### DataFrame Structure
```
Year | Plant Lifetime | Bare Erected Cost | Number of Units | ... | v40 | v41 | ...
-----|----------------|-------------------|-----------------|-----|-----|-----|----
1    | 25             | 1000000          | 5               | ... | 100 | 200 | ...
2    | 25             | 1000000          | 5               | ... | 100 | 200 | ...
...  | ...            | ...              | ...             | ... | ... | ... | ...
```

## Integration with Other Configuration Components

### Dependencies
1. **config_modules.py Output**: Reads JSON configuration modules
   - Expects files: `{version}_config_module_{start_year}.json`
   - Requires proper JSON structure with all configuration properties

2. **Results Directory Structure**:
   ```
   Original/
   └── Batch({version})/
       └── Results({version})/
           ├── {version}_config_module_1.json
           ├── {version}_config_module_5.json
           └── Variable_Table({version}).csv  # Output
   ```

### Integration Points
- **Upstream**: Depends on config_modules.py to create configuration modules
- **Downstream**: Provides consolidated table for:
  - Financial calculations in CFA modules
  - Sensitivity analysis
  - Report generation
  - Visualization components

## Usage Patterns

### Command Line Execution
```bash
python Table.py [version]
# Example: python Table.py 1
```

### Programmatic Usage
```python
from Table import build_and_save_table

# Build table for version 1
build_and_save_table(version=1)
```

### Output File Location
```
Original/Batch({version})/Results({version})/Variable_Table({version}).csv
```

## Best Practices

### 1. Version Management
- Always ensure configuration modules exist before running Table.py
- Use consistent version numbers across the pipeline
- Verify plant lifetime matches across all modules

### 2. Data Validation
- Check for missing configuration modules in the time series
- Verify all expected properties are present in the output
- Validate vector property expansions are complete

### 3. Performance Considerations
- Forward-filling is memory efficient for large datasets
- CSV output allows easy inspection and further processing
- Logging captures processing details for debugging

### 4. Error Handling
- Gracefully handles missing modules with appropriate logging
- Continues processing even if individual properties are missing
- Provides detailed error messages for troubleshooting

### 5. Maintenance Guidelines
- Keep property_mapping dictionary synchronized with configuration changes
- Update vector property handling when new vectors are added
- Maintain consistent file naming conventions

## Common Issues and Solutions

### Missing Configuration Modules
**Issue**: "No config modules found in results folder"
**Solution**: Ensure config_modules.py has run successfully first

### Incomplete Time Series
**Issue**: Gaps in the output table
**Solution**: Check that configuration modules cover the entire plant lifetime

### Property Mapping Mismatches
**Issue**: Technical IDs appear instead of readable names
**Solution**: Update property_mapping dictionary with new properties

### Vector Property Errors
**Issue**: Vector values not properly expanded
**Solution**: Verify vector property names in expand_vector_properties function

## Extension Points

### Adding New Properties
1. Add mapping in `property_mapping` dictionary
2. If vector property, add handling in `collect_properties_from_config_module`
3. Test with sample configuration modules

### Custom Output Formats
- Modify `build_and_save_table` to support additional formats (Excel, JSON)
- Add data validation before saving
- Implement custom column ordering

### Integration Enhancements
- Add API endpoints for table generation
- Implement caching for frequently accessed tables
- Create differential tables showing changes between versions