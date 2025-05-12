"""
Configuration module for the file association tracking system.

This module provides centralized configuration management for the file
association tracking system, including settings for analysis, output,
and integration with other subsystems.
"""

import os
from typing import Dict, Any, Optional
from os import PathLike


class FileAssociationConfig:
    """Configuration class for the file association tracking system."""

    def __init__(self):
        """Initialize the configuration with default values."""
        # Analysis settings
        self.max_files_to_analyze: Optional[int] = None
        self.skip_binary_files: bool = True
        self.analyze_hidden_files: bool = False
        
        # Output settings
        self.output_directory: Optional[str] = None
        self.create_summary: bool = True
        
        # Integration settings
        self.generate_insights: bool = True
        self.open_insights_in_browser: bool = False
        
        # Logging settings
        self.verbose_logging: bool = False
        self.log_errors_only: bool = False
        
        # File extensions to analyze (empty set means all files)
        self.file_extensions_to_analyze: set = set()
        
        # File extensions to skip
        self.file_extensions_to_skip: set = {
            '.pyc', '.pyo', '.pyd', '.so', '.dll', '.exe',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
            '.zip', '.tar', '.gz', '.rar', '.7z'
        }

    def update(self, config_dict: Dict[str, Any]) -> None:
        """
        Update the configuration with values from a dictionary.

        Args:
            config_dict: Dictionary containing configuration values
        """
        for key, value in config_dict.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def from_file(self, config_path: PathLike) -> None:
        """
        Load configuration from a JSON file.

        Args:
            config_path: Path to the configuration file
        """
        import json
        try:
            with open(config_path, 'r') as f:
                config_dict = json.load(f)
                self.update(config_dict)
        except Exception as e:
            print(f"Error loading configuration from {config_path}: {str(e)}")

    def to_file(self, config_path: PathLike) -> None:
        """
        Save configuration to a JSON file.

        Args:
            config_path: Path where the configuration file will be saved
        """
        import json
        try:
            # Convert to dictionary
            config_dict = {
                key: value for key, value in self.__dict__.items()
                if not key.startswith('_')
            }
            
            # Convert sets to lists for JSON serialization
            for key, value in config_dict.items():
                if isinstance(value, set):
                    config_dict[key] = list(value)
            
            with open(config_path, 'w') as f:
                json.dump(config_dict, f, indent=2)
        except Exception as e:
            print(f"Error saving configuration to {config_path}: {str(e)}")


# Global configuration instance
config = FileAssociationConfig()


def get_config() -> FileAssociationConfig:
    """
    Get the global configuration instance.

    Returns:
        The global configuration instance
    """
    return config


def configure(config_dict: Optional[Dict[str, Any]] = None, config_path: Optional[PathLike] = None) -> None:
    """
    Configure the file association tracking system.

    Args:
        config_dict: Dictionary containing configuration values (optional)
        config_path: Path to a configuration file (optional)
    """
    global config
    
    # Load from file if provided
    if config_path and os.path.exists(config_path):
        config.from_file(config_path)
    
    # Update with dictionary if provided
    if config_dict:
        config.update(config_dict)