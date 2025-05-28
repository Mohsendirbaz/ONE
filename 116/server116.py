# server.py

**Purpose**: Api Client

**Functions**: is_api_request, add_header, handle_exception, not_found, method_not_allowed and 4 more

**Dependencies**: flask, os, subprocess, json, re and 1 more

**Keywords**: import, from, flask, request, jsonify, send_from_directory, make_response

## Key Code Sections

### Imports

```
from flask import Flask, request, jsonify, send_from_directory, make_response
import os
import subprocess
import json
import re
# ...and 1 more imports
```

### Function: is_api_request

```
def is_api_request(path):
    """
    Determine if a request path is for an API endpoint.



... (truncated to meet size target) ...
