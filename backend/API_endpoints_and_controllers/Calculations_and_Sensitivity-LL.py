from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import subprocess
import os
import json
import time
import sys
import pickle
import requests
import glob
import pandas as pd
import threading
import filelock
import tempfile
import functools
import shutil
import copy
import logging
from datetime import datetime
import re
import argparse
import csv
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional, Union, Any
import importlib.util
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import numpy as np
from matplotlib.colors import LinearSegmentedColormap

# =====================================
# Base Configuration
# =====================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_DIR = os.path.join(BASE_DIR, 'backend')
LOGS_DIR = os.path.join(SCRIPT_DIR, 'Logs')
ORIGINAL_BASE_DIR = os.path.join(BASE_DIR, 'backend', 'Original')

# Create logs directory
os.makedirs(LOGS_DIR, exist_ok=True)

# Status file paths
SENSITIVITY_CONFIG_STATUS_PATH = os.path.join(LOGS_DIR, "sensitivity_config_status.json")
SENSITIVITY_CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "sensitivity_config_data.pkl")
CONFIG_LOCK_FILE = os.path.join(LOGS_DIR, "sensitivity_config.lock")
RUN_LOCK_FILE = os.path.join(LOGS_DIR, "runs.lock")
VISUALIZATION_LOCK_FILE = os.path.join(LOGS_DIR, "visualization.lock")
PAYLOAD_LOCK_FILE = os.path.join(LOGS_DIR, "payload.lock")
BASELINE_LOCK_FILE = os.path.join(LOGS_DIR, "baseline.lock")

# Global locks for synchronization
GLOBAL_CONFIG_LOCK = threading.Lock()
GLOBAL_RUN_LOCK = threading.Lock()
GLOBAL_PRICE_LOCK = threading.Lock()
GLOBAL_VISUALIZE_LOCK = threading.Lock()
GLOBAL_PAYLOAD_LOCK = threading.Lock()
GLOBAL_BASELINE_LOCK = threading.Lock()

# Event flags for pipeline execution control
PAYLOAD_REGISTERED = threading.Event()
BASELINE_COMPLETED = threading.Event()
CONFIG_COMPLETED = threading.Event()
RUNS_COMPLETED = threading.Event()

# Timeout for waiting (in seconds)
WAIT_TIMEOUT = 600  # 10 minutes

# Pipeline active flag (holds all routes except the active one)
PIPELINE_ACTIVE = threading.Event()

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOGS_DIR, "CALCULATIONS_SENSITIVITY.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('calcsensitivity')
logger.info("Logging initialized")

# Configure sensitivity logger as a separate logger
sensitivity_logger = logging.getLogger('sensitivity')
sensitivity_logger.setLevel(logging.DEBUG)
sensitivity_handler = logging.FileHandler(os.path.join(LOGS_DIR, "SENSITIVITY.log"))
sensitivity_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
sensitivity_logger.addHandler(sensitivity_handler)
sensitivity_logger.propagate = False  # Prevent propagation to root logger

# Script configurations
COMMON_PYTHON_SCRIPTS = [
    os.path.join(SCRIPT_DIR, "Configuration_management", 'formatter.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'module1.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'config_modules.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'Table.py')
]

def get_calculation_script(version):
    script_name = f'CFA.py'
    script_path = os.path.join(SCRIPT_DIR, "Core_calculation_engines", script_name)
    if os.path.exists(script_path):
        return script_path
    raise Exception(f"Calculation script not found for version {version}")

def get_sensitivity_calculation_script():
    """Get the CFA-b.py script for sensitivity analysis"""
    script_path = os.path.join(SCRIPT_DIR, "Core_calculation_engines", "CFA-b.py")
    if os.path.exists(script_path):
        return script_path
    raise Exception("CFA-b.py script not found for sensitivity calculations")

CALCULATION_SCRIPTS = {
    'calculateForPrice': get_calculation_script,
    'freeFlowNPV': get_calculation_script
}

# =====================================
# Integrated Sensitivity File Manager
# =====================================
class SensitivityFileManager:
    """
    Manages the storage and retrieval of sensitivity analysis files.
    Integrated directly into the file for self-sufficiency.
    """
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.logger = logging.getLogger('sensitivity.filemanager')

    def _get_paths_for_parameter(self, version, param_id, mode="percentage", compare_to_key="S13"):
        """
        Generate standard paths for parameter results.

        Args:
            version (int): Version number
            param_id (str): Parameter ID (e.g. "S35")
            mode (str): Analysis mode (percentage, directvalue, etc.)
            compare_to_key (str): Comparison parameter

        Returns:
            dict: Dictionary of paths for different file types
        """
        # Map modes to standardized directory names
        mode_dir_mapping = {
            'percentage': 'Percentage',
            'directvalue': 'DirectValue',
            'absolutedeparture': 'AbsoluteDeparture',
            'montecarlo': 'MonteCarlo',
            'symmetrical': 'Symmetrical',
            'multipoint': 'Multipoint'
        }

        # Get standardized directory name with capitalized first letter
        mode_dir = mode_dir_mapping.get(mode.lower(), mode.capitalize())

        # Base paths
        results_folder = os.path.join(
            self.base_dir,
            f"Batch({version})",
            f"Results({version})"
        )
        sensitivity_dir = os.path.join(results_folder, "Sensitivity")

        # Ensure directories exist
        os.makedirs(sensitivity_dir, exist_ok=True)

        # Create paths
        paths = {
            "results_folder": results_folder,
            "sensitivity_dir": sensitivity_dir,
            "mode_dir": os.path.join(sensitivity_dir, mode_dir),
            "param_dir": os.path.join(sensitivity_dir, param_id),
            "param_mode_dir": os.path.join(sensitivity_dir, param_id, mode.lower()),
            "reports_dir": os.path.join(sensitivity_dir, "Reports"),
        }

        # Ensure subdirectories exist
        for path_name, path in paths.items():
            if path_name != "results_folder" and path_name != "sensitivity_dir":
                os.makedirs(path, exist_ok=True)

        # Add specific file paths
        paths.update({
            "results_file": os.path.join(
                paths["mode_dir"],
                f"{param_id}_vs_{compare_to_key}_{mode.lower()}_results.json"
            ),
            "config_file": os.path.join(
                paths["reports_dir"],
                f"{param_id}_config.json"
            ),
            "datapoints_file": os.path.join(
                results_folder,
                f"SensitivityPlotDatapoints_{version}.json"
            )
        })

        return paths

    def store_calculation_result(self, version, param_id, result_data, mode="percentage", compare_to_key="S13"):
        """
        Store calculation results in the expected location.

        Args:
            version (int): Version number
            param_id (str): Parameter ID
            result_data (dict): Result data structure
            mode (str): Analysis mode
            compare_to_key (str): Comparison parameter

        Returns:
            dict: Result info with storage status
        """
        try:
            # Get paths
            paths = self._get_paths_for_parameter(
                version, param_id, mode, compare_to_key
            )

            # Set atomic file lock for thread safety
            lock_file = f"{paths['results_file']}.lock"
            lock = filelock.FileLock(lock_file, timeout=60)

            with lock:
                # Ensure all directories exist
                os.makedirs(os.path.dirname(paths['results_file']), exist_ok=True)

                # Write results data to file
                with open(paths['results_file'], 'w') as f:
                    json.dump(result_data, f, indent=2)

                self.logger.info(f"Stored calculation results for {param_id} at {paths['results_file']}")

                return {
                    "status": "success",
                    "path": paths['results_file'],
                    "message": f"Successfully stored results for {param_id}"
                }

        except Exception as e:
            error_msg = f"Error storing calculation results for {param_id}: {str(e)}"
            self.logger.error(error_msg)
            return {
                "status": "error",
                "error": error_msg
            }

    def retrieve_calculation_result(self, version, param_id, mode="percentage", compare_to_key="S13"):
        """
        Retrieve calculation results from the expected location.

        Args:
            version (int): Version number
            param_id (str): Parameter ID
            mode (str): Analysis mode
            compare_to_key (str): Comparison parameter

        Returns:
            dict: Retrieved result data or error info
        """
        try:
            # Get paths
            paths = self._get_paths_for_parameter(
                version, param_id, mode, compare_to_key
            )

            # Check if results file exists
            if not os.path.exists(paths['results_file']):
                return {
                    "status": "error",
                    "error": f"Results file not found for {param_id}"
                }

            # Set atomic file lock for thread safety
            lock_file = f"{paths['results_file']}.lock"
            lock = filelock.FileLock(lock_file, timeout=60)

            with lock:
                # Read results data from file
                with open(paths['results_file'], 'r') as f:
                    result_data = json.load(f)

                self.logger.info(f"Retrieved calculation results for {param_id} from {paths['results_file']}")

                return {
                    "status": "success",
                    "data": result_data,
                    "path": paths['results_file']
                }

        except Exception as e:
            error_msg = f"Error retrieving calculation results for {param_id}: {str(e)}"
            self.logger.error(error_msg)
            return {
                "status": "error",
                "error": error_msg
            }

    def store_datapoints(self, version, datapoints_data):
        """
        Store sensitivity datapoints for plotting.

        Args:
            version (int): Version number
            datapoints_data (dict): Datapoints data structure

        Returns:
            dict: Result info with storage status
        """
        try:
            # Define datapoints file path
            results_folder = os.path.join(
                self.base_dir,
                f"Batch({version})",
                f"Results({version})"
            )
            datapoints_file = os.path.join(
                results_folder,
                f"SensitivityPlotDatapoints_{version}.json"
            )

            # Ensure directory exists
            os.makedirs(os.path.dirname(datapoints_file), exist_ok=True)

            # Set atomic file lock for thread safety
            lock_file = f"{datapoints_file}.lock"
            lock = filelock.FileLock(lock_file, timeout=60)

            with lock:
                # Write datapoints data to file
                with open(datapoints_file, 'w') as f:
                    json.dump(datapoints_data, f, indent=2)

                self.logger.info(f"Stored sensitivity datapoints at {datapoints_file}")

                return {
                    "status": "success",
                    "path": datapoints_file,
                    "message": "Successfully stored sensitivity datapoints"
                }

        except Exception as e:
            error_msg = f"Error storing sensitivity datapoints: {str(e)}"
            self.logger.error(error_msg)
            return {
                "status": "error",
                "error": error_msg
            }

# =====================================
# Integrated Sen_Config Functions
# =====================================
def find_parameter_by_id(config, param_id):
    """
    Find the parameter key in the configuration that matches the given parameter ID.

    Args:
        config (dict): Configuration dictionary
        param_id (str): Parameter ID (e.g., "S35")

    Returns:
        str: The key in the configuration that matches the parameter ID
    """
    # Extract the numeric part of the parameter ID
    if param_id.startswith('S') and param_id[1:].isdigit():
        param_num = param_id[1:]

        # Look for a key that ends with the parameter number
        for key in config.keys():
            if key.endswith(f"Amount{param_num}"):
                return key

    # Special case for economic parameters (S80-S90)
    if param_id.startswith('S') and param_id[1:].isdigit():
        param_num = int(param_id[1:])
        if 80 <= param_num <= 90:
            economic_metrics = [
                'Internal Rate of Return',
                'Average Selling Price (Project Life Cycle)',
                'Total Overnight Cost (TOC)',
                'Average Annual Revenue',
                'Average Annual Operating Expenses',
                'Average Annual Depreciation',
                'Average Annual State Taxes',
                'Average Annual Federal Taxes',
                'Average Annual After-Tax Cash Flow',
                'Cumulative NPV',
                'Calculation Mode'
            ]
            idx = param_num - 80
            if 0 <= idx < len(economic_metrics):
                return f"economicMetric{idx}"

    # If no matching key is found, raise an exception
    raise ValueError(f"No parameter found in configuration matching ID: {param_id}")

def apply_sensitivity_variation(config, param_id, variation, mode):
    """
    Apply a sensitivity variation to a parameter in the configuration.

    Args:
        config (dict): Configuration dictionary to modify
        param_id (str): Parameter ID (e.g., "S35")
        variation (float): Variation value
        mode (str): Variation mode (percentage, directvalue, absolutedeparture)

    Returns:
        dict: Modified configuration with the variation applied
    """
    try:
        # Find the parameter key in the configuration
        param_key = find_parameter_by_id(config, param_id)

        # Get the original value
        original_value = config[param_key]

        # Ensure original_value is numeric
        if isinstance(original_value, str):
            original_value = float(original_value)

        # Apply the variation based on the mode
        if mode == 'percentage':
            # For percentage mode, apply percentage change
            modified_value = original_value * (1 + variation/100)
        elif mode == 'directvalue':
            # For direct value mode, use the variation value directly
            modified_value = variation
        elif mode == 'absolutedeparture':
            # For absolute departure mode, add the variation to the original value
            modified_value = original_value + variation
        elif mode in ['symmetrical', 'multipoint']:
            # For symmetrical/multipoint modes, apply percentage change
            modified_value = original_value * (1 + variation/100)
        else:
            # Default to percentage mode
            modified_value = original_value * (1 + variation/100)

        # Update the configuration with the modified value
        config[param_key] = modified_value

        return config

    except Exception as e:
        sensitivity_logger.error(f"Error applying sensitivity variation: {str(e)}")
        raise

# =====================================
# Integrated Config Module Copying
# =====================================
def process_config_modules(version, sen_parameters):
    """
    Process all configuration modules (1-100) for all parameter variations.
    Apply sensitivity variations and save modified configurations.

    Args:
        version (int): Version number
        sen_parameters (dict): Dictionary containing sensitivity parameters

    Returns:
        dict: Summary of processed modules and their status
    """
    processing_summary = {
        'total_found': 0,
        'total_modified': 0,
        'errors': [],
        'processed_modules': {},
        'csv_files_copied': 0,
        'py_files_copied': 0
    }

    try:
        # Source directory in ORIGINAL_BASE_DIR (root level)
        source_dir = os.path.join(ORIGINAL_BASE_DIR, f'Batch({version})', f'Results({version})')

        # Target directory in backend/Original
        target_base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(target_base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Create ConfigurationPlotSpec directory at the same level as Results
        config_plot_spec_dir = os.path.join(target_base_dir, f'Batch({version})', f'ConfigurationPlotSpec({version})')
        os.makedirs(config_plot_spec_dir, exist_ok=True)
        sensitivity_logger.info(f"Created/ensured ConfigurationPlotSpec directory: {config_plot_spec_dir}")

        # Short pause to ensure files exist
        sensitivity_logger.info("Starting brief pause to ensure files exist...")
        time.sleep(3)
        sensitivity_logger.info("Resuming after pause, checking for files...")

        # Define the specific CSV files we want to copy
        target_csv_files = [
            f"Configuration_Matrix({version}).csv",
            f"General_Configuration_Matrix({version}).csv"
        ]

        # Get the Python configuration file path
        code_files_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "Original")
        config_file = os.path.join(code_files_path, f"Batch({version})", f"ConfigurationPlotSpec({version})", f"configurations({version}).py")

        # Filter to only existing files
        existing_csv_files = [
            f for f in target_csv_files
            if os.path.exists(os.path.join(source_dir, f))
        ]

        py_file_exists = os.path.exists(config_file)

        if len(existing_csv_files) < len(target_csv_files):
            missing_files = set(target_csv_files) - set(existing_csv_files)
            sensitivity_logger.warning(f"Some target CSV files not found: {missing_files}")
        if not py_file_exists:
            sensitivity_logger.warning(f"Python configuration file not found: {config_file}")

        # Process each parameter's variation directory
        for param_id, param_config in sen_parameters.items():
            if not param_config.get('enabled'):
                continue

            # Get mode and values
            mode = param_config.get('mode', 'symmetrical')
            # Normalize mode terminology
            if mode in ['symmetrical', 'multiple']:
                normalized_mode = 'symmetrical'
            elif mode in ['discrete']:
                normalized_mode = 'multipoint'
            else:
                normalized_mode = mode.lower()

            values = param_config.get('values', [])

            if not values:
                continue

            sensitivity_logger.info(f"Processing parameter {param_id} with mode {normalized_mode}")

            # Determine variation list based on normalized mode
            if normalized_mode == 'symmetrical':
                base_variation = values[0]
                variation_list = [base_variation, -base_variation]
            else:  # 'multipoint'
                variation_list = values

            # Process each variation
            for variation in variation_list:
                var_str = f"{variation:+.2f}"
                param_var_dir = os.path.join(sensitivity_dir, param_id, normalized_mode, var_str)

                # Create directory if it doesn't exist
                os.makedirs(param_var_dir, exist_ok=True)
                sensitivity_logger.info(f"Processing variation {var_str} in directory: {param_var_dir}")

                # Copy only the specific CSV files we want
                for csv_file in existing_csv_files:
                    source_csv_path = os.path.join(source_dir, csv_file)
                    target_csv_path = os.path.join(param_var_dir, csv_file)
                    try:
                        shutil.copy2(source_csv_path, target_csv_path)
                        processing_summary['csv_files_copied'] += 1
                        sensitivity_logger.info(f"Copied specific CSV file: {csv_file}")
                    except Exception as e:
                        error_msg = f"Failed to copy CSV file {csv_file}: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

                # Copy the Python configuration file if it exists
                if py_file_exists:
                    # Copy to parameter variation directory
                    target_py_path = os.path.join(param_var_dir, os.path.basename(config_file))
                    try:
                        shutil.copy2(config_file, target_py_path)
                        processing_summary['py_files_copied'] += 1
                        sensitivity_logger.info(f"Copied Python configuration file to variation dir: {os.path.basename(config_file)}")
                    except Exception as e:
                        error_msg = f"Failed to copy Python configuration file to variation dir: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

                    # Also copy to the main ConfigurationPlotSpec directory
                    config_plot_spec_py_path = os.path.join(config_plot_spec_dir, os.path.basename(config_file))
                    try:
                        shutil.copy2(config_file, config_plot_spec_py_path)
                        sensitivity_logger.info(f"Copied Python configuration file to main ConfigurationPlotSpec dir: {config_plot_spec_py_path}")
                    except Exception as e:
                        error_msg = f"Failed to copy Python configuration file to ConfigurationPlotSpec dir: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

                # Track modules for this parameter variation
                param_key = f"{param_id}_{var_str}"
                if param_key not in processing_summary['processed_modules']:
                    processing_summary['processed_modules'][param_key] = []

                # Process all possible module files (1-100)
                for module_num in range(1, 101):
                    source_config_path = os.path.join(source_dir, f"{version}_config_module_{module_num}.json")
                    target_config_path = os.path.join(param_var_dir, f"{version}_config_module_{module_num}.json")

                    # Skip if source JSON file doesn't exist
                    if not os.path.exists(source_config_path):
                        continue

                    processing_summary['total_found'] += 1

                    try:
                        # Load the source config module
                        with open(source_config_path, 'r') as f:
                            config_module = json.load(f)

                        # Apply sensitivity variation to the config
                        modified_config = apply_sensitivity_variation(
                            copy.deepcopy(config_module),
                            param_id,
                            variation,
                            normalized_mode
                        )

                        # Save the modified config
                        with open(target_config_path, 'w') as f:
                            json.dump(modified_config, f, indent=4)

                        processing_summary['total_modified'] += 1
                        processing_summary['processed_modules'][param_key].append(module_num)
                        sensitivity_logger.info(
                            f"Applied {variation}{'%' if normalized_mode == 'symmetrical' else ''} "
                            f"variation to config module {module_num} for {param_id}"
                        )

                    except Exception as e:
                        error_msg = f"Failed to process config module {module_num} for {param_id}, variation {var_str}: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

        sensitivity_logger.info(
            f"Config module processing completed: "
            f"found {processing_summary['total_found']} JSON files, "
            f"modified {processing_summary['total_modified']} JSON files, "
            f"copied {processing_summary['csv_files_copied']} specific CSV files, "
            f"copied {processing_summary['py_files_copied']} Python configuration files"
        )

        if processing_summary['errors']:
            sensitivity_logger.warning(f"Encountered {len(processing_summary['errors'])} errors during processing")

        # Generate the SensitivityPlotDatapoints_{version}.json file
        sensitivity_logger.info("Generating SensitivityPlotDatapoints_{version}.json file with actual base values...")
        datapoints_file = generate_sensitivity_datapoints(version, sen_parameters)
        sensitivity_logger.info(f"SensitivityPlotDatapoints generation completed: {datapoints_file}")

        return processing_summary

    except Exception as e:
        error_msg = f"Error in config module processing: {str(e)}"
        sensitivity_logger.exception(error_msg)
        processing_summary['errors'].append(error_msg)
        return processing_summary

def generate_sensitivity_datapoints(version, sen_parameters):
    """
    Generate SensitivityPlotDatapoints_{version}.json file with baseline and variation points.
    Uses actual modified values from configuration modules.

    Args:
        version (int): Version number
        sen_parameters (dict): Dictionary containing sensitivity parameters

    Returns:
        str: Path to the generated file
    """
    # Define paths
    target_base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
    results_folder = os.path.join(target_base_dir, f'Batch({version})', f'Results({version})')
    source_dir = os.path.join(ORIGINAL_BASE_DIR, f'Batch({version})', f'Results({version})')

    sensitivity_logger.info(f"Generating SensitivityPlotDatapoints_{version}.json in {results_folder}")

    # Find a base configuration module to extract baseline values
    base_config = None
    base_config_path = None

    for module_num in range(1, 101):
        potential_path = os.path.join(source_dir, f"{version}_config_module_{module_num}.json")
        if os.path.exists(potential_path):
            base_config_path = potential_path
            try:
                with open(base_config_path, 'r') as f:
                    base_config = json.load(f)
                sensitivity_logger.info(f"Loaded base configuration from {base_config_path}")
                break
            except Exception as e:
                sensitivity_logger.warning(f"Failed to load {potential_path}: {str(e)}")
                continue

    if not base_config:
        sensitivity_logger.warning("No base configuration module found. Using fallback values.")

    # Initialize the datapoints structure
    datapoints = {
        "metadata": {
            "structure_explanation": {
                "S35,S13": "Key format: 'enabledParam,compareToKey' where S35 is enabled parameter and S13 is comparison key",
                "baseline": "Reference point measurement",
                "baseline:key": "Numerical measurement point for baseline (e.g., 10000)",
                "baseline:value": "Reference measurement value to compare against",
                "info": "Position indicator: '+' (all above), '-' (all below), or 'b#' (# variations below baseline)",
                "data": "Collection of variation measurements",
                "data:keys": "Numerical measurement points using actual modified values",
                "data:values": "Actual measurements. Must be initially null/empty when created"
            }
        }
    }

    # Process each enabled parameter
    for param_id, param_config in sen_parameters.items():
        if not param_config.get('enabled'):
            continue

        # Get comparison key from parameter configuration
        compare_to_key = param_config.get('compareToKey', 'S13')
        combined_key = f"{param_id},{compare_to_key}"

        # Get mode and values from parameter configuration
        # Normalize mode terminology to match Sen_Config.py
        mode = param_config.get('mode', 'percentage')
        normalized_mode = mode.lower()  # Use lowercase for consistency

        values = param_config.get('values', [])

        if not values:
            continue

        # Get baseline value from base configuration if available
        baseline_value = None
        if base_config:
            try:
                # Find parameter key in base configuration
                param_key = find_parameter_by_id(base_config, param_id)

                # Extract the value using that key
                baseline_value = base_config[param_key]
                sensitivity_logger.info(f"Found base value {baseline_value} for {param_id} via key {param_key}")
            except Exception as e:
                sensitivity_logger.error(f"Error finding parameter {param_id} in base config: {str(e)}")

        # If no baseline value found, use parameter number as fallback
        if baseline_value is None:
            param_num = int(param_id[1:]) if param_id[1:].isdigit() else 0
            baseline_value = 10000 + (param_num * 100)
            sensitivity_logger.warning(f"Using fallback baseline value {baseline_value} for {param_id}")

        # Convert baseline value to numeric if it's not already
        try:
            if isinstance(baseline_value, str):
                if '.' in baseline_value:
                    baseline_value = float(baseline_value)
                else:
                    baseline_value = int(baseline_value)
        except (ValueError, TypeError):
            sensitivity_logger.warning(f"Could not convert baseline value to numeric: {baseline_value}")
            baseline_value = 10000 + (int(param_id[1:]) if param_id[1:].isdigit() else 0) * 100

        # Ensure baseline_key is an integer for the datapoints structure
        baseline_key = int(baseline_value)

        # Create data points dictionary excluding baseline
        data_points = {}

        # Analyze variation positions
        variations_below_baseline = 0
        all_below = True
        all_above = True

        # Create a temporary config copy for calculating modified values
        temp_config = copy.deepcopy(base_config) if base_config else {}

        # Process each variation
        for variation in sorted(values):
            # Skip baseline variation (typically 0) if present
            if variation == 0:
                continue

            # Determine position relative to baseline
            if variation < 0:
                variations_below_baseline += 1
                all_above = False
            elif variation > 0:
                all_below = False

            # Calculate the actual modified value
            modified_value = None

            # Try to calculate the actual modified value using apply_sensitivity_variation
            if base_config and 'param_key' in locals():
                try:
                    # Create a fresh copy to avoid cumulative modifications
                    var_config = copy.deepcopy(base_config)

                    # Apply the variation to get modified config
                    var_config = apply_sensitivity_variation(
                        var_config,
                        param_id,
                        variation,
                        normalized_mode
                    )

                    # Extract the modified value
                    modified_value = var_config[param_key]
                    sensitivity_logger.info(f"Calculated modified value {modified_value} for {param_id} with variation {variation}")
                except Exception as e:
                    sensitivity_logger.warning(f"Error calculating modified value: {str(e)}")

            # Fallback calculation if the above method failed
            if modified_value is None:
                if normalized_mode == 'percentage':
                    # For percentage mode, apply percentage change
                    modified_value = baseline_value * (1 + variation/100)
                elif normalized_mode == 'directvalue':
                    # For direct value mode, use variation value directly
                    modified_value = variation
                elif normalized_mode == 'absolutedeparture':
                    # For absolute departure mode, add variation to the baseline
                    modified_value = baseline_value + variation
                else:
                    # Default to percentage mode for unknown modes
                    modified_value = baseline_value * (1 + variation/100)
                sensitivity_logger.info(f"Using fallback calculation for modified value: {modified_value}")

            # Ensure modified_value is numeric
            if isinstance(modified_value, str):
                try:
                    if '.' in modified_value:
                        modified_value = float(modified_value)
                    else:
                        modified_value = int(modified_value)
                except (ValueError, TypeError):
                    sensitivity_logger.warning(f"Could not convert modified value to numeric: {modified_value}")
                    # Use variation as fallback
                    modified_value = variation

            # Use the modified value as the point key (ensure it's an integer)
            point_key = int(modified_value)
            data_points[str(point_key)] = None

            sensitivity_logger.info(
                f"Added point for {param_id}: variation={variation}, modified_value={modified_value}, point_key={point_key}"
            )

        # Determine info indicator
        if all_below:
            info_indicator = "-"
        elif all_above:
            info_indicator = "+"
        else:
            info_indicator = f"b{variations_below_baseline}"

        # Add to datapoints structure
        datapoints[combined_key] = {
            "baseline": {str(baseline_key): None},
            "info": info_indicator,
            "data": data_points
        }

        sensitivity_logger.info(
            f"Added datapoints for {combined_key}: baseline={baseline_key}, "
            f"mode={normalized_mode}, variations={len(data_points)}, info={info_indicator}"
        )

    # Write to file in Results folder (not in Sensitivity subfolder)
    output_file = os.path.join(results_folder, f"SensitivityPlotDatapoints_{version}.json")

    try:
        with open(output_file, 'w') as f:
            json.dump(datapoints, f, indent=2)
        sensitivity_logger.info(
            f"Successfully saved SensitivityPlotDatapoints_{version}.json with "
            f"{len(datapoints) - 1} parameter entries"
        )
    except Exception as e:
        error_msg = f"Failed to write SensitivityPlotDatapoints_{version}.json: {str(e)}"
        sensitivity_logger.error(error_msg)

    return output_file

# =====================================
# Pipeline Control Functions
# =====================================
def reset_execution_pipeline():
    """Reset all execution pipeline events to initial state"""
    PAYLOAD_REGISTERED.clear()
    BASELINE_COMPLETED.clear()
    CONFIG_COMPLETED.clear()
    RUNS_COMPLETED.clear()
    PIPELINE_ACTIVE.clear()

def initialize_pipeline():
    """Initialize the pipeline and set it to active"""
    reset_execution_pipeline()
    PIPELINE_ACTIVE.set()
    return time.strftime("%Y%m%d_%H%M%S")

def cancel_pipeline_after_timeout(timeout_seconds=1800):
    """Cancel the pipeline after a timeout"""
    def timeout_handler():
        # Wait for timeout
        time.sleep(timeout_seconds)
        # If pipeline is still active, reset it
        if PIPELINE_ACTIVE.is_set():
            reset_execution_pipeline()
            print(f"Pipeline automatically reset after {timeout_seconds}s timeout")

    # Start timeout thread
    timer_thread = threading.Thread(target=timeout_handler)
    timer_thread.daemon = True
    timer_thread.start()
    return timer_thread

# =====================================
# Helper Functions
# =====================================
def with_file_lock(lock_file_path, operation_name="operation"):
    """Decorator to create a file lock for the decorated function"""
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
    """Decorator to apply a threading lock for the decorated function"""
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
    """Decorator to check pipeline status and validate required events"""
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

def atomic_read_json(filepath):
    """Thread-safe reading of JSON file"""
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
    """Thread-safe writing of JSON file"""
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
    """Thread-safe reading of pickle file"""
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
    """Thread-safe writing of pickle file"""
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

def trigger_config_module_copy(version, sensitivity_dir, sen_parameters):
    """
    Integrated config module copying function (replacing external service call).
    This implementation replaces the HTTP request to the service with direct function calls.

    Args:
        version (int): Version number
        sensitivity_dir (str): Sensitivity directory path
        sen_parameters (dict): Dictionary of sensitivity parameters

    Returns:
        dict: Result of the config module copying operation
    """
    try:
        # Use a unique lock for this specific operation
        lock = threading.Lock()
        with lock:
            logger.info(f"Starting integrated config module copying for version {version}")

            # Process configuration modules directly
            processing_summary = process_config_modules(version, sen_parameters)

            return {
                "status": "success",
                "message": "Config module processing completed successfully",
                "summary": processing_summary
            }
    except Exception as e:
        logger.error(f"Error in integrated config module copying: {str(e)}")
        return {"error": f"Error in config module processing: {str(e)}"}

def run_script(script_name, *args, script_type="python"):
    """Thread-safe script execution with proper error handling"""
    # Create a unique temporary directory for this script execution
    temp_dir = tempfile.mkdtemp()
    temp_output = os.path.join(temp_dir, "output.txt")

    try:
        command = ['python' if script_type == "python" else 'Rscript', script_name]
        command.extend([str(arg) for arg in args])

        # Redirect output to a file in the temporary directory
        with open(temp_output, 'w') as output_file:
            result = subprocess.run(
                command,
                stdout=output_file,
                stderr=subprocess.PIPE,
                text=True
            )

        if result.returncode != 0:
            return False, f"Error running {os.path.basename(script_name)}: {result.stderr}"

        return True, None
    except Exception as e:
        return False, f"Exception running {os.path.basename(script_name)}: {str(e)}"
    finally:
        # Clean up temporary directory
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except:
            pass

def process_version(version, calculation_script, selected_v, selected_f, target_row,
                    calculation_option, SenParameters):
    """Thread-safe version processing with proper locking"""
    # Create a unique lock for this version
    version_lock = threading.RLock()

    with version_lock:
        try:
            # Run common configuration scripts
            for script in COMMON_PYTHON_SCRIPTS:
                success, error = run_script(script, version)
                if not success:
                    return error

            # Run calculation script
            success, error = run_script(
                calculation_script,
                version,
                json.dumps(selected_v),
                json.dumps(selected_f),
                json.dumps(target_row),
                calculation_option,
                json.dumps(SenParameters)
            )
            if not success:
                return error

            return None
        except Exception as e:
            return f"Error processing version {version}: {str(e)}"

def create_sensitivity_directories(version, SenParameters):
    """Thread-safe directory creation with proper locking"""
    # Create a lock specific to this version and operation
    dir_lock_file = os.path.join(LOGS_DIR, f"dir_creation_{version}.lock")
    lock = filelock.FileLock(dir_lock_file, timeout=60)

    with lock:
        # Define base paths
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Create main sensitivity directory
        os.makedirs(sensitivity_dir, exist_ok=True)

        # Create standard subdirectories
        for subdir in ["Reports", "Cache", "Configuration"]:
            path = os.path.join(sensitivity_dir, subdir)
            os.makedirs(path, exist_ok=True)

        reports_dir = os.path.join(sensitivity_dir, "Reports")

        # Create analysis mode directories
        for mode in ["Symmetrical", "Multipoint"]:
            mode_dir = os.path.join(sensitivity_dir, mode)
            os.makedirs(mode_dir, exist_ok=True)

            # Create plot type subdirectories
            for plot_type in ["waterfall", "bar", "point", "Configuration"]:
                plot_type_dir = os.path.join(mode_dir, plot_type)
                os.makedirs(plot_type_dir, exist_ok=True)

        # Process each parameter
        enabled_params = [(param_id, config) for param_id, config in SenParameters.items()
                          if config.get('enabled')]

        for param_id, param_config in enabled_params:
            # Skip disabled parameters
            if not param_config.get('enabled'):
                continue

            # Get parameter details
            mode = param_config.get('mode', 'symmetrical')
            values = param_config.get('values', [])
            plot_types = []

            if param_config.get('waterfall'): plot_types.append('waterfall')
            if param_config.get('bar'): plot_types.append('bar')
            if param_config.get('point'): plot_types.append('point')

            if not values:
                continue

            # Create parameter base directory
            param_dir = os.path.join(sensitivity_dir, param_id)
            os.makedirs(param_dir, exist_ok=True)

            # Create mode directory within parameter
            param_mode_dir = os.path.join(param_dir, mode)
            os.makedirs(param_mode_dir, exist_ok=True)

            # Determine variation values based on mode
            variation_list = []
            if mode.lower() == 'symmetrical':
                if values and len(values) > 0:
                    base_variation = values[0]
                    variation_list = [base_variation, -base_variation]
            else:  # 'multipoint' or other modes
                variation_list = values

            # Create variation directories
            for variation in variation_list:
                var_str = f"{variation:+.2f}"

                # 1. Create parameter variation directories
                var_dir = os.path.join(param_dir, mode, var_str)
                os.makedirs(var_dir, exist_ok=True)

                # 2. Create configuration variation directories
                mode_name = "Symmetrical" if mode.lower() == "symmetrical" else "Multipoint"
                config_var_dir = os.path.join(sensitivity_dir, mode_name, "Configuration", f"{param_id}_{var_str}")
                os.makedirs(config_var_dir, exist_ok=True)

            # Create plot type directories for this parameter
            mode_dir = os.path.join(sensitivity_dir,
                                    "Symmetrical" if mode.lower() == "symmetrical" else "Multipoint")

            for plot_type in plot_types:
                plot_dir = os.path.join(mode_dir, plot_type, f"{param_id}_{plot_type}")
                os.makedirs(plot_dir, exist_ok=True)

        return sensitivity_dir, reports_dir

def save_sensitivity_config_files(version, reports_dir, SenParameters):
    """Thread-safe configuration file saving with proper locking"""
    # Create a lock specific to this version and operation
    file_lock_file = os.path.join(LOGS_DIR, f"config_files_{version}.lock")
    lock = filelock.FileLock(file_lock_file, timeout=60)

    with lock:
        saved_files = []

        # Get base directory
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Save main configuration file in reports directory
        config_file = os.path.join(reports_dir, "sensitivity_config.json")
        atomic_write_json(config_file, {
            'version': version,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'parameters': SenParameters
        })
        saved_files.append(config_file)

        # Save individual parameter configuration files in their respective directories
        for param_id, param_config in SenParameters.items():
            if not param_config.get('enabled'):
                continue

            # Get mode and values
            mode = param_config.get('mode', 'symmetrical')
            values = param_config.get('values', [])

            if not values:
                continue

            # Determine variation list based on mode
            if mode.lower() == 'symmetrical':
                # For symmetrical, use first value to create +/- variations
                base_variation = values[0]
                variation_list = [base_variation, -base_variation]
            else:  # 'multipoint' mode
                # For multipoint, use all values directly
                variation_list = values

            # Save configuration for each variation
            for variation in variation_list:
                # Format the variation string (e.g., "+10.00" or "-5.00")
                var_str = f"{variation:+.2f}"

                # Create path to variation directory
                var_dir = os.path.join(sensitivity_dir, param_id, mode, var_str)

                # Save configuration file
                param_file = os.path.join(var_dir, f"{param_id}_config.json")
                atomic_write_json(param_file, {
                    'parameter': param_id,
                    'config': param_config,
                    'variation': variation,
                    'variation_str': var_str,
                    'mode': mode,
                    'version': version,
                    'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
                })
                saved_files.append(param_file)

        return saved_files

def check_sensitivity_config_status():
    """Thread-safe configuration status check with proper locking"""
    status_lock_file = os.path.join(LOGS_DIR, "status_check.lock")
    lock = filelock.FileLock(status_lock_file, timeout=30)

    with lock:
        if not os.path.exists(SENSITIVITY_CONFIG_STATUS_PATH):
            return False, None

        try:
            # Use atomic read for thread safety
            status = atomic_read_json(SENSITIVITY_CONFIG_STATUS_PATH)

            if not status or not status.get('configured', False):
                return False, None

            if os.path.exists(SENSITIVITY_CONFIG_DATA_PATH):
                # Use atomic read for thread safety
                config_data = atomic_read_pickle(SENSITIVITY_CONFIG_DATA_PATH)
                return True, config_data

            return True, None

        except Exception:
            return False, None

def get_sensitivity_data(version, param_id, mode, compare_to_key):
    """
    Retrieve sensitivity analysis data for visualization.

    Args:
        version (int): Version number
        param_id (str): Parameter ID
        mode (str): Sensitivity mode (percentage, directvalue, absolutedeparture, montecarlo)
        compare_to_key (str): Comparison parameter

    Returns:
        dict: Sensitivity data including variations and values
    """
    # Map mode to directory name
    mode_dir_mapping = {
        'percentage': 'Percentage',
        'directvalue': 'DirectValue',
        'absolutedeparture': 'AbsoluteDeparture',
        'montecarlo': 'MonteCarlo'
    }
    mode_dir = mode_dir_mapping.get(mode.lower(), 'Percentage')

    # Build path to results file
    base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
    results_path = os.path.join(
        base_dir,
        f'Batch({version})',
        f'Results({version})',
        'Sensitivity',
        mode_dir,
        f"{param_id}_vs_{compare_to_key}_{mode.lower()}_results.json"
    )

    # Check if results file exists
    if not os.path.exists(results_path):
        print(f"Results file not found: {results_path}")
        return None

    # Load results data
    try:
        with open(results_path, 'r') as f:
            results_data = json.load(f)
        return results_data
    except Exception as e:
        print(f"Error loading results data: {str(e)}")
        return None

def store_results(version, param_id, result_data):
    """
    Store result data in the expected location using integrated SensitivityFileManager.

    Args:
        version (int): Version number
        param_id (str): Parameter ID
        result_data (dict): Result data structure

    Returns:
        dict: Result info with storage status
    """
    try:
        # Initialize file manager (integrated now)
        file_manager = SensitivityFileManager(ORIGINAL_BASE_DIR)

        # Store calculation results
        result_info = file_manager.store_calculation_result(
            version=version,
            param_id=param_id,
            result_data=result_data,
            mode=result_data.get('mode', 'multiple'),
            compare_to_key=result_data.get('compare_to_key', 'S13')
        )

        logger.info(f"Stored result data for {param_id} at {result_info['path']}")
        return result_info

    except Exception as e:
        error_msg = f"Error storing result data for {param_id}: {str(e)}"
        logger.error(error_msg)
        return {'status': 'error', 'error': error_msg}

# =====================================
# Flask Application Initialization
# =====================================
app = Flask(__name__)
CORS(app)

# Middleware to check if endpoint is allowed
@app.before_request
def check_endpoint_availability():
    # List of endpoints that should always be accessible
    always_accessible = [
        '/health',
        '/register_payload',
        '/status'
    ]

    # Get the current path
    path = request.path

    # Check if we're in active pipeline mode but not on an always accessible endpoint
    if PIPELINE_ACTIVE.is_set() and path not in always_accessible:
        # Allow baseline_calculation only if payload is registered but baseline not completed
        if path == '/baseline_calculation':
            if PAYLOAD_REGISTERED.is_set() and not BASELINE_COMPLETED.is_set():
                return None  # Allow request to proceed
            return jsonify({
                "error": "Baseline calculation cannot be executed at this time",
                "status": "incorrect_sequence",
                "message": "Register payload first or baseline already completed"
            }), 409

        # Allow sensitivity/configure only if baseline is completed but config not completed
        elif path == '/sensitivity/configure':
            if BASELINE_COMPLETED.is_set() and not CONFIG_COMPLETED.is_set():
                return None  # Allow request to proceed
            return jsonify({
                "error": "Sensitivity configuration cannot be executed at this time",
                "status": "incorrect_sequence",
                "message": "Complete baseline calculation first"
            }), 409

        # Allow runs only if config is completed but runs not completed
        elif path == '/runs':
            if CONFIG_COMPLETED.is_set() and not RUNS_COMPLETED.is_set():
                return None  # Allow request to proceed
            return jsonify({
                "error": "Runs cannot be executed at this time",
                "status": "incorrect_sequence",
                "message": "Complete sensitivity configuration first"
            }), 409

        # Block all other endpoints during active pipeline
        else:
            return jsonify({
                "error": "Endpoint temporarily unavailable",
                "status": "pipeline_active",
                "message": "Pipeline is active and only specific endpoints are available"
            }), 503

    # Allow access to always accessible endpoints or when pipeline is not active
    return None

# =====================================
# HTML Album Organizer Functions
# =====================================
def safe_json_dump(data: Any, file_path: Union[str, Path]) -> bool:
    """Safely write JSON data to a file with error handling

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
    """Ensure the specified directory exists, creating it if necessary

    Args:
        directory_path: Path to the directory
    """
    os.makedirs(directory_path, exist_ok=True)

def organize_html_albums(base_dir: Optional[Union[str, Path]] = None,
                         specified_versions: Optional[List[int]] = None) -> bool:
    """
    Organizes HTML plot files into standardized album directories that are compatible
    with the Front_Subtab_HTML.py server and enhances them for the DynamicSubPlot tab.

    Args:
        base_dir: Base directory containing batch folders (optional)
        specified_versions: List of version numbers to process (optional)

    Returns:
        bool: True if successful, False otherwise
    """
    # Determine base directory
    if not base_dir:
        # Use same path logic as in the main scripts
        backend_dir = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        base_dir = backend_dir.parent / 'Original'

    if not os.path.exists(base_dir):
        logger.error(f"Base directory does not exist: {base_dir}")
        return False

    # Get all version directories
    logger.info(f"Scanning for version directories in {base_dir}")

    all_batches = [d for d in os.listdir(base_dir)
                   if d.startswith("Batch(") and d.endswith(")")]

    # Filter to specified versions if provided
    if specified_versions:
        batches = [f"Batch({v})" for v in specified_versions if f"Batch({v})" in all_batches]
        logger.info(f"Processing specified versions: {specified_versions}")
    else:
        batches = all_batches

    if not batches:
        logger.warning("No batch directories found")
        return False

    # Track all created albums for index generation
    all_created_albums = []

    # Process each batch directory
    for batch in batches:
        # Extract version number
        version_match = re.match(r"Batch\((\d+)\)", batch)
        if not version_match:
            logger.warning(f"Invalid batch directory format: {batch}")
            continue

        version = version_match.group(1)
        results_dir = os.path.join(base_dir, batch, f"Results({version})")

        if not os.path.exists(results_dir):
            logger.warning(f"Results directory not found: {results_dir}")
            continue

        # Find HTML plot directories (v*_*_Plot)
        plot_dirs = [d for d in os.listdir(results_dir)
                     if os.path.isdir(os.path.join(results_dir, d)) and
                     (d.startswith("v") and "_Plot" in d)]

        if not plot_dirs:
            logger.info(f"No HTML plot directories found for version {version}")
            continue

        # Categorize plot directories by type
        categorized_plots = {}  # Plot type -> list of directory names
        for plot_dir_name in plot_dirs:
            # Extract the metric name and versions identifier from directory name
            dir_match = re.match(r"v(\d+(?:_\d+)*)_(.+)_Plot", plot_dir_name)
            if not dir_match:
                dir_match = re.match(r"v(\d+(?:_\d+)*)_(.+)", plot_dir_name)
                if not dir_match:
                    logger.warning(f"Invalid plot directory format: {plot_dir_name}")
                    continue

            versions_id = dir_match.group(1)
            plot_type = dir_match.group(2)

            if plot_type not in categorized_plots:
                categorized_plots[plot_type] = []

            categorized_plots[plot_type].append((versions_id, plot_dir_name))

        # Process each plot type
        for plot_type, dirs in categorized_plots.items():
            # Create a mapping of versions_id -> directories
            versions_map = {}
            for versions_id, dir_name in dirs:
                if versions_id not in versions_map:
                    versions_map[versions_id] = []
                versions_map[versions_id].append(dir_name)

            # Process each version combination
            for versions_id, dir_names in versions_map.items():
                # Create standardized album name:
                # Format: HTML_v{versions_id}_{plot_type}
                album_name = f"HTML_v{versions_id}_{plot_type}"
                album_dir = os.path.join(results_dir, album_name)

                # Create album directory
                ensure_directory_exists(album_dir)
                logger.info(f"Created HTML album directory: {album_dir}")

                # Track created album
                all_created_albums.append({
                    "version": version,
                    "versions_id": versions_id,
                    "plot_type": plot_type,
                    "album_name": album_name,
                    "path": album_dir
                })

                # Copy files from all source directories to the album
                html_files = []
                for dir_name in dir_names:
                    source_dir = os.path.join(results_dir, dir_name)
                    for file_name in os.listdir(source_dir):
                        if file_name.lower().endswith('.html'):
                            html_files.append(file_name)
                            src_path = os.path.join(source_dir, file_name)
                            dest_path = os.path.join(album_dir, file_name)

                            # Only copy if file doesn't exist or is different
                            if not os.path.exists(dest_path) or os.path.getsize(src_path) != os.path.getsize(dest_path):
                                shutil.copy2(src_path, dest_path)
                                logger.info(f"Copied {file_name} to album {album_name}")
                            else:
                                logger.info(f"File {file_name} already exists in album {album_name}, skipping")

                # Create a metadata file to help with frontend rendering
                metadata_path = os.path.join(album_dir, "album_metadata.json")

                # Convert versions_id to a list of integers
                version_numbers = [int(v) for v in versions_id.split('_')]

                metadata = {
                    "album_id": album_name,
                    "version": version,
                    "versions": version_numbers,
                    "versions_identifier": versions_id,
                    "plot_type": plot_type,
                    "metric_name": plot_type,
                    "display_name": f"{plot_type.replace('_', ' ')} for versions [{versions_id.replace('_', ', ')}]",
                    "html_files": html_files,
                    "description": f"Interactive visualization of {plot_type.replace('_', ' ')} across multiple versions",
                    "category": "financial_analysis",
                    "created": True
                }

                safe_json_dump(metadata, metadata_path)
                logger.info(f"Created metadata file for album {album_name}")

    # Create index file with all albums
    if all_created_albums:
        index_path = os.path.join(base_dir, "html_albums_index.json")
        album_index = {
            "albums": all_created_albums,
            "count": len(all_created_albums),
            "types": list(set(album["plot_type"] for album in all_created_albums)),
            "versions": list(set(album["version"] for album in all_created_albums))
        }

        safe_json_dump(album_index, index_path)
        logger.info(f"Created HTML albums index at {index_path}")

    logger.info("HTML album organization completed successfully")
    return True

# =====================================
# Album Organizer Functions
# =====================================
def organize_plot_albums(base_dir=None):
    """
    Organizes PNG plots into standardized album directories that are compatible
    with the Front_Subtab_Plot.py server.
    """
    # Determine base directory
    if not base_dir:
        # Same path logic as in the main scripts
        backend_dir = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        base_dir = backend_dir.parent /'Original'

    if not os.path.exists(base_dir):
        logger.error(f"Base directory does not exist: {base_dir}")
        return False

    # Get all version directories
    logger.info(f"Scanning for version directories in {base_dir}")
    batches = [d for d in os.listdir(base_dir) if d.startswith("Batch(") and d.endswith(")")]

    if not batches:
        logger.warning("No batch directories found")
        return False

    for batch in batches:
        # Extract version number
        version_match = re.match(r"Batch\((\d+)\)", batch)
        if not version_match:
            logger.warning(f"Invalid batch directory format: {batch}")
            continue

        version = version_match.group(1)
        results_dir = os.path.join(base_dir, batch, f"Results({version})")

        if not os.path.exists(results_dir):
            logger.warning(f"Results directory not found: {results_dir}")
            continue

        # Look for AnnotatedStaticPlots directories
        plot_dirs = [d for d in os.listdir(results_dir) 
                     if os.path.isdir(os.path.join(results_dir, d)) and 
                     "_AnnotatedStaticPlots" in d]

        if not plot_dirs:
            logger.info(f"No plot directories found for version {version}")
            continue

        # Process each plot directory
        for plot_dir_name in plot_dirs:
            plot_dir = os.path.join(results_dir, plot_dir_name)

            # Extract the versions identifier from the directory name
            versions_id_match = re.match(r"(.+)_AnnotatedStaticPlots", plot_dir_name)
            if not versions_id_match:
                logger.warning(f"Invalid plot directory format: {plot_dir_name}")
                continue

            versions_id = versions_id_match.group(1)

            # Create standardized album categories based on plot types
            png_files = [f for f in os.listdir(plot_dir) if f.lower().endswith('.png')]

            # Group files by type
            file_groups = {}
            for png_file in png_files:
                # Extract plot type from filename
                plot_type_match = re.match(r"aggregated_(.+)_" + re.escape(versions_id) + r"\.png", png_file)
                if not plot_type_match:
                    logger.warning(f"Cannot extract plot type from filename: {png_file}")
                    continue

                plot_type = plot_type_match.group(1)
                if plot_type not in file_groups:
                    file_groups[plot_type] = []
                file_groups[plot_type].append(png_file)

            # Create category albums
            for plot_type, files in file_groups.items():
                # Create standardized album name:
                # Format: versions_id_PlotType
                album_name = f"{versions_id}_PlotType_{plot_type}"
                album_dir = os.path.join(results_dir, album_name)

                # Create album directory
                os.makedirs(album_dir, exist_ok=True)
                logger.info(f"Created album directory: {album_dir}")

                # Copy files to album
                for png_file in files:
                    src_path = os.path.join(plot_dir, png_file)
                    dest_path = os.path.join(album_dir, png_file)
                    shutil.copy2(src_path, dest_path)
                    logger.info(f"Copied {png_file} to album {album_name}")

    logger.info("Album organization completed successfully")
    return True

# =====================================
# Generate Plots Functions
# =====================================
def create_png_plot(plot_data, output_path):
    """
    Create a PNG plot from the plot data.

    Args:
        plot_data (dict): The plot data
        output_path (str): The output path for the PNG file
    """
    # Extract plot data
    x_param = plot_data["x_param"]
    y_param = plot_data["y_param"]
    plot_type = plot_data["plot_type"]
    axis_label = plot_data["axis_label"]
    baseline_data = plot_data["datapoints"]["baseline"]
    variations_data = plot_data["datapoints"]["variations"]

    # Create figure and axis
    fig, ax = plt.subplots(figsize=(10, 6))

    # Set title and labels
    ax.set_title(f"{y_param} vs {x_param} ({plot_type})")
    ax.set_xlabel(x_param)
    ax.set_ylabel(axis_label)

    # Plot baseline data if available
    if baseline_data:
        x_values = [float(x) for x in baseline_data.keys()]
        y_values = [float(y) for y in baseline_data.values()]
        ax.plot(x_values, y_values, 'o-', label='Baseline', color='blue')

    # Plot variations data if available
    if variations_data:
        x_values = [float(x) for x in variations_data.keys()]
        y_values = [float(y) for y in variations_data.values()]

        # Different plot types
        if plot_type == "point":
            ax.scatter(x_values, y_values, label='Variations', color='red', s=50)
        elif plot_type == "bar":
            ax.bar(x_values, y_values, label='Variations', color='green', alpha=0.7)
        elif plot_type == "waterfall":
            # For waterfall, connect points with lines
            ax.plot(x_values, y_values, 's-', label='Variations', color='purple')
        else:
            # Default to line plot
            ax.plot(x_values, y_values, 'o-', label='Variations', color='red')

    # Add grid and legend
    ax.grid(True, linestyle='--', alpha=0.7)
    ax.legend()

    # Adjust layout
    plt.tight_layout()

    # Save the plot
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close(fig)

    logger.info(f"Created PNG plot: {output_path}")

def generate_plots(version):
    """
    Generate plot algorithm for sensitivity analysis.

    Args:
        version (str): Version number
    """
    # Try different possible locations for the codebase root
    possible_roots = [
        # Current directory method
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        # Hard-coded path as seen in the error
        r"C:\Users\Mohse\IdeaProjects2\codebase",
        # Alternative with backend included
        r"C:\Users\Mohse\IdeaProjects2\codebase\backend"
    ]

    code_files_path = None
    calsen_paths_file = None

    # Try each possible root until we find the calsen_paths.json file
    for root in possible_roots:
        test_path = os.path.join(root, "Original")
        test_calsen_path = os.path.join(
            test_path,
            f"Batch({version})",
            f"Results({version})",
            "Sensitivity",
            "Reports",
            "calsen_paths.json"
        )

        if os.path.exists(test_calsen_path):
            code_files_path = test_path
            calsen_paths_file = test_calsen_path
            logger.info(f"Found calsen_paths.json at: {calsen_paths_file}")
            break

    if calsen_paths_file is None:
        logger.error("Could not find calsen_paths.json in any of the expected locations")
        return

    # Load calsen_paths.json
    try:
        with open(calsen_paths_file, 'r') as f:
            data = json.load(f)
    except Exception as e:
        logger.error(f"Error loading calsen_paths.json: {e}")
        return

    # Get SenParameters from payload
    sen_parameters = data["payload"]["SenParameters"]

    # Override all comparisonTypes to "primary (x axis)"
    for s_param, param_data in data["path_sets"].items():
        param_data["comparisonType"] = "primary (x axis)"

    # Group parameters by their compareToKey
    param_groups = {}

    # Process parameters in order to maintain proper plot sequence
    param_order = []
    for s_param, param_data in data["path_sets"].items():
        compare_to_key = param_data.get("compareToKey", "")
        if compare_to_key:
            if compare_to_key not in param_groups:
                param_groups[compare_to_key] = []
                param_order.append(compare_to_key)
            param_groups[compare_to_key].append(s_param)

    # Create plots based on parameter groups
    plots = []
    for i, compare_to_key in enumerate(param_order):
        group_params = param_groups[compare_to_key]

        # Create a plot for each group
        plot = {
            "plot_id": f"plot_{i+1}",
            "x_param": compare_to_key,
            "y_params": group_params,
            "plot_types": []
        }

        # Determine plot types for each parameter (bar, point, waterfall)
        for s_param in group_params:
            if s_param in sen_parameters:
                param_config = sen_parameters[s_param]
                if param_config.get("bar", False):
                    plot["plot_types"].append("bar")
                if param_config.get("point", False):
                    plot["plot_types"].append("point")
                if param_config.get("waterfall", False):
                    plot["plot_types"].append("waterfall")

        # Remove duplicates
        plot["plot_types"] = list(set(plot["plot_types"]))

        plots.append(plot)

    # Base output directory
    output_base_dir = os.path.join(
        code_files_path,
        f"Batch({version})",
        f"Results({version})",
        "Sensitivity"
    )

    # Create plot files
    created_plots = 0

    for plot in plots:
        plot_id = plot["plot_id"]
        x_param = plot["x_param"]
        y_params = plot["y_params"]
        plot_types = plot["plot_types"]

        logger.info(f"\nGenerating {plot_id}:")
        logger.info(f"  X-axis parameter: {x_param}")
        logger.info(f"  Y-axis parameters: {', '.join(y_params)}")
        logger.info(f"  Plot types: {', '.join(plot_types)}")

        # Get the data points for each parameter
        for plot_type in plot_types:
            # Capitalize plot type for directory
            plot_type_dir = plot_type.capitalize()

            for y_param in y_params:
                # Get the mode from the parameter data
                if y_param in data["path_sets"]:
                    param_data = data["path_sets"][y_param]
                    mode = param_data.get("mode", "")

                    # Capitalize mode for directory
                    mode_dir = mode.capitalize()

                    # Create directory path
                    plot_dir = os.path.join(output_base_dir, mode_dir, plot_type_dir)
                    os.makedirs(plot_dir, exist_ok=True)

                    # Create plot file name
                    plot_file_name = f"{y_param}_{x_param}_plot.json"
                    plot_file_path = os.path.join(plot_dir, plot_file_name)

                    # Create the plot data
                    plot_data = {
                        "x_param": x_param,
                        "y_param": y_param,
                        "plot_type": plot_type,
                        "mode": mode,
                        "axis_label": param_data.get("axisLabel", f"{y_param} vs {x_param}"),
                        "compare_to_key": x_param,
                        "comparison_type": "primary (x axis)",
                        "datapoints": {
                            "baseline": {},
                            "variations": {}
                        }
                    }

                    # Check if plotCoordinates are available in the parameter data
                    if "plotCoordinates" in param_data:
                        # Use plotCoordinates from calsen_paths.json
                        plot_coordinates = param_data["plotCoordinates"]

                        # Process coordinates for plot data
                        for coord in plot_coordinates:
                            if "x" in coord and "y" in coord:
                                # For variations, use the label if available
                                label = coord.get("label", "")
                                if label:
                                    # Add to variations
                                    plot_data["datapoints"]["variations"][str(coord["x"])] = coord["y"]
                                else:
                                    # Add to baseline if no label (assuming it's baseline)
                                    plot_data["datapoints"]["baseline"][str(coord["x"])] = coord["y"]

                        logger.info(f"  Using plotCoordinates from calsen_paths.json for {y_param}")
                    else:
                        # Check if variations have plotCoordinates
                        has_coordinates = False
                        for var_str, var_data in param_data.get("variations", {}).items():
                            if "plotCoordinates" in var_data:
                                has_coordinates = True
                                # Process coordinates for this variation
                                for coord in var_data["plotCoordinates"]:
                                    if "x" in coord and "y" in coord:
                                        # Add to variations
                                        plot_data["datapoints"]["variations"][str(coord["x"])] = coord["y"]

                        if has_coordinates:
                            logger.info(f"  Using variation plotCoordinates from calsen_paths.json for {y_param}")
                        else:
                            logger.info(f"  Warning: No plotCoordinates found for {y_param}")

                            # If no plotCoordinates are available, create empty plot data
                            # This ensures the plot file is still created even without data
                            plot_data["datapoints"] = {
                                "baseline": {},
                                "variations": {}
                            }

                    # Save the plot data as JSON
                    try:
                        with open(plot_file_path, 'w') as f:
                            json.dump(plot_data, f, indent=2)
                        logger.info(f"  Created JSON plot file: {plot_file_path}")
                        created_plots += 1

                        # Also create PNG plot
                        # Create PNG directory structure
                        png_dir = os.path.join(output_base_dir, mode_dir, plot_type_dir, "PNG")
                        os.makedirs(png_dir, exist_ok=True)

                        # Create PNG file name
                        png_file_name = f"{y_param}_{x_param}_plot.png"
                        png_file_path = os.path.join(png_dir, png_file_name)

                        # Generate PNG plot
                        create_png_plot(plot_data, png_file_path)
                        created_plots += 1
                    except Exception as e:
                        logger.error(f"  Error saving plot files: {e}")

    # Save the updated calsen_paths.json with the comparisonType changes
    try:
        with open(calsen_paths_file, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"\nSuccessfully updated {calsen_paths_file} with comparisonType changes")
    except Exception as e:
        logger.error(f"Error saving {calsen_paths_file}: {e}")

    # Calculate the number of JSON and PNG files (half of total created_plots)
    json_count = created_plots // 2
    png_count = created_plots // 2

    logger.info(f"\nPlot generation complete. Created {json_count} JSON and {png_count} PNG plot files using coordinate points from calsen_paths.json.")
    logger.info(f"PNG files are available in the PNG subdirectories and can be displayed in the plot gallery and sensitivity tabs.")
    return True

# =====================================
# Process Sensitivity Results Functions
# =====================================
def extract_price_from_summary(version, param_id, variation):
    """
    Extract price value from economic summary for a specific parameter variation.

    Args:
        version (int): Version number
        param_id (str): Parameter ID (e.g., "S35")
        variation (float): Variation value

    Returns:
        float: Extracted price value or None if not found
    """
    try:
        # Format variation string for directory name
        var_str = f"{variation:+.2f}"

        # First, find the correct Economic_Summary file for this variation
        # Check in the parameter variation directory
        search_paths = [
            # Main directory search pattern
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity',
                f'{param_id}',
                '*',
                f'{var_str}',
                f'Economic_Summary*.csv'
            ),
            # Secondary locations based on directory structure
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity',
                'Multipoint',
                'Configuration',
                f'{param_id}_{var_str}',
                f'Economic_Summary*.csv'
            ),
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity',
                'Symmetrical',
                'Configuration',
                f'{param_id}_{var_str}',
                f'Economic_Summary*.csv'
            )
        ]

        summary_file = None
        for pattern in search_paths:
            matches = glob.glob(pattern)
            if matches:
                summary_file = matches[0]
                logger.info(f"Found economic summary for {param_id} variation {var_str}: {summary_file}")
                break

        if not summary_file:
            logger.warning(f"No economic summary found for {param_id} variation {var_str}")
            return None

        # Read the economic summary and extract price
        economic_df = pd.read_csv(summary_file)
        price_row = economic_df[economic_df['Metric'] == 'Average Selling Price (Project Life Cycle)']

        if price_row.empty:
            logger.warning(f"Price metric not found in economic summary for {param_id} variation {var_str}")
            return None

        price_value = float(price_row.iloc[0, 1])  # Assuming value is in second column
        logger.info(f"Extracted price value for {param_id} variation {var_str}: {price_value}")
        return price_value

    except Exception as e:
        logger.error(f"Error extracting price for {param_id} variation {var_str}: {str(e)}")
        return None

def process_parameter_variations(version, param_id, param_config):
    """
    Process variations for a specific parameter and generate result data.

    Args:
        version (int): Version number
        param_id (str): Parameter ID
        param_config (dict): Parameter configuration

    Returns:
        dict: Result data structure
    """
    try:
        mode = param_config.get('mode', 'symmetrical')
        values = param_config.get('values', [])
        compare_to_key = param_config.get('compareToKey', 'S13')

        # Determine variations based on mode
        if mode.lower() == 'symmetrical':
            base_variation = values[0]
            variations = [base_variation, -base_variation]
        else:
            variations = values

        # Initialize result data structure
        result_data = {
            'param_id': param_id,
            'mode': mode,
            'compare_to_key': compare_to_key,
            'variations': {},
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
        }

        # Process each variation
        for variation in variations:
            # Extract price for this variation
            price = extract_price_from_summary(version, param_id, variation)

            if price is not None:
                # Add to result data
                var_str = f"{variation:+.2f}"
                result_data['variations'][var_str] = {
                    'price': price,
                    'variation': variation
                }
                logger.info(f"Added price {price} for {param_id} variation {var_str}")

        return result_data

    except Exception as e:
        logger.error(f"Error processing variations for {param_id}: {str(e)}")
        return None

def process_sensitivity_results(version, wait_time_minutes=3):
    """
    Process sensitivity results for all parameters.

    Args:
        version (int): Version number
        wait_time_minutes (float): Wait time in minutes before processing

    Returns:
        dict: Processing summary
    """
    # Log start information
    logger.info(f"=== Starting Sensitivity Results Processing ===")
    logger.info(f"Version: {version}")
    logger.info(f"Wait time: {wait_time_minutes} minutes")

    # Wait for specified time
    if wait_time_minutes > 0:
        logger.info(f"Waiting {wait_time_minutes} minutes before processing...")
        time.sleep(wait_time_minutes * 60)

    # Load sensitivity configuration
    is_configured, config_data = check_sensitivity_config_status()

    if not is_configured or not config_data:
        logger.error("Failed to load sensitivity configuration, exiting")
        return {'status': 'error', 'error': 'Failed to load sensitivity configuration'}

    # Get sensitivity parameters
    sen_parameters = config_data.get('SenParameters', {})

    if not sen_parameters:
        logger.warning("No sensitivity parameters found in configuration")
        return {'status': 'error', 'error': 'No sensitivity parameters found in configuration'}

    # Initialize processing summary
    processing_summary = {
        'status': 'success',
        'parameters_processed': 0,
        'variations_processed': 0,
        'errors': []
    }

    # Process each parameter
    for param_id, param_config in sen_parameters.items():
        if not param_config.get('enabled'):
            continue

        logger.info(f"=== Processing Parameter: {param_id} ===")

        # Process variations and get result data
        result_data = process_parameter_variations(version, param_id, param_config)

        if not result_data:
            error_msg = f"No result data generated for {param_id}"
            logger.warning(error_msg)
            processing_summary['errors'].append(error_msg)
            continue

        # Store results
        store_result = store_results(version, param_id, result_data)

        if store_result.get('status') == 'error':
            error_msg = f"Failed to store results for {param_id}: {store_result.get('error')}"
            logger.error(error_msg)
            processing_summary['errors'].append(error_msg)
        else:
            logger.info(f"Successfully processed and stored results for {param_id}")
            processing_summary['parameters_processed'] += 1
            processing_summary['variations_processed'] += len(result_data.get('variations', {}))

    logger.info(f"=== Sensitivity Results Processing Completed ===")
    logger.info(f"Processed {processing_summary['parameters_processed']} parameters with {processing_summary['variations_processed']} variations")

    if processing_summary['errors']:
        logger.warning(f"Encountered {len(processing_summary['errors'])} errors during processing")

    return processing_summary

# =====================================
# Sense Config Base Functions
# =====================================
def setup_sense_config_logging():
    """Configure logging for sense_config_base functionality."""
    # Create logs directory if it doesn't exist
    os.makedirs(LOGS_DIR, exist_ok=True)

    # Configure sensitivity logger as a separate logger
    sensitivity_logger = logging.getLogger('sensitivity')
    sensitivity_logger.setLevel(logging.DEBUG)
    sensitivity_logger.propagate = False  # Prevent propagation to root logger

    sensitivity_handler = logging.FileHandler(os.path.join(LOGS_DIR, "SENSITIVITY.log"))
    sensitivity_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    sensitivity_logger.addHandler(sensitivity_handler)

    sensitivity_logger.info("Sensitivity logging configured correctly for sense_config_base functionality")

def import_sensitivity_functions():
    """Import necessary functions from Sen_Config module."""
    sensitivity_logger = logging.getLogger('sensitivity')

    try:
        # Add the Configuration_managment directory to the path
        config_mgmt_path = os.path.join(SCRIPT_DIR, "Configuration_management")
        if config_mgmt_path not in sys.path:
            sys.path.append(config_mgmt_path)

        # Try direct import
        try:
            from Sen_Config import apply_sensitivity_variation, find_parameter_by_id
            sensitivity_logger.info("Successfully imported sensitivity functions via direct import")
            return apply_sensitivity_variation, find_parameter_by_id
        except ImportError:
            sensitivity_logger.warning("Direct import failed, attempting spec import...")

        # Try spec import if direct import fails
        sen_config_path = os.path.join(config_mgmt_path, "Sen_Config.py")
        if os.path.exists(sen_config_path):
            spec = importlib.util.spec_from_file_location("Sen_Config", sen_config_path)
            sen_config_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(sen_config_module)

            apply_sensitivity_variation = getattr(sen_config_module, 'apply_sensitivity_variation')
            find_parameter_by_id = getattr(sen_config_module, 'find_parameter_by_id')

            sensitivity_logger.info("Successfully imported sensitivity functions via spec import")
            return apply_sensitivity_variation, find_parameter_by_id
        else:
            raise ImportError(f"Could not find Sen_Config.py at {sen_config_path}")

    except Exception as e:
        sensitivity_logger.error(f"Failed to import sensitivity functions: {str(e)}")
        raise ImportError(f"Failed to import required functions: {str(e)}")

def generate_sensitivity_datapoints_from_config(version, SenParameters):
    """
    Generate SensitivityPlotDatapoints_{version}.json file with baseline and variation points.
    Uses actual modified values from configuration modules.

    Args:
        version (int): Version number
        SenParameters (dict): Dictionary containing sensitivity parameters

    Returns:
        str: Path to the generated file
    """
    sensitivity_logger = logging.getLogger('sensitivity')

    # Import necessary functions if not already available
    try:
        apply_sensitivity_variation, find_parameter_by_id = import_sensitivity_functions()
    except Exception as e:
        sensitivity_logger.error(f"Failed to import sensitivity functions for datapoints generation: {str(e)}")
        return None

    # Define paths
    target_base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
    results_folder = os.path.join(target_base_dir, f'Batch({version})', f'Results({version})')
    source_dir = os.path.join(ORIGINAL_BASE_DIR, f'Batch({version})', f'Results({version})')

    sensitivity_logger.info(f"Generating SensitivityPlotDatapoints_{version}.json in {results_folder}")

    # Find a base configuration module to extract baseline values
    base_config = None
    base_config_path = None

    for module_num in range(1, 101):
        potential_path = os.path.join(source_dir, f"{version}_config_module_{module_num}.json")
        if os.path.exists(potential_path):
            base_config_path = potential_path
            try:
                with open(base_config_path, 'r') as f:
                    base_config = json.load(f)
                sensitivity_logger.info(f"Loaded base configuration from {base_config_path}")
                break
            except Exception as e:
                sensitivity_logger.warning(f"Failed to load {potential_path}: {str(e)}")
                continue

    if not base_config:
        sensitivity_logger.warning("No base configuration module found. Using fallback values.")

    # Initialize the datapoints structure
    datapoints = {
        "metadata": {
            "structure_explanation": {
                "S35,S13": "Key format: 'enabledParam,compareToKey' where S35 is enabled parameter and S13 is comparison key",
                "baseline": "Reference point measurement",
                "baseline:key": "Numerical measurement point for baseline (e.g., 10000)",
                "baseline:value": "Reference measurement value to compare against",
                "info": "Position indicator: '+' (all above), '-' (all below), or 'b#' (# variations below baseline)",
                "data": "Collection of variation measurements",
                "data:keys": "Numerical measurement points using actual modified values",
                "data:values": "Actual measurements. Must be initially null/empty when created by sense_config_base.py"
            }
        }
    }

    # Process each enabled parameter
    for param_id, param_config in SenParameters.items():
        if not param_config.get('enabled'):
            continue

        # Get comparison key from parameter configuration
        compare_to_key = param_config.get('compareToKey', 'S13')
        combined_key = f"{param_id},{compare_to_key}"

        # Get mode and values from parameter configuration
        # Normalize mode terminology to match Sen_Config.py
        mode = param_config.get('mode', 'percentage')
        normalized_mode = mode.lower()  # Use lowercase for consistency

        values = param_config.get('values', [])

        if not values:
            continue

        # Get baseline value from base configuration if available
        baseline_value = None
        if base_config:
            try:
                # Find parameter key in base configuration
                param_key = find_parameter_by_id(base_config, param_id)

                # Extract the value using that key
                baseline_value = base_config[param_key]
                sensitivity_logger.info(f"Found base value {baseline_value} for {param_id} via key {param_key}")
            except Exception as e:
                sensitivity_logger.error(f"Error finding parameter {param_id} in base config: {str(e)}")

        # If no baseline value found, use parameter number as fallback
        if baseline_value is None:
            param_num = int(param_id[1:]) if param_id[1:].isdigit() else 0
            baseline_value = 10000 + (param_num * 100)
            sensitivity_logger.warning(f"Using fallback baseline value {baseline_value} for {param_id}")

        # Convert baseline value to numeric if it's not already
        try:
            if isinstance(baseline_value, str):
                if '.' in baseline_value:
                    baseline_value = float(baseline_value)
                else:
                    baseline_value = int(baseline_value)
        except (ValueError, TypeError):
            sensitivity_logger.warning(f"Could not convert baseline value to numeric: {baseline_value}")
            baseline_value = 10000 + (int(param_id[1:]) if param_id[1:].isdigit() else 0) * 100

        # Ensure baseline_key is an integer for the datapoints structure
        baseline_key = int(baseline_value)

        # Create data points dictionary excluding baseline
        data_points = {}

        # Analyze variation positions
        variations_below_baseline = 0
        all_below = True
        all_above = True

        # Create a temporary config copy for calculating modified values
        temp_config = copy.deepcopy(base_config) if base_config else {}

        # Process each variation
        for variation in sorted(values):
            # Skip baseline variation (typically 0) if present
            if variation == 0:
                continue

            # Determine position relative to baseline
            if variation < 0:
                variations_below_baseline += 1
                all_above = False
            elif variation > 0:
                all_below = False

            # Calculate the actual modified value
            modified_value = None

            # Try to calculate the actual modified value using apply_sensitivity_variation
            if base_config and param_key:
                try:
                    # Create a fresh copy to avoid cumulative modifications
                    var_config = copy.deepcopy(base_config)

                    # Apply the variation to get modified config
                    var_config = apply_sensitivity_variation(
                        var_config,
                        param_id,
                        variation,
                        normalized_mode
                    )

                    # Extract the modified value
                    modified_value = var_config[param_key]
                    sensitivity_logger.info(f"Calculated modified value {modified_value} for {param_id} with variation {variation}")
                except Exception as e:
                    sensitivity_logger.warning(f"Error calculating modified value: {str(e)}")

            # Fallback calculation if the above method failed
            if modified_value is None:
                if normalized_mode == 'percentage':
                    # For percentage mode, apply percentage change
                    modified_value = baseline_value * (1 + variation/100)
                elif normalized_mode == 'directvalue':
                    # For direct value mode, use variation value directly
                    modified_value = variation
                elif normalized_mode == 'absolutedeparture':
                    # For absolute departure mode, add variation to the baseline
                    modified_value = baseline_value + variation
                else:
                    # Default to percentage mode for unknown modes
                    modified_value = baseline_value * (1 + variation/100)
                sensitivity_logger.info(f"Using fallback calculation for modified value: {modified_value}")

            # Ensure modified_value is numeric
            if isinstance(modified_value, str):
                try:
                    if '.' in modified_value:
                        modified_value = float(modified_value)
                    else:
                        modified_value = int(modified_value)
                except (ValueError, TypeError):
                    sensitivity_logger.warning(f"Could not convert modified value to numeric: {modified_value}")
                    # Use variation as fallback
                    modified_value = variation

            # Use the modified value as the point key (ensure it's an integer)
            point_key = int(modified_value)
            data_points[str(point_key)] = None

            sensitivity_logger.info(
                f"Added point for {param_id}: variation={variation}, modified_value={modified_value}, point_key={point_key}"
            )

        # Determine info indicator
        if all_below:
            info_indicator = "-"
        elif all_above:
            info_indicator = "+"
        else:
            info_indicator = f"b{variations_below_baseline}"

        # Add to datapoints structure
        datapoints[combined_key] = {
            "baseline": {str(baseline_key): None},
            "info": info_indicator,
            "data": data_points
        }

        sensitivity_logger.info(
            f"Added datapoints for {combined_key}: baseline={baseline_key}, "
            f"mode={normalized_mode}, variations={len(data_points)}, info={info_indicator}"
        )

    # Write to file in Results folder (not in Sensitivity subfolder)
    output_file = os.path.join(results_folder, f"SensitivityPlotDatapoints_{version}.json")

    try:
        with open(output_file, 'w') as f:
            json.dump(datapoints, f, indent=2)
        sensitivity_logger.info(
            f"Successfully saved SensitivityPlotDatapoints_{version}.json with "
            f"{len(datapoints) - 1} parameter entries"
        )
    except Exception as e:
        error_msg = f"Failed to write SensitivityPlotDatapoints_{version}.json: {str(e)}"
        sensitivity_logger.error(error_msg)

    return output_file

def process_config_modules_for_sensitivity(version, SenParameters):
    """
    Process all configuration modules (1-100) for all parameter variations.
    Apply sensitivity variations and save modified configurations.

    Args:
        version (int): Version number
        SenParameters (dict): Dictionary containing sensitivity parameters

    Returns:
        dict: Summary of processed modules and their status
    """
    sensitivity_logger = logging.getLogger('sensitivity')
    processing_summary = {
        'total_found': 0,
        'total_modified': 0,
        'errors': [],
        'processed_modules': {},
        'csv_files_copied': 0,
        'py_files_copied': 0
    }

    try:
        # Import sensitivity functions from Sen_Config
        apply_sensitivity_variation, find_parameter_by_id = import_sensitivity_functions()

        # Source directory in ORIGINAL_BASE_DIR (root level)
        source_dir = os.path.join(ORIGINAL_BASE_DIR, f'Batch({version})', f'Results({version})')

        # Target directory in backend/Original
        target_base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(target_base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Create ConfigurationPlotSpec directory at the same level as Results
        config_plot_spec_dir = os.path.join(target_base_dir, f'Batch({version})', f'ConfigurationPlotSpec({version})')
        os.makedirs(config_plot_spec_dir, exist_ok=True)
        sensitivity_logger.info(f"Created/ensured ConfigurationPlotSpec directory: {config_plot_spec_dir}")

        # Short pause before looking for CSV files to ensure they exist
        sensitivity_logger.info("Starting short pause to ensure CSV files exist...")
        time.sleep(3)  # 3-second pause to ensure files exist
        sensitivity_logger.info("Resuming after pause, checking for CSV files...")

        # Define the specific CSV files we want to copy
        target_csv_files = [
            f"Configuration_Matrix({version}).csv",
            f"General_Configuration_Matrix({version}).csv"
        ]

        # Get the Python configuration file path
        code_files_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "Original")
        config_file = os.path.join(code_files_path, f"Batch({version})", f"ConfigurationPlotSpec({version})", f"configurations({version}).py")

        # Filter to only existing files
        existing_csv_files = [
            f for f in target_csv_files
            if os.path.exists(os.path.join(source_dir, f))
        ]

        py_file_exists = os.path.exists(config_file)

        if len(existing_csv_files) < len(target_csv_files):
            missing_files = set(target_csv_files) - set(existing_csv_files)
            sensitivity_logger.warning(f"Some target CSV files not found even after pause: {missing_files}")
        if not py_file_exists:
            sensitivity_logger.warning(f"Python configuration file not found: {config_file}")

        # Process each parameter's variation directory
        for param_id, param_config in SenParameters.items():
            if not param_config.get('enabled'):
                continue

            # Get mode and values
            mode = param_config.get('mode', 'symmetrical')
            # Normalize mode terminology
            if mode in ['symmetrical', 'multiple']:
                normalized_mode = 'symmetrical'
            elif mode in ['discrete']:
                normalized_mode = 'multipoint'
            else:
                normalized_mode = mode.lower()

            values = param_config.get('values', [])

            if not values:
                continue

            sensitivity_logger.info(f"Processing parameter {param_id} with mode {normalized_mode}")

            # Determine variation list based on normalized mode
            if normalized_mode == 'symmetrical':
                base_variation = values[0]
                variation_list = [base_variation]
            else:  # 'multipoint'
                variation_list = values

            # Process each variation
            for variation in variation_list:
                var_str = f"{variation:+.2f}"
                param_var_dir = os.path.join(sensitivity_dir, param_id, normalized_mode, var_str)

                # Create directory if it doesn't exist
                os.makedirs(param_var_dir, exist_ok=True)
                sensitivity_logger.info(f"Processing variation {var_str} in directory: {param_var_dir}")

                # Copy only the specific CSV files we want
                for csv_file in existing_csv_files:
                    source_csv_path = os.path.join(source_dir, csv_file)
                    target_csv_path = os.path.join(param_var_dir, csv_file)
                    try:
                        shutil.copy2(source_csv_path, target_csv_path)
                        processing_summary['csv_files_copied'] += 1
                        sensitivity_logger.info(f"Copied specific CSV file: {csv_file}")
                    except Exception as e:
                        error_msg = f"Failed to copy CSV file {csv_file}: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

                # Copy the Python configuration file if it exists
                # Now copying to the new ConfigurationPlotSpec directory
                if py_file_exists:
                    # Copy to parameter variation directory
                    target_py_path = os.path.join(param_var_dir, os.path.basename(config_file))
                    try:
                        shutil.copy2(config_file, target_py_path)
                        processing_summary['py_files_copied'] += 1
                        sensitivity_logger.info(f"Copied Python configuration file to variation dir: {os.path.basename(config_file)}")
                    except Exception as e:
                        error_msg = f"Failed to copy Python configuration file to variation dir: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

                    # Also copy to the main ConfigurationPlotSpec directory
                    config_plot_spec_py_path = os.path.join(config_plot_spec_dir, os.path.basename(config_file))
                    try:
                        shutil.copy2(config_file, config_plot_spec_py_path)
                        sensitivity_logger.info(f"Copied Python configuration file to main ConfigurationPlotSpec dir: {config_plot_spec_py_path}")
                    except Exception as e:
                        error_msg = f"Failed to copy Python configuration file to ConfigurationPlotSpec dir: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

                # Track modules for this parameter variation
                param_key = f"{param_id}_{var_str}"
                if param_key not in processing_summary['processed_modules']:
                    processing_summary['processed_modules'][param_key] = []

                # Process all possible module files (1-100)
                for module_num in range(1, 101):
                    source_config_path = os.path.join(source_dir, f"{version}_config_module_{module_num}.json")
                    target_config_path = os.path.join(param_var_dir, f"{version}_config_module_{module_num}.json")

                    # Skip if source JSON file doesn't exist
                    if not os.path.exists(source_config_path):
                        continue

                    processing_summary['total_found'] += 1

                    try:
                        # Load the source config module
                        with open(source_config_path, 'r') as f:
                            config_module = json.load(f)

                        # Apply sensitivity variation to the config
                        modified_config = apply_sensitivity_variation(
                            copy.deepcopy(config_module),
                            param_id,
                            variation,
                            normalized_mode
                        )

                        # Save the modified config
                        with open(target_config_path, 'w') as f:
                            json.dump(modified_config, f, indent=4)

                        processing_summary['total_modified'] += 1
                        processing_summary['processed_modules'][param_key].append(module_num)
                        sensitivity_logger.info(
                            f"Applied {variation}{'%' if normalized_mode == 'symmetrical' else ''} "
                            f"variation to config module {module_num} for {param_id}"
                        )

                    except Exception as e:
                        error_msg = f"Failed to process config module {module_num} for {param_id}, variation {var_str}: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

        sensitivity_logger.info(
            f"Config module processing completed: "
            f"found {processing_summary['total_found']} JSON files, "
            f"modified {processing_summary['total_modified']} JSON files, "
            f"copied {processing_summary['csv_files_copied']} specific CSV files, "
            f"copied {processing_summary['py_files_copied']} Python configuration files"
        )

        if processing_summary['errors']:
            sensitivity_logger.warning(f"Encountered {len(processing_summary['errors'])} errors during processing")

        # Generate the SensitivityPlotDatapoints_{version}.json file
        sensitivity_logger.info("Generating SensitivityPlotDatapoints_{version}.json file with actual base values...")
        datapoints_file = generate_sensitivity_datapoints_from_config(version, SenParameters)
        sensitivity_logger.info(f"SensitivityPlotDatapoints generation completed: {datapoints_file}")

        return processing_summary

    except Exception as e:
        error_msg = f"Error in config module processing: {str(e)}"
        sensitivity_logger.exception(error_msg)
        processing_summary['errors'].append(error_msg)
        return processing_summary

# =====================================
# Pipeline Status Endpoint
# =====================================
@app.route('/status', methods=['GET'])
def get_pipeline_status():
    """Get current pipeline execution status"""
    status = {
        "pipeline_active": PIPELINE_ACTIVE.is_set(),
        "steps": {
            "payload_registered": PAYLOAD_REGISTERED.is_set(),
            "baseline_completed": BASELINE_COMPLETED.is_set(),
            "config_completed": CONFIG_COMPLETED.is_set(),
            "runs_completed": RUNS_COMPLETED.is_set()
        },
        "current_step": "none",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    # Determine current step
    if PIPELINE_ACTIVE.is_set():
        if not PAYLOAD_REGISTERED.is_set():
            status["current_step"] = "register_payload"
        elif not BASELINE_COMPLETED.is_set():
            status["current_step"] = "baseline_calculation"
        elif not CONFIG_COMPLETED.is_set():
            status["current_step"] = "sensitivity_configure"
        elif not RUNS_COMPLETED.is_set():
            status["current_step"] = "runs"
        else:
            status["current_step"] = "complete"

    return jsonify(status)

# =====================================
# Register Payload Endpoint
# =====================================
@app.route('/register_payload', methods=['POST'])
@with_file_lock(PAYLOAD_LOCK_FILE, "payload registration")
@with_memory_lock(GLOBAL_PAYLOAD_LOCK, "payload registration")
def register_payload():
    """Register payload and initialize pipeline"""
    try:
        # Initialize new pipeline (resets all events)
        run_id = initialize_pipeline()

        # Start timeout timer to automatically reset pipeline after 30 minutes
        cancel_pipeline_after_timeout(1800)

        data = request.get_json()
        if not data:
            PIPELINE_ACTIVE.clear()  # Reset pipeline active flag
            return jsonify({"error": "No data provided"}), 400

        # Store payload data
        payload_path = os.path.join(LOGS_DIR, f"payload_{run_id}.json")
        atomic_write_json(payload_path, data)

        # Set payload registered event
        PAYLOAD_REGISTERED.set()

        return jsonify({
            "status": "success",
            "message": "Payload registered successfully and pipeline initialized",
            "runId": run_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "next_step": "/baseline_calculation"
        }), 200
    except Exception as e:
        # Reset pipeline on error
        reset_execution_pipeline()
        return jsonify({
            "error": f"Error registering payload: {str(e)}",
            "status": "failed"
        }), 500
    # =====================================
# Baseline Calculation Endpoint
# =====================================
@app.route('/baseline_calculation', methods=['POST'], endpoint='baseline_calc_endpoint')
@with_file_lock(BASELINE_LOCK_FILE, "baseline calculation")
@with_memory_lock(GLOBAL_BASELINE_LOCK, "baseline calculation")
@with_pipeline_check(required_event=PAYLOAD_REGISTERED, next_event=BASELINE_COMPLETED, operation_name="baseline calculation")
def baseline_calculation():
    """Perform baseline calculation without sensitivity variations"""
    try:
        data = request.get_json()
        run_id = data.get('runId')

        # If no runtime data provided but runId is present, try to load from stored payload
        if run_id and (not data.get('selectedVersions') or not data.get('selectedCalculationOption')):
            payload_path = os.path.join(LOGS_DIR, f"payload_{run_id}.json")
            if os.path.exists(payload_path):
                stored_data = atomic_read_json(payload_path)
                if stored_data:
                    data.update(stored_data)

        # Extract configuration
        version = data.get('selectedVersions', [1])[0]
        selectedV = data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)})
        selectedF = data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)})
        calculation_option = data.get('selectedCalculationOption', 'freeFlowNPV')
        target_row = int(data.get('targetRow', 20))

        # Get calculation script
        calculation_script_func = CALCULATION_SCRIPTS.get(calculation_option)
        if not calculation_script_func:
            BASELINE_COMPLETED.clear()  # Reset baseline completion flag
            return jsonify({
                "error": f"No script found for calculation mode: {calculation_option}",
                "status": "error"
            }), 400

        calculation_script = calculation_script_func(version)

        # Execute configuration management scripts first
        for script in COMMON_PYTHON_SCRIPTS:
            script_name = os.path.basename(script)

            result = subprocess.run(
                ['python', script, str(version)],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                error_msg = f"Script execution failed: {script_name}\nError: {result.stderr}"
                BASELINE_COMPLETED.clear()  # Reset baseline completion flag
                return jsonify({
                    "error": error_msg,
                    "status": "error"
                }), 500

            time.sleep(0.5)  # Ensure proper sequencing

        # Run baseline calculation
        start_time = time.time()
        result = subprocess.run(
            [
                'python',
                calculation_script,
                str(version),
                json.dumps(selectedV),
                json.dumps(selectedF),
                str(target_row),
                calculation_option,
                '{}'  # Empty SenParameters for baseline
            ],
            capture_output=True,
            text=True
        )

        execution_time = time.time() - start_time

        if result.returncode != 0:
            error_msg = f"Baseline calculation failed: {result.stderr}"
            BASELINE_COMPLETED.clear()  # Reset baseline completion flag
            return jsonify({
                "error": error_msg,
                "status": "error"
            }), 500

        # Store calculation result
        result_path = os.path.join(LOGS_DIR, f"baseline_result_{run_id}.json")
        atomic_write_json(result_path, {
            "version": version,
            "calculationOption": calculation_option,
            "targetRow": target_row,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "executionTime": execution_time,
            "stdout": result.stdout,
            "returnCode": result.returncode
        })

        # BASELINE_COMPLETED event is set by the decorator

        return jsonify({
            "status": "success",
            "message": "Baseline calculation completed successfully",
            "runId": run_id,
            "version": version,
            "executionTime": f"{execution_time:.2f}s",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "next_step": "/sensitivity/configure"
        }), 200
    except Exception as e:
        # Don't clear event flag here - let the decorator handle it
        return jsonify({
            "error": f"Error during baseline calculation: {str(e)}",
            "status": "error"
        }), 500

# =====================================
# Sensitivity Configuration Endpoint
# =====================================
@app.route('/sensitivity/configure', methods=['POST'], endpoint='sensitivity_configure_endpoint')
@with_file_lock(CONFIG_LOCK_FILE, "sensitivity configuration")
@with_memory_lock(GLOBAL_CONFIG_LOCK, "sensitivity configuration")
@with_pipeline_check(required_event=BASELINE_COMPLETED, next_event=CONFIG_COMPLETED, operation_name="sensitivity configuration")
def configure_sensitivity():
    """Generate and save sensitivity configurations"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        run_id = data.get('runId')

        # If no runtime data provided but runId is present, try to load from stored payload
        if run_id and (not data.get('selectedVersions') or not data.get('SenParameters')):
            payload_path = os.path.join(LOGS_DIR, f"payload_{run_id}.json")
            if os.path.exists(payload_path):
                stored_data = atomic_read_json(payload_path)
                if stored_data:
                    data.update(stored_data)

        # Extract configuration
        config = {
            'versions': data.get('selectedVersions', [1]),
            'selectedV': data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)}),
            'selectedF': data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)}),
            'calculationOption': data.get('selectedCalculationOption', 'freeFlowNPV'),
            'targetRow': int(data.get('targetRow', 20)),
            'SenParameters': data.get('SenParameters', {})
        }

        version = config['versions'][0]

        # Create sensitivity directories with thread-safe function
        start_time = time.time()
        sensitivity_dir, config_dir = create_sensitivity_directories(version, config['SenParameters'])

        # Save configuration files with thread-safe function
        saved_files = save_sensitivity_config_files(version, config_dir, config['SenParameters'])

        # Save configuration status using atomic write
        atomic_write_json(SENSITIVITY_CONFIG_STATUS_PATH, {
            'configured': True,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'runId': run_id,
            'version': version,
            'configDir': config_dir,
            'sensitivityDir': sensitivity_dir
        })

        # Save configuration data using atomic write
        atomic_write_pickle(SENSITIVITY_CONFIG_DATA_PATH, config)

        # CONFIG_COMPLETED event is set by the decorator

        execution_time = time.time() - start_time

        return jsonify({
            "status": "success",
            "message": "Sensitivity configurations generated and saved successfully",
            "runId": run_id,
            "configDir": config_dir,
            "sensitivityDir": sensitivity_dir,
            "savedFiles": len(saved_files),
            "executionTime": f"{execution_time:.2f}s",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "next_step": "/runs"
        }), 200

    except Exception as e:
        # Don't clear event flag here - let the decorator handle it

        # Update configuration status to indicate failure using atomic write
        atomic_write_json(SENSITIVITY_CONFIG_STATUS_PATH, {
            'configured': False,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'runId': run_id if 'run_id' in locals() else time.strftime("%Y%m%d_%H%M%S"),
            'error': str(e)
        })

        return jsonify({
            "error": f"Error generating sensitivity configurations: {str(e)}",
            "status": "error"
        }), 500

# =====================================
# Run Calculations Endpoint
# =====================================
@app.route('/runs', methods=['POST'], endpoint='runs_endpoint')
@with_file_lock(RUN_LOCK_FILE, "calculation runs")
@with_memory_lock(GLOBAL_RUN_LOCK, "calculation runs")
@with_pipeline_check(required_event=CONFIG_COMPLETED, next_event=RUNS_COMPLETED, operation_name="calculation runs")
def run_calculations():
    """Execute sensitivity calculations based on configured parameters"""
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        data = request.get_json()
        provided_run_id = data.get('runId')
        if provided_run_id:
            run_id = provided_run_id

        # Check if sensitivity configurations have been generated using thread-safe function
        is_configured, saved_config = check_sensitivity_config_status()

        # If sensitivity configurations haven't been generated, return an error
        if not is_configured:
            return jsonify({
                "error": "Sensitivity configurations must be generated first",
                "message": "Please call /sensitivity/configure endpoint to generate and save sensitivity configurations before running calculations",
                "status": "error"
            }), 400

        # Use the saved configuration data if available, otherwise use the request data
        if saved_config:
            config = saved_config
        elif data:
            config = {
                'versions': data.get('selectedVersions', [1]),
                'selectedV': data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)}),
                'selectedF': data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)}),
                'calculationOption': data.get('selectedCalculationOption', 'freeFlowNPV'),
                'targetRow': int(data.get('targetRow', 20)),
                'SenParameters': data.get('SenParameters', {})
            }
        else:
            return jsonify({"error": "No configuration data available"}), 400

        # Get version and paths
        version = config['versions'][0]
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Verify that sensitivity directories exist
        if not os.path.exists(sensitivity_dir):
            error_msg = f"Sensitivity directory not found: {sensitivity_dir}"
            return jsonify({
                "error": error_msg,
                "message": "Please call /sensitivity/configure endpoint to generate and save sensitivity configurations",
                "status": "error"
            }), 400

        # Start timing
        start_time = time.time()

        # Step 1: Process config modules directly (integrated with the config copy operation)
        copy_service_result = trigger_config_module_copy(
            version,
            sensitivity_dir,
            config['SenParameters']
        )

        # Update configuration pickle file for subsequent steps
        try:
            # Save configuration data with explicit version using thread-safe function
            if isinstance(config['versions'], list) and version not in config['versions']:
                config['versions'].append(version)
            atomic_write_pickle(SENSITIVITY_CONFIG_DATA_PATH, config)
        except Exception:
            pass

        # Step 2: Process sensitivity parameters if enabled
        enabled_params = [k for k, v in config['SenParameters'].items() if v.get('enabled')]
        if enabled_params:
            try:
                process_script = os.path.join(
                    SCRIPT_DIR,
                    "API_endpoints_and_controllers",
                    "process_sensitivity_results.py"
                )

                if os.path.exists(process_script):
                    process_result = subprocess.run(
                        ['python', process_script, str(version), '0.5'],  # 30 second wait time
                        capture_output=True,
                        text=True
                    )

                    if process_result.returncode != 0:
                        # Try running with backup approach if the first attempt failed
                        for param_id, param_config in config['SenParameters'].items():
                            if not param_config.get('enabled'):
                                continue

                            # Get calculation script
                            calculation_script_func = CALCULATION_SCRIPTS.get(config['calculationOption'])
                            if not calculation_script_func:
                                continue

                            calculation_script = calculation_script_func(version)

                            # Run CFA on each modified configuration with thread-safe approach
                            param_lock = threading.Lock()
                            with param_lock:
                                mode = param_config.get('mode', 'symmetrical')
                                values = param_config.get('values', [])

                                if mode.lower() == 'symmetrical':
                                    base_variation = values[0]
                                    variations = [base_variation, -base_variation]
                                else:
                                    variations = values

                                for variation in variations:
                                    var_str = f"{variation:+.2f}"

                                    # Find modified config files
                                    mode_dir = 'symmetrical' if mode.lower() == 'symmetrical' else 'multiple'
                                    config_pattern = os.path.join(
                                        sensitivity_dir,
                                        param_id,
                                        mode_dir,
                                        var_str,
                                        f"{version}_config_module_*.json"
                                    )

                                    config_files = glob.glob(config_pattern)
                                    if config_files:
                                        for config_file in config_files:
                                            try:
                                                subprocess.run(
                                                    [
                                                        'python',
                                                        calculation_script,
                                                        str(version),
                                                        '-c', config_file,
                                                        '--sensitivity',
                                                        param_id,
                                                        str(variation),
                                                        param_config.get('compareToKey', 'S13')
                                                    ],
                                                    capture_output=True,
                                                    text=True,
                                                    timeout=300  # 5 minute timeout
                                                )
                                            except subprocess.TimeoutExpired:
                                                continue
            except Exception:
                pass

        # Calculate total execution time
        total_time = time.time() - start_time

        # RUNS_COMPLETED event is set by the decorator

        # Return success response with timing information
        return jsonify({
            "status": "success",
            "message": "Sensitivity calculations completed successfully",
            "runId": run_id,
            "version": version,
            "timing": {
                "total": f"{total_time:.2f}s",
                "parameters_processed": len(enabled_params)
            },
            "configCopy": copy_service_result,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "next_step": "Pipeline complete"
        }), 200

    except Exception as e:
        # Don't clear event flag here - let the decorator handle it
        return jsonify({
            "error": f"Error during sensitivity calculations: {str(e)}",
            "status": "error",
            "runId": run_id
        }), 500

# =====================================
# Calculate Sensitivity Endpoint
# =====================================
@app.route('/calculate-sensitivity', methods=['POST'])
@with_file_lock(RUN_LOCK_FILE, "sensitivity calculations")
@with_memory_lock(GLOBAL_RUN_LOCK, "sensitivity calculations")
def calculate_sensitivity():
    """
    Execute specific sensitivity calculations using CFA-b.py with paths from CalSen service.
    This endpoint runs after the general sensitivity configurations and runs have completed.
    It leverages the CalSen service for path resolution to ensure consistent file locations.
    """
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        # Check if sensitivity configurations have been generated using thread-safe function
        is_configured, saved_config = check_sensitivity_config_status()

        if not is_configured:
            return jsonify({
                "error": "Sensitivity configurations have not been generated yet",
                "message": "Please complete the /sensitivity/configure and /runs endpoints before calculating specific sensitivities",
                "nextStep": "Call /sensitivity/configure endpoint first"
            }), 400

        # Use the saved configuration data if available, otherwise use the request data
        data = request.get_json()
        if saved_config:
            config = saved_config
        elif data:
            config = {
                'versions': data.get('selectedVersions', [1]),
                'selectedV': data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)}),
                'selectedF': data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)}),
                'calculationOption': data.get('selectedCalculationOption', 'freeFlowNPV'),
                'targetRow': int(data.get('targetRow', 20)),
                'SenParameters': data.get('SenParameters', {})
            }
        else:
            return jsonify({"error": "No configuration data available"}), 400

        # Get version and base paths
        version = config['versions'][0]
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Get CFA-b.py script path
        cfa_b_script = get_sensitivity_calculation_script()

        # Process enabled sensitivity parameters
        enabled_params = [(param_id, param_config) for param_id, param_config
                          in config['SenParameters'].items() if param_config.get('enabled')]

        if not enabled_params:
            return jsonify({
                "status": "warning",
                "message": "No enabled sensitivity parameters found for calculation",
                "runId": run_id
            })

        # Results collection
        calculation_results = {}
        overall_success = True

        # Mode mapping for standardized directory names
        mode_dir_mapping = {
            'percentage': 'Percentage',
            'directvalue': 'DirectValue',
            'absolutedeparture': 'AbsoluteDeparture',
            'montecarlo': 'MonteCarlo'
        }

        # Process each parameter with thread-safe approach
        for param_id, param_config in enabled_params:
            mode = param_config.get('mode', 'percentage')
            values = param_config.get('values', [])
            compare_to_key = param_config.get('compareToKey', 'S13')

            if not values:
                continue

            # Determine variations based on mode
            variations = []
            for value in values:
                if value is not None:
                    try:
                        variations.append(float(value))
                    except (ValueError, TypeError):
                        pass

            if not variations:
                continue

            param_results = {"variations": {}, "success": True}

            # Process each variation with thread-safe approach
            param_lock = threading.Lock()
            with param_lock:
                for variation in variations:
                    var_str = f"{variation:+.2f}"

                    # Create mode directory if it doesn't exist
                    mode_dir = mode_dir_mapping.get(mode.lower(), 'Percentage')
                    mode_path = os.path.join(sensitivity_dir, mode_dir)
                    os.makedirs(mode_path, exist_ok=True)

                    # Create parameter directory if it doesn't exist
                    param_path = os.path.join(mode_path, param_id)
                    os.makedirs(param_path, exist_ok=True)

                    # Create variation directory if it doesn't exist
                    var_path = os.path.join(param_path, var_str)
                    os.makedirs(var_path, exist_ok=True)

                    # Run CFA-b.py for this variation
                    try:
                        # Use atomic operations for thread safety
                        with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json') as temp_file:
                            # Create a temporary config file for this run
                            temp_config = {
                                "version": version,
                                "param_id": param_id,
                                "variation": variation,
                                "compare_to_key": compare_to_key,
                                "mode": mode,
                                "output_dir": var_path
                            }
                            json.dump(temp_config, temp_file)
                            temp_file_path = temp_file.name

                        # Run the calculation script with the temporary config file
                        result = subprocess.run(
                            [sys.executable, cfa_b_script,
                             '--config', temp_file_path,
                             '--version', str(version),
                             '--param', param_id,
                             '--variation', str(variation),
                             '--compare', compare_to_key,
                             '--mode', mode],
                            capture_output=True,
                            text=True,
                            timeout=300  # 5 minute timeout
                        )

                        # Clean up the temporary file
                        try:
                            os.unlink(temp_file_path)
                        except:
                            pass

                        # Check if calculation was successful
                        if result.returncode == 0:
                            # Save results to a JSON file
                            results_file = os.path.join(
                                mode_path,
                                f"{param_id}_vs_{compare_to_key}_{mode.lower()}_results.json"
                            )

                            # Create or update results file
                            try:
                                if os.path.exists(results_file):
                                    with open(results_file, 'r') as f:
                                        existing_results = json.load(f)

                                    # Update existing results
                                    if 'variations' in existing_results:
                                        existing_results['variations'][var_str] = {
                                            'value': variation,
                                            'success': True
                                        }
                                    else:
                                        existing_results['variations'] = {
                                            var_str: {
                                                'value': variation,
                                                'success': True
                                            }
                                        }

                                    # Write updated results
                                    with open(results_file, 'w') as f:
                                        json.dump(existing_results, f, indent=2)
                                else:
                                    # Create new results file
                                    new_results = {
                                        'param_id': param_id,
                                        'compare_to_key': compare_to_key,
                                        'mode': mode,
                                        'variations': {
                                            var_str: {
                                                'value': variation,
                                                'success': True
                                            }
                                        }
                                    }
                                    with open(results_file, 'w') as f:
                                        json.dump(new_results, f, indent=2)
                            except Exception as e:
                                # Log error but continue processing
                                print(f"Error saving results for {param_id} variation {var_str}: {str(e)}")

                            # Update param_results
                            param_results['variations'][var_str] = {
                                'value': variation,
                                'success': True
                            }
                        else:
                            # Update param_results with error
                            param_results['variations'][var_str] = {
                                'value': variation,
                                'success': False,
                                'error': result.stderr
                            }
                            param_results['success'] = False
                            overall_success = False

                    except subprocess.TimeoutExpired:
                        # Update param_results with timeout error
                        param_results['variations'][var_str] = {
                            'value': variation,
                            'success': False,
                            'error': 'Calculation timed out after 5 minutes'
                        }
                        param_results['success'] = False
                        overall_success = False

                    except Exception as e:
                        # Update param_results with general error
                        param_results['variations'][var_str] = {
                            'value': variation,
                            'success': False,
                            'error': str(e)
                        }
                        param_results['success'] = False
                        overall_success = False

            # Add param_results to calculation_results
            calculation_results[param_id] = param_results

        # Return results
        return jsonify({
            "status": "success" if overall_success else "partial_success",
            "message": "Sensitivity calculations completed",
            "runId": run_id,
            "results": calculation_results
        })

    except Exception as e:
        return jsonify({
            "error": f"Error during sensitivity calculations: {str(e)}",
            "runId": run_id
        }), 500

# =====================================
# Sensitivity Visualization Endpoint
# =====================================
@app.route('/api/sensitivity/visualize', methods=['POST'])
@with_file_lock(VISUALIZATION_LOCK_FILE, "sensitivity visualization")
@with_memory_lock(GLOBAL_VISUALIZE_LOCK, "sensitivity visualization")
def sensitivity_visualize():
    """
    Generate visualization data for sensitivity analysis.

    Expected JSON payload:
    {
        "version": 1,
        "param_id": "S10",
        "mode": "percentage",
        "compareToKey": "S13",
        "plotTypes": ["waterfall", "bar", "point"]
    }
    """
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Extract parameters
        version = data.get('version', 1)
        param_id = data.get('param_id')
        mode = data.get('mode', 'percentage')
        compare_to_key = data.get('compareToKey', 'S13')
        plot_types = data.get('plotTypes', ['waterfall', 'bar', 'point'])

        if not param_id:
            return jsonify({"error": "Parameter ID is required"}), 400

        # Get sensitivity data using thread-safe approach
        sensitivity_data = get_sensitivity_data(version, param_id, mode, compare_to_key)
        if not sensitivity_data:
            error_msg = f"No data available for {param_id} in {mode} mode"
            return jsonify({
                "error": "Sensitivity data not found",
                "message": error_msg
            }), 404

        # Check if plots exist or need to be generated
        plots_info = {}
        mode_dir_mapping = {
            'percentage': 'Percentage',
            'directvalue': 'DirectValue',
            'absolutedeparture': 'AbsoluteDeparture',
            'montecarlo': 'MonteCarlo'
        }
        mode_dir = mode_dir_mapping.get(mode.lower(), 'Percentage')

        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        sensitivity_dir = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity',
            mode_dir
        )

        for plot_type in plot_types:
            plot_name = f"{plot_type}_{param_id}_{compare_to_key}_primary.png"
            plot_path = os.path.join(sensitivity_dir, plot_type, plot_name)

            if os.path.exists(plot_path):
                plots_info[plot_type] = {
                    "status": "available",
                    "path": os.path.relpath(plot_path, base_dir)
                }
            else:
                # Create plot directory if it doesn't exist
                plot_dir = os.path.join(sensitivity_dir, plot_type)
                os.makedirs(plot_dir, exist_ok=True)

                try:
                    # Generate plot using thread-safe approach
                    with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json') as temp_file:
                        # Create a temporary config file for plot generation
                        temp_config = {
                            "version": version,
                            "param_id": param_id,
                            "compare_to_key": compare_to_key,
                            "plot_type": plot_type,
                            "mode": mode,
                            "output_dir": plot_dir
                        }
                        json.dump(temp_config, temp_file)
                        temp_file_path = temp_file.name

                    # Run plot generation script
                    plot_script = os.path.join(SCRIPT_DIR, "API_endpoints_and_controllers", "generate_sensitivity_plot.py")
                    if os.path.exists(plot_script):
                        result = subprocess.run(
                            [sys.executable, plot_script,
                             '--config', temp_file_path],
                            capture_output=True,
                            text=True,
                            timeout=60  # 1 minute timeout
                        )

                        # Clean up the temporary file
                        try:
                            os.unlink(temp_file_path)
                        except:
                            pass

                        # Check if plot generation was successful
                        if result.returncode == 0 and os.path.exists(plot_path):
                            plots_info[plot_type] = {
                                "status": "generated",
                                "path": os.path.relpath(plot_path, base_dir)
                            }
                        else:
                            plots_info[plot_type] = {
                                "status": "error",
                                "message": f"Failed to generate {plot_type} plot: {result.stderr}"
                            }
                    else:
                        plots_info[plot_type] = {
                            "status": "error",
                            "message": "Plot generation script not found"
                        }
                except Exception as e:
                    plots_info[plot_type] = {
                        "status": "error",
                        "message": f"Error generating {plot_type} plot: {str(e)}"
                    }

        # Prepare visualization data
        visualization_data = {
            "status": "success",
            "param_id": param_id,
            "compare_to_key": compare_to_key,
            "mode": mode,
            "data": sensitivity_data,
            "plots": plots_info,
            "runId": run_id
        }

        return jsonify(visualization_data)

    except Exception as e:
        return jsonify({
            "error": f"Error generating visualization: {str(e)}"
        }), 500

# =====================================
# Get Sensitivity Parameters Endpoint
# =====================================
@app.route('/api/sensitivity/parameters', methods=['GET'])
def get_sensitivity_parameters():
    """Get all available sensitivity parameters for visualization."""
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        version = request.args.get('version', '1')

        # Try to get parameters from CalSen service first
        try:
            response = requests.post(
                "http://localhost:2750/list_parameters",
                json={"version": int(version)},
                timeout=5
            )

            if response.status_code == 200:
                return jsonify(response.json())
        except Exception:
            # Continue with fallback
            pass

        # Fallback: scan directories with thread-safe approach
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        sensitivity_dir = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity'
        )

        if not os.path.exists(sensitivity_dir):
            error_msg = f"No sensitivity data found for version {version}"
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 404

        # Look for parameter directories (starting with S)
        parameters = []

        # Use a lock for thread safety when scanning directories
        scan_lock = threading.Lock()
        with scan_lock:
            for item in os.listdir(sensitivity_dir):
                item_path = os.path.join(sensitivity_dir, item)

                if os.path.isdir(item_path) and item.startswith('S'):
                    param_id = item

                    # Find mode directories inside parameter directory
                    modes = []
                    for subdir in os.listdir(item_path):
                        subdir_path = os.path.join(item_path, subdir)
                        if os.path.isdir(subdir_path):
                            modes.append(subdir)

                    # Add parameter info
                    parameters.append({
                        "id": param_id,
                        "modes": modes
                    })

        return jsonify({
            "status": "success",
            "version": version,
            "parameters": parameters,
            "source": "directory"
        })

    except Exception as e:
        return jsonify({
            "error": f"Error retrieving sensitivity parameters: {str(e)}"
        }), 500

# =====================================
# Run All Sensitivity Endpoint
# =====================================
@app.route('/run-all-sensitivity', methods=['POST'])
def run_all_sensitivity():
    """
    Unified wrapper to execute all sensitivity endpoints sequentially.
    Meant to replicate frontend's full analysis process with a single call.
    """
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "Missing input payload"}), 400

        headers = {'Content-Type': 'application/json'}
        version = payload.get('selectedVersions', [1])[0]
        base_url = 'http://127.0.0.1:2500'

        enabled_params = payload.get('enabledParams', [])

        def post(path, body=None):
            r = requests.post(f"{base_url}{path}", headers=headers, json=body or payload)
            return r.json()

        def get(path):
            r = requests.get(f"{base_url}{path}")
            return r.json()

        # Execute the full pipeline in sequence
        result = {
            "configure": post('/sensitivity/configure'),
            "runs": post('/runs')
        }

        # If specific parameters are enabled, run calculations for each
        if enabled_params:
            param_results = {}
            for param_id in enabled_params:
                param_payload = {
                    "version": version,
                    "param_id": param_id,
                    "SenParameters": {
                        param_id: {"enabled": True}
                    }
                }
                param_results[param_id] = post('/calculate-sensitivity', param_payload)
            result["calculate_sensitivity"] = param_results

        # Check if calsen_paths.json exists
        result["check_calsen_paths"] = get(f'/check-calsen-paths?version={version}')

        # Run script_econ.py
        if result["check_calsen_paths"].get("exists", False):
            result["run_script_econ"] = post('/run-script-econ', {"version": version})

        return jsonify({
            "status": "success",
            "message": "All sensitivity routes triggered via unified endpoint.",
            "results": result
        })

    except Exception as e:
        return jsonify({
            "error": f"Error executing unified sensitivity runner: {str(e)}"
        }), 500

# =====================================
# Check CalSen Paths Endpoint
# =====================================
@app.route('/check-calsen-paths', methods=['GET'])
def check_calsen_paths():
    """
    Check if calsen_paths.json exists for the specified version.
    """
    version = request.args.get('version', '1')

    # Calculate path to calsen_paths.json
    base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
    sensitivity_dir = os.path.join(base_dir, f'Batch({version})', f'Results({version})', 'Sensitivity')
    reports_dir = os.path.join(sensitivity_dir, 'Reports')
    calsen_paths_file = os.path.join(reports_dir, 'calsen_paths.json')

    # Check if file exists with thread-safe approach
    file_check_lock = threading.Lock()
    with file_check_lock:
        file_exists = os.path.exists(calsen_paths_file)

    # Include payload details for monitoring
    payload_details = {
        "operation": "check_calsen_paths",
        "version": version,
        "path": calsen_paths_file,
        "exists": file_exists
    }

    return jsonify({
        'exists': file_exists,
        'path': calsen_paths_file
    })

# =====================================
# Run Script Econ Endpoint
# =====================================
@app.route('/run-script-econ', methods=['POST'])
def run_script_econ():
    """
    Extract metrics from Economic Summary CSV files and append them to calsen_paths.json
    using the incorporated extract_metrics_to_json function.
    """
    data = request.get_json()
    version = data.get('version', '1')

    try:
        # Call the incorporated extract_metrics_to_json function
        logger.info(f"Extracting metrics for version {version}")
        result = extract_metrics_to_json(version)

        if result['status'] == 'success':
            return jsonify({
                'status': 'success',
                'message': result['message'],
                'metrics_processed': result['metrics_processed']
            })
        else:
            return jsonify({
                'status': 'error',
                'message': result['message'],
                'errors': result['errors']
            }), 500
    except Exception as e:
        logger.error(f"Error extracting metrics: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error extracting metrics: {str(e)}'
        }), 500

# =====================================
# Run Add Axis Labels Endpoint
# =====================================
@app.route('/run-add-axis-labels', methods=['POST'])
def run_add_axis_labels():
    """
    Execute add_axis_labels.py to add axis labels to sensitivity plots.
    """
    data = request.get_json()
    version = data.get('version', '1')
    param_id = data.get('param_id')
    compare_to_key = data.get('compareToKey', 'S13')

    if not param_id:
        return jsonify({"error": "Parameter ID is required"}), 400

    try:
        # Get path to add_axis_labels.py
        script_path = os.path.join(BASE_DIR, 'backend', 'API_endpoints_and_controllers', 'add_axis_labels.py')

        # Execute add_axis_labels.py with the arguments
        result = run_script(
            script_path,
            '--version', version,
            '--param', param_id,
            '--compare', compare_to_key,
            script_type="python"
        )

        return jsonify({
            'status': 'success',
            'message': 'add_axis_labels.py executed successfully',
            'stdout': result.get('stdout', ''),
            'stderr': result.get('stderr', '')
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error executing add_axis_labels.py: {str(e)}'
        }), 500

# =====================================
# Run Generate Plots Endpoint
# =====================================
@app.route('/run-generate-plots', methods=['POST'])
def run_generate_plots():
    """
    Generate sensitivity plots using the incorporated generate_plots function.
    """
    data = request.get_json()
    version = data.get('version', '1')
    param_id = data.get('param_id')
    compare_to_key = data.get('compareToKey', 'S13')
    plot_type = data.get('plotType', 'waterfall')

    if not param_id:
        return jsonify({"error": "Parameter ID is required"}), 400

    try:
        # Call the incorporated generate_plots function
        logger.info(f"Generating plots for version {version}, parameter {param_id}, comparison key {compare_to_key}, plot type {plot_type}")
        result = generate_plots(version)

        if result:
            return jsonify({
                'status': 'success',
                'message': 'Plots generated successfully',
                'version': version,
                'param_id': param_id,
                'compare_to_key': compare_to_key,
                'plot_type': plot_type
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to generate plots'
            }), 500
    except Exception as e:
        logger.error(f"Error generating plots: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error generating plots: {str(e)}'
        }), 500

# =====================================
# HTML Album Organizer Endpoint
# =====================================
@app.route('/run-html-album-organizer', methods=['POST'])
def run_html_album_organizer():
    """
    Organize HTML plot files into standardized album directories using the incorporated organize_html_albums function.
    """
    data = request.get_json()
    version = data.get('version')

    try:
        # Convert version to list of integers if provided
        specified_versions = None
        if version:
            if isinstance(version, list):
                specified_versions = [int(v) for v in version]
            else:
                specified_versions = [int(version)]

        # Call the incorporated organize_html_albums function
        logger.info(f"Organizing HTML albums for versions: {specified_versions}")
        result = organize_html_albums(specified_versions=specified_versions)

        if result:
            return jsonify({
                'status': 'success',
                'message': 'HTML albums organized successfully',
                'versions': specified_versions
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to organize HTML albums'
            }), 500
    except Exception as e:
        logger.error(f"Error organizing HTML albums: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error organizing HTML albums: {str(e)}'
        }), 500

# =====================================
# Album Organizer Endpoint
# =====================================
@app.route('/run-album-organizer', methods=['POST'])
def run_album_organizer():
    """
    Organize PNG plots into standardized album directories using the incorporated organize_plot_albums function.
    """
    try:
        # Call the incorporated organize_plot_albums function
        logger.info("Organizing PNG plot albums")
        result = organize_plot_albums()

        if result:
            return jsonify({
                'status': 'success',
                'message': 'PNG plot albums organized successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to organize PNG plot albums'
            }), 500
    except Exception as e:
        logger.error(f"Error organizing PNG plot albums: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error organizing PNG plot albums: {str(e)}'
        }), 500

# =====================================
# Script Econ Functions
# =====================================
def extract_metrics_to_json(version):
    """
    Extract metrics from Economic Summary CSV files based on selection vector
    and append them to calsen_paths.json.

    Args:
        version (str): Version number

    Returns:
        dict: Status information
    """
    # Define metric selection vector - 1 means select, 0 means ignore
    metrics_selection = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  # Define your selection vector here

    # Define metrics list for reference
    metrics_list = [
        'Internal Rate of Return',
        'Average Selling Price (Project Life Cycle)',
        'Total Overnight Cost (TOC)',
        'Average Annual Revenue',
        'Average Annual Operating Expenses',
        'Average Annual Depreciation',
        'Average Annual State Taxes',
        'Average Annual Federal Taxes',
        'Average Annual After-Tax Cash Flow',
        'Cumulative NPV',
        'Calculation Mode'
    ]

    # Calculate code_files_path based on the script's location
    code_files_path = ORIGINAL_BASE_DIR

    # Load calsen_paths.json
    sensitivity_dir = os.path.join(
        code_files_path,
        f"Batch({version})",
        f"Results({version})",
        "Sensitivity"
    )
    reports_dir = os.path.join(sensitivity_dir, "Reports")
    calsen_paths_file = os.path.join(reports_dir, "calsen_paths.json")

    result = {
        'status': 'success',
        'message': f'Successfully updated {calsen_paths_file}',
        'metrics_processed': 0,
        'errors': []
    }

    try:
        with open(calsen_paths_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        error_msg = f"Error: Could not find {calsen_paths_file}"
        logger.error(error_msg)
        result['status'] = 'error'
        result['message'] = error_msg
        result['errors'].append(error_msg)
        return result
    except json.JSONDecodeError:
        error_msg = f"Error: Could not parse {calsen_paths_file} as JSON"
        logger.error(error_msg)
        result['status'] = 'error'
        result['message'] = error_msg
        result['errors'].append(error_msg)
        return result

    # Process each key in path_sets
    for s_param, param_data in data["path_sets"].items():
        mode_dir_name = param_data["mode"]

        # Process each variation
        for var_str, var_data in param_data["variations"].items():
            # Construct path to the Economic Summary CSV file
            economic_summary_file = os.path.join(
                code_files_path,
                f"Batch({version})",
                f"Results({version})",
                "Sensitivity",
                s_param,
                mode_dir_name,
                "Configuration",
                f"{s_param}_{var_str}",
                f"Economic_Summary({version}).csv"
            )

            # Check if file exists
            if not os.path.exists(economic_summary_file):
                warning_msg = f"Warning: File not found: {economic_summary_file}"
                logger.warning(warning_msg)
                continue

            # Read the CSV file
            try:
                with open(economic_summary_file, 'r', newline='') as csvfile:
                    reader = csv.reader(csvfile)
                    rows = list(reader)

                    # Extract selected metrics based on the selection vector
                    selected_metrics = {}
                    for i, selected in enumerate(metrics_selection):
                        if selected == 1 and i < len(rows):
                            if len(rows[i]) >= 2:  # Ensure row has at least two columns
                                metric_name = rows[i][0]
                                metric_value = rows[i][1]
                                selected_metrics[metric_name] = metric_value

                    # Add selected metrics to the JSON
                    if selected_metrics:
                        var_data["metrics"] = selected_metrics
                        result['metrics_processed'] += 1

            except Exception as e:
                error_msg = f"Error processing {economic_summary_file}: {str(e)}"
                logger.error(error_msg)
                result['errors'].append(error_msg)

    # Save the updated JSON
    try:
        with open(calsen_paths_file, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Successfully updated {calsen_paths_file}")
    except Exception as e:
        error_msg = f"Error saving {calsen_paths_file}: {str(e)}"
        logger.error(error_msg)
        result['status'] = 'error'
        result['message'] = error_msg
        result['errors'].append(error_msg)

    return result

# =====================================
# Process Sensitivity Results Endpoint
# =====================================
@app.route('/run-process-sensitivity-results', methods=['POST'])
def run_process_sensitivity_results():
    """
    Process sensitivity results using the incorporated process_sensitivity_results function.
    """
    data = request.get_json()
    version = data.get('version', '1')
    wait_time_minutes = data.get('wait_time_minutes', 0.5)  # Default to 30 seconds

    try:
        # Call the incorporated process_sensitivity_results function
        logger.info(f"Processing sensitivity results for version {version} with wait time {wait_time_minutes} minutes")
        result = process_sensitivity_results(int(version), float(wait_time_minutes))

        if result.get('status') == 'success':
            return jsonify({
                'status': 'success',
                'message': 'Sensitivity results processed successfully',
                'version': version,
                'parameters_processed': result.get('parameters_processed', 0),
                'variations_processed': result.get('variations_processed', 0)
            })
        else:
            return jsonify({
                'status': 'error',
                'message': result.get('error', 'Failed to process sensitivity results')
            }), 500
    except Exception as e:
        logger.error(f"Error processing sensitivity results: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error processing sensitivity results: {str(e)}'
        }), 500

# =====================================
# Pipeline Reset Endpoint
# =====================================
@app.route('/reset_pipeline', methods=['POST'])
def reset_pipeline():
    """Reset the execution pipeline and clear all event flags"""
    reset_execution_pipeline()
    return jsonify({
        "status": "success",
        "message": "Pipeline reset successfully",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

# =====================================
# Health Check Endpoint
# =====================================
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint that's always accessible"""
    # Check if the CalSen service (2750) is running
    calsen_service_status = "unavailable"
    try:
        response = requests.get("http://localhost:2750/health", timeout=2)
        if response.ok:
            calsen_service_status = "available"
    except requests.exceptions.RequestException:
        pass

    return jsonify({
        "status": "ok",
        "server": "sensitivity-analysis-server-with-pipeline-control",
        "version": "2.0.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "pipeline": {
            "active": PIPELINE_ACTIVE.is_set(),
            "payload_registered": PAYLOAD_REGISTERED.is_set(),
            "baseline_completed": BASELINE_COMPLETED.is_set(),
            "config_completed": CONFIG_COMPLETED.is_set(),
            "runs_completed": RUNS_COMPLETED.is_set()
        },
        "services": {
            "calsen_service": calsen_service_status
        }
    })

# =====================================
# Application Entry Point
# =====================================
if __name__ == '__main__':
    # Ensure all lock files are cleaned up on startup
    for lock_file in [CONFIG_LOCK_FILE, RUN_LOCK_FILE, VISUALIZATION_LOCK_FILE,
                      PAYLOAD_LOCK_FILE, BASELINE_LOCK_FILE]:
        if os.path.exists(lock_file):
            try:
                os.remove(lock_file)
            except:
                pass

    # Initialize event flags
    reset_execution_pipeline()

    app.run(debug=True, host='127.0.0.1', port=2500)
