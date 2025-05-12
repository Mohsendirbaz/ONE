"""
Module for tracking common ports between files.

This module provides utilities for detecting common ports (functions, classes, variables)
that are shared between files in a project.
"""

import os
import re
import ast
import json
from typing import Dict, List, Set, Any, Union, Optional
from os import PathLike

from .file_association_base import FileAssociationBase
from .path_utils import (
    get_absolute_path, get_relative_path, join_paths, 
    get_basename, get_file_extension
)
from .utils import (
    is_likely_binary_file, extract_timestamp_from_filename, load_json
)


class CommonPortAnalyzer(FileAssociationBase):
    """Analyzer for common ports between files."""

    def __init__(self, project_path: Union[str, PathLike]):
        """
        Initialize the common port analyzer.

        Args:
            project_path: Path to the project directory
        """
        super().__init__(project_path)
        self.defined_ports: Dict[str, List[str]] = {}  # Maps port names to files that define them
        self.used_ports: Dict[str, List[str]] = {}     # Maps port names to files that use them

    def _is_likely_binary_file(self, file_path: Union[str, PathLike]) -> bool:
        """
        Check if a file is likely to be a binary file.

        Args:
            file_path: Path to the file to check

        Returns:
            True if the file is likely to be binary, False otherwise
        """
        return is_likely_binary_file(file_path)

    def analyze_file(self, file_path: Union[str, PathLike]) -> Dict[str, List[str]]:
        """
        Analyze a file for defined and used ports.

        Args:
            file_path: Path to the file to analyze

        Returns:
            A dictionary with 'defined_ports' and 'used_ports' keys
        """
        defined_ports = []
        used_ports = []

        # Only analyze Python files
        if not file_path.endswith('.py'):
            return {"defined_ports": defined_ports, "used_ports": used_ports}

        # Skip binary files
        if self._is_likely_binary_file(file_path):
            return {"defined_ports": defined_ports, "used_ports": used_ports}

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()

            # Parse the file with ast to get defined and used ports
            try:
                tree = ast.parse(file_content)

                # Extract defined ports (functions, classes, variables)
                for node in ast.walk(tree):
                    # Functions
                    if isinstance(node, ast.FunctionDef):
                        defined_ports.append(f"function:{node.name}")

                    # Classes
                    elif isinstance(node, ast.ClassDef):
                        defined_ports.append(f"class:{node.name}")

                    # Global variables (assignments at module level)
                    elif isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
                        if isinstance(node.targets[0].ctx, ast.Store):
                            defined_ports.append(f"variable:{node.targets[0].id}")

                # Extract used ports (function calls, class instantiations, variable references)
                for node in ast.walk(tree):
                    # Function calls
                    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                        used_ports.append(f"function:{node.func.id}")

                    # Class instantiations
                    elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                        if node.func.id[0].isupper():  # Heuristic: class names start with uppercase
                            used_ports.append(f"class:{node.func.id}")

                    # Variable references
                    elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
                        used_ports.append(f"variable:{node.id}")
            except SyntaxError:
                # Fall back to regex for files with syntax errors
                # This is a simplified approach and won't catch all ports
                function_pattern = r'def\\s+([a-zA-Z0-9_]+)'
                class_pattern = r'class\\s+([a-zA-Z0-9_]+)'

                for line in file_content.split('\n'):
                    # Look for function definitions
                    match = re.search(function_pattern, line)
                    if match:
                        defined_ports.append(f"function:{match.group(1)}")

                    # Look for class definitions
                    match = re.search(class_pattern, line)
                    if match:
                        defined_ports.append(f"class:{match.group(1)}")
        except UnicodeDecodeError as e:
            print(f"Error analyzing ports in {file_path}: {str(e)}")
        except Exception as e:
            print(f"Unexpected error analyzing {file_path}: {str(e)}")

        return {"defined_ports": defined_ports, "used_ports": used_ports}

    def analyze_project(self, max_files: Optional[int] = None) -> Dict[str, Dict[str, List[str]]]:
        """
        Analyze all files in the project for common ports.

        Args:
            max_files: Maximum number of files to analyze (None for all)

        Returns:
            A dictionary of port associations for all files in the project
        """
        # First pass: collect all defined ports
        file_count = 0
        for root, _, files in os.walk(self.project_path):
            for file in files:
                if self._should_analyze_file(file):
                    file_path = join_paths(root, file)
                    rel_path = get_relative_path(file_path, self.project_path)

                    ports = self.analyze_file(file_path)
                    self.associations[rel_path] = ports

                    # Track defined ports
                    for port in ports.get('defined_ports', []):
                        if port not in self.defined_ports:
                            self.defined_ports[port] = []
                        self.defined_ports[port].append(rel_path)

                    # Track used ports
                    for port in ports.get('used_ports', []):
                        if port not in self.used_ports:
                            self.used_ports[port] = []
                        self.used_ports[port].append(rel_path)

                    # Increment file count and check if we've reached the limit
                    file_count += 1
                    if max_files is not None and file_count >= max_files:
                        print(f"Reached maximum file limit ({max_files}). Stopping analysis.")
                        break

            # Also break the outer loop if we've reached the limit
            if max_files is not None and file_count >= max_files:
                break

        return self.associations

    def get_common_ports(self) -> Dict[str, Dict[str, List[str]]]:
        """
        Get the common ports between files.

        Returns:
            A dictionary mapping port names to files that define and use them
        """
        common_ports = {}

        # Find ports that are both defined and used
        for port in set(self.defined_ports.keys()) | set(self.used_ports.keys()):
            defining_files = self.defined_ports.get(port, [])
            using_files = self.used_ports.get(port, [])

            # Only include ports that are defined in at least one file and used in at least one other file
            if defining_files and using_files and set(defining_files) != set(using_files):
                common_ports[port] = {
                    "defined_in": defining_files,
                    "used_in": using_files
                }

        return common_ports

    def save_common_ports(self, output_path: Union[str, PathLike]) -> str:
        """
        Save the common ports to a JSON file.

        Args:
            output_path: Path where the output JSON file will be saved

        Returns:
            The path to the created JSON file
        """
        common_ports = self.get_common_ports()

        with open(output_path, 'w') as f:
            json.dump({
                "project_name": get_basename(self.project_path),
                "analysis_date": extract_timestamp_from_filename(output_path),
                "common_ports": common_ports
            }, f, indent=2)

        return str(output_path)