"""
Logging utilities for the file association tracking system.

This module provides a centralized logging system for the file association
tracking system, with configurable verbosity levels and output destinations.
"""

import os
import sys
import logging
from typing import Optional, Union, TextIO
from os import PathLike

from .config import get_config


# Create a custom logger
logger = logging.getLogger("file_associations")


def configure_logging(
    log_level: Optional[int] = None,
    log_file: Optional[Union[str, PathLike]] = None,
    log_format: Optional[str] = None,
    stream: Optional[TextIO] = None
) -> None:
    """
    Configure the logging system.

    Args:
        log_level: Logging level (e.g., logging.INFO, logging.DEBUG)
        log_file: Path to a log file (optional)
        log_format: Format string for log messages (optional)
        stream: Stream to write log messages to (optional, defaults to sys.stdout)
    """
    global logger
    
    # Clear existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Set log level based on configuration if not explicitly provided
    if log_level is None:
        config = get_config()
        if config.log_errors_only:
            log_level = logging.ERROR
        elif config.verbose_logging:
            log_level = logging.DEBUG
        else:
            log_level = logging.INFO
    
    logger.setLevel(log_level)
    
    # Set default format if not provided
    if log_format is None:
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    formatter = logging.Formatter(log_format)
    
    # Add console handler
    console_handler = logging.StreamHandler(stream or sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Add file handler if log file is provided
    if log_file:
        try:
            # Create directory if it doesn't exist
            log_dir = os.path.dirname(log_file)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir, exist_ok=True)
                
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.error(f"Failed to create log file {log_file}: {str(e)}")


def get_logger() -> logging.Logger:
    """
    Get the logger instance.

    Returns:
        The logger instance
    """
    return logger


# Initialize logging with default settings
configure_logging()


# Convenience functions that match the logging module's interface

def debug(msg: str, *args, **kwargs) -> None:
    """Log a debug message."""
    logger.debug(msg, *args, **kwargs)


def info(msg: str, *args, **kwargs) -> None:
    """Log an info message."""
    logger.info(msg, *args, **kwargs)


def warning(msg: str, *args, **kwargs) -> None:
    """Log a warning message."""
    logger.warning(msg, *args, **kwargs)


def error(msg: str, *args, **kwargs) -> None:
    """Log an error message."""
    logger.error(msg, *args, **kwargs)


def critical(msg: str, *args, **kwargs) -> None:
    """Log a critical message."""
    logger.critical(msg, *args, **kwargs)


def exception(msg: str, *args, **kwargs) -> None:
    """Log an exception message with traceback."""
    logger.exception(msg, *args, **kwargs)