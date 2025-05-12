import os
import sys
from pathlib import Path
import re
import collections
from itertools import islice
import math
import string

def ensure_directory_exists(directory):
    """Ensure that a directory exists."""
    os.makedirs(directory, exist_ok=True)

def get_original_file_path(reduced_file_path):
    """
    Get the path to the original file corresponding to a reduced file.

    Args:
        reduced_file_path (Path): Path to the reduced file

    Returns:
        Path: Path to the original file
    """
    # Extract the file name and remove the "116" suffix
    file_name = reduced_file_path.name
    original_name = file_name.replace("116", "")

    # Get the absolute path to the 116 directory
    base_dir = Path(os.path.dirname(os.path.abspath(__file__)))
    reduced_dir = base_dir / "116"

    # Construct the path to the original file
    try:
        # Try to get the relative path from the 116 directory
        rel_path = reduced_file_path.relative_to(reduced_dir)
        original_path = base_dir / rel_path.parent / original_name
    except ValueError:
        # If that fails, just replace the file name
        original_path = reduced_file_path.parent.parent / original_name

    return original_path

def extract_docstrings(content, file_extension):
    """
    Extract docstrings from file content based on file type.

    Args:
        content (str): File content
        file_extension (str): File extension (with period)

    Returns:
        dict: Dictionary with 'file_docstring' and 'function_docstrings'
    """
    result = {
        'file_docstring': '',
        'function_docstrings': {}
    }

    if file_extension == '.py':
        # Extract file-level docstring (usually at the beginning of the file)
        file_docstring_match = re.search(r'^"""(.*?)"""', content, re.DOTALL | re.MULTILINE)
        if file_docstring_match:
            result['file_docstring'] = file_docstring_match.group(1).strip()

        # Extract function-level docstrings
        function_pattern = re.compile(r'def\s+([^\s\(]+)\s*\([^\)]*\)(?:\s*->.*?)?:\s*(?:"""(.*?)""")?', re.DOTALL)
        for match in function_pattern.finditer(content):
            func_name = match.group(1)
            if match.group(2):
                result['function_docstrings'][func_name] = match.group(2).strip()

        # Extract class-level docstrings
        class_pattern = re.compile(r'class\s+([^\s\(]+)(?:\([^\)]*\))?:\s*(?:"""(.*?)""")?', re.DOTALL)
        for match in class_pattern.finditer(content):
            class_name = match.group(1)
            if match.group(2):
                result['function_docstrings'][class_name] = match.group(2).strip()

    elif file_extension in ['.js', '.jsx', '.ts', '.tsx']:
        # Extract file-level JSDoc comment
        file_jsdoc_match = re.search(r'^/\*\*(.*?)\*/', content, re.DOTALL)
        if file_jsdoc_match:
            result['file_docstring'] = file_jsdoc_match.group(1).strip()

        # Extract function JSDoc comments
        function_pattern = re.compile(r'/\*\*(.*?)\*/\s*(?:function|const|let|var|export)\s+([^\s=\(]+)', re.DOTALL)
        for match in function_pattern.finditer(content):
            func_name = match.group(2)
            result['function_docstrings'][func_name] = match.group(1).strip()

        # Extract class JSDoc comments
        class_pattern = re.compile(r'/\*\*(.*?)\*/\s*class\s+([^\s\{]+)', re.DOTALL)
        for match in class_pattern.finditer(content):
            class_name = match.group(2)
            result['function_docstrings'][class_name] = match.group(1).strip()

    return result