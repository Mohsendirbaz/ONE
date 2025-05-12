import os
import shutil
from pathlib import Path

# Define the directory to clean
directory_to_clean = os.path.join(os.getcwd(), "116")

# Define the allowed extensions
allowed_extensions = ['.js', '.css', '.py', '.md', '.json']

# Function to check if a file should be kept
def should_keep_file(file_path):
    # Get the file extension
    _, extension = os.path.splitext(file_path)
    # Check if the extension is in the allowed list
    return extension.lower() in allowed_extensions

# List to store files that will be removed
files_to_remove = []

# Walk through the directory
for root, dirs, files in os.walk(directory_to_clean):
    for file in files:
        file_path = os.path.join(root, file)
        if not should_keep_file(file_path):
            files_to_remove.append(file_path)

# Print summary before removing
print(f"Found {len(files_to_remove)} files to remove.")
print("Files to be removed:")
for file in files_to_remove:
    print(f"  - {file}")

# Remove the files
for file in files_to_remove:
    try:
        os.remove(file)
        print(f"Removed: {file}")
    except Exception as e:
        print(f"Error removing {file}: {e}")
print("Cleanup completed.")
