"""
Rhino Module Installation Helper

This script helps users install the necessary packages to work with Rhino in Python.
It provides guidance on how to properly set up the environment for Rhino Python scripting.
"""

import sys
import subprocess
import os
import platform

def print_header():
    print("=" * 70)
    print("RHINO MODULE INSTALLATION HELPER".center(70))
    print("=" * 70)
    print()

def print_section(title):
    print("\n" + "-" * 70)
    print(title)
    print("-" * 70)

def check_python_version():
    print_section("Checking Python Version")
    print(f"Python version: {platform.python_version()}")
    print(f"Python executable: {sys.executable}")
    print(f"Platform: {platform.platform()}")
    
    if platform.python_implementation() == "IronPython":
        print("\n✓ You are running IronPython, which is compatible with Rhino.")
    else:
        print("\n⚠ You are running standard Python (CPython), not IronPython.")
        print("   Rhino modules (rhinoscriptsyntax, scriptcontext, Rhino) are only")
        print("   available in Rhino's IronPython environment.")

def install_rhino3dm():
    print_section("Installing rhino3dm Package")
    print("The rhino3dm package provides Python bindings for Rhino3DM.")
    print("This is NOT the same as the full Rhino modules, but provides some")
    print("limited functionality for working with Rhino files in standard Python.")
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "rhino3dm"])
        print("\n✓ Successfully installed rhino3dm package.")
    except subprocess.CalledProcessError:
        print("\n✗ Failed to install rhino3dm package.")
        print("  Please try running: pip install rhino3dm")

def explain_rhino_modules():
    print_section("Understanding Rhino Python Modules")
    print("The modules you're trying to import:")
    print("  - rhinoscriptsyntax")
    print("  - scriptcontext")
    print("  - Rhino")
    print("\nThese are NOT standard Python packages and CANNOT be installed via pip.")
    print("They are part of the Rhino3D software installation and are only available")
    print("within Rhino's built-in Python environment (IronPython).")
    
    print("\nTo use these modules, you must:")
    print("1. Install Rhino3D software from https://www.rhino3d.com/")
    print("2. Run your scripts within Rhino's Python environment")

def provide_solution():
    print_section("Solution Options")
    
    print("Option 1: Run Your Scripts in Rhino (Recommended)")
    print("------------------------------------------------")
    print("1. Open Rhino")
    print("2. Type 'EditPythonScript' in the command line")
    print("3. Open your Python script in the editor")
    print("4. Run the script")
    print("\nThis is the ONLY way to use the full rhinoscriptsyntax, scriptcontext, and Rhino modules.")
    
    print("\nOption 2: Use rhino3dm in Standard Python (Limited Functionality)")
    print("---------------------------------------------------------------")
    print("The rhino3dm package provides some functionality for working with Rhino files,")
    print("but it is NOT a replacement for the full Rhino modules.")
    print("\nExample usage:")
    print("```python")
    print("import rhino3dm")
    print("")
    print("# Create a sphere")
    print("sphere = rhino3dm.Sphere([0, 0, 0], 5)")
    print("# Convert to a brep (boundary representation)")
    print("brep = sphere.ToBrep()")
    print("```")
    
    print("\nOption 3: Use Compute Rhino3D (Web API)")
    print("-------------------------------------")
    print("For more advanced functionality in standard Python, you can use")
    print("the Rhino Compute web API service.")
    print("See: https://developer.rhino3d.com/guides/compute/")

def check_for_test_file():
    print_section("Checking for test_entity_analyzer.py")
    
    test_file = "test_entity_analyzer.py"
    if os.path.exists(test_file):
        print(f"✓ Found {test_file} in the current directory.")
        print("\nThis file uses Rhino-specific modules and can only be run within Rhino.")
        print("Please follow Option 1 in the Solution Options section to run this file.")
    else:
        print(f"✗ Could not find {test_file} in the current directory.")
        print("If you have a Rhino Python script, please follow the solution options above.")

def main():
    print_header()
    
    print("This script will help you understand why you're seeing the error:")
    print("'no module find rhino' or 'ModuleNotFoundError: No module named rhinoscriptsyntax'")
    print("\nLet's diagnose the issue and provide solutions...")
    
    check_python_version()
    explain_rhino_modules()
    install_rhino3dm()
    check_for_test_file()
    provide_solution()
    
    print("\n" + "=" * 70)
    print("SUMMARY".center(70))
    print("=" * 70)
    print("1. Rhino modules (rhinoscriptsyntax, scriptcontext, Rhino) are ONLY available")
    print("   within Rhino's built-in Python environment.")
    print("2. We've installed rhino3dm which provides limited functionality in standard Python.")
    print("3. For full functionality, you must run your scripts within Rhino.")
    print("\nPlease refer to the README_RHINO_PYTHON.md file for more detailed instructions.")
    print("=" * 70)

if __name__ == "__main__":
    main()