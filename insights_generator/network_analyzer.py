"""
Network Analysis Module

This module provides functions for analyzing the network structure of code relationships
using NetworkX. It includes functions for detecting circular dependencies, calculating
coupling and cohesion metrics, and identifying architectural patterns and bottlenecks.
"""

import os
import json
import networkx as nx
from typing import Dict, List, Set, Any, Union, Optional, Tuple
from os import PathLike
from collections import Counter, defaultdict


class NetworkAnalyzer:
    """Class for analyzing the network structure of code relationships."""

    def __init__(self, graph: nx.DiGraph):
        """
        Initialize the network analyzer.

        Args:
            graph: A directed graph of file relationships
        """
        self.graph = graph
        self.insights = {}

    def detect_circular_dependencies(self) -> List[List[str]]:
        """
        Detect circular dependencies in the code.

        Returns:
            A list of cycles, where each cycle is a list of file paths
        """
        cycles = list(nx.simple_cycles(self.graph))
        self.insights["circular_dependencies"] = cycles
        return cycles

    def calculate_centrality_metrics(self) -> Dict[str, Dict[str, float]]:
        """
        Calculate centrality metrics for files in the code.

        Returns:
            A dictionary mapping file paths to centrality metrics
        """
        # Calculate betweenness centrality
        betweenness = nx.betweenness_centrality(self.graph)
        
        # Calculate degree centrality
        in_degree = nx.in_degree_centrality(self.graph)
        out_degree = nx.out_degree_centrality(self.graph)
        
        # Calculate closeness centrality
        try:
            closeness = nx.closeness_centrality(self.graph)
        except nx.NetworkXError:
            # Closeness centrality requires a strongly connected graph
            closeness = {}
        
        # Calculate eigenvector centrality
        try:
            eigenvector = nx.eigenvector_centrality(self.graph)
        except (nx.NetworkXError, nx.PowerIterationFailedConvergence):
            # Eigenvector centrality may fail to converge
            eigenvector = {}
        
        # Combine all metrics
        centrality_metrics = {}
        for node in self.graph.nodes():
            centrality_metrics[node] = {
                "betweenness": betweenness.get(node, 0),
                "in_degree": in_degree.get(node, 0),
                "out_degree": out_degree.get(node, 0),
                "closeness": closeness.get(node, 0),
                "eigenvector": eigenvector.get(node, 0)
            }
        
        self.insights["centrality_metrics"] = centrality_metrics
        return centrality_metrics

    def identify_bottlenecks(self) -> List[Dict[str, Any]]:
        """
        Identify bottlenecks in the code.

        Returns:
            A list of bottlenecks, where each bottleneck is a dictionary with file path and metrics
        """
        # Calculate betweenness centrality
        betweenness = nx.betweenness_centrality(self.graph)
        
        # Sort by betweenness centrality (descending)
        bottlenecks = [
            {"file": node, "betweenness": score}
            for node, score in sorted(betweenness.items(), key=lambda x: x[1], reverse=True)
        ]
        
        # Take the top 10
        bottlenecks = bottlenecks[:10]
        
        self.insights["bottlenecks"] = bottlenecks
        return bottlenecks

    def calculate_coupling_metrics(self) -> Dict[str, Dict[str, float]]:
        """
        Calculate coupling metrics for files in the code.

        Returns:
            A dictionary mapping file paths to coupling metrics
        """
        coupling_metrics = {}
        
        # Calculate afferent coupling (incoming dependencies)
        for node in self.graph.nodes():
            afferent = len(list(self.graph.predecessors(node)))
            
            # Calculate efferent coupling (outgoing dependencies)
            efferent = len(list(self.graph.successors(node)))
            
            # Calculate instability (I = Ce / (Ca + Ce))
            instability = 0
            if afferent + efferent > 0:
                instability = efferent / (afferent + efferent)
            
            coupling_metrics[node] = {
                "afferent": afferent,
                "efferent": efferent,
                "instability": instability
            }
        
        self.insights["coupling_metrics"] = coupling_metrics
        return coupling_metrics

    def detect_communities(self) -> List[List[str]]:
        """
        Detect communities in the code.

        Returns:
            A list of communities, where each community is a list of file paths
        """
        # Convert to undirected graph for community detection
        undirected_graph = self.graph.to_undirected()
        
        # Detect communities using the Louvain method
        try:
            import community
            partition = community.best_partition(undirected_graph)
            
            # Group nodes by community
            communities = defaultdict(list)
            for node, community_id in partition.items():
                communities[community_id].append(node)
            
            # Convert to list of communities
            community_list = list(communities.values())
            
        except ImportError:
            # Fall back to greedy modularity communities if python-louvain is not available
            community_list = list(nx.community.greedy_modularity_communities(undirected_graph))
            community_list = [list(c) for c in community_list]
        
        self.insights["communities"] = community_list
        return community_list

    def analyze_network(self) -> Dict[str, Any]:
        """
        Analyze the network structure of code relationships.

        Returns:
            A dictionary of network insights
        """
        # Detect circular dependencies
        self.detect_circular_dependencies()
        
        # Calculate centrality metrics
        self.calculate_centrality_metrics()
        
        # Identify bottlenecks
        self.identify_bottlenecks()
        
        # Calculate coupling metrics
        self.calculate_coupling_metrics()
        
        # Detect communities
        self.detect_communities()
        
        return self.insights