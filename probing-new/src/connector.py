"""
Probing Module Connector

This module serves as the central bridge between different components of the probing system.
It provides data transformation, file detection, and direct integration to ensure
seamless connectivity between file generators and the main interfaces.
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Import from other modules
from .file_monitor import FileChangeMonitor, ensure_directory
from .data_transformer import DataTransformer
from .direct_analyzer import DirectAnalyzer
from .integration_pipeline import ProbingIntegrationPipeline, pipeline

# Helper functions
def get_project_root():
    """Get the project root directory."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ----- MODULE FUNCTIONS -----

def get_integrated_visualizations() -> Dict:
    """
    Get integrated visualization data from all sources.

    Returns:
        Dict: Integrated visualization data
    """
    # Scan for any new files
    pipeline.scan_all()

    return pipeline.cache['visualizations']

def get_integrated_insights() -> Dict:
    """
    Get integrated insights data from all sources.

    Returns:
        Dict: Integrated insights data
    """
    # Scan for any new files
    pipeline.scan_all()

    return pipeline.cache['insights']

def analyze_code_direct(code: str, file_path: str = None, analyzer_type: str = 'dependency') -> Dict:
    """
    Directly analyze code without temporary files.

    Args:
        code: The code to analyze
        file_path: Optional virtual file path
        analyzer_type: Type of analysis to perform

    Returns:
        Dict: Analysis results
    """
    return pipeline.direct_analyze_code(code, file_path, analyzer_type)

def visualize_data_direct(data: Dict, visualization_type: str, options: Optional[Dict] = None) -> Dict:
    """
    Directly generate visualization without temporary files.

    Args:
        data: Data to visualize
        visualization_type: Type of visualization
        options: Optional visualization options

    Returns:
        Dict: Visualization result
    """
    return pipeline.direct_visualization(data, visualization_type, options)

def generate_integrated_report_enhanced(output_path: Optional[str] = None, format_type: str = 'json') -> str:
    """
    Generate an enhanced integrated report that combines data from all modules.

    Args:
        output_path: Optional output file path
        format_type: Format of the output file

    Returns:
        str: Path to the generated report
    """
    # Scan for any new files
    pipeline.scan_all()

    # Get integrated data
    integrated_data = pipeline.get_integrated_data()

    # Determine output path
    if output_path is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(pipeline.output_dir, f"enhanced_report_{timestamp}.{format_type}")

    # Write report
    if format_type.lower() == 'json':
        with open(output_path, 'w') as f:
            json.dump(integrated_data, f, indent=2)
    elif format_type.lower() == 'html':
        # Simple HTML report
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Probing Integrated Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2, h3 {{ color: #333; }}
                .section {{ margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; }}
                pre {{ background-color: #f5f5f5; padding: 10px; overflow: auto; }}
            </style>
        </head>
        <body>
            <h1>Probing Integrated Report</h1>
            <p>Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>

            <div class="section">
                <h2>Visualizations</h2>
                <pre>{json.dumps(integrated_data['visualizations'], indent=2)}</pre>
            </div>

            <div class="section">
                <h2>Insights</h2>
                <pre>{json.dumps(integrated_data['insights'], indent=2)}</pre>
            </div>

            <div class="section">
                <h2>File Associations</h2>
                <pre>{json.dumps(integrated_data['file_associations'], indent=2)}</pre>
            </div>

            <div class="section">
                <h2>Financial Entity</h2>
                <pre>{json.dumps(integrated_data['financial_entity'], indent=2)}</pre>
            </div>

            <div class="section">
                <h2>Code Entity</h2>
                <pre>{json.dumps(integrated_data['code_entity'], indent=2)}</pre>
            </div>
        </body>
        </html>
        """

        with open(output_path, 'w') as f:
            f.write(html_content)
    else:
        raise ValueError(f"Format type '{format_type}' not supported")

    return output_path
