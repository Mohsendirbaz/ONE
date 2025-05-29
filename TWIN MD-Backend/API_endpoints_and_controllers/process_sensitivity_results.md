# process_sensitivity_results.py - Sensitivity Results Processor

## Overview
Independent script that runs after sensitivity calculations to process results, extract metrics, and store structured data using SensitivityFileManager.

## Key Functionality

### Core Operations

1. **Configuration Loading**
   - Loads sensitivity configuration from pickle file
   - Validates configuration structure
   - Updates version information as needed

2. **Price Extraction**
   - Searches multiple directory patterns for Economic_Summary files
   - Extracts "Average Selling Price" metric
   - Handles various file location conventions

3. **Result Storage**
   - Uses SensitivityFileManager for standardized storage
   - Creates structured result data
   - Maintains consistency across sensitivity analysis

## Command Usage
```bash
python process_sensitivity_results.py <version> [max_wait_minutes]
```

### Arguments
- `version`: Calculation version number
- `max_wait_minutes`: Optional maximum wait time (default: 30)

## Workflow

1. **Configuration Check**
   - Waits for configuration files to be ready
   - Monitors parameter variation directories
   - Proceeds after timeout if necessary

2. **Parameter Processing**
   - Iterates through enabled sensitivity parameters
   - Processes each variation
   - Extracts economic metrics

3. **Result Generation**
   - Creates structured result data
   - Stores using file manager
   - Logs processing status

## Directory Search Patterns

```python
search_paths = [
    # Main sensitivity directory
    "Batch({version})/Results({version})/Sensitivity/{param_id}/*/{var_str}/Economic_Summary*.csv",
    
    # Multipoint configuration
    "Batch({version})/Results({version})/Sensitivity/Multipoint/Configuration/{param_id}_{var_str}/Economic_Summary*.csv",
    
    # Symmetrical configuration
    "Batch({version})/Results({version})/Sensitivity/Symmetrical/Configuration/{param_id}_{var_str}/Economic_Summary*.csv"
]
```

## Data Files

### Input
- `sensitivity_config_data.pkl`: Pickled configuration data
- `Economic_Summary*.csv`: Economic calculation results

### Output
- Structured result files via SensitivityFileManager
- Processing logs in SENSITIVITY_RESULTS.log

## Configuration Structure
```python
{
    "versions": [4],
    "SenParameters": {
        "S35": {
            "enabled": True,
            "mode": "percentage",
            "values": [10, -10],
            "compareToKey": "S13"
        }
    }
}
```

## Integration Points

- **SensitivityFileManager**: Standardized result storage
- **Economic Summary Files**: Source of calculation results
- **Configuration System**: Parameter and variation definitions

## Error Handling

- Missing configuration file handling
- Price extraction failure warnings
- Storage error management
- Comprehensive logging throughout