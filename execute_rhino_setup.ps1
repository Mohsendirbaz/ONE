# Execute Rhino Python Setup
# This PowerShell script helps users set up and run Rhino Python scripts

Write-Host "====================================================="
Write-Host "Rhino Python Setup and Execution Script" -ForegroundColor Green
Write-Host "====================================================="
Write-Host ""

# Function to display menu options
function Show-Menu {
    Write-Host "Please select an option:" -ForegroundColor Cyan
    Write-Host "1. Install external Rhino Python packages"
    Write-Host "2. View installation instructions"
    Write-Host "3. Instructions for running test_entity_analyzer.py in Rhino"
    Write-Host "4. Exit"
    Write-Host ""
}

# Function to install packages
function Install-Packages {
    Write-Host "Installing external Rhino Python packages..." -ForegroundColor Yellow
    Write-Host "(Note: These provide limited functionality compared to using Rhino's built-in Python)" -ForegroundColor Yellow
    Write-Host ""

    # Try to install rhinocommon package (note: may not be available via pip)
    Write-Host "Attempting to install rhinocommon package..." -ForegroundColor Cyan
    Write-Host "(Note: This package may not be available via pip and might require Rhino installation)" -ForegroundColor Yellow
    try {
        pip install rhinocommon 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully installed rhinocommon package." -ForegroundColor Green
        } else {
            Write-Host "Could not install rhinocommon package via pip." -ForegroundColor Yellow
            Write-Host "This is expected as rhinocommon is typically part of the Rhino installation." -ForegroundColor Yellow
            Write-Host "For full Rhino functionality, please install Rhino3D software." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Could not install rhinocommon package via pip." -ForegroundColor Yellow
        Write-Host "This is expected as rhinocommon is typically part of the Rhino installation." -ForegroundColor Yellow
        Write-Host "For full Rhino functionality, please install Rhino3D software." -ForegroundColor Yellow
    }

    # Install rhino3dm package
    Write-Host ""
    Write-Host "Installing rhino3dm package..." -ForegroundColor Cyan
    pip install rhino3dm

    Write-Host ""
    Write-Host "Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: For full functionality, please use Rhino's built-in Python environment." -ForegroundColor Yellow
    Write-Host "See option 2 for detailed instructions." -ForegroundColor Yellow
    Write-Host ""
    pause
}

# Function to display installation instructions
function Show-Instructions {
    Write-Host "====================================================="
    Write-Host "Rhino Python Installation Instructions" -ForegroundColor Green
    Write-Host "====================================================="
    Write-Host ""
    Write-Host "Option 1: Use Rhino's Built-in Python (Recommended)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Install Rhino3D software from https://www.rhino3d.com/"
    Write-Host "2. Open Rhino"
    Write-Host "3. Type 'EditPythonScript' in the command line"
    Write-Host "4. Open your Python script in the editor"
    Write-Host "5. Run the script"
    Write-Host ""
    Write-Host "Option 2: Use External Python Packages (Limited Functionality)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Run option 1 from this script's menu to install external packages"
    Write-Host "2. Note that some functionality may be limited"
    Write-Host ""
    Write-Host "For more detailed instructions, please refer to README_RHINO_PYTHON.md"
    Write-Host ""
    pause
}

# Function to show instructions for running test_entity_analyzer.py
function Show-RunInstructions {
    Write-Host "====================================================="
    Write-Host "Instructions for Running test_entity_analyzer.py" -ForegroundColor Green
    Write-Host "====================================================="
    Write-Host ""
    Write-Host "The test_entity_analyzer.py script is designed to be run within Rhino's Python environment." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps to run the script:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Install Rhino3D software from https://www.rhino3d.com/ (if not already installed)"
    Write-Host "2. Open Rhino"
    Write-Host "3. Type 'EditPythonScript' in the command line"
    Write-Host "4. In the Python editor that opens, click File > Open"
    Write-Host "5. Navigate to and open: $((Get-Location).Path)\test_entity_analyzer.py"
    Write-Host "6. Click the 'Run' button in the editor"
    Write-Host ""
    Write-Host "The script will create a 3D model with various layers and objects,"
    Write-Host "and save it to C:\Temp\TNTC.3dm"
    Write-Host ""
    pause
}

# Main menu loop
do {
    Clear-Host
    Show-Menu
    $choice = Read-Host "Enter your choice (1-4)"

    switch ($choice) {
        "1" { Install-Packages }
        "2" { Show-Instructions }
        "3" { Show-RunInstructions }
        "4" { 
            Write-Host "Exiting script. Goodbye!" -ForegroundColor Green
            exit 
        }
        default { 
            Write-Host "Invalid option. Please try again." -ForegroundColor Red
            pause
        }
    }
} while ($true)
