# IND2751.py

**Purpose**: Config

**Functions**: extract_property_mapping, generate_display_names, inject_names

## File Info

- **Size**: 4.7 KB
- **Lines**: 125
- **Complexity**: 12

## Additional Details

### Line Statistics

- Average line length: 36.7 characters
- Longest line: 119 characters
- Number of blank lines: 22

### Content Samples

Beginning:
```
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
impor
```

Middle:
```
     var_strs = []

            config_path = next((v.get('config_file') for v in variations.values(
```

End:
```
ify(generate_display_names(version))

if __name__ == "__main__":
    app.run(port=2751, debug=True)

```

