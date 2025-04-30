"""
Database Initialization Script for ModEcon Matrix System

This script initializes both PostgreSQL and ClickHouse databases for the ModEcon Matrix System.
It should be run when setting up the application for the first time or when resetting the databases.
"""

import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('database_init')

def initialize_all_databases():
    """
    Initialize all databases required for the ModEcon Matrix System.
    """
    logger.info("Starting database initialization...")
    
    # Initialize PostgreSQL
    try:
        logger.info("Initializing PostgreSQL database...")
        from postgresql_config import initialize_database
        initialize_database()
        logger.info("PostgreSQL database initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing PostgreSQL database: {str(e)}")
        raise
    
    # Initialize ClickHouse
    try:
        logger.info("Initializing ClickHouse database...")
        from clickhouse_config import initialize_clickhouse_database
        initialize_clickhouse_database()
        logger.info("ClickHouse database initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing ClickHouse database: {str(e)}")
        raise
    
    logger.info("All databases initialized successfully.")

def create_sample_data():
    """
    Create sample data in the databases for testing purposes.
    """
    logger.info("Creating sample data...")
    
    # Create sample versions and zones in PostgreSQL
    try:
        logger.info("Creating sample data in PostgreSQL...")
        from postgresql_config import get_db_cursor
        
        with get_db_cursor(commit=True) as cursor:
            # Insert sample versions
            cursor.execute("""
            INSERT INTO versions (version_id, display_label, description)
            VALUES 
                ('v1', 'Base Case', 'Default scenario'),
                ('v2', 'High Growth', 'Optimistic scenario with high growth rates'),
                ('v3', 'Conservative', 'Conservative scenario with lower growth rates')
            ON CONFLICT (version_id) DO NOTHING
            """)
            
            # Insert sample zones
            cursor.execute("""
            INSERT INTO zones (zone_id, display_label, description)
            VALUES 
                ('z1', 'Local', 'Local market segment'),
                ('z2', 'Export', 'Export market segment'),
                ('z3', 'Global', 'Global market segment')
            ON CONFLICT (zone_id) DO NOTHING
            """)
            
            # Insert sample parameters
            cursor.execute("""
            INSERT INTO parameters (parameter_id, display_name, description, parameter_type, default_value)
            VALUES 
                ('p1', 'Growth Rate', 'Annual growth rate', 'percentage', '{"value": 0.05}'),
                ('p2', 'Initial Investment', 'Initial investment amount', 'currency', '{"value": 1000000}'),
                ('p3', 'Operating Costs', 'Annual operating costs', 'currency', '{"value": 500000}')
            ON CONFLICT (parameter_id) DO NOTHING
            """)
            
            # Insert sample matrix values
            cursor.execute("""
            INSERT INTO matrix_values (version_id, zone_id, parameter_id, value, efficacy_periods)
            VALUES 
                ('v1', 'z1', 'p1', '{"value": 0.05}', '[{"start": "2025-01-01", "end": "2030-12-31"}]'),
                ('v1', 'z1', 'p2', '{"value": 1000000}', '[{"start": "2025-01-01", "end": "2025-12-31"}]'),
                ('v1', 'z1', 'p3', '{"value": 500000}', '[{"start": "2025-01-01", "end": "2030-12-31"}]'),
                ('v2', 'z1', 'p1', '{"value": 0.08}', '[{"start": "2025-01-01", "end": "2030-12-31"}]'),
                ('v3', 'z1', 'p1', '{"value": 0.03}', '[{"start": "2025-01-01", "end": "2030-12-31"}]')
            ON CONFLICT (version_id, zone_id, parameter_id) DO NOTHING
            """)
        
        logger.info("Sample data created in PostgreSQL.")
    except Exception as e:
        logger.error(f"Error creating sample data in PostgreSQL: {str(e)}")
        raise
    
    # Create sample data in ClickHouse
    try:
        logger.info("Creating sample data in ClickHouse...")
        from clickhouse_config import get_clickhouse_client, CLICKHOUSE_CONFIG
        from datetime import datetime, timedelta
        
        with get_clickhouse_client() as client:
            # Sample time series data
            time_series_data = []
            start_date = datetime(2025, 1, 1)
            
            for i in range(100):
                timestamp = start_date + timedelta(days=i)
                time_series_data.append({
                    'timestamp': timestamp,
                    'version_id': 'v1',
                    'zone_id': 'z1',
                    'parameter_id': 'p1',
                    'value': 0.05 + (i * 0.001),  # Increasing growth rate
                    'scaling_group_id': 'g1',
                    'scaling_item_id': 's1',
                    'simulation_id': 'sim1'
                })
            
            # Insert time series data
            if time_series_data:
                client.execute(
                    f"INSERT INTO {CLICKHOUSE_CONFIG['database']}.parameter_time_series VALUES",
                    time_series_data
                )
            
            # Sample sensitivity analysis data
            sensitivity_data = []
            for i in range(3):
                for param_id in ['p1', 'p2', 'p3']:
                    sensitivity_data.append({
                        'analysis_id': f'sa{i+1}',
                        'timestamp': datetime.now(),
                        'parameter_id': param_id,
                        'target_metric': 'npv',
                        'sensitivity_value': 0.1 + (i * 0.05),
                        'version_id': 'v1',
                        'zone_id': 'z1'
                    })
            
            # Insert sensitivity data
            if sensitivity_data:
                client.execute(
                    f"INSERT INTO {CLICKHOUSE_CONFIG['database']}.sensitivity_analysis VALUES",
                    sensitivity_data
                )
            
            # Sample optimization path data
            optimization_data = []
            for i in range(10):
                optimization_data.append({
                    'optimization_id': 'opt1',
                    'iteration': i,
                    'timestamp': datetime.now(),
                    'parameter_id': 'p1',
                    'parameter_value': 0.05 + (i * 0.005),
                    'objective_value': 1000000 + (i * 50000),
                    'constraint_violation': max(0, 0.1 - (i * 0.01)),
                    'version_id': 'v1',
                    'zone_id': 'z1'
                })
            
            # Insert optimization data
            if optimization_data:
                client.execute(
                    f"INSERT INTO {CLICKHOUSE_CONFIG['database']}.optimization_paths VALUES",
                    optimization_data
                )
        
        logger.info("Sample data created in ClickHouse.")
    except Exception as e:
        logger.error(f"Error creating sample data in ClickHouse: {str(e)}")
        raise
    
    logger.info("All sample data created successfully.")

if __name__ == "__main__":
    try:
        # Initialize databases
        initialize_all_databases()
        
        # Create sample data if requested
        if len(sys.argv) > 1 and sys.argv[1] == '--with-sample-data':
            create_sample_data()
        
        logger.info("Database initialization completed successfully.")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        sys.exit(1)