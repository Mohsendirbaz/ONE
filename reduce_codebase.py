import os
import sys
import shutil
from pathlib import Path

def ensure_directory_exists(directory):
    """Ensure that a directory exists."""
    os.makedirs(directory, exist_ok=True)

def reduce_file_content(content, reduction_ratio=16):
    """
    Reduce the content of a file to approximately 1/reduction_ratio of its original size
    while maintaining its essence.

    Args:
        content (str): The content of the file
        reduction_ratio (int): The reduction ratio (default: 16)

    Returns:
        str: The reduced content
    """
    lines = content.splitlines()
    total_lines = len(lines)

    # If file is very small, keep at least a few lines
    if total_lines <= reduction_ratio:
        return content

    # Calculate how many lines to keep
    lines_to_keep = max(total_lines // reduction_ratio, 1)

    # Always keep the first few lines (imports, etc.)
    header_lines = min(total_lines // 4, 10)

    # Select lines to keep
    if total_lines <= header_lines + lines_to_keep:
        # File is small enough to keep most of it
        return content

    # Keep header lines + evenly distributed lines from the rest of the file
    kept_lines = lines[:header_lines]

    # Select remaining lines evenly distributed throughout the file
    remaining_lines = lines[header_lines:]

    # Check if we need to select any more lines
    if lines_to_keep > header_lines:
        # Calculate step size, avoiding division by zero
        step = len(remaining_lines) // max(lines_to_keep - header_lines, 1)
        if step > 0:
            for i in range(0, len(remaining_lines), step):
                if len(kept_lines) < lines_to_keep:
                    kept_lines.append(remaining_lines[i])

    # Add a comment indicating this is a reduced version
    kept_lines.insert(0, f"# This is a reduced version (1/16th) of the original file")

    return "\n".join(kept_lines)

def process_file(src_path, dest_path):
    """
    Process a single file: read its content, reduce it, and save to destination.

    Args:
        src_path (Path): Source file path
        dest_path (Path): Destination file path
    """
    try:
        # Read the file content
        with open(src_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Reduce the content
        reduced_content = reduce_file_content(content)

        # Write the reduced content to the destination file
        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(reduced_content)

        print(f"Processed: {src_path} -> {dest_path}")
    except Exception as e:
        print(f"Error processing {src_path}: {e}")

def should_skip_directory(dir_path):
    """
    Check if a directory should be skipped.

    Args:
        dir_path (Path): Directory path

    Returns:
        bool: True if the directory should be skipped, False otherwise
    """
    skip_dirs = ['.git', 'node_modules', '__pycache__', '.idea', '116']
    return dir_path.name in skip_dirs

def process_directory(src_dir, dest_dir):
    """
    Process all files in a directory recursively.

    Args:
        src_dir (Path): Source directory
        dest_dir (Path): Destination directory
    """
    # Create the destination directory if it doesn't exist
    ensure_directory_exists(dest_dir)

    # Process all files and subdirectories
    for item in src_dir.iterdir():
        if item.is_dir():
            if should_skip_directory(item):
                print(f"Skipping directory: {item}")
                continue

            # Process subdirectory
            process_directory(item, dest_dir / item.name)
        else:
            # Process file
            dest_path = dest_dir / f"{item.stem}116{item.suffix}"
            process_file(item, dest_path)

def main():
    # Get the root directory of the project
    root_dir = Path(os.path.dirname(os.path.abspath(__file__)))

    # Create the destination directory
    dest_dir = root_dir / "116"
    ensure_directory_exists(dest_dir)

    # Process the entire project
    print(f"Starting to process the project at {root_dir}")
    print(f"Reduced files will be saved to {dest_dir}")

    # Process all files and directories in the root directory
    for item in root_dir.iterdir():
        if item.is_dir():
            if should_skip_directory(item):
                print(f"Skipping directory: {item}")
                continue

            # Process directory
            process_directory(item, dest_dir / item.name)
        else:
            # Process file
            dest_path = dest_dir / f"{item.stem}116{item.suffix}"
            process_file(item, dest_path)

    print("Done! All files have been processed.")

if __name__ == "__main__":
    main()
