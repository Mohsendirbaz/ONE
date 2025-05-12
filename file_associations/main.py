"""
Main module for the file association tracking system.

This module provides a unified interface for analyzing file associations
using all the available analyzers.
"""

import os
import json
import glob
import sys
from datetime import datetime
from typing import Dict, List, Any, Union, Optional
from os import PathLike

from .file_association_base import FileAssociationBase
from .direct_imports import DirectImportAnalyzer
from .common_ports import CommonPortAnalyzer
from .file_associations import FileAssociationAnalyzer
from .path_utils import (
    get_absolute_path, get_relative_path, join_paths, 
    get_basename, get_dirname
)
from .utils import extract_timestamp_from_filename
from .config import get_config, configure
from .logging_utils import info, debug, warning, error, exception


class FileAssociationTracker:
    """Main class for tracking file associations."""

    def __init__(self, project_path: Union[str, PathLike]):
        """
        Initialize the file association tracker.

        Args:
            project_path: Path to the project directory
        """
        self.project_path = get_absolute_path(project_path)
        # Use the script directory for output, not the project directory
        script_dir = get_dirname(get_dirname(get_absolute_path(__file__)))
        self.output_dir = join_paths(script_dir, "file_associations", "output")
        os.makedirs(self.output_dir, exist_ok=True)

        # Initialize analyzers
        self.direct_import_analyzer = DirectImportAnalyzer(project_path)
        self.common_port_analyzer = CommonPortAnalyzer(project_path)
        self.file_association_analyzer = FileAssociationAnalyzer(project_path)

    def analyze_project(self, max_files=None):
        """
        Analyze the project for file associations.

        This method runs all the analyzers and saves the results to JSON files.

        Args:
            max_files: Maximum number of files to analyze (None for all)
        """
        # Get configuration
        config = get_config()

        # Use configured max_files if provided
        if max_files is None and config.max_files_to_analyze is not None:
            max_files = config.max_files_to_analyze
            debug(f"Using configured max_files: {max_files}")

        # Generate timestamp for output files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Use configured output directory if provided
        if config.output_directory:
            self.output_dir = config.output_directory
            os.makedirs(self.output_dir, exist_ok=True)
            debug(f"Using configured output directory: {self.output_dir}")

        # Analyze direct imports
        info("Analyzing direct imports...")
        self.direct_import_analyzer.analyze_project(max_files=max_files)
        direct_imports_output = join_paths(self.output_dir, f"direct_imports_{timestamp}.json")
        self.direct_import_analyzer.save_import_relationships(direct_imports_output)
        info(f"Direct imports analysis complete. Output saved to {direct_imports_output}")

        # Analyze common ports
        info("Analyzing common ports...")
        self.common_port_analyzer.analyze_project(max_files=max_files)
        common_ports_output = join_paths(self.output_dir, f"common_ports_{timestamp}.json")
        self.common_port_analyzer.save_common_ports(common_ports_output)
        info(f"Common ports analysis complete. Output saved to {common_ports_output}")

        # Analyze other file associations
        info("Analyzing other file associations...")
        self.file_association_analyzer.analyze_project(max_files=max_files)
        file_associations_output = join_paths(self.output_dir, f"file_associations_{timestamp}.json")
        self.file_association_analyzer.save_file_associations(file_associations_output)
        info(f"File associations analysis complete. Output saved to {file_associations_output}")

        # Create a summary report if configured to do so
        summary_output = None
        if config.create_summary:
            summary_output = self._create_summary_report(timestamp)

        return {
            "direct_imports": direct_imports_output,
            "common_ports": common_ports_output,
            "file_associations": file_associations_output,
            "summary": summary_output
        }

    def _create_summary_report(self, timestamp: str):
        """
        Create a summary report of all file associations.

        Args:
            timestamp: Timestamp for the output file

        Returns:
            Path to the created summary report
        """
        summary_output = join_paths(self.output_dir, f"file_associations_summary_{timestamp}.json")

        # Get all associations
        direct_imports = self.direct_import_analyzer.get_import_relationships()
        common_ports = self.common_port_analyzer.get_common_ports()
        file_associations = self.file_association_analyzer.get_file_associations()

        # Create a summary of all files and their associations
        all_files = set()
        for files in [direct_imports.keys(), file_associations.keys()]:
            all_files.update(files)

        debug(f"Creating summary for {len(all_files)} files")

        summary = {}
        for file in all_files:
            summary[file] = {
                "direct_imports": direct_imports.get(file, []),
                "common_ports": {
                    port: port_info
                    for port, port_info in common_ports.items()
                    if file in port_info.get("defined_in", []) or file in port_info.get("used_in", [])
                },
                "other_associations": file_associations.get(file, {})
            }

        # Save the summary report
        try:
            with open(summary_output, 'w') as f:
                json.dump({
                    "project_name": os.path.basename(self.project_path),
                    "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "summary": summary
                }, f, indent=2)
            info(f"Summary report created at {summary_output}")
        except Exception as e:
            error(f"Error creating summary report: {str(e)}")
            return None

        return summary_output


def analyze_project_associations(project_path: Union[str, PathLike], max_files=None, config_dict=None) -> Dict[str, Any]:
    """
    Analyze a project for file associations.

    Args:
        project_path: Path to the project directory
        max_files: Maximum number of files to analyze (None for all)
        config_dict: Optional configuration dictionary to override defaults

    Returns:
        Dictionary with paths to output files and directories
    """
    # Configure the system if a configuration dictionary is provided
    if config_dict:
        configure(config_dict)

    # Get the configuration
    config = get_config()

    # Initialize the tracker and analyze the project
    tracker = FileAssociationTracker(project_path)
    output_files = tracker.analyze_project(max_files=max_files)

    # Initialize the result dictionary
    result = {
        "output_dir": tracker.output_dir,
        "analysis_files": output_files,
        "insights_files": {}
    }

    # Generate insights if configured to do so
    if config.generate_insights:
        try:
            # Find the most recent summary file if not returned by analyze_project
            summary_path = output_files.get("summary")
            if not summary_path:
                debug("Summary path not found in output_files, searching for most recent summary file")
                summary_pattern = os.path.join(tracker.output_dir, "file_associations_summary_*.json")
                summary_files = glob.glob(summary_pattern)
                if summary_files:
                    summary_path = max(summary_files, key=os.path.getctime)
                    debug(f"Found most recent summary file: {summary_path}")

            if summary_path and os.path.exists(summary_path):
                # Extract timestamp from the summary filename
                timestamp = extract_timestamp_from_filename(summary_path)
                debug(f"Extracted timestamp from summary file: {timestamp}")

                # Get paths to other analysis files
                direct_imports_path = output_files.get("direct_imports") or os.path.join(tracker.output_dir, f"direct_imports_{timestamp}.json")
                common_ports_path = output_files.get("common_ports") or os.path.join(tracker.output_dir, f"common_ports_{timestamp}.json")
                file_associations_path = output_files.get("file_associations") or os.path.join(tracker.output_dir, f"file_associations_{timestamp}.json")

                # Add the parent directory to the Python path to import insights_generator
                parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                if parent_dir not in sys.path:
                    sys.path.insert(0, parent_dir)

                try:
                    # Import the required modules
                    from insights_generator.main import generate_insights
                    from insights_generator.entity_analyzer import CodeEntityAnalyzer

                    # Generate file-level insights
                    info("\nGenerating file-level code insights...")
                    file_insights_path = os.path.join(tracker.output_dir, f"code_insights_{timestamp}.html")
                    html_path = generate_insights(
                        summary_path,
                        direct_imports_path,
                        common_ports_path,
                        file_associations_path,
                        None,
                        file_insights_path
                    )

                    info(f"Interactive file-level HTML report generated at {html_path}")
                    result["insights_files"]["file_level_html"] = html_path

                    # Generate entity-level insights
                    try:
                        info("\nGenerating code entity insights...")
                        analyzer = CodeEntityAnalyzer(
                            summary_path=summary_path,
                            common_ports_path=common_ports_path,  # This is the key for entity analysis
                            direct_imports_path=direct_imports_path,
                            file_associations_path=file_associations_path
                        )

                        # Process entity relationships
                        analyzer.analyze_entity_relationships()
                        analyzer.analyze_module_interfaces()
                        analyzer.generate_entity_refactoring_suggestions()

                        # Save insights
                        entity_insights_path = os.path.join(tracker.output_dir, f"entity_insights_{timestamp}.json")
                        insights_path = analyzer.save_insights(entity_insights_path)
                        info(f"Entity insights saved to {insights_path}")
                        result["insights_files"]["entity_insights_json"] = insights_path

                        # Generate interactive HTML visualization
                        entity_html_path = os.path.join(tracker.output_dir, f"entity_insights_{timestamp}.html")
                        html_path = analyzer.generate_html_report(entity_html_path)
                        info(f"Interactive entity relationship report generated at {html_path}")
                        result["insights_files"]["entity_level_html"] = html_path

                        # Open in browser if configured to do so
                        if config.open_insights_in_browser:
                            try:
                                info("Opening HTML report in default browser...")
                                os.startfile(html_path)
                            except Exception as e:
                                warning(f"Failed to open HTML report in browser: {str(e)}")

                    except Exception as e:
                        error(f"Error generating entity insights: {str(e)}")
                        if config.verbose_logging:
                            exception("Detailed entity insights error")

                except ImportError as e:
                    warning(f"Could not import insights_generator modules: {str(e)}")
                    warning("Insights generation skipped. Make sure the insights_generator package is installed.")
                except Exception as e:
                    error(f"Error generating insights: {str(e)}")
                    if config.verbose_logging:
                        exception("Detailed insights generation error")
            else:
                warning("No summary file found, skipping insights generation")
        except Exception as e:
            error(f"Unexpected error during insights generation: {str(e)}")
            if config.verbose_logging:
                exception("Detailed error during insights generation")
    else:
        debug("Insights generation disabled in configuration")

    # Return the result dictionary
    return result


def main():
    """
    Main entry point for the file association tracking system.
    """
    import argparse
    import logging

    # Set up argument parser
    parser = argparse.ArgumentParser(description='Analyze file associations in a project')

    parser.add_argument('project_path', type=str,
                        help='Path to the project directory to analyze')

    parser.add_argument('--max-files', type=int, default=None,
                        help='Maximum number of files to analyze (default: all)')

    parser.add_argument('--output-dir', type=str, default=None,
                        help='Directory where output files will be saved')

    parser.add_argument('--no-insights', action='store_true',
                        help='Disable insights generation')

    parser.add_argument('--no-summary', action='store_true',
                        help='Disable summary report creation')

    parser.add_argument('--open-browser', action='store_true',
                        help='Open HTML reports in the default browser')

    parser.add_argument('--verbose', action='store_true',
                        help='Enable verbose logging')

    parser.add_argument('--quiet', action='store_true',
                        help='Only log errors')

    parser.add_argument('--log-file', type=str, default=None,
                        help='Path to a log file')

    args = parser.parse_args()

    # Configure logging
    log_level = None
    if args.verbose:
        log_level = logging.DEBUG
    elif args.quiet:
        log_level = logging.ERROR

    from .logging_utils import configure_logging
    configure_logging(log_level=log_level, log_file=args.log_file)

    # Configure the system
    config_dict = {
        'max_files_to_analyze': args.max_files,
        'output_directory': args.output_dir,
        'generate_insights': not args.no_insights,
        'create_summary': not args.no_summary,
        'open_insights_in_browser': args.open_browser,
        'verbose_logging': args.verbose,
        'log_errors_only': args.quiet
    }

    # Analyze the project
    try:
        result = analyze_project_associations(args.project_path, config_dict=config_dict)
        info(f"Analysis complete. Output files saved to {result['output_dir']}")
        return 0
    except Exception as e:
        error(f"Error analyzing project: {str(e)}")
        if args.verbose:
            exception("Detailed error")
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
