import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';

/**
 * Analyzer for financial calculation flows
 * Identifies calculation sequences, dependencies, and control flows
 */
export class CalculationFlowAnalyzer {
  constructor(options = {}) {
    this.options = {
      identifyIterativeLoops: true,     // Identify price-finding loops
      trackFinancialMetrics: true,      // Track financial metrics like NPV
      analyzeConvergencePaths: true,    // Analyze optimization convergence
      ...options
    };
    
    this.calculationSteps = [];          // All calculation steps identified
    this.calculationPaths = [];          // Execution paths through calculations
    this.financialMetrics = new Set();   // Tracked financial metrics
    this.parameterUsage = new Map();     // Parameter usage across calculations
    this.iterativeProcesses = [];        // Identified iterative processes
    this.calculationBlocks = {};         // Calculations grouped by purpose
  }
  
  /**
   * Analyze financial calculation code to map calculation flows
   * @param {string} code - JavaScript or Python source code
   * @param {string} filePath - Path to the source file
   * @return {Object} Analysis results
   */
  analyzeCalculationFlow(code, filePath) {
    const language = this._detectLanguage(filePath);
    const ast = this._parseCode(code, language);
    
    // Use abstract syntax tree to analyze calculation flow
    const calculationFlow = this._buildCalculationFlow(ast, language);
    
    // Identify calculation blocks (logical groups of calculations)
    this.calculationBlocks = this._identifyCalculationBlocks(calculationFlow);
    
    // Identify iterative processes like price-finding loops
    if (this.options.identifyIterativeLoops) {
      this.iterativeProcesses = this._identifyIterativeProcesses(ast, language);
    }
    
    // Track financial metrics like NPV, IRR, etc.
    if (this.options.trackFinancialMetrics) {
      this.financialMetrics = this._identifyFinancialMetrics(ast, language);
    }
    
    // Map potential calculation paths
    this.calculationPaths = this._mapCalculationPaths(calculationFlow);
    
    return {
      calculationBlocks: this.calculationBlocks,
      calculationPaths: this.calculationPaths,
      iterativeProcesses: this.iterativeProcesses,
      financialMetrics: Array.from(this.financialMetrics),
      parameterUsage: Object.fromEntries(this.parameterUsage)
    };
  }
  
  /**
   * Identify logical blocks of financial calculations
   * @private
   */
  _identifyCalculationBlocks(calculationFlow) {
    // Implementation to identify calculation blocks like:
    // - Revenue calculation
    // - Expense calculation
    // - Tax calculation
    // - Depreciation calculation
    // - NPV calculation
    // - Optimization loops
    
    const blocks = {
      revenueCalculation: [],
      expenseCalculation: [],
      taxCalculation: [],
      depreciationCalculation: [],
      npvCalculation: [],
      optimizationLoops: []
    };
    
    // Use pattern matching based on financial terminology and patterns
    calculationFlow.nodes.forEach(node => {
      // Identify revenue calculation patterns
      if (node.name.includes('revenue') || node.name.includes('income')) {
        blocks.revenueCalculation.push(node);
      }
      
      // Identify expense calculation patterns
      if (node.name.includes('expense') || node.name.includes('cost')) {
        blocks.expenseCalculation.push(node);
      }
      
      // Identify tax calculation patterns
      if (node.name.includes('tax')) {
        blocks.taxCalculation.push(node);
      }
      
      // Identify depreciation calculation patterns
      if (node.name.includes('depreciation')) {
        blocks.depreciationCalculation.push(node);
      }
      
      // Identify NPV calculation patterns
      if (node.name.includes('npv') || node.name.includes('present value')) {
        blocks.npvCalculation.push(node);
      }
      
      // Identify optimization loop patterns
      if (node.type === 'WhileLoop' && 
          (node.condition.includes('tolerance') || 
           node.condition.includes('convergence'))) {
        blocks.optimizationLoops.push(node);
      }
    });
    
    return blocks;
  }
  
  /**
   * Identify iterative processes like price-finding loops
   * @private
   */
  _identifyIterativeProcesses(ast, language) {
    const iterativeProcesses = [];
    
    // Logic to detect while loops or for loops with convergence conditions
    // Specifically looking for price optimization patterns
    
    if (language === 'python') {
      // Python-specific iteration pattern detection
      // Look for while loops with NPV comparisons
      estraverse.traverse(ast, {
        enter: (node) => {
          if (node.type === 'WhileStatement') {
            // Check if this is an optimization loop
            const isOptimizationLoop = this._checkForOptimizationPattern(node);
            if (isOptimizationLoop) {
              iterativeProcesses.push({
                type: 'optimization_loop',
                target: isOptimizationLoop.target,
                metric: isOptimizationLoop.metric,
                tolerance: isOptimizationLoop.tolerance,
                adjustmentFactor: isOptimizationLoop.adjustmentFactor,
                location: node.loc
              });
            }
          }
        }
      });
    } else if (language === 'javascript') {
      // JavaScript-specific iteration pattern detection
      estraverse.traverse(ast, {
        enter: (node) => {
          if (node.type === 'WhileStatement') {
            // Check if this is an optimization loop
            const isOptimizationLoop = this._checkForOptimizationPattern(node);
            if (isOptimizationLoop) {
              iterativeProcesses.push({
                type: 'optimization_loop',
                target: isOptimizationLoop.target,
                metric: isOptimizationLoop.metric,
                tolerance: isOptimizationLoop.tolerance,
                adjustmentFactor: isOptimizationLoop.adjustmentFactor,
                location: node.loc
              });
            }
          }
        }
      });
    }
    
    return iterativeProcesses;
  }
  
  /**
   * Check if a node represents an optimization pattern
   * @private
   */
  _checkForOptimizationPattern(node) {
    // Logic to detect if a loop is optimizing a financial parameter
    // Look for patterns like adjusting price until NPV reaches target
    
    // Example optimization pattern:
    // while npv < TOLERANCE_LOWER or npv > TOLERANCE_UPPER:
    //     if npv < 0:
    //         price *= 1.02  # Increment price
    //     elif npv > 0:
    //         price *= 0.985  # Decrement price
    
    // Check if the condition involves a financial metric
    let metric = null;
    let target = null;
    let tolerance = null;
    
    // Extract condition from the while statement
    const condition = escodegen.generate(node.test);
    
    // Check for financial metrics in the condition
    const financialMetrics = ['npv', 'irr', 'payback', 'roi'];
    for (const metricName of financialMetrics) {
      if (condition.toLowerCase().includes(metricName)) {
        metric = metricName;
        break;
      }
    }
    
    // If no financial metric found, not an optimization loop
    if (!metric) return null;
    
    // Check for tolerance/convergence in condition
    if (condition.includes('TOLERANCE') || 
        condition.includes('tolerance') || 
        condition.includes('CONVERGENCE') || 
        condition.includes('convergence')) {
      tolerance = 'identified in condition';
    }
    
    // Analyze the body to find the target variable being adjusted
    if (node.body && node.body.type === 'BlockStatement') {
      // Look for assignment patterns in the body
      estraverse.traverse(node.body, {
        enter: (bodyNode) => {
          // Look for assignments or updates to variables
          if (bodyNode.type === 'AssignmentExpression' || 
              bodyNode.type === 'UpdateExpression') {
            
            // Get the variable being updated
            const varName = bodyNode.type === 'AssignmentExpression' 
              ? escodegen.generate(bodyNode.left)
              : escodegen.generate(bodyNode.argument);
            
            // Check if this is a financial parameter
            const financialParams = ['price', 'rate', 'cost', 'value'];
            for (const param of financialParams) {
              if (varName.toLowerCase().includes(param)) {
                target = varName;
                break;
              }
            }
            
            // If we found a target, check for adjustment factor
            if (target && bodyNode.type === 'AssignmentExpression' && 
                bodyNode.operator.includes('*')) {
              // This is likely an adjustment factor
              const adjustmentFactor = escodegen.generate(bodyNode.right);
              return {
                target,
                metric,
                tolerance,
                adjustmentFactor
              };
            }
          }
        }
      });
    }
    
    // If we found both a metric and a target, it's likely an optimization loop
    if (metric && target) {
      return {
        target,
        metric,
        tolerance,
        adjustmentFactor: 'dynamic'
      };
    }
    
    return null;
  }
  
  /**
   * Identify financial metrics being tracked
   * @private
   */
  _identifyFinancialMetrics(ast, language) {
    const metrics = new Set();
    
    // Logic to identify references to financial metrics
    // Like NPV, IRR, payback period, etc.
    
    // Common financial metric names
    const metricPatterns = [
      'npv', 'irr', 'payback', 'ror', 'roi', 'ebitda',
      'net present value', 'internal rate of return',
      'return on investment', 'cash flow'
    ];
    
    // Scan AST for references to these metrics
    estraverse.traverse(ast, {
      enter: (node) => {
        if (node.type === 'Identifier' || 
            (node.type === 'Literal' && typeof node.value === 'string')) {
          const name = node.type === 'Identifier' ? node.name : node.value;
          const lowerName = name.toLowerCase();
          
          for (const pattern of metricPatterns) {
            if (lowerName.includes(pattern)) {
              metrics.add({
                name: name,
                type: pattern,
                location: node.loc
              });
              break;
            }
          }
        }
      }
    });
    
    return metrics;
  }
  
  /**
   * Map possible calculation paths through the code
   * @private
   */
  _mapCalculationPaths(calculationFlow) {
    // Use graph algorithms to identify execution paths through calculations
    // Focus on decision points related to financial parameters
    
    const paths = [];
    const { nodes, edges } = calculationFlow;
    
    // Build a directed graph from the calculation flow
    const graph = {};
    nodes.forEach(node => {
      graph[node.id] = { node, next: [] };
    });
    
    edges.forEach(edge => {
      graph[edge.source].next.push(edge.target);
    });
    
    // Find all paths from entry points to exit points
    const entryPoints = nodes.filter(node => node.type === 'EntryPoint').map(node => node.id);
    const exitPoints = nodes.filter(node => node.type === 'ExitPoint').map(node => node.id);
    
    // If no explicit entry/exit points, use nodes with no incoming/outgoing edges
    if (entryPoints.length === 0) {
      nodes.forEach(node => {
        if (!edges.some(edge => edge.target === node.id)) {
          entryPoints.push(node.id);
        }
      });
    }
    
    if (exitPoints.length === 0) {
      nodes.forEach(node => {
        if (!edges.some(edge => edge.source === node.id)) {
          exitPoints.push(node.id);
        }
      });
    }
    
    // For each entry point, find all paths to exit points
    entryPoints.forEach(entryPoint => {
      const visited = new Set();
      this._findPaths(graph, entryPoint, exitPoints, [], visited, paths);
    });
    
    return paths;
  }
  
  /**
   * Recursive helper to find all paths in a graph
   * @private
   */
  _findPaths(graph, current, exitPoints, currentPath, visited, allPaths) {
    // Add current node to path and mark as visited
    currentPath.push(current);
    visited.add(current);
    
    // If we reached an exit point, add the path to results
    if (exitPoints.includes(current)) {
      allPaths.push([...currentPath]);
    } else {
      // Continue DFS to all unvisited neighbors
      for (const next of graph[current].next) {
        if (!visited.has(next)) {
          this._findPaths(graph, next, exitPoints, currentPath, visited, allPaths);
        }
      }
    }
    
    // Backtrack
    currentPath.pop();
    visited.delete(current);
  }
  
  /**
   * Detect the programming language of a file
   * @private
   */
  _detectLanguage(filePath) {
    // Detect language based on file extension
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.js')) return 'javascript';
    return 'unknown';
  }
  
  /**
   * Parse code into an abstract syntax tree
   * @private
   */
  _parseCode(code, language) {
    // Parse code based on language
    if (language === 'javascript') {
      return esprima.parseScript(code, { loc: true });
    } else if (language === 'python') {
      // Use Python parser like python-ast
      // This would require a server-side implementation
      // For client-side we'd use a simplified approach
      
      // Simplified approach for demonstration:
      return this._simplifiedPythonParse(code);
    }
    
    throw new Error(`Unsupported language: ${language}`);
  }
  
  /**
   * Simplified Python parsing for client-side use
   * @private
   */
  _simplifiedPythonParse(code) {
    // This is a very simplified approach to parse Python code
    // In a real implementation, we would use a proper Python parser
    
    const lines = code.split('\n');
    const ast = {
      type: 'Program',
      body: [],
      loc: { start: { line: 1, column: 0 }, end: { line: lines.length, column: 0 } }
    };
    
    // Extract function definitions
    const functionPattern = /def\s+(\w+)\s*\(/g;
    let match;
    while ((match = functionPattern.exec(code)) !== null) {
      const name = match[1];
      const startIndex = match.index;
      
      // Find the function body (simplified)
      let endIndex = code.indexOf('\n\n', startIndex);
      if (endIndex === -1) endIndex = code.length;
      
      const functionBody = code.substring(startIndex, endIndex);
      
      ast.body.push({
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name },
        body: {
          type: 'BlockStatement',
          body: [],
          loc: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
        },
        loc: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
      });
    }
    
    // Extract while loops
    const whilePattern = /while\s+(.+?):/g;
    while ((match = whilePattern.exec(code)) !== null) {
      const condition = match[1];
      const startIndex = match.index;
      
      // Find the loop body (simplified)
      let endIndex = code.indexOf('\n\n', startIndex);
      if (endIndex === -1) endIndex = code.length;
      
      const loopBody = code.substring(startIndex, endIndex);
      
      ast.body.push({
        type: 'WhileStatement',
        test: { type: 'Literal', value: condition, raw: condition },
        body: {
          type: 'BlockStatement',
          body: [],
          loc: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
        },
        loc: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
      });
    }
    
    return ast;
  }
  
  /**
   * Build calculation flow graph from AST
   * @private
   */
  _buildCalculationFlow(ast, language) {
    const nodes = [];
    const edges = [];
    
    // Map calculation nodes and dependencies
    let nodeId = 0;
    
    // Process AST to extract calculation nodes and edges
    estraverse.traverse(ast, {
      enter: (node) => {
        // Identify calculation nodes
        if (this._isCalculationNode(node, language)) {
          const id = `node_${nodeId++}`;
          const name = this._getNodeName(node, language);
          const type = this._getNodeType(node, language);
          
          nodes.push({
            id,
            name,
            type,
            code: escodegen.generate(node),
            loc: node.loc
          });
          
          // Store node ID in the AST node for edge creation
          node._calculationNodeId = id;
        }
      },
      leave: (node, parent) => {
        // Create edges between calculation nodes
        if (node._calculationNodeId && parent && parent._calculationNodeId) {
          edges.push({
            source: parent._calculationNodeId,
            target: node._calculationNodeId,
            type: 'flow'
          });
        }
      }
    });
    
    return { nodes, edges };
  }
  
  /**
   * Check if a node represents a calculation
   * @private
   */
  _isCalculationNode(node, language) {
    if (language === 'javascript') {
      // JavaScript calculation patterns
      return (
        node.type === 'AssignmentExpression' ||
        (node.type === 'ExpressionStatement' && 
         node.expression && 
         node.expression.type === 'AssignmentExpression') ||
        (node.type === 'VariableDeclaration' && 
         node.declarations.some(decl => decl.init && 
           (decl.init.type === 'BinaryExpression' || 
            decl.init.type === 'CallExpression')))
      );
    } else if (language === 'python') {
      // Python calculation patterns (simplified)
      return (
        node.type === 'Assign' ||
        node.type === 'AugAssign' ||
        node.type === 'Call'
      );
    }
    
    return false;
  }
  
  /**
   * Get a readable name for a calculation node
   * @private
   */
  _getNodeName(node, language) {
    if (language === 'javascript') {
      if (node.type === 'AssignmentExpression') {
        return escodegen.generate(node.left);
      } else if (node.type === 'ExpressionStatement' && 
                node.expression && 
                node.expression.type === 'AssignmentExpression') {
        return escodegen.generate(node.expression.left);
      } else if (node.type === 'VariableDeclaration') {
        return node.declarations.map(decl => decl.id.name).join(', ');
      }
    } else if (language === 'python') {
      // Simplified for demonstration
      if (node.type === 'Assign') {
        return node.targets ? node.targets[0].id : 'unknown';
      } else if (node.type === 'AugAssign') {
        return node.target ? node.target.id : 'unknown';
      } else if (node.type === 'Call') {
        return node.func ? node.func.id : 'function_call';
      }
    }
    
    return 'unknown_calculation';
  }
  
  /**
   * Get the type of a calculation node
   * @private
   */
  _getNodeType(node, language) {
    // Determine if this is a revenue, expense, tax, etc. calculation
    const name = this._getNodeName(node, language).toLowerCase();
    
    if (name.includes('revenue') || name.includes('income')) {
      return 'revenue_calculation';
    } else if (name.includes('expense') || name.includes('cost')) {
      return 'expense_calculation';
    } else if (name.includes('tax')) {
      return 'tax_calculation';
    } else if (name.includes('depreciation')) {
      return 'depreciation_calculation';
    } else if (name.includes('npv') || name.includes('present value')) {
      return 'npv_calculation';
    } else if (name.includes('irr')) {
      return 'irr_calculation';
    } else if (name.includes('payback')) {
      return 'payback_calculation';
    } else if (name.includes('roi') || name.includes('return')) {
      return 'roi_calculation';
    }
    
    return 'general_calculation';
  }
}