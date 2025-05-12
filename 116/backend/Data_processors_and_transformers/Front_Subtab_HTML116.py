# Front_Subtab_HTML.py

**Purpose**: Api Client

**Description**: Flask service (port:8009) - Processes HTML files from batch results

**Functions**: emit, get_versions, get_html_files, mark_request_as_timed_out, is_timeout_approaching and 7 more

**Classes**: BufferHandler, TimeoutError

**Dependencies**: flask, flask_cors, os, re, logging and 4 more

**Keywords**: import, from, flask, cors, logging, app, jsonify

## Key Code Sections

### Imports

```
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os
import re
import logging
# ...and 4 more imports
```

### Function: process_html_file

```
def process_html_file(file, directory, html_files):
    """Helper function to process an HTML file and add it to the list"""
    file_path = directory / file
    try:
        # Set a maximum size for HTML content to prevent memory issues
    # ... more lines ...
```

### Function: serve_html

```
def serve_html(version, album, filename):
    """Serve HTML files from the correct directory based on version and album"""
    # Construct the path to the HTML file
    version_folder = BASE_PATH / f"Batch({version})" / f"Results({version})"
    file_path = version_folder / album / filename
    # ... more lines ...
```

### Function: test

```
def test():
    """Simple test endpoint to check if the server is running"""
    return jsonify({"status": "ok", "message": "Server is running"}), 200

```

### Class: BufferHandler

```
class BufferHandler(logging.Handler):
    def emit(self, record):
        log_entry = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(record.created)),
            'level': record.levelname,
            'message': self.format(record)
        }
        log_buffer.append(log_entry)

```

## File Info

- **Size**: 31.6 KB
- **Lines**: 711
- **Complexity**: 20
