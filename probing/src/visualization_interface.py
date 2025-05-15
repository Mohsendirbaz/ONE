"""
Visualization Interface Module

This module provides an interface-based implementation for visualizations,
replacing the HTML-based service with a programmatic interface.
"""

import os
import json
import importlib
import sys
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Callable

class VisualizationInterface(ABC):
    """
    Abstract base class for visualization interfaces.
    All visualization types should implement this interface.
    """
    
    @abstractmethod
    def render(self, data: Dict[str, Any], options: Optional[Dict[str, Any]] = None) -> Any:
        """
        Render the visualization with the provided data and options.
        
        Args:
            data: The data to visualize
            options: Optional rendering options
            
        Returns:
            Any: The rendered visualization object
        """
        pass
    
    @abstractmethod
    def update(self, data: Dict[str, Any]) -> None:
        """
        Update the visualization with new data.
        
        Args:
            data: The new data to visualize
        """
        pass
    
    @abstractmethod
    def export(self, format_type: str, path: Optional[str] = None) -> str:
        """
        Export the visualization to a file or string.
        
        Args:
            format_type: The format to export to (e.g., 'png', 'svg', 'json')
            path: Optional path to save the exported file
            
        Returns:
            str: The path to the exported file or the exported content as a string
        """
        pass

class CalculationFlowVisualization(VisualizationInterface):
    """Implementation of the calculation flow diagram visualization."""
    
    def __init__(self):
        self.data = None
        self.options = None
        self.rendered_object = None
    
    def render(self, data: Dict[str, Any], options: Optional[Dict[str, Any]] = None) -> Any:
        self.data = data
        self.options = options or {}
        
        # In a real implementation, this would call the actual visualization code
        # For now, we'll just store the data and return a placeholder
        self.rendered_object = {"type": "calculation_flow", "data": data, "options": self.options}
        return self.rendered_object
    
    def update(self, data: Dict[str, Any]) -> None:
        if self.rendered_object is None:
            raise RuntimeError("Visualization must be rendered before updating")
        
        self.data = data
        self.rendered_object["data"] = data
    
    def export(self, format_type: str, path: Optional[str] = None) -> str:
        if self.rendered_object is None:
            raise RuntimeError("Visualization must be rendered before exporting")
        
        if format_type.lower() == 'json':
            output = json.dumps(self.rendered_object)
            if path:
                with open(path, 'w') as f:
                    f.write(output)
                return path
            return output
        else:
            raise ValueError(f"Export format '{format_type}' not supported")

class ParameterInfluenceVisualization(VisualizationInterface):
    """Implementation of the parameter influence graph visualization."""
    
    def __init__(self):
        self.data = None
        self.options = None
        self.rendered_object = None
    
    def render(self, data: Dict[str, Any], options: Optional[Dict[str, Any]] = None) -> Any:
        self.data = data
        self.options = options or {}
        
        # In a real implementation, this would call the actual visualization code
        self.rendered_object = {"type": "parameter_influence", "data": data, "options": self.options}
        return self.rendered_object
    
    def update(self, data: Dict[str, Any]) -> None:
        if self.rendered_object is None:
            raise RuntimeError("Visualization must be rendered before updating")
        
        self.data = data
        self.rendered_object["data"] = data
    
    def export(self, format_type: str, path: Optional[str] = None) -> str:
        if self.rendered_object is None:
            raise RuntimeError("Visualization must be rendered before exporting")
        
        if format_type.lower() == 'json':
            output = json.dumps(self.rendered_object)
            if path:
                with open(path, 'w') as f:
                    f.write(output)
                return path
            return output
        else:
            raise ValueError(f"Export format '{format_type}' not supported")

class SensitivityVisualization(VisualizationInterface):
    """Implementation of the sensitivity heat map visualization."""
    
    def __init__(self):
        self.data = None
        self.options = None
        self.rendered_object = None
    
    def render(self, data: Dict[str, Any], options: Optional[Dict[str, Any]] = None) -> Any:
        self.data = data
        self.options = options or {}
        
        # In a real implementation, this would call the actual visualization code
        self.rendered_object = {"type": "sensitivity", "data": data, "options": self.options}
        return self.rendered_object
    
    def update(self, data: Dict[str, Any]) -> None:
        if self.rendered_object is None:
            raise RuntimeError("Visualization must be rendered before updating")
        
        self.data = data
        self.rendered_object["data"] = data
    
    def export(self, format_type: str, path: Optional[str] = None) -> str:
        if self.rendered_object is None:
            raise RuntimeError("Visualization must be rendered before exporting")
        
        if format_type.lower() == 'json':
            output = json.dumps(self.rendered_object)
            if path:
                with open(path, 'w') as f:
                    f.write(output)
                return path
            return output
        else:
            raise ValueError(f"Export format '{format_type}' not supported")

class OptimizationVisualization(VisualizationInterface):
    """Implementation of the optimization convergence plot visualization."""
    
    def __init__(self):
        self.data = None
        self.options = None
        self.rendered_object = None
    
    def render(self, data: Dict[str, Any], options: Optional[Dict[str, Any]] = None) -> Any:
        self.data = data
        self.options = options or {}
        
        # In a real implementation, this would call the actual visualization code
        self.rendered_object = {"type": "optimization", "data": data, "options": self.options}
        return self.rendered_object
    
    def update(self, data: Dict[str, Any]) -> None:
        if self.rendered_object is None:
            raise RuntimeError("Visualization must be rendered before updating")
        
        self.data = data
        self.rendered_object["data"] = data
    
    def export(self, format_type: str, path: Optional[str] = None) -> str:
        if self.rendered_object is None:
            raise RuntimeError("Visualization must be rendered before exporting")
        
        if format_type.lower() == 'json':
            output = json.dumps(self.rendered_object)
            if path:
                with open(path, 'w') as f:
                    f.write(output)
                return path
            return output
        else:
            raise ValueError(f"Export format '{format_type}' not supported")

class VisualizationFactory:
    """Factory class for creating visualization interfaces."""
    
    @staticmethod
    def create_visualization(visualization_type: str) -> VisualizationInterface:
        """
        Create a visualization interface of the specified type.
        
        Args:
            visualization_type: The type of visualization to create
            
        Returns:
            VisualizationInterface: The created visualization interface
            
        Raises:
            ValueError: If the visualization type is not supported
        """
        if visualization_type == 'calculation_flow':
            return CalculationFlowVisualization()
        elif visualization_type == 'parameter_influence':
            return ParameterInfluenceVisualization()
        elif visualization_type == 'sensitivity':
            return SensitivityVisualization()
        elif visualization_type == 'optimization':
            return OptimizationVisualization()
        else:
            raise ValueError(f"Visualization type '{visualization_type}' not supported")

def get_available_visualizations() -> List[str]:
    """
    Get a list of available visualization types.
    
    Returns:
        List[str]: A list of available visualization types
    """
    return ['calculation_flow', 'parameter_influence', 'sensitivity', 'optimization']

def render_visualization(visualization_type: str, data: Dict[str, Any], options: Optional[Dict[str, Any]] = None) -> Any:
    """
    Convenience function to render a visualization of the specified type.
    
    Args:
        visualization_type: The type of visualization to render
        data: The data to visualize
        options: Optional rendering options
        
    Returns:
        Any: The rendered visualization object
    """
    visualization = VisualizationFactory.create_visualization(visualization_type)
    return visualization.render(data, options)