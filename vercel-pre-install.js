#!/usr/bin/env node

// NUCLEAR PRE-INSTALL - Remove problematic dependencies before install
const fs = require('fs');
const path = require('path');

console.log('🔥 NUCLEAR PRE-INSTALL: Sanitizing package.json...');

const packagePath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Remove ALL potentially problematic dependencies
const problematicDeps = [
  'framer-motion',
  'mathjs',
  'firebase',
  'aws-sdk',
  'puppeteer',
  'electron',
  'electron-builder',
  'python-shell',
  'express',
  'body-parser',
  'multer',
  'cors',
  'subprocess',
  '@react-navigation/native',
  '@react-navigation/stack'
];

// Remove from dependencies
if (pkg.dependencies) {
  problematicDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      console.log(`  ❌ Removing dependency: ${dep}`);
      delete pkg.dependencies[dep];
    }
  });
}

// Remove from devDependencies
if (pkg.devDependencies) {
  problematicDeps.forEach(dep => {
    if (pkg.devDependencies[dep]) {
      console.log(`  ❌ Removing devDependency: ${dep}`);
      delete pkg.devDependencies[dep];
    }
  });
}

// Write sanitized package.json
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));

console.log('✅ Package.json sanitized successfully!');

// Create a package-lock.json if it doesn't exist
const lockPath = path.join(__dirname, 'package-lock.json');
if (!fs.existsSync(lockPath)) {
  console.log('📝 Creating minimal package-lock.json...');
  fs.writeFileSync(lockPath, JSON.stringify({
    "name": pkg.name,
    "version": pkg.version,
    "lockfileVersion": 2,
    "requires": true,
    "packages": {
      "": {
        "name": pkg.name,
        "version": pkg.version,
        "dependencies": pkg.dependencies || {},
        "devDependencies": pkg.devDependencies || {}
      }
    }
  }, null, 2));
}

console.log('🚀 Pre-install complete!');