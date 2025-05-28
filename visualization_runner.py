"""
Visualization Runner Script

This script runs all visualizations from the three modules:
1. file_associations
2. financial-entity-analyzer
3. insights_generator

It handles errors by temporarily suspending problematic modules.
"""

import os
import sys
import subprocess
import webbrowser
import time
import glob
import signal
import threading
from pathlib import Path
from functools import partial

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Define paths to the modules
file_associations_dir = os.path.join(current_dir, "file_associations")
financial_entity_analyzer_dir = os.path.join(current_dir, "financial-entity-analyzer")
insights_generator_dir = os.path.join(current_dir, "insights_generator")

# Define paths to visualization outputs
file_associations_output_dir = os.path.join(file_associations_dir, "output")
visualization_outputs = []
1
def ensure_directory_exists(directory):
    """Ensure that a directory exists."""
    os.makedirs(directory, exist_ok=True)

def timeout_handler(signum, frame):
    """Handle timeout signal."""
    raise TimeoutError("Operation timed out")

def run_with_timeout(func, timeout=300, *args, **kwargs):
    """Run a function with a timeout.

    Args:
        func: The function to run
        timeout: Timeout in seconds (default: 300)
        *args: Arguments to pass to the function
        **kwargs: Keyword arguments to pass to the function

    Returns:
        The result of the function or None if it times out
    """
    result = [None]
    error = [None]

    def target():
        try:
            result[0] = func(*args, **kwargs)
        except Exception as e:
            error[0] = e

    thread = threading.Thread(target=target)
    thread.daemon = True
    thread.start()

    try:
        thread.join(timeout)
    except KeyboardInterrupt:
        print("Operation interrupted by user")
        return None, KeyboardInterrupt("Operation interrupted by user")

    if thread.is_alive():
        print(f"Operation timed out after {timeout} seconds")
        return None, TimeoutError(f"Operation timed out after {timeout} seconds")

    if error[0] is not None:
        return None, error[0]

    return result[0], None

def run_file_associations_visualizations(max_files=None, timeout=600, specific_dirs=None):
    """Run the file_associations module to generate visualizations.

    Args:
        max_files: Maximum number of files to analyze (None for all)
        timeout: Timeout in seconds (default: 600)
        specific_dirs: List of specific directories to analyze (None for all)
    """
    print("\n=== Running File Associations Visualizations ===")
    print(f"Timeout: {timeout} seconds")
    if max_files:
        print(f"Max files: {max_files}")
    if specific_dirs:
        print(f"Analyzing specific directories: {', '.join(specific_dirs)}")

    try:
        # Add the current directory to the Python path
        sys.path.insert(0, current_dir)

        # Import the file_associations module
        from file_associations.main import analyze_project_associations, FileAssociationTracker

        # Define a function to run with timeout
        def run_analysis():
            if max_files or specific_dirs:
                # Create a custom tracker with limited scope
                tracker = FileAssociationTracker(current_dir)

                # Limit the scope of analysis
                if specific_dirs:
                    # Convert relative paths to absolute paths
                    abs_dirs = [os.path.join(current_dir, d) if not os.path.isabs(d) else d for d in specific_dirs]
                    print(f"Analyzing directories: {abs_dirs}")

                    # Only analyze files in the specified directories
                    all_files = []
                    for directory in abs_dirs:
                        if os.path.exists(directory):
                            for root, _, files in os.walk(directory):
                                for file in files:
                                    all_files.append(os.path.join(root, file))

                    # Limit the number of files if max_files is specified
                    if max_files and len(all_files) > max_files:
                        all_files = all_files[:max_files]
                        print(f"Limiting analysis to {max_files} files")

                    # Analyze the selected files
                    # Check if the analyze_specific_files method exists
                    if hasattr(tracker, 'analyze_specific_files'):
                        tracker.analyze_specific_files(all_files)
                    else:
                        # Fallback: analyze the project with a file limit
                        print("analyze_specific_files method not available, using analyze_project with max_files instead")
                        tracker.analyze_project(max_files=max_files)
                else:
                    # Analyze the project with a file limit
                    tracker.analyze_project(max_files=max_files)

                return tracker.output_dir
            else:
                # Run the standard analysis
                return analyze_project_associations(current_dir, max_files=None)

        # Run the analysis with timeout
        output_dir, error = run_with_timeout(run_analysis, timeout)

        if error:
            if isinstance(error, TimeoutError):
                print(f"File associations analysis timed out after {timeout} seconds.")
                print("Try running with a smaller scope (max_files or specific_dirs).")
                # Check if any JSON files were generated before the timeout
                json_files = glob.glob(os.path.join(file_associations_output_dir, "*.json"))
                if json_files:
                    print(f"Partial analysis completed. {len(json_files)} JSON files were generated.")
                    # Find any HTML files that might have been generated
                    html_files = glob.glob(os.path.join(file_associations_output_dir, "*.html"))
                    if html_files:
                        print(f"Found {len(html_files)} HTML files generated before timeout:")
                        for html_file in html_files:
                            print(f"  - {html_file}")
                            visualization_outputs.append(html_file)
                        return True
                return False
            elif isinstance(error, KeyboardInterrupt):
                print("File associations analysis was interrupted by user.")
                # Check if any JSON files were generated before the interruption
                json_files = glob.glob(os.path.join(file_associations_output_dir, "*.json"))
                if json_files:
                    print(f"Partial analysis completed. {len(json_files)} JSON files were generated.")
                    # Find any HTML files that might have been generated
                    html_files = glob.glob(os.path.join(file_associations_output_dir, "*.html"))
                    if html_files:
                        print(f"Found {len(html_files)} HTML files generated before interruption:")
                        for html_file in html_files:
                            print(f"  - {html_file}")
                            visualization_outputs.append(html_file)
                        return True
                return False
            else:
                print(f"Error running file_associations visualizations: {str(error)}")
                # Check if any JSON files were generated before the error
                json_files = glob.glob(os.path.join(file_associations_output_dir, "*.json"))
                if json_files:
                    print(f"Partial analysis completed. {len(json_files)} JSON files were generated.")
                    # Find any HTML files that might have been generated
                    html_files = glob.glob(os.path.join(file_associations_output_dir, "*.html"))
                    if html_files:
                        print(f"Found {len(html_files)} HTML files generated before error:")
                        for html_file in html_files:
                            print(f"  - {html_file}")
                            visualization_outputs.append(html_file)
                        return True
                return False

        # Find the generated HTML files
        html_files = glob.glob(os.path.join(output_dir, "*.html"))

        if html_files:
            print(f"Generated {len(html_files)} HTML files:")
            for html_file in html_files:
                print(f"  - {html_file}")
                visualization_outputs.append(html_file)
        else:
            print("No HTML files were generated.")

        return True
    except Exception as e:
        print(f"Error running file_associations visualizations: {str(e)}")
        return False

def run_insights_generator_visualizations(timeout=300):
    """Run the insights_generator module to generate visualizations.

    Args:
        timeout: Timeout in seconds (default: 300)
    """
    print("\n=== Running Insights Generator Visualizations ===")
    print(f"Timeout: {timeout} seconds")

    try:
        # Add the current directory to the Python path
        sys.path.insert(0, current_dir)

        # Import the insights_generator module
        from insights_generator.main import generate_insights

        # Find the most recent file associations summary file
        summary_files = glob.glob(os.path.join(file_associations_output_dir, "file_associations_summary_*.json"))

        if not summary_files:
            print("No file associations summary files found. Run file_associations first.")
            return False

        # Get the most recent summary file
        latest_summary = max(summary_files, key=os.path.getctime)

        # Extract the timestamp from the summary file
        summary_filename = os.path.basename(latest_summary)
        timestamp_parts = summary_filename.split('_')
        if len(timestamp_parts) >= 3:
            date_part = timestamp_parts[-2]
            time_part = timestamp_parts[-1].split('.')[0]
            timestamp = f"{date_part}_{time_part}"
        else:
            import re
            match = re.search(r'(\d{8}_\d{6})', summary_filename)
            if match:
                timestamp = match.group(1)
            else:
                timestamp = summary_filename.split('_')[-1].split('.')[0]

        # Find the corresponding data files
        direct_imports_path = os.path.join(file_associations_output_dir, f"direct_imports_{timestamp}.json")
        common_ports_path = os.path.join(file_associations_output_dir, f"common_ports_{timestamp}.json")
        file_associations_path = os.path.join(file_associations_output_dir, f"file_associations_{timestamp}.json")

        # Check if the files exist
        if not os.path.exists(direct_imports_path):
            print(f"Warning: Direct imports file not found at {direct_imports_path}")
            direct_imports_path = None

        if not os.path.exists(common_ports_path):
            print(f"Warning: Common ports file not found at {common_ports_path}")
            common_ports_path = None

        if not os.path.exists(file_associations_path):
            print(f"Warning: File associations file not found at {file_associations_path}")
            file_associations_path = None

        # Define a function to run with timeout
        def run_insights():
            # Generate insights
            output_path = os.path.join(current_dir, f"insights_visualization_{timestamp}.html")
            return generate_insights(
                latest_summary,
                direct_imports_path,
                common_ports_path,
                file_associations_path,
                None,
                output_path
            )

        # Define the expected output path
        expected_output_path = os.path.join(current_dir, f"insights_visualization_{timestamp}.html")

        # Run the insights generation with timeout
        html_path, error = run_with_timeout(run_insights, timeout)

        if error:
            if isinstance(error, TimeoutError):
                print(f"Insights generation timed out after {timeout} seconds.")
                # Check if the HTML file was generated before the timeout
                if os.path.exists(expected_output_path):
                    print(f"Partial insights visualization was generated: {expected_output_path}")
                    visualization_outputs.append(expected_output_path)
                    return True
                return False
            elif isinstance(error, KeyboardInterrupt):
                print("Insights generation was interrupted by user.")
                # Check if the HTML file was generated before the interruption
                if os.path.exists(expected_output_path):
                    print(f"Partial insights visualization was generated: {expected_output_path}")
                    visualization_outputs.append(expected_output_path)
                    return True
                return False
            else:
                print(f"Error generating insights: {str(error)}")
                # Check if the HTML file was generated despite the error
                if os.path.exists(expected_output_path):
                    print(f"Partial insights visualization was generated: {expected_output_path}")
                    visualization_outputs.append(expected_output_path)
                    return True
                return False

        print(f"Generated insights visualization: {html_path}")
        visualization_outputs.append(html_path)

        return True
    except Exception as e:
        print(f"Error running insights_generator visualizations: {str(e)}")
        return False

def create_financial_entity_visualizations_html():
    """Create an HTML file that loads the financial-entity-analyzer visualizations."""
    print("\n=== Creating Financial Entity Analyzer Visualizations ===")

    try:
        # Create a directory for the output
        output_dir = os.path.join(current_dir, "financial_entity_visualizations")
        ensure_directory_exists(output_dir)

        # Copy the visualization JS files to the output directory
        visualization_files = [
            "calculation_flow_diagram.js",
            "parameter_influence_graph.js",
            "sensitivity_heat_map.js",
            "optimization_convergence_plot.js"
        ]

        for file in visualization_files:
            source_path = os.path.join(financial_entity_analyzer_dir, "visualizations", file)
            if os.path.exists(source_path):
                # Read the file content
                with open(source_path, 'r') as f:
                    content = f.read()

                # Extract the render function
                import re
                render_function_match = re.search(r'(export\s+)?function\s+render\w+\([^)]*\)\s*{', content)
                if render_function_match:
                    # Create a standalone version of the file
                    standalone_path = os.path.join(output_dir, file)
                    with open(standalone_path, 'w') as f:
                        # Remove export statements
                        modified_content = re.sub(r'export\s+', '', content)
                        # Remove import statements
                        modified_content = re.sub(r'import\s+.*?;', '', modified_content)
                        f.write(modified_content)
                    print(f"Created standalone version of {file}")

        # Create an HTML file that loads and runs the visualizations
        html_path = os.path.join(output_dir, "financial_entity_visualizations.html")
        with open(html_path, 'w') as f:
            f.write("""<!DOCTYPE html>
<html>
<head>
    <title>Financial Entity Analyzer Visualizations</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .visualization-section {
            margin-bottom: 40px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        h1, h2 {
            color: #333;
        }
        .visualization-container {
            height: 500px;
            border: 1px solid #eee;
            margin-top: 20px;
            overflow: auto;
        }
        .tabs {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-bottom: 20px;
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: 1px solid transparent;
        }
        .tab.active {
            border: 1px solid #ddd;
            border-bottom-color: white;
            border-radius: 5px 5px 0 0;
            margin-bottom: -1px;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Financial Entity Analyzer Visualizations</h1>

        <div class="tabs">
            <div class="tab active" data-tab="calculation-flow">Calculation Flow</div>
            <div class="tab" data-tab="parameter-influence">Parameter Influence</div>
            <div class="tab" data-tab="sensitivity">Sensitivity Analysis</div>
            <div class="tab" data-tab="optimization">Optimization Paths</div>
        </div>

        <div class="tab-content active" id="calculation-flow">
            <div class="visualization-section">
                <h2>Calculation Flow Diagram</h2>
                <div id="calculation-flow-container" class="visualization-container"></div>
            </div>
        </div>

        <div class="tab-content" id="parameter-influence">
            <div class="visualization-section">
                <h2>Parameter Influence Graph</h2>
                <div id="parameter-influence-container" class="visualization-container"></div>
            </div>
        </div>

        <div class="tab-content" id="sensitivity">
            <div class="visualization-section">
                <h2>Sensitivity Heat Map</h2>
                <div id="sensitivity-container" class="visualization-container"></div>
            </div>
        </div>

        <div class="tab-content" id="optimization">
            <div class="visualization-section">
                <h2>Optimization Convergence Plot</h2>
                <div id="optimization-container" class="visualization-container"></div>
            </div>
        </div>
    </div>

    <!-- Load D3.js -->
    <script src="https://d3js.org/d3.v7.min.js"></script>

    <!-- Load the visualization scripts -->
    <script src="calculation_flow_diagram.js"></script>
    <script src="parameter_influence_graph.js"></script>
    <script src="sensitivity_heat_map.js"></script>
    <script src="optimization_convergence_plot.js"></script>

    <script>
        // Sample data for visualizations
        const sampleCalculationFlowData = {
            calculationBlocks: {
                revenue: [{ name: 'Revenue Calculation', formula: 'units_sold * price_per_unit' }],
                costs: [{ name: 'Cost Calculation', formula: 'fixed_costs + (units_sold * variable_cost_per_unit)' }],
                profit: [{ name: 'Profit Calculation', formula: 'revenue - costs - depreciation' }],
                taxes: [{ name: 'Tax Calculation', formula: 'profit * tax_rate' }],
                cashFlow: [{ name: 'Cash Flow Calculation', formula: 'net_profit + depreciation' }],
                npv: [{ name: 'NPV Calculation', formula: 'sum(cash_flows / (1 + discount_rate)^i)' }]
            },
            iterativeProcesses: [
                { name: 'Price Optimization', steps: ['Calculate NPV', 'Adjust Price', 'Recalculate NPV'] }
            ],
            financialMetrics: [
                { name: 'NPV', description: 'Net Present Value' },
                { name: 'IRR', description: 'Internal Rate of Return' }
            ]
        };

        const sampleParameterDependenciesData = {
            parameters: [
                ['price_per_unit', { type: 'input' }],
                ['units_sold', { type: 'input' }],
                ['fixed_costs', { type: 'input' }],
                ['variable_cost_per_unit', { type: 'input' }],
                ['discount_rate', { type: 'input' }],
                ['tax_rate', { type: 'input' }],
                ['revenue', { type: 'calculated' }],
                ['costs', { type: 'calculated' }],
                ['profit', { type: 'calculated' }],
                ['taxes', { type: 'calculated' }],
                ['net_profit', { type: 'calculated' }],
                ['cash_flows', { type: 'calculated' }],
                ['npv', { type: 'output' }],
                ['irr', { type: 'output' }]
            ],
            dependencies: [
                { source: 'price_per_unit', target: 'revenue', weight: 1 },
                { source: 'units_sold', target: 'revenue', weight: 1 },
                { source: 'units_sold', target: 'costs', weight: 1 },
                { source: 'fixed_costs', target: 'costs', weight: 1 },
                { source: 'variable_cost_per_unit', target: 'costs', weight: 1 },
                { source: 'revenue', target: 'profit', weight: 1 },
                { source: 'costs', target: 'profit', weight: 1 },
                { source: 'profit', target: 'taxes', weight: 1 },
                { source: 'tax_rate', target: 'taxes', weight: 1 },
                { source: 'profit', target: 'net_profit', weight: 1 },
                { source: 'taxes', target: 'net_profit', weight: 1 },
                { source: 'net_profit', target: 'cash_flows', weight: 1 },
                { source: 'cash_flows', target: 'npv', weight: 1 },
                { source: 'discount_rate', target: 'npv', weight: 1 },
                { source: 'cash_flows', target: 'irr', weight: 1 }
            ]
        };

        const sampleSensitivityData = {
            parameters: [
                { name: 'price_per_unit', type: 'input' },
                { name: 'units_sold', type: 'input' },
                { name: 'fixed_costs', type: 'input' },
                { name: 'variable_cost_per_unit', type: 'input' },
                { name: 'discount_rate', type: 'input' },
                { name: 'tax_rate', type: 'input' }
            ],
            metrics: [
                { name: 'NPV', description: 'Net Present Value' },
                { name: 'IRR', description: 'Internal Rate of Return' },
                { name: 'Profit', description: 'Annual Profit' }
            ]
        };

        const sampleOptimizationData = createSampleOptimizationData();

        // Initialize tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and content
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                document.getElementById(tab.getAttribute('data-tab')).classList.add('active');

                // Render the visualization for the active tab
                const tabId = tab.getAttribute('data-tab');
                if (tabId === 'calculation-flow') {
                    renderCalculationFlowDiagram(
                        document.getElementById('calculation-flow-container'),
                        sampleCalculationFlowData,
                        { onNodeClick: node => console.log('Clicked node:', node) }
                    );
                } else if (tabId === 'parameter-influence') {
                    renderParameterInfluenceGraph(
                        document.getElementById('parameter-influence-container'),
                        sampleParameterDependenciesData,
                        { onNodeClick: node => console.log('Clicked node:', node) }
                    );
                } else if (tabId === 'sensitivity') {
                    renderSensitivityHeatMap(
                        document.getElementById('sensitivity-container'),
                        sampleSensitivityData,
                        { onCellClick: cell => console.log('Clicked cell:', cell) }
                    );
                } else if (tabId === 'optimization') {
                    renderOptimizationConvergencePlot(
                        document.getElementById('optimization-container'),
                        sampleOptimizationData,
                        { onPointClick: point => console.log('Clicked point:', point) }
                    );
                }
            });
        });

        // Initialize the first tab
        renderCalculationFlowDiagram(
            document.getElementById('calculation-flow-container'),
            sampleCalculationFlowData,
            { onNodeClick: node => console.log('Clicked node:', node) }
        );
    </script>
</body>
</html>""")

        print(f"Created financial entity visualizations HTML: {html_path}")
        visualization_outputs.append(html_path)

        return True
    except Exception as e:
        print(f"Error creating financial entity visualizations: {str(e)}")
        return False

def create_tensor_capacity_visualization():
    """Create the tensor-based 3D capacity space visualization."""
    print("\n=== Creating Tensor-Based 3D Capacity Space Visualization ===")

    try:
        # Create a directory for the output
        output_dir = os.path.join(current_dir, "capacity_visualizations")
        ensure_directory_exists(output_dir)

        # The HTML file was already created separately
        html_path = os.path.join(output_dir, "tensor_capacity_visualization.html")

        # Check if the file exists
        if os.path.exists(html_path):
            print(f"Using existing tensor capacity visualization: {html_path}")
            visualization_outputs.append(html_path)
            return True
        else:
            print(f"Error: Tensor capacity visualization file not found at {html_path}")
            return False
    except Exception as e:
        print(f"Error creating tensor capacity visualization: {str(e)}")
        return False

def create_visualization_index():
    """Create an index HTML file that links to all visualizations."""
    print("\n=== Creating Visualization Index ===")

    try:
        # Create the index HTML file
        index_path = os.path.join(current_dir, "visualization_index.html")
        with open(index_path, 'w') as f:
            f.write("""<!DOCTYPE html>
<html>
<head>
    <title>Visualization Index</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1, h2 {
            color: #333;
        }
        .visualization-section {
            margin-bottom: 30px;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        li {
            margin-bottom: 10px;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Visualization Index</h1>

        <div class="visualization-section">
            <h2>Available Visualizations</h2>
            <ul>
""")

            # Add links to all visualizations
            for i, path in enumerate(visualization_outputs):
                rel_path = os.path.relpath(path, current_dir)
                filename = os.path.basename(path)
                f.write(f'                <li><a href="{rel_path}" target="_blank">{i+1}. {filename}</a></li>\n')

            f.write("""            </ul>
        </div>
    </div>
</body>
</html>""")

        print(f"Created visualization index: {index_path}")
        return index_path
    except Exception as e:
        print(f"Error creating visualization index: {str(e)}")
        return None

def open_browser(path):
    """Open a file in the default web browser."""
    try:
        webbrowser.open(f"file://{os.path.abspath(path)}")
        return True
    except Exception as e:
        print(f"Error opening browser: {str(e)}")
        return False

def parse_args():
    """Parse command-line arguments."""
    import argparse

    parser = argparse.ArgumentParser(description='Run visualizations from three modules: file_associations, insights_generator, and financial-entity-analyzer.')

    # General options
    parser.add_argument('--non-interactive', action='store_true', help='Run in non-interactive mode with default or specified options')

    # Module selection
    parser.add_argument('--skip-file-associations', action='store_true', help='Skip the file_associations module')
    parser.add_argument('--skip-insights-generator', action='store_true', help='Skip the insights_generator module')
    parser.add_argument('--skip-financial-entity', action='store_true', help='Skip the financial-entity-analyzer module')

    # file_associations options
    parser.add_argument('--fa-max-files', type=int, default=100, help='Maximum number of files to analyze in file_associations (default: 100)')
    parser.add_argument('--fa-timeout', type=int, default=600, help='Timeout in seconds for file_associations (default: 600)')
    parser.add_argument('--fa-dirs', type=str, help='Comma-separated list of directories to analyze in file_associations')

    # insights_generator options
    parser.add_argument('--ig-timeout', type=int, default=300, help='Timeout in seconds for insights_generator (default: 300)')

    return parser.parse_args()

def main():
    """Main function to run all visualizations."""
    print("=== Visualization Runner ===")
    print("This script will run all visualizations from the three modules.")
    print("If a module fails, it will be skipped and the script will continue with the next module.")

    # Parse command-line arguments
    args = parse_args()

    # Check if running in non-interactive mode
    non_interactive = args.non_interactive

    # Create output directories
    ensure_directory_exists(file_associations_output_dir)

    # Determine which modules to run
    if non_interactive:
        # Use command-line arguments
        run_file_assoc = not args.skip_file_associations
        run_insights = not args.skip_insights_generator
        run_financial = not args.skip_financial_entity

        print("\nRunning in non-interactive mode with the following modules:")
        print(f"- file_associations: {'Yes' if run_file_assoc else 'No'}")
        print(f"- insights_generator: {'Yes' if run_insights else 'No'}")
        print(f"- financial-entity-analyzer: {'Yes' if run_financial else 'No'}")
    else:
        # Ask which modules to run
        print("\nWhich modules would you like to run?")
        run_file_assoc = input("Run file_associations module? (y/n, default: y): ").lower() != 'n'
        run_insights = input("Run insights_generator module? (y/n, default: y): ").lower() != 'n'
        run_financial = input("Run financial-entity-analyzer module? (y/n, default: y): ").lower() != 'n'

    # Run selected modules
    file_associations_success = False
    insights_generator_success = False
    financial_entity_success = False

    # Configure file_associations module if selected
    if run_file_assoc:
        if non_interactive:
            # Use command-line arguments
            max_files = args.fa_max_files
            timeout = args.fa_timeout
            specific_dirs = None
            if args.fa_dirs:
                specific_dirs = [d.strip() for d in args.fa_dirs.split(',')]

            print("\n=== File Associations Configuration (Non-Interactive) ===")
            print(f"Max files: {max_files}")
            print(f"Timeout: {timeout} seconds")
            if specific_dirs:
                print(f"Specific directories: {', '.join(specific_dirs)}")

            # Run with command-line options
            file_associations_success = run_file_associations_visualizations(
                max_files=max_files,
                timeout=timeout,
                specific_dirs=specific_dirs
            )
        else:
            print("\n=== File Associations Configuration ===")
            print("The file_associations module can analyze the entire project or a limited scope.")
            print("For large projects, limiting the scope is recommended to avoid timeouts.")

            # Ask for configuration options
            use_limited_scope = input("Limit the scope of analysis? (y/n, default: y): ").lower() != 'n'

            if use_limited_scope:
                # Get max files
                max_files_input = input("Maximum number of files to analyze (default: 100): ").strip()
                max_files = int(max_files_input) if max_files_input.isdigit() else 100

                # Get timeout
                timeout_input = input("Timeout in seconds (default: 600): ").strip()
                timeout = int(timeout_input) if timeout_input.isdigit() else 600

                # Get specific directories
                use_specific_dirs = input("Analyze specific directories? (y/n, default: n): ").lower() == 'y'
                specific_dirs = None

                if use_specific_dirs:
                    dirs_input = input("Enter comma-separated list of directories to analyze: ").strip()
                    if dirs_input:
                        specific_dirs = [d.strip() for d in dirs_input.split(',')]

                # Run with limited scope
                file_associations_success = run_file_associations_visualizations(
                    max_files=max_files,
                    timeout=timeout,
                    specific_dirs=specific_dirs
                )
            else:
                # Run with default settings
                timeout_input = input("Timeout in seconds (default: 600): ").strip()
                timeout = int(timeout_input) if timeout_input.isdigit() else 600
                file_associations_success = run_file_associations_visualizations(timeout=timeout)
    else:
        print("\nSkipping file_associations module.")

    # Configure insights_generator module if selected
    if run_insights:
        if not file_associations_success and not glob.glob(os.path.join(file_associations_output_dir, "*.json")):
            print("\nSkipping insights_generator module because file_associations did not generate any data.")
            run_insights = False
        else:
            if non_interactive:
                # Use command-line arguments
                timeout = args.ig_timeout
                print("\n=== Insights Generator Configuration (Non-Interactive) ===")
                print(f"Timeout: {timeout} seconds")
                insights_generator_success = run_insights_generator_visualizations(timeout=timeout)
            else:
                print("\n=== Insights Generator Configuration ===")
                timeout_input = input("Timeout in seconds (default: 300): ").strip()
                timeout = int(timeout_input) if timeout_input.isdigit() else 300
                insights_generator_success = run_insights_generator_visualizations(timeout=timeout)
    else:
        print("\nSkipping insights_generator module.")

    # Run financial-entity-analyzer module if selected
    if run_financial:
        print("\n=== Financial Entity Analyzer Configuration ===")
        financial_entity_success = create_financial_entity_visualizations_html()
    else:
        print("\nSkipping financial-entity-analyzer module.")

    # Run tensor capacity visualization
    print("\n=== Tensor Capacity Visualization Configuration ===")
    tensor_capacity_success = create_tensor_capacity_visualization()

    # Create visualization index if any visualizations were generated
    if visualization_outputs:
        index_path = create_visualization_index()

        # Print summary
        print("\n=== Visualization Summary ===")
        if run_file_assoc:
            print(f"File Associations: {'Success' if file_associations_success else 'Failed'}")
        if run_insights:
            print(f"Insights Generator: {'Success' if insights_generator_success else 'Failed'}")
        if run_financial:
            print(f"Financial Entity Analyzer: {'Success' if financial_entity_success else 'Failed'}")
        print(f"Tensor Capacity Visualization: {'Success' if tensor_capacity_success else 'Failed'}")

        # Open the index in a browser
        if index_path:
            print("\nOpening visualization index in browser...")
            open_browser(index_path)
    else:
        print("\nNo visualizations were generated.")

    print("\nDone!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nVisualization runner was interrupted by user.")
        print("Any partial results may still be available in the output directories.")
        print("Done!")
