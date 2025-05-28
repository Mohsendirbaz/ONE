# Insights Generator

A comprehensive tool for generating insights from code and financial data.

## Overview

The Insights Generator is a Python package that provides utilities for mining data from code repositories, analyzing entities and their relationships, and generating interactive HTML reports with insights and visualizations.

## Features

- **Data Mining**: Extract code entities, financial entities, and file associations from source code repositories.
- **Entity Analysis**: Analyze code and financial entities to identify patterns, complexity, and key components.
- **Network Analysis**: Analyze relationships between entities to identify clusters, central nodes, and network metrics.
- **Insights Generation**: Generate insights from analyzed data to provide meaningful information about the codebase.
- **Visualization**: Create interactive D3.js visualizations of entity networks.
- **Report Generation**: Generate interactive HTML reports with insights and visualizations.

## Components

The Insights Generator consists of the following components:

- **DataMiner**: Extracts raw data from source code repositories.
- **EntityAnalyzer**: Analyzes code and financial entities.
- **NetworkAnalyzer**: Analyzes relationships between entities.
- **InsightsMiner**: Generates insights from analyzed data.
- **D3NetworkGenerator**: Creates D3.js visualizations of entity networks.
- **InteractiveHTMLGenerator**: Generates interactive HTML reports.

## Usage

### Command-Line Interface

The Insights Generator provides a command-line interface for generating insights:

```bash
python -m insights_generator <source_path> [options]
```

#### Options

- `--output-dir`, `-o`: Directory to save output files (default: `./output`)
- `--config`, `-c`: Path to configuration file
- `--report-type`, `-r`: Type of report to generate (`insights`, `network`, or `comprehensive`)
- `--verbose`, `-v`: Enable verbose output

### Python API

You can also use the Insights Generator as a Python library. Here's how to use it:

1. **Import the necessary modules**:
   Depending on how you've installed or included the package, you'll need to import the `generate_insights` function.

2. **Call the generate_insights function**:
   ```
   output_files = generate_insights(
       source_path="./my_repo",
       output_dir="./output",
       config={}
   )
   ```

3. **Access the generated reports**:
   ```
   insights_report_path = output_files["insights_report"]
   network_report_path = output_files["network_report"]
   comprehensive_report_path = output_files["comprehensive_report"]
   ```

4. **Use the reports**:
   You can open the reports in a web browser or process them further as needed.

## Installation

```bash
pip install insights-generator
```

## Configuration

The Insights Generator can be configured using a JSON configuration file:

```json
{
  "data_miner": {
    "max_files": 1000,
    "include_patterns": ["*.py", "*.js", "*.java"],
    "exclude_patterns": ["node_modules/*", "venv/*"]
  },
  "entity_analyzer": {
    "complexity_threshold": 0.7,
    "min_entity_importance": 0.5
  },
  "insights_miner": {
    "min_confidence": 70,
    "max_insights_per_type": 10
  },
  "network_analyzer": {
    "max_nodes": 100,
    "max_edges": 500
  },
  "d3_generator": {
    "width": 800,
    "height": 600,
    "colors": {
      "node": "#1f77b4",
      "link": "#999"
    }
  },
  "html_generator": {
    "title_prefix": "Insights Report - ",
    "include_navigation": true
  }
}
```

## Output

The Insights Generator creates the following output:

- **Data**: Raw data, analysis results, insights, and network analysis in JSON format.
- **Visualizations**: D3.js visualizations of entity networks in HTML format.
- **Reports**: Interactive HTML reports with insights and visualizations.

## Examples

### Basic Usage

```bash
python -m insights_generator ./my_repo
```

### Custom Output Directory

```bash
python -m insights_generator ./my_repo -o ./my_output
```

### Custom Configuration

```bash
python -m insights_generator ./my_repo -c ./my_config.json
```

### Generate Specific Report Type

```bash
python -m insights_generator ./my_repo -r insights
```

## License

MIT
