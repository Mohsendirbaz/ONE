import React from 'react';
import ReactDOM from 'react-dom/client';
import TaskSchedulerApp from './web/TaskSchedulerApp';

console.log('[DEBUG] Initializing junie-intellij-plugin application');

// Create a root element to render our app
const root = ReactDOM.createRoot(document.getElementById('root'));
console.log('[DEBUG] Root element created');

// Render the TaskSchedulerApp component
console.log('[DEBUG] Rendering TaskSchedulerApp component');
root.render(
  <React.StrictMode>
    <TaskSchedulerApp />
  </React.StrictMode>
);
console.log('[DEBUG] TaskSchedulerApp rendered');
