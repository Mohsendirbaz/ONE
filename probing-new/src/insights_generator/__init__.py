"""
Insights Generator

This package provides utilities for mining data from the outputs of the
directory structure analyzer and file association tracking system, and
generating an HTML file with insights extracted from the findings.

The insights are classified, intelligently structured, and provide
searchable measures to locate entities of interest from variables,
functions, classes, modules, etc.
"""

# Import main classes for easy access
from .data_miner import DataMiner
from .entity_analyzer import EntityAnalyzer
from .insights_miner import InsightsMiner
from .network_analyzer import NetworkAnalyzer
from .d3_network_generator import D3NetworkGenerator
from .interactive_html_generator import InteractiveHTMLGenerator

# Import main function for command-line usage
from .main import main, generate_insights

# Version information
__version__ = '1.0.0'
__author__ = 'Insights Generator Team'
__email__ = 'info@insightsgenerator.com'
__license__ = 'MIT'

# Define what's available when using "from insights_generator import *"
__all__ = [
    'DataMiner',
    'EntityAnalyzer',
    'InsightsMiner',
    'NetworkAnalyzer',
    'D3NetworkGenerator',
    'InteractiveHTMLGenerator',
    'main',
    'generate_insights'
]
