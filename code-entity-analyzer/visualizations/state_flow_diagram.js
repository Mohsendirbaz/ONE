/**
 * State Flow Diagram Visualization
 * 
 * This module creates an interactive visualization of state management patterns
 * and data flow in a React-based financial modeling application.
 */

const d3 = require('d3');

/**
 * Creates a state flow diagram visualization
 * @param {Object} data - The state flow data
 * @param {string} containerId - The ID of the container element
 * @param {Object} options - Visualization options
 * @returns {Object} - The created visualization instance
 */
function createStateFlowDiagram(data, containerId, options = {}) {
  const defaultOptions = {
    width: 900,
    height: 600,
    nodeRadius: {
      component: 10,
      state: 8,
      store: 12,
      context: 10,
      reducer: 9
    },
    fontSize: 12,
    colors: {
      component: '#4285F4',
      state: '#34A853',
      store: '#FBBC05',
      context: '#EA4335',
      reducer: '#9C27B0',
      flow: '#757575',
      text: '#212121',
      highlight: '#FF5722'
    },
    showLabels: true,
    showTooltips: true,
    highlightFlows: true,
    layout: 'force' // 'sankey', 'force', 'dagre'
  };
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create the visualization
  const visualization = new StateFlowDiagramVisualization(data, containerId, mergedOptions);
  visualization.render();
  
  return visualization;
}

/**
 * State Flow Diagram Visualization class
 */
class StateFlowDiagramVisualization {
  /**
   * Constructor
   * @param {Object} data - The state flow data
   * @param {string} containerId - The ID of the container element
   * @param {Object} options - Visualization options
   */
  constructor(data, containerId, options) {
    this.data = this.processData(data);
    this.containerId = containerId;
    this.options = options;
    this.svg = null;
    this.simulation = null;
    this.tooltip = null;
    this.selectedNode = null;
    this.selectedFlow = null;
  }
  
  /**
   * Process the input data to prepare it for visualization
   * @param {Object} data - The raw state flow data
   * @returns {Object} - Processed data ready for visualization
   */
  processData(data) {
    // Ensure nodes have unique IDs and appropriate types
    const nodes = data.nodes.map(node => ({
      id: node.id,
      name: node.name || node.id,
      type: node.type || 'component',
      stateType: node.stateType || 'local', // local, redux, context, etc.
      value: node.value || 1,
      details: node.details || {}
    }));
    
    // Process flows to ensure they reference valid nodes
    const flows = data.flows.map(flow => ({
      source: flow.source,
      target: flow.target,
      type: flow.type || 'update',
      value: flow.value || 1,
      details: flow.details || {}
    })).filter(flow => 
      nodes.some(node => node.id === flow.source) && 
      nodes.some(node => node.id === flow.target)
    );
    
    return { nodes, flows };
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
    
    // Create SVG element
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .attr('class', 'state-flow-diagram');
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.svg.select('g').attr('transform', event.transform);
      });
    
    this.svg.call(zoom);
    
    // Create a group for all visualization elements
    const g = this.svg.append('g');
    
    // Create tooltip
    if (this.options.showTooltips) {
      this.tooltip = d3.select(container)
        .append('div')
        .attr('class', 'state-flow-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    }
    
    // Apply force layout (simplified)
    this.applyForceLayout(g);
  }
  
  /**
   * Apply force-directed layout
   * @param {Object} g - D3 selection of the main group
   */
  applyForceLayout(g) {
    // Create links (flows)
    const link = g.append('g')
      .attr('class', 'flows')
      .selectAll('path')
      .data(this.data.flows)
      .enter()
      .append('path')
      .attr('d', d => `M0,0L0,0`)
      .attr('stroke', '#757575')
      .attr('stroke-width', 1.5)
      .attr('fill', 'none');
    
    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.data.nodes)
      .enter()
      .append('circle')
      .attr('r', d => this.options.nodeRadius[d.type] || 10)
      .attr('fill', d => this.options.colors[d.type] || this.options.colors.component);
    
    // Add node labels if enabled
    if (this.options.showLabels) {
      g.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(this.data.nodes)
        .enter()
        .append('text')
        .text(d => d.name)
        .attr('font-size', this.options.fontSize)
        .attr('fill', this.options.colors.text)
        .attr('dx', 15)
        .attr('dy', 4);
    }
    
    // Create force simulation
    this.simulation = d3.forceSimulation(this.data.nodes)
      .force('link', d3.forceLink(this.data.flows).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.options.width / 2, this.options.height / 2));
    
    // Update positions on tick
    this.simulation.on('tick', () => {
      link
        .attr('d', d => {
          return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        });
      
      node
        .attr('cx', d => d.x = Math.max(10, Math.min(this.options.width - 10, d.x)))
        .attr('cy', d => d.y = Math.max(10, Math.min(this.options.height - 10, d.y)));
      
      if (this.options.showLabels) {
        g.selectAll('text')
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      }
    });
  }
  
  /**
   * Get the color for a node based on its type
   * @param {Object} node - The node to get color for
   * @returns {string} - The color for the node
   */
  getNodeColor(node) {
    return this.options.colors[node.type] || this.options.colors.component;
  }
  
  /**
   * Get the color for a flow based on its type
   * @param {Object} flow - The flow to get color for
   * @returns {string} - The color for the flow
   */
  getFlowColor(flow) {
    switch (flow.type) {
      case 'create':
        return this.options.colors.state;
      case 'delete':
        return '#FF5252';
      case 'read':
        return '#2196F3';
      default:
        return this.options.colors.flow;
    }
  }
  
  /**
   * Calculate layers for layout
   * @returns {Array} - Array of layers, each containing node IDs
   */
  calculateLayers() {
    // Find nodes with no incoming edges (sources)
    const inDegree = {};
    this.data.nodes.forEach(node => {
      inDegree[node.id] = 0;
    });
    
    this.data.flows.forEach(flow => {
      inDegree[flow.target] = (inDegree[flow.target] || 0) + 1;
    });
    
    const sources = this.data.nodes
      .filter(node => inDegree[node.id] === 0)
      .map(node => node.id);
    
    // If no sources found, use first node
    if (sources.length === 0 && this.data.nodes.length > 0) {
      sources.push(this.data.nodes[0].id);
    }
    
    // Build layers
    const layers = [sources];
    const visited = new Set(sources);
    
    while (visited.size < this.data.nodes.length) {
      const prevLayer = layers[layers.length - 1];
      const nextLayer = [];
      
      // Find nodes that have all their dependencies in previous layers
      this.data.nodes.forEach(node => {
        if (visited.has(node.id)) return;
        
        const dependencies = this.data.flows
          .filter(flow => flow.target === node.id)
          .map(flow => flow.source);
        
        if (dependencies.every(dep => visited.has(dep))) {
          nextLayer.push(node.id);
          visited.add(node.id);
        }
      });
      
      // If no new nodes found but we haven't visited all nodes,
      // add remaining nodes to break cycles
      if (nextLayer.length === 0 && visited.size < this.data.nodes.length) {
        const remainingNodes = this.data.nodes
          .filter(node => !visited.has(node.id))
          .map(node => node.id);
        
        nextLayer.push(...remainingNodes);
        remainingNodes.forEach(id => visited.add(id));
      }
      
      if (nextLayer.length > 0) {
        layers.push(nextLayer);
      } else {
        break;
      }
    }
    
    return layers;
  }
}

module.exports = {
  createStateFlowDiagram,
  StateFlowDiagramVisualization
};