"""
Probing Integration Module

This module provides integration points between the probing module
(file_associations and insights_generator) and the financial-entity-analyzer
and financial_entity_visualizations modules.
"""

import os
import sys
import glob
from pathlib import Path

def get_project_root():
    """Get the project root directory."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_latest_file_associations_data():
    """
    Get the paths to the latest file associations data files.
    
    Returns:
        dict: A dictionary containing paths to the latest data files.
    """
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
    Get the paths to the financial entity visualizations.
    
    Returns:
        list: A list of paths to the financial entity visualization files.
    """
    project_root = get_project_root()
    visualizations_dir = os.path.join(project_root, "financial_entity_visualizations")
    
    # Find all JS files in the visualizations directory
    js_files = glob.glob(os.path.join(visualizations_dir, "*.js"))
    
    # Find the HTML file
    html_files = glob.glob(os.path.join(visualizations_dir, "*.html"))
    
    return {
        "js_files": js_files,
        "html_files": html_files
    }

def get_financial_entity_analyzer_data():
    """
    Get the paths to the financial entity analyzer data.
    
    Returns:
        dict: A dictionary containing paths to the financial entity analyzer data.
    """
    project_root = get_project_root()
    analyzer_dir = os.path.join(project_root, "financial-entity-analyzer")
    
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

def generate_integrated_report(output_path=None):
    """
    Generate an integrated report that combines data from all modules.
    
    Args:
        output_path (str, optional): Path to the output file. If None, a default path will be used.
        
    Returns:
        str: Path to the generated report.
    """
    project_root = get_project_root()
    
    if output_path is None:
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(project_root, f"integrated_report_{timestamp}.html")
    
    # Get data from all modules
    file_associations_data = get_latest_file_associations_data()
    financial_entity_visualizations = get_financial_entity_visualizations()
    financial_entity_analyzer_data = get_financial_entity_analyzer_data()
    
    # TODO: Generate an integrated report using the data from all modules
    
    return output_path