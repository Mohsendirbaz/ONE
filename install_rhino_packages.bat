@echo off
echo ===================================================
echo Rhino Python Packages Installation Script
echo ===================================================
echo.
echo This script will install packages for external Python use.
echo Note: For full functionality, use Rhino's built-in Python.
echo.
echo Attempting to install rhinocommon package...
echo Note: This package may not be available via pip and might require Rhino installation.
pip install rhinocommon >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Could not install rhinocommon package via pip.
    echo This is expected as rhinocommon is typically part of the Rhino installation.
    echo For full Rhino functionality, please install Rhino3D software.
) else (
    echo Successfully installed rhinocommon package.
)

echo.
echo Installing rhino3dm package...
pip install rhino3dm

echo.
echo ===================================================
echo Installation complete!
echo.
echo IMPORTANT: These packages provide limited functionality.
echo For full functionality, please:
echo 1. Install Rhino3D software from https://www.rhino3d.com/
echo 2. Run your scripts within Rhino's Python environment
echo.
echo See README_RHINO_PYTHON.md for detailed instructions.
echo ===================================================
echo.
pause
