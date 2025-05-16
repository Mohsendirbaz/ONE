/**
 * Component Graph Visualization
 * 
 * This module creates an interactive visualization of the component hierarchy
 * and relationships in a React-based financial modeling application.
 */

const d3 = require('d3');

/**
 * Creates a component graph visualization
 * @param {Object} data - The component relationship data
 * @param {string} containerId - The ID of the container element
 * @param {Object} options - Visualization options
 * @returns {Object} - The created visualization instance
 */
function createComponentGraph(data, containerId, options = {}) {
  const defaultOptions = {
    width: 900,
    height: 600,
    nodeRadius: 10,
    fontSize: 12,
    colors: {
      component: '#4285F4',
      container: '#34A853',
      hoc: '#FBBC05',
      context: '#EA4335',
      custom: '#9C27B0',
      link: '#757575',
      text: '#212121',
      highlight: '#FF5722'
    },
    showLabels: true,
    showTooltips: true,
    highlightConnections: true,
    layout: 'force' // 'force', 'tree', 'radial'
  };
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create the visualization
  const visualization = new ComponentGraphVisualization(data, containerId, mergedOptions);
  visualization.render();
  
  return visualization;
}

/**
 * Component Graph Visualization class
 */
class ComponentGraphVisualization {
  /**
   * Constructor
   * @param {Object} data - The component relationship data
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
  }
  
  /**
   * Process the input data to prepare it for visualization
   * @param {Object} data - The raw component data
   * @returns {Object} - Processed data ready for visualization
   */
  processData(data) {
    // Ensure nodes have unique IDs and appropriate types
    const nodes = data.nodes.map(node => ({
      id: node.id,
      name: node.name || node.id,
      type: node.type || 'component',
      props: node.props || [],
      children: node.children || [],
      depth: node.depth || 0,
      size: this.calculateNodeSize(node)
    }));
    
    // Process links to ensure they reference valid nodes
    const links = data.links.map(link => ({
      source: link.source,
      target: link.target,
      type: link.type || 'parent-child',
      value: link.value || 1
    })).filter(link => 
      nodes.some(node => node.id === link.source) && 
      nodes.some(node => node.id === link.target)
    );
    
    return { nodes, links };
  }
  
  /**
   * Calculate the size of a node based on its properties
   * @param {Object} node - The node to calculate size for
   * @returns {number} - The calculated node size
   */
  calculateNodeSize(node) {
    // Base size
    let size = this.options.nodeRadius;
    
    // Adjust size based on number of props
    if (node.props && node.props.length) {
      size += Math.min(node.props.length / 2, 5);
    }
    
    // Adjust size based on number of children
    if (node.children && node.children.length) {
      size += Math.min(node.children.length / 3, 3);
    }
    
    return size;
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
      .attr('class', 'component-graph');
    
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
        .attr('class', 'component-graph-tooltip')
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
    
    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(this.data.links)
      .enter()
      .append('line')
      .attr('stroke', this.options.colors.link)
      .attr('stroke-width', d => Math.sqrt(d.value));
    
    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.data.nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => this.getNodeColor(d))
      .call(this.setupDragBehavior());
    
    // Add node labels if enabled
    if (this.options.showLabels) {
      const labels = g.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(this.data.nodes)
        .enter()
        .append('text')
        .text(d => d.name)
        .attr('font-size', this.options.fontSize)
        .attr('fill', this.options.colors.text)
        .attr('dx', d => d.size + 4)
        .attr('dy', 4);
    }
    
    // Setup node interactions
    node
      .on('mouseover', (event, d) => this.handleNodeMouseOver(event, d))
      .on('mouseout', (event, d) => this.handleNodeMouseOut(event, d))
      .on('click', (event, d) => this.handleNodeClick(event, d));
    
    // Choose layout algorithm based on options
    if (this.options.layout === 'tree') {
      this.applyTreeLayout(g, node, link);
    } else if (this.options.layout === 'radial') {
      this.applyRadialLayout(g, node, link);
    } else {
      // Default to force layout
      this.applyForceLayout(node, link);
    }
  }
  
  /**
   * Apply force-directed layout
   * @param {Object} node - D3 selection of nodes
   * @param {Object} link - D3 selection of links
   */
  applyForceLayout(node, link) {
    // Create force simulation
    this.simulation = d3.forceSimulation(this.data.nodes)
      .force('link', d3.forceLink(this.data.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.options.width / 2, this.options.height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size * 1.5));
    
    // Update positions on tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('cx', d => d.x = Math.max(d.size, Math.min(this.options.width - d.size, d.x)))
        .attr('cy', d => d.y = Math.max(d.size, Math.min(this.options.height - d.size, d.y)));
      
      if (this.options.showLabels) {
        this.svg.selectAll('text')
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      }
    });
  }
  
  /**
   * Apply tree layout
   * @param {Object} g - D3 selection of the main group
   * @param {Object} node - D3 selection of nodes
   * @param {Object} link - D3 selection of links
   */
  applyTreeLayout(g, node, link) {
    // Create hierarchy from data
    const hierarchy = this.createHierarchy();
    
    // Create tree layout
    const treeLayout = d3.tree()
      .size([this.options.width - 100, this.options.height - 100]);
    
    // Apply layout
    const treeData = treeLayout(hierarchy);
    
    // Update node positions
    node
      .attr('cx', d => {
        const treeNode = treeData.descendants().find(n => n.data.id === d.id);
        return treeNode ? treeNode.x + 50 : d.x;
      })
      .attr('cy', d => {
        const treeNode = treeData.descendants().find(n => n.data.id === d.id);
        return treeNode ? treeNode.y + 50 : d.y;
      });
    
    // Update link positions
    link
      .attr('x1', d => {
        const sourceNode = treeData.descendants().find(n => n.data.id === d.source.id);
        return sourceNode ? sourceNode.x + 50 : d.source.x;
      })
      .attr('y1', d => {
        const sourceNode = treeData.descendants().find(n => n.data.id === d.source.id);
        return sourceNode ? sourceNode.y + 50 : d.source.y;
      })
      .attr('x2', d => {
        const targetNode = treeData.descendants().find(n => n.data.id === d.target.id);
        return targetNode ? targetNode.x + 50 : d.target.x;
      })
      .attr('y2', d => {
        const targetNode = treeData.descendants().find(n => n.data.id === d.target.id);
        return targetNode ? targetNode.y + 50 : d.target.y;
      });
    
    // Update label positions
    if (this.options.showLabels) {
      g.selectAll('text')
        .attr('x', d => {
          const treeNode = treeData.descendants().find(n => n.data.id === d.id);
          return treeNode ? treeNode.x + 50 : d.x;
        })
        .attr('y', d => {
          const treeNode = treeData.descendants().find(n => n.data.id === d.id);
          return treeNode ? treeNode.y + 50 : d.y;
        });
    }
  }
  
  /**
   * Apply radial layout
   * @param {Object} g - D3 selection of the main group
   * @param {Object} node - D3 selection of nodes
   * @param {Object} link - D3 selection of links
   */
  applyRadialLayout(g, node, link) {
    // Create hierarchy from data
    const hierarchy = this.createHierarchy();
    
    // Create radial layout
    const radialLayout = d3.tree()
      .size([2 * Math.PI, Math.min(this.options.width, this.options.height) / 2 - 100]);
    
    // Apply layout
    const radialData = radialLayout(hierarchy);
    
    // Update node positions
    node
      .attr('cx', d => {
        const radialNode = radialData.descendants().find(n => n.data.id === d.id);
        return radialNode ? 
          this.options.width / 2 + radialNode.y * Math.cos(radialNode.x - Math.PI / 2) : 
          d.x;
      })
      .attr('cy', d => {
        const radialNode = radialData.descendants().find(n => n.data.id === d.id);
        return radialNode ? 
          this.options.height / 2 + radialNode.y * Math.sin(radialNode.x - Math.PI / 2) : 
          d.y;
      });
    
    // Update link positions
    link
      .attr('x1', d => {
        const sourceNode = radialData.descendants().find(n => n.data.id === d.source.id);
        return sourceNode ? 
          this.options.width / 2 + sourceNode.y * Math.cos(sourceNode.x - Math.PI / 2) : 
          d.source.x;
      })
      .attr('y1', d => {
        const sourceNode = radialData.descendants().find(n => n.data.id === d.source.id);
        return sourceNode ? 
          this.options.height / 2 + sourceNode.y * Math.sin(sourceNode.x - Math.PI / 2) : 
          d.source.y;
      })
      .attr('x2', d => {
        const targetNode = radialData.descendants().find(n => n.data.id === d.target.id);
        return targetNode ? 
          this.options.width / 2 + targetNode.y * Math.cos(targetNode.x - Math.PI / 2) : 
          d.target.x;
      })
      .attr('y2', d => {
        const targetNode = radialData.descendants().find(n => n.data.id === d.target.id);
        return targetNode ? 
          this.options.height / 2 + targetNode.y * Math.sin(targetNode.x - Math.PI / 2) : 
          d.target.y;
      });
    
    // Update label positions
    if (this.options.showLabels) {
      g.selectAll('text')
        .attr('x', d => {
          const radialNode = radialData.descendants().find(n => n.data.id === d.id);
          return radialNode ? 
            this.options.width / 2 + radialNode.y * Math.cos(radialNode.x - Math.PI / 2) : 
            d.x;
        })
        .attr('y', d => {
          const radialNode = radialData.descendants().find(n => n.data.id === d.id);
          return radialNode ? 
            this.options.height / 2 + radialNode.y * Math.sin(radialNode.x - Math.PI / 2) : 
            d.y;
        });
    }
  }
  
  /**
   * Create a hierarchy from the graph data
   * @returns {Object} - D3 hierarchy object
   */
  createHierarchy() {
    // Find root nodes (nodes that are not targets in any link)
    const targetIds = new Set(this.data.links.map(link => link.target.id || link.target));
    const rootIds = this.data.nodes
      .filter(node => !targetIds.has(node.id))
      .map(node => node.id);
    
    // If no root nodes found, use the first node
    const rootId = rootIds.length > 0 ? rootIds[0] : this.data.nodes[0].id;
    
    // Create a hierarchical structure
    const createChildren = (nodeId) => {
      const childLinks = this.data.links.filter(link => 
        (link.source.id || link.source) === nodeId
      );
      
      return childLinks.map(link => {
        const targetId = link.target.id || link.target;
        const node = this.data.nodes.find(n => n.id === targetId);
        
        return {
          id: node.id,
          name: node.name,
          type: node.type,
          children: createChildren(node.id)
        };
      });
    };
    
    const rootNode = this.data.nodes.find(n => n.id === rootId);
    const hierarchyData = {
      id: rootNode.id,
      name: rootNode.name,
      type: rootNode.type,
      children: createChildren(rootNode.id)
    };
    
    return d3.hierarchy(hierarchyData);
  }
  
  /**
   * Get the color for a node based on its type
   * @param {Object} node - The node to get color for
   * @returns {string} - The color for the node
   */
  getNodeColor(node) {
    const colors = this.options.colors;
    
    switch (node.type) {
      case 'container':
        return colors.container;
      case 'hoc':
        return colors.hoc;
      case 'context':
        return colors.context;
      case 'custom':
        return colors.custom;
      default:
        return colors.component;
    }
  }
  
  /**
   * Setup drag behavior for nodes
   * @returns {Object} - D3 drag behavior
   */
  setupDragBehavior() {
    return d3.drag()
      .on('start', (event, d) => {
        if (!event.active && this.simulation) {
          this.simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active && this.simulation) {
          this.simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
      });
  }
  
  /**
   * Handle mouse over event on a node
   * @param {Object} event - The mouse event
   * @param {Object} d - The node data
   */
  handleNodeMouseOver(event, d) {
    if (this.options.highlightConnections) {
      this.highlightConnections(d);
    }
    
    if (this.options.showTooltips) {
      this.showTooltip(event, d);
    }
  }
  
  /**
   * Handle mouse out event on a node
   * @param {Object} event - The mouse event
   * @param {Object} d - The node data
   */
  handleNodeMouseOut(event, d) {
    if (this.options.highlightConnections && !this.selectedNode) {
      this.resetHighlighting();
    }
    
    if (this.options.showTooltips) {
      this.hideTooltip();
    }
  }
  
  /**
   * Handle click event on a node
   * @param {Object} event - The mouse event
   * @param {Object} d - The node data
   */
  handleNodeClick(event, d) {
    if (this.selectedNode === d) {
      // Deselect if already selected
      this.selectedNode = null;
      this.resetHighlighting();
    } else {
      // Select new node
      this.selectedNode = d;
      this.highlightConnections(d);
    }
    
    // Trigger custom event
    const customEvent = new CustomEvent('componentSelected', {
      detail: { component: d }
    });
    document.getElementById(this.containerId).dispatchEvent(customEvent);
  }
  
  /**
   * Highlight connections for a node
   * @param {Object} node - The node to highlight connections for
   */
  highlightConnections(node) {
    // Dim all nodes and links
    this.svg.selectAll('circle')
      .attr('opacity', 0.3);
    
    this.svg.selectAll('line')
      .attr('opacity', 0.1)
      .attr('stroke', this.options.colors.link);
    
    if (this.options.showLabels) {
      this.svg.selectAll('text')
        .attr('opacity', 0.3);
    }
    
    // Get connected nodes
    const connectedLinks = this.data.links.filter(link => 
      (link.source.id || link.source) === node.id || 
      (link.target.id || link.target) === node.id
    );
    
    const connectedNodeIds = new Set();
    connectedNodeIds.add(node.id);
    
    connectedLinks.forEach(link => {
      const sourceId = link.source.id || link.source;
      const targetId = link.target.id || link.target;
      connectedNodeIds.add(sourceId);
      connectedNodeIds.add(targetId);
    });
    
    // Highlight connected nodes
    this.svg.selectAll('circle')
      .filter(d => connectedNodeIds.has(d.id))
      .attr('opacity', 1);
    
    // Highlight connected links
    this.svg.selectAll('line')
      .filter(d => 
        connectedNodeIds.has(d.source.id || d.source) && 
        connectedNodeIds.has(d.target.id || d.target)
      )
      .attr('opacity', 1)
      .attr('stroke', this.options.colors.highlight);
    
    // Highlight labels of connected nodes
    if (this.options.showLabels) {
      this.svg.selectAll('text')
        .filter(d => connectedNodeIds.has(d.id))
        .attr('opacity', 1);
    }
  }
  
  /**
   * Reset highlighting to default state
   */
  resetHighlighting() {
    this.svg.selectAll('circle')
      .attr('opacity', 1);
    
    this.svg.selectAll('line')
      .attr('opacity', 1)
      .attr('stroke', this.options.colors.link);
    
    if (this.options.showLabels) {
      this.svg.selectAll('text')
        .attr('opacity', 1);
    }
  }
  
  /**
   * Show tooltip for a node
   * @param {Object} event - The mouse event
   * @param {Object} d - The node data
   */
  showTooltip(event, d) {
    if (!this.tooltip) return;
    
    // Create tooltip content
    let content = `<div style="font-weight: bold;">${d.name}</div>`;
    content += `<div>Type: ${d.type}</div>`;
    
    if (d.props && d.props.length) {
      content += `<div>Props: ${d.props.join(', ')}</div>`;
    }
    
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
   * Update the visualization with new data
   * @param {Object} data - The new component data
   */
  updateData(data) {
    this.data = this.processData(data);
    this.render();
  }
  
  /**
   * Change the layout of the visualization
   * @param {string} layout - The layout type ('force', 'tree', 'radial')
   */
  changeLayout(layout) {
    if (['force', 'tree', 'radial'].includes(layout)) {
      this.options.layout = layout;
      this.render();
    } else {
      console.error(`Invalid layout: ${layout}. Must be 'force', 'tree', or 'radial'`);
    }
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
}

module.exports = {
  createComponentGraph,
  ComponentGraphVisualization
};