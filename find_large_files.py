import os
import sys
from pathlib import Path
from collections import defaultdict
import json

def get_file_size(file_path):
    """Get the size of a file in bytes."""
    return os.path.getsize(file_path)

def get_file_line_count(file_path):
    """Get the number of lines in a file."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return sum(1 for _ in f)
    except Exception as e:
        print(f"Error counting lines in {file_path}: {e}")
        return 0

def should_skip_directory(dir_path):
    """Check if a directory should be skipped."""
    skip_dirs = ['.git', 'node_modules', '__pycache__', '.idea', '116', '.pytest_cache']
    return any(skip_dir in str(dir_path) for skip_dir in skip_dirs)

def find_large_files(root_dir, min_size_kb=100, min_lines=500, top_n=50):
    """
    Find large files in the project.
    
    Args:
        root_dir (str): Root directory to start the search
        min_size_kb (int): Minimum file size in KB to consider
        min_lines (int): Minimum number of lines to consider
        top_n (int): Number of top files to return
        
    Returns:
        list: List of tuples (file_path, size_kb, line_count)
    """
    large_files_by_size = []
    large_files_by_lines = []
    
    # File extension statistics
    extension_stats = defaultdict(lambda: {'count': 0, 'total_size': 0, 'total_lines': 0})
    
    root_path = Path(root_dir)
    
    for root, dirs, files in os.walk(root_dir):
        # Skip directories that should be ignored
        dirs[:] = [d for d in dirs if not should_skip_directory(os.path.join(root, d))]
        
        for file in files:
            file_path = os.path.join(root, file)
            
            # Skip binary files and certain extensions
            _, ext = os.path.splitext(file)
            if ext.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot']:
                continue
                
            try:
                size_bytes = get_file_size(file_path)
                size_kb = size_bytes / 1024
                
                # Update extension statistics
                extension_stats[ext.lower()]['count'] += 1
                extension_stats[ext.lower()]['total_size'] += size_bytes
                
                # Check if file meets minimum size criteria
                if size_kb >= min_size_kb:
                    line_count = get_file_line_count(file_path)
                    extension_stats[ext.lower()]['total_lines'] += line_count
                    
                    # Store file info if it meets criteria
                    if line_count >= min_lines:
                        large_files_by_size.append((file_path, size_kb, line_count))
                        large_files_by_lines.append((file_path, size_kb, line_count))
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
    
    # Sort files by size and lines
    large_files_by_size.sort(key=lambda x: x[1], reverse=True)
    large_files_by_lines.sort(key=lambda x: x[2], reverse=True)
    
    # Prepare results
    result = {
        "top_files_by_size": [
            {
                "path": f,
                "size_kb": round(s, 2),
                "line_count": l,
                "relative_path": os.path.relpath(f, root_dir)
            }
            for f, s, l in large_files_by_size[:top_n]
        ],
        "top_files_by_lines": [
            {
                "path": f,
                "size_kb": round(s, 2),
                "line_count": l,
                "relative_path": os.path.relpath(f, root_dir)
            }
            for f, s, l in large_files_by_lines[:top_n]
        ],
        "extension_stats": [
            {
                "extension": ext,
                "file_count": stats['count'],
                "total_size_mb": round(stats['total_size'] / (1024 * 1024), 2),
                "total_lines": stats['total_lines'],
                "avg_size_kb": round(stats['total_size'] / (stats['count'] * 1024), 2) if stats['count'] > 0 else 0,
                "avg_lines": round(stats['total_lines'] / stats['count'], 2) if stats['count'] > 0 else 0
            }
            for ext, stats in sorted(extension_stats.items(), key=lambda x: x[1]['total_size'], reverse=True)
        ]
    }
    
    return result

def main():
    # Get the root directory of the project
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Scanning for large files in {root_dir}...")
    
    # Find large files
    result = find_large_files(root_dir)
    
    # Print results
    print("\n=== Top Files by Size ===")
    for i, file_info in enumerate(result["top_files_by_size"][:20], 1):
        print(f"{i}. {file_info['relative_path']} - {file_info['size_kb']:.2f} KB, {file_info['line_count']} lines")
    
    print("\n=== Top Files by Line Count ===")
    for i, file_info in enumerate(result["top_files_by_lines"][:20], 1):
        print(f"{i}. {file_info['relative_path']} - {file_info['line_count']} lines, {file_info['size_kb']:.2f} KB")
    
    print("\n=== File Extension Statistics ===")
    for ext_info in result["extension_stats"][:10]:
        print(f"{ext_info['extension']}: {ext_info['file_count']} files, {ext_info['total_size_mb']:.2f} MB, {ext_info['total_lines']} lines")
    
    # Save detailed results to a JSON file
    output_file = os.path.join(root_dir, "large_files_analysis.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)
    
    print(f"\nDetailed analysis saved to {output_file}")

if __name__ == "__main__":
    main()