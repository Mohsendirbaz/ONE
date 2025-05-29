# album_organizer.py - Plot Album Organizer

## Overview
Utility script that organizes PNG plot files into standardized album directories compatible with the Front_Subtab_Plot.py server.

## Key Functionality

### Core Operations

1. **Directory Scanning**
   - Identifies all batch directories in Original folder
   - Locates AnnotatedStaticPlots directories
   - Extracts version numbers and plot identifiers

2. **File Organization**
   - Groups PNG files by plot type
   - Creates standardized album directories
   - Maintains original file structure while organizing

3. **Album Creation**
   - Generates albums with naming convention: `{versions_id}_PlotType_{plot_type}`
   - Copies relevant PNG files to albums
   - Preserves file metadata and timestamps

## Directory Structure

### Input
```
Original/
└── Batch(4)/
    └── Results(4)/
        └── v4_5_AnnotatedStaticPlots/
            ├── aggregated_cashflow_v4_5.png
            ├── aggregated_revenue_v4_5.png
            └── ...
```

### Output
```
Original/
└── Batch(4)/
    └── Results(4)/
        ├── v4_5_PlotType_cashflow/
        │   └── aggregated_cashflow_v4_5.png
        └── v4_5_PlotType_revenue/
            └── aggregated_revenue_v4_5.png
```

## File Pattern Recognition

- Batch directories: `Batch(X)`
- Plot directories: `*_AnnotatedStaticPlots`
- PNG files: `aggregated_{plot_type}_{versions_id}.png`

## Logging

- Comprehensive logging of operations
- Info level: successful operations
- Warning level: invalid formats or missing files
- Detailed progress tracking

## Usage
```python
organize_plot_albums(base_dir=None)  # Uses default Original directory
```

## Integration Points

- **Front_Subtab_Plot Server**: Compatible album structure
- **Visualization System**: Organized plot access
- **Batch Processing**: Handles multiple versions simultaneously