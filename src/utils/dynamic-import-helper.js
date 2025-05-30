// Dynamic import helper with fallbacks
export const dynamicImportWithFallback = async (importPath, fallbackComponent = null) => {
  try {
    const module = await import(importPath);
    return module.default || module;
  } catch (error) {
    console.warn(`Failed to import ${importPath}:`, error.message);
    
    // Return fallback component or a placeholder
    if (fallbackComponent) {
      return fallbackComponent;
    }
    
    // Return a generic placeholder component
    return () => {
      const React = require('react');
      return React.createElement('div', {
        style: { padding: '20px', background: '#f0f0f0', border: '1px dashed #ccc' }
      }, `Component "${importPath}" failed to load`);
    };
  }
};

// Helper for lazy loading with fallback
export const lazyWithFallback = (importFn, fallbackComponent = null) => {
  const React = require('react');
  
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.warn('Lazy import failed:', error);
      
      // Return a module-like object with default export
      return {
        default: fallbackComponent || (() => React.createElement('div', null, 'Loading failed'))
      };
    }
  });
};

// Common missing imports registry
export const registerMissingImport = (path, replacement) => {
  if (typeof window !== 'undefined') {
    window.__missingImports = window.__missingImports || {};
    window.__missingImports[path] = replacement;
  }
};

// Get replacement for missing import
export const getMissingImportReplacement = (path) => {
  if (typeof window !== 'undefined' && window.__missingImports) {
    return window.__missingImports[path];
  }
  return null;
};