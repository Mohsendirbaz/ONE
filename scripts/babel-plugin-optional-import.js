// Babel plugin to handle optional imports
module.exports = function() {
  return {
    visitor: {
      ImportDeclaration(path, state) {
        const source = path.node.source.value;
        const missingModules = state.opts.missingModules || [];
        
        if (missingModules.includes(source)) {
          // Replace with a safe fallback import
          path.replaceWithSourceString(`
            const ${path.node.specifiers[0].local.name} = {};
          `);
        }
      }
    }
  };
};