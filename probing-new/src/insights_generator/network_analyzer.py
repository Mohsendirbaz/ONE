"""
Network Analyzer Module

This module provides functionality for analyzing networks of entities and their
relationships. It identifies patterns, clusters, and important nodes in the network.
"""

import logging
import math
from typing import Dict, List, Any, Optional, Tuple, Set
from collections import defaultdict, Counter

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NetworkAnalyzer:
    """
    A class for analyzing networks of entities and their relationships.
    
    This class provides methods for analyzing networks of entities and their
    relationships. It identifies patterns, clusters, and important nodes in
    the network.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the NetworkAnalyzer with optional configuration.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        logger.info("NetworkAnalyzer initialized with config: %s", self.config)
    
    def analyze_code_network(self, code_entities_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the network of code entities and their relationships.
        
        Args:
            code_entities_data: Code entities data from the data miner
            
        Returns:
            Dictionary containing network analysis results
        """
        logger.info("Analyzing code network")
        
        if "error" in code_entities_data:
            logger.error("Error in code entities data: %s", code_entities_data["error"])
            return {"error": code_entities_data["error"]}
        
        entities = code_entities_data.get("code_entities", [])
        relationships = code_entities_data.get("relationships", [])
        
        # Build adjacency list
        adjacency_list = self._build_adjacency_list(entities, relationships)
        
        # Calculate network metrics
        degree_centrality = self._calculate_degree_centrality(adjacency_list)
        betweenness_centrality = self._calculate_betweenness_centrality(adjacency_list)
        clusters = self._identify_clusters(adjacency_list)
        
        # Identify central nodes
        central_nodes = self._identify_central_nodes(degree_centrality, betweenness_centrality)
        
        # Calculate network density
        node_count = len(adjacency_list)
        edge_count = sum(len(neighbors) for neighbors in adjacency_list.values())
        max_possible_edges = node_count * (node_count - 1) if node_count > 1 else 0
        density = edge_count / max_possible_edges if max_possible_edges > 0 else 0
        
        return {
            "node_count": node_count,
            "edge_count": edge_count,
            "density": density,
            "degree_centrality": degree_centrality,
            "betweenness_centrality": betweenness_centrality,
            "clusters": clusters,
            "central_nodes": central_nodes
        }
    
    def _build_adjacency_list(self, entities: List[Dict[str, Any]], 
                             relationships: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """
        Build an adjacency list representation of the network.
        
        Args:
            entities: List of entities
            relationships: List of relationships between entities
            
        Returns:
            Dictionary mapping entity names to lists of connected entity names
        """
        # Create a mapping of entity IDs to names
        entity_names = {}
        for entity in entities:
            entity_id = entity.get("file", "") + ":" + entity.get("name", "")
            entity_names[entity_id] = entity.get("name", "")
        
        # Build adjacency list
        adjacency_list = defaultdict(list)
        
        for relationship in relationships:
            source = relationship.get("source", "")
            imported = relationship.get("imported", "")
            
            if source and imported:
                adjacency_list[source].append(imported)
                # For undirected graph, add the reverse edge as well
                adjacency_list[imported].append(source)
        
        return dict(adjacency_list)
    
    def _calculate_degree_centrality(self, adjacency_list: Dict[str, List[str]]) -> Dict[str, float]:
        """
        Calculate degree centrality for each node in the network.
        
        Args:
            adjacency_list: Adjacency list representation of the network
            
        Returns:
            Dictionary mapping node names to degree centrality scores
        """
        degree_centrality = {}
        max_degree = 0
        
        # Calculate degrees
        for node, neighbors in adjacency_list.items():
            degree = len(neighbors)
            degree_centrality[node] = degree
            max_degree = max(max_degree, degree)
        
        # Normalize
        n = len(adjacency_list)
        normalization_factor = 1.0 if n <= 1 else 1.0 / (n - 1)
        
        for node in degree_centrality:
            degree_centrality[node] = degree_centrality[node] * normalization_factor
        
        return degree_centrality
    
    def _calculate_betweenness_centrality(self, adjacency_list: Dict[str, List[str]]) -> Dict[str, float]:
        """
        Calculate betweenness centrality for each node in the network.
        
        This is a simplified implementation that uses breadth-first search
        to find shortest paths.
        
        Args:
            adjacency_list: Adjacency list representation of the network
            
        Returns:
            Dictionary mapping node names to betweenness centrality scores
        """
        betweenness_centrality = {node: 0.0 for node in adjacency_list}
        
        # For small networks, we can do a full calculation
        if len(adjacency_list) <= 100:
            for s in adjacency_list:
                # BFS to find shortest paths
                distances = {}
                paths = {}
                visited = set()
                queue = [s]
                distances[s] = 0
                paths[s] = [[s]]
                
                while queue:
                    node = queue.pop(0)
                    if node in visited:
                        continue
                    visited.add(node)
                    
                    for neighbor in adjacency_list.get(node, []):
                        if neighbor not in distances:
                            distances[neighbor] = distances[node] + 1
                            paths[neighbor] = [path + [neighbor] for path in paths[node]]
                            queue.append(neighbor)
                        elif distances[neighbor] == distances[node] + 1:
                            paths[neighbor].extend([path + [neighbor] for path in paths[node]])
                
                # Count shortest paths going through each node
                for t in adjacency_list:
                    if s != t:
                        for path in paths.get(t, []):
                            for node in path[1:-1]:  # Exclude source and target
                                betweenness_centrality[node] += 1.0 / len(paths.get(t, []))
        else:
            # For larger networks, use a sampling approach or just return degree centrality
            logger.warning("Network too large for exact betweenness centrality calculation. Using approximation.")
            return self._calculate_degree_centrality(adjacency_list)
        
        # Normalize
        n = len(adjacency_list)
        normalization_factor = 1.0 if n <= 2 else 2.0 / ((n - 1) * (n - 2))
        
        for node in betweenness_centrality:
            betweenness_centrality[node] = betweenness_centrality[node] * normalization_factor
        
        return betweenness_centrality
    
    def _identify_clusters(self, adjacency_list: Dict[str, List[str]]) -> List[List[str]]:
        """
        Identify clusters in the network using a simple connected components algorithm.
        
        Args:
            adjacency_list: Adjacency list representation of the network
            
        Returns:
            List of clusters, where each cluster is a list of node names
        """
        clusters = []
        unvisited = set(adjacency_list.keys())
        
        while unvisited:
            # Start a new cluster
            start_node = next(iter(unvisited))
            cluster = []
            queue = [start_node]
            visited = set()
            
            # BFS to find all connected nodes
            while queue:
                node = queue.pop(0)
                if node in visited:
                    continue
                
                visited.add(node)
                unvisited.discard(node)
                cluster.append(node)
                
                for neighbor in adjacency_list.get(node, []):
                    if neighbor not in visited and neighbor in unvisited:
                        queue.append(neighbor)
            
            clusters.append(cluster)
        
        # Sort clusters by size (largest first)
        return sorted(clusters, key=len, reverse=True)
    
    def _identify_central_nodes(self, degree_centrality: Dict[str, float], 
                               betweenness_centrality: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Identify central nodes in the network based on centrality measures.
        
        Args:
            degree_centrality: Dictionary mapping node names to degree centrality scores
            betweenness_centrality: Dictionary mapping node names to betweenness centrality scores
            
        Returns:
            List of central nodes with their centrality scores
        """
        # Combine centrality measures
        combined_centrality = {}
        for node in degree_centrality:
            combined_centrality[node] = {
                "node": node,
                "degree_centrality": degree_centrality.get(node, 0),
                "betweenness_centrality": betweenness_centrality.get(node, 0),
                "combined_score": degree_centrality.get(node, 0) + betweenness_centrality.get(node, 0)
            }
        
        # Sort by combined score
        central_nodes = sorted(combined_centrality.values(), 
                              key=lambda x: x["combined_score"], 
                              reverse=True)
        
        # Return top 10 or fewer
        return central_nodes[:min(10, len(central_nodes))]
    
    def analyze_financial_network(self, financial_entities_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the network of financial entities and their relationships.
        
        Args:
            financial_entities_data: Financial entities data from the data miner
            
        Returns:
            Dictionary containing network analysis results
        """
        logger.info("Analyzing financial network")
        
        if "error" in financial_entities_data:
            logger.error("Error in financial entities data: %s", financial_entities_data["error"])
            return {"error": financial_entities_data["error"]}
        
        entities = financial_entities_data.get("financial_entities", [])
        relationships = financial_entities_data.get("relationships", [])
        
        # Build adjacency list for financial network
        adjacency_list = self._build_financial_adjacency_list(entities, relationships)
        
        # Calculate network metrics
        degree_centrality = self._calculate_degree_centrality(adjacency_list)
        clusters = self._identify_clusters(adjacency_list)
        
        # Identify central nodes
        central_nodes = sorted(degree_centrality.items(), key=lambda x: x[1], reverse=True)
        central_nodes = [{"node": node, "centrality": score} for node, score in central_nodes[:min(10, len(central_nodes))]]
        
        # Calculate network density
        node_count = len(adjacency_list)
        edge_count = sum(len(neighbors) for neighbors in adjacency_list.values())
        max_possible_edges = node_count * (node_count - 1) if node_count > 1 else 0
        density = edge_count / max_possible_edges if max_possible_edges > 0 else 0
        
        return {
            "node_count": node_count,
            "edge_count": edge_count,
            "density": density,
            "degree_centrality": degree_centrality,
            "clusters": clusters,
            "central_nodes": central_nodes
        }
    
    def _build_financial_adjacency_list(self, entities: List[Dict[str, Any]], 
                                       relationships: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """
        Build an adjacency list representation of the financial network.
        
        Args:
            entities: List of financial entities
            relationships: List of relationships between financial entities
            
        Returns:
            Dictionary mapping entity names to lists of connected entity names
        """
        # Create a mapping of entity names
        entity_names = {entity.get("name", ""): entity.get("name", "") for entity in entities}
        
        # Build adjacency list
        adjacency_list = defaultdict(list)
        
        for relationship in relationships:
            from_entity = relationship.get("from", "")
            to_entity = relationship.get("to", "")
            
            if from_entity and to_entity:
                adjacency_list[from_entity].append(to_entity)
                # For undirected graph, add the reverse edge as well
                adjacency_list[to_entity].append(from_entity)
        
        return dict(adjacency_list)
    
    def analyze_file_network(self, file_associations: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the network of files and their associations.
        
        Args:
            file_associations: File association data from the data miner
            
        Returns:
            Dictionary containing network analysis results
        """
        logger.info("Analyzing file network")
        
        if "error" in file_associations:
            logger.error("Error in file associations: %s", file_associations["error"])
            return {"error": file_associations["error"]}
        
        associations = file_associations.get("file_associations", {})
        
        # Build adjacency list for file network
        adjacency_list = {}
        for file, connected_files in associations.items():
            if isinstance(connected_files, list):
                adjacency_list[file] = connected_files
        
        # Calculate network metrics
        degree_centrality = self._calculate_degree_centrality(adjacency_list)
        clusters = self._identify_clusters(adjacency_list)
        
        # Identify central files
        central_files = sorted(degree_centrality.items(), key=lambda x: x[1], reverse=True)
        central_files = [{"file": file, "centrality": score} for file, score in central_files[:min(10, len(central_files))]]
        
        # Calculate network density
        node_count = len(adjacency_list)
        edge_count = sum(len(neighbors) for neighbors in adjacency_list.values())
        max_possible_edges = node_count * (node_count - 1) if node_count > 1 else 0
        density = edge_count / max_possible_edges if max_possible_edges > 0 else 0
        
        return {
            "node_count": node_count,
            "edge_count": edge_count,
            "density": density,
            "degree_centrality": degree_centrality,
            "clusters": clusters,
            "central_files": central_files
        }
    
    def analyze_all_networks(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze all networks in the data.
        
        Args:
            data: Data containing code entities, financial entities, and file associations
            
        Returns:
            Dictionary containing network analysis results for all networks
        """
        logger.info("Analyzing all networks")
        
        code_network = self.analyze_code_network(data.get("code_entity", {}))
        financial_network = self.analyze_financial_network(data.get("financial_entity", {}))
        file_network = self.analyze_file_network(data.get("file_associations", {}))
        
        return {
            "timestamp": data.get("timestamp", ""),
            "source_path": data.get("source_path", ""),
            "code_network": code_network,
            "financial_network": financial_network,
            "file_network": file_network
        }


# Example usage
if __name__ == "__main__":
    from data_miner import DataMiner
    
    miner = DataMiner()
    data = miner.mine_all_data("./example_repo")
    
    analyzer = NetworkAnalyzer()
    network_analysis = analyzer.analyze_all_networks(data)
    
    print(f"Code network: {network_analysis['code_network']['node_count']} nodes, {network_analysis['code_network']['edge_count']} edges")
    print(f"Financial network: {network_analysis['financial_network']['node_count']} nodes, {network_analysis['financial_network']['edge_count']} edges")
    print(f"File network: {network_analysis['file_network']['node_count']} nodes, {network_analysis['file_network']['edge_count']} edges")
