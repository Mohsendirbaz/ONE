import React from 'react';
import ReactDOM from 'react-dom/client';
import TaskSchedulerApp from './web/TaskSchedulerApp';

// Create a root element to render our app
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the TaskSchedulerApp component
root.render(
  <React.StrictMode>
    <TaskSchedulerApp />
  </React.StrictMode>
);