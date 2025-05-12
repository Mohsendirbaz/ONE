"""
Utility module for file path handling operations.

This module provides standardized functions for common file path operations
used throughout the file association tracking system.
"""

import os
from typing import Union, Optional
from os import PathLike


def get_absolute_path(path: Union[str, PathLike]) -> str:
    """
    Convert a path to an absolute path.

    Args:
        path: The path to convert

    Returns:
        The absolute path
    """
    return os.path.abspath(path)


def get_relative_path(path: Union[str, PathLike], base_path: Union[str, PathLike]) -> str:
    """
    Get the relative path from a base path.

    Args:
        path: The path to convert to relative
        base_path: The base path to make the path relative to

    Returns:
        The relative path
    """
    return os.path.relpath(path, base_path)


def join_paths(*paths: Union[str, PathLike]) -> str:
    """
    Join multiple path components.

    Args:
        *paths: Path components to join

    Returns:
        The joined path
    """
    return os.path.join(*paths)


def get_basename(path: Union[str, PathLike]) -> str:
    """
    Get the basename of a path.

    Args:
        path: The path to get the basename from

    Returns:
        The basename of the path
    """
    return os.path.basename(path)


def get_dirname(path: Union[str, PathLike]) -> str:
    """
    Get the directory name of a path.

    Args:
        path: The path to get the directory name from

    Returns:
        The directory name of the path
    """
    return os.path.dirname(path)


def get_file_extension(path: Union[str, PathLike]) -> str:
    """
    Get the file extension of a path.

    Args:
        path: The path to get the file extension from

    Returns:
        The file extension of the path
    """
    _, ext = os.path.splitext(path)
    return ext


def normalize_path(path: Union[str, PathLike]) -> str:
    """
    Normalize a path by converting slashes and backslashes to the system's path separator.

    Args:
        path: The path to normalize

    Returns:
        The normalized path
    """
    # First convert to string if it's a PathLike object
    path_str = str(path)
    # Replace both forward and backward slashes with the system's path separator
    normalized = path_str.replace('/', os.sep).replace('\\', os.sep)
    # Use os.path.normpath to handle '..' and '.' components
    return os.path.normpath(normalized)


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
    basename = get_basename(filename)
    
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


def is_binary_file(file_path: Union[str, PathLike]) -> bool:
    """
    Check if a file is likely to be a binary file.

    Args:
        file_path: Path to the file to check

    Returns:
        True if the file is likely to be binary, False otherwise
    """
    # Check file extension first
    ext = get_file_extension(file_path)
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