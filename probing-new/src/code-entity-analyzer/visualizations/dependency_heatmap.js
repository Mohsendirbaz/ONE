/**
 * Dependency Heatmap Visualization
 * 
 * This module creates a heatmap visualization of module dependencies
 * in a React-based financial modeling application.
 */

const d3 = require('d3');

/**
 * Creates a dependency heatmap visualization
 * @param {Object} data - The dependency data
 * @param {string} containerId - The ID of the container element
 * @param {Object} options - Visualization options
 * @returns {Object} - The created visualization instance
 */
function createDependencyHeatmap(data, containerId, options = {}) {
  const defaultOptions = {
    width: 900,
    height: 900,
    margin: { top: 100, right: 100, bottom: 100, left: 100 },
    cellSize: 20,
    colorScale: ['#f7fbff', '#08306b'], // Light blue to dark blue
    fontSize: {
      labels: 10,
      title: 16
    },
    title: 'Module Dependency Heatmap',
    showTooltips: true,
    showValues: false,
    sortModules: true,
    clusterModules: false
  };
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create the visualization
  const visualization = new DependencyHeatmapVisualization(data, containerId, mergedOptions);
  visualization.render();
  
  return visualization;
}

/**
 * Dependency Heatmap Visualization class
 */
class DependencyHeatmapVisualization {
  /**
   * Constructor
   * @param {Object} data - The dependency data
   * @param {string} containerId - The ID of the container element
   * @param {Object} options - Visualization options
   */
  constructor(data, containerId, options) {
    this.data = this.processData(data);
    this.containerId = containerId;
    this.options = options;
    this.svg = null;
    this.tooltip = null;
    this.colorScale = d3.scaleLinear()
      .domain([0, d3.max(this.data.matrix, row => d3.max(row))])
      .range(this.options.colorScale);
  }
  
  /**
   * Process the input data to prepare it for visualization
   * @param {Object} data - The raw dependency data
   * @returns {Object} - Processed data ready for visualization
   */
  processData(data) {
    let modules = data.modules || [];
    let matrix = data.matrix || [];
    
    // If we have a list of dependencies instead of a matrix, convert it
    if (data.dependencies && !data.matrix) {
      const moduleMap = new Map();
      
      // Extract unique modules
      data.dependencies.forEach(dep => {
        if (!moduleMap.has(dep.source)) {
          moduleMap.set(dep.source, moduleMap.size);
        }
        if (!moduleMap.has(dep.target)) {
          moduleMap.set(dep.target, moduleMap.size);
        }
      });
      
      // Create modules array
      modules = Array.from(moduleMap.keys());
      
      // Create empty matrix
      matrix = Array(modules.length).fill().map(() => Array(modules.length).fill(0));
      
      // Fill matrix with dependency values
      data.dependencies.forEach(dep => {
        const sourceIndex = moduleMap.get(dep.source);
        const targetIndex = moduleMap.get(dep.target);
        matrix[sourceIndex][targetIndex] = dep.value || 1;
      });
    }
    
    // Sort modules if requested
    if (this.options.sortModules) {
      // Calculate total dependencies for each module
      const moduleTotals = modules.map((_, i) => {
        return matrix[i].reduce((sum, val) => sum + val, 0);
      });
      
      // Create indices sorted by total dependencies
      const sortedIndices = moduleTotals
        .map((total, index) => ({ total, index }))
        .sort((a, b) => b.total - a.total)
        .map(item => item.index);
      
      // Reorder modules and matrix
      modules = sortedIndices.map(i => modules[i]);
      matrix = sortedIndices.map(i => sortedIndices.map(j => matrix[i][j]));
    }
    
    // Cluster modules if requested
    if (this.options.clusterModules) {
      // This would implement a clustering algorithm
      // For simplicity, we'll skip the actual implementation
      console.log('Module clustering is not implemented in this version');
    }
    
    return { modules, matrix };
  }
  
  /**
   * Render the visualization
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container element with ID "${this.containerId}" not found`);
      return;
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    const { width, height, margin, cellSize } = this.options;
    
    // Calculate dimensions
    const numModules = this.data.modules.length;
    const gridSize = Math.min(
      width - margin.left - margin.right,
      height - margin.top - margin.bottom
    );
    
    const actualCellSize = Math.min(
      cellSize,
      gridSize / numModules
    );
    
    // Create SVG element
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'dependency-heatmap');
    
    // Add title
    this.svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', this.options.fontSize.title)
      .attr('font-weight', 'bold')
      .text(this.options.title);
    
    // Create a group for the heatmap
    const heatmapGroup = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create x-axis labels (source modules)
    const xLabels = heatmapGroup.selectAll('.x-label')
      .data(this.data.modules)
      .enter()
      .append('text')
      .attr('class', 'x-label')
      .attr('x', 0)
      .attr('y', (d, i) => i * actualCellSize + actualCellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('transform', `translate(-6,0)`)
      .attr('font-size', this.options.fontSize.labels)
      .text(d => this.truncateLabel(d, 20));
    
    // Create y-axis labels (target modules)
    const yLabels = heatmapGroup.selectAll('.y-label')
      .data(this.data.modules)
      .enter()
      .append('text')
      .attr('class', 'y-label')
      .attr('x', (d, i) => i * actualCellSize + actualCellSize / 2)
      .attr('y', 0)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'hanging')
      .attr('transform', `translate(0,-6) rotate(-45, 0, 0)`)
      .attr('font-size', this.options.fontSize.labels)
      .text(d => this.truncateLabel(d, 20));
    
    // Create heatmap cells
    const cells = heatmapGroup.selectAll('.cell')
      .data(this.data.matrix.flatMap((row, i) => 
        row.map((value, j) => ({ source: i, target: j, value }))
      ))
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => d.target * actualCellSize)
      .attr('y', d => d.source * actualCellSize)
      .attr('width', actualCellSize)
      .attr('height', actualCellSize)
      .attr('fill', d => this.colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);
    
    // Add cell values if requested
    if (this.options.showValues) {
      heatmapGroup.selectAll('.cell-value')
        .data(this.data.matrix.flatMap((row, i) => 
          row.map((value, j) => ({ source: i, target: j, value }))
        ))
        .enter()
        .append('text')
        .attr('class', 'cell-value')
        .attr('x', d => d.target * actualCellSize + actualCellSize / 2)
        .attr('y', d => d.source * actualCellSize + actualCellSize / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', Math.min(actualCellSize * 0.6, 8))
        .attr('fill', d => d.value > (d3.max(this.data.matrix, row => d3.max(row)) / 2) ? '#fff' : '#000')
        .text(d => d.value > 0 ? d.value : '');
    }
    
    // Create tooltip
    if (this.options.showTooltips) {
      this.tooltip = d3.select(container)
        .append('div')
        .attr('class', 'dependency-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
      
      // Add tooltip behavior
      cells
        .on('mouseover', (event, d) => this.showTooltip(event, d))
        .on('mouseout', () => this.hideTooltip());
    }
    
    // Add legend
    this.createLegend();
  }
  
  /**
   * Create a color legend for the heatmap
   */
  createLegend() {
    const { width, height, margin } = this.options;
    const legendWidth = 200;
    const legendHeight = 20;
    
    // Create gradient for legend
    const defs = this.svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'heatmap-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', this.options.colorScale[0]);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', this.options.colorScale[1]);
    
    // Create legend group
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - margin.right - legendWidth}, ${height - margin.bottom + 30})`);
    
    // Add legend rectangle
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#heatmap-gradient)');
    
    // Add legend labels
    const maxValue = d3.max(this.data.matrix, row => d3.max(row));
    
    legend.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'start')
      .attr('font-size', this.options.fontSize.labels)
      .text('0');
    
    legend.append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'end')
      .attr('font-size', this.options.fontSize.labels)
      .text(maxValue);
    
    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', this.options.fontSize.labels)
      .text('Dependency Strength');
  }
  
  /**
   * Show tooltip with dependency information
   * @param {Object} event - The mouse event
   * @param {Object} d - The cell data
   */
  showTooltip(event, d) {
    if (!this.tooltip) return;
    
    const sourceModule = this.data.modules[d.source];
    const targetModule = this.data.modules[d.target];
    
    let content = `<div style="font-weight: bold;">Dependency</div>`;
    content += `<div>From: ${sourceModule}</div>`;
    content += `<div>To: ${targetModule}</div>`;
    content += `<div>Strength: ${d.value}</div>`;
    
    this.tooltip
      .html(content)
      .style('visibility', 'visible')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY + 10}px`);
  }
  
  /**
   * Hide the tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style('visibility', 'hidden');
    }
  }
  
  /**
   * Truncate a label to a maximum length
   * @param {string} label - The label to truncate
   * @param {number} maxLength - The maximum length
   * @returns {string} - The truncated label
   */
  truncateLabel(label, maxLength) {
    if (label.length <= maxLength) {
      return label;
    }
    
    // Extract filename from path if it's a path
    if (label.includes('/') || label.includes('\\')) {
      const parts = label.split(/[/\\]/);
      label = parts[parts.length - 1];
      
      if (label.length <= maxLength) {
        return label;
      }
    }
    
    return label.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Update the visualization with new data
   * @param {Object} data - The new dependency data
   */
  updateData(data) {
    this.data = this.processData(data);
    this.colorScale = d3.scaleLinear()
      .domain([0, d3.max(this.data.matrix, row => d3.max(row))])
      .range(this.options.colorScale);
    this.render();
  }
  
  /**
   * Resize the visualization
   * @param {number} width - The new width
   * @param {number} height - The new height
   */
  resize(width, height) {
    this.options.width = width;
    this.options.height = height;
    this.render();
  }
  
  /**
   * Toggle showing cell values
   * @param {boolean} show - Whether to show values
   */
  toggleValues(show) {
    this.options.showValues = show;
    this.render();
  }
  
  /**
   * Change the color scale
   * @param {Array} colorRange - The new color range
   */
  setColorScale(colorRange) {
    this.options.colorScale = colorRange;
    this.colorScale = d3.scaleLinear()
      .domain([0, d3.max(this.data.matrix, row => d3.max(row))])
      .range(this.options.colorScale);
    this.render();
  }
}

module.exports = {
  createDependencyHeatmap,
  DependencyHeatmapVisualization
};