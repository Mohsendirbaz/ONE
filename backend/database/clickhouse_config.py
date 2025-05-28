"""
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
"""

import os
from clickhouse_driver import Client
from contextlib import contextmanager

# Database connection parameters
CLICKHOUSE_CONFIG = {
    'host': os.environ.get('CLICKHOUSE_HOST', 'localhost'),
    'port': os.environ.get('CLICKHOUSE_PORT', 9000),
    'user': os.environ.get('CLICKHOUSE_USER', 'default'),
    'password': os.environ.get('CLICKHOUSE_PASSWORD', ''),
    'database': os.environ.get('CLICKHOUSE_DB', 'modecon_analytics'),
}

@contextmanager
def get_clickhouse_client():
    """
    Context manager for ClickHouse client connections.
    Ensures connections are properly handled.
    
    Yields:
        client: ClickHouse client object
    """
    client = Client(**CLICKHOUSE_CONFIG)
    try:
        yield client
    finally:
        # ClickHouse client doesn't need explicit closing
        pass

def initialize_clickhouse_database():
    """
    Initialize the ClickHouse database schema for the ModEcon Matrix System.
    Creates tables for analytical data storage.
    """
    with get_clickhouse_client() as client:
        # Create database if it doesn't exist
        client.execute(f"CREATE DATABASE IF NOT EXISTS {CLICKHOUSE_CONFIG['database']}")
        
        # Use the database
        client.execute(f"USE {CLICKHOUSE_CONFIG['database']}")
        
        # Create time-series data table for parameter values
        client.execute("""
        CREATE TABLE IF NOT EXISTS parameter_time_series (
            timestamp DateTime,
            version_id String,
            zone_id String,
            parameter_id String,
            value Float64,
            scaling_group_id String,
            scaling_item_id String,
            simulation_id String,
            INDEX idx_version_zone (version_id, zone_id) TYPE minmax GRANULARITY 8,
            INDEX idx_parameter (parameter_id) TYPE minmax GRANULARITY 8,
            INDEX idx_simulation (simulation_id) TYPE minmax GRANULARITY 8
        ) ENGINE = MergeTree()
        ORDER BY (timestamp, version_id, zone_id, parameter_id)
        PARTITION BY toYYYYMM(timestamp)
        """)
        
        # Create sensitivity analysis results table
        client.execute("""
        CREATE TABLE IF NOT EXISTS sensitivity_analysis (
            analysis_id String,
            timestamp DateTime,
            parameter_id String,
            target_metric String,
            sensitivity_value Float64,
            version_id String,
            zone_id String,
            INDEX idx_parameter (parameter_id) TYPE minmax GRANULARITY 8,
            INDEX idx_metric (target_metric) TYPE minmax GRANULARITY 8
        ) ENGINE = MergeTree()
        ORDER BY (analysis_id, parameter_id, target_metric)
        PARTITION BY toYYYYMM(timestamp)
        """)
        
        # Create optimization path table
        client.execute("""
        CREATE TABLE IF NOT EXISTS optimization_paths (
            optimization_id String,
            iteration UInt32,
            timestamp DateTime,
            parameter_id String,
            parameter_value Float64,
            objective_value Float64,
            constraint_violation Float64,
            version_id String,
            zone_id String,
            INDEX idx_optimization (optimization_id) TYPE minmax GRANULARITY 8
        ) ENGINE = MergeTree()
        ORDER BY (optimization_id, iteration)
        PARTITION BY toYYYYMM(timestamp)
        """)
        
        # Create calculation flow metrics table
        client.execute("""
        CREATE TABLE IF NOT EXISTS calculation_flow_metrics (
            calculation_id String,
            timestamp DateTime,
            node_id String,
            execution_time_ms UInt32,
            memory_usage_kb UInt32,
            input_parameters String,
            output_parameters String,
            version_id String,
            zone_id String,
            INDEX idx_calculation (calculation_id) TYPE minmax GRANULARITY 8,
            INDEX idx_node (node_id) TYPE minmax GRANULARITY 8
        ) ENGINE = MergeTree()
        ORDER BY (calculation_id, node_id)
        PARTITION BY toYYYYMM(timestamp)
        """)

def store_parameter_time_series(time_series_data):
    """
    Store parameter time series data in ClickHouse.
    
    Args:
        time_series_data (list): List of dictionaries containing time series data
            Each dict should have: timestamp, version_id, zone_id, parameter_id,
            value, scaling_group_id, scaling_item_id, simulation_id
            
    Returns:
        bool: True if successful
    """
    with get_clickhouse_client() as client:
        client.execute(
            f"INSERT INTO {CLICKHOUSE_CONFIG['database']}.parameter_time_series VALUES",
            time_series_data
        )
        return True

def store_sensitivity_analysis(sensitivity_data):
    """
    Store sensitivity analysis results in ClickHouse.
    
    Args:
        sensitivity_data (list): List of dictionaries containing sensitivity data
            Each dict should have: analysis_id, timestamp, parameter_id, 
            target_metric, sensitivity_value, version_id, zone_id
            
    Returns:
        bool: True if successful
    """
    with get_clickhouse_client() as client:
        client.execute(
            f"INSERT INTO {CLICKHOUSE_CONFIG['database']}.sensitivity_analysis VALUES",
            sensitivity_data
        )
        return True

def store_optimization_path(optimization_data):
    """
    Store optimization path data in ClickHouse.
    
    Args:
        optimization_data (list): List of dictionaries containing optimization data
            Each dict should have: optimization_id, iteration, timestamp, parameter_id,
            parameter_value, objective_value, constraint_violation, version_id, zone_id
            
    Returns:
        bool: True if successful
    """
    with get_clickhouse_client() as client:
        client.execute(
            f"INSERT INTO {CLICKHOUSE_CONFIG['database']}.optimization_paths VALUES",
            optimization_data
        )
        return True

def get_parameter_sensitivity(parameter_id, target_metric, version_id=None, zone_id=None):
    """
    Get sensitivity analysis results for a parameter.
    
    Args:
        parameter_id (str): The parameter identifier
        target_metric (str): The target metric
        version_id (str, optional): Filter by version
        zone_id (str, optional): Filter by zone
        
    Returns:
        list: List of sensitivity analysis results
    """
    query = f"""
    SELECT analysis_id, timestamp, parameter_id, target_metric, sensitivity_value, version_id, zone_id
    FROM {CLICKHOUSE_CONFIG['database']}.sensitivity_analysis
    WHERE parameter_id = %(parameter_id)s AND target_metric = %(target_metric)s
    """
    
    params = {
        'parameter_id': parameter_id,
        'target_metric': target_metric
    }
    
    if version_id:
        query += " AND version_id = %(version_id)s"
        params['version_id'] = version_id
        
    if zone_id:
        query += " AND zone_id = %(zone_id)s"
        params['zone_id'] = zone_id
    
    query += " ORDER BY timestamp DESC"
    
    with get_clickhouse_client() as client:
        results = client.execute(query, params)
        columns = ['analysis_id', 'timestamp', 'parameter_id', 'target_metric', 
                   'sensitivity_value', 'version_id', 'zone_id']
        return [dict(zip(columns, row)) for row in results]

def get_optimization_convergence(optimization_id):
    """
    Get optimization convergence data for visualization.
    
    Args:
        optimization_id (str): The optimization identifier
        
    Returns:
        list: List of optimization iterations with objective values
    """
    query = f"""
    SELECT iteration, objective_value, constraint_violation
    FROM {CLICKHOUSE_CONFIG['database']}.optimization_paths
    WHERE optimization_id = %(optimization_id)s
    ORDER BY iteration
    """
    
    with get_clickhouse_client() as client:
        results = client.execute(query, {'optimization_id': optimization_id})
        columns = ['iteration', 'objective_value', 'constraint_violation']
        return [dict(zip(columns, row)) for row in results]