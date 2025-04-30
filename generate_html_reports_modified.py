"""
Command-line script for generating HTML reports from file association analysis.

This script provides a convenient way to analyze a project for file associations
and generate HTML reports from the analysis results. It combines the functionality
of the file_associations module and the insights_generator module to provide a
complete solution for generating HTML reports.

This modified version skips the file_association_analyzer step, which can cause
issues with binary files.
"""

import os
import sys
import argparse
import glob
from datetime import datetime

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from file_associations.main import FileAssociationTracker
from insights_generator.main import generate_insights
from insights_generator.entity_analyzer import CodeEntityAnalyzer


class ModifiedFileAssociationTracker(FileAssociationTracker):
    """Modified version of FileAssociationTracker that skips file_association_analyzer."""

    def analyze_project(self):
        """
        Analyze the project for file associations, skipping the file_association_analyzer.

        This method runs only the direct_import_analyzer and common_port_analyzer,
        and saves the results to JSON files.
        """
        # Generate timestamp for output files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Analyze direct imports
        print("Analyzing direct imports...")
        self.direct_import_analyzer.analyze_project()
        direct_imports_output = os.path.join(self.output_dir, f"direct_imports_{timestamp}.json")
        self.direct_import_analyzer.save_import_relationships(direct_imports_output)
        print(f"Direct imports analysis complete. Output saved to {direct_imports_output}")

        # Analyze common ports
        print("Analyzing common ports...")
        self.common_port_analyzer.analyze_project()
        common_ports_output = os.path.join(self.output_dir, f"common_ports_{timestamp}.json")
        self.common_port_analyzer.save_common_ports(common_ports_output)
        print(f"Common ports analysis complete. Output saved to {common_ports_output}")

        # Create a dummy file_associations output file
        file_associations_output = os.path.join(self.output_dir, f"file_associations_{timestamp}.json")
        with open(file_associations_output, 'w') as f:
            f.write('{"project_name": "' + os.path.basename(self.project_path) + '", "analysis_date": "' + timestamp + '", "file_associations": {}}')
        print(f"File associations analysis skipped. Empty output saved to {file_associations_output}")

        # Create a summary report
        self._create_summary_report(timestamp)


def analyze_project_associations_modified(project_path):
    """
    Analyze a project for file associations, skipping the file_association_analyzer.

    Args:
        project_path: Path to the project directory

    Returns:
        Path to the output directory
    """
    tracker = ModifiedFileAssociationTracker(project_path)
    tracker.analyze_project()

    # After analysis, generate insights
    try:
        import glob
        import sys
        import importlib.util

        # Add the parent directory to the Python path to import insights_generator
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)

        # Find the most recent summary file
        summary_path = os.path.join(tracker.output_dir, "file_associations_summary_*.json")
        summary_files = glob.glob(summary_path)

        if summary_files:
            latest_summary = max(summary_files, key=os.path.getctime)

            # Find other analysis files
            timestamp = os.path.basename(latest_summary).split('_')[-1].split('.')[0]
            direct_imports_path = os.path.join(tracker.output_dir, f"direct_imports_{timestamp}.json")
            common_ports_path = os.path.join(tracker.output_dir, f"common_ports_{timestamp}.json")
            file_associations_path = os.path.join(tracker.output_dir, f"file_associations_{timestamp}.json")

            # Generate file-level insights
            print("\nGenerating file-level code insights...")
            html_path = generate_insights(
                latest_summary,
                direct_imports_path,
                common_ports_path,
                file_associations_path,
                None,
                os.path.join(tracker.output_dir, f"code_insights_{timestamp}.html")
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
                    os.path.join(tracker.output_dir, f"entity_insights_{timestamp}.json")
                )
                print(f"Entity insights saved to {insights_path}")

                # Generate interactive HTML visualization
                html_path = analyzer.generate_html_report(
                    os.path.join(tracker.output_dir, f"entity_insights_{timestamp}.html")
                )
                print(f"Interactive entity relationship report generated at {html_path}")

            except Exception as e:
                print(f"Error generating entity insights: {str(e)}")

    except Exception as e:
        print(f"Error generating insights: {str(e)}")

    # Return the path to the output directory
    return tracker.output_dir


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
        output_dir = analyze_project_associations_modified(args.project_path)
        
        if args.output_dir:
            output_dir = args.output_dir
        
        print(f"File association analysis complete. Output saved to {output_dir}")
        
        print("\nHTML reports generation complete.")
        print(f"All output files are saved in {output_dir}")
        
        return 0
    except Exception as e:
        print(f"Error generating HTML reports: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())