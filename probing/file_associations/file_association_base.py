"""
Base module for file association analysis.

This module provides common utilities and base classes for analyzing
associations between files in a project.
"""

import os
import json
from typing import Dict, List, Set, Any, Union, Optional
from os import PathLike

from .path_utils import (
    get_absolute_path, get_relative_path, join_paths, 
    get_basename, get_file_extension
)
from .utils import (
    is_likely_binary_file, extract_timestamp_from_filename, should_analyze_file
)


class FileAssociationBase:
    """Base class for file association analysis."""

    def __init__(self, project_path: Union[str, PathLike]):
        """
        Initialize the file association analyzer.

        Args:
            project_path: Path to the project directory
        """
        self.project_path = get_absolute_path(project_path)
        self.associations: Dict[str, Dict[str, List[str]]] = {}

    def analyze_file(self, file_path: Union[str, PathLike]) -> Dict[str, List[str]]:
        """
        Analyze a file for associations.

        Args:
            file_path: Path to the file to analyze

        Returns:
            A dictionary of associations for the file
        """
        raise NotImplementedError("Subclasses must implement analyze_file")

    def analyze_project(self, max_files=None) -> Dict[str, Dict[str, List[str]]]:
        """
        Analyze all files in the project for associations.

        Args:
            max_files: Maximum number of files to analyze (None for all)

        Returns:
            A dictionary of associations for all files in the project
        """
        files_analyzed = 0
        for root, dirs, files in os.walk(self.project_path):
            # Skip .git and other hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]

            for file in files:
                if self._should_analyze_file(file):
                    file_path = join_paths(root, file)
                    rel_path = get_relative_path(file_path, self.project_path)
                    try:
                        self.associations[rel_path] = self.analyze_file(file_path)
                        files_analyzed += 1
                        if max_files is not None and files_analyzed >= max_files:
                            print(f"Reached maximum number of files to analyze ({max_files})")
                            return self.associations
                    except UnicodeDecodeError as e:
                        print(f"Error analyzing associations in {file_path}: {str(e)}")
                    except Exception as e:
                        print(f"Unexpected error analyzing {file_path}: {str(e)}")

        return self.associations

    def _should_analyze_file(self, file_name: str) -> bool:
        """
        Determine if a file should be analyzed.

        Args:
            file_name: Name of the file

        Returns:
            True if the file should be analyzed, False otherwise
        """
        return should_analyze_file(file_name)

    def save_associations(self, output_path: Union[str, PathLike]) -> str:
        """
        Save the associations to a JSON file.

        Args:
            output_path: Path where the output JSON file will be saved

        Returns:
            The path to the created JSON file
        """
        with open(output_path, 'w') as f:
            json.dump({
                "project_name": get_basename(self.project_path),
                "analysis_date": extract_timestamp_from_filename(output_path),
                "associations": self.associations
            }, f, indent=2)

        return str(output_path)