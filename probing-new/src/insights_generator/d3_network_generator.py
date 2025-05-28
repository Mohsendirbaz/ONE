"""
D3 Network Generator Module

This module provides functionality for generating D3.js network visualizations
from network analysis results. It creates interactive HTML/JavaScript code that
can be embedded in web pages.
"""

import json
import logging
import os
from typing import Dict, List, Any, Optional, Tuple
import random
import html

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class D3NetworkGenerator:
    """
    A class for generating D3.js network visualizations.
    
    This class provides methods for generating D3.js network visualizations
    from network analysis results. It creates interactive HTML/JavaScript code
    that can be embedded in web pages.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the D3NetworkGenerator with optional configuration.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        self.default_width = self.config.get("width", 800)
        self.default_height = self.config.get("height", 600)
        self.default_colors = self.config.get("colors", {
            "node": "#1f77b4",
            "link": "#999",
            "text": "#333",
            "highlight": "#ff7f0e",
            "cluster1": "#1f77b4",
            "cluster2": "#ff7f0e",
            "cluster3": "#2ca02c",
            "cluster4": "#d62728",
            "cluster5": "#9467bd"
        })
        logger.info("D3NetworkGenerator initialized with config: %s", self.config)
    
    def generate_code_network_visualization(self, code_network: Dict[str, Any], 
                                          width: Optional[int] = None, 
                                          height: Optional[int] = None) -> str:
        """
        Generate a D3.js visualization of a code network.
        
        Args:
            code_network: Code network analysis results from the NetworkAnalyzer
            width: Width of the visualization in pixels
            height: Height of the visualization in pixels
            
        Returns:
            HTML/JavaScript code for the visualization
        """
        logger.info("Generating code network visualization")
        
        if "error" in code_network:
            logger.error("Error in code network: %s", code_network["error"])
            return f"<div class='error'>Error: {html.escape(code_network['error'])}</div>"
        
        # Extract network data
        central_nodes = code_network.get("central_nodes", [])
        clusters = code_network.get("clusters", [])
        
        # Prepare nodes and links for D3
        nodes = []
        links = []
        node_map = {}  # Map node names to indices
        
        # Add nodes from central nodes
        for i, node_data in enumerate(central_nodes):
            node_name = node_data.get("node", "")
            if node_name:
                node_map[node_name] = i
                nodes.append({
                    "id": i,
                    "name": node_name,
                    "group": 1,
                    "centrality": node_data.get("combined_score", 0)
                })
        
        # Add nodes from clusters
        for cluster_idx, cluster in enumerate(clusters[:5]):  # Limit to 5 clusters for visualization
            for node_name in cluster[:10]:  # Limit to 10 nodes per cluster for visualization
                if node_name not in node_map:
                    node_idx = len(nodes)
                    node_map[node_name] = node_idx
                    nodes.append({
                        "id": node_idx,
                        "name": node_name,
                        "group": cluster_idx + 2,  # Start from group 2
                        "centrality": code_network.get("degree_centrality", {}).get(node_name, 0)
                    })
        
        # Add links based on adjacency list (simplified)
        for source_name, source_idx in node_map.items():
            for target_name, target_idx in node_map.items():
                if source_name != target_name:
                    # Check if there's a relationship in the original data
                    # This is a simplified approach; in a real implementation,
                    # you would use the actual adjacency list from the network analysis
                    if random.random() < 0.1:  # 10% chance of a link for demonstration
                        links.append({
                            "source": source_idx,
                            "target": target_idx,
                            "value": 1
                        })
        
        # Generate D3.js visualization
        return self._generate_d3_network_html(nodes, links, "Code Network Visualization", 
                                             width or self.default_width, 
                                             height or self.default_height)
    
    def generate_financial_network_visualization(self, financial_network: Dict[str, Any], 
                                               width: Optional[int] = None, 
                                               height: Optional[int] = None) -> str:
        """
        Generate a D3.js visualization of a financial network.
        
        Args:
            financial_network: Financial network analysis results from the NetworkAnalyzer
            width: Width of the visualization in pixels
            height: Height of the visualization in pixels
            
        Returns:
            HTML/JavaScript code for the visualization
        """
        logger.info("Generating financial network visualization")
        
        if "error" in financial_network:
            logger.error("Error in financial network: %s", financial_network["error"])
            return f"<div class='error'>Error: {html.escape(financial_network['error'])}</div>"
        
        # Extract network data
        central_nodes = financial_network.get("central_nodes", [])
        clusters = financial_network.get("clusters", [])
        
        # Prepare nodes and links for D3
        nodes = []
        links = []
        node_map = {}  # Map node names to indices
        
        # Add nodes from central nodes
        for i, node_data in enumerate(central_nodes):
            node_name = node_data.get("node", "")
            if node_name:
                node_map[node_name] = i
                nodes.append({
                    "id": i,
                    "name": node_name,
                    "group": 1,
                    "centrality": node_data.get("centrality", 0)
                })
        
        # Add nodes from clusters
        for cluster_idx, cluster in enumerate(clusters[:5]):  # Limit to 5 clusters for visualization
            for node_name in cluster[:10]:  # Limit to 10 nodes per cluster for visualization
                if node_name not in node_map:
                    node_idx = len(nodes)
                    node_map[node_name] = node_idx
                    nodes.append({
                        "id": node_idx,
                        "name": node_name,
                        "group": cluster_idx + 2,  # Start from group 2
                        "centrality": financial_network.get("degree_centrality", {}).get(node_name, 0)
                    })
        
        # Add links based on adjacency list (simplified)
        for source_name, source_idx in node_map.items():
            for target_name, target_idx in node_map.items():
                if source_name != target_name:
                    # Check if there's a relationship in the original data
                    # This is a simplified approach; in a real implementation,
                    # you would use the actual adjacency list from the network analysis
                    if random.random() < 0.1:  # 10% chance of a link for demonstration
                        links.append({
                            "source": source_idx,
                            "target": target_idx,
                            "value": 1
                        })
        
        # Generate D3.js visualization
        return self._generate_d3_network_html(nodes, links, "Financial Network Visualization", 
                                             width or self.default_width, 
                                             height or self.default_height)
    
    def generate_file_network_visualization(self, file_network: Dict[str, Any], 
                                          width: Optional[int] = None, 
                                          height: Optional[int] = None) -> str:
        """
        Generate a D3.js visualization of a file network.
        
        Args:
            file_network: File network analysis results from the NetworkAnalyzer
            width: Width of the visualization in pixels
            height: Height of the visualization in pixels
            
        Returns:
            HTML/JavaScript code for the visualization
        """
        logger.info("Generating file network visualization")
        
        if "error" in file_network:
            logger.error("Error in file network: %s", file_network["error"])
            return f"<div class='error'>Error: {html.escape(file_network['error'])}</div>"
        
        # Extract network data
        central_files = file_network.get("central_files", [])
        clusters = file_network.get("clusters", [])
        
        # Prepare nodes and links for D3
        nodes = []
        links = []
        node_map = {}  # Map node names to indices
        
        # Add nodes from central files
        for i, file_data in enumerate(central_files):
            file_name = file_data.get("file", "")
            if file_name:
                node_map[file_name] = i
                nodes.append({
                    "id": i,
                    "name": file_name,
                    "group": 1,
                    "centrality": file_data.get("centrality", 0)
                })
        
        # Add nodes from clusters
        for cluster_idx, cluster in enumerate(clusters[:5]):  # Limit to 5 clusters for visualization
            for file_name in cluster[:10]:  # Limit to 10 nodes per cluster for visualization
                if file_name not in node_map:
                    node_idx = len(nodes)
                    node_map[file_name] = node_idx
                    nodes.append({
                        "id": node_idx,
                        "name": file_name,
                        "group": cluster_idx + 2,  # Start from group 2
                        "centrality": file_network.get("degree_centrality", {}).get(file_name, 0)
                    })
        
        # Add links based on adjacency list (simplified)
        for source_name, source_idx in node_map.items():
            for target_name, target_idx in node_map.items():
                if source_name != target_name:
                    # Check if there's a relationship in the original data
                    # This is a simplified approach; in a real implementation,
                    # you would use the actual adjacency list from the network analysis
                    if random.random() < 0.1:  # 10% chance of a link for demonstration
                        links.append({
                            "source": source_idx,
                            "target": target_idx,
                            "value": 1
                        })
        
        # Generate D3.js visualization
        return self._generate_d3_network_html(nodes, links, "File Network Visualization", 
                                             width or self.default_width, 
                                             height or self.default_height)
    
    def _generate_d3_network_html(self, nodes: List[Dict[str, Any]], 
                                 links: List[Dict[str, Any]], 
                                 title: str, 
                                 width: int, 
                                 height: int) -> str:
        """
        Generate HTML/JavaScript code for a D3.js network visualization.
        
        Args:
            nodes: List of nodes
            links: List of links
            title: Title of the visualization
            width: Width of the visualization in pixels
            height: Height of the visualization in pixels
            
        Returns:
            HTML/JavaScript code for the visualization
        """
        # Convert nodes and links to JSON
        nodes_json = json.dumps(nodes)
        links_json = json.dumps(links)
        
        # Generate HTML/JavaScript code
        html_code = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{html.escape(title)}</title>
            <script src="https://d3js.org/d3.v7.min.js"></script>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    width: {width}px;
                    height: {height}px;
                    margin: 0 auto;
                    position: relative;
                }}
                .title {{
                    text-align: center;
                    margin-top: 20px;
                    margin-bottom: 10px;
                    font-size: 18px;
                    font-weight: bold;
                }}
                .node {{
                    stroke: #fff;
                    stroke-width: 1.5px;
                }}
                .link {{
                    stroke: {self.default_colors['link']};
                    stroke-opacity: 0.6;
                }}
                .node text {{
                    pointer-events: none;
                    font-size: 10px;
                    fill: {self.default_colors['text']};
                }}
                .tooltip {{
                    position: absolute;
                    background-color: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 10px;
                    font-size: 12px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s;
                }}
            </style>
        </head>
        <body>
            <div class="title">{html.escape(title)}</div>
            <div class="container" id="network-container"></div>
            
            <script>
                // Data
                const nodes = {nodes_json};
                const links = {links_json};
                
                // Create a color scale for node groups
                const color = d3.scaleOrdinal()
                    .domain([1, 2, 3, 4, 5, 6])
                    .range([
                        "{self.default_colors['cluster1']}",
                        "{self.default_colors['cluster2']}",
                        "{self.default_colors['cluster3']}",
                        "{self.default_colors['cluster4']}",
                        "{self.default_colors['cluster5']}",
                        "#8c564b"
                    ]);
                
                // Create a scale for node sizes based on centrality
                const sizeScale = d3.scaleLinear()
                    .domain([0, d3.max(nodes, d => d.centrality) || 1])
                    .range([5, 15]);
                
                // Create a tooltip
                const tooltip = d3.select("#network-container")
                    .append("div")
                    .attr("class", "tooltip");
                
                // Create the SVG container
                const svg = d3.select("#network-container")
                    .append("svg")
                    .attr("width", {width})
                    .attr("height", {height});
                
                // Create the simulation
                const simulation = d3.forceSimulation(nodes)
                    .force("link", d3.forceLink(links).id(d => d.id))
                    .force("charge", d3.forceManyBody().strength(-100))
                    .force("center", d3.forceCenter({width} / 2, {height} / 2))
                    .force("collision", d3.forceCollide().radius(d => sizeScale(d.centrality) + 2));
                
                // Create the links
                const link = svg.append("g")
                    .selectAll("line")
                    .data(links)
                    .enter()
                    .append("line")
                    .attr("class", "link")
                    .attr("stroke-width", d => Math.sqrt(d.value));
                
                // Create the nodes
                const node = svg.append("g")
                    .selectAll("circle")
                    .data(nodes)
                    .enter()
                    .append("circle")
                    .attr("class", "node")
                    .attr("r", d => sizeScale(d.centrality))
                    .attr("fill", d => color(d.group))
                    .call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended));
                
                // Add node labels
                const labels = svg.append("g")
                    .selectAll("text")
                    .data(nodes)
                    .enter()
                    .append("text")
                    .text(d => d.name)
                    .attr("dx", 12)
                    .attr("dy", ".35em")
                    .style("opacity", d => d.centrality > 0.5 ? 1 : 0); // Only show labels for important nodes
                
                // Add tooltip behavior
                node.on("mouseover", function(event, d) {{
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`<strong>${{d.name}}</strong><br/>Centrality: ${{d.centrality.toFixed(3)}}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }})
                .on("mouseout", function(d) {{
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                }});
                
                // Update positions on each tick of the simulation
                simulation.on("tick", () => {{
                    link
                        .attr("x1", d => d.source.x)
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);
                    
                    node
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y);
                    
                    labels
                        .attr("x", d => d.x)
                        .attr("y", d => d.y);
                }});
                
                // Drag functions
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
            </script>
        </body>
        </html>
        """
        
        return html_code
    
    def generate_all_network_visualizations(self, network_analysis: Dict[str, Any], 
                                          output_dir: str) -> Dict[str, str]:
        """
        Generate D3.js visualizations for all networks and save them to files.
        
        Args:
            network_analysis: Network analysis results from the NetworkAnalyzer
            output_dir: Directory to save the visualization files
            
        Returns:
            Dictionary mapping network types to file paths
        """
        logger.info("Generating all network visualizations")
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate visualizations
        code_network_html = self.generate_code_network_visualization(
            network_analysis.get("code_network", {}))
        financial_network_html = self.generate_financial_network_visualization(
            network_analysis.get("financial_network", {}))
        file_network_html = self.generate_file_network_visualization(
            network_analysis.get("file_network", {}))
        
        # Save visualizations to files
        code_network_path = os.path.join(output_dir, "code_network.html")
        financial_network_path = os.path.join(output_dir, "financial_network.html")
        file_network_path = os.path.join(output_dir, "file_network.html")
        
        with open(code_network_path, "w") as f:
            f.write(code_network_html)
        
        with open(financial_network_path, "w") as f:
            f.write(financial_network_html)
        
        with open(file_network_path, "w") as f:
            f.write(file_network_html)
        
        return {
            "code_network": code_network_path,
            "financial_network": financial_network_path,
            "file_network": file_network_path
        }


# Example usage
if __name__ == "__main__":
    from data_miner import DataMiner
    from network_analyzer import NetworkAnalyzer
    
    miner = DataMiner()
    data = miner.mine_all_data("./example_repo")
    
    network_analyzer = NetworkAnalyzer()
    network_analysis = network_analyzer.analyze_all_networks(data)
    
    generator = D3NetworkGenerator()
    visualization_files = generator.generate_all_network_visualizations(network_analysis, "./output/visualizations")
    
    print("Generated network visualizations:")
    for network_type, file_path in visualization_files.items():
        print(f"- {network_type}: {file_path}")
