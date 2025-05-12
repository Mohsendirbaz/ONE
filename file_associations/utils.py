"""
Utility module for file association analysis.

This module provides centralized utility functions for file association analysis,
including file type detection, timestamp extraction, file analysis decisions,
and JSON handling.
"""

import os
import json
from typing import Dict, List, Set, Any, Union, Optional
from os import PathLike


class FileAssociationError(Exception):
    """Base exception class for file association errors."""
    pass


class BinaryFileError(FileAssociationError):
    """Exception raised when attempting to process a binary file as text."""
    pass


class FileEncodingError(FileAssociationError):
    """Exception raised when a file cannot be decoded with the expected encoding."""
    pass


class JsonLoadError(FileAssociationError):
    """Exception raised when a JSON file cannot be loaded."""
    pass


def is_likely_binary_file(file_path: Union[str, PathLike]) -> bool:
    """
    Check if a file is likely to be a binary file.

    Args:
        file_path: Path to the file to check

    Returns:
        True if the file is likely to be binary, False otherwise
    """
    # Check file extension first
    ext = os.path.splitext(file_path)[1]
    binary_extensions = {
        '.pyc', '.pyo', '.pyd', '.so', '.dll', '.exe', '.bin',
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.tiff', '.webp', '.avif',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.tar', '.gz', '.rar', '.7z', '.jar', '.war',
        '.mp3', '.mp4', '.avi', '.mov', '.flv', '.wmv',
        '.o', '.a', '.lib', '.obj', '.class', '.woff', '.woff2', '.ttf', '.eot'
    }
    if ext.lower() in binary_extensions:
        return True

    # Try to read a small portion of the file to check for binary content
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(1024)
            # Check for null bytes which are common in binary files
            if b'\x00' in chunk:
                return True

            # Try to decode as text
            try:
                chunk.decode('utf-8')
                return False  # Successfully decoded as UTF-8
            except UnicodeDecodeError:
                return True  # Failed to decode as UTF-8, likely binary
    except Exception:
        # If we can't read the file, assume it's not binary
        return False


def extract_timestamp_from_filename(filename: str) -> Optional[str]:
    """
    Extract a timestamp from a filename.
    
    Assumes the timestamp is in the format YYYYMMDD_HHMMSS and is part of the filename.

    Args:
        filename: The filename to extract the timestamp from

    Returns:
        The extracted timestamp or None if no timestamp is found
    """
    # Get just the filename without the directory
    basename = os.path.basename(filename)
    
    # Try to extract the timestamp from the filename
    # First, try splitting by underscores and getting the last part before the extension
    parts = basename.split('_')
    if len(parts) >= 2:
        # Get the last part and remove the extension
        last_part = parts[-1].split('.')[0]
        # Check if it's a valid timestamp (all digits)
        if last_part.isdigit() and len(last_part) == 6:  # HHMMSS format
            # If we have a date part (the second-to-last part)
            date_part = parts[-2]
            if date_part.isdigit() and len(date_part) == 8:  # YYYYMMDD format
                return f"{date_part}_{last_part}"
    
    # If the above method fails, try using a regex to find a timestamp pattern
    import re
    match = re.search(r'(\d{8}_\d{6})', basename)
    if match:
        return match.group(1)
    
    # Last resort: just return the filename without extension
    return basename.split('.')[0]


def should_analyze_file(file_name: str) -> bool:
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
    ext = os.path.splitext(file_name)[1]
    if ext.lower() in extensions_to_skip:
        return False

    return True


def load_json(file_path: Union[str, PathLike]) -> Dict:
    """
    Load a JSON file with proper error handling.

    Args:
        file_path: Path to the JSON file to load

    Returns:
        The loaded JSON data as a dictionary

    Raises:
        JsonLoadError: If the file cannot be loaded as JSON
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise JsonLoadError(f"Invalid JSON format in {file_path}: {str(e)}")
    except UnicodeDecodeError as e:
        raise FileEncodingError(f"Encoding error in {file_path}: {str(e)}")
    except FileNotFoundError:
        raise FileAssociationError(f"File not found: {file_path}")
    except PermissionError:
        raise FileAssociationError(f"Permission denied: {file_path}")
    except Exception as e:
        raise FileAssociationError(f"Unexpected error loading {file_path}: {str(e)}")