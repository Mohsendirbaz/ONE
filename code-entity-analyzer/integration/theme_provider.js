/**
 * Theme Provider
 * 
 * This module handles the integration of code entity analyzer visualizations
 * with the application's theme system, ensuring that the visualizations
 * match the overall look and feel of the application.
 */

/**
 * Creates a theme provider for code entity analyzer visualizations
 * @param {Object} appTheme - The application's theme system or theme object
 * @param {Object} options - Theme provider options
 * @returns {Object} - The theme provider instance
 */
function createThemeProvider(appTheme, options = {}) {
  const defaultOptions = {
    darkModeSupport: true,
    adaptToSystemPreference: true,
    defaultTheme: 'light',
    customColorMappings: null,
    animateTransitions: true,
    transitionDuration: 300
  };
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create the theme provider
  const provider = new ThemeProvider(appTheme, mergedOptions);
  
  return provider;
}

/**
 * Theme Provider class
 */
class ThemeProvider {
  /**
   * Constructor
   * @param {Object} appTheme - The application's theme system or theme object
   * @param {Object} options - Theme provider options
   */
  constructor(appTheme, options) {
    this.appTheme = appTheme;
    this.options = options;
    this.currentTheme = null;
    this.subscribers = new Set();
    this.styleElement = null;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the theme provider
   */
  init() {
    // Create style element for theme CSS
    this.createStyleElement();
    
    // Determine initial theme
    this.detectTheme();
    
    // Set up event listeners for theme changes
    this.setupEventListeners();
    
    // Apply initial theme
    this.applyTheme(this.currentTheme);
  }
  
  /**
   * Create a style element for theme CSS
   */
  createStyleElement() {
    // Check if the style element already exists
    if (document.getElementById('code-analyzer-theme-styles')) {
      this.styleElement = document.getElementById('code-analyzer-theme-styles');
      return;
    }
    
    // Create a new style element
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'code-analyzer-theme-styles';
    document.head.appendChild(this.styleElement);
  }
  
  /**
   * Set up event listeners for theme changes
   */
  setupEventListeners() {
    // Listen for theme changes from the application
    if (this.appTheme && typeof this.appTheme.subscribe === 'function') {
      // If the app theme has a subscribe method, use it
      this.appTheme.subscribe(theme => {
        this.handleThemeChange(theme);
      });
    } else if (this.appTheme && typeof this.appTheme.addEventListener === 'function') {
      // If the app theme has an addEventListener method, use it
      this.appTheme.addEventListener('themeChange', event => {
        this.handleThemeChange(event.detail || event.theme);
      });
    }
    
    // Listen for system preference changes if enabled
    if (this.options.adaptToSystemPreference && window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Add change listener
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', e => {
          if (!this.appTheme) {
            // Only apply system preference if no app theme is provided
            this.handleSystemPreferenceChange(e.matches ? 'dark' : 'light');
          }
        });
      } else if (darkModeMediaQuery.addListener) {
        // Fallback for older browsers
        darkModeMediaQuery.addListener(e => {
          if (!this.appTheme) {
            this.handleSystemPreferenceChange(e.matches ? 'dark' : 'light');
          }
        });
      }
    }
  }
  
  /**
   * Detect the current theme
   */
  detectTheme() {
    let theme = this.options.defaultTheme;
    
    // Try to get theme from app theme
    if (this.appTheme) {
      if (typeof this.appTheme.getTheme === 'function') {
        const appTheme = this.appTheme.getTheme();
        theme = this.mapAppThemeToAnalyzerTheme(appTheme);
      } else if (typeof this.appTheme.theme === 'string') {
        theme = this.mapAppThemeToAnalyzerTheme(this.appTheme.theme);
      } else if (typeof this.appTheme === 'string') {
        theme = this.mapAppThemeToAnalyzerTheme(this.appTheme);
      }
    } 
    // If no app theme or couldn't detect, use system preference if enabled
    else if (this.options.adaptToSystemPreference && window.matchMedia) {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDarkMode ? 'dark' : 'light';
    }
    
    this.currentTheme = theme;
  }
  
  /**
   * Map application theme to analyzer theme
   * @param {string|Object} appTheme - The application theme
   * @returns {string} - The mapped analyzer theme
   */
  mapAppThemeToAnalyzerTheme(appTheme) {
    // If appTheme is a string
    if (typeof appTheme === 'string') {
      const lowerTheme = appTheme.toLowerCase();
      
      // Check for dark theme variations
      if (lowerTheme.includes('dark') || lowerTheme === 'night' || lowerTheme === 'black') {
        return 'dark';
      }
      
      // Check for light theme variations
      if (lowerTheme.includes('light') || lowerTheme === 'day' || lowerTheme === 'white') {
        return 'light';
      }
      
      // Check for high contrast theme
      if (lowerTheme.includes('contrast') || lowerTheme.includes('accessibility')) {
        return 'high-contrast';
      }
      
      // Default to the provided theme if no mapping found
      return lowerTheme;
    }
    
    // If appTheme is an object
    if (typeof appTheme === 'object' && appTheme !== null) {
      // Try to determine theme from object properties
      if (appTheme.type) {
        return this.mapAppThemeToAnalyzerTheme(appTheme.type);
      }
      
      if (appTheme.mode) {
        return this.mapAppThemeToAnalyzerTheme(appTheme.mode);
      }
      
      if (appTheme.name) {
        return this.mapAppThemeToAnalyzerTheme(appTheme.name);
      }
      
      // Try to infer from background color if available
      if (appTheme.background || appTheme.backgroundColor) {
        const bgColor = appTheme.background || appTheme.backgroundColor;
        return this.inferThemeFromColor(bgColor);
      }
    }
    
    // Default to the default theme if no mapping found
    return this.options.defaultTheme;
  }
  
  /**
   * Infer theme from a color value
   * @param {string} color - The color value
   * @returns {string} - The inferred theme
   */
  inferThemeFromColor(color) {
    // Convert color to RGB if it's a hex value
    let r, g, b;
    
    if (color.startsWith('#')) {
      // Hex color
      const hex = color.slice(1);
      
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      } else {
        // Invalid hex color
        return this.options.defaultTheme;
      }
    } else if (color.startsWith('rgb')) {
      // RGB or RGBA color
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        r = parseInt(match[1], 10);
        g = parseInt(match[2], 10);
        b = parseInt(match[3], 10);
      } else {
        // Invalid RGB color
        return this.options.defaultTheme;
      }
    } else {
      // Unknown color format
      return this.options.defaultTheme;
    }
    
    // Calculate perceived brightness
    // Formula: (R * 0.299 + G * 0.587 + B * 0.114)
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    
    // If brightness is less than 128, it's a dark color
    return brightness < 128 ? 'dark' : 'light';
  }
  
  /**
   * Handle theme change from the application
   * @param {string|Object} theme - The new theme
   */
  handleThemeChange(theme) {
    const mappedTheme = this.mapAppThemeToAnalyzerTheme(theme);
    
    if (mappedTheme !== this.currentTheme) {
      this.currentTheme = mappedTheme;
      this.applyTheme(mappedTheme);
    }
  }
  
  /**
   * Handle system preference change
   * @param {string} theme - The new theme based on system preference
   */
  handleSystemPreferenceChange(theme) {
    if (theme !== this.currentTheme) {
      this.currentTheme = theme;
      this.applyTheme(theme);
    }
  }
  
  /**
   * Apply a theme to the visualizations
   * @param {string} theme - The theme to apply
   */
  applyTheme(theme) {
    // Generate theme CSS
    const css = this.generateThemeCSS(theme);
    
    // Apply CSS to the style element
    if (this.styleElement) {
      if (this.options.animateTransitions) {
        // Add transition styles
        const transitionCSS = `
          .code-analyzer-visualization-container * {
            transition: color ${this.options.transitionDuration}ms ease-in-out,
                        background-color ${this.options.transitionDuration}ms ease-in-out,
                        border-color ${this.options.transitionDuration}ms ease-in-out,
                        fill ${this.options.transitionDuration}ms ease-in-out,
                        stroke ${this.options.transitionDuration}ms ease-in-out;
          }
        `;
        
        this.styleElement.textContent = transitionCSS + css;
      } else {
        this.styleElement.textContent = css;
      }
    }
    
    // Add theme class to all visualization containers
    const containers = document.querySelectorAll('.code-analyzer-visualization-container');
    containers.forEach(container => {
      // Remove existing theme classes
      container.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
      // Add new theme class
      container.classList.add(`theme-${theme}`);
    });
    
    // Notify subscribers
    this.notifySubscribers(theme);
  }
  
  /**
   * Generate theme CSS
   * @param {string} theme - The theme to generate CSS for
   * @returns {string} - The generated CSS
   */
  generateThemeCSS(theme) {
    // Get theme colors
    const colors = this.getThemeColors(theme);
    
    // Generate CSS
    return `
      /* Base styles for code analyzer visualizations */
      .code-analyzer-visualization-container.theme-${theme} {
        color: ${colors.text};
        background-color: ${colors.background};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      
      /* Node styles */
      .code-analyzer-visualization-container.theme-${theme} .node circle,
      .code-analyzer-visualization-container.theme-${theme} .node rect {
        stroke: ${colors.nodeBorder};
        stroke-width: 1.5px;
      }
      
      .code-analyzer-visualization-container.theme-${theme} .node text {
        fill: ${colors.nodeText};
        font-size: 12px;
      }
      
      /* Link styles */
      .code-analyzer-visualization-container.theme-${theme} .link {
        stroke: ${colors.link};
        stroke-opacity: 0.6;
      }
      
      /* Tooltip styles */
      .code-analyzer-visualization-container.theme-${theme} .tooltip {
        color: ${colors.tooltipText};
        background-color: ${colors.tooltipBackground};
        border: 1px solid ${colors.tooltipBorder};
        border-radius: 4px;
        padding: 8px;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      /* Legend styles */
      .code-analyzer-visualization-container.theme-${theme} .legend {
        fill: ${colors.legendText};
        font-size: 12px;
      }
      
      /* Control panel styles */
      .code-analyzer-visualization-container.theme-${theme} .control-panel {
        background-color: ${colors.controlBackground};
        border: 1px solid ${colors.controlBorder};
        border-radius: 4px;
        padding: 8px;
      }
      
      .code-analyzer-visualization-container.theme-${theme} .control-panel button {
        background-color: ${colors.buttonBackground};
        color: ${colors.buttonText};
        border: 1px solid ${colors.buttonBorder};
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
      }
      
      .code-analyzer-visualization-container.theme-${theme} .control-panel button:hover {
        background-color: ${colors.buttonHoverBackground};
      }
      
      /* Error message styles */
      .code-analyzer-visualization-container.theme-${theme} .error-message {
        color: ${colors.errorText};
        background-color: ${colors.errorBackground};
        border: 1px solid ${colors.errorBorder};
        border-radius: 4px;
        padding: 8px;
        margin: 8px;
      }
      
      /* Custom styles for specific visualizations */
      
      /* Component Graph */
      .code-analyzer-visualization-container.theme-${theme} .component-node circle {
        fill: ${colors.componentNodeFill};
      }
      
      .code-analyzer-visualization-container.theme-${theme} .hook-node circle {
        fill: ${colors.hookNodeFill};
      }
      
      .code-analyzer-visualization-container.theme-${theme} .context-node circle {
        fill: ${colors.contextNodeFill};
      }
      
      /* State Flow Diagram */
      .code-analyzer-visualization-container.theme-${theme} .state-node rect {
        fill: ${colors.stateNodeFill};
      }
      
      .code-analyzer-visualization-container.theme-${theme} .action-node rect {
        fill: ${colors.actionNodeFill};
      }
      
      .code-analyzer-visualization-container.theme-${theme} .reducer-node rect {
        fill: ${colors.reducerNodeFill};
      }
      
      /* Dependency Heatmap */
      .code-analyzer-visualization-container.theme-${theme} .heatmap-cell {
        stroke: ${colors.heatmapCellBorder};
      }
      
      .code-analyzer-visualization-container.theme-${theme} .heatmap-label {
        fill: ${colors.heatmapLabel};
        font-size: 10px;
      }
    `;
  }
  
  /**
   * Get theme colors
   * @param {string} theme - The theme to get colors for
   * @returns {Object} - The theme colors
   */
  getThemeColors(theme) {
    // Base colors for different themes
    const themeColors = {
      'light': {
        background: '#ffffff',
        text: '#333333',
        nodeBorder: '#666666',
        nodeText: '#333333',
        link: '#999999',
        tooltipText: '#333333',
        tooltipBackground: '#ffffff',
        tooltipBorder: '#dddddd',
        legendText: '#333333',
        controlBackground: '#f5f5f5',
        controlBorder: '#dddddd',
        buttonBackground: '#ffffff',
        buttonText: '#333333',
        buttonBorder: '#cccccc',
        buttonHoverBackground: '#f0f0f0',
        errorText: '#d32f2f',
        errorBackground: '#ffebee',
        errorBorder: '#ffcdd2',
        componentNodeFill: '#bbdefb',
        hookNodeFill: '#c8e6c9',
        contextNodeFill: '#ffecb3',
        stateNodeFill: '#e1bee7',
        actionNodeFill: '#ffccbc',
        reducerNodeFill: '#b3e5fc',
        heatmapCellBorder: '#ffffff',
        heatmapLabel: '#333333'
      },
      'dark': {
        background: '#2d2d2d',
        text: '#e0e0e0',
        nodeBorder: '#999999',
        nodeText: '#e0e0e0',
        link: '#777777',
        tooltipText: '#e0e0e0',
        tooltipBackground: '#424242',
        tooltipBorder: '#616161',
        legendText: '#e0e0e0',
        controlBackground: '#424242',
        controlBorder: '#616161',
        buttonBackground: '#616161',
        buttonText: '#e0e0e0',
        buttonBorder: '#757575',
        buttonHoverBackground: '#757575',
        errorText: '#ef9a9a',
        errorBackground: '#4e342e',
        errorBorder: '#6d4c41',
        componentNodeFill: '#0d47a1',
        hookNodeFill: '#1b5e20',
        contextNodeFill: '#ff6f00',
        stateNodeFill: '#4a148c',
        actionNodeFill: '#bf360c',
        reducerNodeFill: '#01579b',
        heatmapCellBorder: '#2d2d2d',
        heatmapLabel: '#e0e0e0'
      },
      'high-contrast': {
        background: '#000000',
        text: '#ffffff',
        nodeBorder: '#ffffff',
        nodeText: '#ffffff',
        link: '#ffffff',
        tooltipText: '#ffffff',
        tooltipBackground: '#000000',
        tooltipBorder: '#ffffff',
        legendText: '#ffffff',
        controlBackground: '#000000',
        controlBorder: '#ffffff',
        buttonBackground: '#000000',
        buttonText: '#ffffff',
        buttonBorder: '#ffffff',
        buttonHoverBackground: '#333333',
        errorText: '#ff0000',
        errorBackground: '#000000',
        errorBorder: '#ff0000',
        componentNodeFill: '#0000ff',
        hookNodeFill: '#00ff00',
        contextNodeFill: '#ffff00',
        stateNodeFill: '#ff00ff',
        actionNodeFill: '#ff6600',
        reducerNodeFill: '#00ffff',
        heatmapCellBorder: '#ffffff',
        heatmapLabel: '#ffffff'
      }
    };
    
    // Get base colors for the theme
    const baseColors = themeColors[theme] || themeColors['light'];
    
    // Apply custom color mappings if provided
    if (this.options.customColorMappings && this.options.customColorMappings[theme]) {
      return { ...baseColors, ...this.options.customColorMappings[theme] };
    }
    
    return baseColors;
  }
  
  /**
   * Subscribe to theme changes
   * @param {Function} callback - The callback function to call when the theme changes
   * @returns {Function} - A function to unsubscribe
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this.subscribers.add(callback);
    
    // Call the callback immediately with the current theme
    callback(this.currentTheme);
    
    // Return an unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  /**
   * Notify subscribers of a theme change
   * @param {string} theme - The new theme
   */
  notifySubscribers(theme) {
    this.subscribers.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Error in theme change subscriber:', error);
      }
    });
  }
  
  /**
   * Get the current theme
   * @returns {string} - The current theme
   */
  getTheme() {
    return this.currentTheme;
  }
  
  /**
   * Set the theme
   * @param {string} theme - The theme to set
   */
  setTheme(theme) {
    if (theme !== this.currentTheme) {
      this.currentTheme = theme;
      this.applyTheme(theme);
    }
  }
  
  /**
   * Get CSS variables for the current theme
   * @returns {Object} - CSS variables as key-value pairs
   */
  getThemeVariables() {
    return this.getThemeColors(this.currentTheme);
  }
  
  /**
   * Apply theme to a specific container
   * @param {string|HTMLElement} container - The container to apply the theme to
   */
  applyThemeToContainer(container) {
    const element = typeof container === 'string' 
      ? document.getElementById(container) || document.querySelector(container)
      : container;
      
    if (!element) {
      console.error(`Container not found: ${container}`);
      return;
    }
    
    // Add visualization container class if not present
    if (!element.classList.contains('code-analyzer-visualization-container')) {
      element.classList.add('code-analyzer-visualization-container');
    }
    
    // Remove existing theme classes
    element.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
    
    // Add current theme class
    element.classList.add(`theme-${this.currentTheme}`);
  }
}

module.exports = {
  createThemeProvider,
  ThemeProvider
};