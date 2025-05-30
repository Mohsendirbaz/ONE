#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Pre-build import validation script
const validateImports = () => {
  const errors = [];
  const warnings = [];
  
  // Common import issues to check
  const commonIssues = [
    { pattern: /import\s+\w+\s+from\s+['"]\.\.\/utils\.js['"]/, fix: "Check if utils.js exports a default export" },
    { pattern: /from\s+['"]\.\/ClimateModule['"]/, fix: "Change to './climate-module-enhanced'" },
    { pattern: /from\s+['"]\.\/CoordinateContainer['"]/, fix: "Change to './coordinate-container-enhanced'" },
    { pattern: /from\s+['"]\.\.\/.{3,}\//, fix: "Check if import goes outside src/" }
  ];
  
  const checkFile = (filePath) => {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      commonIssues.forEach(({ pattern, fix }) => {
        if (pattern.test(line)) {
          warnings.push({
            file: filePath,
            line: index + 1,
            issue: line.trim(),
            fix
          });
        }
      });
    });
  };
  
  const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile()) {
        checkFile(fullPath);
      }
    });
  };
  
  // Check src directory
  const srcPath = path.join(__dirname, '..', 'src');
  if (fs.existsSync(srcPath)) {
    walkDir(srcPath);
  }
  
  // Output results
  if (warnings.length > 0) {
    console.log('⚠️  Import warnings found:');
    warnings.forEach(w => {
      console.log(`  ${w.file}:${w.line} - ${w.fix}`);
    });
  }
  
  return errors.length === 0;
};

// Run validation
if (require.main === module) {
  const valid = validateImports();
  process.exit(valid ? 0 : 1);
}

module.exports = validateImports;