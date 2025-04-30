"""
D3.js Network Visualization Generator

This module provides functions for generating D3.js-based network visualizations
for code relationships. It includes functions for creating force-directed graphs,
hierarchical directory visualizations, and interactive node exploration.
"""

import os
import json
from typing import Dict, List, Any, Union, Optional
from os import PathLike


class D3NetworkGenerator:
    """Class for generating D3.js network visualizations."""

    def __init__(self, insights: Dict[str, Any]):
        """
        Initialize the D3 network generator.

        Args:
            insights: The insights data to generate visualizations from
        """
        self.insights = insights
        self.project_name = insights.get("project_name", "Unknown Project")
        self.analysis_date = insights.get("analysis_date", "Unknown Date")

    def generate_force_directed_graph(self) -> str:
        """
        Generate a force-directed graph visualization of file relationships.

        Returns:
            The JavaScript code for the visualization
        """
        # Get the network insights
        network_insights = self.insights.get("network_insights", {})
        
        # Get the centrality metrics
        centrality_metrics = network_insights.get("centrality_metrics", {})
        
        # Get the coupling metrics
        coupling_metrics = network_insights.get("coupling_metrics", {})
        
        # Create nodes and links for the graph
        nodes = []
        links = []
        
        # Create a set of all files
        all_files = set()
        
        # Add nodes for all files with centrality metrics
        for file_path, metrics in centrality_metrics.items():
            all_files.add(file_path)
            
            # Get the file extension
            _, ext = os.path.splitext(file_path)
            
            # Calculate node size based on betweenness centrality
            size = 5 + metrics.get("betweenness", 0) * 100
            
            # Add the node
            nodes.append({
                "id": file_path,
                "name": os.path.basename(file_path),
                "type": ext[1:] if ext else "unknown",
                "size": size,
                "betweenness": metrics.get("betweenness", 0),
                "in_degree": metrics.get("in_degree", 0),
                "out_degree": metrics.get("out_degree", 0)
            })
        
        # Add links for direct imports
        summary_data = self.insights.get("summary", {})
        for file_path, associations in summary_data.items():
            for imported_file in associations.get("direct_imports", []):
                if file_path in all_files and imported_file in all_files:
                    links.append({
                        "source": file_path,
                        "target": imported_file,
                        "type": "import"
                    })
        
        # Create the graph data
        graph_data = {
            "nodes": nodes,
            "links": links
        }
        
        # Generate the JavaScript code
        js_code = f"""
        // Create the force-directed graph
        function createForceDirectedGraph(graphData) {{
            // Set up the SVG container
            const width = 960;
            const height = 600;
            
            const svg = d3.select("#network-graph")
                .attr("width", width)
                .attr("height", height);
            
            // Clear any existing content
            svg.selectAll("*").remove();
            
            // Add a group for the graph
            const g = svg.append("g");
            
            // Add zoom behavior
            const zoom = d3.zoom()
                .scaleExtent([0.1, 10])
                .on("zoom", (event) => {{
                    g.attr("transform", event.transform);
                }});
            
            svg.call(zoom);
            
            // Create a color scale for node types
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            
            // Create the simulation
            const simulation = d3.forceSimulation(graphData.nodes)
                .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(100))
                .force("charge", d3.forceManyBody().strength(-200))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("x", d3.forceX(width / 2).strength(0.1))
                .force("y", d3.forceY(height / 2).strength(0.1));
            
            // Create the links
            const link = g.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(graphData.links)
                .enter().append("line")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 1);
            
            // Create the nodes
            const node = g.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(graphData.nodes)
                .enter().append("circle")
                .attr("r", d => Math.sqrt(d.size))
                .attr("fill", d => color(d.type))
                .call(drag(simulation));
            
            // Add tooltips
            node.append("title")
                .text(d => `${{d.name}}\\nType: ${{d.type}}\\nBetweenness: ${{d.betweenness.toFixed(4)}}\\nIn-Degree: ${{d.in_degree.toFixed(4)}}\\nOut-Degree: ${{d.out_degree.toFixed(4)}}`);
            
            // Add node labels
            const label = g.append("g")
                .attr("class", "labels")
                .selectAll("text")
                .data(graphData.nodes)
                .enter().append("text")
                .attr("dx", 12)
                .attr("dy", ".35em")
                .text(d => d.name)
                .style("font-size", "10px")
                .style("fill", "#333")
                .style("pointer-events", "none")
                .style("opacity", 0);
            
            // Show labels on hover
            node.on("mouseover", function(event, d) {{
                d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
                label.filter(l => l.id === d.id).style("opacity", 1);
                
                // Highlight connected nodes and links
                const connected = getConnectedNodes(d.id, graphData.links);
                node.style("opacity", n => connected.includes(n.id) || n.id === d.id ? 1 : 0.1);
                link.style("opacity", l => l.source.id === d.id || l.target.id === d.id ? 1 : 0.1);
            }})
            .on("mouseout", function() {{
                d3.select(this).attr("stroke", null);
                label.style("opacity", 0);
                node.style("opacity", 1);
                link.style("opacity", 0.6);
            }})
            .on("click", function(event, d) {{
                // Show file details
                showFileDetails(d);
            }});
            
            // Update positions on tick
            simulation.on("tick", () => {{
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);
                
                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
                
                label
                    .attr("x", d => d.x)
                    .attr("y", d => d.y);
            }});
            
            // Drag behavior
            function drag(simulation) {{
                function dragstarted(event) {{
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                }}
                
                function dragged(event) {{
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                }}
                
                function dragended(event) {{
                    if (!event.active) simulation.alphaTarget(0);
                    event.subject.fx = null;
                    event.subject.fy = null;
                }}
                
                return d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended);
            }}
            
            // Helper function to get connected nodes
            function getConnectedNodes(nodeId, links) {{
                const connected = [];
                links.forEach(link => {{
                    if (link.source.id === nodeId) {{
                        connected.push(link.target.id);
                    }} else if (link.target.id === nodeId) {{
                        connected.push(link.source.id);
                    }}
                }});
                return connected;
            }}
            
            // Add legend
            const legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", "translate(20, 20)");
            
            const types = Array.from(new Set(graphData.nodes.map(d => d.type)));
            
            types.forEach((type, i) => {{
                const legendItem = legend.append("g")
                    .attr("transform", `translate(0, ${{i * 20}})`);
                
                legendItem.append("circle")
                    .attr("r", 5)
                    .attr("fill", color(type));
                
                legendItem.append("text")
                    .attr("x", 10)
                    .attr("y", 5)
                    .text(type)
                    .style("font-size", "12px");
            }});
            
            // Add controls
            const controls = d3.select("#network-controls");
            
            // Add filter by type
            const typeFilter = controls.append("div")
                .attr("class", "mb-3");
            
            typeFilter.append("label")
                .attr("class", "form-label")
                .text("Filter by type:");
            
            const typeSelect = typeFilter.append("select")
                .attr("class", "form-select")
                .on("change", function() {{
                    const selectedType = this.value;
                    if (selectedType === "all") {{
                        node.style("opacity", 1);
                        link.style("opacity", 0.6);
                    }} else {{
                        node.style("opacity", d => d.type === selectedType ? 1 : 0.1);
                        link.style("opacity", l => l.source.type === selectedType || l.target.type === selectedType ? 1 : 0.1);
                    }}
                }});
            
            typeSelect.append("option")
                .attr("value", "all")
                .text("All types");
            
            types.forEach(type => {{
                typeSelect.append("option")
                    .attr("value", type)
                    .text(type);
            }});
            
            // Add centrality metric selector
            const metricFilter = controls.append("div")
                .attr("class", "mb-3");
            
            metricFilter.append("label")
                .attr("class", "form-label")
                .text("Size by metric:");
            
            const metricSelect = metricFilter.append("select")
                .attr("class", "form-select")
                .on("change", function() {{
                    const selectedMetric = this.value;
                    node.attr("r", d => {{
                        if (selectedMetric === "betweenness") {{
                            return Math.sqrt(5 + d.betweenness * 100);
                        }} else if (selectedMetric === "in_degree") {{
                            return Math.sqrt(5 + d.in_degree * 100);
                        }} else if (selectedMetric === "out_degree") {{
                            return Math.sqrt(5 + d.out_degree * 100);
                        }} else {{
                            return Math.sqrt(d.size);
                        }}
                    }});
                }});
            
            metricSelect.append("option")
                .attr("value", "betweenness")
                .text("Betweenness Centrality");
            
            metricSelect.append("option")
                .attr("value", "in_degree")
                .text("In-Degree Centrality");
            
            metricSelect.append("option")
                .attr("value", "out_degree")
                .text("Out-Degree Centrality");
        }}
        
        // Function to show file details
        function showFileDetails(file) {{
            const detailsContainer = document.getElementById('file-details');
            
            // Create the details HTML
            const detailsHtml = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">${{file.name}}</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Path:</strong> ${{file.id}}</p>
                        <p><strong>Type:</strong> ${{file.type}}</p>
                        <p><strong>Betweenness Centrality:</strong> ${{file.betweenness.toFixed(4)}}</p>
                        <p><strong>In-Degree Centrality:</strong> ${{file.in_degree.toFixed(4)}}</p>
                        <p><strong>Out-Degree Centrality:</strong> ${{file.out_degree.toFixed(4)}}</p>
                    </div>
                </div>
            `;
            
            detailsContainer.innerHTML = detailsHtml;
        }}
        
        // Initialize the force-directed graph
        createForceDirectedGraph({json.dumps(graph_data)});
        """
        
        return js_code

    def generate_hierarchical_directory_visualization(self) -> str:
        """
        Generate a hierarchical directory visualization.

        Returns:
            The JavaScript code for the visualization
        """
        # Get the directory insights
        directory_insights = self.insights.get("directory_insights", {})
        
        # Get the directory hierarchy
        hierarchy = directory_insights.get("directory_hierarchy", {})
        
        # Generate the JavaScript code
        js_code = f"""
        // Create the hierarchical directory visualization
        function createDirectoryVisualization(hierarchyData) {{
            // Set up the SVG container
            const width = 960;
            const height = 800;
            
            const svg = d3.select("#directory-graph")
                .attr("width", width)
                .attr("height", height);
            
            // Clear any existing content
            svg.selectAll("*").remove();
            
            // Add a group for the graph
            const g = svg.append("g")
                .attr("transform", "translate(40, 0)");
            
            // Create a tree layout
            const treeLayout = d3.tree()
                .size([height - 40, width - 160]);
            
            // Create a hierarchy from the data
            const root = d3.hierarchy(hierarchyData);
            
            // Compute the tree layout
            treeLayout(root);
            
            // Create links
            const link = g.selectAll(".link")
                .data(root.links())
                .enter().append("path")
                .attr("class", "link")
                .attr("d", d3.linkHorizontal()
                    .x(d => d.y)
                    .y(d => d.x))
                .attr("fill", "none")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 1);
            
            // Create nodes
            const node = g.selectAll(".node")
                .data(root.descendants())
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${{d.y}},${{d.x}})`);
            
            // Add circles to nodes
            node.append("circle")
                .attr("r", d => d.data.file_count ? Math.sqrt(d.data.file_count) + 3 : 3)
                .attr("fill", d => d.data.file_count ? "#1f77b4" : "#999");
            
            // Add labels to nodes
            node.append("text")
                .attr("dy", 3)
                .attr("x", d => d.children ? -8 : 8)
                .style("text-anchor", d => d.children ? "end" : "start")
                .text(d => d.data.name)
                .style("font-size", "10px")
                .style("fill", "#333");
            
            // Add tooltips
            node.append("title")
                .text(d => `${{d.data.name}}\\nFiles: ${{d.data.file_count || 0}}\\nSubdirectories: ${{d.data.subdirectory_count || 0}}`);
            
            // Add interactivity
            node.on("mouseover", function(event, d) {{
                d3.select(this).select("circle").attr("fill", "#ff7f0e");
                
                // Highlight path to root
                let current = d;
                while (current.parent) {{
                    const parentLink = link.filter(l => l.source === current.parent && l.target === current);
                    parentLink.attr("stroke", "#ff7f0e").attr("stroke-width", 2);
                    current = current.parent;
                }}
            }})
            .on("mouseout", function(event, d) {{
                d3.select(this).select("circle").attr("fill", d => d.data.file_count ? "#1f77b4" : "#999");
                link.attr("stroke", "#999").attr("stroke-width", 1);
            }})
            .on("click", function(event, d) {{
                // Show directory details
                showDirectoryDetails(d.data);
            }});
            
            // Add controls for expanding/collapsing
            const controls = d3.select("#directory-controls");
            
            controls.append("button")
                .attr("class", "btn btn-sm btn-outline-primary me-2")
                .text("Expand All")
                .on("click", function() {{
                    // Implement expand all functionality
                }});
            
            controls.append("button")
                .attr("class", "btn btn-sm btn-outline-secondary")
                .text("Collapse All")
                .on("click", function() {{
                    // Implement collapse all functionality
                }});
        }}
        
        // Function to show directory details
        function showDirectoryDetails(directory) {{
            const detailsContainer = document.getElementById('directory-details');
            
            // Create the details HTML
            const detailsHtml = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">${{directory.name}}</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Path:</strong> ${{directory.path}}</p>
                        <p><strong>Files:</strong> ${{directory.file_count || 0}}</p>
                        <p><strong>Subdirectories:</strong> ${{directory.subdirectory_count || 0}}</p>
                    </div>
                </div>
            `;
            
            detailsContainer.innerHTML = detailsHtml;
        }}
        
        // Initialize the directory visualization
        createDirectoryVisualization({json.dumps(hierarchy)});
        """
        
        return js_code

    def generate_circular_dependencies_visualization(self) -> str:
        """
        Generate a visualization of circular dependencies.

        Returns:
            The JavaScript code for the visualization
        """
        # Get the network insights
        network_insights = self.insights.get("network_insights", {})
        
        # Get the circular dependencies
        circular_dependencies = network_insights.get("circular_dependencies", [])
        
        # Generate the JavaScript code
        js_code = f"""
        // Create the circular dependencies visualization
        function createCircularDependenciesVisualization(circularDependencies) {{
            // Set up the container
            const container = d3.select("#circular-dependencies");
            
            // Clear any existing content
            container.selectAll("*").remove();
            
            // Check if there are any circular dependencies
            if (circularDependencies.length === 0) {{
                container.append("p")
                    .text("No circular dependencies detected.");
                return;
            }}
            
            // Create a list of circular dependencies
            const list = container.append("div")
                .attr("class", "list-group");
            
            // Add each circular dependency
            circularDependencies.forEach((cycle, i) => {{
                const item = list.append("div")
                    .attr("class", "list-group-item");
                
                item.append("h5")
                    .text(`Circular Dependency #${{i + 1}}`);
                
                const cycleText = cycle.join(" → ") + " → " + cycle[0];
                
                item.append("p")
                    .text(cycleText);
                
                // Add a small visualization of the cycle
                const width = 200;
                const height = 200;
                const radius = 80;
                
                const svg = item.append("svg")
                    .attr("width", width)
                    .attr("height", height);
                
                const g = svg.append("g")
                    .attr("transform", `translate(${{width / 2}}, ${{height / 2}})`);
                
                // Create nodes
                const nodes = cycle.map((file, j) => ({{
                    id: file,
                    name: file.split("\\\\").pop(),
                    index: j
                }}));
                
                // Create links
                const links = nodes.map((node, j) => ({{
                    source: node,
                    target: nodes[(j + 1) % nodes.length]
                }}));
                
                // Position nodes in a circle
                nodes.forEach((node, j) => {{
                    const angle = (j / nodes.length) * 2 * Math.PI;
                    node.x = radius * Math.cos(angle);
                    node.y = radius * Math.sin(angle);
                }});
                
                // Draw links
                g.selectAll(".link")
                    .data(links)
                    .enter().append("path")
                    .attr("class", "link")
                    .attr("d", d => {{
                        const dx = d.target.x - d.source.x;
                        const dy = d.target.y - d.source.y;
                        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
                        return `M${{d.source.x}},${{d.source.y}}A${{dr}},${{dr}} 0 0,1 ${{d.target.x}},${{d.target.y}}`;
                    }})
                    .attr("fill", "none")
                    .attr("stroke", "#999")
                    .attr("stroke-width", 1.5)
                    .attr("marker-end", "url(#arrow)");
                
                // Draw nodes
                g.selectAll(".node")
                    .data(nodes)
                    .enter().append("circle")
                    .attr("class", "node")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", 5)
                    .attr("fill", "#1f77b4");
                
                // Add labels
                g.selectAll(".label")
                    .data(nodes)
                    .enter().append("text")
                    .attr("class", "label")
                    .attr("x", d => d.x)
                    .attr("y", d => d.y - 10)
                    .attr("text-anchor", "middle")
                    .text(d => d.name)
                    .style("font-size", "8px");
                
                // Add arrow marker
                svg.append("defs").append("marker")
                    .attr("id", "arrow")
                    .attr("viewBox", "0 -5 10 10")
                    .attr("refX", 15)
                    .attr("refY", 0)
                    .attr("markerWidth", 6)
                    .attr("markerHeight", 6)
                    .attr("orient", "auto")
                    .append("path")
                    .attr("d", "M0,-5L10,0L0,5")
                    .attr("fill", "#999");
            }});
        }}
        
        // Initialize the circular dependencies visualization
        createCircularDependenciesVisualization({json.dumps(circular_dependencies)});
        """
        
        return js_code

    def generate_all_visualizations(self) -> Dict[str, str]:
        """
        Generate all visualizations.

        Returns:
            A dictionary mapping visualization names to JavaScript code
        """
        visualizations = {
            "force_directed_graph": self.generate_force_directed_graph(),
            "hierarchical_directory": self.generate_hierarchical_directory_visualization(),
            "circular_dependencies": self.generate_circular_dependencies_visualization()
        }
        
        return visualizations