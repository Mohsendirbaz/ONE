# CustomizableTable CSS Documentation

## Overview
The `CustomizableTable.css` file provides comprehensive styling for enhanced table components with theme variable support. It implements a sophisticated table design system that adapts to different themes (light, dark, creative) and includes special styling for financial data visualization.

## Core Table Structure

### Base Table
```css
.custom-table
```
- **Layout**: 
  - Full width with separate border spacing
  - Rounded corners with hidden overflow
  - Sticky header support
- **Styling**:
  - Uses CSS variables for theme adaptability
  - Neumorphic design with subtle shadows
  - Card-like appearance with background and borders

### Table Header
```css
.custom-table th
```
- **Features**:
  - Sticky positioning for scroll support
  - Gradient background using theme variables
  - Semi-bold text (600 weight)
  - Interactive hover states
- **Styling**:
  - 12px vertical, 16px horizontal padding
  - 2px bottom border for emphasis
  - Z-index 10 for proper layering
  - Rounded corners on first/last headers

#### Header Hover State
- Transitions to primary color background
- White text color for contrast
- Fast transition using theme variable timing

### Year Column Styling
Special styling for columns containing year data:

#### Year Column Headers
```css
.custom-table th.year-column
```
- Primary color background with white text
- 3px right border in secondary color
- Hover state changes to secondary color

#### Year Column Cells
```css
.custom-table td.year-column
```
- Semi-transparent primary color background
- 2px right border in semi-transparent secondary color
- Maintains distinct styling even on row hover

#### Year Info Indicator
```css
.year-info
```
- **Purpose**: Additional context for year columns
- **Styling**:
  - Smaller font (0.85em)
  - Italic style
  - Pill-shaped background with padding
  - Uses primary color with low opacity

### Table Cells
```css
.custom-table td
```
- **Standard Styling**:
  - 10px vertical, 16px horizontal padding
  - Bottom border for row separation
  - Theme-aware text color
  - Smooth background transitions

### Row Effects

#### Row Hover
```css
.custom-table tr:hover td
```
- Semi-transparent primary color overlay
- Preserves special year column styling
- Smooth transition effect

#### Alternating Rows
```css
.custom-table tr:nth-child(even)
```
- Subtle background color using border color at 20% opacity
- Improves readability for data-heavy tables

## Data Formatting

### Numerical Values
```css
.custom-table td span
```
- **Typography**: Monospace font (Consolas, Monaco)
- **Layout**:
  - Inline-block display
  - Right-aligned text
  - Minimum width of 60px
  - Small padding and rounded corners

### Special Value Styling

#### Negative Values
```css
.custom-table td span[style*="color: red"]
```
- Uses danger color from theme
- Light danger color background
- Maintains visibility across themes

#### Large Values
```css
.custom-table td span[style*="font-weight: bold"]
```
- Enhanced font weight (600)
- Primary color text
- Subtle primary color background
- Used for millions/billions formatting

## Tooltip System
```css
.tooltip2
```
- **Positioning**: Absolute, 125% above parent
- **Visibility**: Hidden by default, visible on hover
- **Styling**:
  - Theme-aware colors and shadows
  - Maximum width of 250px
  - Smooth opacity transitions
  - Z-index 100 for proper layering

## Container Elements

### Table Container
```css
.table-container
```
- Provides spacing and background
- Neumorphic shadow effects
- 1rem padding, 2rem bottom margin

### Table Title
```css
.table-title
```
- **Layout**: Flexbox for icon alignment
- **Styling**:
  - 1.2rem font size
  - Bottom border separation
  - Theme-aware text color

## Theme Support

### Dark Theme
```css
:root.dark-theme
```
- Increased opacity for year column backgrounds
- Adjusted hover states for better visibility
- Enhanced contrast for dark backgrounds

### Light Theme
```css
:root.light-theme
```
- Lower opacity for year column backgrounds
- Subtle hover effects
- Optimized for bright backgrounds

### Creative Theme
```css
:root.creative-theme
```
- Balanced opacity levels
- Custom hover intensities
- Unique visual treatment

## CSS Variables Used
The component relies heavily on CSS variables for theming:

- `--neu-border-radius-md/sm`: Rounded corner values
- `--neu-shadow-sm/md`: Shadow intensities
- `--card-background`: Table background color
- `--border-color`: Border colors
- `--text-color`: Primary text color
- `--text-secondary`: Secondary text color
- `--primary-color`: Accent color for emphasis
- `--secondary-color`: Secondary accent color
- `--danger-color`: Color for negative values
- `--neu-transition-fast`: Transition timing

## RGB Color Variables
Special RGB variants for opacity calculations:
- `--primary-color-rgb`
- `--secondary-color-rgb`
- `--danger-color-rgb`
- `--border-color-rgb`

## Best Practices
1. **Data Organization**: Use year columns for temporal data with special styling
2. **Value Formatting**: Wrap numerical values in spans for consistent formatting
3. **Negative Values**: Apply red color inline styles for automatic danger styling
4. **Large Numbers**: Use bold weight for millions/billions
5. **Tooltips**: Add tooltip2 class elements for additional context

## Accessibility Features
- High contrast ratios maintained across themes
- Clear hover states for interactive elements
- Consistent spacing for readability
- Monospace fonts for numerical data alignment
- Sticky headers for long table navigation

## Performance Considerations
- CSS variables enable runtime theme switching
- Minimal use of complex selectors
- Efficient hover state calculations
- Hardware-accelerated transitions where possible