"""
Sensitivity File Manager Module

This module contains the SensitivityFileManager class for managing
the storage and retrieval of sensitivity analysis files.
"""

import os
import json
import logging
import filelock
import pickle
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Any, Optional, Union

class SensitivityFileManager:
    """
    Manages the storage and retrieval of sensitivity analysis files.
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

                self.logger.info(f"Stored calculation result for {param_id} in {paths['results_file']}")

                return {
                    "status": "success",
                    "message": f"Results stored for {param_id}",
                    "file_path": paths['results_file'],
                    "param_id": param_id,
                    "version": version
                }

        except Exception as e:
            self.logger.error(f"Error storing calculation result: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to store results: {str(e)}",
                "param_id": param_id,
                "version": version
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
            dict: Result data or error info
        """
        try:
            # Get paths
            paths = self._get_paths_for_parameter(
                version, param_id, mode, compare_to_key
            )

            # Check if results file exists
            if not os.path.exists(paths['results_file']):
                self.logger.warning(f"Results file not found: {paths['results_file']}")
                return {
                    "status": "error",
                    "message": "Results file not found",
                    "file_path": paths['results_file'],
                    "param_id": param_id,
                    "version": version
                }

            # Set atomic file lock for thread safety
            lock_file = f"{paths['results_file']}.lock"
            lock = filelock.FileLock(lock_file, timeout=60)

            with lock:
                # Read results data from file
                with open(paths['results_file'], 'r') as f:
                    result_data = json.load(f)

                self.logger.info(f"Retrieved calculation result for {param_id} from {paths['results_file']}")

                return {
                    "status": "success",
                    "message": f"Results retrieved for {param_id}",
                    "file_path": paths['results_file'],
                    "param_id": param_id,
                    "version": version,
                    "data": result_data
                }

        except Exception as e:
            self.logger.error(f"Error retrieving calculation result: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to retrieve results: {str(e)}",
                "param_id": param_id,
                "version": version
            }

    def store_datapoints(self, version, datapoints_data):
        """
        Store sensitivity datapoints for plotting.

        Args:
            version (int): Version number
            datapoints_data (dict): Datapoints data structure

        Returns:
            dict: Storage status information
        """
        try:
            # Get paths
            paths = self._get_paths_for_parameter(version, "datapoints")

            # Set atomic file lock for thread safety
            lock_file = f"{paths['datapoints_file']}.lock"
            lock = filelock.FileLock(lock_file, timeout=60)

            with lock:
                # Ensure directory exists
                os.makedirs(os.path.dirname(paths['datapoints_file']), exist_ok=True)

                # Write datapoints to file
                with open(paths['datapoints_file'], 'w') as f:
                    json.dump(datapoints_data, f, indent=2)

                self.logger.info(f"Stored datapoints for version {version} in {paths['datapoints_file']}")

                return {
                    "status": "success",
                    "message": f"Datapoints stored for version {version}",
                    "file_path": paths['datapoints_file'],
                    "version": version
                }

        except Exception as e:
            self.logger.error(f"Error storing datapoints: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to store datapoints: {str(e)}",
                "version": version
            }