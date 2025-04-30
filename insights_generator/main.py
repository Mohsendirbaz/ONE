"""
Main Module for Insights Generator

This module provides the main entry point for the insights generator.
It processes the JSON data, extracts insights, and generates the HTML file.
"""

import os
import json
import argparse
import networkx as nx
from typing import Dict, List, Any, Union, Optional
from os import PathLike
from datetime import datetime

from .insights_miner import InsightsMiner
from .interactive_html_generator import InteractiveHTMLGenerator


def generate_insights(
    summary_path: Union[str, PathLike],
    direct_imports_path: Optional[Union[str, PathLike]] = None,
    common_ports_path: Optional[Union[str, PathLike]] = None,
    file_associations_path: Optional[Union[str, PathLike]] = None,
    directory_structure_path: Optional[Union[str, PathLike]] = None,
    output_path: Optional[Union[str, PathLike]] = None
) -> str:
    """
    Generate insights from all file association data sources.

    Args:
        summary_path: Path to the file associations summary JSON file
        direct_imports_path: Path to the direct imports JSON file (optional)
        common_ports_path: Path to the common ports JSON file (optional)
        file_associations_path: Path to the file associations JSON file (optional)
        directory_structure_path: Path to the directory structure JSON file (optional)
        output_path: Path where the output HTML file will be saved (optional)

    Returns:
        The path to the created HTML file
    """
    # Create the insights miner
    miner = InsightsMiner(
        summary_path,
        direct_imports_path,
        common_ports_path,
        file_associations_path,
        directory_structure_path
    )

    # Mine insights
    insights = miner.mine_all_insights()

    # If output path is not provided, create one in the same directory as the summary file
    if output_path is None:
        directory = os.path.dirname(summary_path)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(directory, f"code_insights_{timestamp}.html")

    # Create the HTML generator
    generator = InteractiveHTMLGenerator(insights)

    # Generate the HTML file
    html_path = generator.generate_html(output_path)

    return html_path


def main():
    """
    Main entry point for the insights generator.
    """
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Generate insights from file association data')

    # Get the script directory path
    current_script_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Set default paths
    default_directory_structure_path = os.path.join(current_script_path, "c_backend_directory_structure.json")
    default_file_associations_path = None

    # Find the most recent file associations summary file
    file_associations_dir = os.path.join(current_script_path, "file_associations", "output")
    if os.path.exists(file_associations_dir):
        summary_files = [f for f in os.listdir(file_associations_dir) if f.startswith("file_associations_summary_")]
        if summary_files:
            # Sort by timestamp (newest first)
            summary_files.sort(reverse=True)
            default_file_associations_path = os.path.join(file_associations_dir, summary_files[0])

    parser.add_argument('--summary', type=str, default=default_file_associations_path,
                        help=f'Path to the file associations summary JSON file (default: {default_file_associations_path})')

    parser.add_argument('--direct_imports', type=str,
                        help='Path to the direct imports JSON file')

    parser.add_argument('--common_ports', type=str,
                        help='Path to the common ports JSON file')

    parser.add_argument('--file_associations', type=str,
                        help='Path to the file associations JSON file')

    parser.add_argument('--directory_structure', type=str, default=default_directory_structure_path,
                        help=f'Path to the directory structure JSON file (default: {default_directory_structure_path})')

    parser.add_argument('--output', type=str,
                        help='Path where the output HTML file will be saved')

    args = parser.parse_args()

    try:
        # Check if the summary file exists
        if not args.summary or not os.path.exists(args.summary):
            # Convert to absolute path for clearer error message
            abs_path = os.path.abspath(args.summary) if args.summary else args.summary
            print(f"Error: File associations summary file not found at {abs_path}")
            return 1

        # Generate insights
        html_path = generate_insights(
            args.summary,
            args.direct_imports,
            args.common_ports,
            args.file_associations,
            args.directory_structure,
            args.output
        )

        print(f"Insights generated successfully. HTML file saved to {html_path}")

        # Open the HTML file in the default browser
        print("Opening the HTML file in the default browser...")
        os.startfile(html_path)

        return 0
    except Exception as e:
        print(f"Error generating insights: {str(e)}")
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
