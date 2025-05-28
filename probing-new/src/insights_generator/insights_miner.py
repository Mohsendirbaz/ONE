"""
Insights Miner Module

This module provides functionality for mining insights from analyzed entity data.
It generates meaningful insights about code and financial entities that can be
presented to users.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
import random
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InsightsMiner:
    """
    A class for mining insights from analyzed entity data.
    
    This class provides methods for generating insights from analyzed entity data.
    It identifies patterns, anomalies, and other interesting aspects of the data
    that can be presented to users.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the InsightsMiner with optional configuration.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        logger.info("InsightsMiner initialized with config: %s", self.config)
    
    def mine_code_insights(self, code_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Mine insights from code entity analysis.
        
        Args:
            code_analysis: Code entity analysis from the EntityAnalyzer
            
        Returns:
            List of insights about code entities
        """
        logger.info("Mining code insights")
        
        if "error" in code_analysis:
            logger.error("Error in code analysis: %s", code_analysis["error"])
            return [{"type": "Error", "confidence": 100, "description": f"Error: {code_analysis['error']}"}]
        
        insights = []
        
        # Insight about entity counts
        entity_counts = code_analysis.get("entity_counts", {})
        if entity_counts:
            most_common_type = max(entity_counts.items(), key=lambda x: x[1])
            insights.append({
                "type": "Code Entity Distribution",
                "confidence": 90,
                "description": f"The most common code entity type is '{most_common_type[0]}' with {most_common_type[1]} instances."
            })
        
        # Insight about complexity
        complexity = code_analysis.get("complexity", {})
        if complexity:
            avg_complexity = complexity.get("average_complexity", 0)
            complexity_level = "high" if avg_complexity > 2.5 else "medium" if avg_complexity > 1.5 else "low"
            insights.append({
                "type": "Code Complexity",
                "confidence": 85,
                "description": f"The codebase has {complexity_level} complexity with an average score of {avg_complexity:.2f}."
            })
            
            most_connected = complexity.get("most_connected_entity", "")
            if most_connected:
                insights.append({
                    "type": "Code Connectivity",
                    "confidence": 80,
                    "description": f"'{most_connected}' is the most connected entity with {complexity.get('max_relationships', 0)} relationships."
                })
        
        # Insights about key entities
        key_entities = code_analysis.get("key_entities", [])
        if key_entities:
            top_entity = key_entities[0]
            entity_name = top_entity.get("entity", {}).get("name", "Unknown")
            insights.append({
                "type": "Key Code Entity",
                "confidence": 75,
                "description": f"'{entity_name}' is a key entity in the codebase. {top_entity.get('reason', '')}"
            })
        
        # General insights
        total_entities = code_analysis.get("total_entities", 0)
        total_relationships = code_analysis.get("total_relationships", 0)
        if total_entities > 0:
            insights.append({
                "type": "Code Structure",
                "confidence": 95,
                "description": f"The codebase contains {total_entities} entities and {total_relationships} relationships."
            })
            
            relationship_ratio = total_relationships / total_entities if total_entities > 0 else 0
            if relationship_ratio > 2:
                insights.append({
                    "type": "Code Coupling",
                    "confidence": 70,
                    "description": f"The codebase has high coupling with {relationship_ratio:.2f} relationships per entity."
                })
            elif relationship_ratio < 0.5:
                insights.append({
                    "type": "Code Coupling",
                    "confidence": 70,
                    "description": f"The codebase has low coupling with {relationship_ratio:.2f} relationships per entity."
                })
        
        return insights
    
    def mine_financial_insights(self, financial_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Mine insights from financial entity analysis.
        
        Args:
            financial_analysis: Financial entity analysis from the EntityAnalyzer
            
        Returns:
            List of insights about financial entities
        """
        logger.info("Mining financial insights")
        
        if "error" in financial_analysis:
            logger.error("Error in financial analysis: %s", financial_analysis["error"])
            return [{"type": "Error", "confidence": 100, "description": f"Error: {financial_analysis['error']}"}]
        
        insights = []
        
        # Insight about entity counts
        entity_counts = financial_analysis.get("entity_counts", {})
        if entity_counts:
            most_common_type = max(entity_counts.items(), key=lambda x: x[1])
            insights.append({
                "type": "Financial Entity Distribution",
                "confidence": 90,
                "description": f"The most common financial entity type is '{most_common_type[0]}' with {most_common_type[1]} instances."
            })
        
        # Insight about financial metrics
        financial_metrics = financial_analysis.get("financial_metrics", {})
        if financial_metrics:
            profit_margin = financial_metrics.get("profit_margin", 0)
            profit_margin_percent = profit_margin * 100
            profit_status = "healthy" if profit_margin > 0.2 else "concerning" if profit_margin < 0.1 else "moderate"
            insights.append({
                "type": "Profit Margin",
                "confidence": 85,
                "description": f"The profit margin is {profit_margin_percent:.2f}%, which is {profit_status}."
            })
            
            total_value = financial_metrics.get("total_value", 0)
            insights.append({
                "type": "Financial Scale",
                "confidence": 80,
                "description": f"The total financial value is ${total_value:,.2f}."
            })
            
            type_totals = financial_metrics.get("type_totals", {})
            if "revenue" in type_totals and "expense" in type_totals:
                revenue = type_totals["revenue"]
                expense = type_totals["expense"]
                insights.append({
                    "type": "Revenue vs Expense",
                    "confidence": 90,
                    "description": f"Revenue (${revenue:,.2f}) is {'greater than' if revenue > expense else 'less than'} expenses (${expense:,.2f})."
                })
        
        # Insights about key entities
        key_entities = financial_analysis.get("key_entities", [])
        if key_entities:
            top_entity = key_entities[0]
            entity_name = top_entity.get("entity", {}).get("name", "Unknown")
            entity_value = top_entity.get("entity", {}).get("value", 0)
            insights.append({
                "type": "Key Financial Entity",
                "confidence": 75,
                "description": f"'{entity_name}' is a key financial entity with value ${entity_value:,.2f}. {top_entity.get('reason', '')}"
            })
        
        # General insights
        total_entities = financial_analysis.get("total_entities", 0)
        total_relationships = financial_analysis.get("total_relationships", 0)
        if total_entities > 0:
            insights.append({
                "type": "Financial Structure",
                "confidence": 95,
                "description": f"The financial data contains {total_entities} entities and {total_relationships} relationships."
            })
        
        return insights
    
    def mine_file_association_insights(self, file_associations: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Mine insights from file association data.
        
        Args:
            file_associations: File association data from the data miner
            
        Returns:
            List of insights about file associations
        """
        logger.info("Mining file association insights")
        
        if "error" in file_associations:
            logger.error("Error in file associations: %s", file_associations["error"])
            return [{"type": "Error", "confidence": 100, "description": f"Error: {file_associations['error']}"}]
        
        insights = []
        
        # Insight about metrics
        metrics = file_associations.get("metrics", [])
        for metric in metrics:
            metric_name = metric.get("name", "")
            metric_value = metric.get("value", 0)
            metric_description = metric.get("description", "")
            
            if metric_name and metric_description:
                insights.append({
                    "type": f"File {metric_name.capitalize()}",
                    "confidence": 85,
                    "description": metric_description
                })
        
        # Insight about file associations
        associations = file_associations.get("file_associations", {})
        if associations:
            most_connected_file = max(associations.items(), key=lambda x: len(x[1]) if isinstance(x[1], list) else 0)
            file_name = most_connected_file[0]
            connection_count = len(most_connected_file[1]) if isinstance(most_connected_file[1], list) else 0
            
            if connection_count > 0:
                insights.append({
                    "type": "File Connectivity",
                    "confidence": 80,
                    "description": f"'{file_name}' is the most connected file with {connection_count} connections."
                })
            
            isolated_files = [file for file, connections in associations.items() 
                             if not connections or (isinstance(connections, list) and len(connections) == 0)]
            if isolated_files:
                insights.append({
                    "type": "Isolated Files",
                    "confidence": 75,
                    "description": f"There are {len(isolated_files)} isolated files with no connections to other files."
                })
        
        return insights
    
    def mine_all_insights(self, analysis_results: Dict[str, Any], 
                         file_associations: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Mine all insights from analysis results and file associations.
        
        Args:
            analysis_results: Analysis results from the EntityAnalyzer
            file_associations: Optional file association data from the data miner
            
        Returns:
            Dictionary containing all insights
        """
        logger.info("Mining all insights")
        
        code_insights = self.mine_code_insights(analysis_results.get("code_entity_analysis", {}))
        financial_insights = self.mine_financial_insights(analysis_results.get("financial_entity_analysis", {}))
        
        file_association_insights = []
        if file_associations:
            file_association_insights = self.mine_file_association_insights(file_associations)
        
        # Combine all insights
        all_insights = code_insights + financial_insights + file_association_insights
        
        # Sort insights by confidence
        sorted_insights = sorted(all_insights, key=lambda x: x.get("confidence", 0), reverse=True)
        
        return {
            "timestamp": datetime.now().isoformat(),
            "source_path": analysis_results.get("source_path", ""),
            "insights": sorted_insights,
            "totalInsights": len(sorted_insights),
            "code_insights_count": len(code_insights),
            "financial_insights_count": len(financial_insights),
            "file_association_insights_count": len(file_association_insights)
        }


# Example usage
if __name__ == "__main__":
    from data_miner import DataMiner
    from entity_analyzer import EntityAnalyzer
    
    miner = DataMiner()
    data = miner.mine_all_data("./example_repo")
    
    analyzer = EntityAnalyzer()
    analysis_results = analyzer.analyze_all_entities(data)
    
    insights_miner = InsightsMiner()
    insights = insights_miner.mine_all_insights(analysis_results, data.get("file_associations", {}))
    
    print(f"Generated {insights['totalInsights']} insights:")
    for i, insight in enumerate(insights["insights"], 1):
        print(f"{i}. [{insight['type']}] ({insight['confidence']}% confidence): {insight['description']}")
