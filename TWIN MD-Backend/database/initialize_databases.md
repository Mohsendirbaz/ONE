# initialize_databases.py

## Overview

Database Initialization Script for ModEcon Matrix System

This script initializes both PostgreSQL and ClickHouse databases for the ModEcon Matrix System.
It should be run when setting up the application for the first time or when resetting the databases.

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/database/initialize_databases.py`

## Dependencies

- `clickhouse_config`
- `datetime`
- `logging`
- `os`
- `postgresql_config`
- `sys`

## Functions

### `initialize_all_databases()`

Initialize all databases required for the ModEcon Matrix System.

### `create_sample_data()`

Create sample data in the databases for testing purposes.

## Usage

```python
from backend.database.initialize_databases import ...
```

## Integration Notes

- Requires database connection configuration
- Check database credentials and connectivity
