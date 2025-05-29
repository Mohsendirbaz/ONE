# clickhouse_config.py

## Overview

ClickHouse Configuration for ModEcon Matrix System

This module provides configuration and utility functions for connecting to
and interacting with ClickHouse database for the ModEcon Matrix System.
ClickHouse is used as the analytical engine for complex calculations and
time-series data analysis.

Key features:
- Exceptional performance for analytical queries across large datasets
- Columnar storage optimized for time-series data vital for the Efficacy System
- Real-time analysis of scaling impacts and parameter sensitivity
- High-performance for the "Configuration Matrix Generation" requirements
- Support for generating visualization data

## Location

`/mnt/c/Users/Mohse/IdeaProjects3/ONE1/backend/database/clickhouse_config.py`

## Dependencies

- `clickhouse_driver`
- `contextlib`
- `os`

## Constants

- `CLICKHOUSE_CONFIG`

## Functions

### `get_clickhouse_client()`

Context manager for ClickHouse client connections.
Ensures connections are properly handled.

Yields:
    client: ClickHouse client object

### `initialize_clickhouse_database()`

Initialize the ClickHouse database schema for the ModEcon Matrix System.
Creates tables for analytical data storage.

### `store_parameter_time_series(time_series_data)`

Store parameter time series data in ClickHouse.

Args:
    time_series_data (list): List of dictionaries containing time series data
        Each dict should have: timestamp, version_id, zone_id, parameter_id,
        value, scaling_group_id, scaling_item_id, simulation_id
        
Returns:
    bool: True if successful

### `store_sensitivity_analysis(sensitivity_data)`

Store sensitivity analysis results in ClickHouse.

Args:
    sensitivity_data (list): List of dictionaries containing sensitivity data
        Each dict should have: analysis_id, timestamp, parameter_id, 
        target_metric, sensitivity_value, version_id, zone_id
        
Returns:
    bool: True if successful

### `store_optimization_path(optimization_data)`

Store optimization path data in ClickHouse.

Args:
    optimization_data (list): List of dictionaries containing optimization data
        Each dict should have: optimization_id, iteration, timestamp, parameter_id,
        parameter_value, objective_value, constraint_violation, version_id, zone_id
        
Returns:
    bool: True if successful

### `get_parameter_sensitivity(parameter_id, target_metric, version_id, zone_id)`

Get sensitivity analysis results for a parameter.

Args:
    parameter_id (str): The parameter identifier
    target_metric (str): The target metric
    version_id (str, optional): Filter by version
    zone_id (str, optional): Filter by zone
    
Returns:
    list: List of sensitivity analysis results

### `get_optimization_convergence(optimization_id)`

Get optimization convergence data for visualization.

Args:
    optimization_id (str): The optimization identifier
    
Returns:
    list: List of optimization iterations with objective values

## Usage

```python
from backend.database.clickhouse_config import ...
```

## Integration Notes

- This module manages configuration settings
- Ensure environment variables are properly set
- Requires ClickHouse database setup
