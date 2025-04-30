"""
Main module for the file association tracking system.

This module provides a unified interface for analyzing file associations
using all the available analyzers.
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Any, Union, Optional
from os import PathLike

from .file_association_base import FileAssociationBase
from .direct_imports import DirectImportAnalyzer
from .common_ports import CommonPortAnalyzer
from .file_associations import FileAssociationAnalyzer


class FileAssociationTracker:
    """Main class for tracking file associations."""

    def __init__(self, project_path: Union[str, PathLike]):
        """
        Initialize the file association tracker.

        Args:
            project_path: Path to the project directory
        """
        self.project_path = os.path.abspath(project_path)
        # Use the script directory for output, not the project directory
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.output_dir = os.path.join(script_dir, "file_associations", "output")
        os.makedirs(self.output_dir, exist_ok=True)

        # Initialize analyzers
        self.direct_import_analyzer = DirectImportAnalyzer(project_path)
        self.common_port_analyzer = CommonPortAnalyzer(project_path)
        self.file_association_analyzer = FileAssociationAnalyzer(project_path)

    def analyze_project(self):
        """
        Analyze the project for file associations.

        This method runs all the analyzers and saves the results to JSON files.
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

        # Analyze other file associations
        print("Analyzing other file associations...")
        self.file_association_analyzer.analyze_project()
        file_associations_output = os.path.join(self.output_dir, f"file_associations_{timestamp}.json")
        self.file_association_analyzer.save_file_associations(file_associations_output)
        print(f"File associations analysis complete. Output saved to {file_associations_output}")

        # Create a summary report
        self._create_summary_report(timestamp)

    def _create_summary_report(self, timestamp: str):
        """
        Create a summary report of all file associations.

        Args:
            timestamp: Timestamp for the output file
        """
        summary_output = os.path.join(self.output_dir, f"file_associations_summary_{timestamp}.json")

        # Get all associations
        direct_imports = self.direct_import_analyzer.get_import_relationships()
        common_ports = self.common_port_analyzer.get_common_ports()
        file_associations = self.file_association_analyzer.get_file_associations()

        # Create a summary of all files and their associations
        all_files = set()
        for files in [direct_imports.keys(), file_associations.keys()]:
            all_files.update(files)

        summary = {}
        for file in all_files:
            summary[file] = {
                "direct_imports": direct_imports.get(file, []),
                "common_ports": {
                    port: info
                    for port, info in common_ports.items()
                    if file in info.get("defined_in", []) or file in info.get("used_in", [])
                },
                "other_associations": file_associations.get(file, {})
            }

        # Save the summary report
        with open(summary_output, 'w') as f:
            json.dump({
                "project_name": os.path.basename(self.project_path),
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "summary": summary
            }, f, indent=2)

        print(f"Summary report created at {summary_output}")

        return summary_output


def analyze_project_associations(project_path: Union[str, PathLike]) -> str:
    """
    Analyze a project for file associations.

    Args:
        project_path: Path to the project directory

    Returns:
        Path to the output directory
    """
    tracker = FileAssociationTracker(project_path)
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

        # Import the required modules
        from insights_generator.main import generate_insights
        from insights_generator.entity_analyzer import CodeEntityAnalyzer

        # Find the most recent summary file
        summary_path = os.path.join(tracker.output_dir, "file_associations_summary_*.json")
        summary_files = glob.glob(summary_path)

        if summary_files:
            latest_summary = max(summary_files, key=os.path.getctime)

            # Find other analysis files
            # Extract the full timestamp (format: YYYYMMDD_HHMMSS)
            summary_filename = os.path.basename(latest_summary)
            # Extract timestamp between the last underscore before .json and the .json extension
            timestamp_parts = summary_filename.split('_')
            if len(timestamp_parts) >= 3:  # Ensure we have enough parts
                # Get the date and time parts (last two parts before .json)
                date_part = timestamp_parts[-2]
                time_part = timestamp_parts[-1].split('.')[0]
                timestamp = f"{date_part}_{time_part}"
            else:
                # Fallback - extract using regex
                import re
                match = re.search(r'(\d{8}_\d{6})', summary_filename)
                if match:
                    timestamp = match.group(1)
                else:
                    # Last resort fallback
                    timestamp = summary_filename.split('_')[-1].split('.')[0]

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
                    common_ports_path=common_ports_path,  # This is the key for entity analysis
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
