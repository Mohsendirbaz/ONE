/**
 * Analyzes financial constants in models
 * Identifies key financial parameters and their usage
 */
export class FinancialConstantsAnalyzer {
  constructor() {
    this.constants = [];
    this.categories = {
      rates: [],
      taxes: [],
      timeframes: [],
      thresholds: [],
      other: []
    };
    this.usagePatterns = new Map();
    this.sourceInfo = new Map();
  }

  /**
   * Analyze financial constants in code
   * @param {string} code - Source code to analyze
   * @param {string} language - Programming language
   * @return {Object} Analysis results
   */
  analyzeFinancialConstants(code, language) {
    // Parse the code
    const ast = this._parseCode(code, language);

    // Identify financial constants
    this._identifyFinancialConstants(ast);

    // Categorize constants
    this._categorizeConstants();

    // Analyze usage patterns
    this._analyzeUsagePatterns(ast);

    // Identify source information
    this._identifySourceInfo(ast);

    return {
      constants: this.constants,
      categories: this.categories,
      usagePatterns: Object.fromEntries(this.usagePatterns),
      sourceInfo: Object.fromEntries(this.sourceInfo)
    };
  }

  /**
   * Identify financial constants in the code
   * @private
   */
  _identifyFinancialConstants(ast) {
    // Look for constant declarations and assignments
    this._traverseAst(ast, (node) => {
      if (this._isConstantDeclaration(node)) {
        const constantInfo = this._extractConstantInfo(node);
        if (constantInfo && this._isFinancialConstant(constantInfo)) {
          this.constants.push(constantInfo);
        }
      }
    });
  }

  /**
   * Check if a node is a constant declaration
   * @private
   */
  _isConstantDeclaration(node) {
    // Check for variable declarations with const keyword or ALL_CAPS naming
    if (node.type === 'VariableDeclaration') {
      return node.kind === 'const';
    } else if (node.type === 'VariableDeclarator') {
      return node.id && node.id.name && this._isConstantName(node.id.name);
    } else if (node.type === 'AssignmentExpression') {
      return node.left && node.left.type === 'Identifier' && 
             this._isConstantName(node.left.name);
    }

    return false;
  }

  /**
   * Check if a name follows constant naming conventions
   * @private
   */
  _isConstantName(name) {
    // Check for ALL_CAPS or PascalCase naming conventions
    return /^[A-Z][A-Z0-9_]*$/.test(name) || 
           /^[A-Z][a-zA-Z0-9]*$/.test(name);
  }

  /**
   * Extract information about a constant
   * @private
   */
  _extractConstantInfo(node) {
    const name = this._getConstantName(node);
    if (!name) return null;

    const value = this._getConstantValue(node);
    const type = this._inferConstantType(name, value);

    return {
      name,
      value,
      type,
      location: node.loc
    };
  }

  /**
   * Get the name of a constant
   * @private
   */
  _getConstantName(node) {
    if (node.type === 'VariableDeclaration' && node.declarations.length > 0) {
      return node.declarations[0].id.name;
    } else if (node.type === 'VariableDeclarator') {
      return node.id.name;
    } else if (node.type === 'AssignmentExpression') {
      if (node.left.type === 'Identifier') {
        return node.left.name;
      }
    }

    return null;
  }

  /**
   * Get the value of a constant
   * @private
   */
  _getConstantValue(node) {
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
   * Evaluate a constant expression
   * @private
   */
  _evaluateConstant(node) {
    if (!node) return undefined;

    if (node.type === 'Literal') {
      return node.value;
    } else if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'Literal') {
      return -node.argument.value;
    } else if (node.type === 'BinaryExpression' && 
               node.left.type === 'Literal' && 
               node.right.type === 'Literal') {
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
   * Infer the type of a constant based on name and value
   * @private
   */
  _inferConstantType(name, value) {
    // Check name for type hints
    const nameLower = name.toLowerCase();

    if (/rate|percentage|factor|ratio|multiplier/i.test(nameLower)) {
      return 'rate';
    } else if (/tax|levy|duty|fee/i.test(nameLower)) {
      return 'tax';
    } else if (/year|month|day|period|time|duration|lifetime/i.test(nameLower)) {
      return 'timeframe';
    } else if (/threshold|limit|min|max|cap|floor/i.test(nameLower)) {
      return 'threshold';
    } else if (/price|cost|amount|value|revenue|expense/i.test(nameLower)) {
      return 'monetary';
    }

    // Check value for type hints
    if (typeof value === 'number') {
      if (value >= 0 && value <= 1) {
        return 'rate'; // Likely a rate or percentage
      } else if (Number.isInteger(value) && (value >= 1900 && value <= 2100)) {
        return 'year'; // Likely a year
      } else if (Number.isInteger(value) && (value >= 1 && value <= 100)) {
        return 'timeframe'; // Likely a period in years
      }
    }

    return 'unknown';
  }

  /**
   * Check if a constant is a financial constant
   * @private
   */
  _isFinancialConstant(constantInfo) {
    // Check if the constant is related to finance
    const { name, value, type } = constantInfo;
    const nameLower = name.toLowerCase();

    // Financial keyword patterns
    const financialPatterns = [
      /rate|tax|discount|interest|depreciation|amortization/i,
      /npv|irr|roi|payback|cash\s*flow/i,
      /revenue|expense|cost|price|profit|margin/i,
      /year|month|period|lifetime|duration/i,
      /threshold|limit|min|max|cap|floor/i
    ];

    // Check if name matches financial patterns
    if (financialPatterns.some(pattern => pattern.test(nameLower))) {
      return true;
    }

    // Check if type is a known financial type
    if (['rate', 'tax', 'timeframe', 'threshold', 'monetary'].includes(type)) {
      return true;
    }

    // Check if value is in typical financial ranges
    if (typeof value === 'number') {
      // Typical financial rates are between 0 and 1
      if (value >= 0 && value <= 1) {
        return true;
      }

      // Years are typically between 1 and 100 for financial models
      if (Number.isInteger(value) && value >= 1 && value <= 100) {
        return true;
      }
    }

    return false;
  }

  /**
   * Categorize constants into financial categories
   * @private
   */
  _categorizeConstants() {
    // Reset categories
    this.categories = {
      rates: [],
      taxes: [],
      timeframes: [],
      thresholds: [],
      other: []
    };

    // Categorize each constant
    for (const constant of this.constants) {
      const { type } = constant;

      if (type === 'rate') {
        this.categories.rates.push(constant);
      } else if (type === 'tax') {
        this.categories.taxes.push(constant);
      } else if (type === 'timeframe') {
        this.categories.timeframes.push(constant);
      } else if (type === 'threshold') {
        this.categories.thresholds.push(constant);
      } else {
        this.categories.other.push(constant);
      }
    }
  }

  /**
   * Analyze how constants are used in the code
   * @private
   */
  _analyzeUsagePatterns(ast) {
    // For each constant, find its usage patterns
    for (const constant of this.constants) {
      const usages = this._findConstantUsages(ast, constant.name);
      this.usagePatterns.set(constant.name, usages);
    }
  }

  /**
   * Find usages of a constant in the code
   * @private
   */
  _findConstantUsages(ast, constantName) {
    const usages = [];

    // Find references to the constant
    this._traverseAst(ast, (node) => {
      if (this._isConstantReference(node, constantName)) {
        // Find the context of this reference
        const context = this._findUsageContext(node);
        if (context) {
          usages.push({
            type: context.type,
            context: this._nodeToString(context.node),
            location: context.node.loc
          });
        }
      }
    });

    return usages;
  }

  /**
   * Check if a node is a reference to a specific constant
   * @private
   */
  _isConstantReference(node, constantName) {
    return (
      node.type === 'Identifier' && 
      node.name === constantName
    );
  }

  /**
   * Find the context in which a constant is used
   * @private
   */
  _findUsageContext(node) {
    // Look for parent expressions or statements
    let current = node;
    let parent = node._parent;

    while (parent) {
      if (this._isCalculation(parent)) {
        return { type: 'calculation', node: parent };
      } else if (this._isCondition(parent)) {
        return { type: 'condition', node: parent };
      } else if (this._isFunctionCall(parent) && parent.callee !== node) {
        return { type: 'function_call', node: parent };
      }

      current = parent;
      parent = current._parent;
    }

    return null;
  }

  /**
   * Check if a node is a calculation
   * @private
   */
  _isCalculation(node) {
    return (
      node.type === 'BinaryExpression' || 
      node.type === 'AssignmentExpression'
    );
  }

  /**
   * Check if a node is a condition
   * @private
   */
  _isCondition(node) {
    return (
      node.type === 'IfStatement' || 
      node.type === 'ConditionalExpression' ||
      (node.type === 'BinaryExpression' && 
       ['==', '!=', '<', '>', '<=', '>='].includes(node.operator))
    );
  }

  /**
   * Check if a node is a function call
   * @private
   */
  _isFunctionCall(node) {
    return node.type === 'CallExpression';
  }

  /**
   * Identify source information for constants
   * @private
   */
  _identifySourceInfo(ast) {
    // Look for comments or documentation about constants
    for (const constant of this.constants) {
      const sourceInfo = this._findConstantSourceInfo(ast, constant);
      if (sourceInfo) {
        this.sourceInfo.set(constant.name, sourceInfo);
      }
    }
  }

  /**
   * Find source information for a constant
   * @private
   */
  _findConstantSourceInfo(ast, constant) {
    // Look for comments near the constant declaration
    const comments = this._findNearbyComments(ast, constant.location);

    // Extract source information from comments
    const sourceInfo = {
      description: this._extractDescription(comments),
      source: this._extractSource(comments),
      units: this._extractUnits(comments, constant),
      constraints: this._extractConstraints(comments, constant)
    };

    return sourceInfo;
  }

  /**
   * Find comments near a location in the code
   * @private
   */
  _findNearbyComments(ast, location) {
    // This is a simplified implementation
    // In a real system, we would use the AST's comment tokens

    // For now, return an empty array
    return [];
  }

  /**
   * Extract description from comments
   * @private
   */
  _extractDescription(comments) {
    // Look for descriptive comments
    for (const comment of comments) {
      // Remove comment markers and trim
      const text = comment.value.replace(/^[/*]+/, '').trim();

      // If it's not a directive or annotation, it's likely a description
      if (!text.startsWith('@') && text.length > 3) {
        return text;
      }
    }

    return null;
  }

  /**
   * Extract source information from comments
   * @private
   */
  _extractSource(comments) {
    // Look for source annotations like @source or references
    for (const comment of comments) {
      const text = comment.value;

      // Check for source annotations
      const sourceMatch = text.match(/@source\s+(.+)/i);
      if (sourceMatch) {
        return sourceMatch[1].trim();
      }

      // Check for reference annotations
      const refMatch = text.match(/@reference\s+(.+)/i);
      if (refMatch) {
        return refMatch[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract units from comments or infer from constant
   * @private
   */
  _extractUnits(comments, constant) {
    // Look for unit annotations
    for (const comment of comments) {
      const text = comment.value;

      // Check for unit annotations
      const unitMatch = text.match(/@unit\s+(.+)/i) || 
                        text.match(/in\s+([a-z]+)$/i);
      if (unitMatch) {
        return unitMatch[1].trim();
      }
    }

    // Infer units from constant name and type
    return this._inferUnits(constant);
  }

  /**
   * Infer units from constant properties
   * @private
   */
  _inferUnits(constant) {
    const { name, type, value } = constant;
    const nameLower = name.toLowerCase();

    if (type === 'rate') {
      if (nameLower.includes('percent')) return '%';
      return 'ratio';
    } else if (type === 'tax') {
      if (nameLower.includes('percent')) return '%';
      return 'ratio';
    } else if (type === 'timeframe') {
      if (nameLower.includes('year')) return 'years';
      if (nameLower.includes('month')) return 'months';
      if (nameLower.includes('day')) return 'days';
      return 'periods';
    } else if (type === 'monetary') {
      return '$';
    }

    return null;
  }

  /**
   * Extract constraints from comments or infer from constant
   * @private
   */
  _extractConstraints(comments, constant) {
    // Look for constraint annotations
    for (const comment of comments) {
      const text = comment.value;

      // Check for constraint annotations
      const minMatch = text.match(/@min\s+(.+)/i);
      const maxMatch = text.match(/@max\s+(.+)/i);
      const rangeMatch = text.match(/@range\s+(.+)/i);

      if (minMatch || maxMatch || rangeMatch) {
        const constraints = {};

        if (minMatch) constraints.min = parseFloat(minMatch[1]);
        if (maxMatch) constraints.max = parseFloat(maxMatch[1]);

        if (rangeMatch) {
          const range = rangeMatch[1].split('-').map(v => parseFloat(v.trim()));
          if (range.length === 2) {
            constraints.min = range[0];
            constraints.max = range[1];
          }
        }

        return constraints;
      }
    }

    // Infer constraints from constant type
    return this._inferConstraints(constant);
  }

  /**
   * Infer constraints from constant properties
   * @private
   */
  _inferConstraints(constant) {
    const { type, value } = constant;

    if (type === 'rate') {
      return { min: 0, max: 1 };
    } else if (type === 'tax') {
      return { min: 0, max: 1 };
    } else if (type === 'timeframe' && typeof value === 'number') {
      return { min: 0 };
    }

    return null;
  }

  /**
   * Parse code into an abstract syntax tree
   * @private
   */
  _parseCode(code, language) {
    if (language === 'javascript') {
      const esprima = require('esprima');
      return esprima.parseScript(code, { loc: true, comment: true });
    } else if (language === 'python') {
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

    // Extract constant assignments (ALL_CAPS variables)
    const constantPattern = /^([A-Z][A-Z0-9_]*)\s*=\s*(.+)/;

    lines.forEach((line, index) => {
      const match = line.match(constantPattern);
      if (match) {
        const name = match[1];
        const valueStr = match[2];

        ast.body.push({
          type: 'AssignmentExpression',
          operator: '=',
          left: { type: 'Identifier', name },
          right: this._parseSimplifiedValue(valueStr),
          loc: { start: { line: index + 1, column: 0 }, end: { line: index + 1, column: line.length } }
        });
      }
    });

    return ast;
  }

  /**
   * Parse a simplified value expression
   * @private
   */
  _parseSimplifiedValue(valueStr) {
    // Try to parse as a number
    if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
      return { type: 'Literal', value: parseFloat(valueStr) };
    }

    // Try to parse as a string
    if (/^["'].*["']$/.test(valueStr)) {
      return { type: 'Literal', value: valueStr.slice(1, -1) };
    }

    // Default to identifier
    return { type: 'Identifier', name: valueStr.trim() };
  }

  /**
   * Helper method to traverse AST
   * @private
   */
  _traverseAst(ast, callback) {
    const traverse = (node, parent) => {
      // Add parent reference for easier traversal
      node._parent = parent;

      callback(node);

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(child => {
              if (child && typeof child === 'object') {
                traverse(child, node);
              }
            });
          } else {
            traverse(node[key], node);
          }
        }
      }
    };

    traverse(ast, null);
  }

  /**
   * Convert a node to a string representation
   * @private
   */
  _nodeToString(node) {
    if (!node) return '';

    // In a real implementation, this would use a proper code generator
    // For this example, we'll use a simplified approach

    if (node.type === 'Identifier') {
      return node.name;
    } else if (node.type === 'Literal') {
      return String(node.value);
    } else if (node.type === 'BinaryExpression') {
      return `${this._nodeToString(node.left)} ${node.operator} ${this._nodeToString(node.right)}`;
    } else if (node.type === 'AssignmentExpression') {
      return `${this._nodeToString(node.left)} ${node.operator} ${this._nodeToString(node.right)}`;
    } else if (node.type === 'CallExpression') {
      const args = node.arguments.map(arg => this._nodeToString(arg)).join(', ');
      return `${this._nodeToString(node.callee)}(${args})`;
    } else if (node.type === 'MemberExpression') {
      return `${this._nodeToString(node.object)}.${this._nodeToString(node.property)}`;
    } else if (node.type === 'ExpressionStatement') {
      return this._nodeToString(node.expression);
    }

    // For other node types, return a placeholder
    return 'complex_expression';
  }
}
