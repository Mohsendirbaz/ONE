# theme_provider.js

**Purpose**: Config

**Description**: * Theme Provider
 * 
 * This module handles the integration of code entity analyzer visualizations
 * with the application's theme system, ensuring that the visualizations
 * match the overall look an...

**Functions**: createThemeProvider, to, to, return, brightness

**Classes**: */, ThemeProvider, to, container.classList.add(`theme-$, if and 1 more

**Keywords**: true, function, createthemeprovider, apptheme, options, const, defaultoptions

## Key Code Sections

### Function: createThemeProvider

```
function createThemeProvider(appTheme, options = {}) {
  const defaultOptions = {
    darkModeSupport: true,
    adaptToSystemPreference: true,
    defaultTheme: 'light',
    # ... more lines ...
```

### Function: to

```
function to call when the theme changes
   * @returns {Function} - A function to unsubscribe
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
    # ... more lines ...
```

## File Info

- **Size**: 20.0 KB
- **Lines**: 643
- **Complexity**: 12

## Additional Details

### Line Statistics

- Average line length: 29.8 characters
- Longest line: 105 characters
- Number of blank lines: 79

