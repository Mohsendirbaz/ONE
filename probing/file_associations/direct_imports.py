"""
Module for tracking direct imports between files.

This module provides utilities for detecting import statements in Python files
and tracking the relationships between files based on these imports.
"""

import os
import re
import ast
import json
from typing import Dict, List, Set, Any, Union, Optional
from os import PathLike

from .file_association_base import FileAssociationBase
from .utils import (
    is_likely_binary_file, extract_timestamp_from_filename, load_json, FileAssociationError
)


class DirectImportAnalyzer(FileAssociationBase):
    """Analyzer for direct imports between files."""

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
        Analyze a file for direct imports.

        Args:
            file_path: Path to the file to analyze

        Returns:
            A dictionary with 'imports' key containing a list of imported modules
        """
        imports = []

        # Only analyze Python files
        if not file_path.endswith('.py'):
            return {"imports": imports}

        # Skip binary files
        if self._is_likely_binary_file(file_path):
            return {"imports": imports}

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()

            # Parse the file with ast to get imports
            try:
                tree = ast.parse(file_content)

                # Extract imports from the AST
                for node in ast.walk(tree):
                    # Handle 'import module' statements
                    if isinstance(node, ast.Import):
                        for name in node.names:
                            imports.append(name.name)

                    # Handle 'from module import name' statements
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            module_name = node.module
                            imports.append(module_name)
            except SyntaxError:
                # Fall back to regex for files with syntax errors
                import_pattern = r'^import\s+([a-zA-Z0-9_.,\s]+)|^from\s+([a-zA-Z0-9_.]+)\s+import'
                for line in file_content.split('\n'):
                    match = re.match(import_pattern, line.strip())
                    if match:
                        if match.group(1):  # import module
                            modules = [m.strip() for m in match.group(1).split(',')]
                            imports.extend(modules)
                        elif match.group(2):  # from module import
                            imports.append(match.group(2))
        except UnicodeDecodeError as e:
            print(f"Error analyzing imports in {file_path}: {str(e)}")
        except Exception as e:
            print(f"Unexpected error analyzing {file_path}: {str(e)}")

        return {"imports": imports}

    def _should_analyze_file(self, file_name: str) -> bool:
        """
        Determine if a file should be analyzed for imports.

        Args:
            file_name: Name of the file

        Returns:
            True if the file should be analyzed, False otherwise
        """
        # Only analyze Python files
        if not file_name.endswith('.py'):
            return False

        return super()._should_analyze_file(file_name)

    def get_import_relationships(self) -> Dict[str, List[str]]:
        """
        Get the relationships between files based on imports.

        Returns:
            A dictionary mapping files to the files they import
        """
        relationships = {}

        # Map module names to file paths
        module_to_file = {}
        for file_path, associations in self.associations.items():
            # Convert file path to potential module name
            module_name = os.path.splitext(file_path)[0].replace(os.sep, '.')
            module_to_file[module_name] = file_path

            # Also map the file name without path
            file_name = os.path.basename(file_path)
            module_name_short = os.path.splitext(file_name)[0]
            module_to_file[module_name_short] = file_path

        # Build relationships
        for file_path, associations in self.associations.items():
            imported_files = []

            for import_name in associations.get('imports', []):
                # Check if the import corresponds to a file in the project
                if import_name in module_to_file:
                    imported_files.append(module_to_file[import_name])

                # Check if it's a submodule
                for module_name, module_path in module_to_file.items():
                    if import_name.startswith(module_name + '.'):
                        imported_files.append(module_path)

            relationships[file_path] = imported_files

        return relationships

    def save_import_relationships(self, output_path: Union[str, PathLike]) -> str:
        """
        Save the import relationships to a JSON file.

        Args:
            output_path: Path where the output JSON file will be saved

        Returns:
            The path to the created JSON file
        """
        relationships = self.get_import_relationships()

        with open(output_path, 'w') as f:
            # Extract the timestamp from the filename
            timestamp = extract_timestamp_from_filename(output_path)

            json.dump({
                "project_name": os.path.basename(self.project_path),
                "analysis_date": timestamp,
                "import_relationships": relationships
            }, f, indent=2)

        return str(output_path)