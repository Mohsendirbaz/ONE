/**
 * Hook Analyzer
 * 
 * This module analyzes React hooks usage in functional components within
 * a financial modeling application. It identifies patterns and potential
 * issues with hooks like useState, useEffect, useCallback, useMemo, etc.
 */

const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

/**
 * Analyzes hooks usage in a React component
 * @param {string} content - The file content
 * @param {string} filePath - The relative path to the file
 * @param {Object} componentInfo - Information about the component from react_parser
 * @returns {Object} - Hook analysis results
 */
function analyzeHooks(content, filePath, componentInfo) {
  try {
    // Skip analysis for class components
    if (componentInfo.type === 'class') {
      return {
        hasHooks: false,
        hookCalls: [],
        customHooks: [],
        potentialIssues: []
      };
    }
    
    // Parse the code into an AST
    const ast = babelParser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties', 'objectRestSpread']
    });
    
    const hookInfo = {
      hasHooks: false,
      hookCalls: [],        // All hook calls in the component
      stateHooks: [],       // useState hooks
      effectHooks: [],      // useEffect hooks
      memoHooks: [],        // useMemo hooks
      callbackHooks: [],    // useCallback hooks
      refHooks: [],         // useRef hooks
      contextHooks: [],     // useContext hooks
      reducerHooks: [],     // useReducer hooks
      customHooks: [],      // Custom hooks used
      customHookDefinitions: [], // Custom hooks defined in this file
      potentialIssues: []   // Potential issues with hooks usage
    };
    
    // Extract hook calls
    extractHookCalls(ast, hookInfo);
    
    // Extract custom hook definitions
    extractCustomHookDefinitions(ast, hookInfo);
    
    // Analyze hook dependencies
    analyzeHookDependencies(hookInfo);
    
    // Identify potential issues
    identifyHookIssues(hookInfo);
    
    return hookInfo;
  } catch (error) {
    console.error(`Error analyzing hooks in ${filePath}:`, error);
    return {
      hasHooks: false,
      hookCalls: [],
      customHooks: [],
      potentialIssues: []
    };
  }
}

/**
 * Extracts hook calls from a component
 * @param {Object} ast - The AST of the component
 * @param {Object} hookInfo - The hook information object to update
 */
function extractHookCalls(ast, hookInfo) {
  traverse(ast, {
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee) && path.node.callee.name.startsWith('use')) {
        const hookName = path.node.callee.name;
        
        // Skip if this is a call to a hook inside a custom hook definition
        if (isInsideCustomHookDefinition(path)) {
          return;
        }
        
        hookInfo.hasHooks = true;
        
        const hookCall = {
          name: hookName,
          arguments: extractHookArguments(path.node.arguments),
          location: {
            start: path.node.loc?.start,
            end: path.node.loc?.end
          },
          dependencies: extractDependencies(path.node)
        };
        
        hookInfo.hookCalls.push(hookCall);
        
        // Categorize hooks by type
        categorizeHook(hookCall, hookInfo);
      }
    }
  });
}

/**
 * Checks if a hook call is inside a custom hook definition
 * @param {Object} path - The path to the hook call
 * @returns {boolean} - Whether the hook is inside a custom hook definition
 */
function isInsideCustomHookDefinition(path) {
  let currentPath = path.parentPath;
  
  while (currentPath) {
    if (currentPath.isFunctionDeclaration() || 
        currentPath.isArrowFunctionExpression() || 
        currentPath.isFunctionExpression()) {
      
      // Check if the function name starts with 'use'
      if (currentPath.node.id && 
          t.isIdentifier(currentPath.node.id) && 
          currentPath.node.id.name.startsWith('use')) {
        return true;
      }
      
      // Check for variable declarations (for arrow functions)
      if (currentPath.parentPath && 
          currentPath.parentPath.isVariableDeclarator() && 
          t.isIdentifier(currentPath.parentPath.node.id) && 
          currentPath.parentPath.node.id.name.startsWith('use')) {
        return true;
      }
    }
    
    currentPath = currentPath.parentPath;
  }
  
  return false;
}

/**
 * Extracts custom hook definitions from a file
 * @param {Object} ast - The AST of the file
 * @param {Object} hookInfo - The hook information object to update
 */
function extractCustomHookDefinitions(ast, hookInfo) {
  // Look for function declarations that start with 'use'
  traverse(ast, {
    FunctionDeclaration(path) {
      if (t.isIdentifier(path.node.id) && path.node.id.name.startsWith('use')) {
        const hookName = path.node.id.name;
        
        const customHook = {
          name: hookName,
          params: path.node.params.map(param => {
            if (t.isIdentifier(param)) {
              return param.name;
            } else if (t.isObjectPattern(param)) {
              return 'object pattern';
            } else if (t.isArrayPattern(param)) {
              return 'array pattern';
            }
            return 'unknown';
          }),
          returnsArray: detectArrayReturn(path),
          usedHooks: extractUsedHooks(path),
          location: {
            start: path.node.loc?.start,
            end: path.node.loc?.end
          }
        };
        
        hookInfo.customHookDefinitions.push(customHook);
      }
    },
    
    // Look for arrow functions or function expressions assigned to variables that start with 'use'
    VariableDeclarator(path) {
      if (t.isIdentifier(path.node.id) && 
          path.node.id.name.startsWith('use') && 
          (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init))) {
        
        const hookName = path.node.id.name;
        
        const customHook = {
          name: hookName,
          params: path.node.init.params.map(param => {
            if (t.isIdentifier(param)) {
              return param.name;
            } else if (t.isObjectPattern(param)) {
              return 'object pattern';
            } else if (t.isArrayPattern(param)) {
              return 'array pattern';
            }
            return 'unknown';
          }),
          returnsArray: detectArrayReturn(path.get('init')),
          usedHooks: extractUsedHooks(path.get('init')),
          location: {
            start: path.node.loc?.start,
            end: path.node.loc?.end
          }
        };
        
        hookInfo.customHookDefinitions.push(customHook);
      }
    }
  });
}

/**
 * Extracts hooks used within a custom hook
 * @param {Object} path - The path to the custom hook function
 * @returns {Array} - List of hooks used in the custom hook
 */
function extractUsedHooks(path) {
  const usedHooks = [];
  
  path.traverse({
    CallExpression(callPath) {
      if (t.isIdentifier(callPath.node.callee) && 
          callPath.node.callee.name.startsWith('use')) {
        
        const hookName = callPath.node.callee.name;
        
        if (!usedHooks.some(hook => hook.name === hookName)) {
          usedHooks.push({
            name: hookName,
            count: 1
          });
        } else {
          const hook = usedHooks.find(h => h.name === hookName);
          hook.count++;
        }
      }
    }
  });
  
  return usedHooks;
}

/**
 * Detects if a custom hook returns an array
 * @param {Object} path - The path to the custom hook function
 * @returns {boolean} - Whether the hook returns an array
 */
function detectArrayReturn(path) {
  let returnsArray = false;
  
  path.traverse({
    ReturnStatement(returnPath) {
      const argument = returnPath.node.argument;
      
      if (t.isArrayExpression(argument)) {
        returnsArray = true;
      }
    }
  });
  
  return returnsArray;
}

/**
 * Extracts arguments passed to a hook
 * @param {Array} args - The arguments AST nodes
 * @returns {Array} - Simplified representation of the arguments
 */
function extractHookArguments(args) {
  return args.map(arg => {
    if (t.isStringLiteral(arg)) {
      return { type: 'string', value: arg.value };
    } else if (t.isNumericLiteral(arg)) {
      return { type: 'number', value: arg.value };
    } else if (t.isBooleanLiteral(arg)) {
      return { type: 'boolean', value: arg.value };
    } else if (t.isNullLiteral(arg)) {
      return { type: 'null' };
    } else if (t.isIdentifier(arg)) {
      return { type: 'identifier', name: arg.name };
    } else if (t.isObjectExpression(arg)) {
      return { type: 'object' };
    } else if (t.isArrayExpression(arg)) {
      return { type: 'array', elements: arg.elements.length };
    } else if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
      return { type: 'function' };
    } else {
      return { type: 'complex' };
    }
  });
}

/**
 * Extracts dependencies from a hook call
 * @param {Object} node - The hook call node
 * @returns {Array} - List of dependencies
 */
function extractDependencies(node) {
  // For useEffect, useMemo, useCallback, the dependencies are the last argument
  if (node.arguments.length > 0 && 
      (node.callee.name === 'useEffect' || 
       node.callee.name === 'useMemo' || 
       node.callee.name === 'useCallback')) {
    
    const lastArg = node.arguments[node.arguments.length - 1];
    
    if (t.isArrayExpression(lastArg)) {
      return lastArg.elements.map(element => {
        if (t.isIdentifier(element)) {
          return { type: 'identifier', name: element.name };
        } else if (t.isMemberExpression(element)) {
          return { 
            type: 'member', 
            object: t.isIdentifier(element.object) ? element.object.name : 'complex',
            property: t.isIdentifier(element.property) ? element.property.name : 'complex'
          };
        } else {
          return { type: 'complex' };
        }
      });
    }
  }
  
  return [];
}

/**
 * Categorizes a hook call by type
 * @param {Object} hookCall - The hook call information
 * @param {Object} hookInfo - The hook information object to update
 */
function categorizeHook(hookCall, hookInfo) {
  const hookName = hookCall.name;
  
  if (hookName === 'useState') {
    hookInfo.stateHooks.push(hookCall);
  } else if (hookName === 'useEffect') {
    hookInfo.effectHooks.push(hookCall);
  } else if (hookName === 'useMemo') {
    hookInfo.memoHooks.push(hookCall);
  } else if (hookName === 'useCallback') {
    hookInfo.callbackHooks.push(hookCall);
  } else if (hookName === 'useRef') {
    hookInfo.refHooks.push(hookCall);
  } else if (hookName === 'useContext') {
    hookInfo.contextHooks.push(hookCall);
  } else if (hookName === 'useReducer') {
    hookInfo.reducerHooks.push(hookCall);
  } else if (hookName.startsWith('use') && !isBuiltInHook(hookName)) {
    hookInfo.customHooks.push(hookCall);
  }
}

/**
 * Checks if a hook is a built-in React hook
 * @param {string} hookName - The name of the hook
 * @returns {boolean} - Whether the hook is built-in
 */
function isBuiltInHook(hookName) {
  const builtInHooks = [
    'useState', 'useEffect', 'useContext', 'useReducer', 
    'useCallback', 'useMemo', 'useRef', 'useImperativeHandle', 
    'useLayoutEffect', 'useDebugValue', 'useDeferredValue', 
    'useTransition', 'useId'
  ];
  
  return builtInHooks.includes(hookName);
}

/**
 * Analyzes dependencies in hooks like useEffect, useMemo, and useCallback
 * @param {Object} hookInfo - The hook information object to update
 */
function analyzeHookDependencies(hookInfo) {
  // Analyze useEffect dependencies
  hookInfo.effectHooks.forEach(hook => {
    analyzeEffectDependencies(hook, hookInfo);
  });
  
  // Analyze useMemo dependencies
  hookInfo.memoHooks.forEach(hook => {
    analyzeMemoizationDependencies(hook, hookInfo);
  });
  
  // Analyze useCallback dependencies
  hookInfo.callbackHooks.forEach(hook => {
    analyzeMemoizationDependencies(hook, hookInfo);
  });
}

/**
 * Analyzes dependencies in useEffect hooks
 * @param {Object} hook - The hook call information
 * @param {Object} hookInfo - The hook information object to update
 */
function analyzeEffectDependencies(hook, hookInfo) {
  // Check for empty dependency array (runs only once)
  if (hook.dependencies.length === 0) {
    hook.runOnce = true;
  }
  
  // Check for missing dependency array (runs on every render)
  if (!hook.arguments[1]) {
    hook.runEveryRender = true;
  }
}

/**
 * Analyzes dependencies in useMemo and useCallback hooks
 * @param {Object} hook - The hook call information
 * @param {Object} hookInfo - The hook information object to update
 */
function analyzeMemoizationDependencies(hook, hookInfo) {
  // Check for empty dependency array
  if (hook.dependencies.length === 0) {
    hook.memoizedForever = true;
  }
  
  // Check for missing dependency array
  if (!hook.arguments[1]) {
    hook.notMemoized = true;
  }
}

/**
 * Identifies potential issues with hooks usage
 * @param {Object} hookInfo - The hook information object to update
 */
function identifyHookIssues(hookInfo) {
  // Check for useEffect without dependency array
  hookInfo.effectHooks.forEach(hook => {
    if (hook.runEveryRender) {
      hookInfo.potentialIssues.push({
        type: 'effect-missing-deps',
        message: 'useEffect is missing dependency array and will run on every render',
        location: hook.location
      });
    }
  });
  
  // Check for useMemo/useCallback without dependency array
  [...hookInfo.memoHooks, ...hookInfo.callbackHooks].forEach(hook => {
    if (hook.notMemoized) {
      hookInfo.potentialIssues.push({
        type: 'memoization-missing-deps',
        message: `${hook.name} is missing dependency array and won't memoize`,
        location: hook.location
      });
    }
  });
  
  // Check for excessive state hooks
  if (hookInfo.stateHooks.length > 5) {
    hookInfo.potentialIssues.push({
      type: 'excessive-state',
      message: `Component has ${hookInfo.stateHooks.length} useState calls, consider using useReducer`,
      count: hookInfo.stateHooks.length
    });
  }
  
  // Check for excessive effect hooks
  if (hookInfo.effectHooks.length > 3) {
    hookInfo.potentialIssues.push({
      type: 'excessive-effects',
      message: `Component has ${hookInfo.effectHooks.length} useEffect calls, consider refactoring`,
      count: hookInfo.effectHooks.length
    });
  }
}

/**
 * Builds a hook usage graph for visualization
 * @param {Object} components - Map of component names to their hook info
 * @returns {Object} - A graph representation of hook usage
 */
function buildHookUsageGraph(components) {
  const graph = {
    nodes: [],
    edges: []
  };
  
  // Add nodes for each component
  Object.keys(components).forEach(componentName => {
    const component = components[componentName];
    
    if (component.hasHooks) {
      graph.nodes.push({
        id: componentName,
        type: 'component',
        hooks: component.hookCalls.map(h => h.name)
      });
    }
  });
  
  // Add nodes for custom hooks
  const customHooks = new Set();
  
  Object.keys(components).forEach(componentName => {
    const component = components[componentName];
    
    component.customHookDefinitions.forEach(hook => {
      if (!customHooks.has(hook.name)) {
        customHooks.add(hook.name);
        
        graph.nodes.push({
          id: hook.name,
          type: 'customHook',
          usedHooks: hook.usedHooks.map(h => h.name)
        });
      }
    });
  });
  
  // Add edges for hook usage
  Object.keys(components).forEach(componentName => {
    const component = components[componentName];
    
    // Component -> Custom Hook edges
    component.customHooks.forEach(hook => {
      graph.edges.push({
        source: componentName,
        target: hook.name,
        type: 'uses'
      });
    });
    
    // Custom Hook -> Custom Hook edges
    component.customHookDefinitions.forEach(hook => {
      hook.usedHooks.forEach(usedHook => {
        if (!isBuiltInHook(usedHook.name) && customHooks.has(usedHook.name)) {
          graph.edges.push({
            source: hook.name,
            target: usedHook.name,
            type: 'uses'
          });
        }
      });
    });
  });
  
  return graph;
}

module.exports = {
  analyzeHooks,
  buildHookUsageGraph
};