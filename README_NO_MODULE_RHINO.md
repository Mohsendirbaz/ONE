# Resolving "No Module Named Rhino" Error

## Issue Description

If you're seeing errors like:
- `ModuleNotFoundError: No module named 'rhinoscriptsyntax'`
- `ModuleNotFoundError: No module named 'scriptcontext'`
- `ModuleNotFoundError: No module named 'Rhino'`
- `no module find rhino`

This guide will help you understand why these errors occur and how to resolve them.

## Understanding the Issue

The Rhino Python modules (`rhinoscriptsyntax`, `scriptcontext`, and `Rhino`) are **not standard Python packages** that can be installed via pip. They are part of the Rhino3D software installation and are only available within Rhino's built-in Python environment (IronPython).

When you try to run a Rhino Python script (like `test_entity_analyzer.py`) in a regular Python environment, you'll get these "module not found" errors because these modules are not available in standard Python.

## Solution Files

We've created several files to help you resolve this issue:

1. **install_rhino_module.py** - A Python script that:
   - Explains why the error occurs
   - Installs the `rhino3dm` package (which provides limited functionality)
   - Provides detailed solution options

2. **install_rhino_module.bat** - A Windows batch file that runs the Python script

3. **README_RHINO_PYTHON.md** - Comprehensive guide for setting up Rhino Python scripting

4. **run_rhino_setup.bat** - Interactive setup script with menu options

## Quick Start

### Option 1: Run the Installation Helper

1. Double-click on `install_rhino_module.bat` in Windows Explorer

   OR

2. Open a command prompt and run:
   ```
   install_rhino_module.bat
   ```

   Or in PowerShell:
   ```
   .\install_rhino_module.bat
   ```

This will:
- Explain why the error occurs
- Install the `rhino3dm` package (which provides limited functionality)
- Provide detailed solution options

### Option 2: Use the Interactive Setup Script

1. Double-click on `run_rhino_setup.bat` in Windows Explorer

   OR

2. Open a command prompt and run:
   ```
   run_rhino_setup.bat
   ```

   Or in PowerShell:
   ```
   .\run_rhino_setup.bat
   ```

This will provide an interactive menu with options for:
- Installing external Rhino Python packages
- Viewing installation instructions
- Getting instructions for running test_entity_analyzer.py

## Solution Options

### Option 1: Run Your Scripts in Rhino (Recommended)

This is the **only way** to use the full `rhinoscriptsyntax`, `scriptcontext`, and `Rhino` modules:

1. Install Rhino3D software from [rhino3d.com](https://www.rhino3d.com/)
2. Open Rhino
3. Type `EditPythonScript` in the command line
4. Open your Python script in the editor
5. Run the script

### Option 2: Use rhino3dm in Standard Python (Limited Functionality)

The `rhino3dm` package provides some functionality for working with Rhino files, but it is **not** a replacement for the full Rhino modules:

```python
import rhino3dm

# Create a sphere
sphere = rhino3dm.Sphere([0, 0, 0], 5)
# Convert to a brep (boundary representation)
brep = sphere.ToBrep()
```

### Option 3: Use Compute Rhino3D (Web API)

For more advanced functionality in standard Python, you can use the Rhino Compute web API service:
[https://developer.rhino3d.com/guides/compute/](https://developer.rhino3d.com/guides/compute/)

## Additional Resources

For more detailed information, please refer to:

- **README_RHINO_PYTHON.md** - Comprehensive guide for Rhino Python setup
- **README_EXECUTE_IN_TERMINAL.md** - Specific instructions for executing scripts in the terminal
- **RHINO_PYTHON_SOLUTION.md** - Overview of the complete solution

## Summary

1. Rhino modules (`rhinoscriptsyntax`, `scriptcontext`, `Rhino`) are **only available** within Rhino's built-in Python environment.
2. You cannot install these modules via pip.
3. For full functionality, you must run your scripts within Rhino.
4. The `rhino3dm` package provides limited functionality in standard Python.