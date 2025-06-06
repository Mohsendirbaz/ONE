import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './home';

console.log('[DEBUG] Probing-new application starting...');

// Create a root element to render our app
const root = ReactDOM.createRoot(document.getElementById('root') || document.createElement('div'));

// Render the Home component
root.render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
