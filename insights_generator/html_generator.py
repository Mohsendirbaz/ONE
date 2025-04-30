"""
HTML Generator Module

This module provides functions for generating HTML output from the insights data.
It creates a responsive, searchable interface with visualization components for
relationships and filtering capabilities.
"""

import os
import json
from typing import Dict, List, Any, Union, Optional
from os import PathLike
from datetime import datetime


class HTMLGenerator:
    """Class for generating HTML output from insights data."""

    def __init__(self, insights: Dict[str, Any]):
        """
        Initialize the HTML generator.

        Args:
            insights: The insights data to generate HTML from
        """
        self.insights = insights
        self.project_name = insights.get("project_name", "Unknown Project")
        self.analysis_date = insights.get("analysis_date", "Unknown Date")

    def generate_html(self, output_path: Union[str, PathLike]) -> str:
        """
        Generate an HTML file from the insights data.

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
        # Create the HTML structure
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{self.project_name} - Code Insights</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">
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
                            <a class="nav-link" href="#directory-insights">
                                <i class="bi bi-folder"></i> Directory Insights
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#file-insights">
                                <i class="bi bi-file-code"></i> File Insights
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#entity-insights">
                                <i class="bi bi-code-square"></i> Entity Insights
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#relationship-insights">
                                <i class="bi bi-diagram-3"></i> Relationship Insights
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
                {self._create_directory_insights_section()}
                {self._create_file_insights_section()}
                {self._create_entity_insights_section()}
                {self._create_relationship_insights_section()}
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

        // Initialize charts
        document.addEventListener('DOMContentLoaded', function() {{
            // Initialize file types chart
            const fileTypesCtx = document.getElementById('file-types-chart').getContext('2d');
            const fileTypesData = {json.dumps(self.insights.get("file_insights", {}).get("file_types", {}))};

            new Chart(fileTypesCtx, {{
                type: 'pie',
                data: {{
                    labels: Object.keys(fileTypesData),
                    datasets: [{{
                        data: Object.values(fileTypesData),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                            '#FF9F40', '#C9CBCF', '#7CFC00', '#00FFFF', '#FF00FF'
                        ]
                    }}]
                }},
                options: {{
                    responsive: true,
                    plugins: {{
                        legend: {{
                            position: 'right',
                        }},
                        title: {{
                            display: true,
                            text: 'File Types Distribution'
                        }}
                    }}
                }}
            }});

            // Initialize entity types chart
            const entityTypesCtx = document.getElementById('entity-types-chart').getContext('2d');
            const entityTypesData = {json.dumps(self.insights.get("entity_insights", {}).get("entity_types", {}))};

            new Chart(entityTypesCtx, {{
                type: 'bar',
                data: {{
                    labels: Object.keys(entityTypesData),
                    datasets: [{{
                        label: 'Count',
                        data: Object.values(entityTypesData),
                        backgroundColor: '#36A2EB'
                    }}]
                }},
                options: {{
                    responsive: true,
                    plugins: {{
                        legend: {{
                            display: false
                        }},
                        title: {{
                            display: true,
                            text: 'Entity Types Distribution'
                        }}
                    }},
                    scales: {{
                        y: {{
                            beginAtZero: true
                        }}
                    }}
                }}
            }});
        }});
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
        relationship_insights = self.insights.get("relationship_insights", {})

        total_files = directory_insights.get("total_files", 0)
        total_directories = directory_insights.get("total_directories", 0)

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
                            <h5 class="card-title">File Types</h5>
                            <p class="card-text display-4">{len(file_insights.get("file_types", {}))}</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 col-lg-3">
                    <div class="card text-white bg-warning">
                        <div class="card-body">
                            <h5 class="card-title">Entity Types</h5>
                            <p class="card-text display-4">{len(entity_insights.get("entity_types", {}))}</p>
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
                                <li>There are <strong>{len(file_insights.get("file_types", {}))}</strong> different file types in the project.</li>
                                <li>The most common entity type is <strong>{next(iter(entity_insights.get("entity_types", {"Unknown": 0})), "Unknown")}</strong>.</li>
                                <li>The largest directory contains <strong>{directory_insights.get("largest_directories", [{"file_count": 0}])[0].get("file_count", 0)}</strong> files.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """

    def _create_directory_insights_section(self) -> str:
        """
        Create the directory insights section of the HTML content.

        Returns:
            The HTML content for the directory insights section
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
        <section id="directory-insights">
            <h2 class="mt-4 mb-4">Directory Insights</h2>

            <div class="row">
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

            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Directory Structure</h5>
                        </div>
                        <div class="card-body">
                            <p>The project has a total of <strong>{directory_insights.get("total_directories", 0)}</strong> directories and <strong>{directory_insights.get("total_files", 0)}</strong> files.</p>
                            <p>The directory structure is organized hierarchically, with subdirectories nested under their parent directories.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """

    def _create_file_insights_section(self) -> str:
        """
        Create the file insights section of the HTML content.

        Returns:
            The HTML content for the file insights section
        """
        file_insights = self.insights.get("file_insights", {})
        most_imported_files = file_insights.get("most_imported_files", [])
        most_importing_files = file_insights.get("most_importing_files", [])

        most_imported_html = ""
        for i, file in enumerate(most_imported_files[:5]):
            most_imported_html += f"""
            <tr>
                <td>{i + 1}</td>
                <td>{file.get("file", "Unknown")}</td>
                <td>{file.get("import_count", 0)}</td>
            </tr>
            """

        most_importing_html = ""
        for i, file in enumerate(most_importing_files[:5]):
            most_importing_html += f"""
            <tr>
                <td>{i + 1}</td>
                <td>{file.get("file", "Unknown")}</td>
                <td>{file.get("import_count", 0)}</td>
            </tr>
            """

        return f"""
        <section id="file-insights">
            <h2 class="mt-4 mb-4">File Insights</h2>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">File Types Distribution</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="file-types-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Most Imported Files</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>File</th>
                                            <th>Import Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {most_imported_html}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Most Importing Files</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>File</th>
                                            <th>Import Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {most_importing_html}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """

    def _create_entity_insights_section(self) -> str:
        """
        Create the entity insights section of the HTML content.

        Returns:
            The HTML content for the entity insights section
        """
        entity_insights = self.insights.get("entity_insights", {})
        most_used_entities = entity_insights.get("most_used_entities", [])

        most_used_html = ""
        for i, entity in enumerate(most_used_entities[:10]):
            most_used_html += f"""
            <tr>
                <td>{i + 1}</td>
                <td>{entity.get("entity", "Unknown")}</td>
                <td>{entity.get("defined_in_count", 0)}</td>
                <td>{entity.get("used_in_count", 0)}</td>
                <td>{entity.get("total_usage", 0)}</td>
            </tr>
            """

        return f"""
        <section id="entity-insights">
            <h2 class="mt-4 mb-4">Entity Insights</h2>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Entity Types Distribution</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="entity-types-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Most Used Entities</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Entity</th>
                                            <th>Defined In</th>
                                            <th>Used In</th>
                                            <th>Total Usage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {most_used_html}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """

    def _create_relationship_insights_section(self) -> str:
        """
        Create the relationship insights section of the HTML content.

        Returns:
            The HTML content for the relationship insights section
        """
        relationship_insights = self.insights.get("relationship_insights", {})
        central_files = relationship_insights.get("central_files", [])
        file_clusters = relationship_insights.get("file_clusters", [])

        central_files_html = ""
        for i, file in enumerate(central_files[:5]):
            central_files_html += f"""
            <tr>
                <td>{i + 1}</td>
                <td>{file.get("file", "Unknown")}</td>
                <td>{file.get("connection_count", 0)}</td>
            </tr>
            """

        file_clusters_html = ""
        for i, cluster in enumerate(file_clusters[:3]):
            file_clusters_html += f"""
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="card-title">Cluster {i + 1} ({len(cluster)} files)</h6>
                </div>
                <div class="card-body">
                    <ul class="list-group">
                        {' '.join([f'<li class="list-group-item">{file}</li>' for file in cluster[:5]])}
                        {f'<li class="list-group-item">... and {len(cluster) - 5} more</li>' if len(cluster) > 5 else ''}
                    </ul>
                </div>
            </div>
            """

        return f"""
        <section id="relationship-insights">
            <h2 class="mt-4 mb-4">Relationship Insights</h2>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Central Files</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>File</th>
                                            <th>Connection Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {central_files_html}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">File Clusters</h5>
                        </div>
                        <div class="card-body">
                            {file_clusters_html}
                        </div>
                    </div>
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
