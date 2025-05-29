# add_axis_labels.py - Axis Label Generator

## Overview
Command-line utility that generates human-readable axis labels for sensitivity analysis plots by processing parameter variations and extracting baseline values.

## Key Functionality

### Core Operations

1. **Modified Value Calculation**
   - Supports multiple variation modes: percentage, directvalue, absolutedeparture, montecarlo
   - Calculates actual modified values based on baseline and variation

2. **Axis Label Generation**
   - Creates formatted labels with parameter names and variation values
   - Includes actual modified values in currency format
   - Special handling for economic parameters (S80-S90)

3. **Plot Coordination**
   - Groups parameters by compareToKey for plot organization
   - Generates plot coordinates for visualization
   - Supports both traditional and economic parameter plotting

## Command Usage
```bash
python add_axis_labels.py <version>
```

## Data Processing

### Input Files
- `calsen_paths.json`: Sensitivity configuration with parameter variations
- `SensitivityPlotDatapoints_{version}.json`: Baseline values and data points

### Output Enhancement
Adds to `calsen_paths.json`:
- `axisLabel`: Formatted label for Y-axis
- `compareToKeyLabel`: Formatted label for X-axis
- `plotCoordinates`: Coordinate pairs for plotting
- `plotGroups`: Parameter groupings by compareToKey

## Special Features

### Economic Parameters (S80-S90)
- Maps to predefined economic metrics list
- Special label formatting without variation values
- Coordinate extraction from metrics data

### Traditional Parameters (S1-S79)
- Property mapping from configuration
- Variation values included in labels
- Currency formatting for values

## Integration Points

- **Property Mapping**: Uses hardcoded mapping for parameter names
- **Configuration Files**: Reads baseline values from config modules
- **Plot Generation**: Provides structured data for visualization

## Error Handling
- Fallback values for missing baselines
- Warning logs for missing mappings
- Graceful handling of file access errors