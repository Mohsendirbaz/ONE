import React from 'react';
import * as ReactParser from './react_parser';
import * as DependencyMapper from './dependency_mapper';
import * as PropFlowAnalyzer from './prop_flow_analyzer';
import * as HookAnalyzer from './hook_analyzer';

/**
 * Comprehensive code entity analyzer tailored for React financial applications
 * Analyzes component relationships, state flows, and dependency structures
 */
export class EntityAnalyzer {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || '.';
    this.excludeDirs = options.excludeDirs || ['node_modules', 'build', 'dist'];
    this.includeNodeModules = options.includeNodeModules || false;
    this.analysisDepth = options.analysisDepth || 3;
    this.analysisResults = {
      components: {},
      hooks: {},
      contexts: {},
      imports: {},
      exports: {},
      propFlows: {},
      stateManagement: {}
    };
  }
  
  /**
   * Analyze the entire project structure
   * @returns {Object} Analysis results
   */
  async analyzeProject() {
    try {
      // Phase 1: File discovery
      const files = await this._discoverFiles();
      
      // Phase 2: Parse React components and modules
      for (const file of files) {
        await this._parseFile(file);
      }
      
      // Phase 3: Build relationship maps
      this._buildRelationshipMaps();
      
      // Phase 4: Analyze component prop flows
      await PropFlowAnalyzer.analyzeComponentPropFlows(this.analysisResults);
      
      // Phase 5: Analyze hook usage patterns
      await HookAnalyzer.analyzeHookUsage(this.analysisResults);
      
      return this.analysisResults;
    } catch (error) {
      console.error('Error analyzing project:', error);
      throw error;
    }
  }
  
  /**
   * Analyze specific component relationships
   * @param {string} componentName - Target component name
   * @returns {Object} Component relationship data
   */
  async analyzeComponent(componentName) {
    try {
      // Validate input
      if (!componentName || typeof componentName !== 'string') {
        throw new Error('Component name must be a non-empty string');
      }
      
      // Check if we already have analysis results
      if (Object.keys(this.analysisResults.components).length === 0) {
        // If not, we need to do a partial analysis to find the component
        await this._discoverFiles();
      }
      
      // Find the component in our analysis results
      const component = this.analysisResults.components[componentName];
      if (!component) {
        throw new Error(`Component "${componentName}" not found in project`);
      }
      
      // Analyze component-specific relationships
      const relationships = {
        component: componentName,
        file: component.filePath,
        imports: component.imports || [],
        props: component.props || {},
        children: component.children || [],
        parents: component.parents || [],
        hooks: component.hooks || [],
        contexts: component.contexts || [],
        stateManagement: {}
      };
      
      // Analyze prop flows for this specific component
      relationships.propFlows = await PropFlowAnalyzer.analyzeComponentPropFlows(
        this.analysisResults, 
        componentName
      );
      
      // Analyze hook usage for this specific component
      relationships.hookUsage = await HookAnalyzer.analyzeHookUsage(
        this.analysisResults,
        componentName
      );
      
      // Analyze state management patterns
      if (component.hooks && component.hooks.includes('useState')) {
        relationships.stateManagement.local = true;
      }
      
      if (component.contexts && component.contexts.length > 0) {
        relationships.stateManagement.context = component.contexts;
      }
      
      if (component.imports && (
        component.imports.includes('redux') || 
        component.imports.includes('react-redux')
      )) {
        relationships.stateManagement.redux = true;
      }
      
      return relationships;
    } catch (error) {
      console.error(`Error analyzing component ${componentName}:`, error);
      throw error;
    }
  }
  
  /**
   * Discover all relevant files in project
   * @private
   * @returns {Promise<string[]>} List of discovered file paths
   */
  async _discoverFiles() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const glob = require('glob-promise');
      
      // Define patterns for React files
      const patterns = [
        '**/*.jsx',
        '**/*.js',
        '**/*.tsx',
        '**/*.ts'
      ];
      
      // Build exclude pattern
      const excludePattern = this.excludeDirs.map(dir => `!**/${dir}/**`);
      
      // If we're including node_modules, remove it from excludes
      const finalExcludes = this.includeNodeModules 
        ? excludePattern.filter(pattern => !pattern.includes('node_modules'))
        : excludePattern;
      
      // Combine patterns
      const allPatterns = [...patterns, ...finalExcludes];
      
      // Discover files
      const files = await glob(allPatterns, {
        cwd: this.projectRoot,
        absolute: true,
        nodir: true
      });
      
      console.log(`Discovered ${files.length} potential React files`);
      
      // Filter to only include React component files
      const reactFiles = [];
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          
          // Simple heuristic to identify React files
          if (
            content.includes('import React') || 
            content.includes('from "react"') || 
            content.includes("from 'react'") ||
            content.includes('extends Component') ||
            content.includes('React.') ||
            content.includes('useState') ||
            content.includes('useEffect')
          ) {
            reactFiles.push(file);
          }
        } catch (err) {
          console.warn(`Could not read file ${file}: ${err.message}`);
        }
      }
      
      console.log(`Identified ${reactFiles.length} React files for analysis`);
      return reactFiles;
    } catch (error) {
      console.error('Error discovering files:', error);
      throw error;
    }
  }
  
  /**
   * Parse individual file
   * @private
   * @param {string} filePath - Path to the file to parse
   * @returns {Promise<void>}
   */
  async _parseFile(filePath) {
    try {
      const fs = require('fs').promises;
      
      // Read the file content
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse the React components in the file
      const components = await ReactParser.parseComponents(content, filePath);
      
      // Parse imports and exports
      const { imports, exports } = await DependencyMapper.parseImportsAndExports(content, filePath);
      
      // Parse hooks
      const hooks = await ReactParser.parseHooks(content, filePath);
      
      // Parse contexts
      const contexts = await ReactParser.parseContexts(content, filePath);
      
      // Store the results
      for (const component of components) {
        this.analysisResults.components[component.name] = {
          ...component,
          filePath,
          imports,
          exports
        };
      }
      
      // Store hooks
      for (const hook of hooks) {
        this.analysisResults.hooks[hook.name] = {
          ...hook,
          filePath
        };
      }
      
      // Store contexts
      for (const context of contexts) {
        this.analysisResults.contexts[context.name] = {
          ...context,
          filePath
        };
      }
      
      // Store imports and exports at file level
      this.analysisResults.imports[filePath] = imports;
      this.analysisResults.exports[filePath] = exports;
      
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error);
      // Continue with other files even if one fails
    }
  }
  
  /**
   * Build relationship maps between entities
   * @private 
   */
  _buildRelationshipMaps() {
    try {
      // Build component parent-child relationships
      this._buildComponentHierarchy();
      
      // Build prop flow relationships
      this._buildPropFlowMap();
      
      // Build hook usage relationships
      this._buildHookUsageMap();
      
      // Build context usage relationships
      this._buildContextUsageMap();
      
      console.log('Built relationship maps successfully');
    } catch (error) {
      console.error('Error building relationship maps:', error);
      throw error;
    }
  }
  
  /**
   * Build component hierarchy (parent-child relationships)
   * @private
   */
  _buildComponentHierarchy() {
    const components = this.analysisResults.components;
    
    // Initialize children arrays for all components
    for (const componentName in components) {
      if (!components[componentName].children) {
        components[componentName].children = [];
      }
      if (!components[componentName].parents) {
        components[componentName].parents = [];
      }
    }
    
    // Identify parent-child relationships
    for (const componentName in components) {
      const component = components[componentName];
      
      // Check JSX in the component to find child components
      if (component.jsx) {
        for (const otherComponentName in components) {
          // Don't check against itself
          if (componentName === otherComponentName) continue;
          
          // Check if this component uses the other component in its JSX
          const pattern = new RegExp(`<${otherComponentName}[\\s/>]`, 'g');
          if (pattern.test(component.jsx)) {
            // Add child relationship
            if (!component.children.includes(otherComponentName)) {
              component.children.push(otherComponentName);
            }
            
            // Add parent relationship to the child
            if (!components[otherComponentName].parents.includes(componentName)) {
              components[otherComponentName].parents.push(componentName);
            }
          }
        }
      }
    }
  }
  
  /**
   * Build prop flow map
   * @private
   */
  _buildPropFlowMap() {
    const components = this.analysisResults.components;
    const propFlows = {};
    
    // Initialize prop flows
    for (const componentName in components) {
      propFlows[componentName] = {
        incoming: {},
        outgoing: {}
      };
    }
    
    // Map prop flows between components
    for (const componentName in components) {
      const component = components[componentName];
      
      // For each child component, identify props passed
      for (const childName of component.children || []) {
        const childComponent = components[childName];
        if (!childComponent) continue;
        
        // Extract props passed to this child from the JSX
        const propsPattern = new RegExp(`<${childName}\\s+([^>]+)>`, 'g');
        const matches = [...component.jsx.matchAll(propsPattern)];
        
        for (const match of matches) {
          const propsString = match[1];
          
          // Extract individual props
          const propMatches = [...propsString.matchAll(/(\w+)=\{([^}]+)\}/g)];
          
          for (const propMatch of propMatches) {
            const propName = propMatch[1];
            const propValue = propMatch[2];
            
            // Record outgoing prop from parent
            if (!propFlows[componentName].outgoing[childName]) {
              propFlows[componentName].outgoing[childName] = [];
            }
            propFlows[componentName].outgoing[childName].push({
              prop: propName,
              value: propValue
            });
            
            // Record incoming prop to child
            if (!propFlows[childName].incoming[componentName]) {
              propFlows[childName].incoming[componentName] = [];
            }
            propFlows[childName].incoming[componentName].push({
              prop: propName,
              value: propValue
            });
          }
        }
      }
    }
    
    this.analysisResults.propFlows = propFlows;
  }
  
  /**
   * Build hook usage map
   * @private
   */
  _buildHookUsageMap() {
    const components = this.analysisResults.components;
    const hooks = this.analysisResults.hooks;
    
    // For each component, identify hooks used
    for (const componentName in components) {
      const component = components[componentName];
      component.hooks = component.hooks || [];
      
      // Check for built-in React hooks
      const builtInHooks = [
        'useState', 'useEffect', 'useContext', 'useReducer',
        'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
        'useLayoutEffect', 'useDebugValue'
      ];
      
      for (const hook of builtInHooks) {
        const pattern = new RegExp(`\\b${hook}\\(`, 'g');
        if (pattern.test(component.content)) {
          if (!component.hooks.includes(hook)) {
            component.hooks.push(hook);
          }
        }
      }
      
      // Check for custom hooks
      for (const hookName in hooks) {
        if (hookName.startsWith('use') && hookName !== 'useEffect' && hookName !== 'useState') {
          const pattern = new RegExp(`\\b${hookName}\\(`, 'g');
          if (pattern.test(component.content)) {
            if (!component.hooks.includes(hookName)) {
              component.hooks.push(hookName);
            }
            
            // Add this component as a user of the hook
            hooks[hookName].usedBy = hooks[hookName].usedBy || [];
            if (!hooks[hookName].usedBy.includes(componentName)) {
              hooks[hookName].usedBy.push(componentName);
            }
          }
        }
      }
    }
  }
  
  /**
   * Build context usage map
   * @private
   */
  _buildContextUsageMap() {
    const components = this.analysisResults.components;
    const contexts = this.analysisResults.contexts;
    
    // For each component, identify contexts used
    for (const componentName in components) {
      const component = components[componentName];
      component.contexts = component.contexts || [];
      
      // Check for useContext usage
      const contextPattern = /useContext\(\s*(\w+)\s*\)/g;
      const matches = [...component.content.matchAll(contextPattern)];
      
      for (const match of matches) {
        const contextName = match[1];
        if (!component.contexts.includes(contextName)) {
          component.contexts.push(contextName);
        }
        
        // Add this component as a consumer of the context
        if (contexts[contextName]) {
          contexts[contextName].consumers = contexts[contextName].consumers || [];
          if (!contexts[contextName].consumers.includes(componentName)) {
            contexts[contextName].consumers.push(componentName);
          }
        }
      }
      
      // Check for Context.Provider usage
      for (const contextName in contexts) {
        const providerPattern = new RegExp(`<\\s*${contextName}.Provider\\b`, 'g');
        if (providerPattern.test(component.content)) {
          // Add this component as a provider of the context
          contexts[contextName].providers = contexts[contextName].providers || [];
          if (!contexts[contextName].providers.includes(componentName)) {
            contexts[contextName].providers.push(componentName);
          }
        }
      }
    }
  }
}