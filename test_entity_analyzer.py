"""
Test script for the entity analyzer.

This script tests the file association tracking system with the new entity analyzer.
"""

import os
import sys
from file_associations.main import analyze_project_associations

def main():
    """
    Main function to test the entity analyzer.
    """
    # Get the current directory (project root)
    project_path = os.path.abspath(os.getcwd())
    
    print(f"Analyzing project at {project_path}...")
    
    # Run the analysis
    output_dir = analyze_project_associations(project_path)
    
    print(f"Analysis complete. Results saved to {output_dir}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())