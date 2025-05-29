# Theme Routes - Flask API Blueprint for Theme Management

## Overview
The `theme_routes.py` module provides Flask API endpoints for managing CSS themes in the application. It handles theme creation, modification, and application of CSS styles to various files in the project.

## Core Functionality

### Main Purpose
This module serves as the backend API for the theme configuration system, allowing frontend applications to manage CSS themes dynamically through HTTP endpoints.

### Key Features
1. **Theme Management**: Read and update the current theme configuration
2. **CSS Validation**: Ensures CSS content follows proper format
3. **File Safety**: Prevents path traversal attacks with filename validation
4. **CSS Registry**: Apply CSS styles to multiple files in the HomePage.CSS directory
5. **Theme Variable Extraction**: Parse and manage CSS custom properties (variables)

## API Endpoints

### `GET/POST /api/theme/current`
Manages the current theme configuration.

**GET Request:**
- Returns the current theme CSS content from `creative-theme.css`
- Response: `{"success": true, "css": "<css_content>"}`

**POST Request:**
- Updates theme with new CSS variables
- Request body: JSON object with CSS custom properties
- Example: `{"--primary-color": "#007bff", "--secondary-color": "#6c757d"}`
- Response: `{"success": true}`

### `POST /api/theme/save`
Saves complete theme CSS to file.

**Request:**
- Body: `{"css": "<complete_css_content>"}`
- CSS must start with `:root.creative-theme`

**Response:**
- Success: `{"success": true}`
- Error: `{"success": false, "message": "<error_message>"}`

### `POST /api/css-registry/apply`
Applies CSS to selected files in the HomePage.CSS directory.

**Request:**
```json
{
    "files": ["file1.css", "file2.css"],
    "cssCode": ":root { --color: #fff; }"
}
```

**Response:**
- Success: `{"success": true}`
- Error: `{"success": false, "message": "<error_message>"}`

## Helper Functions

### `validate_filename(filename)`
Validates filenames to prevent security vulnerabilities.

**Validation Rules:**
- Must end with `.css`
- Cannot contain `../` (path traversal)

**Parameters:**
- `filename` (str): Filename to validate

**Returns:**
- str: Validated filename

**Raises:**
- ValueError: If filename is invalid

### `handle_error(error)`
Global error handler for the blueprint.

**Parameters:**
- `error` (Exception): The caught exception

**Returns:**
- Response: JSON error response with 500 status

## File Structure

### Directory Paths
- **Project Root**: `SF/` (3 levels up from this module)
- **Styles Folder**: `SF/src/styles/`
- **CSS Registry**: `SF/src/HomePage.CSS/`
- **Theme File**: `SF/src/styles/creative-theme.css`

### Theme CSS Format
```css
:root.creative-theme {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --background-color: #ffffff;
  /* Other CSS custom properties */
}
```

## CSS Processing Logic

### Theme Variable Extraction
1. Reads `creative-theme.css` to extract existing theme variables
2. Uses regex pattern: `--([a-z0-9-]+):\s*([^;}]+)[;}]`
3. Stores variables in dictionary for comparison

### CSS Application Process
1. **Load Theme Variables**: Extract current theme CSS custom properties
2. **Process Selected Files**: For each file in the request:
   - Validate filename for security
   - Extract new CSS variables from provided code
   - Read existing variables from target file
   - Identify unique variables not already in file
   - Append new variables to file with comments

### Variable Filtering
- Only adds variables that:
  - Don't already exist in the target file
  - Are defined in the current theme
  - Follow CSS custom property syntax

## Security Features

1. **Path Traversal Prevention**: Validates all filenames
2. **CSS Format Validation**: Ensures proper CSS structure
3. **Error Handling**: Comprehensive try-catch blocks
4. **Logging**: Tracks all operations for audit

## Logging

### Configuration
- Uses Python's standard logging module
- Level: INFO
- CSS utils logging set to WARNING to reduce noise

### Logged Events
- Theme updates
- File saves
- CSS application to files
- Errors and exceptions

## Error Handling

### Common Error Responses
- **404**: Theme or directory not found
- **400**: Missing or invalid request data
- **500**: Server errors with detailed messages

### Error Response Format
```json
{
    "success": false,
    "message": "Error description"
}
```

## Integration Points
- **Frontend**: Theme configurator UI components
- **File System**: Reads/writes CSS files
- **Flask App**: Registered as blueprint in main Flask application

## Usage Example

### Register Blueprint
```python
from flask import Flask
from theme_routes import theme_routes

app = Flask(__name__)
app.register_blueprint(theme_routes)
```

### Client Usage
```javascript
// Get current theme
fetch('/api/theme/current')
    .then(res => res.json())
    .then(data => console.log(data.css));

// Update theme
fetch('/api/theme/current', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        '--primary-color': '#ff0000',
        '--secondary-color': '#00ff00'
    })
});
```

## Notes
- Theme changes are immediately written to disk
- CSS validation uses cssutils library
- All CSS files must follow project naming conventions
- Theme variables use CSS custom properties (--variable-name)