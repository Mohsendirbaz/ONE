"""
File Change Monitor Module

This module provides functionality for monitoring and detecting changes in files and directories.
"""

import os
import glob
from typing import Dict, List, Callable, Optional

def ensure_directory(directory):
    """Ensure a directory exists."""
    if not os.path.exists(directory):
        os.makedirs(directory)

class FileChangeMonitor:
    """
    Monitors and detects changes in files and directories.
    Provides callbacks when files are created, modified, or deleted.
    """
    
    def __init__(self, directory: str, patterns: List[str], callback: Optional[Callable] = None):
        """
        Initialize the file change monitor.
        
        Args:
            directory: The directory to monitor
            patterns: List of file patterns to watch (e.g., '*.json', '*.js')
            callback: Function to call when changes are detected
        """
        self.directory = directory
        self.patterns = patterns
        self.callback = callback
        self.last_scan = {}
        
    def scan(self) -> Dict[str, List[str]]:
        """
        Scan the directory for files matching the patterns.
        
        Returns:
            Dict with 'created', 'modified', and 'deleted' file lists
        """
        current_files = {}
        
        # Get all files matching the patterns
        for pattern in self.patterns:
            file_path = os.path.join(self.directory, pattern)
            for file in glob.glob(file_path):
                if os.path.isfile(file):
                    current_files[file] = os.path.getmtime(file)
        
        changes = {
            'created': [],
            'modified': [],
            'deleted': []
        }
        
        # Check for created or modified files
        for file, mtime in current_files.items():
            if file not in self.last_scan:
                changes['created'].append(file)
            elif mtime > self.last_scan[file]:
                changes['modified'].append(file)
        
        # Check for deleted files
        for file in self.last_scan:
            if file not in current_files:
                changes['deleted'].append(file)
        
        # Update last scan
        self.last_scan = current_files
        
        # Call callback if provided
        if self.callback and (changes['created'] or changes['modified'] or changes['deleted']):
            self.callback(changes)
        
        return changes