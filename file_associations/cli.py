"""
Command-line interface for the file association tracking system.

This module provides a command-line interface for analyzing file associations
in a project.
"""

import os
import argparse
from typing import Union
from os import PathLike

from .main import analyze_project_associations


def main():
    """
    Main entry point for the command-line interface.
    """
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Analyze file associations in a project')
    
    # Get the script directory path
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    # Set default project path to the parent directory of the script
    default_project_path = os.path.dirname(current_script_path)
    
    parser.add_argument('--project_path', type=str, default=default_project_path,
                        help='Path to the project directory to analyze')
    
    args = parser.parse_args()
    
    # Use the provided path
    project_path = args.project_path
    
    try:
        output_dir = analyze_project_associations(project_path)
        print(f"File association analysis complete. Output saved to {output_dir}")
    except Exception as e:
        print(f"Error during analysis: {str(e)}")


if __name__ == "__main__":
    main()