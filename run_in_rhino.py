"""
Rhino Python Script Launcher

This script demonstrates how to run test_entity_analyzer.py in Rhino.
It should be executed from within Rhino's Python editor.

Instructions:
1. Open Rhino
2. Type 'EditPythonScript' in the command line
3. Copy and paste this script into the editor
4. Modify the file_path variable to point to your test_entity_analyzer.py file
5. Run the script

Note: This is a helper script and requires Rhino to be installed.
"""

import os
import sys

# This script is designed to be run inside Rhino's Python environment
# If you're seeing import errors, that's expected when running outside of Rhino
# These imports will only work when run within Rhino
try:
    import Rhino
    import scriptcontext as sc
    RUNNING_IN_RHINO = True
except ImportError:
    RUNNING_IN_RHINO = False
    print("=" * 80)
    print("WARNING: This script must be run from within Rhino's Python environment.")
    print("The import errors are expected when running outside of Rhino.")
    print("=" * 80)
    print("\nTo run this script properly:")
    print("1. Open Rhino")
    print("2. Type 'EditPythonScript' in the command line")
    print("3. Copy and paste this script into the editor")
    print("4. Run the script from there\n")

def main():
    if not RUNNING_IN_RHINO:
        print("Cannot execute main() - not running in Rhino environment")
        return

    # Get the path to the test_entity_analyzer.py file
    # Replace this with the actual path to your file if needed
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_entity_analyzer.py")

    print("Attempting to run: " + file_path)

    # Check if the file exists
    if not os.path.exists(file_path):
        print("Error: File not found at " + file_path)
        print("Please update the file_path variable in this script.")
        return

    print("File found. Executing...")

    # Read the file content
    with open(file_path, 'r') as f:
        script_content = f.read()

    # Create a namespace for execution
    namespace = {}

    try:
        # Execute the script
        exec(script_content, namespace)

        # Call the main function if it exists
        if 'main' in namespace:
            namespace['main']()
            print("Script executed successfully!")
        else:
            print("Warning: No 'main' function found in the script.")

    except Exception as e:
        print("Error executing script: " + str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Only attempt to run if we're in Rhino
    if RUNNING_IN_RHINO:
        main()
    else:
        # Message already displayed during import
        pass
