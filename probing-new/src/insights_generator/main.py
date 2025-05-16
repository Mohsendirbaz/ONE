"""
Main Module for Insights Generator

This module serves as the main entry point for the insights generator.
It ties together all the components of the insights generator package
and provides a command-line interface for generating insights.
"""

import os
import sys
import argparse
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime

# Import insights generator modules
from data_miner import DataMiner
from entity_analyzer import EntityAnalyzer
from insights_miner import InsightsMiner
from network_analyzer import NetworkAnalyzer
from d3_network_generator import D3NetworkGenerator
from interactive_html_generator import InteractiveHTMLGenerator

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_arguments():
    """
    Parse command-line arguments.
    
    Returns:
        Parsed arguments
    """
    parser = argparse.ArgumentParser(description='Generate insights from code and financial data.')
    
    parser.add_argument('source_path', help='Path to the source code repository')
    parser.add_argument('--output-dir', '-o', default='./output', help='Directory to save output files')
    parser.add_argument('--config', '-c', help='Path to configuration file')
    parser.add_argument('--report-type', '-r', choices=['insights', 'network', 'comprehensive'], 
                       default='comprehensive', help='Type of report to generate')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose output')
    
    return parser.parse_args()

def load_config(config_path: Optional[str]) -> Dict[str, Any]:
    """
    Load configuration from a JSON file.
    
    Args:
        config_path: Path to the configuration file
        
    Returns:
        Configuration dictionary
    """
    if not config_path:
        return {}
    
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading configuration: {str(e)}")
        return {}

def setup_output_directory(output_dir: str) -> str:
    """
    Set up the output directory.
    
    Args:
        output_dir: Base output directory
        
    Returns:
        Path to the output directory for this run
    """
    # Create a timestamped directory for this run
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    run_dir = os.path.join(output_dir, f"insights_{timestamp}")
    
    # Create directories
    os.makedirs(run_dir, exist_ok=True)
    os.makedirs(os.path.join(run_dir, "data"), exist_ok=True)
    os.makedirs(os.path.join(run_dir, "visualizations"), exist_ok=True)
    os.makedirs(os.path.join(run_dir, "reports"), exist_ok=True)
    
    return run_dir

def generate_insights(source_path: str, output_dir: str, config: Dict[str, Any]) -> Dict[str, str]:
    """
    Generate insights from the source code repository.
    
    Args:
        source_path: Path to the source code repository
        output_dir: Directory to save output files
        config: Configuration dictionary
        
    Returns:
        Dictionary mapping output types to file paths
    """
    logger.info(f"Generating insights for {source_path}")
    
    # Initialize components
    data_miner = DataMiner(config.get("data_miner", {}))
    entity_analyzer = EntityAnalyzer(config.get("entity_analyzer", {}))
    insights_miner = InsightsMiner(config.get("insights_miner", {}))
    network_analyzer = NetworkAnalyzer(config.get("network_analyzer", {}))
    d3_generator = D3NetworkGenerator(config.get("d3_generator", {}))
    html_generator = InteractiveHTMLGenerator(config.get("html_generator", {}))
    
    # Mine data
    logger.info("Mining data...")
    data = data_miner.mine_all_data(source_path)
    
    # Save mined data
    data_path = os.path.join(output_dir, "data", "mined_data.json")
    data_miner.save_mined_data(data, data_path)
    logger.info(f"Mined data saved to {data_path}")
    
    # Analyze entities
    logger.info("Analyzing entities...")
    analysis_results = entity_analyzer.analyze_all_entities(data)
    
    # Save analysis results
    analysis_path = os.path.join(output_dir, "data", "analysis_results.json")
    with open(analysis_path, 'w') as f:
        json.dump(analysis_results, f, indent=2)
    logger.info(f"Analysis results saved to {analysis_path}")
    
    # Generate insights
    logger.info("Generating insights...")
    insights = insights_miner.mine_all_insights(analysis_results, data.get("file_associations", {}))
    
    # Save insights
    insights_path = os.path.join(output_dir, "data", "insights.json")
    with open(insights_path, 'w') as f:
        json.dump(insights, f, indent=2)
    logger.info(f"Insights saved to {insights_path}")
    
    # Analyze networks
    logger.info("Analyzing networks...")
    network_analysis = network_analyzer.analyze_all_networks(data)
    
    # Save network analysis
    network_analysis_path = os.path.join(output_dir, "data", "network_analysis.json")
    with open(network_analysis_path, 'w') as f:
        json.dump(network_analysis, f, indent=2)
    logger.info(f"Network analysis saved to {network_analysis_path}")
    
    # Generate network visualizations
    logger.info("Generating network visualizations...")
    visualizations_dir = os.path.join(output_dir, "visualizations")
    visualization_files = d3_generator.generate_all_network_visualizations(network_analysis, visualizations_dir)
    logger.info(f"Network visualizations saved to {visualizations_dir}")
    
    # Generate HTML reports
    logger.info("Generating HTML reports...")
    reports_dir = os.path.join(output_dir, "reports")
    
    # Generate insights report
    insights_report = html_generator.generate_insights_report(insights)
    insights_report_path = os.path.join(reports_dir, "insights_report.html")
    html_generator.save_report(insights_report, insights_report_path)
    logger.info(f"Insights report saved to {insights_report_path}")
    
    # Generate network report
    network_report = html_generator.generate_network_report(network_analysis, visualization_files)
    network_report_path = os.path.join(reports_dir, "network_report.html")
    html_generator.save_report(network_report, network_report_path)
    logger.info(f"Network report saved to {network_report_path}")
    
    # Generate comprehensive report
    comprehensive_report = html_generator.generate_comprehensive_report(insights, network_analysis, visualization_files)
    comprehensive_report_path = os.path.join(reports_dir, "comprehensive_report.html")
    html_generator.save_report(comprehensive_report, comprehensive_report_path)
    logger.info(f"Comprehensive report saved to {comprehensive_report_path}")
    
    return {
        "mined_data": data_path,
        "analysis_results": analysis_path,
        "insights": insights_path,
        "network_analysis": network_analysis_path,
        "insights_report": insights_report_path,
        "network_report": network_report_path,
        "comprehensive_report": comprehensive_report_path
    }

def main():
    """
    Main entry point for the insights generator.
    """
    # Parse command-line arguments
    args = parse_arguments()
    
    # Set up logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Load configuration
    config = load_config(args.config)
    
    # Set up output directory
    output_dir = setup_output_directory(args.output_dir)
    
    try:
        # Generate insights
        output_files = generate_insights(args.source_path, output_dir, config)
        
        # Print summary
        print("\nInsights Generation Complete!")
        print(f"Source: {args.source_path}")
        print(f"Output Directory: {output_dir}")
        
        # Open the appropriate report based on the report type
        if args.report_type == 'insights':
            report_path = output_files["insights_report"]
        elif args.report_type == 'network':
            report_path = output_files["network_report"]
        else:  # comprehensive
            report_path = output_files["comprehensive_report"]
        
        print(f"\nReport: {report_path}")
        
        # Try to open the report in the default browser
        try:
            import webbrowser
            webbrowser.open(f"file://{os.path.abspath(report_path)}")
            print("Report opened in browser.")
        except Exception as e:
            print(f"Could not open report in browser: {str(e)}")
            print(f"Please open the report manually.")
        
        return 0
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}", exc_info=True)
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
