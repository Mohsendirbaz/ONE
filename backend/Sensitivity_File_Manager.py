"""
Sensitivity File Manager

This module re-exports the SensitivityFileManager class from Calculations_and_Sensitivity-LL.py
to maintain backward compatibility with modules that import it from here.
"""
import sys
import os
import importlib.util
from typing import Any, Dict, List, Optional, Union, BinaryIO, TextIO, IO

# Path to the Calculations_and_Sensitivity-LL.py file
module_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "API_endpoints_and_controllers",
    "Calculations_and_Sensitivity-LL.py"
)

# Load the module using importlib
spec = importlib.util.spec_from_file_location("calculations_and_sensitivity_ll", module_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

# Get the SensitivityFileManager class from the module
SensitivityFileManager = module.SensitivityFileManager

# Re-export the class
__all__ = ['SensitivityFileManager']
