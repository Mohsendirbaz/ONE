"""
File Utilities Module

This module contains utility functions for file operations.
"""

import os
import json
import pickle
import tempfile
import filelock
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Union

# Set up logging
logger = logging.getLogger('file_utils')

def atomic_read_json(filepath):
    """
    Thread-safe reading of JSON file
    
    Args:
        filepath (str): Path to the JSON file
        
    Returns:
        dict: The JSON data or None if file doesn't exist
    """
    tempdir = tempfile.gettempdir()
    temp_file = os.path.join(tempdir, f"temp_{os.path.basename(filepath)}")

    # Create a file lock for this specific file
    lock_file = f"{filepath}.lock"
    lock = filelock.FileLock(lock_file, timeout=60)

    with lock:
        if os.path.exists(filepath):
            # Copy to temp location first
            with open(filepath, 'r') as src:
                content = src.read()

            with open(temp_file, 'w') as dst:
                dst.write(content)

            # Read from the temp file
            with open(temp_file, 'r') as f:
                data = json.load(f)

            # Clean up
            try:
                os.remove(temp_file)
            except:
                pass

            return data
        return None

def atomic_write_json(filepath, data):
    """
    Thread-safe writing of JSON file
    
    Args:
        filepath (str): Path to the JSON file
        data (dict): The data to write
    """
    tempdir = tempfile.gettempdir()
    temp_file = os.path.join(tempdir, f"temp_{os.path.basename(filepath)}")

    # Create a file lock for this specific file
    lock_file = f"{filepath}.lock"
    lock = filelock.FileLock(lock_file, timeout=60)

    with lock:
        # Write to temp file first
        with open(temp_file, 'w') as f:
            json.dump(data, f, indent=2)

        # Move temp file to target (atomic operation)
        if os.path.exists(filepath):
            os.remove(filepath)

        os.rename(temp_file, filepath)

def atomic_read_pickle(filepath):
    """
    Thread-safe reading of pickle file
    
    Args:
        filepath (str): Path to the pickle file
        
    Returns:
        Any: The unpickled data or None if file doesn't exist
    """
    tempdir = tempfile.gettempdir()
    temp_file = os.path.join(tempdir, f"temp_{os.path.basename(filepath)}")

    # Create a file lock for this specific file
    lock_file = f"{filepath}.lock"
    lock = filelock.FileLock(lock_file, timeout=60)

    with lock:
        if os.path.exists(filepath):
            # Copy to temp location first
            with open(filepath, 'rb') as src:
                content = src.read()

            with open(temp_file, 'wb') as dst:
                dst.write(content)

            # Read from the temp file
            with open(temp_file, 'rb') as f:
                data = pickle.load(f)

            # Clean up
            try:
                os.remove(temp_file)
            except:
                pass

            return data
        return None

def atomic_write_pickle(filepath, data):
    """
    Thread-safe writing of pickle file
    
    Args:
        filepath (str): Path to the pickle file
        data (Any): The data to write
    """
    tempdir = tempfile.gettempdir()
    temp_file = os.path.join(tempdir, f"temp_{os.path.basename(filepath)}")

    # Create a file lock for this specific file
    lock_file = f"{filepath}.lock"
    lock = filelock.FileLock(lock_file, timeout=60)

    with lock:
        # Write to temp file first
        with open(temp_file, 'wb') as f:
            pickle.dump(data, f)

        # Move temp file to target (atomic operation)
        if os.path.exists(filepath):
            os.remove(filepath)

        os.rename(temp_file, filepath)

def safe_json_dump(data: Any, file_path: Union[str, Path]) -> bool:
    """
    Safely write JSON data to a file with error handling
    
    Args:
        data: The data to serialize to JSON
        file_path: Path to the output file
        
    Returns:
        bool: True if successful, False on error
    """
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error writing JSON to {file_path}: {e}")
        return False

def ensure_directory_exists(directory_path: Union[str, Path]) -> None:
    """
    Ensure the specified directory exists, creating it if necessary
    
    Args:
        directory_path: Path to the directory
    """
    os.makedirs(directory_path, exist_ok=True)