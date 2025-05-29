# script_econ.py - Economic Metrics Extractor

## Overview
Command-line utility that extracts economic metrics from CSV files and appends them to sensitivity analysis configuration files based on a selection vector.

## Key Functionality

### Core Operations

1. **Metric Selection**
   - Uses binary selection vector (1=select, 0=ignore)
   - Supports 11 predefined economic metrics
   - Configurable metric extraction

2. **CSV Processing**
   - Reads Economic_Summary CSV files for each parameter variation
   - Extracts rows based on selection vector
   - Handles missing files gracefully

3. **JSON Enhancement**
   - Updates calsen_paths.json with extracted metrics
   - Preserves existing structure while adding metrics
   - Maintains parameter variation organization

## Command Usage
```bash
python script_econ.py --version <version_number>
```

## Economic Metrics List
1. Internal Rate of Return
2. Average Selling Price (Project Life Cycle)
3. Total Overnight Cost (TOC)
4. Average Annual Revenue
5. Average Annual Operating Expenses
6. Average Annual Depreciation
7. Average Annual State Taxes
8. Average Annual Federal Taxes
9. Average Annual After-Tax Cash Flow
10. Cumulative NPV
11. Calculation Mode

## Selection Vector
```python
metrics_selection = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  # Select all metrics
```

## File Paths

### Economic Summary Location
```
Batch({version})/
└── Results({version})/
    └── Sensitivity/
        └── {param_id}/
            └── {mode}/
                └── Configuration/
                    └── {param_id}_{variation}/
                        └── Economic_Summary({version}).csv
```

### Updated Configuration
Adds "metrics" field to each variation in calsen_paths.json:
```json
{
  "path_sets": {
    "S35": {
      "variations": {
        "+10.00": {
          "metrics": {
            "Internal Rate of Return": "15.5%",
            "Average Selling Price": "$1,234.56",
            // ... other selected metrics
          }
        }
      }
    }
  }
}
```

## Error Handling

- File not found warnings with continuation
- CSV parsing error logging
- JSON read/write error management
- Row boundary checking for metrics extraction

## Integration Points

- **calsen_paths.json**: Target configuration file
- **Economic Summary Files**: Source of metric data
- **Sensitivity Analysis**: Part of post-processing workflow