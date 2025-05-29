# sense_config_base.py - Sensitivity Configuration Base Module

## Overview
Flask API service that manages sensitivity configuration copying and data point generation. Provides independent configuration module processing with comprehensive logging and error handling.

## Key Functionality

### Endpoints

1. **POST /copy-config-modules**: Process configuration modules with sensitivity variations
2. **GET /health**: Health check endpoint for service monitoring

### Core Operations

1. **Configuration Module Processing**
   - Applies sensitivity variations to all config modules (1-100)
   - 5-minute pause before processing to ensure file availability
   - Copies CSV files and Python configurations
   - Creates modified configurations for each parameter variation

2. **Data Points Generation**
   - Creates `SensitivityPlotDatapoints_{version}.json`
   - Calculates actual modified values using sensitivity functions
   - Generates baseline and variation data structures
   - Includes metadata explaining data structure

3. **Directory Management**
   - Creates sensitivity directory structure
   - Organizes by parameter, mode, and variation
   - Maintains ConfigurationPlotSpec directory

## Data Structures

### Request Format
```json
{
  "version": 4,
  "parameters": {
    "S35": {
      "enabled": true,
      "mode": "percentage",
      "values": [10, -10],
      "compareToKey": "S13"
    }
  }
}
```

### SensitivityPlotDatapoints Structure
```json
{
  "metadata": {
    "structure_explanation": {
      "S35,S13": "Key format: 'enabledParam,compareToKey'",
      "baseline": "Reference point measurement",
      "info": "Position indicator: '+' (all above), '-' (all below), or 'b#'",
      "data": "Collection of variation measurements"
    }
  },
  "S35,S13": {
    "baseline": {"10000": null},
    "info": "b1",
    "data": {
      "11000": null,
      "9000": null
    }
  }
}
```

## Processing Summary
```json
{
  "total_found": 50,
  "total_modified": 100,
  "errors": [],
  "processed_modules": {
    "S35_+10.00": [1, 2, 3, ...],
    "S35_-10.00": [1, 2, 3, ...]
  },
  "csv_files_copied": 4,
  "py_files_copied": 2
}
```

## Directory Structure
```
backend/Original/
├── Batch(4)/
│   ├── Results(4)/
│   │   ├── Sensitivity/
│   │   │   └── S35/
│   │   │       └── percentage/
│   │   │           ├── +10.00/
│   │   │           │   ├── 4_config_module_*.json
│   │   │           │   └── *.csv
│   │   │           └── -10.00/
│   │   └── SensitivityPlotDatapoints_4.json
│   └── ConfigurationPlotSpec(4)/
│       └── configurations(4).py
```

## Integration Points

- **Sen_Config Module**: Imports sensitivity variation functions
- **Configuration Status**: Checks/saves configuration state
- **File Management**: Comprehensive file copying and modification

## Mode Normalization
- `symmetrical`, `multiple` → `symmetrical`
- `discrete` → `multipoint`
- Others → lowercase

## Logging
- Main logs: `CONFIG_COPY.log`
- Sensitivity logs: `SENSITIVITY.log`
- Separate loggers for different concerns

## Port Configuration
- Default port: 2600
- Debug mode enabled