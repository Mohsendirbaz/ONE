# table-updated.py

**Purpose**: Config

**Functions**: expand_vector_properties, collect_properties_from_config_module, load_config_modules, build_and_save_table, create_table_api and 2 more

**Dependencies**: sys, json, logging, os, pandas and 1 more

**Keywords**: import, sys, json, logging, pandas, from, pathlib

## Key Code Sections

### Imports

```
import sys
import json
import logging
import os
import pandas as pd
# ...and 1 more imports
```

### Function: expand_vector_properties

```
def expand_vector_properties(properties, prop_name, vector):
    """
    Helper function to expand vector properties with numbered extensions.

    This function takes a vector property (like variable_costsAmount4) and expands it
    # ... more lines ...
```

### Function: collect_properties_from_config_module

```
def collect_properties_from_config_module(config_module):
    """
    Collect properties from a config module, properly handling vectors.

    This function extracts all properties from a configuration module and
    # ... more line

... (truncated to meet size target) ...
