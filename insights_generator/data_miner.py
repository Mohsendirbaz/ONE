"""
Data Mining Module

This module provides functions for mining data from the outputs of the
directory structure analyzer and file association tracking system.
"""

import os
import json
from typing import Dict, List, Set, Any, Union, Optional, Tuple
from os import PathLike
from collections import Counter, defaultdict


class InsightsMiner:
    """Class for mining insights from directory structure and file association data."""

    def __init__(self, directory_structure_path: Union[str, PathLike], file_associations_path: Union[str, PathLike]):
        """
        Initialize the insights miner.

        Args:
            directory_structure_path: Path to the directory structure JSON file
            file_associations_path: Path to the file associations summary JSON file
        """
        self.directory_structure_path = os.path.abspath(directory_structure_path)
        self.file_associations_path = os.path.abspath(file_associations_path)
        
        # Load the data
        self.directory_structure = self._load_json(directory_structure_path)
        self.file_associations = self._load_json(file_associations_path)
        
        # Initialize insights storage
        self.insights = {
            "project_name": self.directory_structure.get("project_name", "Unknown Project"),
            "analysis_date": self.directory_structure.get("analysis_date", "Unknown Date"),
            "directory_insights": {},
            "file_insights": {},
            "entity_insights": {},
            "relationship_insights": {}
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
            print(f"Error loading JSON file {file_path}: {str(e)}")
            return {}
    
    def mine_directory_insights(self) -> Dict[str, Any]:
        """
        Mine insights from the directory structure.

        Returns:
            A dictionary of directory insights
        """
        insights = {}
        
        # Get the root directory
        root = self.directory_structure.get("root", {})
        
        # Count files and directories
        total_files = 0
        total_directories = 0
        
        # Helper function to count files and directories recursively
        def count_files_and_dirs(directory):
            nonlocal total_files, total_directories
            
            # Count files in this directory
            files = directory.get("files", [])
            total_files += len(files)
            
            # Count and process subdirectories
            subdirectories = directory.get("subdirectories", {})
            total_directories += len(subdirectories)
            
            # Process each subdirectory
            for subdir_name, subdir in subdirectories.items():
                count_files_and_dirs(subdir)
        
        # Start counting from the root
        count_files_and_dirs(root)
        
        # Store the counts
        insights["total_files"] = total_files
        insights["total_directories"] = total_directories
        
        # Analyze directory structure
        insights["directory_hierarchy"] = self._analyze_directory_hierarchy(root)
        
        # Find largest directories (by number of files)
        insights["largest_directories"] = self._find_largest_directories(root)
        
        # Store the insights
        self.insights["directory_insights"] = insights
        
        return insights
    
    def _analyze_directory_hierarchy(self, root: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the directory hierarchy.

        Args:
            root: The root directory

        Returns:
            A dictionary with hierarchy insights
        """
        hierarchy = {
            "name": root.get("name", "Unknown"),
            "path": root.get("absolute_path", "Unknown"),
            "file_count": len(root.get("files", [])),
            "subdirectory_count": len(root.get("subdirectories", {})),
            "subdirectories": []
        }
        
        # Process subdirectories
        for subdir_name, subdir in root.get("subdirectories", {}).items():
            hierarchy["subdirectories"].append(self._analyze_directory_hierarchy(subdir))
        
        return hierarchy
    
    def _find_largest_directories(self, root: Dict[str, Any], path: str = "") -> List[Dict[str, Any]]:
        """
        Find the largest directories by number of files.

        Args:
            root: The root directory
            path: The path to the current directory

        Returns:
            A list of dictionaries with directory information
        """
        result = []
        
        # Get the current directory name
        name = root.get("name", "Unknown")
        current_path = os.path.join(path, name) if path else name
        
        # Add the current directory
        result.append({
            "name": name,
            "path": current_path,
            "file_count": len(root.get("files", [])),
            "subdirectory_count": len(root.get("subdirectories", {}))
        })
        
        # Process subdirectories
        for subdir_name, subdir in root.get("subdirectories", {}).items():
            result.extend(self._find_largest_directories(subdir, current_path))
        
        # Sort by file count (descending)
        result.sort(key=lambda x: x["file_count"], reverse=True)
        
        # Return the top 10
        return result[:10]
    
    def mine_file_insights(self) -> Dict[str, Any]:
        """
        Mine insights from the file associations.

        Returns:
            A dictionary of file insights
        """
        insights = {}
        
        # Get the file associations summary
        summary = self.file_associations.get("summary", {})
        
        # Count files by type
        file_types = Counter()
        for file_path in summary.keys():
            _, ext = os.path.splitext(file_path)
            if ext:
                file_types[ext] += 1
        
        insights["file_types"] = dict(file_types.most_common())
        
        # Find most imported files
        most_imported = []
        for file_path, associations in summary.items():
            # Count how many other files import this file
            import_count = 0
            for other_file, other_associations in summary.items():
                if file_path != other_file and file_path in other_associations.get("direct_imports", []):
                    import_count += 1
            
            if import_count > 0:
                most_imported.append({
                    "file": file_path,
                    "import_count": import_count
                })
        
        # Sort by import count (descending)
        most_imported.sort(key=lambda x: x["import_count"], reverse=True)
        
        # Store the top 10
        insights["most_imported_files"] = most_imported[:10]
        
        # Find most importing files
        most_importing = []
        for file_path, associations in summary.items():
            import_count = len(associations.get("direct_imports", []))
            
            if import_count > 0:
                most_importing.append({
                    "file": file_path,
                    "import_count": import_count
                })
        
        # Sort by import count (descending)
        most_importing.sort(key=lambda x: x["import_count"], reverse=True)
        
        # Store the top 10
        insights["most_importing_files"] = most_importing[:10]
        
        # Store the insights
        self.insights["file_insights"] = insights
        
        return insights
    
    def mine_entity_insights(self) -> Dict[str, Any]:
        """
        Mine insights about entities (functions, classes, variables).

        Returns:
            A dictionary of entity insights
        """
        insights = {}
        
        # Get the file associations summary
        summary = self.file_associations.get("summary", {})
        
        # Count entities by type
        entity_types = Counter()
        entity_usage = defaultdict(lambda: {"defined_in": [], "used_in": []})
        
        for file_path, associations in summary.items():
            # Process common ports
            for port, info in associations.get("common_ports", {}).items():
                # Extract entity type and name
                if ":" in port:
                    entity_type, entity_name = port.split(":", 1)
                    entity_types[entity_type] += 1
                    
                    # Track usage
                    entity_usage[port]["defined_in"].extend(info.get("defined_in", []))
                    entity_usage[port]["used_in"].extend(info.get("used_in", []))
        
        insights["entity_types"] = dict(entity_types.most_common())
        
        # Find most widely used entities
        most_used = []
        for entity, usage in entity_usage.items():
            defined_in = set(usage["defined_in"])
            used_in = set(usage["used_in"])
            
            # Only include entities that are used in files other than where they're defined
            if defined_in and used_in and defined_in != used_in:
                most_used.append({
                    "entity": entity,
                    "defined_in_count": len(defined_in),
                    "used_in_count": len(used_in),
                    "total_usage": len(defined_in) + len(used_in)
                })
        
        # Sort by total usage (descending)
        most_used.sort(key=lambda x: x["total_usage"], reverse=True)
        
        # Store the top 20
        insights["most_used_entities"] = most_used[:20]
        
        # Store the insights
        self.insights["entity_insights"] = insights
        
        return insights
    
    def mine_relationship_insights(self) -> Dict[str, Any]:
        """
        Mine insights about relationships between files and entities.

        Returns:
            A dictionary of relationship insights
        """
        insights = {}
        
        # Get the file associations summary
        summary = self.file_associations.get("summary", {})
        
        # Build a graph of file relationships
        file_graph = defaultdict(set)
        for file_path, associations in summary.items():
            # Add direct imports
            for imported_file in associations.get("direct_imports", []):
                file_graph[file_path].add(imported_file)
                file_graph[imported_file]  # Ensure the imported file is in the graph
            
            # Add relationships through common ports
            for port, info in associations.get("common_ports", {}).items():
                defined_in = set(info.get("defined_in", []))
                used_in = set(info.get("used_in", []))
                
                # Connect files that define and use the same entity
                for def_file in defined_in:
                    for use_file in used_in:
                        if def_file != use_file:
                            file_graph[def_file].add(use_file)
                            file_graph[use_file]  # Ensure the using file is in the graph
        
        # Find central files (files with the most connections)
        central_files = []
        for file_path, connections in file_graph.items():
            central_files.append({
                "file": file_path,
                "connection_count": len(connections)
            })
        
        # Sort by connection count (descending)
        central_files.sort(key=lambda x: x["connection_count"], reverse=True)
        
        # Store the top 10
        insights["central_files"] = central_files[:10]
        
        # Find clusters of related files
        # (This is a simplified approach; a more sophisticated clustering algorithm could be used)
        clusters = self._find_file_clusters(file_graph)
        
        # Store the clusters
        insights["file_clusters"] = clusters
        
        # Store the insights
        self.insights["relationship_insights"] = insights
        
        return insights
    
    def _find_file_clusters(self, file_graph: Dict[str, Set[str]]) -> List[List[str]]:
        """
        Find clusters of related files using a simple connected components algorithm.

        Args:
            file_graph: A graph of file relationships

        Returns:
            A list of clusters, where each cluster is a list of file paths
        """
        # Initialize clusters
        clusters = []
        visited = set()
        
        # Helper function for depth-first search
        def dfs(file_path, cluster):
            visited.add(file_path)
            cluster.append(file_path)
            
            for connected_file in file_graph.get(file_path, set()):
                if connected_file not in visited:
                    dfs(connected_file, cluster)
        
        # Find connected components
        for file_path in file_graph.keys():
            if file_path not in visited:
                cluster = []
                dfs(file_path, cluster)
                clusters.append(cluster)
        
        # Sort clusters by size (descending)
        clusters.sort(key=len, reverse=True)
        
        # Return the top 10 clusters
        return clusters[:10]
    
    def mine_all_insights(self) -> Dict[str, Any]:
        """
        Mine all insights.

        Returns:
            A dictionary of all insights
        """
        self.mine_directory_insights()
        self.mine_file_insights()
        self.mine_entity_insights()
        self.mine_relationship_insights()
        
        return self.insights
    
    def save_insights(self, output_path: Union[str, PathLike]) -> str:
        """
        Save the insights to a JSON file.

        Args:
            output_path: Path where the output JSON file will be saved

        Returns:
            The path to the created JSON file
        """
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.insights, f, indent=2)
        
        return str(output_path)