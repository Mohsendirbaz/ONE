"""
Code Entity Interface Module

This module provides an interface-based implementation for code entity analysis,
replacing the HTML-based service with a programmatic interface.
"""

import os
import json
import importlib
import sys
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Callable

class CodeEntityInterface(ABC):
    """
    Abstract base class for code entity interfaces.
    All code entity analyzers should implement this interface.
    """
    
    @abstractmethod
    def analyze(self, code: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze the provided code and return the analysis results.
        
        Args:
            code: The code to analyze
            options: Optional analysis options
            
        Returns:
            Dict[str, Any]: The analysis results
        """
        pass
    
    @abstractmethod
    def get_entities(self) -> List[Dict[str, Any]]:
        """
        Get the entities identified in the analyzed code.
        
        Returns:
            List[Dict[str, Any]]: A list of entities
        """
        pass
    
    @abstractmethod
    def get_dependencies(self) -> List[Dict[str, Any]]:
        """
        Get the dependencies between entities in the analyzed code.
        
        Returns:
            List[Dict[str, Any]]: A list of dependencies
        """
        pass

class ComponentAnalyzer(CodeEntityInterface):
    """Implementation of the component analyzer."""
    
    def __init__(self):
        self.code = None
        self.options = None
        self.analysis_results = None
        self.entities = []
        self.dependencies = []
    
    def analyze(self, code: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        self.code = code
        self.options = options or {}
        
        # In a real implementation, this would call the actual analysis code
        # For now, we'll just store the code and return a placeholder
        self.analysis_results = {
            "type": "component_analysis",
            "entities": [],
            "dependencies": []
        }
        
        # Simulate finding components in the code
        if "class" in code or "function" in code:
            # Simple heuristic to identify potential components
            lines = code.split("\n")
            for i, line in enumerate(lines):
                if "class" in line and "(" in line:
                    # Found a class definition
                    class_name = line.split("class")[1].split("(")[0].strip()
                    self.entities.append({
                        "type": "class",
                        "name": class_name,
                        "line": i + 1,
                        "properties": []
                    })
                elif "function" in line or "def" in line:
                    # Found a function definition
                    if "function" in line:
                        func_name = line.split("function")[1].split("(")[0].strip()
                    else:
                        func_name = line.split("def")[1].split("(")[0].strip()
                    self.entities.append({
                        "type": "function",
                        "name": func_name,
                        "line": i + 1,
                        "parameters": []
                    })
        
        # Simulate finding dependencies
        if "import" in code or "require" in code:
            # Simple heuristic to identify potential dependencies
            lines = code.split("\n")
            for i, line in enumerate(lines):
                if "import" in line:
                    # Found an import statement
                    imported = line.split("import")[1].strip()
                    self.dependencies.append({
                        "type": "import",
                        "source": imported,
                        "line": i + 1
                    })
                elif "require" in line:
                    # Found a require statement
                    required = line.split("require")[1].strip()
                    if "(" in required and ")" in required:
                        required = required.split("(")[1].split(")")[0].strip()
                    self.dependencies.append({
                        "type": "require",
                        "source": required,
                        "line": i + 1
                    })
        
        self.analysis_results["entities"] = self.entities
        self.analysis_results["dependencies"] = self.dependencies
        
        return self.analysis_results
    
    def get_entities(self) -> List[Dict[str, Any]]:
        if self.analysis_results is None:
            raise RuntimeError("Code must be analyzed before getting entities")
        
        return self.entities
    
    def get_dependencies(self) -> List[Dict[str, Any]]:
        if self.analysis_results is None:
            raise RuntimeError("Code must be analyzed before getting dependencies")
        
        return self.dependencies

class StateFlowAnalyzer(CodeEntityInterface):
    """Implementation of the state flow analyzer."""
    
    def __init__(self):
        self.code = None
        self.options = None
        self.analysis_results = None
        self.entities = []
        self.dependencies = []
    
    def analyze(self, code: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        self.code = code
        self.options = options or {}
        
        # In a real implementation, this would call the actual analysis code
        self.analysis_results = {
            "type": "state_flow_analysis",
            "entities": [],
            "dependencies": []
        }
        
        # Simulate finding state-related entities in the code
        if "state" in code or "useState" in code or "setState" in code:
            # Simple heuristic to identify potential state-related entities
            lines = code.split("\n")
            for i, line in enumerate(lines):
                if "useState" in line:
                    # Found a useState hook
                    if "=" in line and "[" in line and "]" in line:
                        state_var = line.split("[")[1].split(",")[0].strip()
                        self.entities.append({
                            "type": "state_variable",
                            "name": state_var,
                            "line": i + 1
                        })
                elif "setState" in line:
                    # Found a setState call
                    self.entities.append({
                        "type": "state_update",
                        "line": i + 1
                    })
                elif "state." in line:
                    # Found a state property access
                    state_prop = line.split("state.")[1].split(" ")[0].strip()
                    if "(" in state_prop:
                        state_prop = state_prop.split("(")[0].strip()
                    if ";" in state_prop:
                        state_prop = state_prop.split(";")[0].strip()
                    self.entities.append({
                        "type": "state_property",
                        "name": state_prop,
                        "line": i + 1
                    })
        
        # Simulate finding state transitions
        if "switch" in code or "if" in code:
            # Simple heuristic to identify potential state transitions
            lines = code.split("\n")
            for i, line in enumerate(lines):
                if "switch" in line and "state" in line:
                    # Found a switch statement on state
                    self.dependencies.append({
                        "type": "state_switch",
                        "line": i + 1
                    })
                elif "if" in line and "state" in line:
                    # Found an if statement on state
                    self.dependencies.append({
                        "type": "state_condition",
                        "line": i + 1
                    })
        
        self.analysis_results["entities"] = self.entities
        self.analysis_results["dependencies"] = self.dependencies
        
        return self.analysis_results
    
    def get_entities(self) -> List[Dict[str, Any]]:
        if self.analysis_results is None:
            raise RuntimeError("Code must be analyzed before getting entities")
        
        return self.entities
    
    def get_dependencies(self) -> List[Dict[str, Any]]:
        if self.analysis_results is None:
            raise RuntimeError("Code must be analyzed before getting dependencies")
        
        return self.dependencies

class DependencyAnalyzer(CodeEntityInterface):
    """Implementation of the dependency analyzer."""
    
    def __init__(self):
        self.code = None
        self.options = None
        self.analysis_results = None
        self.entities = []
        self.dependencies = []
    
    def analyze(self, code: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        self.code = code
        self.options = options or {}
        
        # In a real implementation, this would call the actual analysis code
        self.analysis_results = {
            "type": "dependency_analysis",
            "entities": [],
            "dependencies": []
        }
        
        # Simulate finding dependencies in the code
        if "import" in code or "require" in code or "from" in code:
            # Simple heuristic to identify potential dependencies
            lines = code.split("\n")
            for i, line in enumerate(lines):
                if "import" in line:
                    # Found an import statement
                    if "from" in line:
                        # Python-style import
                        imported = line.split("import")[1].split("from")[0].strip()
                        source = line.split("from")[1].strip()
                        self.dependencies.append({
                            "type": "import",
                            "imported": imported,
                            "source": source,
                            "line": i + 1
                        })
                    else:
                        # JavaScript-style import
                        imported = line.split("import")[1].strip()
                        if "from" in imported:
                            parts = imported.split("from")
                            imported = parts[0].strip()
                            source = parts[1].strip()
                            if source.startswith('"') or source.startswith("'"):
                                source = source[1:-1]
                            self.dependencies.append({
                                "type": "import",
                                "imported": imported,
                                "source": source,
                                "line": i + 1
                            })
                elif "require" in line:
                    # Found a require statement
                    required = line.split("require")[1].strip()
                    if "(" in required and ")" in required:
                        required = required.split("(")[1].split(")")[0].strip()
                        if required.startswith('"') or required.startswith("'"):
                            required = required[1:-1]
                        self.dependencies.append({
                            "type": "require",
                            "source": required,
                            "line": i + 1
                        })
        
        self.analysis_results["dependencies"] = self.dependencies
        
        return self.analysis_results
    
    def get_entities(self) -> List[Dict[str, Any]]:
        if self.analysis_results is None:
            raise RuntimeError("Code must be analyzed before getting entities")
        
        return self.entities
    
    def get_dependencies(self) -> List[Dict[str, Any]]:
        if self.analysis_results is None:
            raise RuntimeError("Code must be analyzed before getting dependencies")
        
        return self.dependencies

class CodeEntityFactory:
    """Factory class for creating code entity interfaces."""
    
    @staticmethod
    def create_analyzer(analyzer_type: str) -> CodeEntityInterface:
        """
        Create a code entity analyzer of the specified type.
        
        Args:
            analyzer_type: The type of analyzer to create
            
        Returns:
            CodeEntityInterface: The created analyzer
            
        Raises:
            ValueError: If the analyzer type is not supported
        """
        if analyzer_type == 'component':
            return ComponentAnalyzer()
        elif analyzer_type == 'state_flow':
            return StateFlowAnalyzer()
        elif analyzer_type == 'dependency':
            return DependencyAnalyzer()
        else:
            raise ValueError(f"Analyzer type '{analyzer_type}' not supported")

def get_available_analyzers() -> List[str]:
    """
    Get a list of available analyzer types.
    
    Returns:
        List[str]: A list of available analyzer types
    """
    return ['component', 'state_flow', 'dependency']

def analyze_code(analyzer_type: str, code: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Convenience function to analyze code using the specified analyzer type.
    
    Args:
        analyzer_type: The type of analyzer to use
        code: The code to analyze
        options: Optional analysis options
        
    Returns:
        Dict[str, Any]: The analysis results
    """
    analyzer = CodeEntityFactory.create_analyzer(analyzer_type)
    return analyzer.analyze(code, options)