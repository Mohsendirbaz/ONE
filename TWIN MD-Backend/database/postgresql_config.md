# postgresql_config.py

## Overview

PostgreSQL Configuration for ModEcon Matrix System

This module provides configuration and utility functions for connecting to
and interacting with PostgreSQL database for the ModEcon Matrix System.
PostgreSQL is used as the primary persistence layer for storing the complex
matrix data structures while maintaining data integrity.

Key features:
- Support for multi-dimensional data structures through JSON/JSONB types
- Efficient storage and retrieval of time-series data for the Efficacy System
- Complex queries and aggregations for the Calculation Integration module
- Transactional integrity for History Tracking system

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/database/postgresql_config.py`

## Dependencies

- `contextlib`
- `os`
- `psycopg2`

## Constants

- `DB_CONFIG`

## Functions

### `get_db_connection()`

Context manager for database connections.
Ensures connections are properly closed after use.

Yields:
    conn: PostgreSQL connection object

### `get_db_cursor(commit)`

Context manager for database cursors.
Automatically handles connection and cursor creation/closing.

Args:
    commit (bool): Whether to commit changes after operations
    
Yields:
    cursor: PostgreSQL cursor object

### `initialize_database()`

Initialize the database schema for the ModEcon Matrix System.
Creates tables for versions, zones, parameters, and matrix values.

### `get_matrix_value(version_id, zone_id, parameter_id)`

Retrieve a specific matrix value.

Args:
    version_id (str): The version identifier
    zone_id (str): The zone identifier
    parameter_id (str): The parameter identifier
    
Returns:
    dict: The matrix value as a dictionary

### `set_matrix_value(version_id, zone_id, parameter_id, value, efficacy_periods)`

Set a matrix value, creating or updating as needed.

Args:
    version_id (str): The version identifier
    zone_id (str): The zone identifier
    parameter_id (str): The parameter identifier
    value (dict): The value to store
    efficacy_periods (list, optional): List of efficacy periods
    
Returns:
    bool: True if successful

## Usage

```python
from backend.database.postgresql_config import ...
```

## Integration Notes

- This module manages configuration settings
- Ensure environment variables are properly set
- Requires PostgreSQL database setup
