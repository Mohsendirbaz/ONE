"""
Entity Analyzer Module

This module provides the CodeEntityAnalyzer class for analyzing relationships
between individual code entities (variables, functions, classes, modules).
"""

import os
import json
import networkx as nx
from typing import Dict, List, Set, Any, Union, Optional, Tuple
from os import PathLike
from collections import Counter, defaultdict
from datetime import datetime


class CodeEntityAnalyzer:
    """Advanced analyzer for code entity relationships and dependencies."""

    def __init__(self, 
                 summary_path: Union[str, PathLike],
                 common_ports_path: Union[str, PathLike],
                 direct_imports_path: Optional[Union[str, PathLike]] = None,
                 file_associations_path: Optional[Union[str, PathLike]] = None):
        """
        Initialize with entity relationship data.

        Args:
            summary_path: Path to the summary JSON file
            common_ports_path: Path to common ports JSON file (most critical for entity analysis)
            direct_imports_path: Path to direct imports JSON file (optional)
            file_associations_path: Path to file associations JSON file (optional)
        """
        # Load data from files
        self.summary_data = self._load_json(summary_path)

        # Common ports data contains the critical entity-level relationships
        self.common_ports_data = self._load_json(common_ports_path)

        # Load additional data if provided
        self.direct_imports_data = self._load_json(direct_imports_path) if direct_imports_path else {}
        self.file_associations_data = self._load_json(file_associations_path) if file_associations_path else {}

        # Extract timestamp from summary path for output file naming
        self.timestamp = os.path.basename(summary_path).split('_')[-1].split('.')[0]

        # Initialize entity-focused insights structure
        self.insights = {
            "project_name": self.summary_data.get("project_name", "Unknown Project"),
            "analysis_date": self.summary_data.get("analysis_date", "Unknown Date"),
            "entity_relationships": {},
            "function_dependencies": {},
            "class_hierarchies": {},
            "variable_usage_patterns": {},
            "module_interfaces": {},
            "refactoring_suggestions": {}
        }

    def _load_json(self, file_path: Union[str, PathLike]) -> Dict[str, Any]:
        """
        Load a JSON file.

        Args:
            file_path: Path to the JSON file

        Returns:
            The loaded JSON data as a dictionary
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load JSON file {file_path}: {str(e)}")
            return {}

    def analyze_entity_relationships(self):
        """
        Analyze relationships between code entities (functions, classes, variables).
        """
        # Extract common ports data - this contains the entity-level information
        common_ports = self.common_ports_data.get("common_ports", {})

        # Group entities by type
        functions = {}
        classes = {}
        variables = {}

        for port, info in common_ports.items():
            if port.startswith("function:"):
                name = port.split(":", 1)[1]
                functions[name] = {
                    "defined_in": info.get("defined_in", []),
                    "used_in": info.get("used_in", []),
                    "full_id": port
                }
            elif port.startswith("class:"):
                name = port.split(":", 1)[1]
                classes[name] = {
                    "defined_in": info.get("defined_in", []),
                    "used_in": info.get("used_in", []),
                    "full_id": port
                }
            elif port.startswith("variable:"):
                name = port.split(":", 1)[1]
                variables[name] = {
                    "defined_in": info.get("defined_in", []),
                    "used_in": info.get("used_in", []),
                    "full_id": port
                }

        # Store entity counts and lists
        self.insights["entity_relationships"] = {
            "function_count": len(functions),
            "class_count": len(classes),
            "variable_count": len(variables),
            "functions": functions,
            "classes": classes,
            "variables": variables
        }

        # Analyze function call graphs
        self._analyze_function_dependencies(functions)

        # Analyze class hierarchies
        self._analyze_class_hierarchies(classes)

        # Analyze variable usage patterns
        self._analyze_variable_usage(variables)

    def _analyze_function_dependencies(self, functions):
        """
        Analyze function call relationships and dependencies.

        Args:
            functions: Dictionary of functions with their usage information
        """
        # Create directed graph for function calls
        G = nx.DiGraph()

        # Add nodes for all functions
        for func_name in functions:
            G.add_node(func_name)

        # Add edges for function calls
        # This requires more detailed analysis of AST to determine which functions call which
        # We'll infer potential calls based on usage patterns
        for caller_name, caller_info in functions.items():
            caller_files = set(caller_info["defined_in"])

            for callee_name, callee_info in functions.items():
                if caller_name == callee_name:
                    continue

                callee_files = set(callee_info["used_in"])

                # If a function is defined in files where another function is used,
                # there's a potential call relationship
                if caller_files.intersection(callee_files):
                    G.add_edge(caller_name, callee_name, weight=len(caller_files.intersection(callee_files)))

        # Identify central functions (high in-degree/betweenness)
        if G.number_of_nodes() > 0:
            try:
                # Calculate centrality metrics
                betweenness = nx.betweenness_centrality(G)
                in_degree = {node: G.in_degree(node) for node in G.nodes()}

                # Store top functions by centrality
                central_functions = [
                    {"function": func, "score": score}
                    for func, score in sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:10]
                ]

                # Store most called functions
                most_called = [
                    {"function": func, "call_count": count}
                    for func, count in sorted(in_degree.items(), key=lambda x: x[1], reverse=True)[:10]
                    if count > 0
                ]

                # Detect potential circular function calls
                try:
                    cycles = list(nx.simple_cycles(G))
                    circular_calls = [
                        {
                            "functions": cycle,
                            "length": len(cycle)
                        }
                        for cycle in cycles
                    ]
                except nx.NetworkXNoCycle:
                    circular_calls = []

                # Store the analysis results
                self.insights["function_dependencies"] = {
                    "total_functions": G.number_of_nodes(),
                    "potential_call_relationships": G.number_of_edges(),
                    "central_functions": central_functions,
                    "most_called_functions": most_called,
                    "circular_calls": circular_calls,
                    "function_graph": {
                        "nodes": [{"id": node, "name": node} for node in G.nodes()],
                        "links": [{"source": u, "target": v, "weight": G[u][v].get("weight", 1)} for u, v in G.edges()]
                    }
                }
            except Exception as e:
                self.insights["function_dependencies"] = {
                    "error": str(e),
                    "total_functions": G.number_of_nodes(),
                    "potential_call_relationships": G.number_of_edges()
                }

    def _analyze_class_hierarchies(self, classes):
        """
        Analyze class hierarchies and relationships.

        Args:
            classes: Dictionary of classes with their usage information
        """
        # Create directed graph for class inheritance
        G = nx.DiGraph()

        # Add nodes for all classes
        for class_name in classes:
            G.add_node(class_name)

        # We'd need enhanced AST analysis to determine actual inheritance hierarchies
        # For now, infer potential relationships based on file co-occurrence

        # Class relationships by co-occurrence in files
        class_relationships = {}

        for class1_name, class1_info in classes.items():
            class1_files = set(class1_info["defined_in"] + class1_info["used_in"])
            class_relationships[class1_name] = {}

            for class2_name, class2_info in classes.items():
                if class1_name == class2_name:
                    continue

                class2_files = set(class2_info["defined_in"] + class2_info["used_in"])

                # Calculate co-occurrence score
                co_occurrence = len(class1_files.intersection(class2_files))

                if co_occurrence > 0:
                    class_relationships[class1_name][class2_name] = co_occurrence
                    # Add edge to graph - direction is arbitrary without AST analysis
                    G.add_edge(class1_name, class2_name, weight=co_occurrence)

        # Identify potentially related class groups
        try:
            # Use community detection to identify related class groups
            # Convert to undirected for community detection
            G_undirected = G.to_undirected()
            communities = nx.community.greedy_modularity_communities(G_undirected, weight='weight')

            class_groups = [
                {
                    "id": f"class_group_{i+1}",
                    "classes": list(community),
                    "size": len(community)
                }
                for i, community in enumerate(sorted(communities, key=len, reverse=True)[:5])
            ]
        except Exception:
            class_groups = []

        # Store the analysis results
        self.insights["class_hierarchies"] = {
            "total_classes": len(classes),
            "class_relationships": class_relationships,
            "potential_class_groups": class_groups,
            "class_graph": {
                "nodes": [{"id": node, "name": node} for node in G.nodes()],
                "links": [{"source": u, "target": v, "weight": G[u][v].get("weight", 1)} for u, v in G.edges()]
            }
        }

    def _analyze_variable_usage(self, variables):
        """
        Analyze variable usage patterns.

        Args:
            variables: Dictionary of variables with their usage information
        """
        # Identify widely used variables
        widely_used = []
        for var_name, var_info in variables.items():
            defined_in = var_info.get("defined_in", [])
            used_in = var_info.get("used_in", [])

            if len(used_in) > 1:  # Only consider variables used in multiple files
                widely_used.append({
                    "name": var_name,
                    "defined_in_count": len(defined_in),
                    "used_in_count": len(used_in),
                    "total_usage": len(defined_in) + len(used_in)
                })

        # Sort by usage count
        widely_used.sort(key=lambda x: x["total_usage"], reverse=True)

        # Group variables by naming patterns to identify conventions
        naming_patterns = {}
        for var_name in variables:
            # Identify naming convention (snake_case, camelCase, PascalCase, etc.)
            if var_name.startswith("_"):
                pattern = "private"
            elif var_name.isupper():
                pattern = "constant"
            elif "_" in var_name:
                pattern = "snake_case"
            elif var_name[0].isupper():
                pattern = "PascalCase"
            elif any(c.isupper() for c in var_name):
                pattern = "camelCase"
            else:
                pattern = "other"

            if pattern not in naming_patterns:
                naming_patterns[pattern] = []
            naming_patterns[pattern].append(var_name)

        # Calculate convention metrics
        convention_metrics = {
            pattern: len(vars_list)
            for pattern, vars_list in naming_patterns.items()
        }

        # Store the analysis results
        self.insights["variable_usage_patterns"] = {
            "total_variables": len(variables),
            "widely_used_variables": widely_used[:20],  # Top 20
            "naming_conventions": convention_metrics,
            "potential_globals": [
                {
                    "name": var["name"],
                    "used_in_count": var["used_in_count"]
                }
                for var in widely_used[:10]
                if var["defined_in_count"] == 1 and var["used_in_count"] > 2
            ]
        }

    def analyze_module_interfaces(self):
        """
        Analyze module interfaces - how entities are exported and imported between modules.
        """
        # We need both direct imports data and common ports data
        direct_imports = self.direct_imports_data.get("import_relationships", {})
        common_ports = self.common_ports_data.get("common_ports", {})

        # Map files to their exported entities
        module_exports = {}
        for port, info in common_ports.items():
            for file in info.get("defined_in", []):
                if file not in module_exports:
                    module_exports[file] = []
                module_exports[file].append(port)

        # Calculate module interface metrics
        module_interfaces = {}
        for module, exports in module_exports.items():
            # Count exports by type
            export_counts = {
                "function": sum(1 for e in exports if e.startswith("function:")),
                "class": sum(1 for e in exports if e.startswith("class:")),
                "variable": sum(1 for e in exports if e.startswith("variable:"))
            }

            # Count imports
            imported_by = []
            for importer, imported in direct_imports.items():
                if module in imported:
                    imported_by.append(importer)

            module_interfaces[module] = {
                "exports": export_counts,
                "total_exports": len(exports),
                "imported_by_count": len(imported_by),
                "imported_by": imported_by
            }

        # Identify API modules (modules with many exports used by many importers)
        api_modules = [
            {
                "module": module,
                "export_count": info["total_exports"],
                "importer_count": info["imported_by_count"]
            }
            for module, info in module_interfaces.items()
            if info["total_exports"] > 3 and info["imported_by_count"] > 1
        ]

        # Sort by a combined score of exports * importers
        api_modules.sort(key=lambda x: x["export_count"] * x["importer_count"], reverse=True)

        # Store the analysis results
        self.insights["module_interfaces"] = {
            "total_modules": len(module_exports),
            "module_interfaces": module_interfaces,
            "api_modules": api_modules[:10]  # Top 10
        }

    def generate_entity_refactoring_suggestions(self):
        """
        Generate intelligent refactoring suggestions focused on code entities.
        """
        suggestions = []

        # 1. Function-level suggestions
        function_deps = self.insights.get("function_dependencies", {})
        circular_calls = function_deps.get("circular_calls", [])

        # Suggest breaking circular function calls
        for i, cycle in enumerate(circular_calls[:3]):
            suggestion = {
                "id": f"circular_function_calls_{i}",
                "title": f"Break circular dependency between functions",
                "scope": "Function",
                "severity": "High",
                "description": "These functions call each other in a cycle: " + " → ".join(cycle["functions"]),
                "solution": "Consider introducing a mediator function or restructuring the logic to break the cycle",
                "entities_involved": cycle["functions"]
            }
            suggestions.append(suggestion)

        # Suggest simplifying highly called functions
        most_called = function_deps.get("most_called_functions", [])
        for i, func in enumerate(most_called[:2]):
            if func["call_count"] > 5:  # Only suggest for functions with many callers
                suggestion = {
                    "id": f"high_usage_function_{i}",
                    "title": f"Review highly used function '{func['function']}'",
                    "scope": "Function",
                    "severity": "Medium",
                    "description": f"This function is called by {func['call_count']} other functions",
                    "solution": "Consider if this function has a single responsibility or if it should be broken down",
                    "entities_involved": [func["function"]]
                }
                suggestions.append(suggestion)

        # 2. Class-level suggestions
        class_hierarchies = self.insights.get("class_hierarchies", {})
        class_groups = class_hierarchies.get("potential_class_groups", [])

        # Suggest consolidating related classes
        for i, group in enumerate(class_groups[:2]):
            if group["size"] >= 3:  # Only suggest for groups with at least 3 classes
                suggestion = {
                    "id": f"related_classes_{i}",
                    "title": f"Consider relationship between closely related classes",
                    "scope": "Class",
                    "severity": "Medium",
                    "description": f"These {group['size']} classes are closely related: " + ", ".join(group["classes"][:5]) + 
                                   (", ..." if len(group["classes"]) > 5 else ""),
                    "solution": "Review if these classes should share a common base class or interface",
                    "entities_involved": group["classes"][:5]
                }
                suggestions.append(suggestion)

        # 3. Variable-level suggestions
        var_patterns = self.insights.get("variable_usage_patterns", {})
        global_vars = var_patterns.get("potential_globals", [])

        # Suggest encapsulating widely used variables
        for i, var in enumerate(global_vars[:3]):
            suggestion = {
                "id": f"global_variable_{i}",
                "title": f"Encapsulate widely used variable '{var['name']}'",
                "scope": "Variable",
                "severity": "Medium",
                "description": f"This variable is defined in one file but used in {var['used_in_count']} files",
                "solution": "Consider encapsulating this variable with getter/setter methods or moving it to a configuration class",
                "entities_involved": [var["name"]]
            }
            suggestions.append(suggestion)

        # 4. Module-level suggestions
        module_interfaces = self.insights.get("module_interfaces", {})
        api_modules = module_interfaces.get("api_modules", [])

        # Suggest creating explicit API documentation for key modules
        for i, module in enumerate(api_modules[:2]):
            if module["export_count"] > 5 and module["importer_count"] > 2:
                suggestion = {
                    "id": f"api_module_{i}",
                    "title": f"Document API for key module '{os.path.basename(module['module'])}'",
                    "scope": "Module",
                    "severity": "Low",
                    "description": f"This module exports {module['export_count']} entities and is imported by {module['importer_count']} other modules",
                    "solution": "Consider creating explicit API documentation and ensuring a clean interface",
                    "entities_involved": [module["module"]]
                }
                suggestions.append(suggestion)

        # Store the suggestions
        self.insights["refactoring_suggestions"] = suggestions
        return suggestions

    def save_insights(self, output_path: Optional[Union[str, PathLike]] = None) -> str:
        """
        Save the insights to a JSON file.

        Args:
            output_path: Path where the output JSON file will be saved (optional)

        Returns:
            The path to the created JSON file
        """
        if output_path is None:
            # Create a default output path in the same directory as the summary file
            summary_dir = os.path.dirname(self.summary_data.get("summary_path", ""))
            if not summary_dir:
                summary_dir = os.getcwd()
            output_path = os.path.join(summary_dir, f"entity_insights_{self.timestamp}.json")

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.insights, f, indent=2)

        return str(output_path)

    def generate_html_report(self, output_path: Optional[Union[str, PathLike]] = None) -> str:
        """
        Generate an interactive HTML report with D3.js visualizations.

        Args:
            output_path: Path where the output HTML file will be saved (optional)

        Returns:
            The path to the created HTML file
        """
        if output_path is None:
            # Create a default output path in the same directory as the summary file
            summary_dir = os.path.dirname(self.summary_data.get("summary_path", ""))
            if not summary_dir:
                summary_dir = os.getcwd()
            output_path = os.path.join(summary_dir, f"entity_insights_{self.timestamp}.html")

        # Generate HTML content
        html_content = self._generate_html_content()

        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return str(output_path)

    def _generate_html_content(self) -> str:
        """
        Generate the HTML content for the report.

        Returns:
            The HTML content as a string
        """
        # Basic HTML template with D3.js
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Entity Insights - {self.insights.get("project_name", "Unknown Project")}</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }}
        h1, h2, h3, h4 {{
            color: #2c3e50;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        .card {{
            background: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
        }}
        .graph-container {{
            width: 100%;
            height: 500px;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin-bottom: 20px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        th, td {{
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #f2f2f2;
        }}
        .tab {{
            overflow: hidden;
            border: 1px solid #ccc;
            background-color: #f1f1f1;
            border-radius: 5px 5px 0 0;
        }}
        .tab button {{
            background-color: inherit;
            float: left;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 14px 16px;
            transition: 0.3s;
            font-size: 16px;
        }}
        .tab button:hover {{
            background-color: #ddd;
        }}
        .tab button.active {{
            background-color: #ccc;
        }}
        .tabcontent {{
            display: none;
            padding: 20px;
            border: 1px solid #ccc;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }}
        .visible {{
            display: block;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Code Entity Insights</h1>
        <p>Project: {self.insights.get("project_name", "Unknown Project")}</p>
        <p>Analysis Date: {self.insights.get("analysis_date", "Unknown Date")}</p>

        <div class="tab">
            <button class="tablinks active" onclick="openTab(event, 'overview')">Overview</button>
            <button class="tablinks" onclick="openTab(event, 'functions')">Functions</button>
            <button class="tablinks" onclick="openTab(event, 'classes')">Classes</button>
            <button class="tablinks" onclick="openTab(event, 'variables')">Variables</button>
            <button class="tablinks" onclick="openTab(event, 'modules')">Modules</button>
            <button class="tablinks" onclick="openTab(event, 'suggestions')">Refactoring Suggestions</button>
        </div>

        <div id="overview" class="tabcontent visible">
            <h2>Entity Overview</h2>
            <div class="card">
                <h3>Entity Counts</h3>
                <table>
                    <tr>
                        <th>Entity Type</th>
                        <th>Count</th>
                    </tr>
                    <tr>
                        <td>Functions</td>
                        <td>{self.insights.get("entity_relationships", {}).get("function_count", 0)}</td>
                    </tr>
                    <tr>
                        <td>Classes</td>
                        <td>{self.insights.get("entity_relationships", {}).get("class_count", 0)}</td>
                    </tr>
                    <tr>
                        <td>Variables</td>
                        <td>{self.insights.get("entity_relationships", {}).get("variable_count", 0)}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div id="functions" class="tabcontent">
            <h2>Function Analysis</h2>
            <div class="card">
                <h3>Function Call Graph</h3>
                <div id="function-graph" class="graph-container"></div>
            </div>
            <div class="card">
                <h3>Most Called Functions</h3>
                <table id="most-called-functions">
                    <tr>
                        <th>Function</th>
                        <th>Call Count</th>
                    </tr>
                </table>
            </div>
            <div class="card">
                <h3>Circular Function Calls</h3>
                <table id="circular-functions">
                    <tr>
                        <th>Functions</th>
                        <th>Cycle Length</th>
                    </tr>
                </table>
            </div>
        </div>

        <div id="classes" class="tabcontent">
            <h2>Class Analysis</h2>
            <div class="card">
                <h3>Class Relationship Graph</h3>
                <div id="class-graph" class="graph-container"></div>
            </div>
            <div class="card">
                <h3>Potential Class Groups</h3>
                <table id="class-groups">
                    <tr>
                        <th>Group ID</th>
                        <th>Classes</th>
                        <th>Size</th>
                    </tr>
                </table>
            </div>
        </div>

        <div id="variables" class="tabcontent">
            <h2>Variable Analysis</h2>
            <div class="card">
                <h3>Widely Used Variables</h3>
                <table id="widely-used-variables">
                    <tr>
                        <th>Variable</th>
                        <th>Defined In</th>
                        <th>Used In</th>
                        <th>Total Usage</th>
                    </tr>
                </table>
            </div>
            <div class="card">
                <h3>Variable Naming Conventions</h3>
                <div id="naming-conventions-chart" class="graph-container"></div>
            </div>
        </div>

        <div id="modules" class="tabcontent">
            <h2>Module Interface Analysis</h2>
            <div class="card">
                <h3>API Modules</h3>
                <table id="api-modules">
                    <tr>
                        <th>Module</th>
                        <th>Export Count</th>
                        <th>Importer Count</th>
                    </tr>
                </table>
            </div>
        </div>

        <div id="suggestions" class="tabcontent">
            <h2>Refactoring Suggestions</h2>
            <div id="refactoring-suggestions">
                <!-- Suggestions will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <script>
        // Tab functionality
        function openTab(evt, tabName) {{
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {{
                tabcontent[i].classList.remove("visible");
            }}
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {{
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }}
            document.getElementById(tabName).classList.add("visible");
            evt.currentTarget.className += " active";

            // Render graphs when tab is opened
            if (tabName === 'functions') {{
                renderFunctionGraph();
                populateFunctionTables();
            }} else if (tabName === 'classes') {{
                renderClassGraph();
                populateClassTables();
            }} else if (tabName === 'variables') {{
                renderVariableCharts();
                populateVariableTables();
            }} else if (tabName === 'modules') {{
                populateModuleTables();
            }} else if (tabName === 'suggestions') {{
                populateSuggestions();
            }}
        }}

        // Load the data
        const insights = {json.dumps(self.insights)};

        // Function to render the function call graph
        function renderFunctionGraph() {{
            const graphData = insights.function_dependencies.function_graph;
            if (!graphData || !graphData.nodes || !graphData.links) return;

            const container = document.getElementById('function-graph');
            container.innerHTML = '';

            const width = container.clientWidth;
            const height = container.clientHeight;

            const svg = d3.select('#function-graph')
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            const simulation = d3.forceSimulation(graphData.nodes)
                .force('link', d3.forceLink(graphData.links).id(d => d.id))
                .force('charge', d3.forceManyBody().strength(-100))
                .force('center', d3.forceCenter(width / 2, height / 2));

            const link = svg.append('g')
                .selectAll('line')
                .data(graphData.links)
                .enter().append('line')
                .attr('stroke', '#999')
                .attr('stroke-opacity', 0.6)
                .attr('stroke-width', d => Math.sqrt(d.weight));

            const node = svg.append('g')
                .selectAll('circle')
                .data(graphData.nodes)
                .enter().append('circle')
                .attr('r', 5)
                .attr('fill', '#1f77b4')
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));

            node.append('title')
                .text(d => d.name);

            simulation.on('tick', () => {{
                link
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);

                node
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y);
            }});

            function dragstarted(event, d) {{
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }}

            function dragged(event, d) {{
                d.fx = event.x;
                d.fy = event.y;
            }}

            function dragended(event, d) {{
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }}
        }}

        // Function to populate function tables
        function populateFunctionTables() {{
            // Most called functions
            const mostCalledTable = document.getElementById('most-called-functions');
            mostCalledTable.innerHTML = '<tr><th>Function</th><th>Call Count</th></tr>';

            if (insights.function_dependencies.most_called_functions) {{
                insights.function_dependencies.most_called_functions.forEach(func => {{
                    const row = mostCalledTable.insertRow();
                    row.insertCell(0).textContent = func.function;
                    row.insertCell(1).textContent = func.call_count;
                }});
            }}

            // Circular function calls
            const circularTable = document.getElementById('circular-functions');
            circularTable.innerHTML = '<tr><th>Functions</th><th>Cycle Length</th></tr>';

            if (insights.function_dependencies.circular_calls) {{
                insights.function_dependencies.circular_calls.forEach(cycle => {{
                    const row = circularTable.insertRow();
                    row.insertCell(0).textContent = cycle.functions.join(' → ');
                    row.insertCell(1).textContent = cycle.length;
                }});
            }}
        }}

        // Function to render the class relationship graph
        function renderClassGraph() {{
            const graphData = insights.class_hierarchies.class_graph;
            if (!graphData || !graphData.nodes || !graphData.links) return;

            const container = document.getElementById('class-graph');
            container.innerHTML = '';

            const width = container.clientWidth;
            const height = container.clientHeight;

            const svg = d3.select('#class-graph')
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            const simulation = d3.forceSimulation(graphData.nodes)
                .force('link', d3.forceLink(graphData.links).id(d => d.id))
                .force('charge', d3.forceManyBody().strength(-100))
                .force('center', d3.forceCenter(width / 2, height / 2));

            const link = svg.append('g')
                .selectAll('line')
                .data(graphData.links)
                .enter().append('line')
                .attr('stroke', '#999')
                .attr('stroke-opacity', 0.6)
                .attr('stroke-width', d => Math.sqrt(d.weight));

            const node = svg.append('g')
                .selectAll('circle')
                .data(graphData.nodes)
                .enter().append('circle')
                .attr('r', 5)
                .attr('fill', '#ff7f0e')
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));

            node.append('title')
                .text(d => d.name);

            simulation.on('tick', () => {{
                link
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);

                node
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y);
            }});

            function dragstarted(event, d) {{
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }}

            function dragged(event, d) {{
                d.fx = event.x;
                d.fy = event.y;
            }}

            function dragended(event, d) {{
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }}
        }}

        // Function to populate class tables
        function populateClassTables() {{
            // Class groups
            const classGroupsTable = document.getElementById('class-groups');
            classGroupsTable.innerHTML = '<tr><th>Group ID</th><th>Classes</th><th>Size</th></tr>';

            if (insights.class_hierarchies.potential_class_groups) {{
                insights.class_hierarchies.potential_class_groups.forEach(group => {{
                    const row = classGroupsTable.insertRow();
                    row.insertCell(0).textContent = group.id;
                    row.insertCell(1).textContent = group.classes.join(', ');
                    row.insertCell(2).textContent = group.size;
                }});
            }}
        }}

        // Function to render variable charts
        function renderVariableCharts() {{
            // Naming conventions pie chart
            const conventions = insights.variable_usage_patterns.naming_conventions;
            if (!conventions) return;

            const container = document.getElementById('naming-conventions-chart');
            container.innerHTML = '';

            const width = container.clientWidth;
            const height = container.clientHeight;
            const radius = Math.min(width, height) / 2;

            const svg = d3.select('#naming-conventions-chart')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', `translate(${{width / 2}},${{height / 2}})`);

            const color = d3.scaleOrdinal()
                .domain(Object.keys(conventions))
                .range(d3.schemeCategory10);

            const pie = d3.pie()
                .value(d => d[1]);

            const data_ready = pie(Object.entries(conventions));

            const arcGenerator = d3.arc()
                .innerRadius(0)
                .outerRadius(radius);

            svg.selectAll('slices')
                .data(data_ready)
                .enter()
                .append('path')
                .attr('d', arcGenerator)
                .attr('fill', d => color(d.data[0]))
                .attr('stroke', 'white')
                .style('stroke-width', '2px');

            svg.selectAll('slices')
                .data(data_ready)
                .enter()
                .append('text')
                .text(d => `${{d.data[0]}}: ${{d.data[1]}}`)
                .attr('transform', d => `translate(${{arcGenerator.centroid(d)}})`)
                .style('text-anchor', 'middle')
                .style('font-size', 10);
        }}

        // Function to populate variable tables
        function populateVariableTables() {{
            // Widely used variables
            const variablesTable = document.getElementById('widely-used-variables');
            variablesTable.innerHTML = '<tr><th>Variable</th><th>Defined In</th><th>Used In</th><th>Total Usage</th></tr>';

            if (insights.variable_usage_patterns.widely_used_variables) {{
                insights.variable_usage_patterns.widely_used_variables.forEach(variable => {{
                    const row = variablesTable.insertRow();
                    row.insertCell(0).textContent = variable.name;
                    row.insertCell(1).textContent = variable.defined_in_count;
                    row.insertCell(2).textContent = variable.used_in_count;
                    row.insertCell(3).textContent = variable.total_usage;
                }});
            }}
        }}

        // Function to populate module tables
        function populateModuleTables() {{
            // API modules
            const modulesTable = document.getElementById('api-modules');
            modulesTable.innerHTML = '<tr><th>Module</th><th>Export Count</th><th>Importer Count</th></tr>';

            if (insights.module_interfaces.api_modules) {{
                insights.module_interfaces.api_modules.forEach(module => {{
                    const row = modulesTable.insertRow();
                    row.insertCell(0).textContent = module.module;
                    row.insertCell(1).textContent = module.export_count;
                    row.insertCell(2).textContent = module.importer_count;
                }});
            }}
        }}

        // Function to populate refactoring suggestions
        function populateSuggestions() {{
            const suggestionsContainer = document.getElementById('refactoring-suggestions');
            suggestionsContainer.innerHTML = '';

            if (insights.refactoring_suggestions) {{
                insights.refactoring_suggestions.forEach(suggestion => {{
                    const card = document.createElement('div');
                    card.className = 'card';

                    const title = document.createElement('h3');
                    title.textContent = suggestion.title;
                    card.appendChild(title);

                    const scope = document.createElement('p');
                    scope.innerHTML = `<strong>Scope:</strong> ${{suggestion.scope}}`;
                    card.appendChild(scope);

                    const severity = document.createElement('p');
                    severity.innerHTML = `<strong>Severity:</strong> ${{suggestion.severity}}`;
                    card.appendChild(severity);

                    const description = document.createElement('p');
                    description.innerHTML = `<strong>Description:</strong> ${{suggestion.description}}`;
                    card.appendChild(description);

                    const solution = document.createElement('p');
                    solution.innerHTML = `<strong>Solution:</strong> ${{suggestion.solution}}`;
                    card.appendChild(solution);

                    const entities = document.createElement('p');
                    entities.innerHTML = `<strong>Entities Involved:</strong> ${{suggestion.entities_involved.join(', ')}}`;
                    card.appendChild(entities);

                    suggestionsContainer.appendChild(card);
                }});
            }}
        }}

        // Initialize the first tab
        document.addEventListener('DOMContentLoaded', function() {{
            // Open the overview tab by default
            document.querySelector('.tablinks.active').click();
        }});
    </script>
</body>
</html>
"""
        return html
