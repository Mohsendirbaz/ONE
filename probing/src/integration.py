"""
Probing Integration Module

This module provides integration points between the probing module
(file_associations and insights_generator) and the financial-entity-analyzer
and financial_entity_visualizations modules.

This module now uses an interface-based implementation for visualizations
instead of the previous HTML-based service.
"""

import os
import glob
import json

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

    Returns:
        dict: A dictionary containing available visualization types and their interfaces.
    """
    # Get available visualization types
    visualization_types = get_available_visualizations()

    # Create visualization interfaces for each type
    visualizations = {}
    for viz_type in visualization_types:
        visualizations[viz_type] = VisualizationFactory.create_visualization(viz_type)

    return {
        "available_types": visualization_types,
        "visualization_interfaces": visualizations
    }

def get_financial_entity_analyzer_data():
    """
    Get the paths to the financial entity analyzer data.

    Returns:
        dict: A dictionary containing paths to the financial entity analyzer data.
    """
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

    Returns:
        dict: A dictionary containing available analyzer types and their interfaces.
    """
    # Get available analyzer types
    analyzer_types = get_available_analyzers()

    # Create analyzer interfaces for each type
    analyzers = {}
    for analyzer_type in analyzer_types:
        analyzers[analyzer_type] = CodeEntityFactory.create_analyzer(analyzer_type)

    return {
        "available_types": analyzer_types,
        "analyzer_interfaces": analyzers
    }

def generate_integrated_report(output_path=None, format_type='json'):
    """
    Generate an integrated report that combines data from all modules using the interface-based implementation.

    Args:
        output_path (str, optional): Path to the output file. If None, a default path will be used.
        format_type (str, optional): Format of the output file ('json', 'html', etc.). Defaults to 'json'.

    Returns:
        str: Path to the generated report.
    """
    project_root = get_project_root()

    if output_path is None:
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        extension = format_type.lower()
        output_path = os.path.join(project_root, f"integrated_report_{timestamp}.{extension}")

    # Get data from all modules
    file_associations_data = get_latest_file_associations_data()
    financial_entity_visualizations = get_financial_entity_visualizations()
    financial_entity_analyzer_data = get_financial_entity_analyzer_data()
    code_entity_analyzers = get_code_entity_analyzers()

    # Generate sample data for visualizations (in a real implementation, this would use actual data)
    sample_visualization_data = {
        'calculation_flow': {
            'calculationBlocks': {
                'revenue': [{ 'name': 'Revenue Calculation', 'formula': 'units_sold * price_per_unit' }],
                'costs': [{ 'name': 'Cost Calculation', 'formula': 'fixed_costs + (units_sold * variable_cost_per_unit)' }],
                'profit': [{ 'name': 'Profit Calculation', 'formula': 'revenue - costs - depreciation' }]
            }
        },
        'parameter_influence': {
            'parameters': [
                ['price_per_unit', { 'type': 'input' }],
                ['units_sold', { 'type': 'input' }],
                ['revenue', { 'type': 'calculated' }]
            ],
            'dependencies': [
                { 'source': 'price_per_unit', 'target': 'revenue', 'weight': 1 },
                { 'source': 'units_sold', 'target': 'revenue', 'weight': 1 }
            ]
        }
    }

    # Sample code for code entity analysis
    sample_code = """
    import React, { useState, useEffect } from 'react';
    import { connect } from 'react-redux';

    function FinancialComponent(props) {
        const [revenue, setRevenue] = useState(0);
        const [costs, setCosts] = useState(0);

        useEffect(() => {
            // Calculate profit
            const profit = revenue - costs;
            props.updateProfit(profit);
        }, [revenue, costs, props.updateProfit]);

        return (
            <div>
                <h2>Financial Component</h2>
                <div>Revenue: {revenue}</div>
                <div>Costs: {costs}</div>
                <div>Profit: {revenue - costs}</div>
            </div>
        );
    }

    const mapStateToProps = (state) => ({
        taxRate: state.financial.taxRate
    });

    const mapDispatchToProps = {
        updateProfit: (profit) => ({ type: 'UPDATE_PROFIT', payload: profit })
    };

    export default connect(mapStateToProps, mapDispatchToProps)(FinancialComponent);
    """

    # Generate visualizations and code analysis using the interface-based implementation
    report_data = {
        'file_associations': file_associations_data,
        'financial_entity_analyzer': financial_entity_analyzer_data,
        'visualizations': {},
        'code_analysis': {}
    }

    # Render visualizations using the interface
    for viz_type in financial_entity_visualizations['available_types']:
        if viz_type in sample_visualization_data:
            visualization = financial_entity_visualizations['visualization_interfaces'][viz_type]
            rendered_viz = visualization.render(sample_visualization_data[viz_type])
            report_data['visualizations'][viz_type] = rendered_viz

    # Perform code entity analysis using the interface
    for analyzer_type in code_entity_analyzers['available_types']:
        analyzer = code_entity_analyzers['analyzer_interfaces'][analyzer_type]
        analysis_results = analyzer.analyze(sample_code)
        report_data['code_analysis'][analyzer_type] = analysis_results

    # Write the report to the output file
    with open(output_path, 'w') as f:
        json.dump(report_data, f, indent=2)

    return output_path
