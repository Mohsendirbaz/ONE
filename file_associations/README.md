# File Association Tracking System

This system analyzes project files to identify various relationships between them, including:
- Direct import statements
- Common ports (functions, classes, variables)
- String references and configuration dependencies

## Architecture

The system consists of two main subsystems:

1. **File Association Tracking System**: Analyzes project files and outputs JSON data files
2. **Insights Generator System**: Transforms raw association data into meaningful insights and visualizations

These subsystems are now decoupled, allowing the file association tracking to be used independently of the insights generator.

## Key Features

- **Configurable Analysis**: Control which files to analyze and how many
- **Centralized Utilities**: Common functions are consolidated in the utils module
- **Proper Logging**: Structured logging with configurable verbosity
- **Optional Insights Generation**: Generate insights only when needed
- **Command-line Interface**: Run the system from the command line with various options

## Usage

### As a Python Module

```python
from file_associations.main import analyze_project_associations
from file_associations.config import configure

# Configure the system (optional)
configure({
    'max_files_to_analyze': 1000,
    'generate_insights': True,
    'verbose_logging': True
})

# Analyze a project
result = analyze_project_associations('/path/to/project')

# Access the output files
output_dir = result['output_dir']
summary_file = result['analysis_files']['summary']
insights_html = result['insights_files'].get('file_level_html')
```

### From the Command Line

```bash
python -m file_associations.main /path/to/project --max-files 1000 --verbose
```

#### Command-line Options

- `project_path`: Path to the project directory to analyze (required)
- `--max-files N`: Maximum number of files to analyze
- `--output-dir DIR`: Directory where output files will be saved
- `--no-insights`: Disable insights generation
- `--no-summary`: Disable summary report creation
- `--open-browser`: Open HTML reports in the default browser
- `--verbose`: Enable verbose logging
- `--quiet`: Only log errors
- `--log-file FILE`: Path to a log file

## Configuration

The system can be configured through the `config` module:

```python
from file_associations.config import configure

configure({
    'max_files_to_analyze': 1000,
    'skip_binary_files': True,
    'analyze_hidden_files': False,
    'output_directory': '/path/to/output',
    'create_summary': True,
    'generate_insights': True,
    'open_insights_in_browser': False,
    'verbose_logging': False,
    'log_errors_only': False,
    'file_extensions_to_analyze': ['.py', '.js', '.java'],
    'file_extensions_to_skip': ['.pyc', '.class', '.o']
})
```

You can also load configuration from a JSON file:

```python
from file_associations.config import configure

configure(config_path='/path/to/config.json')
```

## Output Files

The system generates several JSON files:

- `direct_imports_YYYYMMDD_HHMMSS.json`: Maps import statements between files
- `common_ports_YYYYMMDD_HHMMSS.json`: Identifies shared functions, classes, and variables
- `file_associations_YYYYMMDD_HHMMSS.json`: Detects string references and configuration dependencies
- `file_associations_summary_YYYYMMDD_HHMMSS.json`: Combines all associations into a single file

If insights generation is enabled, it also produces:

- `code_insights_YYYYMMDD_HHMMSS.html`: Interactive HTML report with file-level insights
- `entity_insights_YYYYMMDD_HHMMSS.json`: JSON file with entity-level insights
- `entity_insights_YYYYMMDD_HHMMSS.html`: Interactive HTML report with entity-level insights

## Logging

The system uses a structured logging system with configurable verbosity:

```python
import logging
from file_associations.logging_utils import configure_logging, info, debug, warning, error

# Configure logging
configure_logging(log_level=logging.DEBUG, log_file='/path/to/log.txt')

# Log messages
info("Analysis started")
debug("Processing file: example.py")
warning("Skipping binary file: image.png")
error("Failed to analyze file: corrupted.py")
```

## Error Handling

The system provides custom exception types for different error scenarios:

```python
from file_associations.utils import FileAssociationError, BinaryFileError, FileEncodingError, JsonLoadError

try:
    # Some code that might raise an exception
    pass
except BinaryFileError as e:
    # Handle binary file error
    pass
except FileEncodingError as e:
    # Handle encoding error
    pass
except JsonLoadError as e:
    # Handle JSON loading error
    pass
except FileAssociationError as e:
    # Handle any other file association error
    pass
```

## Extending the System

The system is designed to be extensible:

1. Create a new analyzer class that inherits from `FileAssociationBase`
2. Implement the `analyze_file` method
3. Add the new analyzer to the `FileAssociationTracker` class

Example:

```python
from file_associations.file_association_base import FileAssociationBase

class MyCustomAnalyzer(FileAssociationBase):
    def analyze_file(self, file_path):
        # Custom analysis logic
        return {"custom_data": [...]}
```
