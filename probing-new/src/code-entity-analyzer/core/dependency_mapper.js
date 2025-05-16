/**
 * Dependency Mapper Module
 * 
 * Provides utilities for parsing imports and exports in JavaScript/JSX files
 * to map dependencies between modules.
 */

/**
 * Parse imports and exports from file content
 * @param {string} content - File content to parse
 * @param {string} filePath - Path to the file being parsed
 * @returns {Promise<Object>} Object containing imports and exports information
 */
export async function parseImportsAndExports(content, filePath) {
  try {
    const imports = await parseImports(content, filePath);
    const exports = await parseExports(content, filePath);

    return { imports, exports };
  } catch (error) {
    console.error(`Error parsing imports and exports from ${filePath}:`, error);
    return { imports: [], exports: [] };
  }
}

/**
 * Parse imports from file content
 * @param {string} content - File content to parse
 * @param {string} filePath - Path to the file being parsed
 * @returns {Promise<Array>} Array of import objects
 */
export async function parseImports(content, filePath) {
  try {
    const imports = [];

    // Extract ES6 imports
    const importPatterns = [
      // Named imports
      /import\s+{\s*([\s\S]*?)\s*}\s+from\s+['"]([^'"]+)['"]/g,
      // Default imports
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      // Default and named imports
      /import\s+(\w+)\s*,\s*{\s*([\s\S]*?)\s*}\s+from\s+['"]([^'"]+)['"]/g,
      // Namespace imports
      /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      // Side effect imports
      /import\s+['"]([^'"]+)['"]/g,
    ];

    // Process each import pattern
    for (const pattern of importPatterns) {
      const matches = [...content.matchAll(pattern)];

      for (const match of matches) {
        if (pattern.toString().includes('import\\s+{')) {
          // Named imports
          const namedImports = match[1].split(',').map(name => name.trim());
          const source = match[2];

          imports.push({
            type: 'named',
            source,
            names: namedImports,
          });
        } else if (pattern.toString().includes('import\\s+(\\w+)\\s+from')) {
          // Default import
          const defaultImport = match[1];
          const source = match[2];

          imports.push({
            type: 'default',
            source,
            name: defaultImport,
          });
        } else if (pattern.toString().includes('import\\s+(\\w+)\\s*,\\s*{')) {
          // Default and named imports
          const defaultImport = match[1];
          const namedImports = match[2].split(',').map(name => name.trim());
          const source = match[3];

          imports.push({
            type: 'default_and_named',
            source,
            defaultName: defaultImport,
            namedImports,
          });
        } else if (pattern.toString().includes('import\\s+\\*\\s+as')) {
          // Namespace import
          const namespaceAlias = match[1];
          const source = match[2];

          imports.push({
            type: 'namespace',
            source,
            alias: namespaceAlias,
          });
        } else if (pattern.toString().includes('import\\s+[\'"]')) {
          // Side effect import
          const source = match[1];

          imports.push({
            type: 'side_effect',
            source,
          });
        }
      }
    }

    // Extract CommonJS requires
    const requirePattern = /(?:const|let|var)\s+(\w+|\{[^}]+\})\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const requireMatches = [...content.matchAll(requirePattern)];

    for (const match of requireMatches) {
      const importVar = match[1];
      const source = match[2];

      if (importVar.startsWith('{')) {
        // Destructured require
        const namedImports = importVar
          .slice(1, -1)
          .split(',')
          .map(name => name.trim());

        imports.push({
          type: 'commonjs_destructured',
          source,
          names: namedImports,
        });
      } else {
        // Simple require
        imports.push({
          type: 'commonjs',
          source,
          name: importVar,
        });
      }
    }

    // Process imports to extract module names
    for (const importItem of imports) {
      // Extract the module name from the source path
      const path = require('path');
      let moduleName = '';

      if (importItem.source.startsWith('.')) {
        // Relative import
        const fullPath = path.resolve(path.dirname(filePath), importItem.source);
        moduleName = path.basename(fullPath, path.extname(fullPath));
      } else {
        // Package import
        const parts = importItem.source.split('/');
        if (parts[0].startsWith('@')) {
          // Scoped package
          moduleName = `${parts[0]}/${parts[1]}`;
        } else {
          moduleName = parts[0];
        }
      }

      importItem.moduleName = moduleName;
    }

    return imports;
  } catch (error) {
    console.error(`Error parsing imports from ${filePath}:`, error);
    return [];
  }
}

/**
 * Parse exports from file content
 * @param {string} content - File content to parse
 * @param {string} filePath - Path to the file being parsed
 * @returns {Promise<Array>} Array of export objects
 */
export async function parseExports(content, filePath) {
  try {
    const exports = [];

    // Extract ES6 exports
    const exportPatterns = [
      // Named exports
      /export\s+(?:const|let|var)\s+(\w+)\s*=/g,
      // Named function exports
      /export\s+function\s+(\w+)\s*\(/g,
      // Named class exports
      /export\s+class\s+(\w+)\s+/g,
      // Export declarations
      /export\s+{\s*([\s\S]*?)\s*}/g,
      // Default exports
      /export\s+default\s+(\w+)/g,
      // Default function exports
      /export\s+default\s+function\s+(\w+)?\s*\(/g,
      // Default class exports
      /export\s+default\s+class\s+(\w+)?\s+/g,
      // Default anonymous exports
      /export\s+default\s+(?:function|class|async function)?\s*\(/g,
    ];

    // Process each export pattern
    for (const pattern of exportPatterns) {
      const matches = [...content.matchAll(pattern)];

      for (const match of matches) {
        if (pattern.toString().includes('export\\s+{')) {
          // Export declaration
          const exportedNames = match[1].split(',').map(name => {
            const parts = name.trim().split(/\s+as\s+/);
            return {
              name: parts[0].trim(),
              alias: parts[1] ? parts[1].trim() : undefined,
            };
          });

          exports.push({
            type: 'named_declaration',
            names: exportedNames,
          });
        } else if (pattern.toString().includes('export\\s+default\\s+\\w+')) {
          // Default export of identifier
          const name = match[1];

          exports.push({
            type: 'default',
            name,
          });
        } else if (pattern.toString().includes('export\\s+default\\s+(?:function|class)')) {
          // Default export of anonymous function or class
          exports.push({
            type: 'default_anonymous',
            kind: match[0].includes('function') ? 'function' : 'class',
          });
        } else if (pattern.toString().includes('export\\s+default\\s+function\\s+(\\w+)?')) {
          // Default export of named function
          const name = match[1] || 'anonymous';

          exports.push({
            type: 'default_function',
            name,
          });
        } else if (pattern.toString().includes('export\\s+default\\s+class\\s+(\\w+)?')) {
          // Default export of named class
          const name = match[1] || 'anonymous';

          exports.push({
            type: 'default_class',
            name,
          });
        } else {
          // Named export
          const name = match[1];
          const kind = pattern.toString().includes('function') ? 'function' : 
                      pattern.toString().includes('class') ? 'class' : 'variable';

          exports.push({
            type: 'named',
            name,
            kind,
          });
        }
      }
    }

    // Extract CommonJS exports
    const commonJsPatterns = [
      // module.exports = identifier
      /module\.exports\s*=\s*(\w+)/g,
      // module.exports = { ... }
      /module\.exports\s*=\s*{\s*([\s\S]*?)\s*}/g,
      // exports.name = value
      /exports\.(\w+)\s*=/g,
    ];

    for (const pattern of commonJsPatterns) {
      const matches = [...content.matchAll(pattern)];

      for (const match of matches) {
        if (pattern.toString().includes('module\\.exports\\s*=\\s*{')) {
          // Object exports
          const exportedProps = match[1].split(',').map(prop => {
            const parts = prop.trim().split(':');
            return {
              name: parts[0].trim(),
              value: parts[1] ? parts[1].trim() : parts[0].trim(),
            };
          });

          exports.push({
            type: 'commonjs_object',
            properties: exportedProps,
          });
        } else if (pattern.toString().includes('module\\.exports\\s*=\\s*\\w+')) {
          // Single export
          const name = match[1];

          exports.push({
            type: 'commonjs_single',
            name,
          });
        } else if (pattern.toString().includes('exports\\.\\w+\\s*=')) {
          // Named export
          const name = match[1];

          exports.push({
            type: 'commonjs_named',
            name,
          });
        }
      }
    }

    return exports;
  } catch (error) {
    console.error(`Error parsing exports from ${filePath}:`, error);
    return [];
  }
}

/**
 * Build a dependency graph from imports and exports
 * @param {Object} importExportMap - Map of file paths to their imports and exports
 * @returns {Object} Dependency graph
 */
export function buildDependencyGraph(importExportMap) {
  const graph = {
    nodes: [],
    edges: [],
  };

  // Add nodes for each file
  for (const filePath in importExportMap) {
    graph.nodes.push({
      id: filePath,
      type: 'file',
      name: require('path').basename(filePath),
    });
  }

  // Add edges for dependencies
  for (const filePath in importExportMap) {
    const { imports } = importExportMap[filePath];

    for (const importItem of imports) {
      // Find the target file that exports what this file imports
      let targetFile = null;

      // For relative imports, resolve the path
      if (importItem.source.startsWith('.')) {
        const path = require('path');
        const resolvedPath = path.resolve(path.dirname(filePath), importItem.source);

        // Try to find the exact file or with common extensions
        const extensions = ['.js', '.jsx', '.ts', '.tsx'];
        for (const ext of extensions) {
          const fullPath = resolvedPath + ext;
          if (importExportMap[fullPath]) {
            targetFile = fullPath;
            break;
          }
        }

        // If not found, try the path as-is
        if (!targetFile && importExportMap[resolvedPath]) {
          targetFile = resolvedPath;
        }
      } else {
        // For package imports, we can't resolve the exact file
        // Just create a placeholder node
        const packageNode = {
          id: importItem.source,
          type: 'package',
          name: importItem.moduleName,
        };

        // Add the package node if it doesn't exist
        if (!graph.nodes.some(node => node.id === importItem.source)) {
          graph.nodes.push(packageNode);
        }

        targetFile = importItem.source;
      }

      if (targetFile) {
        graph.edges.push({
          source: filePath,
          target: targetFile,
          type: importItem.type,
          label: importItem.type === 'default' ? importItem.name : 
                 importItem.type === 'named' ? importItem.names.join(', ') :
                 importItem.type === 'namespace' ? importItem.alias : '',
        });
      }
    }
  }

  return graph;
}

/**
 * Create a comprehensive map of module dependencies 
 * Specialized for React component dependencies and state flow
 */
export async function mapDependencies(files, parseResults) {
  const dependencyMap = {
    direct: {}, // Direct import relationships
    indirect: {}, // Indirect relationships through props or state
    circular: [], // Circular dependencies
    central: [], // Central/core components with many dependents
    isolated: [], // Components with few or no relationships
  };

  // Build direct dependency graph from imports/exports
  for (const file of Object.keys(parseResults)) {
    const result = parseResults[file];
    const fileDeps = new Set();

    for (const imp of result.imports) {
      // Resolve absolute and relative imports
      const resolvedModule = resolveImport(file, imp.source, files);
      if (resolvedModule) {
        fileDeps.add(resolvedModule);
      }
    }

    dependencyMap.direct[file] = Array.from(fileDeps);
  }

  // Build indirect dependency graph from prop flows
  dependencyMap.indirect = buildIndirectDependencies(parseResults);

  // Detect circular dependencies
  dependencyMap.circular = detectCircularDependencies(dependencyMap.direct);

  // Identify central components (high in-degree)
  dependencyMap.central = identifyCentralComponents(dependencyMap);

  // Identify isolated components (low connectivity)
  dependencyMap.isolated = identifyIsolatedComponents(dependencyMap);

  return dependencyMap;
}

/**
 * Resolve import path to actual file
 */
function resolveImport(sourceFile, importPath, files) {
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const path = require('path');
    const basePath = path.dirname(sourceFile);
    let resolvedPath = path.resolve(basePath, importPath);

    // Try to find the exact file or with common extensions
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];

    // First check if the exact path exists
    if (files.includes(resolvedPath)) {
      return resolvedPath;
    }

    // Try with extensions if no extension provided
    if (!path.extname(resolvedPath)) {
      for (const ext of extensions) {
        const pathWithExt = resolvedPath + ext;
        if (files.includes(pathWithExt)) {
          return pathWithExt;
        }
      }
    }

    // Try with /index.* if it's a directory
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, `index${ext}`);
      if (files.includes(indexPath)) {
        return indexPath;
      }
    }
  }

  // For non-relative imports, we can't resolve without a module map
  // Return null for now
  return null;
}

/**
 * Build indirect dependency map from prop flows
 */
function buildIndirectDependencies(parseResults) {
  const indirectDeps = {};

  // Analyze component props and state usage
  for (const file of Object.keys(parseResults)) {
    indirectDeps[file] = [];
    const result = parseResults[file];

    // Look for prop drilling patterns
    // This is a simplified approach - a real implementation would
    // need to analyze the AST for prop passing between components

    // For now, we'll use a heuristic: if component A imports component B
    // and passes props to it, we consider it an indirect dependency
    for (const imp of result.imports) {
      const propPattern = new RegExp(`<${imp.name}[^>]*\\s+\\w+={`);
      if (result.content && propPattern.test(result.content)) {
        indirectDeps[file].push(imp.source);
      }
    }
  }

  return indirectDeps;
}

/**
 * Detect circular dependencies in dependency graph
 */
function detectCircularDependencies(directDeps) {
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();

  // Helper function for DFS
  function dfs(node, path = []) {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      cycles.push(cycle);
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = directDeps[node] || [];
    for (const neighbor of neighbors) {
      dfs(neighbor, [...path]);
    }

    recursionStack.delete(node);
  }

  // Run DFS from each node
  for (const node of Object.keys(directDeps)) {
    dfs(node);
  }

  return cycles;
}

/**
 * Identify central components in the application
 * These are components that many others depend on
 */
function identifyCentralComponents(dependencyMap) {
  // Identify components with high in-degree
  const componentScores = {};

  // Count direct dependencies
  Object.entries(dependencyMap.direct).forEach(([file, deps]) => {
    deps.forEach(dep => {
      componentScores[dep] = (componentScores[dep] || 0) + 1;
    });
  });

  // Count indirect dependencies with lower weight
  Object.entries(dependencyMap.indirect).forEach(([file, deps]) => {
    deps.forEach(dep => {
      componentScores[dep] = (componentScores[dep] || 0) + 0.5;
    });
  });

  // Sort by score and return top components
  return Object.entries(componentScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([file, score]) => ({ file, score }));
}

/**
 * Identify isolated components with few connections
 */
function identifyIsolatedComponents(dependencyMap) {
  // Create a map to track both incoming and outgoing connections
  const connectionCounts = {};

  // Initialize counts for all files
  const allFiles = new Set([
    ...Object.keys(dependencyMap.direct),
    ...Object.values(dependencyMap.direct).flat()
  ]);

  allFiles.forEach(file => {
    connectionCounts[file] = {
      incoming: 0,
      outgoing: 0,
      total: 0
    };
  });

  // Count outgoing connections (direct dependencies)
  Object.entries(dependencyMap.direct).forEach(([file, deps]) => {
    connectionCounts[file].outgoing += deps.length;

    // Count incoming connections for each dependency
    deps.forEach(dep => {
      if (connectionCounts[dep]) {
        connectionCounts[dep].incoming += 1;
      }
    });
  });

  // Count indirect connections with lower weight
  Object.entries(dependencyMap.indirect).forEach(([file, deps]) => {
    connectionCounts[file].outgoing += deps.length * 0.5;

    // Count incoming indirect connections
    deps.forEach(dep => {
      if (connectionCounts[dep]) {
        connectionCounts[dep].incoming += 0.5;
      }
    });
  });

  // Calculate total connections
  Object.keys(connectionCounts).forEach(file => {
    connectionCounts[file].total = 
      connectionCounts[file].incoming + connectionCounts[file].outgoing;
  });

  // Identify components with low connectivity
  // Consider a component isolated if it has fewer than 2 total connections
  // or if it has no incoming connections (nothing depends on it)
  const isolatedComponents = Object.entries(connectionCounts)
    .filter(([file, counts]) => {
      return counts.total < 2 || counts.incoming === 0;
    })
    .map(([file, counts]) => ({
      file,
      connections: counts.total,
      incoming: counts.incoming,
      outgoing: counts.outgoing,
      reason: counts.total < 2 ? 'few connections' : 'no dependents'
    }))
    .sort((a, b) => a.connections - b.connections);

  return isolatedComponents;
}