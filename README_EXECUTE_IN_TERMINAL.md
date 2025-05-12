# Executing Rhino Python Scripts in Terminal

This guide provides instructions for executing the Rhino Python setup and installation scripts from the terminal.

## Available Scripts

1. **run_rhino_setup.bat**
   - Interactive setup script with menu options
   - Easiest way to get started

2. **install_rhino_packages.bat**
   - Direct installation of external Rhino Python packages
   - Non-interactive script

3. **execute_rhino_setup.ps1**
   - PowerShell script with interactive menu
   - More advanced options and detailed instructions

## Terminal Execution Instructions

### Using Command Prompt (CMD)

1. Open Command Prompt
   - Press `Win + R`, type `cmd`, and press Enter

2. Navigate to the project directory
   ```
   cd path\to\project\directory
   ```

3. Run the batch file
   ```
   run_rhino_setup.bat
   ```

   Or to run the installation script directly:
   ```
   install_rhino_packages.bat
   ```

### Using PowerShell

1. Open PowerShell
   - Press `Win + X` and select "Windows PowerShell" or "PowerShell"

2. Navigate to the project directory
   ```
   cd path\to\project\directory
   ```

3. Run the PowerShell script
   ```
   .\execute_rhino_setup.ps1
   ```

   If you encounter execution policy restrictions, use:
   ```
   powershell -ExecutionPolicy Bypass -File .\execute_rhino_setup.ps1
   ```

   Or run the batch file:
   ```
   .\run_rhino_setup.bat
   ```

## Running test_entity_analyzer.py

The `test_entity_analyzer.py` script requires Rhino's Python environment to run properly. It cannot be executed directly from the terminal.

### Method 1: Direct Execution in Rhino

1. Install Rhino3D software from [rhino3d.com](https://www.rhino3d.com/)
2. Open Rhino
3. Type `EditPythonScript` in the command line
4. Open the `test_entity_analyzer.py` file
5. Click the "Run" button

### Method 2: Using the Helper Script

We've provided a helper script `run_in_rhino.py` that demonstrates how to programmatically run the test_entity_analyzer.py script:

1. Open Rhino
2. Type `EditPythonScript` in the command line
3. Open the `run_in_rhino.py` file (or copy its contents into the editor)
4. Run the script

The helper script will:
- Locate the test_entity_analyzer.py file
- Load and execute it within Rhino's environment
- Provide feedback on the execution process

**Note:** If you try to run `run_in_rhino.py` outside of Rhino (e.g., in a regular terminal), it will display instructions on how to run it properly in Rhino.

## Troubleshooting

If you encounter issues running the scripts:

1. **Execution Policy Errors in PowerShell**
   - Use the `-ExecutionPolicy Bypass` parameter as shown above
   - Or temporarily change the execution policy:
     ```
     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
     ```

2. **Package Installation Errors**
   - Ensure you have Python installed and added to your PATH
   - Try running with administrator privileges
   - Check your internet connection

3. **Script Not Found Errors**
   - Make sure you're in the correct directory
   - Use the full path to the script if necessary

For more detailed information, refer to the `README_RHINO_PYTHON.md` file.
