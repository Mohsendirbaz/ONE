"""
Data Transformer Module

This module provides functionality for transforming data between different modules in the probing system.
It provides converters for each type of data to bridge gaps between modules.
"""

import os
import json
from typing import Dict, List, Any, Optional

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