"""
Module for tracking other forms of association between files.

This module provides utilities for detecting associations between files
that are not captured by direct imports or common ports, such as:
- String references to file paths
- Configuration references
- Dependency relationships
"""

import os
import re
import json
from typing import Dict, List, Set, Any, Union, Optional
from os import PathLike

from .file_association_base import FileAssociationBase
from .path_utils import (
    get_absolute_path, get_relative_path, join_paths, 
    get_basename, get_dirname, get_file_extension, 
    normalize_path, extract_timestamp_from_filename, is_binary_file
)


class FileAssociationAnalyzer(FileAssociationBase):
    """Analyzer for other forms of association between files."""

    def analyze_file(self, file_path: Union[str, PathLike]) -> Dict[str, List[str]]:
        """
        Analyze a file for other forms of association.

        Args:
            file_path: Path to the file to analyze

        Returns:
            A dictionary with 'string_references', 'config_references', and 'dependency_references' keys
        """
        string_references = []
        config_references = []
        dependency_references = []

        # Skip binary files and files with non-UTF-8 encoding
        if self._is_likely_binary_file(file_path):
            return {
                "string_references": [],
                "config_references": [],
                "dependency_references": []
            }

        # Try different encodings to read the file
        encodings_to_try = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        file_content = None

        for encoding in encodings_to_try:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    file_content = f.read()
                break  # If successful, break out of the loop
            except UnicodeDecodeError:
                continue  # Try the next encoding
            except Exception as e:
                # For other exceptions (like permission errors), log and return empty results
                print(f"Unexpected error reading {file_path}: {str(e)}")
                return {
                    "string_references": [],
                    "config_references": [],
                    "dependency_references": []
                }

        # If we couldn't read the file with any encoding, silently skip it
        if file_content is None:
            # Log the issue without showing an error message to the user
            # print(f"Skipping file with encoding issues: {file_path}")
            return {
                "string_references": [],
                "config_references": [],
                "dependency_references": []
            }

        try:
            # Look for string references to file paths
            # This regex looks for strings that might be file paths
            file_path_pattern = r'[\'"]([a-zA-Z0-9_\-./\\]+\\.(py|json|txt|md|csv|xml|html|js|css))[\'"]'
            for match in re.finditer(file_path_pattern, file_content):
                potential_path = match.group(1)
                # Normalize path separators
                potential_path = normalize_path(potential_path)
                string_references.append(potential_path)

            # Look for configuration references
            # This regex looks for patterns like "config_file = 'config.json'" or "CONFIG_PATH = 'path/to/config'"
            config_pattern = r'(config|conf|settings|cfg)[\w_]*\\s*=\\s*[\'"]([a-zA-Z0-9_\-./\\]+)[\'"]'
            for match in re.finditer(config_pattern, file_content, re.IGNORECASE):
                config_path = match.group(2)
                # Normalize path separators
                config_path = normalize_path(config_path)
                config_references.append(config_path)

            # Look for dependency references
            # This regex looks for patterns like "requires = ['module1', 'module2']" or "dependencies = ['lib1', 'lib2']"
            dependency_pattern = r'(requires|dependencies|deps|packages)[\w_]*\\s*=\\s*\[(.*?)\]'
            for match in re.finditer(dependency_pattern, file_content, re.IGNORECASE):
                deps_str = match.group(2)
                # Extract individual dependencies from the list
                deps = re.findall(r'[\'"]([a-zA-Z0-9_\-]+)[\'"]', deps_str)
                dependency_references.extend(deps)
        except Exception as e:
            print(f"Unexpected error analyzing {file_path}: {str(e)}")

        return {
            "string_references": string_references,
            "config_references": config_references,
            "dependency_references": dependency_references
        }

    def get_file_associations(self) -> Dict[str, Dict[str, List[str]]]:
        """
        Get the associations between files.

        Returns:
            A dictionary mapping files to their associations
        """
        file_associations = {}

        for file_path, associations in self.associations.items():
            file_associations[file_path] = {
                "string_references": self._resolve_references(associations.get("string_references", []), file_path),
                "config_references": self._resolve_references(associations.get("config_references", []), file_path),
                "dependency_references": associations.get("dependency_references", [])
            }

        return file_associations

    def _resolve_references(self, references: List[str], source_file: str) -> List[str]:
        """
        Resolve relative references to absolute file paths.

        Args:
            references: List of references to resolve
            source_file: Path to the file containing the references

        Returns:
            List of resolved references
        """
        resolved_references = []
        source_dir = get_dirname(join_paths(self.project_path, source_file))

        for ref in references:
            # Skip references that are clearly not file paths
            if not any(c in ref for c in ['/', '\\', '.']):
                continue

            # Try to resolve the reference as a relative path
            potential_path = normalize_path(join_paths(source_dir, ref))

            # Check if the resolved path exists in the project
            if os.path.exists(potential_path) and potential_path.startswith(self.project_path):
                # Convert to a path relative to the project root
                rel_path = get_relative_path(potential_path, self.project_path)
                resolved_references.append(rel_path)

        return resolved_references

    def _is_likely_binary_file(self, file_path: Union[str, PathLike]) -> bool:
        """
        Check if a file is likely to be a binary file.

        Args:
            file_path: Path to the file to check

        Returns:
            True if the file is likely to be binary, False otherwise
        """
        return is_binary_file(file_path)

    def save_file_associations(self, output_path: Union[str, PathLike]) -> str:
        """
        Save the file associations to a JSON file.

        Args:
            output_path: Path where the output JSON file will be saved

        Returns:
            The path to the created JSON file
        """
        file_associations = self.get_file_associations()

        with open(output_path, 'w') as f:
            json.dump({
                "project_name": get_basename(self.project_path),
                "analysis_date": extract_timestamp_from_filename(output_path),
                "file_associations": file_associations
            }, f, indent=2)

        return str(output_path)
