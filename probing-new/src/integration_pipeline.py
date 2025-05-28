"""
Integration Pipeline Module

This module provides a complete pipeline for integrating all probing modules.
It automatically detects, processes, and transforms data between modules.
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Any, Optional

# Import from other modules
from .file_monitor import FileChangeMonitor, ensure_directory
from .data_transformer import DataTransformer

# Import from visualization and code entity interfaces
try:
    from probing.src.visualization_interface import (
        VisualizationFactory,
        get_available_visualizations
    )
except ImportError:
    VisualizationFactory = None
    get_available_visualizations = None

try:
    from probing.src.code_entity_interface import (
        CodeEntityFactory,
        get_available_analyzers
    )
except ImportError:
    CodeEntityFactory = None
    get_available_analyzers = None

def get_project_root():
    """Get the project root directory."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class ProbingIntegrationPipeline:
    """
    Provides a complete pipeline for integrating all probing modules.
    Automatically detects, processes, and transforms data between modules.
    """

    def __init__(self):
        """Initialize the probing integration pipeline."""
        self.project_root = get_project_root()
        self.output_dir = os.path.join(self.project_root, 'probing', 'output')
        ensure_directory(self.output_dir)

        # Set up monitors for different data sources
        self.setup_monitors()

        # Cache for processed data
        self.cache = {
            'file_associations': None,
            'financial_entity': None,
            'code_entity': None,
            'visualizations': {},
            'insights': None
        }

    def setup_monitors(self):
        """Set up file monitors for different data sources."""
        # File associations monitor
        self.file_associations_monitor = FileChangeMonitor(
            os.path.join(self.project_root, 'probing', 'file_associations', 'output'),
            ['*.json'],
            self.on_file_associations_changed
        )

        # Financial entity monitor
        self.financial_entity_monitor = FileChangeMonitor(
            os.path.join(self.project_root, 'probing', 'financial-entity-analyzer', 'insights'),
            ['*.json'],
            self.on_financial_entity_changed
        )

        # Code entity monitor
        self.code_entity_monitor = FileChangeMonitor(
            os.path.join(self.project_root, 'probing', 'code-entity-analyzer', 'output'),
            ['*.json'],
            self.on_code_entity_changed
        )

    def scan_all(self):
        """Scan all monitored directories for changes."""
        self.file_associations_monitor.scan()
        self.financial_entity_monitor.scan()
        self.code_entity_monitor.scan()

    def on_file_associations_changed(self, changes):
        """Handle changes in file associations files."""
        print(f"File associations changed: {len(changes['created'])} created, {len(changes['modified'])} modified")

        # Get latest file associations data
        # In a real implementation, this would import from the integration module
        # For now, we'll use a stub that returns an empty dict
        file_associations_data = {}

        # Update cache
        self.cache['file_associations'] = file_associations_data

        # Transform for visualizations
        visualization_data = DataTransformer.file_associations_to_visualization(file_associations_data)
        for viz_type, data in visualization_data.items():
            if data:  # Only update if we have data
                if viz_type not in self.cache['visualizations']:
                    self.cache['visualizations'][viz_type] = {}

                # Add/update data from file associations
                self.cache['visualizations'][viz_type].update(data)

        # Transform for insights
        insights_data = DataTransformer.file_associations_to_insights(file_associations_data)
        if not self.cache['insights']:
            self.cache['insights'] = {}

        # Merge with existing insights data
        self.cache['insights'].update({
            'file_associations': insights_data
        })

        # Write integrated data to output
        self.write_integrated_data()

    def on_financial_entity_changed(self, changes):
        """Handle changes in financial entity files."""
        print(f"Financial entity changed: {len(changes['created'])} created, {len(changes['modified'])} modified")

        # Get financial entity analyzer data
        # In a real implementation, this would import from the integration module
        # For now, we'll use a stub that returns an empty dict
        financial_entity_data = {}

        # Update cache
        self.cache['financial_entity'] = financial_entity_data

        # Transform for visualizations
        visualization_data = DataTransformer.financial_entity_to_visualization(financial_entity_data)
        for viz_type, data in visualization_data.items():
            if data:  # Only update if we have data
                if viz_type not in self.cache['visualizations']:
                    self.cache['visualizations'][viz_type] = {}

                # Add/update data from financial entity
                self.cache['visualizations'][viz_type].update(data)

        # Transform for insights
        insights_data = DataTransformer.financial_entity_to_insights(financial_entity_data)
        if not self.cache['insights']:
            self.cache['insights'] = {}

        # Merge with existing insights data
        self.cache['insights'].update({
            'financial_entity': insights_data
        })

        # Write integrated data to output
        self.write_integrated_data()

    def on_code_entity_changed(self, changes):
        """Handle changes in code entity files."""
        print(f"Code entity changed: {len(changes['created'])} created, {len(changes['modified'])} modified")

        # For code entity, we don't have a direct getter function
        # Instead, we'll use the monitor's last scan to find the latest files
        code_entity_files = list(self.code_entity_monitor.last_scan.keys())
        code_entity_data = {
            'files': code_entity_files,
            'entities': [],
            'dependencies': []
        }

        # Try to load data from the files
        for file in code_entity_files:
            try:
                with open(file, 'r') as f:
                    file_data = json.load(f)

                    # Merge entities and dependencies
                    if 'entities' in file_data:
                        code_entity_data['entities'].extend(file_data['entities'])

                    if 'dependencies' in file_data:
                        code_entity_data['dependencies'].extend(file_data['dependencies'])
            except Exception as e:
                print(f"Error loading code entity file {file}: {e}")

        # Update cache
        self.cache['code_entity'] = code_entity_data

        # Transform for visualizations
        visualization_data = DataTransformer.code_entity_to_visualization(code_entity_data)
        for viz_type, data in visualization_data.items():
            if data:  # Only update if we have data
                if viz_type not in self.cache['visualizations']:
                    self.cache['visualizations'][viz_type] = {}

                # Add/update data from code entity
                self.cache['visualizations'][viz_type].update(data)

        # Transform for insights
        insights_data = DataTransformer.code_entity_to_insights(code_entity_data)
        if not self.cache['insights']:
            self.cache['insights'] = {}

        # Merge with existing insights data
        self.cache['insights'].update({
            'code_entity': insights_data
        })

        # Write integrated data to output
        self.write_integrated_data()

    def write_integrated_data(self):
        """Write integrated data to output files."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Write visualization data
        viz_dir = os.path.join(self.output_dir, 'visualizations')
        ensure_directory(viz_dir)

        for viz_type, data in self.cache['visualizations'].items():
            if data:  # Only write if we have data
                viz_file = os.path.join(viz_dir, f"{viz_type}_{timestamp}.json")
                with open(viz_file, 'w') as f:
                    json.dump(data, f, indent=2)

        # Write insights data
        if self.cache['insights']:
            insights_dir = os.path.join(self.output_dir, 'insights')
            ensure_directory(insights_dir)

            insights_file = os.path.join(insights_dir, f"insights_{timestamp}.json")
            with open(insights_file, 'w') as f:
                json.dump(self.cache['insights'], f, indent=2)

        # Write integrated report
        report_file = os.path.join(self.output_dir, f"integrated_report_{timestamp}.json")
        with open(report_file, 'w') as f:
            json.dump({
                'timestamp': timestamp,
                'visualizations': self.cache['visualizations'],
                'insights': self.cache['insights'],
                'file_associations': self.cache['file_associations'],
                'financial_entity': self.cache['financial_entity'],
                'code_entity': self.cache['code_entity']
            }, f, indent=2)

    def direct_analyze_code(self, code: str, file_path: str = None, analyzer_type: str = 'dependency') -> Dict:
        """
        Directly analyze code using appropriate analyzer.

        Args:
            code: The code to analyze
            file_path: Optional virtual file path
            analyzer_type: Type of analysis to perform

        Returns:
            Dict: Analysis results
        """
        from .direct_analyzer import DirectAnalyzer

        if file_path is None:
            # Determine file extension based on analyzer type
            if analyzer_type in ('dependency', 'component'):
                file_path = 'unnamed.js'
            elif analyzer_type == 'react':
                file_path = 'unnamed.jsx'
            elif analyzer_type == 'financial':
                file_path = 'financial.js'
            else:
                file_path = 'unnamed.txt'

        # Perform the appropriate analysis
        if analyzer_type == 'dependency':
            return DirectAnalyzer.analyze_code_dependencies(code, file_path)
        elif analyzer_type == 'react':
            return DirectAnalyzer.analyze_react_components(code, file_path)
        elif analyzer_type == 'financial':
            return DirectAnalyzer.analyze_financial_calculations(code, file_path)
        elif analyzer_type == 'constants':
            language = 'javascript'
            if file_path.endswith('.py'):
                language = 'python'
            return DirectAnalyzer.analyze_financial_constants(code, language)
        else:
            # Use the interface-based implementation as fallback
            if CodeEntityFactory:
                analyzer = CodeEntityFactory.create_analyzer(analyzer_type)
                return analyzer.analyze(code, {'file_path': file_path})
            else:
                return {"error": "Code entity factory not available"}

    def direct_visualization(self, data: Dict, visualization_type: str, options: Optional[Dict] = None) -> Dict:
        """
        Directly generate visualization using appropriate visualizer.

        Args:
            data: Data to visualize
            visualization_type: Type of visualization
            options: Optional visualization options

        Returns:
            Dict: Visualization result
        """
        # Use the interface-based implementation
        if VisualizationFactory:
            visualization = VisualizationFactory.create_visualization(visualization_type)
            return visualization.render(data, options)
        else:
            return {"error": "Visualization factory not available"}

    def get_integrated_data(self) -> Dict:
        """
        Get the current integrated data.

        Returns:
            Dict: The integrated data
        """
        return {
            'visualizations': self.cache['visualizations'],
            'insights': self.cache['insights'],
            'file_associations': self.cache['file_associations'],
            'financial_entity': self.cache['financial_entity'],
            'code_entity': self.cache['code_entity']
        }

# Singleton instance for global access
pipeline = ProbingIntegrationPipeline()
