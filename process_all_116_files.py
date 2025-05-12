import os
import sys
from pathlib import Path
from process_116_files import process_file

def process_directory(directory_path):
    """Process all files in the specified directory and its subdirectories."""
    directory_path = Path(directory_path)
    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    # Walk through the directory and its subdirectories
    for root, dirs, files in os.walk(directory_path):
        for file in files:
            file_path = Path(root) / file
            
            # Skip directories to avoid
            skip_dirs = ['.git', 'node_modules', '__pycache__', 'venv', 'dist', 'build']
            if any(skip_dir in str(file_path) for skip_dir in skip_dirs):
                skipped_count += 1
                continue
            
            print(f"\nProcessing: {file_path}")
            try:
                success = process_file(file_path)
                if success:
                    processed_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
                error_count += 1
    
    # Print summary
    print("\n" + "="*80)
    print("PROCESSING COMPLETE")
    print("="*80)
    print(f"Files processed: {processed_count}")
    print(f"Files skipped: {skipped_count}")
    print(f"Errors encountered: {error_count}")
    print("="*80)

def main():
    """Main function."""
    try:
        # Use command line argument for directory path if provided
        if len(sys.argv) > 1:
            directory_path = Path(sys.argv[1])
        else:
            directory_path = Path("116")
        
        if not directory_path.exists() or not directory_path.is_dir():
            print(f"Directory not found: {directory_path}")
            return 1
        
        # Process the directory
        process_directory(directory_path)
    
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())