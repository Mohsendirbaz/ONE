/**
 * Prop Flow Analyzer
 * 
 * This module analyzes the flow of props between React components in a
 * financial modeling application. It tracks how data flows through the
 * component hierarchy and identifies potential issues with prop drilling
 * or unnecessary re-renders.
 */

const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

/**
 * Analyzes prop flow in a React component
 * @param {string} content - The file content
 * @param {string} filePath - The relative path to the file
 * @param {Object} componentInfo - Information about the component from react_parser
 * @returns {Object} - Prop flow analysis results
 */
function analyzePropFlow(content, filePath, componentInfo) {
  try {
    // Parse the code into an AST
    const ast = babelParser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties', 'objectRestSpread']
    });
    
    const propFlowInfo = {
      receivedProps: [],      // Props received by this component
      passedProps: [],        // Props passed to child components
      propDrilling: [],       // Props that are passed through without being used
      propTransformations: [], // How props are transformed before being passed down
      memoization: {          // Information about memoization usage
        isMemoized: false,
        memoizationDeps: []
      },
      potentialIssues: []     // Potential issues with prop usage
    };
    
    // Extract received props
    if (componentInfo.type === 'class') {
      extractClassComponentProps(ast, propFlowInfo);
    } else {
      extractFunctionComponentProps(ast, propFlowInfo);
    }
    
    // Analyze prop usage and passing
    analyzePropUsage(ast, propFlowInfo);
    
    // Check for memoization
    checkMemoization(ast, propFlowInfo);
    
    // Identify potential issues
    identifyPotentialIssues(propFlowInfo);
    
    return propFlowInfo;
  } catch (error) {
    console.error(`Error analyzing prop flow in ${filePath}:`, error);
    return {
      receivedProps: [],
      passedProps: [],
      propDrilling: [],
      propTransformations: [],
      memoization: {
        isMemoized: false,
        memoizationDeps: []
      },
      potentialIssues: []
    };
  }
}

/**
 * Extracts props from a class component
 * @param {Object} ast - The AST of the component
 * @param {Object} propFlowInfo - The prop flow information object to update
 */
function extractClassComponentProps(ast, propFlowInfo) {
  traverse(ast, {
    ClassDeclaration(path) {
      // Check for propTypes
      const propTypesProperty = path.node.body.body.find(
        node => t.isClassProperty(node) && 
               t.isIdentifier(node.key) && 
               node.key.name === 'propTypes'
      );
      
      if (propTypesProperty && t.isObjectExpression(propTypesProperty.value)) {
        propTypesProperty.value.properties.forEach(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            propFlowInfo.receivedProps.push({
              name: prop.key.name,
              required: isPropRequired(prop.value),
              type: getPropType(prop.value)
            });
          }
        });
      }
      
      // Check for defaultProps
      const defaultPropsProperty = path.node.body.body.find(
        node => t.isClassProperty(node) && 
               t.isIdentifier(node.key) && 
               node.key.name === 'defaultProps'
      );
      
      if (defaultPropsProperty && t.isObjectExpression(defaultPropsProperty.value)) {
        defaultPropsProperty.value.properties.forEach(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            const existingProp = propFlowInfo.receivedProps.find(p => p.name === prop.key.name);
            if (existingProp) {
              existingProp.hasDefault = true;
              existingProp.defaultValue = getNodeValue(prop.value);
            } else {
              propFlowInfo.receivedProps.push({
                name: prop.key.name,
                hasDefault: true,
                defaultValue: getNodeValue(prop.value)
              });
            }
          }
        });
      }
      
      // Check constructor for props destructuring
      const constructor = path.node.body.body.find(
        node => t.isClassMethod(node) && 
               t.isIdentifier(node.key) && 
               node.key.name === 'constructor'
      );
      
      if (constructor) {
        traverse.cheap(constructor, node => {
          if (t.isVariableDeclaration(node)) {
            node.declarations.forEach(decl => {
              if (t.isObjectPattern(decl.id) && 
                  t.isMemberExpression(decl.init) && 
                  t.isThisExpression(decl.init.object) && 
                  t.isIdentifier(decl.init.property) && 
                  decl.init.property.name === 'props') {
                
                decl.id.properties.forEach(prop => {
                  if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                    const existingProp = propFlowInfo.receivedProps.find(p => p.name === prop.key.name);
                    if (!existingProp) {
                      propFlowInfo.receivedProps.push({
                        name: prop.key.name,
                        usedInConstructor: true
                      });
                    } else {
                      existingProp.usedInConstructor = true;
                    }
                  }
                });
              }
            });
          }
        });
      }
    }
  });
}

/**
 * Extracts props from a function component
 * @param {Object} ast - The AST of the component
 * @param {Object} propFlowInfo - The prop flow information object to update
 */
function extractFunctionComponentProps(ast, propFlowInfo) {
  traverse(ast, {
    FunctionDeclaration(path) {
      extractPropsFromFunction(path, propFlowInfo);
    },
    ArrowFunctionExpression(path) {
      extractPropsFromFunction(path, propFlowInfo);
    },
    VariableDeclarator(path) {
      if (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init)) {
        extractPropsFromFunction(path.get('init'), propFlowInfo);
      }
    }
  });
  
  // Look for propTypes and defaultProps
  traverse(ast, {
    AssignmentExpression(path) {
      if (t.isMemberExpression(path.node.left)) {
        const obj = path.node.left.object;
        const prop = path.node.left.property;
        
        if (t.isIdentifier(obj) && t.isIdentifier(prop)) {
          // ComponentName.propTypes = {...}
          if (prop.name === 'propTypes' && t.isObjectExpression(path.node.right)) {
            path.node.right.properties.forEach(propNode => {
              if (t.isObjectProperty(propNode) && t.isIdentifier(propNode.key)) {
                const existingProp = propFlowInfo.receivedProps.find(p => p.name === propNode.key.name);
                if (existingProp) {
                  existingProp.required = isPropRequired(propNode.value);
                  existingProp.type = getPropType(propNode.value);
                } else {
                  propFlowInfo.receivedProps.push({
                    name: propNode.key.name,
                    required: isPropRequired(propNode.value),
                    type: getPropType(propNode.value)
                  });
                }
              }
            });
          }
          
          // ComponentName.defaultProps = {...}
          if (prop.name === 'defaultProps' && t.isObjectExpression(path.node.right)) {
            path.node.right.properties.forEach(propNode => {
              if (t.isObjectProperty(propNode) && t.isIdentifier(propNode.key)) {
                const existingProp = propFlowInfo.receivedProps.find(p => p.name === propNode.key.name);
                if (existingProp) {
                  existingProp.hasDefault = true;
                  existingProp.defaultValue = getNodeValue(propNode.value);
                } else {
                  propFlowInfo.receivedProps.push({
                    name: propNode.key.name,
                    hasDefault: true,
                    defaultValue: getNodeValue(propNode.value)
                  });
                }
              }
            });
          }
        }
      }
    }
  });
}

/**
 * Extracts props from a function component's parameters
 * @param {Object} path - The path to the function node
 * @param {Object} propFlowInfo - The prop flow information object to update
 */
function extractPropsFromFunction(path, propFlowInfo) {
  const params = path.node.params;
  
  if (params.length > 0) {
    const firstParam = params[0];
    
    // Case: function Component({ prop1, prop2 }) {...}
    if (t.isObjectPattern(firstParam)) {
      firstParam.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          propFlowInfo.receivedProps.push({
            name: prop.key.name,
            destructured: true
          });
        } else if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
          propFlowInfo.receivedProps.push({
            name: prop.argument.name,
            isRestProps: true
          });
        }
      });
    }
    // Case: function Component(props) {...}
    else if (t.isIdentifier(firstParam)) {
      // Look for props destructuring inside the function
      path.traverse({
        VariableDeclarator(varPath) {
          if (t.isObjectPattern(varPath.node.id) && 
              t.isIdentifier(varPath.node.init) && 
              varPath.node.init.name === firstParam.name) {
            
            varPath.node.id.properties.forEach(prop => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                propFlowInfo.receivedProps.push({
                  name: prop.key.name,
                  destructured: true,
                  destructuredInside: true
                });
              } else if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
                propFlowInfo.receivedProps.push({
                  name: prop.argument.name,
                  isRestProps: true,
                  destructuredInside: true
                });
              }
            });
          }
        }
      });
    }
  }
}

/**
 * Analyzes how props are used and passed to child components
 * @param {Object} ast - The AST of the component
 * @param {Object} propFlowInfo - The prop flow information object to update
 */
function analyzePropUsage(ast, propFlowInfo) {
  const propUsage = {};
  const receivedPropNames = propFlowInfo.receivedProps.map(p => p.name);
  
  // Initialize prop usage tracking
  receivedPropNames.forEach(name => {
    propUsage[name] = {
      usedInJSX: false,
      usedInLogic: false,
      passedToChildren: false,
      transformedBeforePassing: false,
      transformations: []
    };
  });
  
  // Track prop usage in JSX and logic
  traverse(ast, {
    // Track prop usage in JSX attributes
    JSXAttribute(path) {
      const valuePath = path.get('value');
      
      if (valuePath.isJSXExpressionContainer()) {
        const expression = valuePath.node.expression;
        
        // Direct prop passing: <Child prop={prop} />
        if (t.isIdentifier(expression) && receivedPropNames.includes(expression.name)) {
          const propName = expression.name;
          propUsage[propName].usedInJSX = true;
          propUsage[propName].passedToChildren = true;
          
          propFlowInfo.passedProps.push({
            from: propName,
            to: path.node.name.name,
            component: getParentComponentName(path),
            direct: true
          });
        }
        // Transformed prop passing: <Child prop={transformProp(prop)} />
        else if (t.isCallExpression(expression) || t.isBinaryExpression(expression) || 
                t.isLogicalExpression(expression) || t.isConditionalExpression(expression)) {
          const usedProps = findPropsInExpression(expression, receivedPropNames);
          
          usedProps.forEach(propName => {
            propUsage[propName].usedInJSX = true;
            propUsage[propName].passedToChildren = true;
            propUsage[propName].transformedBeforePassing = true;
            
            const transformation = {
              from: propName,
              to: path.node.name.name,
              component: getParentComponentName(path),
              transformationType: getTransformationType(expression),
              direct: false
            };
            
            propUsage[propName].transformations.push(transformation);
            propFlowInfo.propTransformations.push(transformation);
          });
        }
        // Object spread: <Child {...props} />
        else if (t.isSpreadElement(expression) && t.isIdentifier(expression.argument) && 
                receivedPropNames.includes(expression.argument.name)) {
          const propName = expression.argument.name;
          propUsage[propName].usedInJSX = true;
          propUsage[propName].passedToChildren = true;
          
          propFlowInfo.passedProps.push({
            from: propName,
            to: '*',  // Indicates spread
            component: getParentComponentName(path),
            isSpread: true
          });
        }
      }
    },
    
    // Track prop usage in logic (non-JSX)
    MemberExpression(path) {
      if (t.isIdentifier(path.node.object) && path.node.object.name === 'props' && 
          t.isIdentifier(path.node.property)) {
        const propName = path.node.property.name;
        if (receivedPropNames.includes(propName)) {
          propUsage[propName].usedInLogic = true;
        }
      }
    },
    
    // Track direct prop usage (when destructured)
    Identifier(path) {
      const name = path.node.name;
      if (receivedPropNames.includes(name) && !path.parent.key === path.node) {
        // Make sure we're not looking at property definitions
        if (!t.isObjectProperty(path.parent) || path.parent.key !== path.node) {
          propUsage[name].usedInLogic = true;
        }
      }
    }
  });
  
  // Identify prop drilling (props passed through without being used in logic)
  receivedPropNames.forEach(name => {
    const usage = propUsage[name];
    if (usage.passedToChildren && !usage.usedInLogic) {
      propFlowInfo.propDrilling.push({
        name,
        transformedBeforePassing: usage.transformedBeforePassing
      });
    }
  });
}

/**
 * Checks if a component is memoized and what dependencies are used
 * @param {Object} ast - The AST of the component
 * @param {Object} propFlowInfo - The prop flow information object to update
 */
function checkMemoization(ast, propFlowInfo) {
  traverse(ast, {
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'memo') {
        propFlowInfo.memoization.isMemoized = true;
        
        // Check for second argument (dependency comparison function)
        if (path.node.arguments.length > 1) {
          propFlowInfo.memoization.hasCustomCompare = true;
          
          // Try to extract dependencies from custom comparison function
          const compareArg = path.node.arguments[1];
          if (t.isArrowFunctionExpression(compareArg) || t.isFunctionExpression(compareArg)) {
            const params = compareArg.params;
            if (params.length >= 2) {
              // Extract props mentioned in the comparison function
              path.get('arguments.1').traverse({
                MemberExpression(memberPath) {
                  if ((t.isIdentifier(memberPath.node.object) && 
                       (memberPath.node.object.name === params[0].name || 
                        memberPath.node.object.name === params[1].name)) && 
                      t.isIdentifier(memberPath.node.property)) {
                    
                    const propName = memberPath.node.property.name;
                    if (!propFlowInfo.memoization.memoizationDeps.includes(propName)) {
                      propFlowInfo.memoization.memoizationDeps.push(propName);
                    }
                  }
                }
              });
            }
          }
        } else {
          // Default memo behavior uses shallow comparison of all props
          propFlowInfo.memoization.hasCustomCompare = false;
          propFlowInfo.memoization.memoizationDeps = propFlowInfo.receivedProps.map(p => p.name);
        }
      }
    }
  });
}

/**
 * Identifies potential issues with prop usage
 * @param {Object} propFlowInfo - The prop flow information object
 */
function identifyPotentialIssues(propFlowInfo) {
  // Check for excessive prop drilling
  if (propFlowInfo.propDrilling.length > 3) {
    propFlowInfo.potentialIssues.push({
      type: 'excessive-prop-drilling',
      message: `Component has ${propFlowInfo.propDrilling.length} props being drilled through without being used`,
      props: propFlowInfo.propDrilling.map(p => p.name)
    });
  }
  
  // Check for props that are required but don't have defaults
  const requiredPropsWithoutDefaults = propFlowInfo.receivedProps.filter(
    p => p.required && !p.hasDefault
  );
  
  if (requiredPropsWithoutDefaults.length > 0) {
    propFlowInfo.potentialIssues.push({
      type: 'required-props-without-defaults',
      message: 'Component has required props without default values',
      props: requiredPropsWithoutDefaults.map(p => p.name)
    });
  }
  
  // Check for memoization issues
  if (propFlowInfo.memoization.isMemoized) {
    // Check if component is memoized but has object/array props without custom comparison
    const objectProps = propFlowInfo.receivedProps.filter(
      p => p.type === 'object' || p.type === 'array'
    );
    
    if (objectProps.length > 0 && !propFlowInfo.memoization.hasCustomCompare) {
      propFlowInfo.potentialIssues.push({
        type: 'memo-with-object-props',
        message: 'Component is memoized with object/array props but no custom comparison function',
        props: objectProps.map(p => p.name)
      });
    }
  }
}

/**
 * Determines if a prop is required based on its PropTypes definition
 * @param {Object} propTypeNode - The AST node for the PropType
 * @returns {boolean} - Whether the prop is required
 */
function isPropRequired(propTypeNode) {
  if (t.isMemberExpression(propTypeNode) && 
      t.isIdentifier(propTypeNode.property) && 
      propTypeNode.property.name === 'isRequired') {
    return true;
  }
  return false;
}

/**
 * Gets the type of a prop based on its PropTypes definition
 * @param {Object} propTypeNode - The AST node for the PropType
 * @returns {string} - The prop type
 */
function getPropType(propTypeNode) {
  let node = propTypeNode;
  
  // Handle isRequired
  if (t.isMemberExpression(node) && 
      t.isIdentifier(node.property) && 
      node.property.name === 'isRequired') {
    node = node.object;
  }
  
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.object) && 
        t.isIdentifier(node.property) && 
        node.object.name === 'PropTypes') {
      
      const typeName = node.property.name;
      
      // Map PropTypes to simplified types
      const typeMap = {
        string: 'string',
        number: 'number',
        bool: 'boolean',
        func: 'function',
        array: 'array',
        object: 'object',
        symbol: 'symbol',
        node: 'node',
        element: 'element',
        instanceOf: 'instance',
        oneOf: 'enum',
        oneOfType: 'union',
        arrayOf: 'array',
        objectOf: 'object',
        shape: 'object',
        exact: 'object'
      };
      
      return typeMap[typeName] || 'unknown';
    }
  }
  
  return 'unknown';
}

/**
 * Gets a string representation of a node's value
 * @param {Object} node - The AST node
 * @returns {string} - String representation of the value
 */
function getNodeValue(node) {
  if (t.isStringLiteral(node)) {
    return `"${node.value}"`;
  } else if (t.isNumericLiteral(node)) {
    return node.value.toString();
  } else if (t.isBooleanLiteral(node)) {
    return node.value.toString();
  } else if (t.isNullLiteral(node)) {
    return 'null';
  } else if (t.isIdentifier(node) && node.name === 'undefined') {
    return 'undefined';
  } else if (t.isArrayExpression(node)) {
    return '[]';
  } else if (t.isObjectExpression(node)) {
    return '{}';
  } else {
    return '<complex value>';
  }
}

/**
 * Gets the name of the parent component from a JSX attribute path
 * @param {Object} path - The path to the JSX attribute
 * @returns {string} - The name of the parent component
 */
function getParentComponentName(path) {
  let current = path;
  while (current && !current.isJSXOpeningElement()) {
    current = current.parentPath;
  }
  
  if (current && current.node.name) {
    if (t.isJSXIdentifier(current.node.name)) {
      return current.node.name.name;
    } else if (t.isJSXMemberExpression(current.node.name)) {
      return `${current.node.name.object.name}.${current.node.name.property.name}`;
    }
  }
  
  return 'Unknown';
}

/**
 * Finds props used in an expression
 * @param {Object} expression - The AST expression node
 * @param {Array} propNames - List of prop names to look for
 * @returns {Array} - List of prop names used in the expression
 */
function findPropsInExpression(expression, propNames) {
  const usedProps = [];
  
  function traverse(node) {
    if (!node) return;
    
    if (t.isIdentifier(node) && propNames.includes(node.name)) {
      if (!usedProps.includes(node.name)) {
        usedProps.push(node.name);
      }
    } else if (t.isMemberExpression(node)) {
      traverse(node.object);
      traverse(node.property);
    } else if (t.isCallExpression(node)) {
      traverse(node.callee);
      node.arguments.forEach(arg => traverse(arg));
    } else if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
      traverse(node.left);
      traverse(node.right);
    } else if (t.isConditionalExpression(node)) {
      traverse(node.test);
      traverse(node.consequent);
      traverse(node.alternate);
    } else if (t.isObjectExpression(node)) {
      node.properties.forEach(prop => {
        if (t.isObjectProperty(prop)) {
          traverse(prop.key);
          traverse(prop.value);
        } else if (t.isSpreadElement(prop)) {
          traverse(prop.argument);
        }
      });
    } else if (t.isArrayExpression(node)) {
      node.elements.forEach(element => traverse(element));
    }
  }
  
  traverse(expression);
  return usedProps;
}

/**
 * Gets the type of transformation applied to a prop
 * @param {Object} expression - The AST expression node
 * @returns {string} - The type of transformation
 */
function getTransformationType(expression) {
  if (t.isCallExpression(expression)) {
    return 'function-call';
  } else if (t.isBinaryExpression(expression)) {
    return 'binary-operation';
  } else if (t.isLogicalExpression(expression)) {
    return 'logical-operation';
  } else if (t.isConditionalExpression(expression)) {
    return 'conditional';
  } else {
    return 'unknown';
  }
}

/**
 * Builds a prop flow graph for visualization
 * @param {Object} components - Map of component names to their prop flow info
 * @returns {Object} - A graph representation of prop flow
 */
function buildPropFlowGraph(components) {
  const graph = {
    nodes: [],
    edges: []
  };
  
  // Add nodes for each component
  Object.keys(components).forEach(componentName => {
    graph.nodes.push({
      id: componentName,
      type: 'component',
      props: components[componentName].receivedProps.map(p => p.name)
    });
  });
  
  // Add edges for prop flow
  Object.keys(components).forEach(componentName => {
    const component = components[componentName];
    
    component.passedProps.forEach(propFlow => {
      if (propFlow.component && graph.nodes.some(node => node.id === propFlow.component)) {
        graph.edges.push({
          source: componentName,
          target: propFlow.component,
          prop: propFlow.from,
          targetProp: propFlow.to,
          direct: propFlow.direct,
          isSpread: propFlow.isSpread
        });
      }
    });
  });
  
  return graph;
}

module.exports = {
  analyzePropFlow,
  buildPropFlowGraph
};