# PowerShell script to remove the SF directory
try {
    # Try to remove the directory using .NET methods
    [System.IO.Directory]::Delete("$PWD\SF", $true)
    Write-Host "SF directory removed successfully using .NET methods."
} catch {
    Write-Host "Error removing directory using .NET methods: $_"
    
    try {
        # Try using robocopy to empty the directory first
        Write-Host "Attempting to empty the directory using robocopy..."
        $emptyDir = "$PWD\empty_dir"
        
        # Create an empty directory
        if (-not (Test-Path $emptyDir)) {
            New-Item -ItemType Directory -Path $emptyDir | Out-Null
        }
        
        # Use robocopy to mirror the empty directory to SF, effectively deleting all contents
        robocopy $emptyDir "$PWD\SF" /MIR /NFL /NDL /NJH /NJS /NC /NS /MT:16
        
        # Remove the empty directory
        Remove-Item $emptyDir -Force -Recurse -ErrorAction SilentlyContinue
        
        # Now try to remove the SF directory again
        Remove-Item "$PWD\SF" -Force -Recurse -ErrorAction Stop
        Write-Host "SF directory removed successfully after using robocopy."
    } catch {
        Write-Host "Error removing directory after robocopy: $_"
        
        # As a last resort, try to rename the directory
        try {
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $newName = "SF_to_delete_$timestamp"
            Rename-Item -Path "$PWD\SF" -NewName $newName -ErrorAction Stop
            Write-Host "SF directory renamed to $newName. Please delete it manually when possible."
        } catch {
            Write-Host "Error renaming directory: $_"
            Write-Host "Failed to remove or rename the SF directory. It may be locked by another process."
            Write-Host "Please close any applications that might be using files in the SF directory and try again."
            exit 1
        }
    }
}

Write-Host "Operation completed."