/**
 * Insight Generator Module
 * 
 * Generates insights and recommendations based on code analysis results.
 */

/**
 * Generate insights from code analysis results
 * @param {Object} analysisResults - The results from the EntityAnalyzer
 * @returns {Object} Object containing keyInsights and recommendations
 */
export function generateInsights(analysisResults) {
  if (!analysisResults) {
    return {
      keyInsights: [],
      recommendations: []
    };
  }

  const insights = {
    keyInsights: [],
    recommendations: []
  };

  // Generate key insights
  insights.keyInsights = generateKeyInsights(analysisResults);
  
  // Generate recommendations
  insights.recommendations = generateRecommendations(analysisResults);

  return insights;
}

/**
 * Generate key insights from analysis results
 * @param {Object} analysisResults - The results from the EntityAnalyzer
 * @returns {Array} Array of insight objects
 */
function generateKeyInsights(analysisResults) {
  const insights = [];
  
  // Structure insights
  if (analysisResults.components) {
    const componentCount = analysisResults.components.length;
    
    insights.push({
      type: 'structure',
      title: 'Component Structure',
      description: `Project contains ${componentCount} React components with an average of ${calculateAverageProps(analysisResults.components)} props per component.`
    });
  }
  
  // Complexity insights
  if (analysisResults.complexity) {
    insights.push({
      type: 'complexity',
      title: 'Code Complexity',
      description: `Average component complexity score is ${analysisResults.complexity.average.toFixed(1)}. ${getComplexityDescription(analysisResults.complexity.average)}`
    });
  }
  
  // Performance insights
  if (analysisResults.performance) {
    insights.push({
      type: 'performance',
      title: 'Performance Considerations',
      description: `Identified ${analysisResults.performance.issuesCount || 0} potential performance issues related to component rendering.`
    });
  }
  
  // Maintenance insights
  if (analysisResults.maintenance) {
    insights.push({
      type: 'maintenance',
      title: 'Code Maintainability',
      description: `Code maintainability score: ${analysisResults.maintenance.score || 'N/A'}. ${analysisResults.maintenance.issuesCount || 0} maintenance concerns identified.`
    });
  }
  
  return insights;
}

/**
 * Generate recommendations from analysis results
 * @param {Object} analysisResults - The results from the EntityAnalyzer
 * @returns {Array} Array of recommendation objects
 */
function generateRecommendations(analysisResults) {
  const recommendations = [];
  
  // Component structure recommendations
  if (analysisResults.components) {
    const largeComponents = analysisResults.components.filter(c => c.linesOfCode > 300);
    
    if (largeComponents.length > 0) {
      recommendations.push({
        priority: 'High',
        title: 'Refactor Large Components',
        description: `${largeComponents.length} components exceed 300 lines of code. Consider breaking these down into smaller, more focused components.`,
        affectedFiles: largeComponents.map(c => c.filePath || 'Unknown')
      });
    }
  }
  
  // Dependency recommendations
  if (analysisResults.dependencies) {
    const circularDeps = analysisResults.dependencies.circular || [];
    
    if (circularDeps.length > 0) {
      recommendations.push({
        priority: 'Medium',
        title: 'Resolve Circular Dependencies',
        description: `Found ${circularDeps.length} circular dependencies which can lead to maintenance issues and unexpected behavior.`,
        affectedFiles: circularDeps.map(d => d.source)
      });
    }
  }
  
  // Performance recommendations
  if (analysisResults.performance) {
    const rerenderIssues = analysisResults.performance.rerenderIssues || [];
    
    if (rerenderIssues.length > 0) {
      recommendations.push({
        priority: 'Medium',
        title: 'Optimize Component Rendering',
        description: 'Components with frequent re-renders could benefit from memoization or optimized state management.',
        affectedFiles: rerenderIssues.map(i => i.component)
      });
    }
  }
  
  // Hook usage recommendations
  if (analysisResults.hooks) {
    const hookIssues = analysisResults.hooks.issues || [];
    
    if (hookIssues.length > 0) {
      recommendations.push({
        priority: 'Low',
        title: 'Improve Hook Usage',
        description: 'Some components have hook-related issues that could be optimized for better performance and maintainability.',
        affectedFiles: hookIssues.map(i => i.component)
      });
    }
  }
  
  return recommendations;
}

/**
 * Calculate average props per component
 * @param {Array} components - Array of component objects
 * @returns {Number} Average number of props
 */
function calculateAverageProps(components) {
  if (!components || components.length === 0) return 0;
  
  const totalProps = components.reduce((sum, component) => {
    return sum + (component.props ? component.props.length : 0);
  }, 0);
  
  return (totalProps / components.length).toFixed(1);
}

/**
 * Get description based on complexity score
 * @param {Number} score - Complexity score
 * @returns {String} Description of complexity
 */
function getComplexityDescription(score) {
  if (score < 10) return 'Components are generally simple and easy to understand.';
  if (score < 20) return 'Components have moderate complexity.';
  return 'Some components are highly complex and may benefit from refactoring.';
}