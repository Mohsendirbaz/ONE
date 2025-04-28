@echo off
echo Attempting to remove the SF directory...
rd /s /q SF
if exist SF (
    echo Failed to remove the SF directory. It may be locked by another process.
    echo Please try running this batch file again later.
) else (
    echo SF directory successfully removed.
)
pause