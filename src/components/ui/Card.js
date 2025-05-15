import React from 'react';
import '../../styles/HomePage.CSS/Consolidated.css';

/**
 * @file Card.js
 * @description UI components for card-based layouts
 * @module components/ui/Card
 * @requires react
 */

/**
 * Card Component for UI layouts
 */
export const Card = ({ children, className = '', ...props }) => (
    <div className={`card ${className}`} {...props}>
        {children}
    </div>
);

/**
 * CardHeader Component for UI layouts
 */
export const CardHeader = ({ children, className = '', ...props }) => (
    <div className={`card-header ${className}`} {...props}>
        {children}
    </div>
);

/**
 * CardContent Component for UI layouts
 */
export const CardContent = ({ children, className = '', ...props }) => (
    <div className={`card-content ${className}`} {...props}>
        {children}
    </div>
);