"""
Base module for file association analysis.

This module provides common utilities and base classes for analyzing
associations between files in a project.
"""

import os
import json
from typing import Dict, List, Set, Any, Union, Optional
from os import PathLike


class FileAssociationBase:
    """Base class for file association analysis."""

    def __init__(self, project_path: Union[str, PathLike]):
        """
        Initialize the file association analyzer.

        Args:
            project_path: Path to the project directory
        """
        self.project_path = os.path.abspath(project_path)
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

    def analyze_project(self) -> Dict[str, Dict[str, List[str]]]:
        """
        Analyze all files in the project for associations.

        Returns:
            A dictionary of associations for all files in the project
        """
        for root, dirs, files in os.walk(self.project_path):
            # Skip .git and other hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]

            for file in files:
                if self._should_analyze_file(file):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, self.project_path)
                    try:
                        self.associations[rel_path] = self.analyze_file(file_path)
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
        # Skip hidden files and directories
        if file_name.startswith('.'):
            return False

        # Skip common binary and non-code files
        extensions_to_skip = {
            '.pyc', '.pyo', '.pyd', '.so', '.dll', '.exe',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
            '.zip', '.tar', '.gz', '.rar', '.7z'
        }
        _, ext = os.path.splitext(file_name)
        if ext.lower() in extensions_to_skip:
            return False

        return True

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
                "project_name": os.path.basename(self.project_path),
                "analysis_date": os.path.basename(output_path).split('_')[-1].split('.')[0],
                "associations": self.associations
            }, f, indent=2)

        return str(output_path)
