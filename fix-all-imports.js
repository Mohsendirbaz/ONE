#!/usr/bin/env node
// Script to fix all import issues at once

const fs = require('fs');
const path = require('path');

// Fix 1: Create missing component files
const missingComponents = [
  'src/components/truly_extended_scaling/CoordinateContainerEnhanced.js',
  'src/components/truly_extended_scaling/MultiZoneSelector.js', 
  'src/components/truly_extended_scaling/BoundaryDownloader.js',
  'src/components/truly_extended_scaling/UnifiedTooltip.js',
  'src/styles/HomePage.CSS/TensorCapacityVisualization.css',
  'src/styles/HomePage.CSS/UnifiedTooltip.css'
];

missingComponents.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (file.endsWith('.js')) {
      // Create placeholder React component
      const componentName = path.basename(file, '.js');
      fs.writeFileSync(filePath, `// Placeholder for ${componentName}
import React from 'react';

const ${componentName} = ({ children, ...props }) => {
  return <div {...props}>{children || '${componentName} Placeholder'}</div>;
};

export default ${componentName};`);
    } else if (file.endsWith('.css')) {
      // Create placeholder CSS
      fs.writeFileSync(filePath, `/* Placeholder for ${path.basename(file)} */
.placeholder {
  /* Temporary styles */
}`);
    }
    console.log(`Created: ${file}`);
  }
});

// Fix 2: Update incorrect imports
const importFixes = [
  {
    file: 'src/components/truly_extended_scaling/ExtendedScaling.js',
    fixes: [
      { old: "import ClimateModule from './ClimateModule';", new: "import ClimateModule from './climate-module-enhanced';" },
      { old: "import CoordinateContainer from './CoordinateContainer';", new: "import CoordinateContainer from './coordinate-container-enhanced';" }
    ]
  },
  {
    file: 'src/components/editors/MatrixValueEditor.js',
    fixes: [
      { old: "import '../../../styles/", new: "import '../../styles/" }
    ]
  },
  {
    file: 'src/HomePage.js',
    fixes: [
      { old: "import ExtendedScaling from 'src/components/truly_extended_scaling/ExtendedScaling';", new: "import ExtendedScaling from './components/truly_extended_scaling/ExtendedScaling';" },
      { old: "import CentralScalingTab from 'src/components/truly_extended_scaling/CentralScalingTab';", new: "import CentralScalingTab from './components/truly_extended_scaling/CentralScalingTab';" },
      { old: "import SensitivityMonitor from", new: "import { SensitivityMonitor } from" }
    ]
  },
  {
    file: 'src/components/truly_extended_scaling/climate-module-enhanced.js',
    fixes: [
      { old: "import CoordinateContainerEnhanced from './CoordinateContainerEnhanced';", new: "import CoordinateContainerEnhanced from './coordinate-container-enhanced';" }
    ]
  },
  {
    file: 'src/components/truly_extended_scaling/coordinate-container-enhanced.js',
    fixes: [
      { old: "import MultiZoneSelector from './MultiZoneSelector';", new: "import MultiZoneSelector from './multi-zone-selector';" },
      { old: "import BoundaryDownloader from './BoundaryDownloader';", new: "import BoundaryDownloader from './boundary-downloader';" }
    ]
  },
  {
    file: 'src/components/truly_extended_scaling/multi-zone-selector.js',
    fixes: [
      { old: "import UnifiedTooltip from './UnifiedTooltip';", new: "import UnifiedTooltip from './UnifiedTooltip';" }
    ]
  }
];

importFixes.forEach(({ file, fixes }) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    fixes.forEach(({ old, new: newStr }) => {
      if (content.includes(old)) {
        content = content.replace(old, newStr);
        console.log(`Fixed import in ${file}: ${old} -> ${newStr}`);
      }
    });
    fs.writeFileSync(filePath, content);
  }
});

// Fix 3: Add missing exports
const exportFixes = [
  {
    file: 'src/utils/react_parser.js',
    exports: ['parseComponent']
  },
  {
    file: 'src/components/modules/SensitivityMonitor.js', 
    changeToNamed: true
  }
];

exportFixes.forEach(({ file, exports: exportNames, changeToNamed }) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (changeToNamed) {
      // Change default export to named export
      content = content.replace(/export default (\w+);?$/, 'export { $1 };');
      console.log(`Changed to named export in ${file}`);
    } else if (exportNames) {
      // Add missing exports
      exportNames.forEach(name => {
        if (!content.includes(`export { ${name} }`) && !content.includes(`export ${name}`)) {
          // Add placeholder function if it doesn't exist
          if (!content.includes(`function ${name}`) && !content.includes(`const ${name}`)) {
            content = `// Placeholder function
const ${name} = () => {
  console.warn('${name} is a placeholder function');
  return null;
};

${content}`;
          }
          // Add export
          content += `\nexport { ${name} };`;
          console.log(`Added export for ${name} in ${file}`);
        }
      });
    }
    
    fs.writeFileSync(filePath, content);
  }
});

console.log('\nAll import fixes applied!');
console.log('\nNote: You still need to install missing npm packages:');
console.log('npm install react-tabs react-dnd react-dnd-html5-backend framer-motion prop-types uuid chroma-js d3 react-leaflet react-leaflet-draw');