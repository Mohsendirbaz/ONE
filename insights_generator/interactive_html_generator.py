"""
Interactive HTML Generator Module

This module provides the InteractiveHTMLGenerator class for generating an interactive
HTML output from the insights data. It uses D3.js for network visualizations and
provides a responsive, searchable interface with multiple visualization modes.
"""

import os
import json
from typing import Dict, List, Any, Union, Optional
from os import PathLike
from datetime import datetime

from .d3_network_generator import D3NetworkGenerator


class InteractiveHTMLGenerator:
    """Class for generating interactive HTML output from insights data."""

    def __init__(self, insights: Dict[str, Any]):
        """
        Initialize the interactive HTML generator.

        Args:
            insights: The insights data to generate HTML from
        """
        self.insights = insights
        self.project_name = insights.get("project_name", "Unknown Project")
        self.analysis_date = insights.get("analysis_date", "Unknown Date")
        self.d3_generator = D3NetworkGenerator(insights)

    def generate_html(self, output_path: Union[str, PathLike]) -> str:
        """
        Generate an interactive HTML file from the insights data.

        Args:
            output_path: Path where the output HTML file will be saved

        Returns:
            The path to the created HTML file
        """
        # Create the HTML content
        html_content = self._create_html_content()

        # Write the HTML file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return str(output_path)

    def _create_html_content(self) -> str:
        """
        Create the HTML content from the insights data.

        Returns:
            The HTML content as a string
        """
        # Generate D3.js visualizations
        visualizations = self.d3_generator.generate_all_visualizations()

        # Create the HTML structure
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{self.project_name} - Code Insights</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {{
            padding-top: 60px;
            padding-bottom: 40px;
        }}
        .sidebar {{
            position: fixed;
            top: 60px;
            bottom: 0;
            left: 0;
            z-index: 100;
            padding: 20px 0;
            overflow-x: hidden;
            overflow-y: auto;
            background-color: #f8f9fa;
        }}
        .nav-link {{
            color: #495057;
        }}
        .nav-link.active {{
            color: #007bff;
            font-weight: bold;
        }}
        .card {{
            margin-bottom: 20px;
        }}
        .search-container {{
            margin-bottom: 20px;
        }}
        .chart-container {{
            height: 300px;
            margin-bottom: 20px;
        }}
        .table-responsive {{
            max-height: 400px;
            overflow-y: auto;
        }}
        .hidden {{
            display: none;
        }}
        .network-container {{
            width: 100%;
            height: 600px;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }}
        .network-controls {{
            margin-bottom: 10px;
        }}
        .node {{
            cursor: pointer;
        }}
        .link {{
            pointer-events: none;
        }}
        .details-container {{
            margin-top: 20px;
        }}
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">{self.project_name} - Code Insights</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <span class="navbar-text">Analysis Date: {self.analysis_date}</span>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <nav class="col-md-3 col-lg-2 d-md-block sidebar">
                <div class="position-sticky">
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link active" href="#overview">
                                <i class="bi bi-house"></i> Overview
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#network-analysis">
                                <i class="bi bi-diagram-3"></i> Network Analysis
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#directory-structure">
                                <i class="bi bi-folder"></i> Directory Structure
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#circular-dependencies">
                                <i class="bi bi-arrow-repeat"></i> Circular Dependencies
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#python-insights">
                                <i class="bi bi-code-square"></i> Python Insights
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#recommendations">
                                <i class="bi bi-lightbulb"></i> Recommendations
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#search">
                                <i class="bi bi-search"></i> Search
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>

            <!-- Main content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                {self._create_overview_section()}
                {self._create_network_analysis_section()}
                {self._create_directory_structure_section()}
                {self._create_circular_dependencies_section()}
                {self._create_python_insights_section()}
                {self._create_recommendations_section()}
                {self._create_search_section()}
            </main>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {{
            link.addEventListener('click', function(e) {{
                // Remove active class from all links
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

                // Add active class to clicked link
                this.classList.add('active');

                // Hide all sections
                document.querySelectorAll('main > section').forEach(section => {{
                    section.classList.add('hidden');
                }});

                // Show the target section
                const targetId = this.getAttribute('href').substring(1);
                document.getElementById(targetId).classList.remove('hidden');
            }});
        }});

        // Initialize: show only the overview section
        document.querySelectorAll('main > section').forEach(section => {{
            if (section.id !== 'overview') {{
                section.classList.add('hidden');
            }}
        }});

        // Search functionality
        document.getElementById('search-input').addEventListener('input', function() {{
            const searchTerm = this.value.toLowerCase();
            const resultsContainer = document.getElementById('search-results');
            resultsContainer.innerHTML = '';

            if (searchTerm.length < 3) {{
                resultsContainer.innerHTML = '<p>Enter at least 3 characters to search</p>';
                return;
            }}

            // Search in files
            const fileResults = searchInFiles(searchTerm);

            // Search in entities
            const entityResults = searchInEntities(searchTerm);

            // Display results
            if (fileResults.length === 0 && entityResults.length === 0) {{
                resultsContainer.innerHTML = '<p>No results found</p>';
            }} else {{
                // Display file results
                if (fileResults.length > 0) {{
                    const fileResultsHtml = `
                        <h5>Files (${{fileResults.length}} results)</h5>
                        <ul class="list-group mb-3">
                            ${{fileResults.map(file => `
                                <li class="list-group-item">
                                    <i class="bi bi-file-code"></i> ${{file}}
                                </li>
                            `).join('')}}
                        </ul>
                    `;
                    resultsContainer.innerHTML += fileResultsHtml;
                }}

                // Display entity results
                if (entityResults.length > 0) {{
                    const entityResultsHtml = `
                        <h5>Entities (${{entityResults.length}} results)</h5>
                        <ul class="list-group">
                            ${{entityResults.map(entity => `
                                <li class="list-group-item">
                                    <i class="bi bi-code-square"></i> ${{entity.entity}}
                                    <small class="text-muted">
                                        (Defined in ${{entity.defined_in_count}} files, Used in ${{entity.used_in_count}} files)
                                    </small>
                                </li>
                            `).join('')}}
                        </ul>
                    `;
                    resultsContainer.innerHTML += entityResultsHtml;
                }}
            }}
        }});

        // Search in files
        function searchInFiles(searchTerm) {{
            const fileInsights = {json.dumps(self.insights.get("file_insights", {}))};
            const results = [];

            // Search in most imported files
            if (fileInsights.most_imported_files) {{
                fileInsights.most_imported_files.forEach(file => {{
                    if (file.file.toLowerCase().includes(searchTerm)) {{
                        results.push(file.file);
                    }}
                }});
            }}

            // Search in most importing files
            if (fileInsights.most_importing_files) {{
                fileInsights.most_importing_files.forEach(file => {{
                    if (file.file.toLowerCase().includes(searchTerm)) {{
                        if (!results.includes(file.file)) {{
                            results.push(file.file);
                        }}
                    }}
                }});
            }}

            return results;
        }}

        // Search in entities
        function searchInEntities(searchTerm) {{
            const entityInsights = {json.dumps(self.insights.get("entity_insights", {}))};
            const results = [];

            // Search in most used entities
            if (entityInsights.most_used_entities) {{
                entityInsights.most_used_entities.forEach(entity => {{
                    if (entity.entity.toLowerCase().includes(searchTerm)) {{
                        results.push(entity);
                    }}
                }});
            }}

            return results;
        }}

        // D3.js visualizations
        {visualizations.get("force_directed_graph", "")}

        {visualizations.get("hierarchical_directory", "")}

        {visualizations.get("circular_dependencies", "")}
    </script>
</body>
</html>"""

        return html

    def _create_overview_section(self) -> str:
        """
        Create the overview section of the HTML content.

        Returns:
            The HTML content for the overview section
        """
        directory_insights = self.insights.get("directory_insights", {})
        file_insights = self.insights.get("file_insights", {})
        entity_insights = self.insights.get("entity_insights", {})
        network_insights = self.insights.get("network_insights", {})
        python_insights = self.insights.get("python_insights", {})

        total_files = directory_insights.get("total_files", 0)
        total_directories = directory_insights.get("total_directories", 0)
        python_file_count = python_insights.get("python_file_count", 0)
        circular_dependencies = network_insights.get("circular_dependencies", [])

        return f"""
        <section id="overview">
            <h2 class="mt-4 mb-4">Overview</h2>

            <div class="row">
                <div class="col-md-6 col-lg-3">
                    <div class="card text-white bg-primary">
                        <div class="card-body">
                            <h5 class="card-title">Total Files</h5>
                            <p class="card-text display-4">{total_files}</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 col-lg-3">
                    <div class="card text-white bg-success">
                        <div class="card-body">
                            <h5 class="card-title">Total Directories</h5>
                            <p class="card-text display-4">{total_directories}</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 col-lg-3">
                    <div class="card text-white bg-info">
                        <div class="card-body">
                            <h5 class="card-title">Python Files</h5>
                            <p class="card-text display-4">{python_file_count}</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 col-lg-3">
                    <div class="card text-white {len(circular_dependencies) > 0 and 'bg-danger' or 'bg-warning'}">
                        <div class="card-body">
                            <h5 class="card-title">Circular Dependencies</h5>
                            <p class="card-text display-4">{len(circular_dependencies)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Project Summary</h5>
                        </div>
                        <div class="card-body">
                            <p>This report provides insights into the codebase of <strong>{self.project_name}</strong>.</p>
                            <p>The analysis was performed on <strong>{self.analysis_date}</strong>.</p>
                            <p>Use the navigation menu on the left to explore different types of insights.</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Key Findings</h5>
                        </div>
                        <div class="card-body">
                            <ul>
                                <li>The project contains <strong>{total_files}</strong> files in <strong>{total_directories}</strong> directories.</li>
                                <li>There are <strong>{python_file_count}</strong> Python files in the project.</li>
                                <li>The most common entity type is <strong>{next(iter(entity_insights.get("entity_types", {"Unknown": 0})), "Unknown")}</strong>.</li>
                                <li>There are <strong>{len(circular_dependencies)}</strong> circular dependencies in the codebase.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """

    def _create_network_analysis_section(self) -> str:
        """
        Create the network analysis section of the HTML content.

        Returns:
            The HTML content for the network analysis section
        """
        network_insights = self.insights.get("network_insights", {})
        bottlenecks = network_insights.get("bottlenecks", [])

        bottlenecks_html = ""
        for i, bottleneck in enumerate(bottlenecks[:5]):
            bottlenecks_html += f"""
            <tr>
                <td>{i + 1}</td>
                <td>{bottleneck.get("file", "Unknown")}</td>
                <td>{bottleneck.get("betweenness", 0):.4f}</td>
            </tr>
            """

        return f"""
        <section id="network-analysis">
            <h2 class="mt-4 mb-4">Network Analysis</h2>

            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">File Relationship Network</h5>
                        </div>
                        <div class="card-body">
                            <div class="network-controls" id="network-controls">
                                <!-- Controls will be added by D3.js -->
                            </div>
                            <div class="network-container">
                                <svg id="network-graph" width="100%" height="100%"></svg>
                            </div>
                            <div class="details-container" id="file-details">
                                <!-- File details will be shown here -->
                                <p>Click on a node to see details</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Bottleneck Files</h5>
                        </div>
                        <div class="card-body">
                            <p>These files have high betweenness centrality and may represent bottlenecks in the codebase.</p>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>File</th>
                                            <th>Betweenness Centrality</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bottlenecks_html}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """

    def _create_directory_structure_section(self) -> str:
        """
        Create the directory structure section of the HTML content.

        Returns:
            The HTML content for the directory structure section
        """
        directory_insights = self.insights.get("directory_insights", {})
        largest_directories = directory_insights.get("largest_directories", [])

        largest_directories_html = ""
        for i, directory in enumerate(largest_directories[:5]):
            largest_directories_html += f"""
            <tr>
                <td>{i + 1}</td>
                <td>{directory.get("name", "Unknown")}</td>
                <td>{directory.get("path", "Unknown")}</td>
                <td>{directory.get("file_count", 0)}</td>
                <td>{directory.get("subdirectory_count", 0)}</td>
            </tr>
            """

        return f"""
        <section id="directory-structure">
            <h2 class="mt-4 mb-4">Directory Structure</h2>

            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Directory Hierarchy</h5>
                        </div>
                        <div class="card-body">
                            <div class="network-controls" id="directory-controls">
                                <!-- Controls will be added by D3.js -->
                            </div>
                            <div class="network-container">
                                <svg id="directory-graph" width="100%" height="100%"></svg>
                            </div>
                            <div class="details-container" id="directory-details">
                                <!-- Directory details will be shown here -->
                                <p>Click on a node to see details</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Largest Directories</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Path</th>
                                            <th>Files</th>
                                            <th>Subdirectories</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {largest_directories_html}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """

    def _create_circular_dependencies_section(self) -> str:
        """
        Create the circular dependencies section of the HTML content.

        Returns:
            The HTML content for the circular dependencies section
        """
        return f"""
        <section id="circular-dependencies">
            <h2 class="mt-4 mb-4">Circular Dependencies</h2>

            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Circular Dependencies</h5>
                        </div>
                        <div class="card-body">
                            <p>Circular dependencies occur when two or more files depend on each other, creating a cycle in the dependency graph. These can lead to maintenance issues and should be refactored.</p>
                            <div id="circular-dependencies">
                                <!-- Circular dependencies will be shown here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """

    def _create_python_insights_section(self) -> str:
        """
        Create the Python insights section of the HTML content.

        Returns:
            The HTML content for the Python insights section
        """
        python_insights = self.insights.get("python_insights", {})
        python_file_count = python_insights.get("python_file_count", 0)
        python_module_count = python_insights.get("python_module_count", 0)
        python_package_count = python_insights.get("python_package_count", 0)
        circular_imports = python_insights.get("circular_imports", [])

        circular_imports_html = ""
        for i, cycle in enumerate(circular_imports[:5]):
            cycle_text = " → ".join(cycle) + " → " + cycle[0]
            circular_imports_html += f"""
            <li class="list-group-item">
                <strong>Cycle {i + 1}:</strong> {cycle_text}
            </li>
            """

        if not circular_imports_html:
            circular_imports_html = """
            <li class="list-group-item">
                No circular imports detected.
            </li>
            """

        return f"""
        <section id="python-insights">
            <h2 class="mt-4 mb-4">Python Insights</h2>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Python Statistics</h5>
                        </div>
                        <div class="card-body">
                            <ul class="list-group">
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Python Files
                                    <span class="badge bg-primary rounded-pill">{python_file_count}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Python Modules
                                    <span class="badge bg-primary rounded-pill">{python_module_count}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Python Packages
                                    <span class="badge bg-primary rounded-pill">{python_package_count}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    Circular Imports
                                    <span class="badge bg-danger rounded-pill">{len(circular_imports)}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Circular Imports</h5>
                        </div>
                        <div class="card-body">
                            <ul class="list-group">
                                {circular_imports_html}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """

    def _create_recommendations_section(self) -> str:
        """
        Create the recommendations section of the HTML content.

        Returns:
            The HTML content for the recommendations section
        """
        recommendation_insights = self.insights.get("recommendation_insights", {})
        code_smells = recommendation_insights.get("code_smells", [])
        modularization_opportunities = recommendation_insights.get("modularization_opportunities", [])

        code_smells_html = ""
        for i, smell in enumerate(code_smells):
            code_smells_html += f"""
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="card-title">{smell.get("type", "Unknown").replace("_", " ").title()}</h5>
                </div>
                <div class="card-body">
                    <p>{smell.get("description", "")}</p>
                    <p><strong>Recommendation:</strong> {smell.get("recommendation", "")}</p>
                </div>
            </div>
            """

        if not code_smells_html:
            code_smells_html = """
            <div class="card mb-3">
                <div class="card-body">
                    <p>No code smells detected.</p>
                </div>
            </div>
            """

        modularization_html = ""
        for i, opportunity in enumerate(modularization_opportunities):
            modularization_html += f"""
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="card-title">{opportunity.get("description", "Unknown")}</h5>
                </div>
                <div class="card-body">
                    <p><strong>Recommendation:</strong> {opportunity.get("recommendation", "")}</p>
                </div>
            </div>
            """

        if not modularization_html:
            modularization_html = """
            <div class="card mb-3">
                <div class="card-body">
                    <p>No modularization opportunities detected.</p>
                </div>
            </div>
            """

        return f"""
        <section id="recommendations">
            <h2 class="mt-4 mb-4">Recommendations</h2>

            <div class="row">
                <div class="col-md-6">
                    <h3>Code Smells</h3>
                    {code_smells_html}
                </div>

                <div class="col-md-6">
                    <h3>Modularization Opportunities</h3>
                    {modularization_html}
                </div>
            </div>
        </section>
        """

    def _create_search_section(self) -> str:
        """
        Create the search section of the HTML content.

        Returns:
            The HTML content for the search section
        """
        return """
        <section id="search">
            <h2 class="mt-4 mb-4">Search</h2>

            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Search Files and Entities</h5>
                        </div>
                        <div class="card-body">
                            <div class="search-container">
                                <div class="input-group mb-3">
                                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                                    <input type="text" id="search-input" class="form-control" placeholder="Search for files or entities...">
                                </div>
                            </div>
                            <div id="search-results">
                                <p>Enter at least 3 characters to search</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """
