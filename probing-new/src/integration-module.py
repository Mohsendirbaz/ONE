"""
Probing Integration Module (Enhanced)

This module provides integration points between the probing module
(file_associations and insights_generator) and the financial-entity-analyzer
and financial_entity_visualizations modules.

This enhanced version uses the connector module for direct integration
between components, eliminating disconnections between file generators and interfaces.
"""

import os
import glob
import json
from datetime import datetime

# Import from the connector module
from probing.src.connector import (
    get_integrated_visualizations,
    get_integrated_insights,
    analyze_code_direct,
    visualize_data_direct,
    generate_integrated_report_enhanced,
    pipeline
)

# Import the visualization interface
from probing.src.visualization_interface import (
    VisualizationFactory,
    get_available_visualizations
)

# Import the code entity interface
from probing.src.code_entity_interface import (
    CodeEntityFactory,
    get_available_analyzers
)

def get_project_root():
    """Get the project root directory."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_latest_file_associations_data():
    """
    Get the paths to the latest file associations data files.

    Returns:
        dict: A dictionary containing paths to the latest data files.
    """
    # Get the data from integration pipeline for more up-to-date information
    pipeline.scan_all()
    if pipeline.cache['file_associations']:
        return pipeline.cache['file_associations']
    
    # Fallback to direct file detection if cache is empty
    project_root = get_project_root()
    output_dir = os.path.join(project_root, "probing", "file_associations", "output")

    # Find the most recent file associations summary file
    summary_files = glob.glob(os.path.join(output_dir, "file_associations_summary_*.json"))

    if not summary_files:
        return None

    # Get the most recent summary file
    latest_summary = max(summary_files, key=os.path.getctime)

    # Extract the timestamp from the summary file
    summary_filename = os.path.basename(latest_summary)
    timestamp_parts = summary_filename.split('_')
    if len(timestamp_parts) >= 3:
        date_part = timestamp_parts[-2]
        time_part = timestamp_parts[-1].split('.')[0]
        timestamp = f"{date_part}_{time_part}"
    else:
        import re
        match = re.search(r'(\d{8}_\d{6})', summary_filename)
        if match:
            timestamp = match.group(1)
        else:
            timestamp = summary_filename.split('_')[-1].split('.')[0]

    # Find the corresponding data files
    direct_imports_path = os.path.join(output_dir, f"direct_imports_{timestamp}.json")
    common_ports_path = os.path.join(output_dir, f"common_ports_{timestamp}.json")
    file_associations_path = os.path.join(output_dir, f"file_associations_{timestamp}.json")

    # Check if the files exist
    result = {
        "summary": latest_summary,
        "timestamp": timestamp,
        "direct_imports": direct_imports_path if os.path.exists(direct_imports_path) else None,
        "common_ports": common_ports_path if os.path.exists(common_ports_path) else None,
        "file_associations": file_associations_path if os.path.exists(file_associations_path) else None
    }

    return result

def get_financial_entity_visualizations():
    """
    Get available financial entity visualizations using the interface-based implementation.
    Enhanced with integrated data from all modules.

    Returns:
        dict: A dictionary containing available visualization types, their interfaces,
              and integrated data from all modules.
    """
    # Get available visualization types
    visualization_types = get_available_visualizations()

    # Create visualization interfaces for each type
    visualizations = {}
    for viz_type in visualization_types:
        visualizations[viz_type] = VisualizationFactory.create_visualization(viz_type)

    # Get integrated visualization data
    integrated_visualization_data = get_integrated_visualizations()

    return {
        "available_types": visualization_types,
        "visualization_interfaces": visualizations,
        "integrated_data": integrated_visualization_data
    }

def get_financial_entity_analyzer_data():
    """
    Get the paths to the financial entity analyzer data.
    Enhanced with data processing from the connector.

    Returns:
        dict: A dictionary containing paths to the financial entity analyzer data.
    """
    # Get the data from integration pipeline for more up-to-date information
    pipeline.scan_all()
    if pipeline.cache['financial_entity']:
        return pipeline.cache['financial_entity']
    
    # Fallback to direct file detection if cache is empty
    project_root = get_project_root()
    analyzer_dir = os.path.join(project_root, "probing", "financial-entity-analyzer")

    # Find all data files in the insights directory
    insights_dir = os.path.join(analyzer_dir, "insights")
    insights_files = []
    if os.path.exists(insights_dir):
        insights_files = glob.glob(os.path.join(insights_dir, "*.json"))

    # Find all visualization files in the visualizations directory
    visualizations_dir = os.path.join(analyzer_dir, "visualizations")
    visualization_files = []
    if os.path.exists(visualizations_dir):
        visualization_files = glob.glob(os.path.join(visualizations_dir, "*.js"))

    return {
        "insights_files": insights_files,
        "visualization_files": visualization_files
    }

def get_code_entity_analyzers():
    """
    Get available code entity analyzers using the interface-based implementation.
    Enhanced with direct analysis capabilities.

    Returns:
        dict: A dictionary containing available analyzer types and their interfaces.
    """
    # Get available analyzer types
    analyzer_types = get_available_analyzers()

    # Create analyzer interfaces for each type
    analyzers = {}
    for analyzer_type in analyzer_types:
        analyzers[analyzer_type] = CodeEntityFactory.create_analyzer(analyzer_type)

    # Add direct analysis function
    analyzers['direct'] = {
        'analyze': analyze_code_direct
    }

    return {
        "available_types": analyzer_types + ['direct'],
        "analyzer_interfaces": analyzers
    }

def generate_integrated_report(output_path=None, format_type='json'):
    """
    Generate an integrated report that combines data from all modules using the enhanced implementation.

    Args:
        output_path (str, optional): Path to the output file. If None, a default path will be used.
        format_type (str, optional): Format of the output file ('json', 'html', etc.). Defaults to 'json'.

    Returns:
        str: Path to the generated report.
    """
    # Use the enhanced implementation
    return generate_integrated_report_enhanced(output_path, format_type)

def analyze_code(code, analyzer_type='component', options=None):
    """
    Analyze code using the specified analyzer type.
    Enhanced to use direct analysis when possible.

    Args:
        code (str): The code to analyze
        analyzer_type (str): The type of analyzer to use
        options (dict, optional): Optional analysis options

    Returns:
        dict: The analysis results
    """
    options = options or {}
    file_path = options.get('file_path')
    
    # Use direct analysis when possible
    return analyze_code_direct(code, file_path, analyzer_type)

def render_visualization(data, visualization_type, options=None):
    """
    Render a visualization using the specified type.
    Enhanced to use direct visualization when possible.

    Args:
        data (dict): The data to visualize
        visualization_type (str): The type of visualization to render
        options (dict, optional): Optional rendering options

    Returns:
        dict: The rendered visualization result
    """
    # Use direct visualization
    return visualize_data_direct(data, visualization_type, options)

def get_insights_data():
    """
    Get integrated insights data from all modules.

    Returns:
        dict: Integrated insights data
    """
    return get_integrated_insights()

def scan_for_changes():
    """
    Scan all monitored directories for changes.
    This function is useful for ensuring data is up to date before querying.

    Returns:
        dict: A dictionary containing the scan results
    """
    return {
        'file_associations': pipeline.file_associations_monitor.scan(),
        'financial_entity': pipeline.financial_entity_monitor.scan(),
        'code_entity': pipeline.code_entity_monitor.scan()
    }

def get_all_integrated_data():
    """
    Get all integrated data from all modules.

    Returns:
        dict: All integrated data
    """
    # Scan for any new files
    pipeline.scan_all()
    
    return pipeline.get_integrated_data()
