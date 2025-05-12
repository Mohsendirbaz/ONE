# cfa_list.py

**Purpose**: Data Processing

**Description**: Flask service (port:4560) - Processes CFA CSV files with version selection

**Functions**: __init__, __init__, update_selected_versions, update_file_path, get_file_path and 20 more

**Classes**: ConsolidationJob:, AppState:

**Dependencies**: flask, flask_cors, os,, pandas, uuid and 3 more

**Keywords**: import, from, flask, cors, logging, datetime, app

## Key Code Sections

### Imports

```
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import os, logging, logging.config
import pandas as pd
import uuid
# ...and 3 more imports
```

### Function: get_cell_details

```
def get_cell_details(self, cell_key: str) -> Optional[Dict]:
        return self.cell_details_cache.get(cell_key)

```

### Function: get_cfa_versions

```
def get_cfa_versions() -> List[str]:
    """
    Find all CFA CSV files with versions 1-100 and return their version numbers.
    Handles multiple approaches to ensure files are found.
    """
    # ... more lines ...
```

### Function: consolidate_data

```
def consolidate_data(versions: List[str]) -> Dict:
    """
    Consolidate data from multiple CFA versions into a single result set
    following specific consolidation policies for different columns.
    """
    # ... more lines ...
```

### Class: ConsolidationJob:

```
class ConsolidationJob:
    def __init__(self, job_id: str, versions: List[str]):
        self.job_id = job_id
        self.versions = versions
        self.status = "pending"  # pending, processing, complete, error
        self.progress = 0
        self.message = "Job created"
        self.start_time = datetime.now()
        self.error = None
        self.results = None
        
```

## File Info

- **Size**: 30.9 KB
- **Lines**: 742
- **Complexity**: 22
