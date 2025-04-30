"""
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
"""

import os
import psycopg2
from psycopg2.extras import Json, DictCursor
from contextlib import contextmanager

# Database connection parameters
DB_CONFIG = {
    'dbname': os.environ.get('POSTGRES_DB', 'modecon_matrix'),
    'user': os.environ.get('POSTGRES_USER', 'postgres'),
    'password': os.environ.get('POSTGRES_PASSWORD', 'postgres'),
    'host': os.environ.get('POSTGRES_HOST', 'localhost'),
    'port': os.environ.get('POSTGRES_PORT', '5432'),
}

@contextmanager
def get_db_connection():
    """
    Context manager for database connections.
    Ensures connections are properly closed after use.
    
    Yields:
        conn: PostgreSQL connection object
    """
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        yield conn
    finally:
        if conn is not None:
            conn.close()

@contextmanager
def get_db_cursor(commit=False):
    """
    Context manager for database cursors.
    Automatically handles connection and cursor creation/closing.
    
    Args:
        commit (bool): Whether to commit changes after operations
        
    Yields:
        cursor: PostgreSQL cursor object
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=DictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise e

def initialize_database():
    """
    Initialize the database schema for the ModEcon Matrix System.
    Creates tables for versions, zones, parameters, and matrix values.
    """
    with get_db_cursor(commit=True) as cursor:
        # Create versions table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS versions (
            id SERIAL PRIMARY KEY,
            version_id VARCHAR(50) UNIQUE NOT NULL,
            display_label VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            source_version_id VARCHAR(50),
            inheritance_percentage FLOAT
        )
        """)
        
        # Create zones table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS zones (
            id SERIAL PRIMARY KEY,
            zone_id VARCHAR(50) UNIQUE NOT NULL,
            display_label VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Create parameters table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS parameters (
            id SERIAL PRIMARY KEY,
            parameter_id VARCHAR(100) UNIQUE NOT NULL,
            display_name VARCHAR(200) NOT NULL,
            description TEXT,
            parameter_type VARCHAR(50) NOT NULL,
            default_value JSONB
        )
        """)
        
        # Create matrix_values table with JSONB for flexible storage
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS matrix_values (
            id SERIAL PRIMARY KEY,
            version_id VARCHAR(50) REFERENCES versions(version_id),
            zone_id VARCHAR(50) REFERENCES zones(zone_id),
            parameter_id VARCHAR(100) REFERENCES parameters(parameter_id),
            value JSONB NOT NULL,
            efficacy_periods JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(version_id, zone_id, parameter_id)
        )
        """)
        
        # Create scaling_items table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS scaling_items (
            id SERIAL PRIMARY KEY,
            scaling_id VARCHAR(100) UNIQUE NOT NULL,
            parameter_id VARCHAR(100) REFERENCES parameters(parameter_id),
            group_id VARCHAR(100),
            scaling_type VARCHAR(50) NOT NULL,
            scaling_value JSONB NOT NULL,
            efficacy_periods JSONB,
            version_id VARCHAR(50) REFERENCES versions(version_id),
            zone_id VARCHAR(50) REFERENCES zones(zone_id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Create history_tracking table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS history_tracking (
            id SERIAL PRIMARY KEY,
            action_type VARCHAR(50) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id VARCHAR(100) NOT NULL,
            previous_state JSONB,
            new_state JSONB,
            user_id VARCHAR(100),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT
        )
        """)

def get_matrix_value(version_id, zone_id, parameter_id):
    """
    Retrieve a specific matrix value.
    
    Args:
        version_id (str): The version identifier
        zone_id (str): The zone identifier
        parameter_id (str): The parameter identifier
        
    Returns:
        dict: The matrix value as a dictionary
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
        SELECT value, efficacy_periods
        FROM matrix_values
        WHERE version_id = %s AND zone_id = %s AND parameter_id = %s
        """, (version_id, zone_id, parameter_id))
        
        result = cursor.fetchone()
        if result:
            return {
                'value': result['value'],
                'efficacy_periods': result['efficacy_periods']
            }
        return None

def set_matrix_value(version_id, zone_id, parameter_id, value, efficacy_periods=None):
    """
    Set a matrix value, creating or updating as needed.
    
    Args:
        version_id (str): The version identifier
        zone_id (str): The zone identifier
        parameter_id (str): The parameter identifier
        value (dict): The value to store
        efficacy_periods (list, optional): List of efficacy periods
        
    Returns:
        bool: True if successful
    """
    with get_db_cursor(commit=True) as cursor:
        # Check if the value exists
        cursor.execute("""
        SELECT id FROM matrix_values
        WHERE version_id = %s AND zone_id = %s AND parameter_id = %s
        """, (version_id, zone_id, parameter_id))
        
        result = cursor.fetchone()
        
        if result:
            # Update existing value
            cursor.execute("""
            UPDATE matrix_values
            SET value = %s, efficacy_periods = %s, updated_at = CURRENT_TIMESTAMP
            WHERE version_id = %s AND zone_id = %s AND parameter_id = %s
            """, (Json(value), Json(efficacy_periods) if efficacy_periods else None, 
                  version_id, zone_id, parameter_id))
        else:
            # Insert new value
            cursor.execute("""
            INSERT INTO matrix_values
            (version_id, zone_id, parameter_id, value, efficacy_periods)
            VALUES (%s, %s, %s, %s, %s)
            """, (version_id, zone_id, parameter_id, Json(value),
                  Json(efficacy_periods) if efficacy_periods else None))
        
        # Add to history tracking
        cursor.execute("""
        INSERT INTO history_tracking
        (action_type, entity_type, entity_id, new_state, description)
        VALUES (%s, %s, %s, %s, %s)
        """, ('UPDATE' if result else 'INSERT', 'matrix_value', 
              f"{version_id}:{zone_id}:{parameter_id}", Json(value),
              f"{'Updated' if result else 'Created'} matrix value"))
        
        return True