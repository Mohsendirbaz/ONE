# Version_service.py

**Purpose**: Data Processing

**Functions**: get_all_versions, list_versions_route

## File Info

- **Size**: 1.6 KB
- **Lines**: 49
- **Complexity**: 12

## Additional Details

### Line Statistics

- Average line length: 32.0 characters
- Longest line: 88 characters
- Number of blank lines: 8

### Content Samples

Beginning:
```
from flask import Flask, jsonify
from flask_cors import CORS
import os
#
app = Flask(__name__)
CORS(
```

Middle:
```
)', dir_name)
            if match:
                version_str = match.group(1)
                try
```

End:
```
ng versions", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8002)

```

