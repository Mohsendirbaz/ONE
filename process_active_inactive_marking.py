from replace_with_commentary import CommentaryGenerator
from pathlib import Path
import os

# Directory to process
directory_to_process = Path("Active-Inactive-Marking")

# Get all files in the directory
files_to_process = list(directory_to_process.glob("*.js"))

print(f"Found {len(files_to_process)} files to process in {directory_to_process}")

# Process each file
for file_path in files_to_process:
    print(f"Processing {file_path}...")
    
    # Generate commentary
    generator = CommentaryGenerator(file_path)
    commentary = generator.generate()
    
    # Create target path
    target_path = Path("116") / directory_to_process / (file_path.stem + "116" + file_path.suffix)
    
    # Ensure target directory exists
    os.makedirs(target_path.parent, exist_ok=True)
    
    # Write to target file
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(commentary)
    
    print(f"Generated commentary for {file_path} and saved to {target_path}")

print("All files processed successfully!")