import os
import json
from datetime import datetime

def count_lines(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            return sum(1 for _ in file)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return 0

def find_large_files(directory, min_lines=500):
    large_files = []

    for root, _, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            line_count = count_lines(file_path)

            if line_count > min_lines:
                large_files.append((file_path, line_count))

    return large_files

def save_results_to_json(large_files, output_file):
    results = {
        "scan_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_files": len(large_files),
        "files": []
    }

    for file_path, line_count in large_files:
        rel_path = os.path.relpath(file_path, os.getcwd())
        results["files"].append({
            "path": rel_path,
            "line_count": line_count
        })

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    print(f"Results saved to {output_file}")

if __name__ == "__main__":
    src_directory = os.path.join(os.getcwd(), "src")
    output_file = "src_large_files_analysis.json"

    if not os.path.exists(src_directory):
        print(f"Error: {src_directory} does not exist")
        exit(1)

    print(f"Scanning {src_directory} for files with more than 500 lines...")
    large_files = find_large_files(src_directory)

    if not large_files:
        print("No files found with more than 500 lines.")
    else:
        print(f"\nFound {len(large_files)} files with more than 500 lines:\n")

        # Sort by line count in descending order
        large_files.sort(key=lambda x: x[1], reverse=True)

        for file_path, line_count in large_files:
            rel_path = os.path.relpath(file_path, os.getcwd())
            print(f"{rel_path}: {line_count} lines")

        # Save results to JSON file
        save_results_to_json(large_files, output_file)
