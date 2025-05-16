"""
Entity Analyzer Module

This module provides functionality for analyzing entities extracted by the
data miner. It processes raw entity data and extracts meaningful insights
about code and financial entities.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EntityAnalyzer:
    """
    A class for analyzing code and financial entities.
    
    This class provides methods for analyzing entities extracted by the
    data miner. It processes raw entity data and extracts meaningful
    insights about code and financial entities.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the EntityAnalyzer with optional configuration.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        logger.info("EntityAnalyzer initialized with config: %s", self.config)
    
    def analyze_code_entities(self, code_entities_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze code entities data.
        
        Args:
            code_entities_data: Code entities data from the data miner
            
        Returns:
            Dictionary containing analysis results
        """
        logger.info("Analyzing code entities")
        
        if "error" in code_entities_data:
            logger.error("Error in code entities data: %s", code_entities_data["error"])
            return {"error": code_entities_data["error"]}
        
        entities = code_entities_data.get("code_entities", [])
        relationships = code_entities_data.get("relationships", [])
        
        # Count entities by type
        entity_counts = {}
        for entity in entities:
            entity_type = entity.get("type", "unknown")
            entity_counts[entity_type] = entity_counts.get(entity_type, 0) + 1
        
        # Calculate complexity metrics
        complexity = self._calculate_code_complexity(entities, relationships)
        
        # Identify key entities
        key_entities = self._identify_key_code_entities(entities, relationships)
        
        return {
            "entity_counts": entity_counts,
            "complexity": complexity,
            "key_entities": key_entities,
            "total_entities": len(entities),
            "total_relationships": len(relationships)
        }
    
    def _calculate_code_complexity(self, entities: List[Dict[str, Any]], 
                                  relationships: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate code complexity metrics.
        
        Args:
            entities: List of code entities
            relationships: List of relationships between entities
            
        Returns:
            Dictionary containing complexity metrics
        """
        # This would be replaced with actual complexity calculation logic
        # For now, we'll return placeholder metrics
        
        # Count relationships per entity
        entity_relationship_counts = {}
        for relationship in relationships:
            source = relationship.get("source", "")
            entity_relationship_counts[source] = entity_relationship_counts.get(source, 0) + 1
        
        # Find max relationships
        max_relationships = 0
        most_connected_entity = ""
        for entity, count in entity_relationship_counts.items():
            if count > max_relationships:
                max_relationships = count
                most_connected_entity = entity
        
        # Calculate average complexity
        total_complexity = 0
        complexity_count = 0
        for entity in entities:
            for prop in entity.get("properties", []):
                if prop.get("name") == "complexity":
                    if prop.get("value") == "high":
                        total_complexity += 3
                    elif prop.get("value") == "medium":
                        total_complexity += 2
                    else:  # low or unknown
                        total_complexity += 1
                    complexity_count += 1
        
        avg_complexity = total_complexity / complexity_count if complexity_count > 0 else 0
        
        return {
            "average_complexity": avg_complexity,
            "most_connected_entity": most_connected_entity,
            "max_relationships": max_relationships,
            "relationship_density": len(relationships) / len(entities) if entities else 0
        }
    
    def _identify_key_code_entities(self, entities: List[Dict[str, Any]], 
                                   relationships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identify key code entities based on various metrics.
        
        Args:
            entities: List of code entities
            relationships: List of relationships between entities
            
        Returns:
            List of key entities with importance scores
        """
        # This would be replaced with actual key entity identification logic
        # For now, we'll return placeholder key entities
        
        key_entities = []
        
        # Simple heuristic: entities with more properties or that are referenced more often
        entity_references = {}
        for relationship in relationships:
            imported = relationship.get("imported", "")
            entity_references[imported] = entity_references.get(imported, 0) + 1
        
        for entity in entities:
            importance = len(entity.get("properties", [])) + entity_references.get(entity.get("file", ""), 0)
            if importance > 1:  # Arbitrary threshold
                key_entities.append({
                    "entity": entity,
                    "importance": importance,
                    "reason": "Has multiple properties or is frequently referenced"
                })
        
        return sorted(key_entities, key=lambda x: x["importance"], reverse=True)
    
    def analyze_financial_entities(self, financial_entities_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze financial entities data.
        
        Args:
            financial_entities_data: Financial entities data from the data miner
            
        Returns:
            Dictionary containing analysis results
        """
        logger.info("Analyzing financial entities")
        
        if "error" in financial_entities_data:
            logger.error("Error in financial entities data: %s", financial_entities_data["error"])
            return {"error": financial_entities_data["error"]}
        
        entities = financial_entities_data.get("financial_entities", [])
        relationships = financial_entities_data.get("relationships", [])
        
        # Count entities by type
        entity_counts = {}
        for entity in entities:
            entity_type = entity.get("type", "unknown")
            entity_counts[entity_type] = entity_counts.get(entity_type, 0) + 1
        
        # Calculate financial metrics
        financial_metrics = self._calculate_financial_metrics(entities, relationships)
        
        # Identify key financial entities
        key_entities = self._identify_key_financial_entities(entities, relationships)
        
        return {
            "entity_counts": entity_counts,
            "financial_metrics": financial_metrics,
            "key_entities": key_entities,
            "total_entities": len(entities),
            "total_relationships": len(relationships)
        }
    
    def _calculate_financial_metrics(self, entities: List[Dict[str, Any]], 
                                    relationships: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate financial metrics.
        
        Args:
            entities: List of financial entities
            relationships: List of relationships between entities
            
        Returns:
            Dictionary containing financial metrics
        """
        # This would be replaced with actual financial metrics calculation logic
        # For now, we'll return placeholder metrics
        
        # Sum up values by type
        type_totals = {}
        for entity in entities:
            entity_type = entity.get("type", "unknown")
            value = entity.get("value", 0)
            type_totals[entity_type] = type_totals.get(entity_type, 0) + value
        
        # Calculate ratios if possible
        revenue = type_totals.get("revenue", 0)
        expense = type_totals.get("expense", 0)
        profit_margin = (revenue - expense) / revenue if revenue > 0 else 0
        
        return {
            "type_totals": type_totals,
            "profit_margin": profit_margin,
            "total_value": sum(type_totals.values())
        }
    
    def _identify_key_financial_entities(self, entities: List[Dict[str, Any]], 
                                        relationships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identify key financial entities based on various metrics.
        
        Args:
            entities: List of financial entities
            relationships: List of relationships between entities
            
        Returns:
            List of key entities with importance scores
        """
        # This would be replaced with actual key entity identification logic
        # For now, we'll return placeholder key entities
        
        key_entities = []
        
        # Simple heuristic: entities with higher values or that are involved in relationships
        entity_in_relationships = set()
        for relationship in relationships:
            entity_from = relationship.get("from", "")
            entity_to = relationship.get("to", "")
            entity_in_relationships.add(entity_from)
            entity_in_relationships.add(entity_to)
        
        for entity in entities:
            importance = entity.get("value", 0) / 100000  # Normalize value
            if entity.get("name", "") in entity_in_relationships:
                importance += 1
            
            if importance > 1:  # Arbitrary threshold
                key_entities.append({
                    "entity": entity,
                    "importance": importance,
                    "reason": "Has high value or is involved in relationships"
                })
        
        return sorted(key_entities, key=lambda x: x["importance"], reverse=True)
    
    def analyze_all_entities(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze all entities in the data.
        
        Args:
            data: Data containing code and financial entities
            
        Returns:
            Dictionary containing analysis results for all entities
        """
        logger.info("Analyzing all entities")
        
        code_entity_analysis = self.analyze_code_entities(data.get("code_entity", {}))
        financial_entity_analysis = self.analyze_financial_entities(data.get("financial_entity", {}))
        
        return {
            "timestamp": data.get("timestamp", ""),
            "source_path": data.get("source_path", ""),
            "code_entity_analysis": code_entity_analysis,
            "financial_entity_analysis": financial_entity_analysis
        }


# Example usage
if __name__ == "__main__":
    from data_miner import DataMiner
    
    miner = DataMiner()
    data = miner.mine_all_data("./example_repo")
    
    analyzer = EntityAnalyzer()
    analysis_results = analyzer.analyze_all_entities(data)
    
    print(f"Code entities: {analysis_results['code_entity_analysis']['total_entities']}")
    print(f"Financial entities: {analysis_results['financial_entity_analysis']['total_entities']}")
