# html_album_organizer.py - Enhanced HTML Album Organizer

## Overview
Advanced script for organizing HTML plot files into standardized album directories optimized for the DynamicSubPlot tab. Provides enhanced metadata generation and consistent file organization.

## Key Functionality

### Core Operations

1. **Version-Based Processing**
   - Supports filtering by specific versions
   - Processes multiple version combinations
   - Maintains version-aware organization

2. **Plot Categorization**
   - Groups plots by type and version combination
   - Creates standardized album naming: `HTML_v{versions_id}_{plot_type}`
   - Handles multi-version plot directories

3. **Metadata Generation**
   - Creates `album_metadata.json` for each album
   - Generates global `html_albums_index.json`
   - Provides frontend-ready data structures

## Command Line Usage
```bash
python html_album_organizer.py [--base-dir /path/to/base] [--versions 1,2,3]
```

## Data Structures

### Album Metadata
```json
{
  "album_id": "HTML_v4_5_Revenue",
  "version": "4",
  "versions": [4, 5],
  "versions_identifier": "4_5",
  "plot_type": "Revenue",
  "metric_name": "Revenue",
  "display_name": "Revenue for versions [4, 5]",
  "html_files": ["plot1.html", "plot2.html"],
  "description": "Interactive visualization of Revenue across multiple versions",
  "category": "financial_analysis",
  "created": true
}
```

### Global Index
```json
{
  "albums": [
    {
      "version": "4",
      "versions_id": "4_5",
      "plot_type": "Revenue",
      "album_name": "HTML_v4_5_Revenue",
      "path": "/path/to/album"
    }
  ],
  "count": 10,
  "types": ["Revenue", "Cash_Flow", "Expenses"],
  "versions": ["3", "4", "5"]
}
```

## Directory Patterns

### Input Structure
```
Original/
└── Batch(4)/
    └── Results(4)/
        ├── v4_Revenue_Plot/
        ├── v4_5_Cash_Flow_Plot/
        └── v4_5_6_Expenses/
```

### Output Structure
```
Original/
└── Batch(4)/
    └── Results(4)/
        ├── HTML_v4_Revenue/
        │   ├── *.html
        │   └── album_metadata.json
        ├── HTML_v4_5_Cash_Flow/
        │   ├── *.html
        │   └── album_metadata.json
        └── html_albums_index.json
```

## Enhanced Features

1. **Safe JSON Writing**: Error-handled JSON serialization
2. **Directory Validation**: Ensures directories exist before operations
3. **Duplicate Prevention**: Checks file sizes to avoid redundant copies
4. **Comprehensive Logging**: File and console logging with timestamps

## Integration Points

- **Front_Subtab_HTML Server**: Compatible album structure
- **DynamicSubPlot Tab**: Enhanced metadata for dynamic rendering
- **Version Management**: Multi-version plot support
- **Frontend Integration**: Structured data for UI components

## Error Handling

- Graceful handling of missing directories
- Invalid format warnings with continuation
- Safe file operations with existence checks
- Detailed error logging for debugging