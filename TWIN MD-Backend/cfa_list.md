# cfa_list.py

## Overview

Flask service (port:4560) - Processes CFA CSV files with version selection

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/cfa_list.py`

## Dependencies

- `datetime`
- `flask`
- `flask_cors`
- `logging`
- `os`
- `pandas`
- `re`
- `time`
- `typing`
- `uuid`

## Constants

- `BASE_PATH`
- `PORT`
- `CFA_PREFIX`

## Classes

### ConsolidationJob

#### Methods

- **`__init__(self, job_id, versions)`**

### AppState

#### Methods

- **`__init__(self)`**
- **`update_selected_versions(self, versions)`**
- **`update_file_path(self, version, path)`**
- **`get_file_path(self, version)`**
- **`create_consolidation_job(self, versions)`**
- **`get_consolidation_job(self, job_id)`**
- **`update_job_progress(self, job_id, progress, message)`**
- **`complete_job(self, job_id, results)`**
- **`fail_job(self, job_id, error)`**
- **`add_cell_details(self, cell_key, details)`**
- **`get_cell_details(self, cell_key)`**

## Functions

### `get_cfa_versions()`

Find all CFA CSV files with versions 1-100 and return their version numbers.
Handles multiple approaches to ensure files are found.

### `consolidate_data(versions)`

Consolidate data from multiple CFA versions into a single result set
following specific consolidation policies for different columns.

### `get_cell_source_data(versions, year, column)`

Get source data for a specific cell from all versions

### `index()`

Render the selection interface

### `api_versions()`

Return the list of available CFA versions

### `directory_structure()`

Debug endpoint to return the directory structure

### `select_versions()`

Update the selected versions based on the request

### `process_cfa_file(version)`

Process the CFA file for the specified version

### `process_selected()`

Process all selected CFA files

### `start_consolidation()`

Start a consolidation job for the specified versions

### `get_consolidation_status(job_id)`

Get the status of a consolidation job

### `get_consolidation_results(job_id)`

Get the results of a completed consolidation job

### `get_cell_details()`

Get detailed breakdown of a specific cell, particularly for summed columns
such as Revenue and Operating Expenses, showing the contribution from each version.

## Usage

```python
from backend.cfa_list import ...
```

## Integration Notes

- This module can be imported and used as needed
