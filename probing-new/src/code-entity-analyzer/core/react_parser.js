/**
 * React Parser Module
 * 
 * Provides utilities for parsing React components, hooks, and contexts from JavaScript/JSX files.
 */

/**
 * Parse React components from file content
 * @param {string} content - File content to parse
 * @param {string} filePath - Path to the file being parsed
 * @returns {Promise<Array>} Array of component objects
 */
export async function parseComponents(content, filePath) {
  try {
    const components = [];
    
    // Extract functional components
    const functionalComponentPatterns = [
      // Arrow function components with explicit return
      /export\s+const\s+(\w+)\s*=\s*\(.*\)\s*=>\s*{[\s\S]*?return\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
      // Arrow function components with implicit return
      /export\s+const\s+(\w+)\s*=\s*\(.*\)\s*=>\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
      // Function declaration components
      /export\s+function\s+(\w+)\s*\(.*\)\s*{[\s\S]*?return\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
      // Default export functional components
      /export\s+default\s+function\s+(\w+)\s*\(.*\)\s*{[\s\S]*?return\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
      // Default export arrow function components
      /export\s+default\s+\(.*\)\s*=>\s*{[\s\S]*?return\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
      // Named function components
      /function\s+(\w+)\s*\(.*\)\s*{[\s\S]*?return\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
      // Named arrow function components
      /const\s+(\w+)\s*=\s*\(.*\)\s*=>\s*{[\s\S]*?return\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
    ];
    
    // Extract class components
    const classComponentPatterns = [
      // Class components extending React.Component
      /export\s+class\s+(\w+)\s+extends\s+React\.Component\s*{[\s\S]*?render\s*\(\)\s*{[\s\S]*?return\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
      // Class components extending Component
      /export\s+class\s+(\w+)\s+extends\s+Component\s*{[\s\S]*?render\s*\(\)\s*{[\s\S]*?return\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
      // Default export class components
      /export\s+default\s+class\s+(\w+)\s+extends\s+(React\.Component|Component)\s*{[\s\S]*?render\s*\(\)\s*{[\s\S]*?return\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
      // Named class components
      /class\s+(\w+)\s+extends\s+(React\.Component|Component)\s*{[\s\S]*?render\s*\(\)\s*{[\s\S]*?return\s*\(\s*<[\s\S]*?>\s*[\s\S]*?<\/[\s\S]*?>\s*\)/g,
    ];
    
    // Process functional components
    for (const pattern of functionalComponentPatterns) {
      const matches = [...content.matchAll(pattern)];
      
      for (const match of matches) {
        const componentName = match[1] || extractComponentNameFromPath(filePath);
        const componentCode = match[0];
        
        // Extract JSX from the component
        const jsxMatch = componentCode.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
        const jsx = jsxMatch ? jsxMatch[1] : '';
        
        // Extract props from the component
        const propsMatch = componentCode.match(/\(\s*{\s*([\s\S]*?)}\s*\)/);
        const propsString = propsMatch ? propsMatch[1] : '';
        const props = propsString.split(',')
          .map(prop => prop.trim())
          .filter(prop => prop.length > 0);
        
        components.push({
          name: componentName,
          type: 'functional',
          content: componentCode,
          jsx,
          props,
        });
      }
    }
    
    // Process class components
    for (const pattern of classComponentPatterns) {
      const matches = [...content.matchAll(pattern)];
      
      for (const match of matches) {
        const componentName = match[1] || extractComponentNameFromPath(filePath);
        const componentCode = match[0];
        
        // Extract JSX from the component
        const jsxMatch = componentCode.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
        const jsx = jsxMatch ? jsxMatch[1] : '';
        
        // Extract props from the component
        const props = [];
        const propUsageMatches = [...componentCode.matchAll(/this\.props\.(\w+)/g)];
        for (const propMatch of propUsageMatches) {
          const propName = propMatch[1];
          if (!props.includes(propName)) {
            props.push(propName);
          }
        }
        
        components.push({
          name: componentName,
          type: 'class',
          content: componentCode,
          jsx,
          props,
        });
      }
    }
    
    // Handle default exports without names
    if (components.length === 0 && content.includes('export default')) {
      // Try to extract component name from file path
      const componentName = extractComponentNameFromPath(filePath);
      
      // Look for JSX in the file
      const jsxMatch = content.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
      const jsx = jsxMatch ? jsxMatch[1] : '';
      
      if (jsx) {
        components.push({
          name: componentName,
          type: 'unknown',
          content: content,
          jsx,
          props: [],
        });
      }
    }
    
    return components;
  } catch (error) {
    console.error(`Error parsing components from ${filePath}:`, error);
    return [];
  }
}

/**
 * Parse React hooks from file content
 * @param {string} content - File content to parse
 * @param {string} filePath - Path to the file being parsed
 * @returns {Promise<Array>} Array of hook objects
 */
export async function parseHooks(content, filePath) {
  try {
    const hooks = [];
    
    // Extract custom hooks
    const hookPatterns = [
      // Named export hooks
      /export\s+function\s+(use\w+)\s*\(.*\)\s*{[\s\S]*?}/g,
      // Default export hooks
      /export\s+default\s+function\s+(use\w+)\s*\(.*\)\s*{[\s\S]*?}/g,
      // Named hooks
      /function\s+(use\w+)\s*\(.*\)\s*{[\s\S]*?}/g,
      // Arrow function hooks
      /const\s+(use\w+)\s*=\s*\(.*\)\s*=>\s*{[\s\S]*?}/g,
      // Arrow function hooks with export
      /export\s+const\s+(use\w+)\s*=\s*\(.*\)\s*=>\s*{[\s\S]*?}/g,
    ];
    
    for (const pattern of hookPatterns) {
      const matches = [...content.matchAll(pattern)];
      
      for (const match of matches) {
        const hookName = match[1];
        const hookCode = match[0];
        
        // Extract parameters
        const paramsMatch = hookCode.match(/\(\s*([\s\S]*?)\s*\)/);
        const paramsString = paramsMatch ? paramsMatch[1] : '';
        const params = paramsString.split(',')
          .map(param => param.trim())
          .filter(param => param.length > 0);
        
        // Extract used hooks
        const usedHooks = [];
        const builtInHooks = [
          'useState', 'useEffect', 'useContext', 'useReducer',
          'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
          'useLayoutEffect', 'useDebugValue'
        ];
        
        for (const hook of builtInHooks) {
          const pattern = new RegExp(`\\b${hook}\\(`, 'g');
          if (pattern.test(hookCode)) {
            usedHooks.push(hook);
          }
        }
        
        hooks.push({
          name: hookName,
          content: hookCode,
          params,
          usedHooks,
        });
      }
    }
    
    return hooks;
  } catch (error) {
    console.error(`Error parsing hooks from ${filePath}:`, error);
    return [];
  }
}

/**
 * Parse React contexts from file content
 * @param {string} content - File content to parse
 * @param {string} filePath - Path to the file being parsed
 * @returns {Promise<Array>} Array of context objects
 */
export async function parseContexts(content, filePath) {
  try {
    const contexts = [];
    
    // Extract context creation
    const contextPatterns = [
      // createContext with named export
      /export\s+const\s+(\w+)\s*=\s*React\.createContext\(/g,
      // createContext with default export
      /export\s+default\s+React\.createContext\(/g,
      // createContext assigned to variable
      /const\s+(\w+)\s*=\s*React\.createContext\(/g,
      // createContext with createContext import
      /export\s+const\s+(\w+)\s*=\s*createContext\(/g,
      /const\s+(\w+)\s*=\s*createContext\(/g,
    ];
    
    for (const pattern of contextPatterns) {
      const matches = [...content.matchAll(pattern)];
      
      for (const match of matches) {
        const contextName = match[1] || extractContextNameFromPath(filePath);
        
        // Try to extract default value
        const defaultValuePattern = new RegExp(`${contextName}\\s*=\\s*(?:React\\.)?createContext\\(([^)]+)\\)`, 'g');
        const defaultValueMatch = [...content.matchAll(defaultValuePattern)];
        const defaultValue = defaultValueMatch.length > 0 ? defaultValueMatch[0][1].trim() : 'undefined';
        
        contexts.push({
          name: contextName,
          defaultValue,
        });
      }
    }
    
    return contexts;
  } catch (error) {
    console.error(`Error parsing contexts from ${filePath}:`, error);
    return [];
  }
}

/**
 * Extract component name from file path
 * @param {string} filePath - Path to the file
 * @returns {string} Extracted component name
 */
function extractComponentNameFromPath(filePath) {
  const path = require('path');
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Convert to PascalCase if it's not already
  if (fileName[0] === fileName[0].toLowerCase()) {
    return fileName
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
  
  return fileName;
}

/**
 * Extract context name from file path
 * @param {string} filePath - Path to the file
 * @returns {string} Extracted context name
 */
function extractContextNameFromPath(filePath) {
  const componentName = extractComponentNameFromPath(filePath);
  return `${componentName}Context`;
}