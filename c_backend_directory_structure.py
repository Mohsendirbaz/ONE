import json
import os
import re
import argparse
from datetime import datetime
from typing import Union, Dict, List, Any, Optional, Tuple
from os import PathLike

def analyze_backend_directory(backend_path: Union[str, PathLike], output_path: Union[str, PathLike]) -> str:
    """
    Creates a JSON file representing the hierarchical directory structure of the backend,
    allowing for gradual navigation through subdirectories.

    The structure is organized as a tree where:
    - The root represents the backend directory
    - Each directory prioritizes subdirectories over files
    - Subdirectories are nested under their parent directories
    - __pycache__ and similar non-essential directories are excluded
    - This allows for gradual navigation through the directory tree
    - API endpoints are included as a separate category

    Example structure:
    {
      "root": {
        "name": "backend",
        "subdirectories": {
          "dir1": {
            "subdirectories": {
              "subdir1": {...}
            },
            "files": [...]
          }
        },
        "files": [...]
      },
      "api_endpoints": [
        {
          "path": "/api/endpoint",
          "method": "GET",
          "function": "function_name",
          "file": "relative/path/to/file.py",
          "description": "Endpoint description"
        }
      ]
    }

    Args:
        backend_path: Path to the backend directory
        output_path: Path where the output JSON file will be saved

    Returns:
        The path to the created JSON file
    """
    # Create the base structure
    directory_structure: Dict[str, Any] = {
        "project_name": "Backend Structure",
        "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "version": 4,  # Increment version to indicate structural change
        "root": {
            "name": os.path.basename(backend_path),
            "absolute_path": os.path.abspath(backend_path),
            "subdirectories": {},
            "files": []
        },
        "api_endpoints": []  # Add API endpoints as a separate category
    }

    # Define directories to exclude
    excluded_dirs = ['__pycache__', '.git', '.idea', 'node_modules', 'venv', 'env', '.vscode']

    # Helper function to find a directory in the hierarchical structure
    def find_directory(root_dir, path):
        if not path:
            return root_dir

        parts = path.split(os.sep)
        current = root_dir

        for part in parts:
            if part in current["subdirectories"]:
                current = current["subdirectories"][part]
            else:
                return None

        return current

    # First pass: collect all directories and files
    all_dirs = {}

    for root, dirs, files in os.walk(backend_path):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if d not in excluded_dirs]

        # Get relative path from target directory
        rel_path = os.path.relpath(root, backend_path)

        # Skip the root directory in this loop
        if rel_path == ".":
            # Add root directory files
            directory_structure["root"]["files"] = [os.path.basename(f) for f in files]
            continue

        # Skip excluded directories
        if os.path.basename(root) in excluded_dirs:
            continue

        # Store directory info
        dir_name = os.path.basename(root)
        all_dirs[rel_path] = {
            "name": dir_name,
            "absolute_path": os.path.abspath(root),
            "subdirectories": {},
            "files": [os.path.basename(f) for f in files]
        }

    # Second pass: build the hierarchical structure
    for path in sorted(all_dirs.keys()):
        parts = path.split(os.sep)

        # Navigate to the correct parent directory
        if len(parts) == 1:
            # This is a top-level directory
            directory_structure["root"]["subdirectories"][parts[0]] = all_dirs[path]
        else:
            # This is a subdirectory
            parent_path = os.sep.join(parts[:-1])
            parent = find_directory(directory_structure["root"], parent_path)
            if parent:
                parent["subdirectories"][parts[-1]] = all_dirs[path]

    # Extract API endpoints and add them to the directory structure
    try:
        print("Extracting API endpoints...")
        api_endpoints = extract_api_endpoints(backend_path)
        directory_structure["api_endpoints"] = api_endpoints
        print(f"Found {len(api_endpoints)} API endpoints")
    except Exception as e:
        print(f"Error extracting API endpoints: {str(e)}")
        directory_structure["api_endpoints"] = []

    # Write the output JSON file
    with open(output_path, 'w') as f:
        json.dump(directory_structure, f, indent=2)

    return str(output_path)

def extract_api_endpoints(directory_path: Union[str, PathLike]) -> List[Dict[str, Any]]:
    """
    Extract API endpoints from Python files in the given directory.

    Args:
        directory_path: Path to the directory to analyze

    Returns:
        A list of dictionaries containing information about each API endpoint
    """
    endpoints = []

    # Define a pattern to match Flask route decorators
    route_pattern = re.compile(r'@app\.route\([\'"](.+?)[\'"](.*?)\)')
    methods_pattern = re.compile(r'methods=\[(.*?)\]')

    # Walk through the directory
    for root, _, files in os.walk(directory_path):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)

                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Find all route decorators
                    route_matches = route_pattern.finditer(content)

                    for route_match in route_matches:
                        route = route_match.group(1)
                        route_options = route_match.group(2)

                        # Extract HTTP methods
                        methods = ['GET']  # Default method is GET
                        methods_match = methods_pattern.search(route_options)
                        if methods_match:
                            methods_str = methods_match.group(1)
                            methods = [m.strip().strip("'\"") for m in methods_str.split(',')]

                        # Find the function name
                        function_def_pattern = re.compile(r'def\s+([a-zA-Z0-9_]+)\s*\(')
                        function_matches = function_def_pattern.finditer(content[route_match.end():])
                        function_name = next(function_matches).group(1) if function_matches else "unknown"

                        # Find the function docstring
                        docstring = ""
                        if function_name != "unknown":
                            docstring_pattern = re.compile(r'def\s+' + function_name + r'\s*\(.*?\).*?:(.*?)(?:def|\Z)', re.DOTALL)
                            docstring_match = docstring_pattern.search(content[route_match.end():])
                            if docstring_match:
                                docstring_text = docstring_match.group(1).strip()
                                # Extract triple-quoted docstring if present
                                triple_quote_pattern = re.compile(r'"""(.*?)"""', re.DOTALL)
                                triple_quote_match = triple_quote_pattern.search(docstring_text)
                                if triple_quote_match:
                                    docstring = triple_quote_match.group(1).strip()

                        # Add endpoint to the list
                        for method in methods:
                            endpoints.append({
                                'path': route,
                                'method': method,
                                'function': function_name,
                                'file': os.path.relpath(file_path, directory_path),
                                'description': docstring
                            })
                except Exception as e:
                    print(f"Error processing file {file_path}: {str(e)}")

    return endpoints

def generate_postman_collection(endpoints: List[Dict[str, Any]], output_path: Union[str, PathLike]) -> str:
    """
    Generate a Postman collection JSON file from the extracted API endpoints.

    Args:
        endpoints: List of API endpoints
        output_path: Path where the output JSON file will be saved

    Returns:
        The path to the created JSON file
    """
    # Create the base structure for the Postman collection
    collection = {
        "info": {
            "name": "ONE1 API",
            "description": "API endpoints for the ONE1 project",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": []
    }

    # Group endpoints by file
    endpoints_by_file = {}
    for endpoint in endpoints:
        file = endpoint['file']
        if file not in endpoints_by_file:
            endpoints_by_file[file] = []
        endpoints_by_file[file].append(endpoint)

    # Add endpoints to the collection
    for file, file_endpoints in endpoints_by_file.items():
        # Create a folder for each file
        folder = {
            "name": file,
            "item": []
        }

        # Add endpoints to the folder
        for endpoint in file_endpoints:
            # Create a request item
            request_item = {
                "name": f"{endpoint['method']} {endpoint['path']}",
                "request": {
                    "method": endpoint['method'],
                    "header": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        }
                    ],
                    "url": {
                        "raw": f"http://localhost:15000{endpoint['path']}",
                        "protocol": "http",
                        "host": ["localhost"],
                        "port": "15000",
                        "path": endpoint['path'].strip('/').split('/')
                    },
                    "description": endpoint['description']
                },
                "response": []
            }

            # Add example request body for POST, PUT, PATCH methods
            if endpoint['method'] in ['POST', 'PUT', 'PATCH']:
                request_item["request"]["body"] = {
                    "mode": "raw",
                    "raw": "{\n    \"example\": \"value\"\n}",
                    "options": {
                        "raw": {
                            "language": "json"
                        }
                    }
                }

            # Add example responses
            request_item["response"] = [
                {
                    "name": "Successful Response",
                    "originalRequest": request_item["request"],
                    "status": "OK",
                    "code": 200,
                    "header": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        }
                    ],
                    "body": "{\n    \"success\": true,\n    \"data\": {}\n}"
                }
            ]

            folder["item"].append(request_item)

        collection["item"].append(folder)

    # Write the output JSON file
    with open(output_path, 'w') as f:
        json.dump(collection, f, indent=2)

    return str(output_path)

def analyze_api_endpoints(backend_path: Union[str, PathLike], output_path: Union[str, PathLike]) -> str:
    """
    Analyze API endpoints in the backend directory and generate a Postman collection.

    Args:
        backend_path: Path to the backend directory
        output_path: Path where the output JSON file will be saved

    Returns:
        The path to the created JSON file
    """
    # Extract API endpoints
    endpoints = extract_api_endpoints(backend_path)

    # Generate Postman collection
    result_path = generate_postman_collection(endpoints, output_path)

    return result_path

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Analyze backend directory structure')
    # Get the script directory path
    current_script_path = os.path.dirname(os.path.abspath(__file__))
    # Set default backend path relative to the script location
    default_backend_path = os.path.join(current_script_path)

    parser.add_argument('--backend_path', type=str, default=default_backend_path,
                        help='Absolute path to the backend directory to analyze')
    parser.add_argument('--output_path', type=str,
                        help='Absolute path for the output JSON file. If not provided, will use the script directory')
    parser.add_argument('--analyze_associations', action='store_true',
                        help='Also analyze file associations')
    parser.add_argument('--analyze_api', action='store_true',
                        help='Analyze API endpoints and generate a Postman collection')

    args = parser.parse_args()

    # Use the provided paths
    backend_path = args.backend_path

    # If output path is not provided, create one in the script directory
    if not args.output_path:
        output_path = os.path.join(current_script_path, "c_backend_directory_structure.json")
    else:
        output_path = args.output_path

    try:
        result_path = analyze_backend_directory(backend_path, output_path)
        print(f"Directory structure analysis complete. Output saved to {result_path}")

        # If requested, also analyze API endpoints
        if args.analyze_api:
            try:
                api_output_path = os.path.join(current_script_path, "postman_collection.json")
                print("Analyzing API endpoints...")
                api_result_path = analyze_api_endpoints(backend_path, api_output_path)
                print(f"API endpoint analysis complete. Postman collection saved to {api_result_path}")
            except Exception as e:
                print(f"Error analyzing API endpoints: {str(e)}")

        # If requested, also analyze file associations
        if args.analyze_associations:
            try:
                from file_associations.main import analyze_project_associations
                print("Analyzing file associations...")
                output_dir = analyze_project_associations(backend_path)
                print(f"File association analysis complete. Output saved to {output_dir}")
            except ImportError as e:
                print(f"Could not import file association modules: {str(e)}")
                print("Make sure the file_associations package is in your Python path.")
    except Exception as e:
        print(f"Error during analysis: {str(e)}")

if __name__ == "__main__":
    main()
