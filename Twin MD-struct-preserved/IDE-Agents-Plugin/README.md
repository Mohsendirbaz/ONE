# Junie IntelliJ Plugin Web Interface

A React-based web interface for the Junie IntelliJ Plugin, providing a Task Scheduling and Deployment Interface for AI agents.

## Overview

This module provides a standalone web interface for the Task Scheduling and Deployment functionality of the Junie IntelliJ Plugin. It allows users to:

- Manage tasks with different views (List, Calendar, Kanban, Bundles)
- Create and deploy tasks to different AI agents (Architect, Observer, Code Editor)
- Create and manage task bundles for efficient processing
- Monitor agent status and utilization

## Project Structure

The project follows standard React application structure:

```
junie-intellij-plugin/
├── node_modules/       # Dependencies (generated when npm install is run)
├── public/             # Static files
│   └── index.html      # Main HTML file
├── src/                # Source code
│   ├── index.js        # Entry point
│   └── web/            # Web components
│       ├── TaskSchedulerApp.js             # Main application component
│       ├── TaskSchedulerViews.js           # UI components for different views
│       └── TaskSchedulerViewComponents.js   # View-specific components
├── package.json        # Project configuration
└── README.md           # This file
```

## Key Improvements

This new module structure addresses several issues that existed in the previous version:

1. **Independent Launch**: The module can now be launched independently with `npm start` without navigating to subdirectories.

2. **Self-Contained Module**: All components are now contained within the src directory, following React best practices.

3. **Clean Separation of Concerns**: Properly organized code with clear separation between components.

4. **Proper React Application Structure**: Follows standard React application structure with package.json, public directory, and src directory.

## Usage

To run the web interface:

```bash
cd junie-intellij-plugin
npm install
npm start
```

This will start the development server and open the application in your default browser.

## Dependencies

- React 18
- React DOM
- React Scripts
- Tailwind CSS (via CDN for development)

## Integration with IntelliJ Plugin

This web interface is designed to work with the Junie IntelliJ Plugin. When used within the plugin, it provides a UI for the multi-agent system that helps with task scheduling and deployment.

The standalone version allows for development and testing of the interface without needing to run the full IntelliJ plugin.