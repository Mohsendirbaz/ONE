from flask import Flask, request, jsonify, send_from_directory, make_response
import os
import subprocess
import json
import re
from werkzeug.serving import run_simple

# Create Flask app with a request timeout
app = Flask(__name__)

# Set a global timeout for all requests (30 seconds)
app.config['TIMEOUT'] = 30

# Helper function to check if a request is for an API endpoint
def is_api_request(path):
    """
    Determine if a request path is for an API endpoint.

    API endpoints are defined as:
    1. Paths starting with '/api/' - Standard API route prefix
    2. Specific API endpoints - Explicitly defined API routes

    Args:
        path (str): The request path to check

    Returns:
        bool: True if the path is for an API endpoint, False otherwise
    """
    # Define API endpoint patterns
    api_patterns = [
        '/api/',          # Standard API route prefix
        '/analyze-project',  # File analysis API endpoint
        '/generate-insights'  # Insights generation API endpoint
    ]

    # Check if the path matches any of the API patterns
    return any(path.startswith(pattern) for pattern in api_patterns)

# Add a middleware to ensure all API responses have the correct content type and CORS headers
@app.after_request
def add_header(response):
    # Add CORS headers to allow cross-origin requests
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

    # Check if the request is for an API endpoint
    if is_api_request(request.path):
        # Ensure the response has the correct content type for API requests
        response.headers['Content-Type'] = 'application/json'

    return response

# Global error handlers to ensure API requests get JSON responses
@app.errorhandler(Exception)
def handle_exception(e):
    # Check if the request is for an API endpoint
    if is_api_request(request.path):
        # Return JSON error for API requests
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

    # For non-API requests, return the default error handling
    return str(e), 500

@app.errorhandler(404)
def not_found(e):
    # Check if the request is for an API endpoint
    if is_api_request(request.path):
        return jsonify({
            'success': False,
            'error': 'The requested API endpoint was not found'
        }), 404

    # For non-API requests, return a user-friendly error page
    return f"Error 404: Page not found - {request.path}", 404

@app.errorhandler(405)
def method_not_allowed(e):
    # Check if the request is for an API endpoint
    if is_api_request(request.path):
        return jsonify({
            'success': False,
            'error': f'Method {request.method} is not allowed for this endpoint'
        }), 405

    # For non-API requests, return a user-friendly error message
    return f"Error 405: Method {request.method} not allowed for {request.path}", 405

@app.route('/analyze-project', methods=['POST', 'OPTIONS'])
def analyze_project():
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200

    # Ensure this endpoint only responds to POST requests with JSON
    if request.method != 'POST':
        return jsonify({'success': False, 'error': 'Only POST method is allowed'}), 405

    if not request.is_json:
        return jsonify({'success': False, 'error': 'Request must be JSON'}), 400

    data = request.json
    project_path = data.get('projectPath', '.')

    try:
        # Run the file association analysis with a timeout
        try:
            result = subprocess.run(['python', '-m', 'file_associations.cli', '--project_path', project_path], 
                                  capture_output=True, text=True, timeout=300)  # 5-minute timeout
        except subprocess.TimeoutExpired:
            return jsonify({'success': False, 'error': 'Analysis timed out after 5 minutes. Try with a smaller project or optimize the analysis.'})

        # Check if there are any errors in the output
        if "Error:" in result.stdout:
            # Extract the error message
            error_message = None
            for line in result.stdout.split('\n'):
                if "Error:" in line:
                    error_message = line.strip()
                    break

            # Return error response with 400 status code
            return jsonify({
                'success': False, 
                'error': error_message or "Unknown error occurred", 
                'output': result.stdout
            }), 400

        # Extract the timestamp from output
        timestamp = None
        for line in result.stdout.split('\n'):
            if "Summary report created at" in line:
                # Extract timestamp using regex
                match = re.search(r'file_associations_summary_(\d{8}_\d{6})\.json', line)
                if match:
                    timestamp = match.group(1)
                    break

        if timestamp:
            files = {
                'summaryFile': f'file_associations/output/file_associations_summary_{timestamp}.json',
                'directImportsFile': f'file_associations/output/direct_imports_{timestamp}.json',
                'commonPortsFile': f'file_associations/output/common_ports_{timestamp}.json',
                'fileAssociationsFile': f'file_associations/output/file_associations_{timestamp}.json'
            }
            return jsonify({'success': True, 'output': result.stdout, 'files': files})

        return jsonify({'success': False, 'error': 'Could not identify output files', 'output': result.stdout}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/generate-insights', methods=['POST', 'OPTIONS'])
def generate_insights():
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200

    # Ensure this endpoint only responds to POST requests with JSON
    if request.method != 'POST':
        return jsonify({'success': False, 'error': 'Only POST method is allowed'}), 405

    if not request.is_json:
        return jsonify({'success': False, 'error': 'Request must be JSON'}), 400

    data = request.json
    summary_path = data.get('summaryFile')

    try:
        # Run the insights generator with a timeout
        try:
            result = subprocess.run(['python', '-m', 'insights_generator.main', '--summary', summary_path], 
                                  capture_output=True, text=True, timeout=300)  # 5-minute timeout
        except subprocess.TimeoutExpired:
            return jsonify({'success': False, 'error': 'Insights generation timed out after 5 minutes. Try with a smaller dataset or optimize the generation.'})

        # Check if there are any errors in the output
        if "Error:" in result.stdout:
            # Extract the error message
            error_message = None
            for line in result.stdout.split('\n'):
                if "Error:" in line:
                    error_message = line.strip()
                    break

            # Return error response with 400 status code
            return jsonify({
                'success': False, 
                'error': error_message or "Unknown error occurred", 
                'output': result.stdout
            }), 400

        # Extract the HTML report paths from output
        code_insights = None
        entity_insights = None
        for line in result.stdout.split('\n'):
            if "HTML file saved to" in line:
                code_insights = line.split("HTML file saved to ")[-1].strip()
            elif "Interactive entity relationship report generated at" in line:
                entity_insights = line.split("Interactive entity relationship report generated at ")[-1].strip()

        reports = {}
        if code_insights:
            reports['codeInsightsFile'] = code_insights
        if entity_insights:
            reports['entityInsightsFile'] = entity_insights

        return jsonify({'success': True, 'output': result.stdout, 'reports': reports})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/')
def index():
    try:
        # Check if the file exists before trying to serve it
        if not os.path.exists('file_association_tool.html'):
            return "Error: file_association_tool.html not found", 404

        # Serve the file with explicit mimetype to avoid content-type issues
        return send_from_directory('.', 'file_association_tool.html', mimetype='text/html')
    except Exception as e:
        return f"Error serving index page: {str(e)}", 500

@app.route('/<path:filename>')
def serve_file(filename):
    # Check if the request looks like an API endpoint
    if is_api_request('/' + filename):
        return jsonify({'error': 'Invalid API endpoint or method'}), 404

    try:
        # Handle HTML files
        if filename == 'file-association-tool.html':
            # Redirect to the main tool
            return send_from_directory('.', 'file_association_tool.html', mimetype='text/html')

        # Check if the file exists before trying to serve it
        if not os.path.exists(filename):
            return f"Error: File {filename} not found", 404

        # Determine the mimetype based on the file extension
        mimetype = None
        if filename.endswith('.html'):
            mimetype = 'text/html'
        elif filename.endswith('.js'):
            mimetype = 'application/javascript'
        elif filename.endswith('.css'):
            mimetype = 'text/css'
        elif filename.endswith('.json'):
            mimetype = 'application/json'

        # Serve the requested file with appropriate mimetype
        return send_from_directory('.', filename, mimetype=mimetype)
    except Exception as e:
        return f"Error serving {filename}: {str(e)}", 404

if __name__ == '__main__':
    print("Starting server on http://localhost:15000")
    print("Access the tool at http://localhost:15000")
    print(f"Server configured with {app.config['TIMEOUT']} second subprocess timeout")

    # Use run_simple for the server
    # This provides more control over the server behavior
    run_simple(
        hostname='127.0.0.1',
        port=15000,
        application=app,
        threaded=True,
        use_reloader=False,  # Disable auto-reloading for stability
        use_debugger=False   # Disable debugger for production
    )
