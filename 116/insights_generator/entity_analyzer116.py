# entity_analyzer.py

**Purpose**: Data Processing

**Description**: Entity Analyzer Module

This module provides the CodeEntityAnalyzer class for analyzing relationships
between individual code entities (variables, functions, classes, modules).

**Functions**: __init__, _load_json, analyze_entity_relationships, _analyze_function_dependencies, _analyze_class_hierarchies and 6 more

**Classes**: for, CodeEntityAnalyzer:, hierarchies, hierarchies, inheritance and 5 more

**Dependencies**: os, json, networkx, typing, os and 2 more

**Keywords**: import, union, pathlike, from, str, optional, datetime

## Key Code Sections

### Imports

```
import os
import json
import networkx as nx
from typing import Dict, List, Set, Any, Union, Optional, Tuple
from os import PathLike
# ...and 2 more imports
```

### Function: __init__

```
def __init__(self, 
                 summary_path: Union[str, PathLike],
                 common_ports_path: Union[str, PathLike],
                 direct_imports_path: Optional[Union[str, PathLike]] = None,
                 file_associations_path: Optional[Union[str, PathLike]] = None):
    # ... more lines ...
```

### Function: _load_json

```
def _load_json(self, file_path: Union[str, PathLike]) -> Dict[str, Any]:
        """
        Load a JSON file.

        Args:
    # ... more lines ...
```

### Function: analyze_entity_relationships

```
def analyze_entity_relationships(self):
        """
        Analyze relationships between code entities (functions, classes, variables).
        """
        # Extract common ports data - this contains the entity-level information
    # ... more lines ...
```

### Class: for

```
class for analyzing relationships
between individual code entities (variables, functions, classes, modules).
"""

import os
import json
import networkx as nx
    # ... more lines ...
```

## File Info

- **Size**: 44.1 KB
- **Lines**: 1122
- **Complexity**: 17

## Additional Details

### Line Statistics

- Average line length: 38.3 characters
- Longest line: 152 characters
- Number of blank lines: 152

### Content Samples

Beginning:
```
"""
Entity Analyzer Module

This module provides the CodeEntityAnalyzer class for analyzing relation
```

Middle:
```
     Returns:
            The path to the created HTML file
        """
        if output_path is No
```

End:
```
tor('.tablinks.active').click();
        }});
    </script>
</body>
</html>
"""
        return html

```


================================================================================
End of file summary
================================================================================
