"""
Command-line script for generating code insights from file association data.

This script provides a convenient way to generate code insights from the command line.
It uses the insights_generator module to mine insights from file association data and
generate an interactive HTML visualization.
"""

import os
import sys
import argparse
from datetime import datetime

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from insights_generator.main import generate_insights


def main():
    """
    Main entry point for the command-line script.
    """
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Generate code insights from file association data')

    # Get the script directory path
    current_script_path = os.path.dirname(os.path.abspath(__file__))

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

        # Check if the directory structure file exists
        if not os.path.exists(args.directory_structure):
            # Convert to absolute path for clearer error message
            abs_path = os.path.abspath(args.directory_structure)
            print(f"Error: Directory structure file not found at {abs_path}")
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

        print(f"Code insights generated successfully. HTML file saved to {html_path}")

        # Open the HTML file in the default browser
        print("Opening the HTML file in the default browser...")
        os.startfile(html_path)

        return 0
    except Exception as e:
        print(f"Error generating code insights: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
