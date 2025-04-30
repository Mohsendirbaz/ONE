import os
import re
import sys

def extract_timestamp(filename):
    """
    Extract the full timestamp (format: YYYYMMDD_HHMMSS) from the filename.
    This is the same logic used in the fixed code.
    """
    timestamp_parts = filename.split('_')
    if len(timestamp_parts) >= 3:  # Ensure we have enough parts
        # Get the date and time parts (last two parts before .json)
        date_part = timestamp_parts[-2]
        time_part = timestamp_parts[-1].split('.')[0]
        timestamp = f"{date_part}_{time_part}"
    else:
        # Fallback - extract using regex
        match = re.search(r'(\d{8}_\d{6})', filename)
        if match:
            timestamp = match.group(1)
        else:
            # Last resort fallback
            timestamp = filename.split('_')[-1].split('.')[0]
    
    return timestamp

def main():
    """
    Test the timestamp extraction logic with various filename formats.
    """
    # Test cases
    test_filenames = [
        "file_associations_summary_20250429_145322.json",
        "direct_imports_20250429_145322.json",
        "common_ports_20250429_145322.json",
        "file_associations_20250429_145322.json",
        # Add some edge cases
        "summary_145322.json",
        "file_with_no_timestamp.json",
        "file_with_date_20250429.json"
    ]
    
    print("Testing timestamp extraction logic:")
    print("-" * 50)
    
    for filename in test_filenames:
        # Original extraction logic (the one with the issue)
        original_timestamp = filename.split('_')[-1].split('.')[0]
        
        # New extraction logic
        new_timestamp = extract_timestamp(filename)
        
        print(f"Filename: {filename}")
        print(f"  Original extraction: {original_timestamp}")
        print(f"  New extraction: {new_timestamp}")
        print("-" * 50)
    
    # Check if the output directory exists and list files
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "file_associations", "output")
    if os.path.exists(output_dir):
        print("\nExisting output files:")
        for file in os.listdir(output_dir):
            if file.endswith(".json"):
                print(f"  - {file}")
                # Test the extraction on actual files
                timestamp = extract_timestamp(file)
                print(f"    Extracted timestamp: {timestamp}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())