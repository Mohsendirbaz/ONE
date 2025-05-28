# Probing Module

A comprehensive tool for code and financial entity analysis.

## Overview

This module provides a unified interface for:
- Financial entity visualizations
- Code entity analysis
- File associations
- Insights generation

## Project Structure

The project follows standard React application structure:

```
probing-new/
├── node_modules/       # Dependencies (generated when npm install is run)
├── public/             # Static files
│   └── index.html      # Main HTML file
├── src/                # Source code
│   ├── index.js        # Entry point
│   ├── home.js         # Main component
│   ├── home.css        # Styles for Home component
│   ├── integration_ui.js # Integration UI component
│   ├── integration_ui.css # Styles for Integration UI
│   ├── financial_entity_visualizations/ # Financial entity visualization components
│   │   └── visualization_component.js   # Visualization component
│   ├── code-entity-analyzer/            # Code entity analyzer components
│   │   └── integration/                 # Integration components
│   │       └── code_analyzer_component.js # Code analyzer component
│   ├── file_associations/               # File associations components
│   │   └── file_associations_component.js # File associations component
│   └── insights_generator/              # Insights generator components
│       └── insights_component.js        # Insights component
├── package.json        # Project configuration
└── package-lock.json   # Dependency lock file
```

## Key Improvements

This new module structure addresses several issues that existed in the previous version:

1. **Self-Contained Module**: All components are now contained within the src directory, eliminating the need for imports from outside the src directory which caused React build errors.

2. **Eliminated Duplicate Directories**: Removed duplicate `node_modules` and `public` directories that were previously inside the `src` directory.

3. **Simplified Configuration**: Consolidated all configuration files at the root level, following React best practices.

4. **Clean Separation of Concerns**: Properly organized code with clear separation between components, styles, and configuration.

5. **Removed Proxy Files**: Eliminated unnecessary proxy files and backups that were causing confusion.

6. **Independent Launch**: The module can now be launched independently without navigating to subdirectories.

7. **Integrated All Components**: Ensured that all necessary components (financial_entity_visualizations, code-entity-analyzer, file_associations, and insights_generator) are properly integrated into the probing-new module.

8. **Modern, Responsive UI**: All components now have dedicated CSS files with:
   - Responsive design that works across all device sizes
   - Clear visual hierarchy and consistent styling
   - Interactive elements with hover and active states
   - Visual feedback for loading, errors, and success states
   - Animations for improved user experience

9. **Centralized Data Flow**: All data now flows through a single pipeline, eliminating the need for manual file transfers or imports.

10. **Automatic Updates**: The system automatically detects changes in files and updates all connected components.

11. **Direct Analysis**: Components can directly trigger analyses without relying on temporary files or manual steps.

## Usage

To run the probing module:

```bash
cd probing-new
npm install
npm start
```

This will start the development server and open the application in your default browser.

## Dependencies

- React 18
- React DOM
- React Scripts
- React Tabs
- PropTypes
- Axios
