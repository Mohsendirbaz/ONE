import os
import datetime
from pathlib import Path
import time

def get_file_creation_date(file_path):
    """Get the creation date of a file."""
    # On Windows, creation time is available directly
    creation_time = os.path.getctime(file_path)
    return datetime.datetime.fromtimestamp(creation_time).date()

def count_lines_in_file(file_path):
    """Count the number of lines in a file."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return sum(1 for _ in f)
    except Exception as e:
        print(f"Error counting lines in {file_path}: {e}")
        return 0

def scan_directory(directory):
    """Scan a directory and return a dictionary of files grouped by creation date."""
    files_by_date = {}

    # Walk through the directory
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and .git directories
        if "node_modules" in root or ".git" in root:
            continue

        for file in files:
            file_path = os.path.join(root, file)
            try:
                # Get creation date
                creation_date = get_file_creation_date(file_path)

                # Count lines in the file
                line_count = count_lines_in_file(file_path)

                # Add to dictionary
                if creation_date not in files_by_date:
                    files_by_date[creation_date] = []

                # Store relative path to make output cleaner
                rel_path = os.path.relpath(file_path, directory)
                # Extract file extension
                _, file_extension = os.path.splitext(file_path)
                file_extension = file_extension.lower()
                if not file_extension:
                    file_extension = "(no extension)"

                files_by_date[creation_date].append({
                    'path': rel_path,
                    'line_count': line_count,
                    'extension': file_extension
                })
            except Exception as e:
                print(f"Error processing {file_path}: {e}")

    return files_by_date

def generate_html_table(files_by_date):
    """Generate an HTML file with interactive tables from the files grouped by date."""
    # Collect all unique file extensions
    all_extensions = set()
    for date in files_by_date:
        for file_info in files_by_date[date]:
            all_extensions.add(file_info['extension'])

    # Sort extensions alphabetically
    sorted_extensions = sorted(all_extensions)

    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File History Log</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #2980b9;
            margin-top: 30px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 30px;
        }
        th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .remove-btn {
            background-color: #e74c3c;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .remove-btn:hover {
            background-color: #c0392b;
        }
        .file-count {
            margin-top: 20px;
            font-weight: bold;
            color: #2c3e50;
        }
        .filter-container {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        .filter-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .filter-options {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .filter-option {
            display: flex;
            align-items: center;
            margin-right: 15px;
        }
        .filter-option input {
            margin-right: 5px;
        }
        .filter-actions {
            margin-top: 10px;
        }
        .filter-btn {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            margin-right: 10px;
        }
        .filter-btn:hover {
            background-color: #2980b9;
        }
        .search-container {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        .search-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .search-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 3px;
            margin-bottom: 10px;
            box-sizing: border-box;
        }
        .search-options {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 10px;
        }
        .search-option {
            display: flex;
            align-items: center;
            margin-right: 15px;
        }
        .search-option input {
            margin-right: 5px;
        }
    </style>
</head>
<body>
    <h1>File History Log</h1>
    <p>This document contains a history log of all files in the project, grouped by their creation date.</p>

    <div class="search-container">
        <div class="search-title">Search Files:</div>
        <input type="text" id="search-input" class="search-input" placeholder="Search by file name, module, etc..." oninput="applySearch()">
        <div class="search-options">
            <div class="search-option">
                <input type="checkbox" id="search-filename" name="search-field" value="filename" checked>
                <label for="search-filename">File Name</label>
            </div>
            <div class="search-option">
                <input type="checkbox" id="search-path" name="search-field" value="path" checked>
                <label for="search-path">Full Path</label>
            </div>
            <div class="search-option">
                <input type="checkbox" id="search-module" name="search-field" value="module" checked>
                <label for="search-module">Module</label>
            </div>
        </div>
    </div>

    <div class="filter-container">
        <div class="filter-title">Filter by File Type:</div>
        <div class="filter-options" id="extension-filters">"""

    # Add checkbox for each file extension
    for ext in sorted_extensions:
        html += f"""
            <div class="filter-option">
                <input type="checkbox" id="ext-{ext.replace('.', '')}" name="extension" value="{ext}" checked>
                <label for="ext-{ext.replace('.', '')}">{ext}</label>
            </div>"""

    html += """
        </div>
        <div class="filter-actions">
            <button class="filter-btn" onclick="selectAllExtensions(true)">Select All</button>
            <button class="filter-btn" onclick="selectAllExtensions(false)">Deselect All</button>
            <button class="filter-btn" onclick="applyFilters(true)">Apply Filters</button>
        </div>
    </div>

    <p>Click the "Remove" button to hide files from the list.</p>
    <div id="file-count" class="file-count"></div>
"""

    # Sort dates in descending order (newest first)
    sorted_dates = sorted(files_by_date.keys(), reverse=True)

    for date in sorted_dates:
        date_str = date.strftime('%Y-%m-%d')
        html += f'<h2 id="date-{date_str}">{date_str}</h2>\n'
        html += '<table id="table-' + date_str + '">\n'
        html += '  <thead>\n'
        html += '    <tr>\n'
        html += '      <th>File Path</th>\n'
        html += '      <th>Module</th>\n'
        html += '      <th>Line Count</th>\n'
        html += '      <th>Action</th>\n'
        html += '    </tr>\n'
        html += '  </thead>\n'
        html += '  <tbody>\n'

        # Sort files alphabetically by path
        sorted_files = sorted(files_by_date[date], key=lambda x: x['path'])

        for file_info in sorted_files:
            file_path = file_info['path']
            line_count = file_info['line_count']

            # Extract module (top-level directory)
            parts = file_path.split(os.sep)
            module = parts[0] if len(parts) > 0 else "Root"

            html += f'    <tr data-extension="{file_info["extension"]}">\n'
            html += f'      <td>{file_path}</td>\n'
            html += f'      <td>{module}</td>\n'
            html += f'      <td>{line_count}</td>\n'
            html += f'      <td><button class="remove-btn" onclick="removeRow(this)">Remove</button></td>\n'
            html += '    </tr>\n'

        html += '  </tbody>\n'
        html += '</table>\n'

    # Add JavaScript for interactivity
    html += """
<script>
    function removeRow(button) {
        const row = button.parentNode.parentNode;
        row.parentNode.removeChild(row);
        updateFileCount();

        // Check if table is empty
        const tbody = row.parentNode;
        if (tbody.children.length === 0) {
            const table = tbody.parentNode;
            const dateHeader = table.previousElementSibling;
            table.style.display = 'none';
            dateHeader.style.display = 'none';
        }
    }

    function updateFileCount() {
        const visibleRows = document.querySelectorAll('tbody tr:not([style*="display: none"])');
        document.getElementById('file-count').textContent = `Total files: ${visibleRows.length}`;
    }

    function selectAllExtensions(select) {
        const checkboxes = document.querySelectorAll('input[name="extension"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = select;
        });
    }

    function applySearch() {
        const searchInput = document.getElementById('search-input').value.toLowerCase();
        const searchFilename = document.getElementById('search-filename').checked;
        const searchPath = document.getElementById('search-path').checked;
        const searchModule = document.getElementById('search-module').checked;

        // Apply both search and extension filters
        applyFilters(false);
    }

    function shouldShowRow(row, selectedExtensions, searchInput) {
        // Check extension filter
        const extension = row.getAttribute('data-extension');
        if (!selectedExtensions.includes(extension)) {
            return false;
        }

        // If no search input, show the row (based on extension filter only)
        if (!searchInput) {
            return true;
        }

        // Check search filters
        const searchFilename = document.getElementById('search-filename').checked;
        const searchPath = document.getElementById('search-path').checked;
        const searchModule = document.getElementById('search-module').checked;

        // Get cell values
        const pathCell = row.cells[0].textContent.toLowerCase();
        const moduleCell = row.cells[1].textContent.toLowerCase();

        // Extract filename from path
        const pathParts = pathCell.split(/[\\\\\\/]/);
        const filename = pathParts[pathParts.length - 1];

        // Check if any enabled search field matches
        return (searchFilename && filename.includes(searchInput)) || 
               (searchPath && pathCell.includes(searchInput)) || 
               (searchModule && moduleCell.includes(searchInput));
    }

    function applyFilters(updateSearch = true) {
        // Get all selected extensions
        const selectedExtensions = [];
        const checkboxes = document.querySelectorAll('input[name="extension"]:checked');
        checkboxes.forEach(checkbox => {
            selectedExtensions.push(checkbox.value);
        });

        // Get search input
        const searchInput = document.getElementById('search-input').value.toLowerCase();

        // Show/hide rows based on filters
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            if (shouldShowRow(row, selectedExtensions, searchInput)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Update file count
        updateFileCount();

        // Hide empty tables
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            const visibleRows = table.querySelectorAll('tbody tr:not([style*="display: none"])');
            if (visibleRows.length === 0) {
                table.style.display = 'none';
                const dateHeader = table.previousElementSibling;
                dateHeader.style.display = 'none';
            } else {
                table.style.display = '';
                const dateHeader = table.previousElementSibling;
                dateHeader.style.display = '';
            }
        });
    }

    // Initialize search and filters
    document.getElementById('search-input').addEventListener('input', applySearch);
    document.querySelectorAll('input[name="search-field"]').forEach(checkbox => {
        checkbox.addEventListener('change', applySearch);
    });
    updateFileCount();
</script>
</body>
</html>
"""

    return html

def main():
    # Get the project root directory
    project_dir = os.path.dirname(os.path.abspath(__file__))

    print(f"Scanning directory: {project_dir}")
    files_by_date = scan_directory(project_dir)

    # Generate HTML table
    html = generate_html_table(files_by_date)

    # Write to file
    output_file = os.path.join(project_dir, "file_history_log.html")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"File history log generated: {output_file}")

if __name__ == "__main__":
    main()
