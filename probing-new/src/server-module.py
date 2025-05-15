"""
Probing Server Module

This module serves as the main entry point for running the probing server,
which includes the API and the file monitoring functionality.
"""

import os
import threading
import time
from flask import Flask, render_template, send_from_directory

# Import API module
from probing.src.api import app as api_app, run_api

# Import connector for monitoring
from probing.src.connector import pipeline

# Create a Flask app for serving the frontend
app = Flask(__name__)

# Serve static files from the public directory
@app.route('/')
def index():
    """Serve the main index.html file."""
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    """Serve static files from the public directory."""
    return send_from_directory('public', path)

# Function to run the file monitoring in a separate thread
def run_file_monitoring():
    """Run the file monitoring in a separate thread."""
    print("Starting file monitoring...")
    
    while True:
        try:
            # Scan for changes
            pipeline.scan_all()
            
            # Sleep for a few seconds
            time.sleep(10)
        except Exception as e:
            print(f"Error in file monitoring: {e}")
            time.sleep(30)  # Longer sleep on error

def main():
    """Run the server."""
    # Get the host and port from environment variables
    host = os.environ.get('PROBING_HOST', '0.0.0.0')
    port = int(os.environ.get('PROBING_PORT', 5000))
    
    # Start the file monitoring thread
    monitoring_thread = threading.Thread(target=run_file_monitoring, daemon=True)
    monitoring_thread.start()
    
    # Run the API server
    run_api(host=host, port=port, debug=True)

if __name__ == '__main__':
    main()
