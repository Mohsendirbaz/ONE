"""
Direct Analyzer Module

This module provides direct analysis capabilities by directly using core analyzer modules.
It bypasses the need for temporary files by calling the analysis functions directly.
"""

import os
from typing import Dict, Any, Optional

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