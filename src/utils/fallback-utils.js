// Fallback utils module to handle missing default exports
const utils = {
  // Common utility functions that might be expected
  noop: () => {},
  identity: (x) => x,
  isObject: (obj) => obj !== null && typeof obj === 'object',
  isFunction: (fn) => typeof fn === 'function',
  isString: (str) => typeof str === 'string',
  isNumber: (num) => typeof num === 'number',
  // Add more utilities as needed
};

// Export as default
export default utils;

// Also export named exports for compatibility
export const { noop, identity, isObject, isFunction, isString, isNumber } = utils;