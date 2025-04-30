import os
import sys
from file_associations.main import analyze_project_associations

def main():
    """
    Test the file association analysis with the fixed timestamp extraction logic.
    """
    # Get the project path (current directory)
    project_path = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Analyzing project at: {project_path}")
    
    # Run the analysis
    output_dir = analyze_project_associations(project_path)
    
    print(f"Analysis complete. Output saved to: {output_dir}")
    
    # Check if the output files were created with the correct timestamp format
    output_files = os.listdir(output_dir)
    print("\nOutput files:")
    for file in output_files:
        print(f"  - {file}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())