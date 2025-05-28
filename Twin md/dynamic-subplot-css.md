# Dynamic Subplot CSS Documentation

## Overview
The `dynamic-subplot-css.css` file provides comprehensive styling for a dynamic subplot component designed for data visualization. This component features a two-panel layout with selection controls on the left and visualization display on the right, with full responsive design and theme support.

## Component Architecture

### Main Container
```css
.dynamic-subplot-container
```
- **Layout**: Flexbox row with 20px gap
- **Responsive**: Switches to column layout on screens ≤1024px
- **Typography**: Uses system font stack with fallbacks

## Selection Panel

### Panel Structure
```css
.subplot-selection-panel
```
- **Dimensions**:
  - Flex: 1 (grows to fill space)
  - Min width: 300px
  - Max width: 400px
- **Styling**:
  - 20px padding
  - Light background with rounded corners
  - Subtle shadow for depth

### Panel Header
```css
.subplot-selection-panel h3
```
- 18px font size
- Bottom border for separation
- No top margin for tight spacing

### Error Handling
```css
.error-message
```
- **Visual Design**:
  - Red-tinted background
  - 4px left border for emphasis
  - Rounded corners
- **Typography**: 14px font size
- **Spacing**: 16px bottom margin

### Selection Controls
```css
.selection-controls
```
- **Layout**: Flexbox with space-between
- **Features**:
  - 10px gap between buttons
  - Equal button sizing (flex: 1)

#### Button Types
Three button variants with distinct styling:

1. **Base Selection Button**
   ```css
   .selection-button
   ```
   - Neutral gray background
   - No borders for clean appearance
   - Smooth hover transitions

2. **Select All Button**
   ```css
   .selection-button.select-all
   ```
   - Blue-tinted background
   - Primary blue text color
   - Lighter blue on hover

3. **Deselect All Button**
   ```css
   .selection-button.deselect-all
   ```
   - Very light gray background
   - Darker gray text
   - Standard gray on hover

### Subplot Options List
```css
.subplot-options
```
- **Scrolling**: Max height 400px with vertical scroll
- **Border**: 1px solid border with rounded corners
- **Purpose**: Contains selectable subplot items

#### Individual Options
```css
.subplot-option
```
- **Layout**: Column flexbox with 4px gap
- **Styling**:
  - 12px padding
  - Bottom border (except last item)
  - Hover and selected states
- **Interaction**:
  - Cursor pointer
  - Background color changes on hover/selection

#### Option Components
1. **Checkbox Container**
   ```css
   .option-checkbox
   ```
   - Flexbox row with 8px gap
   - Aligned checkbox and label

2. **Option Label**
   ```css
   .option-checkbox label
   ```
   - Medium weight (500)
   - 15px font size
   - Clickable cursor

3. **Option Description**
   ```css
   .option-description
   ```
   - Indented 24px from left
   - Smaller, secondary text color
   - Contains abbreviation tags

4. **Abbreviation Tags**
   ```css
   .option-description .abbreviation
   ```
   - Bold text with accent color
   - Pill-shaped background
   - Small font size (12px)

### Selection Information
```css
.selection-info
```
- **Purpose**: Displays current selection summary
- **Styling**:
  - Light background
  - 12px padding
  - 13px font size
  - Secondary text color

### Action Buttons
```css
.action-button
```
- **Base Styling**:
  - 10px/16px padding
  - No borders
  - 500 font weight
  - 200px minimum width

#### Generate Button
```css
.action-button.generate
```
- Primary blue background
- White text
- Shadow effect on hover
- Darker blue on hover

#### Disabled State
```css
.action-button:disabled
```
- Gray background and text
- No cursor interaction
- No shadow effects

## Visualization Panel

### Panel Structure
```css
.subplot-visualization-panel
```
- **Layout**: 
  - Flex: 2 (twice the size of selection panel)
  - Column flexbox
  - Allows content shrinking
- **Styling**: Same as selection panel

### Album Selection
```css
.album-selection
```
- **Layout**: Flexbox row with 12px gap
- **Components**:
  - Fixed-width label
  - Flexible select dropdown

#### Dropdown Styling
```css
.album-selection select
```
- Flex: 1 for full width
- 8px padding
- White background
- Standard border styling

### Content States

#### No Albums Message
```css
.no-albums-message
```
- Centered text
- 24px padding
- Light background
- Italic, secondary text

#### Visualization Content
```css
.visualization-content
```
- **Layout**:
  - Flex: 1 to fill space
  - 500px minimum height
  - Relative positioning
- **Styling**:
  - White background
  - Border and rounded corners
  - Hidden overflow

#### Loading State
```css
.loading-indicator
```
- **Positioning**: Absolute overlay
- **Layout**: Centered content
- **Appearance**:
  - Semi-transparent white overlay
  - 16px font size
  - Secondary text color

#### IFrame Container
```css
.visualization-iframe
```
- Full width and height
- 500px minimum height
- No borders

#### No Content State
```css
.no-content-message
```
- Centered content
- Full height display
- Light background
- Italic text style

## Theme System

### CSS Variables
The component defines comprehensive CSS variables with fallbacks:

#### Typography
- `--font-family`: System font stack

#### Colors
- Layout colors (panels, backgrounds)
- Text colors (primary, secondary)
- Action colors (buttons, states)
- Semantic colors (error, disabled)
- Interactive states (hover, selected)

### Dark Theme Support
```css
.dark-theme, [data-theme="dark"]
```
- **Color Adjustments**:
  - Darker panel backgrounds (#2a2a2a)
  - Lighter text colors (#e0e0e0)
  - Adjusted accent colors
  - Modified hover states
- **Maintains**: Color relationships and hierarchy

## Responsive Design

### Desktop (>1024px)
- Side-by-side panel layout
- Fixed panel proportions
- Full feature set

### Tablet/Mobile (≤1024px)
- Stacked panel layout
- Full-width panels
- Maintained functionality

## Interaction Patterns

1. **Selection Flow**:
   - Hover highlights options
   - Click toggles selection
   - Visual feedback for all states

2. **Button States**:
   - Normal, hover, disabled
   - Clear visual hierarchy
   - Consistent interaction patterns

3. **Error Handling**:
   - Prominent error display
   - Clear visual distinction
   - Contextual placement

## Performance Optimizations

1. **Transitions**: Limited to essential properties
2. **Flexbox**: Efficient layout calculations
3. **Overflow**: Controlled scrolling areas
4. **Font Loading**: System font fallbacks

## Accessibility Features

1. **Color Contrast**: Meets WCAG standards
2. **Interactive Elements**: Clear focus states
3. **Text Sizing**: Readable at all sizes
4. **State Communication**: Visual and semantic

## Best Practices

1. **Selection Management**: Use provided button classes for consistency
2. **Error Display**: Utilize error-message class for user feedback
3. **Loading States**: Show loading indicator during async operations
4. **Theme Support**: Rely on CSS variables for theme compatibility
5. **Responsive Design**: Test on various screen sizes