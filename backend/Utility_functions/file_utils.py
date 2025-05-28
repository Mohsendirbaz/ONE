"""
Utility functions for file operations.
"""
import os
from typing import List, Dict, Any

def find_versions(directory: str) -> List[str]:
    """
    Find all version directories in the given directory.
    
    Args:
        directory: The directory to search in
        
    Returns:
        A list of version names
    """
    if not os.path.exists(directory):
        return []
    
    versions = []
    for item in os.listdir(directory):
        if os.path.isdir(os.path.join(directory, item)) and item.startswith('v'):
            versions.append(item)
    
    return sorted(versions)

def find_files(directory: str, extension: str = None) -> List[Dict[str, Any]]:
    """
    Find all files in the given directory with the specified extension.
    
    Args:
        directory: The directory to search in
        extension: The file extension to filter by (e.g., '.py', '.js')
        
    Returns:
        A list of dictionaries containing file information
    """
    if not os.path.exists(directory):
        return []
    
    files = []
    for root, _, filenames in os.walk(directory):
        for filename in filenames:
            if extension is None or filename.endswith(extension):
                file_path = os.path.join(root, filename)
                rel_path = os.path.relpath(file_path, directory)
                files.append({
                    "name": filename,
                    "path": rel_path,
                    "size": os.path.getsize(file_path)
                })
    
    return files