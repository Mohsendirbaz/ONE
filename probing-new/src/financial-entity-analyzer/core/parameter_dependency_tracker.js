/**
 * Tracks dependencies between financial parameters
 * Maps how inputs flow through calculations to outputs
 */
export class ParameterDependencyTracker {
  constructor() {
    this.parameters = new Map();
    this.dependencies = new Map();
    this.calculationImpact = new Map();
    this.sensitivity = new Map();
  }

  /**
   * Analyze parameter dependencies in financial code
   * @param {string} code - Source code to analyze
   * @param {string} language - Programming language
   * @return {Object} Dependency analysis results
   */
  analyzeParameterDependencies(code, language) {
    // Parse the code and build AST
    const ast = this._parseCode(code, language);

    // Extract parameters (variables used in financial calculations)
    this._extractParameters(ast);

    // Map dependencies between parameters
    this._mapDependencies(ast);

    // Analyze calculation impact for each parameter
    this._analyzeCalculationImpact();

    return {
      parameters: Array.from(this.parameters.entries()),
      dependencies: this._formatDependencies(),
      calculationImpact: Array.from(this.calculationImpact.entries()),
      sensitivityCandidates: this._identifySensitivityCandidates()
    };
  }

  /**
   * Extract financial parameters from code
   * @private
   */
  _extractParameters(ast) {
    // Implementation to extract financial parameters
    // Focus on numeric parameters that affect financial outcomes

    // Financial parameter naming patterns
    const financialPatterns = [
      /rate/i, /price/i, /cost/i, /revenue/i, /expense/i,
      /tax/i, /depreciation/i, /npv/i, /irr/i, /units/i,
      /amount/i, /percentage/i, /years/i, /lifetime/i
    ];

    // Traverse AST to find parameters matching these patterns
    this._traverseAst(ast, (node) => {
      // Check if node is a variable declaration
      if (this._isVariableDeclaration(node)) {
        const variableName = this._getVariableName(node);
        const initialValue = this._getInitialValue(node);

        // Check if it matches financial parameter patterns
        const isFinancial = financialPatterns.some(pattern => 
          pattern.test(variableName)
        );

        if (isFinancial) {
          this.parameters.set(variableName, {
            name: variableName,
            type: this._inferParameterType(variableName, initialValue),
            initialValue: initialValue,
            location: node.loc,
            usage: []
          });
        }
      }
    });
  }

  /**
   * Infer parameter type based on name and value
   * @private
   */
  _inferParameterType(name, value) {
    // Logic to categorize financial parameters
    if (/rate|percentage/i.test(name)) return 'rate';
    if (/price|cost/i.test(name)) return 'monetary';
    if (/units|quantity/i.test(name)) return 'quantity';
    if (/years|lifetime|period/i.test(name)) return 'time';

    // Infer from value if name doesn't give clear indication
    if (typeof value === 'number') {
      if (value < 1 && value > 0) return 'rate'; // Likely a rate
      if (value >= 1000) return 'monetary'; // Likely a monetary value
      if (Number.isInteger(value) && value < 100) return 'quantity'; // Likely a quantity
    }

    return 'unknown';
  }

  /**
   * Map dependencies between parameters
   * @private
   */
  _mapDependencies(ast) {
    // For each parameter, find where it's used in calculations
    for (const [paramName, paramInfo] of this.parameters.entries()) {
      this.dependencies.set(paramName, new Set());

      // Find all uses of this parameter in the AST
      this._traverseAst(ast, (node) => {
        if (this._isVariableReference(node, paramName)) {
          // Find what calculation this reference is part of
          const calculation = this._findParentCalculation(node);
          if (calculation) {
            // Find other parameters used in this calculation
            const otherParams = this._findOtherParameters(calculation, paramName);

            // Add dependencies
            for (const otherParam of otherParams) {
              if (this.parameters.has(otherParam)) {
                this.dependencies.get(paramName).add(otherParam);

                // Add usage info to the parameter
                const paramInfo = this.parameters.get(paramName);
                paramInfo.usage.push({
                  calculation: this._expressionToString(calculation),
                  location: calculation.loc
                });
                this.parameters.set(paramName, paramInfo);
              }
            }
          }
        }
      });
    }
  }

  /**
   * Analyze how parameters impact financial calculations
   * @private
   */
  _analyzeCalculationImpact() {
    // For each parameter, calculate its impact score on key financial metrics
    for (const [paramName, paramInfo] of this.parameters.entries()) {
      // Calculate direct impact (parameters directly dependent on this one)
      const directImpact = this.dependencies.get(paramName).size;

      // Calculate indirect impact (multi-step dependencies)
      const indirectImpact = this._calculateIndirectImpact(paramName);

      // Calculate financial metric impact
      const metricImpact = this._calculateMetricImpact(paramName);

      // Store calculation impact info
      this.calculationImpact.set(paramName, {
        directImpact,
        indirectImpact,
        metricImpact,
        totalImpactScore: directImpact + indirectImpact + metricImpact
      });
    }
  }

  /**
   * Calculate indirect impact of a parameter
   * @private
   */
  _calculateIndirectImpact(paramName, visited = new Set()) {
    // Prevent infinite recursion
    if (visited.has(paramName)) return 0;
    visited.add(paramName);

    // Get direct dependencies
    const directDeps = this.dependencies.get(paramName) || new Set();

    // Sum up impact from dependent parameters
    let indirectImpact = 0;
    for (const dep of directDeps) {
      // A parameter 2 steps away has half the impact of a direct dependency
      indirectImpact += 0.5 * (1 + this._calculateIndirectImpact(dep, new Set(visited)));
    }

    return indirectImpact;
  }

  /**
   * Calculate impact of parameter on key financial metrics
   * @private
   */
  _calculateMetricImpact(paramName) {
    // Identify if this parameter affects key financial metrics
    // like NPV, IRR, payback period, etc.

    const keyMetrics = [
      'npv', 'irr', 'payback', 'roi', 'cash_flow', 'revenue', 'profit'
    ];

    // Check for direct dependencies from key metrics to this parameter
    let metricImpact = 0;
    for (const [otherParam, deps] of this.dependencies.entries()) {
      if (keyMetrics.some(metric => otherParam.toLowerCase().includes(metric)) && 
          deps.has(paramName)) {
        metricImpact += 2; // Higher weight for key financial metrics
      }
    }

    return metricImpact;
  }

  /**
   * Identify parameters that are good candidates for sensitivity analysis
   * @private
   */
  _identifySensitivityCandidates() {
    // Parameters with high impact scores are good sensitivity candidates
    const candidates = [];

    for (const [paramName, impact] of this.calculationImpact.entries()) {
      if (impact.totalImpactScore > 3) { // Threshold for sensitivity candidates
        candidates.push({
          name: paramName,
          impactScore: impact.totalImpactScore,
          parameterInfo: this.parameters.get(paramName)
        });
      }
    }

    // Sort by impact score (descending)
    return candidates.sort((a, b) => b.impactScore - a.impactScore);
  }

  /**
   * Format dependencies for output
   * @private
   */
  _formatDependencies() {
    const formattedDeps = [];

    for (const [paramName, deps] of this.dependencies.entries()) {
      formattedDeps.push({
        parameter: paramName,
        dependencies: Array.from(deps)
      });
    }

    return formattedDeps;
  }

  /**
   * Helper method to traverse AST
   * @private
   */
  _traverseAst(ast, callback) {
    const traverse = (node) => {
      callback(node);

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(child => {
              if (child && typeof child === 'object') {
                traverse(child);
              }
            });
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
  }

  /**
   * Check if node is a variable declaration
   * @private
   */
  _isVariableDeclaration(node) {
    return (
      node.type === 'VariableDeclaration' ||
      node.type === 'VariableDeclarator' ||
      (node.type === 'AssignmentExpression' && node.operator === '=')
    );
  }

  /**
   * Get variable name from declaration node
   * @private
   */
  _getVariableName(node) {
    if (node.type === 'VariableDeclaration' && node.declarations.length > 0) {
      return node.declarations[0].id.name;
    } else if (node.type === 'VariableDeclarator') {
      return node.id.name;
    } else if (node.type === 'AssignmentExpression') {
      if (node.left.type === 'Identifier') {
        return node.left.name;
      } else {
        // Handle more complex left-hand sides
        return 'complex_assignment';
      }
    }
    return 'unknown';
  }

  /**
   * Get initial value from declaration node
   * @private
   */
  _getInitialValue(node) {
    if (node.type === 'VariableDeclaration' && node.declarations.length > 0 && node.declarations[0].init) {
      return this._evaluateConstant(node.declarations[0].init);
    } else if (node.type === 'VariableDeclarator' && node.init) {
      return this._evaluateConstant(node.init);
    } else if (node.type === 'AssignmentExpression') {
      return this._evaluateConstant(node.right);
    }
    return undefined;
  }

  /**
   * Evaluate constant expressions
   * @private
   */
  _evaluateConstant(node) {
    if (!node) return undefined;

    if (node.type === 'Literal') {
      return node.value;
    } else if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'Literal') {
      return -node.argument.value;
    } else if (node.type === 'BinaryExpression' && node.left.type === 'Literal' && node.right.type === 'Literal') {
      // Simple constant folding for basic binary operations
      const left = node.left.value;
      const right = node.right.value;

      switch (node.operator) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        default: return undefined;
      }
    }

    return undefined;
  }

  /**
   * Check if node is a reference to a specific variable
   * @private
   */
  _isVariableReference(node, variableName) {
    return (
      node.type === 'Identifier' && 
      node.name === variableName
    );
  }

  /**
   * Find the parent calculation containing a node
   * @private
   */
  _findParentCalculation(node, ancestors = []) {
    // Find the closest ancestor that represents a calculation
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const ancestor = ancestors[i];
      if (this._isCalculation(ancestor)) {
        return ancestor;
      }
    }

    return null;
  }

  /**
   * Check if a node represents a calculation
   * @private
   */
  _isCalculation(node) {
    return (
      node && (
        node.type === 'AssignmentExpression' ||
        node.type === 'BinaryExpression' ||
        (node.type === 'ExpressionStatement' && 
         node.expression && 
         (node.expression.type === 'AssignmentExpression' || 
          node.expression.type === 'BinaryExpression'))
      )
    );
  }

  /**
   * Find other parameters used in a calculation
   * @private
   */
  _findOtherParameters(calculation, currentParam) {
    const params = new Set();

    this._traverseAst(calculation, (node) => {
      if (node.type === 'Identifier' && 
          node.name !== currentParam && 
          this.parameters.has(node.name)) {
        params.add(node.name);
      }
    });

    return Array.from(params);
  }

  /**
   * Convert expression to string
   * @private
   */
  _expressionToString(node) {
    // Simple implementation - in a real system, use a proper code generator
    if (!node) return '';

    if (node.type === 'AssignmentExpression') {
      return `${this._expressionToString(node.left)} = ${this._expressionToString(node.right)}`;
    } else if (node.type === 'BinaryExpression') {
      return `${this._expressionToString(node.left)} ${node.operator} ${this._expressionToString(node.right)}`;
    } else if (node.type === 'Identifier') {
      return node.name;
    } else if (node.type === 'Literal') {
      return String(node.value);
    } else if (node.type === 'ExpressionStatement') {
      return this._expressionToString(node.expression);
    }

    return 'complex_expression';
  }

  /**
   * Parse code into an abstract syntax tree
   * @private
   */
  _parseCode(code, language) {
    // Use the appropriate parser based on language
    if (language === 'javascript') {
      // Use esprima for JavaScript
      const esprima = require('esprima');
      return esprima.parseScript(code, { loc: true });
    } else if (language === 'python') {
      // For Python, we'd need a Python parser
      // This is a simplified placeholder
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

    // Extract variable assignments
    const assignmentPattern = /(\w+)\s*=\s*(.+)/g;
    let match;
    while ((match = assignmentPattern.exec(code)) !== null) {
      const name = match[1];
      const value = match[2];

      ast.body.push({
        type: 'AssignmentExpression',
        operator: '=',
        left: { type: 'Identifier', name },
        right: this._parseSimplifiedExpression(value),
        loc: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
      });
    }

    return ast;
  }

  /**
   * Parse a simplified expression
   * @private
   */
  _parseSimplifiedExpression(expr) {
    // Try to parse as a number
    const num = parseFloat(expr);
    if (!isNaN(num)) {
      return { type: 'Literal', value: num };
    }

    // Check for simple binary operations
    const binaryPattern = /(.+?)(\+|-|\*|\/|\*\*)(.+)/;
    const binaryMatch = expr.match(binaryPattern);
    if (binaryMatch) {
      return {
        type: 'BinaryExpression',
        operator: binaryMatch[2],
        left: this._parseSimplifiedExpression(binaryMatch[1].trim()),
        right: this._parseSimplifiedExpression(binaryMatch[3].trim())
      };
    }

    // Default to identifier
    return { type: 'Identifier', name: expr.trim() };
  }
}
