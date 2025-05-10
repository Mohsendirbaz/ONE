# Visualization Runner

This document provides instructions for running visualizations from three modules:
1. file_associations
2. financial-entity-analyzer
3. insights_generator

## Overview

The repository contains three modules that generate various visualizations:

1. **file_associations**: Analyzes file associations in the project and generates HTML visualizations showing relationships between files.
2. **financial-entity-analyzer**: Contains JavaScript visualizations for financial entity analysis, including calculation flow diagrams, parameter influence graphs, sensitivity heat maps, and optimization convergence plots.
3. **insights_generator**: Generates insights and HTML visualizations based on the data from the file_associations module.

## Running the Visualizations

A script called `visualization_runner.py` has been created to run all visualizations from the three modules. This script handles errors by temporarily suspending problematic modules and includes timeout handling to prevent the script from hanging indefinitely.

### Prerequisites

- Python 3.6 or higher
- Web browser (for viewing the HTML visualizations)

### Usage

#### Interactive Mode

1. Run the visualization runner script:
   ```
   python visualization_runner.py
   ```

2. The script will prompt you to choose which modules to run:
   ```
   Which modules would you like to run?
   Run file_associations module? (y/n, default: y):
   Run insights_generator module? (y/n, default: y):
   Run financial-entity-analyzer module? (y/n, default: y):
   ```

3. For each module, you can choose to run it or skip it. If a module is problematic or not fully developed, you can skip it and still run the others.

4. For the file_associations module, you can configure additional options:
   ```
   === File Associations Configuration ===
   The file_associations module can analyze the entire project or a limited scope.
   For large projects, limiting the scope is recommended to avoid timeouts.
   Limit the scope of analysis? (y/n, default: y):
   ```

   If you choose to limit the scope, you can specify:
   - Maximum number of files to analyze
   - Timeout in seconds
   - Specific directories to analyze (comma-separated list)

5. For the insights_generator module, you can configure the timeout:
   ```
   === Insights Generator Configuration ===
   Timeout in seconds (default: 300):
   ```

6. The script will generate visualizations for the selected modules and create an index HTML file that links to all generated visualizations.

7. The index HTML file will automatically open in your default web browser, allowing you to access all visualizations.

#### Non-Interactive Mode (Command-Line Arguments)

You can also run the script in non-interactive mode with command-line arguments:

```
python visualization_runner.py --non-interactive [options]
```

Available options:

**Module Selection:**
- `--skip-file-associations`: Skip the file_associations module
- `--skip-insights-generator`: Skip the insights_generator module
- `--skip-financial-entity`: Skip the financial-entity-analyzer module

**file_associations Options:**
- `--fa-max-files N`: Maximum number of files to analyze (default: 100)
- `--fa-timeout N`: Timeout in seconds (default: 600)
- `--fa-dirs "dir1,dir2,dir3"`: Comma-separated list of directories to analyze

**insights_generator Options:**
- `--ig-timeout N`: Timeout in seconds (default: 300)

**Example:**
```
python visualization_runner.py --non-interactive --fa-max-files 200 --fa-dirs "src,lib" --ig-timeout 600
```

This will run all modules with the specified options without any interactive prompts.

### Timeout Handling

The script includes timeout handling for long-running operations to prevent it from hanging indefinitely. If a module takes too long to run, it will be terminated and the script will continue with the next module.

Default timeout values:
- file_associations: 600 seconds (10 minutes)
- insights_generator: 300 seconds (5 minutes)

You can adjust these values when running the script.

### Limiting Analysis Scope

For large projects, analyzing all files can be time-consuming and may cause timeouts. The script allows you to limit the scope of analysis in several ways:

1. **Maximum Files**: Limit the number of files to analyze (default: 100)
2. **Specific Directories**: Analyze only files in specific directories
3. **Timeout**: Set a maximum time for the analysis to run

### Troubleshooting

If you encounter issues with a specific module:

1. Run the script again and skip the problematic module.
2. Try limiting the scope of analysis for the file_associations module.
3. Increase the timeout value if a module is timing out but might complete with more time.
4. Check the error messages in the console for more information.
5. Ensure that all dependencies for the module are installed.

## Visualization Outputs

### file_associations

The file_associations module generates several HTML files:
- `code_insights_[timestamp].html`: Interactive visualization of file-level code insights
- `entity_insights_[timestamp].html`: Interactive visualization of entity-level relationships

### insights_generator

The insights_generator module generates:
- `insights_visualization_[timestamp].html`: Interactive visualization of insights derived from file associations data

### financial-entity-analyzer

The financial-entity-analyzer visualizations are combined into a single HTML file:
- `financial_entity_visualizations.html`: Contains four visualizations in a tabbed interface:
  - Calculation Flow Diagram
  - Parameter Influence Graph
  - Sensitivity Heat Map
  - Optimization Convergence Plot

## Index File

The script creates an index HTML file (`visualization_index.html`) that provides links to all generated visualizations, making it easy to access them all from one place.

## Customization

If you need to customize the visualizations or add new ones:

1. For file_associations and insights_generator, modify the respective Python modules.
2. For financial-entity-analyzer, modify the JavaScript files in the visualizations directory.
3. Update the visualization_runner.py script if necessary to include new visualizations.
