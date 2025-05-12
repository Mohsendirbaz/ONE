"""
Probing Module

This module consolidates file_associations and insights_generator modules
and provides an integration point with financial-entity-analyzer and
financial_entity_visualizations modules.
"""

# Version information
__version__ = '1.0.0'

# Import integration functions for easy access
from .integration import (
    get_latest_file_associations_data,
    get_financial_entity_visualizations,
    get_financial_entity_analyzer_data,
    generate_integrated_report
)

# Import main functions from submodules for convenience
# These will be populated when the modules are moved
