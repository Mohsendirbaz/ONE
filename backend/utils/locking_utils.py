"""
Locking Utilities Module

This module contains utility functions for locking operations.
"""

import functools
import threading
import filelock
import logging
from flask import jsonify
from typing import Optional, Callable, Any

# Set up logging
logger = logging.getLogger('locking_utils')

def with_file_lock(lock_file_path, operation_name="operation"):
    """
    Decorator to create a file lock for the decorated function
    
    Args:
        lock_file_path (str): Path to the lock file
        operation_name (str): Name of the operation for error messages
        
    Returns:
        Callable: Decorated function
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            lock = filelock.FileLock(lock_file_path, timeout=180)  # 3 minute timeout
            try:
                with lock:
                    return func(*args, **kwargs)
            except filelock.Timeout:
                raise Exception(f"Timeout waiting for {operation_name} lock")
        return wrapper
    return decorator

def with_memory_lock(lock_obj, operation_name="operation"):
    """
    Decorator to apply a threading lock for the decorated function
    
    Args:
        lock_obj (threading.Lock): Lock object
        operation_name (str): Name of the operation for error messages
        
    Returns:
        Callable: Decorated function
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if not lock_obj.acquire(timeout=180):  # 3 minute timeout
                raise Exception(f"Timeout waiting for in-memory {operation_name} lock")
            try:
                return func(*args, **kwargs)
            finally:
                lock_obj.release()
        return wrapper
    return decorator

def with_pipeline_check(required_event=None, next_event=None, operation_name="operation"):
    """
    Decorator to check pipeline status and validate required events
    
    Args:
        required_event (threading.Event, optional): Event that must be set before function execution
        next_event (threading.Event, optional): Event to set after successful function execution
        operation_name (str): Name of the operation for error messages
        
    Returns:
        Callable: Decorated function
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Check if pipeline is active
            if not PIPELINE_ACTIVE.is_set():
                return jsonify({
                    "error": "Pipeline is not active",
                    "status": "inactive",
                    "message": "Initialize pipeline first with /register_payload"
                }), 409

            # Check if required event is set
            if required_event is not None and not required_event.is_set():
                return jsonify({
                    "error": f"Cannot execute {operation_name} - prerequisite step not completed",
                    "status": "blocked",
                    "message": f"This endpoint requires a prior step to complete first"
                }), 409

            # Execute the function
            result = func(*args, **kwargs)

            # Set next event if successful and provided
            if next_event is not None and isinstance(result, tuple) and result[1] == 200:
                next_event.set()

            return result
        return wrapper
    return decorator

# Pipeline events
PIPELINE_ACTIVE = threading.Event()
PAYLOAD_REGISTERED = threading.Event()
BASELINE_COMPLETED = threading.Event()
CONFIG_COMPLETED = threading.Event()
RUNS_COMPLETED = threading.Event()
SENSITIVITY_COMPLETED = threading.Event()
VISUALIZATION_COMPLETED = threading.Event()

# Global locks
GLOBAL_PAYLOAD_LOCK = threading.Lock()
GLOBAL_BASELINE_LOCK = threading.Lock()
GLOBAL_CONFIG_LOCK = threading.Lock()
GLOBAL_RUN_LOCK = threading.Lock()
GLOBAL_SENSITIVITY_LOCK = threading.Lock()
GLOBAL_VISUALIZE_LOCK = threading.Lock()

# Lock file paths
PAYLOAD_LOCK_FILE = "payload.lock"
BASELINE_LOCK_FILE = "baseline.lock"
CONFIG_LOCK_FILE = "config.lock"
RUN_LOCK_FILE = "run.lock"
SENSITIVITY_LOCK_FILE = "sensitivity.lock"
VISUALIZATION_LOCK_FILE = "visualization.lock"

def reset_pipeline_state():
    """
    Reset all pipeline events to their initial state
    """
    PIPELINE_ACTIVE.clear()
    PAYLOAD_REGISTERED.clear()
    BASELINE_COMPLETED.clear()
    CONFIG_COMPLETED.clear()
    RUNS_COMPLETED.clear()
    SENSITIVITY_COMPLETED.clear()
    VISUALIZATION_COMPLETED.clear()
    
    logger.info("Pipeline state has been reset")

def initialize_pipeline():
    """
    Initialize the pipeline by setting the PIPELINE_ACTIVE event
    """
    reset_pipeline_state()
    PIPELINE_ACTIVE.set()
    logger.info("Pipeline has been initialized")

def get_pipeline_status():
    """
    Get the current status of all pipeline events
    
    Returns:
        dict: Status of all pipeline events
    """
    return {
        "pipeline_active": PIPELINE_ACTIVE.is_set(),
        "payload_registered": PAYLOAD_REGISTERED.is_set(),
        "baseline_completed": BASELINE_COMPLETED.is_set(),
        "config_completed": CONFIG_COMPLETED.is_set(),
        "runs_completed": RUNS_COMPLETED.is_set(),
        "sensitivity_completed": SENSITIVITY_COMPLETED.is_set(),
        "visualization_completed": VISUALIZATION_COMPLETED.is_set()
    }