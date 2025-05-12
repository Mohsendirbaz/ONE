# Rhino Python Scripting Setup Guide

## Overview

This guide provides instructions for setting up your environment to run Rhino Python scripts that use the following modules:
- `rhinoscriptsyntax`
- `scriptcontext`
- `Rhino`

These modules are not standard Python packages available on PyPI and cannot be installed using `pip install`. They are part of the Rhino3D software installation.

## Installation Options

### Option 1: Use Rhino's Built-in Python (Recommended)

1. **Install Rhino3D software**
   - Download and install Rhino from [rhino3d.com](https://www.rhino3d.com/)
   - This includes IronPython and all necessary Rhino Python modules

2. **Run your scripts within Rhino**
   - Open Rhino
   - Type `EditPythonScript` in the command line
   - Open your Python script in the editor
   - Run the script

### Option 2: Use External Python (Limited Functionality)

If you need to work with Rhino files outside of Rhino's environment:

1. **Note about rhinocommon**
   - The rhinocommon package is part of the Rhino installation
   - It is not directly available via pip
   - For full rhinocommon functionality, you must use Rhino's built-in Python environment

2. **Install rhino3dm package** (Python bindings for Rhino3DM)
   ```
   pip install rhino3dm
   ```

3. **Note on Limitations**
   - The rhino3dm package provides limited functionality compared to running within Rhino
   - It allows basic operations with Rhino geometry but does not provide the full Rhino API
   - Some features may not work as expected
   - For full functionality, use Option 1

## Troubleshooting

If you encounter errors like:
```
ERROR: No matching distribution found for scriptcontext
```

This is because you're trying to install packages that are not available on PyPI. Follow the installation options above instead.

## Running test_entity_analyzer.py

The `test_entity_analyzer.py` script in this repository is designed to be run within Rhino's Python environment. To run it:

1. Open Rhino
2. Type `EditPythonScript` in the command line
3. Open the `test_entity_analyzer.py` file
4. Click the "Run" button

## Additional Resources

- [Rhino Python Documentation](https://developer.rhino3d.com/guides/rhinopython/)
- [Rhino Python API Reference](https://developer.rhino3d.com/api/RhinoScriptSyntax/)
- [Rhino Developer Tools](https://www.rhino3d.com/developer/)
