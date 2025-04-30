"""
Command-line script for generating HTML reports from file association analysis.

This script provides a convenient way to analyze a project for file associations
and generate HTML reports from the analysis results. It combines the functionality
of the file_associations module and the insights_generator module to provide a
complete solution for generating HTML reports.
"""

import os
import sys
import argparse
import glob
from datetime import datetime

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from file_associations.main import analyze_project_associations
from insights_generator.main import generate_insights
from insights_generator.entity_analyzer import CodeEntityAnalyzer


def main():
    """
    Main entry point for the command-line script.
    """
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Generate HTML reports from file association analysis')
    
    # Get the script directory path
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    
    # Set default project path to the current directory
    default_project_path = current_script_path
    
    parser.add_argument('--project_path', type=str, default=default_project_path,
                        help=f'Path to the project directory to analyze (default: {default_project_path})')
    
    parser.add_argument('--output_dir', type=str,
                        help='Path where the output files will be saved (default: file_associations/output)')
    
    args = parser.parse_args()
    
    try:
        # Analyze the project for file associations
        print(f"Analyzing project at {args.project_path}...")
        output_dir = analyze_project_associations(args.project_path)
        
        if args.output_dir:
            output_dir = args.output_dir
        
        print(f"File association analysis complete. Output saved to {output_dir}")
        
        # Find the most recent summary file
        summary_path = os.path.join(output_dir, "file_associations_summary_*.json")
        summary_files = glob.glob(summary_path)
        
        if not summary_files:
            print("Error: No summary files found. Analysis may have failed.")
            return 1
        
        latest_summary = max(summary_files, key=os.path.getctime)
        
        # Find other analysis files
        timestamp = os.path.basename(latest_summary).split('_')[-1].split('.')[0]
        direct_imports_path = os.path.join(output_dir, f"direct_imports_{timestamp}.json")
        common_ports_path = os.path.join(output_dir, f"common_ports_{timestamp}.json")
        file_associations_path = os.path.join(output_dir, f"file_associations_{timestamp}.json")
        
        # Generate file-level insights
        print("\nGenerating file-level code insights...")
        html_path = generate_insights(
            latest_summary,
            direct_imports_path,
            common_ports_path,
            file_associations_path,
            None,  # No directory structure needed
            os.path.join(output_dir, f"code_insights_{timestamp}.html")
        )
        
        print(f"Interactive file-level HTML report generated at {html_path}")
        
        # Generate entity-level insights
        try:
            print("\nGenerating code entity insights...")
            analyzer = CodeEntityAnalyzer(
                summary_path=latest_summary,
                common_ports_path=common_ports_path,
                direct_imports_path=direct_imports_path,
                file_associations_path=file_associations_path
            )
            
            # Process entity relationships
            analyzer.analyze_entity_relationships()
            analyzer.analyze_module_interfaces()
            analyzer.generate_entity_refactoring_suggestions()
            
            # Save insights
            insights_path = analyzer.save_insights(
                os.path.join(output_dir, f"entity_insights_{timestamp}.json")
            )
            print(f"Entity insights saved to {insights_path}")
            
            # Generate interactive HTML visualization
            html_path = analyzer.generate_html_report(
                os.path.join(output_dir, f"entity_insights_{timestamp}.html")
            )
            print(f"Interactive entity relationship report generated at {html_path}")
            
        except Exception as e:
            print(f"Error generating entity insights: {str(e)}")
        
        print("\nHTML reports generation complete.")
        print(f"All output files are saved in {output_dir}")
        
        return 0
    except Exception as e:
        print(f"Error generating HTML reports: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())