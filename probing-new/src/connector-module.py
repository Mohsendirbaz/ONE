"""
Probing Module Connector

This module serves as the central bridge between different components of the probing system.
It provides data transformation, file detection, and direct integration to ensure
seamless connectivity between file generators and the main interfaces.
"""

import os
import json
import glob
import importlib
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Tuple

# Import visualization and code entity interfaces
from probing.src.visualization_interface import (
    VisualizationFactory,
    get_available_visualizations
)
from probing.src.code_entity_interface import (
    CodeEntityFactory,
    get_available_analyzers
)

# Import core modules if available
try:
    from probing.code_entity_analyzer.core.dependency_mapper import (
        parseImportsAndExports,
        buildDependencyGraph
    )
except ImportError:
    parseImportsAndExports = None
    buildDependencyGraph = None

try:
    from probing.code_entity_analyzer.core.react_parser import (
        parseComponents,
        parseHooks,
        parseContexts
    )
except ImportError:
    parseComponents = None
    parseHooks = None
    parseContexts = None

try:
    from probing.financial_entity_analyzer.core.calculation_flow_analyzer import (
        CalculationFlowAnalyzer
    )
except ImportError:
    CalculationFlowAnalyzer = None

try:
    from probing.financial_entity_analyzer.core.financial_constants_analyzer import (
        FinancialConstantsAnalyzer
    )
except ImportError:
    FinancialConstantsAnalyzer = None

# Helper functions
def get_project_root():
    """Get the project root directory."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def ensure_directory(directory):
    """Ensure a directory exists."""
    if not os.path.exists(directory):
        os.makedirs(directory)

# ----- FILE DETECTION AND MONITORING -----

class FileChangeMonitor:
    """
    Monitors and detects changes in files and directories.
    Provides callbacks when files are created, modified, or deleted.
    """
    
    def __init__(self, directory: str, patterns: List[str], callback=None):
        """
        Initialize the file change monitor.
        
        Args:
            directory: The directory to monitor
            patterns: List of file patterns to watch (e.g., '*.json', '*.js')
            callback: Function to call when changes are detected
        """
        self.directory = directory
        self.patterns = patterns
        self.callback = callback
        self.last_scan = {}
        
    def scan(self) -> Dict[str, List[str]]:
        """
        Scan the directory for files matching the patterns.
        
        Returns:
            Dict with 'created', 'modified', and 'deleted' file lists
        """
        current_files = {}
        
        # Get all files matching the patterns
        for pattern in self.patterns:
            file_path = os.path.join(self.directory, pattern)
            for file in glob.glob(file_path):
                if os.path.isfile(file):
                    current_files[file] = os.path.getmtime(file)
        
        changes = {
            'created': [],
            'modified': [],
            'deleted': []
        }
        
        # Check for created or modified files
        for file, mtime in current_files.items():
            if file not in self.last_scan:
                changes['created'].append(file)
            elif mtime > self.last_scan[file]:
                changes['modified'].append(file)
        
        # Check for deleted files
        for file in self.last_scan:
            if file not in current_files:
                changes['deleted'].append(file)
        
        # Update last scan
        self.last_scan = current_files
        
        # Call callback if provided
        if self.callback and (changes['created'] or changes['modified'] or changes['deleted']):
            self.callback(changes)
        
        return changes

# ----- DATA TRANSFORMERS -----

class DataTransformer:
    """
    Transforms data between different modules in the probing system.
    Provides converters for each type of data to bridge gaps between modules.
    """
    
    @staticmethod
    def file_associations_to_visualization(file_associations_data: Dict) -> Dict:
        """
        Transform file associations data to visualization format.
        
        Args:
            file_associations_data: The file associations data
            
        Returns:
            Dict: Transformed data for visualization
        """
        # Initialize result structure for various visualization types
        result = {
            'calculation_flow': {},
            'parameter_influence': {},
            'sensitivity': {},
            'optimization': {}
        }
        
        # Handle null input gracefully
        if not file_associations_data:
            return result
        
        # Transform for parameter influence graph
        parameters = []
        dependencies = []
        
        # Extract file data
        direct_imports = {}
        if file_associations_data.get('direct_imports') and os.path.exists(file_associations_data['direct_imports']):
            with open(file_associations_data['direct_imports'], 'r') as f:
                direct_imports = json.load(f)
        
        file_associations = {}
        if file_associations_data.get('file_associations') and os.path.exists(file_associations_data['file_associations']):
            with open(file_associations_data['file_associations'], 'r') as f:
                file_associations = json.load(f)
        
        # Create parameters and dependencies
        for file_path, associations in file_associations.items():
            # Add file as parameter
            file_type = 'input' if file_path.endswith(('.js', '.py', '.jsx', '.tsx')) else 'data'
            parameters.append([file_path, {'type': file_type}])
            
            # Add dependencies
            for associated_file in associations:
                dependencies.append({
                    'source': file_path,
                    'target': associated_file,
                    'weight': 1
                })
        
        # Add direct imports
        for file_path, imports in direct_imports.items():
            for imported in imports:
                dependencies.append({
                    'source': file_path,
                    'target': imported,
                    'weight': 1.5  # Direct imports have higher weight
                })
        
        # Assemble parameter influence data
        result['parameter_influence'] = {
            'parameters': parameters,
            'dependencies': dependencies,
            'financialMetrics': []  # No financial metrics from file associations
        }
        
        # Create calculation flow data structure
        result['calculation_flow'] = {
            'calculationBlocks': {
                'fileAssociations': [
                    {'name': 'File Dependencies', 'inputs': [], 'outputs': []}
                ]
            },
            'iterativeProcesses': [],
            'financialMetrics': []
        }
        
        return result
    
    @staticmethod
    def financial_entity_to_visualization(financial_data: Dict) -> Dict:
        """
        Transform financial entity data to visualization format.
        
        Args:
            financial_data: The financial entity data
            
        Returns:
            Dict: Transformed data for visualization
        """
        # Initialize result structure
        result = {
            'calculation_flow': {},
            'parameter_influence': {},
            'sensitivity': {},
            'optimization': {}
        }
        
        # Handle null input gracefully
        if not financial_data:
            return result
        
        # Process insights files
        insights = []
        for insight_file in financial_data.get('insights_files', []):
            if os.path.exists(insight_file):
                try:
                    with open(insight_file, 'r') as f:
                        insight_data = json.load(f)
                        insights.append(insight_data)
                except Exception as e:
                    print(f"Error loading insight file {insight_file}: {e}")
        
        # Extract calculation blocks
        calculation_blocks = {}
        parameters = []
        dependencies = []
        metrics = []
        sensitivities = []
        optimization_paths = []
        
        # Process each insight
        for insight in insights:
            # Extract calculation blocks
            if 'calculationFlow' in insight:
                for block_type, blocks in insight['calculationFlow'].get('calculationBlocks', {}).items():
                    calculation_blocks[block_type] = blocks
            
            # Extract parameters and metrics
            if 'parameters' in insight:
                for param in insight['parameters']:
                    param_name = param.get('name', '')
                    if param_name:
                        parameters.append([param_name, {
                            'type': param.get('type', 'input'),
                            'value': param.get('value')
                        }])
            
            if 'metrics' in insight:
                for metric in insight['metrics']:
                    metric_name = metric.get('name', '')
                    if metric_name:
                        metrics.append({
                            'name': metric_name,
                            'description': metric.get('description', ''),
                            'value': metric.get('value')
                        })
            
            # Extract dependencies
            if 'dependencies' in insight:
                for dep in insight['dependencies']:
                    from_param = dep.get('from', '')
                    to_param = dep.get('to', '')
                    if from_param and to_param:
                        dependencies.append({
                            'source': from_param,
                            'target': to_param,
                            'weight': dep.get('strength', 1),
                            'type': dep.get('type', 'influence')
                        })
            
            # Extract sensitivities
            if 'sensitivity' in insight:
                for sensitivity in insight['sensitivity']:
                    sensitivities.append({
                        'parameter': sensitivity.get('parameter', ''),
                        'metric': sensitivity.get('metric', ''),
                        'value': sensitivity.get('value', 0),
                        'description': sensitivity.get('description', '')
                    })
            
            # Extract optimization paths
            if 'optimization' in insight:
                for path in insight['optimization'].get('paths', []):
                    opt_path = {
                        'id': path.get('id', f"path_{len(optimization_paths)}"),
                        'name': path.get('name', f"Optimization {len(optimization_paths) + 1}"),
                        'targetMetric': path.get('targetMetric', ''),
                        'targetParameter': path.get('targetParameter', ''),
                        'converged': path.get('converged', False),
                        'steps': []
                    }
                    
                    # Add steps
                    for step in path.get('steps', []):
                        opt_path['steps'].append({
                            'metricValue': step.get('metricValue', 0),
                            'parameterValue': step.get('parameterValue', 0)
                        })
                    
                    optimization_paths.append(opt_path)
        
        # Assemble visualization data
        result['calculation_flow'] = {
            'calculationBlocks': calculation_blocks,
            'iterativeProcesses': [],
            'financialMetrics': metrics
        }
        
        result['parameter_influence'] = {
            'parameters': parameters,
            'dependencies': dependencies,
            'financialMetrics': metrics
        }
        
        result['sensitivity'] = {
            'parameters': [{'name': p[0], 'type': p[1]['type']} for p in parameters],
            'metrics': metrics,
            'sensitivities': sensitivities
        }
        
        result['optimization'] = {
            'optimizationPaths': optimization_paths,
            'metrics': metrics
        }
        
        return result
    
    @staticmethod
    def code_entity_to_visualization(code_analysis_data: Dict) -> Dict:
        """
        Transform code entity analysis data to visualization format.
        
        Args:
            code_analysis_data: The code entity analysis data
            
        Returns:
            Dict: Transformed data for visualization
        """
        # Initialize result structure
        result = {
            'calculation_flow': {},
            'parameter_influence': {},
            'sensitivity': {},
            'optimization': {}
        }
        
        # Handle null input gracefully
        if not code_analysis_data:
            return result
        
        # Extract entities and dependencies
        entities = code_analysis_data.get('entities', [])
        dependencies = code_analysis_data.get('dependencies', [])
        
        # Create parameters and dependency links
        parameters = []
        dependency_links = []
        
        # Extract parameters from entities
        for entity in entities:
            entity_type = entity.get('type', 'unknown')
            entity_name = entity.get('name', f"Unknown_{len(parameters)}")
            
            param_type = 'input'
            if entity_type == 'class':
                param_type = 'class'
            elif entity_type == 'function':
                param_type = 'function'
            elif entity_type == 'state_variable':
                param_type = 'state'
            
            parameters.append([entity_name, {'type': param_type}])
        
        # Extract dependencies
        for dep in dependencies:
            dep_type = dep.get('type', 'unknown')
            
            if dep_type in ('import', 'require'):
                source = dep.get('source', '')
                imported = dep.get('imported', '')
                
                if source and imported:
                    dependency_links.append({
                        'source': imported,
                        'target': source,
                        'weight': 1,
                        'type': dep_type
                    })
            elif dep_type in ('state_condition', 'state_switch'):
                # These dependencies don't have explicit source/target
                continue
        
        # Assemble parameter influence data
        result['parameter_influence'] = {
            'parameters': parameters,
            'dependencies': dependency_links,
            'financialMetrics': []  # No financial metrics from code analysis
        }
        
        # Create calculation flow data for components and their relationships
        calculation_blocks = {
            'components': [],
            'hooks': [],
            'contexts': []
        }
        
        # Add components
        for entity in entities:
            if entity.get('type') == 'class' or entity.get('type') == 'function':
                calculation_blocks['components'].append({
                    'name': entity.get('name', 'Unknown'),
                    'inputs': [],
                    'outputs': []
                })
            elif entity.get('type') == 'state_variable':
                calculation_blocks['hooks'].append({
                    'name': entity.get('name', 'Unknown'),
                    'inputs': [],
                    'outputs': []
                })
        
        result['calculation_flow'] = {
            'calculationBlocks': calculation_blocks,
            'iterativeProcesses': [],
            'financialMetrics': []
        }
        
        return result
    
    @staticmethod
    def financial_entity_to_insights(financial_data: Dict) -> Dict:
        """
        Transform financial entity data to insights generator format.
        
        Args:
            financial_data: The financial entity data
            
        Returns:
            Dict: Transformed data for insights generation
        """
        # Initialize insights data structure
        insights_data = {
            'financial_entities': [],
            'calculations': [],
            'relationships': [],
            'metrics': []
        }
        
        # Handle null input gracefully
        if not financial_data:
            return insights_data
        
        # Process insights files
        for insight_file in financial_data.get('insights_files', []):
            if os.path.exists(insight_file):
                try:
                    with open(insight_file, 'r') as f:
                        insight_data = json.load(f)
                        
                        # Extract financial entities
                        if 'parameters' in insight_data:
                            for param in insight_data['parameters']:
                                insights_data['financial_entities'].append({
                                    'type': 'parameter',
                                    'name': param.get('name', ''),
                                    'data_type': param.get('type', ''),
                                    'value': param.get('value'),
                                    'source': insight_file
                                })
                        
                        # Extract calculations
                        if 'calculationFlow' in insight_data:
                            for block_type, blocks in insight_data['calculationFlow'].get('calculationBlocks', {}).items():
                                for block in blocks:
                                    insights_data['calculations'].append({
                                        'type': block_type,
                                        'name': block.get('name', ''),
                                        'formula': block.get('formula', ''),
                                        'source': insight_file
                                    })
                        
                        # Extract relationships
                        if 'dependencies' in insight_data:
                            for dep in insight_data['dependencies']:
                                insights_data['relationships'].append({
                                    'type': 'dependency',
                                    'from': dep.get('from', ''),
                                    'to': dep.get('to', ''),
                                    'strength': dep.get('strength', 1),
                                    'source': insight_file
                                })
                        
                        # Extract metrics
                        if 'metrics' in insight_data:
                            for metric in insight_data['metrics']:
                                insights_data['metrics'].append({
                                    'type': 'financial_metric',
                                    'name': metric.get('name', ''),
                                    'description': metric.get('description', ''),
                                    'value': metric.get('value'),
                                    'source': insight_file
                                })
                except Exception as e:
                    print(f"Error loading insight file {insight_file}: {e}")
        
        return insights_data
    
    @staticmethod
    def code_entity_to_insights(code_analysis_data: Dict) -> Dict:
        """
        Transform code entity analysis data to insights generator format.
        
        Args:
            code_analysis_data: The code entity analysis data
            
        Returns:
            Dict: Transformed data for insights generation
        """
        # Initialize insights data structure
        insights_data = {
            'code_entities': [],
            'relationships': [],
            'patterns': []
        }
        
        # Handle null input gracefully
        if not code_analysis_data:
            return insights_data
        
        # Extract entities
        for entity in code_analysis_data.get('entities', []):
            entity_type = entity.get('type', 'unknown')
            
            insights_data['code_entities'].append({
                'type': entity_type,
                'name': entity.get('name', ''),
                'line': entity.get('line', 0),
                'properties': entity.get('properties', [])
            })
        
        # Extract dependencies as relationships
        for dep in code_analysis_data.get('dependencies', []):
            dep_type = dep.get('type', 'unknown')
            
            relationship = {
                'type': dep_type,
                'line': dep.get('line', 0)
            }
            
            if dep_type in ('import', 'require'):
                relationship['source'] = dep.get('source', '')
                relationship['imported'] = dep.get('imported', '')
            
            insights_data['relationships'].append(relationship)
        
        return insights_data
    
    @staticmethod
    def file_associations_to_insights(file_associations_data: Dict) -> Dict:
        """
        Transform file associations data to insights generator format.
        
        Args:
            file_associations_data: The file associations data
            
        Returns:
            Dict: Transformed data for insights generation
        """
        # Initialize insights data structure
        insights_data = {
            'files': [],
            'associations': [],
            'metrics': []
        }
        
        # Handle null input gracefully
        if not file_associations_data:
            return insights_data
        
        # Extract direct imports
        direct_imports = {}
        if file_associations_data.get('direct_imports') and os.path.exists(file_associations_data['direct_imports']):
            try:
                with open(file_associations_data['direct_imports'], 'r') as f:
                    direct_imports = json.load(f)
            except Exception as e:
                print(f"Error loading direct imports: {e}")
        
        # Extract file associations
        file_associations = {}
        if file_associations_data.get('file_associations') and os.path.exists(file_associations_data['file_associations']):
            try:
                with open(file_associations_data['file_associations'], 'r') as f:
                    file_associations = json.load(f)
            except Exception as e:
                print(f"Error loading file associations: {e}")
        
        # Extract common ports
        common_ports = {}
        if file_associations_data.get('common_ports') and os.path.exists(file_associations_data['common_ports']):
            try:
                with open(file_associations_data['common_ports'], 'r') as f:
                    common_ports = json.load(f)
            except Exception as e:
                print(f"Error loading common ports: {e}")
        
        # Add files
        for file_path in set(list(direct_imports.keys()) + list(file_associations.keys())):
            file_type = 'unknown'
            if file_path.endswith(('.js', '.jsx')):
                file_type = 'javascript'
            elif file_path.endswith(('.ts', '.tsx')):
                file_type = 'typescript'
            elif file_path.endswith('.py'):
                file_type = 'python'
            elif file_path.endswith(('.json', '.yaml', '.yml')):
                file_type = 'data'
            
            insights_data['files'].append({
                'path': file_path,
                'type': file_type,
                'imports': direct_imports.get(file_path, [])
            })
        
        # Add associations
        for file_path, associations in file_associations.items():
            for associated_file in associations:
                insights_data['associations'].append({
                    'source': file_path,
                    'target': associated_file,
                    'type': 'file_association'
                })
        
        # Add metrics about file associations
        num_files = len(set(list(direct_imports.keys()) + list(file_associations.keys())))
        num_associations = sum(len(associations) for associations in file_associations.values())
        num_direct_imports = sum(len(imports) for imports in direct_imports.values())
        
        insights_data['metrics'].append({
            'name': 'total_files',
            'value': num_files,
            'description': 'Total number of files detected'
        })
        
        insights_data['metrics'].append({
            'name': 'total_associations',
            'value': num_associations,
            'description': 'Total number of file associations'
        })
        
        insights_data['metrics'].append({
            'name': 'total_direct_imports',
            'value': num_direct_imports,
            'description': 'Total number of direct imports'
        })
        
        if num_files > 0:
            insights_data['metrics'].append({
                'name': 'avg_associations_per_file',
                'value': num_associations / num_files,
                'description': 'Average number of associations per file'
            })
        
        return insights_data

# ----- DIRECT ANALYZERS -----

class DirectAnalyzer:
    """
    Provides direct analysis capabilities by directly using core analyzer modules.
    Bypasses the need for temporary files by calling the analysis functions directly.
    """
    
    @staticmethod
    def analyze_code_dependencies(code: str, file_path: str = 'unnamed.js') -> Dict:
        """
        Directly analyze code dependencies without temporary files.
        
        Args:
            code: The code to analyze
            file_path: The virtual file path (used for extensions)
            
        Returns:
            Dict: The dependency analysis results
        """
        if not parseImportsAndExports:
            return {"error": "Dependency mapper module not available"}
        
        try:
            # Parse imports and exports
            result = parseImportsAndExports(code, file_path)
            
            # Build dependency graph
            files = {file_path: code}
            parse_results = {file_path: result}
            graph = buildDependencyGraph(parse_results)
            
            return {
                "imports": result.get("imports", []),
                "exports": result.get("exports", []),
                "dependency_graph": graph
            }
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def analyze_react_components(code: str, file_path: str = 'unnamed.jsx') -> Dict:
        """
        Directly analyze React components without temporary files.
        
        Args:
            code: The code to analyze
            file_path: The virtual file path (used for extensions)
            
        Returns:
            Dict: The React component analysis results
        """
        if not parseComponents or not parseHooks or not parseContexts:
            return {"error": "React parser modules not available"}
        
        try:
            # Parse components, hooks, and contexts
            components = parseComponents(code, file_path)
            hooks = parseHooks(code, file_path)
            contexts = parseContexts(code, file_path)
            
            return {
                "components": components,
                "hooks": hooks,
                "contexts": contexts
            }
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def analyze_financial_calculations(code: str, file_path: str = 'unnamed.js') -> Dict:
        """
        Directly analyze financial calculations without temporary files.
        
        Args:
            code: The code to analyze
            file_path: The virtual file path (used for extensions)
            
        Returns:
            Dict: The financial calculation analysis results
        """
        if not CalculationFlowAnalyzer:
            return {"error": "Calculation flow analyzer not available"}
        
        try:
            # Create analyzer
            analyzer = CalculationFlowAnalyzer()
            
            # Analyze calculation flow
            result = analyzer.analyzeCalculationFlow(code, file_path)
            
            return result
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def analyze_financial_constants(code: str, language: str = 'javascript') -> Dict:
        """
        Directly analyze financial constants without temporary files.
        
        Args:
            code: The code to analyze
            language: The programming language ('javascript' or 'python')
            
        Returns:
            Dict: The financial constants analysis results
        """
        if not FinancialConstantsAnalyzer:
            return {"error": "Financial constants analyzer not available"}
        
        try:
            # Create analyzer
            analyzer = FinancialConstantsAnalyzer()
            
            # Analyze financial constants
            result = analyzer.analyzeFinancialConstants(code, language)
            
            return result
        except Exception as e:
            return {"error": str(e)}

# ----- INTEGRATION PIPELINE -----

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
        from probing.src.integration import get_latest_file_associations_data
        file_associations_data = get_latest_file_associations_data()
        
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
        from probing.src.integration import get_financial_entity_analyzer_data
        financial_entity_data = get_financial_entity_analyzer_data()
        
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
            analyzer = CodeEntityFactory.create_analyzer(analyzer_type)
            return analyzer.analyze(code, {'file_path': file_path})
    
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
        visualization = VisualizationFactory.create_visualization(visualization_type)
        return visualization.render(data, options)
    
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

# ----- MODULE FUNCTIONS -----

def get_integrated_visualizations() -> Dict:
    """
    Get integrated visualization data from all sources.
    
    Returns:
        Dict: Integrated visualization data
    """
    # Scan for any new files
    pipeline.scan_all()
    
    return pipeline.cache['visualizations']

def get_integrated_insights() -> Dict:
    """
    Get integrated insights data from all sources.
    
    Returns:
        Dict: Integrated insights data
    """
    # Scan for any new files
    pipeline.scan_all()
    
    return pipeline.cache['insights']

def analyze_code_direct(code: str, file_path: str = None, analyzer_type: str = 'dependency') -> Dict:
    """
    Directly analyze code without temporary files.
    
    Args:
        code: The code to analyze
        file_path: Optional virtual file path
        analyzer_type: Type of analysis to perform
        
    Returns:
        Dict: Analysis results
    """
    return pipeline.direct_analyze_code(code, file_path, analyzer_type)

def visualize_data_direct(data: Dict, visualization_type: str, options: Optional[Dict] = None) -> Dict:
    """
    Directly generate visualization without temporary files.
    
    Args:
        data: Data to visualize
        visualization_type: Type of visualization
        options: Optional visualization options
        
    Returns:
        Dict: Visualization result
    """
    return pipeline.direct_visualization(data, visualization_type, options)

def generate_integrated_report_enhanced(output_path: Optional[str] = None, format_type: str = 'json') -> str:
    """
    Generate an enhanced integrated report that combines data from all modules.
    
    Args:
        output_path: Optional output file path
        format_type: Format of the output file
        
    Returns:
        str: Path to the generated report
    """
    # Scan for any new files
    pipeline.scan_all()
    
    # Get integrated data
    integrated_data = pipeline.get_integrated_data()
    
    # Determine output path
    if output_path is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(pipeline.output_dir, f"enhanced_report_{timestamp}.{format_type}")
    
    # Write report
    if format_type.lower() == 'json':
        with open(output_path, 'w') as f:
            json.dump(integrated_data, f, indent=2)
    elif format_type.lower() == 'html':
        # Simple HTML report
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Probing Integrated Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2, h3 {{ color: #333; }}
                .section {{ margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; }}
                pre {{ background-color: #f5f5f5; padding: 10px; overflow: auto; }}
            </style>
        </head>
        <body>
            <h1>Probing Integrated Report</h1>
            <p>Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
            
            <div class="section">
                <h2>Visualizations</h2>
                <pre>{json.dumps(integrated_data['visualizations'], indent=2)}</pre>
            </div>
            
            <div class="section">
                <h2>Insights</h2>
                <pre>{json.dumps(integrated_data['insights'], indent=2)}</pre>
            </div>
            
            <div class="section">
                <h2>File Associations</h2>
                <pre>{json.dumps(integrated_data['file_associations'], indent=2)}</pre>
            </div>
            
            <div class="section">
                <h2>Financial Entity</h2>
                <pre>{json.dumps(integrated_data['financial_entity'], indent=2)}</pre>
            </div>
            
            <div class="section">
                <h2>Code Entity</h2>
                <pre>{json.dumps(integrated_data['code_entity'], indent=2)}</pre>
            </div>
        </body>
        </html>
        """
        
        with open(output_path, 'w') as f:
            f.write(html_content)
    else:
        raise ValueError(f"Format type '{format_type}' not supported")
    
    return output_path
