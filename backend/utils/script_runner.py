"""
Script Runner Module

This module contains utility functions for running scripts.
"""

import os
import json
import tempfile
import subprocess
import threading
import logging
import shutil
import filelock
from typing import Tuple, List, Dict, Any, Optional

# Set up logging
logger = logging.getLogger('script_runner')

def run_script(script_name, *args, script_type="python") -> Tuple[bool, Optional[str]]:
    """
    Thread-safe script execution with proper error handling
    
    Args:
        script_name (str): Path to the script to run
        *args: Arguments to pass to the script
        script_type (str): Type of script ('python' or 'Rscript')
        
    Returns:
        Tuple[bool, Optional[str]]: (success, error_message)
    """
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
            shutil.rmtree(temp_dir)
        except:
            pass

def process_version(version, calculation_script, selected_v, selected_f, target_row,
                    calculation_option, sen_parameters, common_scripts=None):
    """
    Thread-safe version processing with proper locking
    
    Args:
        version (str): Version number
        calculation_script (str): Path to the calculation script
        selected_v (dict): Selected V parameters
        selected_f (dict): Selected F parameters
        target_row (dict): Target row
        calculation_option (str): Calculation option
        sen_parameters (dict): Sensitivity parameters
        common_scripts (List[str], optional): List of common scripts to run
        
    Returns:
        Optional[str]: Error message if any, None if successful
    """
    # Create a unique lock for this version
    version_lock = threading.RLock()

    with version_lock:
        try:
            # Run common configuration scripts
            if common_scripts:
                for script in common_scripts:
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
                json.dumps(sen_parameters)
            )
            if not success:
                return error

            return None
        except Exception as e:
            return f"Error processing version {version}: {str(e)}"

def create_sensitivity_directories(version, sen_parameters, base_dir):
    """
    Thread-safe directory creation with proper locking
    
    Args:
        version (str): Version number
        sen_parameters (dict): Sensitivity parameters
        base_dir (str): Base directory
        
    Returns:
        Tuple[str, str]: (sensitivity_dir, reports_dir)
    """
    # Create a lock specific to this version and operation
    logs_dir = os.path.join(base_dir, 'Logs')
    os.makedirs(logs_dir, exist_ok=True)
    
    dir_lock_file = os.path.join(logs_dir, f"dir_creation_{version}.lock")
    lock = filelock.FileLock(dir_lock_file, timeout=60)

    with lock:
        # Define base paths
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
        enabled_params = [(param_id, config) for param_id, config in sen_parameters.items()
                          if config.get('enabled')]

        for param_id, param_config in enabled_params:
            # Skip disabled parameters
            if not param_config.get('enabled'):
                continue

            # Get parameter details
            mode = param_config.get('mode', 'symmetrical')
            
            # Create parameter directory
            param_dir = os.path.join(sensitivity_dir, param_id)
            os.makedirs(param_dir, exist_ok=True)
            
            # Create mode directory
            mode_dir = os.path.join(param_dir, mode.lower())
            os.makedirs(mode_dir, exist_ok=True)

        return sensitivity_dir, reports_dir