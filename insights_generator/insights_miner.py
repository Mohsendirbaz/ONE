"""
Insights Mining Module

This module provides the InsightsMiner class for mining insights from all file association
data sources. It integrates with the NetworkAnalyzer to provide advanced code structure
analysis and generates intelligent insights about the codebase.
"""

import os
import json
import networkx as nx
from typing import Dict, List, Set, Any, Union, Optional, Tuple
from os import PathLike
from collections import Counter, defaultdict
from datetime import datetime

try:
    # Try relative import (when imported as part of a package)
    from .network_analyzer import NetworkAnalyzer
except ImportError:
    # Fall back to absolute import (when run directly as a script)
    from network_analyzer import NetworkAnalyzer


class InsightsMiner:
    """Class for mining insights from all file association data sources."""

    def __init__(self, 
                 summary_path: Union[str, PathLike],
                 direct_imports_path: Optional[Union[str, PathLike]] = None,
                 common_ports_path: Optional[Union[str, PathLike]] = None,
                 file_associations_path: Optional[Union[str, PathLike]] = None,
                 directory_structure_path: Optional[Union[str, PathLike]] = None):
        """
        Initialize with all relevant data sources from the tracking system.

        If only summary_path is provided, attempt to extract the locations
        of the other files from the summary data.

        Args:
            summary_path: Path to the file associations summary JSON file
            direct_imports_path: Path to the direct imports JSON file (optional)
            common_ports_path: Path to the common ports JSON file (optional)
            file_associations_path: Path to the file associations JSON file (optional)
            directory_structure_path: Path to the directory structure JSON file (optional)
        """
        self.summary_path = os.path.abspath(summary_path)

        # Load the summary data
        self.summary = self._load_json(summary_path)

        # Extract timestamp from summary path
        timestamp = os.path.basename(summary_path).split('_')[-1].split('.')[0]

        # Get the directory containing the summary file
        summary_dir = os.path.dirname(summary_path)

        # If other paths are not provided, try to construct them from the summary path
        if direct_imports_path is None:
            direct_imports_path = os.path.join(summary_dir, f"direct_imports_{timestamp}.json")
        if common_ports_path is None:
            common_ports_path = os.path.join(summary_dir, f"common_ports_{timestamp}.json")
        if file_associations_path is None:
            file_associations_path = os.path.join(summary_dir, f"file_associations_{timestamp}.json")

        # Store the paths
        self.direct_imports_path = os.path.abspath(direct_imports_path)
        self.common_ports_path = os.path.abspath(common_ports_path)
        self.file_associations_path = os.path.abspath(file_associations_path)

        # Load the data if the files exist
        self.direct_imports = self._load_json(direct_imports_path)
        self.common_ports = self._load_json(common_ports_path)
        self.file_associations = self._load_json(file_associations_path)

        # Load the directory structure if provided
        if directory_structure_path:
            self.directory_structure_path = os.path.abspath(directory_structure_path)
            self.directory_structure = self._load_json(directory_structure_path)
        else:
            self.directory_structure_path = None
            self.directory_structure = {}

        # Initialize insights storage
        self.insights = {
            "project_name": self.summary.get("project_name", "Unknown Project"),
            "analysis_date": self.summary.get("analysis_date", "Unknown Date"),
            "directory_insights": {},
            "file_insights": {},
            "entity_insights": {},
            "relationship_insights": {},
            "network_insights": {},
            "python_insights": {},
            "recommendation_insights": {}
        }

        # Create a graph of file relationships
        self.file_graph = self._create_file_graph()

        # Initialize the network analyzer
        self.network_analyzer = NetworkAnalyzer(self.file_graph)

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

    def _create_file_graph(self) -> nx.DiGraph:
        """
        Create a directed graph of file relationships.

        Returns:
            A directed graph of file relationships
        """
        # Create a directed graph
        G = nx.DiGraph()

        # Get the summary data
        summary_data = self.summary.get("summary", {})

        # If summary data is empty, try to use direct imports data
        if not summary_data and self.direct_imports:
            print("Warning: Summary data is empty. Using direct imports data to create file graph.")
            import_relationships = self.direct_imports.get("import_relationships", {})

            # Add nodes for all files
            for file_path in import_relationships.keys():
                G.add_node(file_path)

            # Add edges for direct imports
            for file_path, imported_files in import_relationships.items():
                for imported_file in imported_files:
                    G.add_node(imported_file)  # Ensure the imported file is in the graph
                    G.add_edge(file_path, imported_file)

            return G

        # Add nodes for all files
        for file_path in summary_data.keys():
            G.add_node(file_path)

        # Add edges for direct imports
        for file_path, associations in summary_data.items():
            direct_imports = associations.get("direct_imports", [])
            if direct_imports:
                for imported_file in direct_imports:
                    # Make sure the imported file exists in the graph
                    if imported_file not in G:
                        G.add_node(imported_file)
                    G.add_edge(file_path, imported_file)

        # Add edges for common ports
        for file_path, associations in summary_data.items():
            common_ports = associations.get("common_ports", {})
            if common_ports:
                for port, info in common_ports.items():
                    defined_in = set(info.get("defined_in", []))
                    used_in = set(info.get("used_in", []))

                    # Connect files that define and use the same entity
                    for def_file in defined_in:
                        for use_file in used_in:
                            if def_file != use_file:
                                # Make sure both files exist in the graph
                                if def_file not in G:
                                    G.add_node(def_file)
                                if use_file not in G:
                                    G.add_node(use_file)
                                G.add_edge(def_file, use_file)

        return G

    def mine_directory_insights(self) -> Dict[str, Any]:
        """
        Mine insights from the directory structure.

        Returns:
            A dictionary of directory insights
        """
        insights = {}

        # Skip if directory structure is not available
        if not self.directory_structure:
            return insights

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
        summary_data = self.summary.get("summary", {})

        # Count files by type
        file_types = Counter()
        for file_path in summary_data.keys():
            _, ext = os.path.splitext(file_path)
            if ext:
                file_types[ext] += 1

        insights["file_types"] = dict(file_types.most_common())

        # Find most imported files
        most_imported = []
        for file_path, associations in summary_data.items():
            # Count how many other files import this file
            import_count = 0
            for other_file, other_associations in summary_data.items():
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
        for file_path, associations in summary_data.items():
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
        summary_data = self.summary.get("summary", {})

        # Count entities by type
        entity_types = Counter()
        entity_usage = defaultdict(lambda: {"defined_in": [], "used_in": []})

        for file_path, associations in summary_data.items():
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

    def mine_network_insights(self) -> Dict[str, Any]:
        """
        Mine insights about the network structure of code relationships.

        Returns:
            A dictionary of network insights
        """
        # Use the network analyzer to analyze the file graph
        network_insights = self.network_analyzer.analyze_network()

        # Store the insights
        self.insights["network_insights"] = network_insights

        return network_insights

    def mine_python_insights(self) -> Dict[str, Any]:
        """
        Mine insights specific to Python codebases.

        Returns:
            A dictionary of Python-specific insights
        """
        insights = {}

        # Get the file associations summary
        summary_data = self.summary.get("summary", {})

        # Find Python files
        python_files = [file_path for file_path in summary_data.keys() if file_path.endswith('.py')]

        # Count Python files
        insights["python_file_count"] = len(python_files)

        # Find Python modules
        python_modules = set()
        for file_path in python_files:
            # Convert file path to module name
            module_name = os.path.splitext(file_path)[0].replace(os.sep, '.')
            python_modules.add(module_name)

        insights["python_module_count"] = len(python_modules)

        # Find Python packages
        python_packages = set()
        for file_path in python_files:
            # Check if the file is in a package (has __init__.py in the same directory)
            dir_path = os.path.dirname(file_path)
            init_path = os.path.join(dir_path, "__init__.py")
            if init_path in python_files:
                python_packages.add(dir_path)

        insights["python_package_count"] = len(python_packages)

        # Find circular imports
        circular_imports = []
        for cycle in self.network_analyzer.insights.get("circular_dependencies", []):
            # Only include cycles where all files are Python files
            if all(file_path.endswith('.py') for file_path in cycle):
                circular_imports.append(cycle)

        insights["circular_imports"] = circular_imports

        # Store the insights
        self.insights["python_insights"] = insights

        return insights

    def mine_recommendation_insights(self) -> Dict[str, Any]:
        """
        Mine insights for recommendations.

        Returns:
            A dictionary of recommendation insights
        """
        insights = {}

        # Get the network insights
        network_insights = self.insights.get("network_insights", {})

        # Identify potential code smells
        code_smells = []

        # 1. Circular dependencies
        circular_dependencies = network_insights.get("circular_dependencies", [])
        if circular_dependencies:
            code_smells.append({
                "type": "circular_dependency",
                "description": "Circular dependencies detected",
                "files": circular_dependencies,
                "recommendation": "Refactor to break circular dependencies"
            })

        # 2. High coupling
        coupling_metrics = network_insights.get("coupling_metrics", {})
        high_coupling_files = []
        for file_path, metrics in coupling_metrics.items():
            if metrics.get("afferent", 0) > 10 or metrics.get("efferent", 0) > 10:
                high_coupling_files.append({
                    "file": file_path,
                    "afferent": metrics.get("afferent", 0),
                    "efferent": metrics.get("efferent", 0)
                })

        if high_coupling_files:
            code_smells.append({
                "type": "high_coupling",
                "description": "Files with high coupling detected",
                "files": high_coupling_files,
                "recommendation": "Refactor to reduce coupling"
            })

        # 3. Bottlenecks
        bottlenecks = network_insights.get("bottlenecks", [])
        if bottlenecks:
            code_smells.append({
                "type": "bottleneck",
                "description": "Bottleneck files detected",
                "files": bottlenecks,
                "recommendation": "Refactor to reduce centrality"
            })

        insights["code_smells"] = code_smells

        # Identify modularization opportunities
        modularization_opportunities = []

        # 1. Communities
        communities = network_insights.get("communities", [])
        for i, community in enumerate(communities):
            if len(community) > 5:
                modularization_opportunities.append({
                    "type": "community",
                    "description": f"Community {i+1} with {len(community)} files",
                    "files": community,
                    "recommendation": "Consider creating a module for this community"
                })

        insights["modularization_opportunities"] = modularization_opportunities

        # Store the insights
        self.insights["recommendation_insights"] = insights

        return insights

    def mine_all_insights(self) -> Dict[str, Any]:
        """
        Mine all insights.

        Returns:
            A dictionary of all insights
        """
        # Try each mining method and continue if one fails
        try:
            self.mine_directory_insights()
        except Exception as e:
            print(f"Warning: Could not mine directory insights: {str(e)}")

        try:
            self.mine_file_insights()
        except Exception as e:
            print(f"Warning: Could not mine file insights: {str(e)}")

        try:
            self.mine_entity_insights()
        except Exception as e:
            print(f"Warning: Could not mine entity insights: {str(e)}")

        try:
            self.mine_network_insights()
        except Exception as e:
            print(f"Warning: Could not mine network insights: {str(e)}")

        try:
            self.mine_python_insights()
        except Exception as e:
            print(f"Warning: Could not mine python insights: {str(e)}")

        try:
            self.mine_recommendation_insights()
        except Exception as e:
            print(f"Warning: Could not mine recommendation insights: {str(e)}")

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


# This allows the file to be run directly for testing
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python insights_miner.py <summary_path> [<direct_imports_path> <common_ports_path> <file_associations_path>]")
        sys.exit(1)

    summary_path = sys.argv[1]
    direct_imports_path = sys.argv[2] if len(sys.argv) > 2 else None
    common_ports_path = sys.argv[3] if len(sys.argv) > 3 else None
    file_associations_path = sys.argv[4] if len(sys.argv) > 4 else None

    miner = InsightsMiner(
        summary_path,
        direct_imports_path,
        common_ports_path,
        file_associations_path
    )

    insights = miner.mine_all_insights()

    # Save insights to a file
    output_path = f"insights_{os.path.basename(summary_path)}"
    miner.save_insights(output_path)

    print(f"Insights saved to {output_path}")
