/**
 * Analyzes sensitivity analysis patterns in financial models
 * Identifies how models handle parameter variations
 */
export class SensitivityModelAnalyzer {
  constructor() {
    this.sensitivityParameters = [];
    this.variationMethods = {};
    this.sensitivityWorkflows = [];
    this.parameterRanges = {};
  }

  /**
   * Analyze sensitivity modeling patterns in code
   * @param {string} code - Source code to analyze
   * @param {string} language - Programming language
   * @return {Object} Sensitivity analysis results
   */
  analyzeSensitivityModels(code, language) {
    // Parse the code
    const ast = this._parseCode(code, language);

    // Identify sensitivity parameters (parameters varied in analysis)
    this._identifySensitivityParameters(ast);

    // Identify methods used to vary parameters
    this._identifyVariationMethods(ast);

    // Map sensitivity analysis workflows
    this._mapSensitivityWorkflows(ast);

    // Extract parameter variation ranges
    this._extractParameterRanges(ast);

    return {
      sensitivityParameters: this.sensitivityParameters,
      variationMethods: this.variationMethods,
      sensitivityWorkflows: this.sensitivityWorkflows,
      parameterRanges: this.parameterRanges
    };
  }

  /**
   * Identify parameters used in sensitivity analysis
   * @private
   */
  _identifySensitivityParameters(ast) {
    // Look for patterns indicating sensitivity parameters
    // Such as parameters in "SenParameters" dictionaries or objects

    const sensitivityPatterns = [
      // Pattern objects contain regex and context information
      {
        namePattern: /param_id|sensitivity|sen/i,
        contextPattern: /sen|sensitivity|variation/i
      }
    ];

    // Search for these patterns in the AST
    this._traverseAst(ast, (node) => {
      // Check for parameter handling that matches sensitivity patterns
      if (this._isSensitivityParameter(node, sensitivityPatterns)) {
        const paramInfo = this._extractParameterInfo(node);
        if (paramInfo) {
          this.sensitivityParameters.push(paramInfo);
        }
      }
    });
  }

  /**
   * Check if a node represents a sensitivity parameter
   * @private
   */
  _isSensitivityParameter(node, patterns) {
    // Check if the node is a variable declaration or assignment
    if (!this._isVariableDeclaration(node) && !this._isAssignment(node)) {
      return false;
    }

    // Get the variable name
    const varName = this._getVariableName(node);
    if (!varName) return false;

    // Check if the name matches sensitivity patterns
    for (const pattern of patterns) {
      if (pattern.namePattern.test(varName)) {
        return true;
      }
    }

    // Check if the node is part of a sensitivity context
    const context = this._getNodeContext(node);
    if (context) {
      for (const pattern of patterns) {
        if (pattern.contextPattern.test(context)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Extract information about a sensitivity parameter
   * @private
   */
  _extractParameterInfo(node) {
    const name = this._getVariableName(node);
    if (!name) return null;

    // Try to extract additional information about the parameter
    const value = this._getInitialValue(node);
    const type = this._inferParameterType(name, value);
    const usage = this._findParameterUsage(node);

    return {
      name,
      type,
      value,
      usage,
      location: node.loc
    };
  }

  /**
   * Infer the type of a sensitivity parameter
   * @private
   */
  _inferParameterType(name, value) {
    // Try to infer the parameter type from its name and value
    if (/rate|percentage|factor/i.test(name)) {
      return 'rate';
    } else if (/price|cost|revenue|expense/i.test(name)) {
      return 'monetary';
    } else if (/quantity|units|volume/i.test(name)) {
      return 'quantity';
    } else if (/years|periods|time/i.test(name)) {
      return 'time';
    }

    // If name doesn't give a clear indication, try to infer from value
    if (typeof value === 'number') {
      if (value < 1 && value > 0) return 'rate';
      if (value >= 1000) return 'monetary';
      if (Number.isInteger(value) && value < 100) return 'quantity';
    }

    return 'unknown';
  }

  /**
   * Find how a parameter is used in sensitivity analysis
   * @private
   */
  _findParameterUsage(node) {
    const usage = [];
    const varName = this._getVariableName(node);
    if (!varName) return usage;

    // Find references to this parameter in the AST
    this._traverseAst(this._getRoot(node), (otherNode) => {
      if (this._isVariableReference(otherNode, varName)) {
        // Find the parent calculation or function call
        const context = this._findParentContext(otherNode);
        if (context) {
          usage.push({
            type: this._getContextType(context),
            context: this._nodeToString(context),
            location: context.loc
          });
        }
      }
    });

    return usage;
  }

  /**
   * Identify methods used to vary parameters
   * @private
   */
  _identifyVariationMethods(ast) {
    // Look for different methods of parameter variation
    // Common methods: percentage change, absolute change, monte carlo

    const variationMethodPatterns = [
      { name: 'percentage', pattern: /percentage|percent|pct/i },
      { name: 'absolute', pattern: /absolute|direct|value/i },
      { name: 'montecarlo', pattern: /monte\s*carlo|random|stochastic/i }
    ];

    // Find instances of these methods in the code
    this._traverseAst(ast, (node) => {
      for (const method of variationMethodPatterns) {
        if (this._matchesMethodPattern(node, method.pattern)) {
          const methodInfo = this._extractMethodInfo(node, method.name);

          if (!this.variationMethods[method.name]) {
            this.variationMethods[method.name] = [];
          }

          this.variationMethods[method.name].push(methodInfo);
        }
      }
    });
  }

  /**
   * Check if a node matches a variation method pattern
   * @private
   */
  _matchesMethodPattern(node, pattern) {
    // Check if the node contains text matching the pattern
    const nodeText = this._nodeToString(node);
    return pattern.test(nodeText);
  }

  /**
   * Extract information about a variation method
   * @private
   */
  _extractMethodInfo(node, methodName) {
    // Extract information about how the variation method is used
    return {
      name: methodName,
      implementation: this._nodeToString(node),
      location: node.loc,
      parameters: this._extractMethodParameters(node)
    };
  }

  /**
   * Extract parameters used in a variation method
   * @private
   */
  _extractMethodParameters(node) {
    const parameters = [];

    // Look for variable references in the node
    this._traverseAst(node, (childNode) => {
      if (childNode.type === 'Identifier') {
        parameters.push(childNode.name);
      }
    });

    return [...new Set(parameters)]; // Remove duplicates
  }

  /**
   * Map sensitivity analysis workflows
   * @private
   */
  _mapSensitivityWorkflows(ast) {
    // Identify sequences of operations in sensitivity analysis
    // From parameter variation to result collection

    // Look for command-line argument handling for sensitivity parameters
    this._findCommandLineParameterHandling(ast);

    // Look for HTTP/API calls related to sensitivity analysis
    this._findSensitivityApiCalls(ast);

    // Look for file operations related to sensitivity results
    this._findSensitivityFileOperations(ast);
  }

  /**
   * Find command-line parameter handling for sensitivity analysis
   * @private
   */
  _findCommandLineParameterHandling(ast) {
    // Look for patterns like:
    // if arg == "--param_id" and i + 1 < len(sys.argv):
    //     param_id = sys.argv[i + 1]

    this._traverseAst(ast, (node) => {
      // Look for references to command-line arguments
      if (this._isCommandLineArgReference(node)) {
        const workflow = {
          type: 'command_line',
          parameters: this._extractCommandLineParameters(node),
          implementation: this._nodeToString(node),
          location: node.loc
        };

        this.sensitivityWorkflows.push(workflow);
      }
    });
  }

  /**
   * Check if a node references command-line arguments
   * @private
   */
  _isCommandLineArgReference(node) {
    const nodeText = this._nodeToString(node);
    return (
      nodeText.includes('sys.argv') ||
      nodeText.includes('process.argv') ||
      nodeText.includes('args') ||
      nodeText.includes('argv')
    );
  }

  /**
   * Extract parameters from command-line argument handling
   * @private
   */
  _extractCommandLineParameters(node) {
    const parameters = [];

    // Look for assignments from command-line arguments
    this._traverseAst(node, (childNode) => {
      if (this._isAssignment(childNode)) {
        const target = this._getVariableName(childNode);
        if (target) {
          parameters.push(target);
        }
      }
    });

    return parameters;
  }

  /**
   * Find API calls related to sensitivity analysis
   * @private
   */
  _findSensitivityApiCalls(ast) {
    // Look for API calls to sensitivity services
    this._traverseAst(ast, (node) => {
      if (this._isApiCall(node)) {
        const apiText = this._nodeToString(node);
        
        // Check if this API call is related to sensitivity analysis
        if (apiText.includes('sensitivity') || 
            apiText.includes('parameter') || 
            apiText.includes('variation')) {
          
          const workflow = {
            type: 'api_call',
            endpoint: this._extractApiEndpoint(node),
            parameters: this._extractApiParameters(node),
            implementation: apiText,
            location: node.loc
          };
          
          this.sensitivityWorkflows.push(workflow);
        }
      }
    });
  }

  /**
   * Check if a node represents an API call
   * @private
   */
  _isApiCall(node) {
    const nodeText = this._nodeToString(node);
    return (
      nodeText.includes('fetch(') ||
      nodeText.includes('axios.') ||
      nodeText.includes('http.') ||
      nodeText.includes('request(') ||
      nodeText.includes('requests.')
    );
  }

  /**
   * Extract the endpoint from an API call
   * @private
   */
  _extractApiEndpoint(node) {
    const nodeText = this._nodeToString(node);
    
    // Look for URL patterns
    const urlPattern = /(["'])(https?:\/\/[^"']+|\/[^"']+)\1/;
    const match = nodeText.match(urlPattern);
    
    return match ? match[2] : 'unknown_endpoint';
  }

  /**
   * Extract parameters from an API call
   * @private
   */
  _extractApiParameters(node) {
    const parameters = [];
    
    // Look for object literals in the API call
    this._traverseAst(node, (childNode) => {
      if (childNode.type === 'ObjectExpression') {
        // Extract property names from the object
        childNode.properties.forEach(prop => {
          if (prop.key && prop.key.type === 'Identifier') {
            parameters.push(prop.key.name);
          }
        });
      }
    });
    
    return parameters;
  }

  /**
   * Find file operations related to sensitivity results
   * @private
   */
  _findSensitivityFileOperations(ast) {
    // Look for file operations that might be related to sensitivity analysis
    this._traverseAst(ast, (node) => {
      if (this._isFileOperation(node)) {
        const fileOpText = this._nodeToString(node);
        
        // Check if this file operation is related to sensitivity analysis
        if (fileOpText.includes('sensitivity') || 
            fileOpText.includes('parameter') || 
            fileOpText.includes('variation') ||
            fileOpText.includes('results')) {
          
          const workflow = {
            type: 'file_operation',
            operation: this._getFileOperationType(node),
            filename: this._extractFilename(node),
            implementation: fileOpText,
            location: node.loc
          };
          
          this.sensitivityWorkflows.push(workflow);
        }
      }
    });
  }

  /**
   * Check if a node represents a file operation
   * @private
   */
  _isFileOperation(node) {
    const nodeText = this._nodeToString(node);
    return (
      nodeText.includes('open(') ||
      nodeText.includes('fs.') ||
      nodeText.includes('file(') ||
      nodeText.includes('read') ||
      nodeText.includes('write')
    );
  }

  /**
   * Get the type of file operation
   * @private
   */
  _getFileOperationType(node) {
    const nodeText = this._nodeToString(node);
    
    if (nodeText.includes('read')) return 'read';
    if (nodeText.includes('write')) return 'write';
    if (nodeText.includes('append')) return 'append';
    
    return 'unknown';
  }

  /**
   * Extract filename from a file operation
   * @private
   */
  _extractFilename(node) {
    const nodeText = this._nodeToString(node);
    
    // Look for filename patterns
    const filenamePattern = /(["'])([^"']+\.(csv|json|txt|xlsx|xls))\1/;
    const match = nodeText.match(filenamePattern);
    
    return match ? match[2] : 'unknown_file';
  }

  /**
   * Extract parameter variation ranges
   * @private
   */
  _extractParameterRanges(ast) {
    // Look for value ranges used in sensitivity analysis
    this._traverseAst(ast, (node) => {
      // Look for array literals that might contain variation ranges
      if (node.type === 'ArrayExpression') {
        const arrayText = this._nodeToString(node);
        
        // Check if this array might be a parameter range
        if (this._isLikelyParameterRange(node)) {
          const paramName = this._findAssociatedParameter(node);
          if (paramName) {
            this.parameterRanges[paramName] = {
              values: this._extractArrayValues(node),
              isPercentage: this._isPercentageRange(node),
              location: node.loc
            };
          }
        }
      }
    });
  }

  /**
   * Check if an array is likely to be a parameter range
   * @private
   */
  _isLikelyParameterRange(node) {
    // Parameter ranges typically have numeric values
    if (node.elements.length < 2) return false;
    
    // Check if most elements are numeric
    const numericElements = node.elements.filter(el => 
      el.type === 'Literal' && typeof el.value === 'number'
    );
    
    return numericElements.length >= node.elements.length * 0.7;
  }

  /**
   * Find the parameter associated with an array
   * @private
   */
  _findAssociatedParameter(node) {
    // Look for an assignment where this array is the value
    const parent = this._findParentAssignment(node);
    if (parent) {
      return this._getVariableName(parent);
    }
    
    return null;
  }

  /**
   * Extract values from an array
   * @private
   */
  _extractArrayValues(node) {
    return node.elements
      .filter(el => el.type === 'Literal')
      .map(el => el.value);
  }

  /**
   * Check if a range represents percentage variations
   * @private
   */
  _isPercentageRange(node) {
    // Percentage ranges often have values between -1 and 1 or 0 and 2
    const values = this._extractArrayValues(node);
    
    // Check if values are in typical percentage range
    const allSmall = values.every(v => Math.abs(v) <= 2);
    const hasFractional = values.some(v => Math.abs(v) < 1 && v !== 0);
    
    return allSmall && hasFractional;
  }

  // Helper methods for AST traversal and analysis

  /**
   * Parse code into an abstract syntax tree
   * @private
   */
  _parseCode(code, language) {
    if (language === 'javascript') {
      const esprima = require('esprima');
      return esprima.parseScript(code, { loc: true });
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
    
    // Check for arrays
    if (expr.startsWith('[') && expr.endsWith(']')) {
      const arrayContent = expr.slice(1, -1).trim();
      const elements = arrayContent.split(',').map(item => 
        this._parseSimplifiedExpression(item.trim())
      );
      
      return {
        type: 'ArrayExpression',
        elements
      };
    }
    
    // Default to identifier
    return { type: 'Identifier', name: expr.trim() };
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
   * Get the root node of the AST
   * @private
   */
  _getRoot(node) {
    // Traverse up to find the root node
    let current = node;
    let parent = node._parent;
    
    while (parent) {
      current = parent;
      parent = current._parent;
    }
    
    return current;
  }

  /**
   * Check if node is a variable declaration
   * @private
   */
  _isVariableDeclaration(node) {
    return (
      node.type === 'VariableDeclaration' ||
      node.type === 'VariableDeclarator'
    );
  }

  /**
   * Check if node is an assignment
   * @private
   */
  _isAssignment(node) {
    return (
      node.type === 'AssignmentExpression' ||
      (node.type === 'ExpressionStatement' && 
       node.expression && 
       node.expression.type === 'AssignmentExpression')
    );
  }

  /**
   * Get variable name from a declaration or assignment
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
      }
    } else if (node.type === 'ExpressionStatement' && 
               node.expression && 
               node.expression.type === 'AssignmentExpression') {
      if (node.expression.left.type === 'Identifier') {
        return node.expression.left.name;
      }
    }
    
    return null;
  }

  /**
   * Get initial value from a declaration or assignment
   * @private
   */
  _getInitialValue(node) {
    if (node.type === 'VariableDeclaration' && node.declarations.length > 0 && node.declarations[0].init) {
      return this._evaluateConstant(node.declarations[0].init);
    } else if (node.type === 'VariableDeclarator' && node.init) {
      return this._evaluateConstant(node.init);
    } else if (node.type === 'AssignmentExpression') {
      return this._evaluateConstant(node.right);
    } else if (node.type === 'ExpressionStatement' && 
               node.expression && 
               node.expression.type === 'AssignmentExpression') {
      return this._evaluateConstant(node.expression.right);
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
    } else if (node.type === 'ArrayExpression') {
      return node.elements
        .filter(el => el.type === 'Literal')
        .map(el => el.value);
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
   * Get the context of a node (e.g., function or class it's in)
   * @private
   */
  _getNodeContext(node) {
    // This is a simplified implementation
    // In a real system, we would track the full context hierarchy
    
    // Look for parent function or class
    let current = node;
    while (current) {
      if (current.type === 'FunctionDeclaration' || 
          current.type === 'ClassDeclaration') {
        return current.id ? current.id.name : 'anonymous';
      }
      current = current._parent;
    }
    
    return null;
  }

  /**
   * Find the parent context of a node (function call, calculation, etc.)
   * @private
   */
  _findParentContext(node) {
    // Look for parent expressions or statements
    let current = node;
    while (current) {
      if (current.type === 'CallExpression' || 
          current.type === 'AssignmentExpression' ||
          current.type === 'BinaryExpression') {
        return current;
      }
      current = current._parent;
    }
    
    return null;
  }

  /**
   * Get the type of a context node
   * @private
   */
  _getContextType(node) {
    if (node.type === 'CallExpression') {
      return 'function_call';
    } else if (node.type === 'AssignmentExpression') {
      return 'assignment';
    } else if (node.type === 'BinaryExpression') {
      return 'calculation';
    }
    
    return 'unknown';
  }

  /**
   * Find the parent assignment of a node
   * @private
   */
  _findParentAssignment(node) {
    // Look for parent assignment
    let current = node;
    while (current) {
      if (this._isAssignment(current)) {
        return current;
      }
      current = current._parent;
    }
    
    return null;
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
    } else if (node.type === 'ArrayExpression') {
      const elements = node.elements.map(el => this._nodeToString(el)).join(', ');
      return `[${elements}]`;
    } else if (node.type === 'MemberExpression') {
      return `${this._nodeToString(node.object)}.${this._nodeToString(node.property)}`;
    } else if (node.type === 'ExpressionStatement') {
      return this._nodeToString(node.expression);
    }
    
    // For other node types, return a placeholder
    return 'complex_expression';
  }
}