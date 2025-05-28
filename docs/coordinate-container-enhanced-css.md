# Coordinate Container Enhanced CSS Documentation

## Overview
The `coordinate-container-enhanced-css.css` file provides comprehensive styling for an enhanced coordinate container component. This component appears to be designed for managing geographic or spatial coordinates with support for single zone, multiple zones, and boundary views.

## Component Structure

### Main Container
```css
.coordinate-container-enhanced
```
- **Purpose**: Main wrapper for the coordinate container component
- **Layout**: Flexbox column layout
- **Styling**:
  - Full width with white background
  - 8px rounded corners
  - 1px solid border (#ddd)
  - Hidden overflow for clean edges
  - 20px bottom margin for spacing

### Header Section
```css
.coordinate-container-header
```
- **Purpose**: Contains the main title and navigation tabs
- **Styling**:
  - 16px vertical and 20px horizontal padding
  - Light gray background (#f5f5f5)
  - Bottom border separation

#### Header Title
```css
.coordinate-container-header h2
```
- **Typography**:
  - 20px font size
  - 600 font weight (semi-bold)
  - Dark gray color (#333)
  - 12px bottom margin

### Tab Navigation
```css
.coordinate-container-tabs
```
- **Purpose**: Tab navigation for switching between views
- **Layout**: Flexbox row
- **Features**:
  - White background
  - Bottom border for separation
  - Negative margins to extend to container edges

#### Individual Tabs
```css
.coordinate-tab
```
- **Interactive States**:
  - **Default**: Transparent background, 3px transparent bottom border
  - **Hover**: Light gray background (#f5f5f5)
  - **Active**: Green bottom border (#4caf50) with matching text color
- **Styling**:
  - 12px vertical, 20px horizontal padding
  - 500 font weight (medium)
  - 14px font size
  - Smooth transitions (0.2s ease)

### Content Area
```css
.coordinate-container-content
```
- **Purpose**: Main content display area
- **Layout**:
  - 20px padding
  - Minimum height of 400px
  - Flexible container for different view types

### View Types
Three distinct view layouts are supported:

#### Single View
```css
.coordinate-single-view
```
- Column layout with 20px gap between elements

#### Multi View
```css
.coordinate-multi-view
```
- Column layout with 20px gap between elements
- Includes action buttons for zone management

#### Boundary View
```css
.coordinate-boundary-view
```
- Column layout with 20px gap between elements
- Includes boundary options panel

### Multi-View Actions
```css
.multi-view-actions
```
- **Purpose**: Container for action buttons in multi-view mode
- **Styling**:
  - Centered content
  - 20px top margin
  - 16px padding
  - Light gray background with rounded corners

#### Add Zones Button
```css
.add-zones-button
```
- **Appearance**:
  - Green background (#4caf50) with white text
  - 12px vertical, 24px horizontal padding
  - 4px rounded corners
  - 14px font size, 500 weight
- **Interaction**:
  - Darker green on hover (#388e3c)
  - Smooth transition effect

### Boundary Options Panel
```css
.boundary-options-panel
```
- **Purpose**: Configuration panel for boundary-related options
- **Styling**:
  - Very light gray background (#f9f9f9)
  - 8px rounded corners
  - 20px padding
  - 1px border (#eee)
  - 20px top margin

#### Panel Header
```css
.boundary-options-panel h3
```
- 16px font size
- 600 font weight
- Bottom border for separation

#### Option Groups
```css
.boundary-option-group
```
- 12px bottom margin for spacing between groups

```css
.boundary-option-label
```
- Flexbox layout for checkbox alignment
- Clickable cursor
- 8px spacing between checkbox and label

#### Format Checkboxes
```css
.format-checkboxes
```
- **Layout**: 2-column grid
- **Spacing**: 10px gap
- **Responsive**: Collapses to single column on mobile

## Responsive Design

### Tablet and Mobile (max-width: 768px)
- **Tab Navigation**:
  - Horizontal scrolling enabled
  - No text wrapping
  - Reduced padding (12px vertical, 16px horizontal)
  - Smaller font size (13px)
- **Format Checkboxes**:
  - Single column layout instead of two columns

## Color Scheme
- **Primary Action Color**: Green (#4caf50)
- **Hover State**: Darker green (#388e3c)
- **Backgrounds**: 
  - White (#fff) for main content
  - Light gray (#f5f5f5) for headers and actions
  - Very light gray (#f9f9f9) for options panels
- **Borders**: Light gray (#ddd) and very light gray (#eee)
- **Text**: Dark gray (#333) for primary text, medium gray (#555) for secondary

## Usage Notes
1. The component supports three distinct view modes: single, multi, and boundary
2. Tab navigation provides clear visual feedback for the active state
3. The design is responsive and adapts well to smaller screens
4. Action buttons and options are clearly styled for user interaction
5. The component maintains consistent spacing and visual hierarchy throughout

## Accessibility Considerations
- Clear hover states for interactive elements
- Sufficient color contrast for text readability
- Logical tab order for keyboard navigation
- Visual feedback for active states