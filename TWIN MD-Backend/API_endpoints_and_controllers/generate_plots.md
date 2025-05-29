# generate_plots.py - Sensitivity Plot Generator

## Overview
Command-line utility that generates both JSON and PNG plot files for sensitivity analysis visualization based on parameter variations and plot coordinates.

## Key Functionality

### Core Operations

1. **Plot Configuration**
   - Loads sensitivity parameters from `calsen_paths.json`
   - Overrides all comparisonTypes to "primary (x axis)"
   - Groups parameters by compareToKey

2. **JSON Plot Generation**
   - Creates structured JSON files for each parameter/plot type combination
   - Uses plotCoordinates from calsen_paths.json
   - Organizes by mode (Percentage, DirectValue, etc.) and plot type

3. **PNG Plot Creation**
   - Generates visual plots using matplotlib
   - Supports multiple plot types: line, bar, point, waterfall
   - Creates high-resolution (300 DPI) PNG files

## Command Usage
```bash
python generate_plots.py <version>
```

## Plot Types

1. **Line Plot**: Default visualization with connected points
2. **Bar Plot**: Vertical bars with transparency
3. **Point Plot**: Scatter plot visualization
4. **Waterfall Plot**: Connected squares showing progression

## Directory Structure

### Output Organization
```
Batch(4)/Results(4)/Sensitivity/
├── Percentage/
│   ├── Bar/
│   │   ├── S35_S13_plot.json
│   │   └── PNG/
│   │       └── S35_S13_plot.png
│   └── Waterfall/
│       ├── S35_S13_plot.json
│       └── PNG/
│           └── S35_S13_plot.png
└── DirectValue/
    └── ...
```

## Data Processing

### Plot Data Structure
```json
{
  "x_param": "S13",
  "y_param": "S35",
  "plot_type": "bar",
  "mode": "percentage",
  "axis_label": "Labor Cost ($1000, $1100, $900)",
  "datapoints": {
    "baseline": {"1000": "5000"},
    "variations": {"1100": "5500", "900": "4500"}
  }
}
```

## Visualization Features

- Grid overlay for readability
- Legend for baseline/variations distinction
- Tight layout for optimal space usage
- Axis labels from processed parameter names

## Integration Points

- **calsen_paths.json**: Source of plot configurations and coordinates
- **SenParameters**: Determines which plot types to generate
- **Front-end Gallery**: PNG files displayed in plot gallery and sensitivity tabs

## Error Handling

- Fallback root directory detection
- Warning messages for missing coordinates
- Empty plot data handling
- File write error management