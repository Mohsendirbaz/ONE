import os
import sys
from pathlib import Path
from replace_with_commentary import CommentaryGenerator

def process_file(file_path):
    """Process a single file in the 116 directory."""
    try:
        # Get the original file path by removing "116" from the filename
        file_name = file_path.name
        original_name = file_name.replace("116", "")

        # Construct the path to the original file
        relative_path = file_path.relative_to(Path("116"))
        original_dir = Path(os.path.dirname(relative_path))
        original_path = original_dir / original_name

        print(f"File name: {file_name}")
        print(f"Original name: {original_name}")
        print(f"Relative path: {relative_path}")
        print(f"Original directory: {original_dir}")
        print(f"Original path: {original_path}")

        # Check if the original file exists
        if not original_path.exists():
            print(f"Original file not found: {original_path}")
            # Try to find the file in the root directory
            root_path = Path(".") / original_name
            print(f"Trying root path: {root_path}")
            if root_path.exists():
                original_path = root_path
                print(f"Found original file at: {original_path}")
            else:
                return False

        # Generate commentary for the original file
        print(f"Generating commentary for: {original_path}")
        generator = CommentaryGenerator(original_path)
        commentary = generator.generate()

        # Write the commentary to the 116 file
        print(f"Writing commentary to: {file_path}")
        print(f"Commentary length: {len(commentary)}")
        print(f"First 100 characters of commentary: {commentary[:100]}")

        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(commentary)

            # Verify the file was written correctly
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                print(f"File content length after writing: {len(content)}")
                print(f"First 100 characters of file content: {content[:100]}")

            print(f"Processed: {file_path}")
        except Exception as e:
            print(f"Error writing to file: {e}")
            return False
        return True

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function."""
    try:
        # Get the file path from command line argument
        if len(sys.argv) > 1:
            file_path = Path(sys.argv[1])
            if not file_path.exists():
                print(f"File not found: {file_path}")
                return 1

            # Process the file
            success = process_file(file_path)
            if success:
                print(f"Successfully processed {file_path}")
            else:
                print(f"Failed to process {file_path}")
        else:
            print("Please provide a file path as an argument.")
            return 1

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
