import * as d3 from 'd3';

/**
 * Renders an interactive graph showing parameter influence on financial outputs
 * Visualizes how changes in input parameters affect financial metrics
 */
export function renderParameterInfluenceGraph(container, data, options = {}) {
  const {
    width = 900,
    height = 600,
    showLabels = true,
    interactive = true,
    colorScale = d3.scaleOrdinal(d3.schemeCategory10)
  } = options;

  // Clear any existing content
  d3.select(container).html("");

  // Create SVG container
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("class", "parameter-influence-graph");

  // Process the data to create directed graph
  const { nodes, links } = processInfluenceData(data);

  // Calculate influence scores and metrics
  calculateInfluenceMetrics(nodes, links);

  // Create hierarchical layout
  const hierarchy = createHierarchicalLayout(nodes, links);

  // Create stratified layout with financial metrics at top
  const stratifiedNodes = stratifyNodes(nodes);

  // Draw the influence graph using a hierarchical layout
  drawHierarchicalInfluenceGraph(svg, stratifiedNodes, links, {
    width,
    height,
    showLabels,
    interactive,
    colorScale
  });

  // Add legends and annotations
  addLegends(svg, data);

  // Add interactivity for parameter value adjustment
  if (interactive) {
    addParameterControls(container, nodes, data);
  }

  // Return methods for updating the graph
  return {
    update: (newData) => {
      // Update the graph with new data
      const { nodes: newNodes, links: newLinks } = processInfluenceData(newData);
      calculateInfluenceMetrics(newNodes, newLinks);
      // Update visualization
      updateHierarchicalInfluenceGraph(svg, newNodes, newLinks);
    }
  };
}

/**
 * Process data to prepare for influence graph
 */
function processInfluenceData(data) {
  const nodes = [];
  const links = [];

  // Extract nodes from parameters
  data.parameters.forEach(param => {
    nodes.push({
      id: param.name,
      name: param.name,
      type: param.type || 'parameter',
      value: param.value,
      impact: 0 // Will be calculated
    });
  });

  // Add financial metric nodes
  data.financialMetrics.forEach(metric => {
    nodes.push({
      id: metric.name,
      name: metric.name,
      type: 'financial_metric',
      value: metric.value,
      impact: 0 // Will be calculated
    });
  });

  // Process dependencies to create links
  data.dependencies.forEach(dep => {
    links.push({
      source: dep.from,
      target: dep.to,
      value: dep.strength || 1,
      type: dep.type || 'influence'
    });
  });

  return { nodes, links };
}

/**
 * Calculate influence metrics for all nodes
 */
function calculateInfluenceMetrics(nodes, links) {
  // Calculate in-degree and out-degree for each node
  const inDegree = {};
  const outDegree = {};

  links.forEach(link => {
    // Initialize if not already set
    inDegree[link.target] = inDegree[link.target] || 0;
    outDegree[link.source] = outDegree[link.source] || 0;

    // Increment degree counts
    inDegree[link.target] += link.value;
    outDegree[link.source] += link.value;
  });

  // Calculate influence score based on degrees
  nodes.forEach(node => {
    // Influence score combines both how many parameters this affects
    // and how many parameters affect this
    const inDeg = inDegree[node.id] || 0;
    const outDeg = outDegree[node.id] || 0;

    // Parameters that affect many outputs and have few inputs are most influential
    node.impact = outDeg * (1 + 0.5 * inDeg);
    node.inDegree = inDeg;
    node.outDegree = outDeg;
  });
}

/**
 * Create hierarchical layout for the influence graph
 */
function createHierarchicalLayout(nodes, links) {
  // Group nodes into layers based on their relationship to financial metrics
  const layers = {
    metrics: [],      // Financial metrics (top layer)
    intermediate: [], // Parameters that affect metrics but are affected by other parameters
    primary: []       // Parameters that are not affected by other parameters (bottom layer)
  };

  // Identify financial metrics
  nodes.filter(n => n.type === 'financial_metric').forEach(n => {
    layers.metrics.push(n.id);
  });

  // Identify primary parameters (have no incoming links)
  const hasIncoming = new Set();
  links.forEach(link => {
    hasIncoming.add(link.target);
  });

  nodes.filter(n => !hasIncoming.has(n.id) && n.type !== 'financial_metric').forEach(n => {
    layers.primary.push(n.id);
  });

  // Remaining nodes are intermediate
  nodes.filter(n => !layers.metrics.includes(n.id) && !layers.primary.includes(n.id)).forEach(n => {
    layers.intermediate.push(n.id);
  });

  return layers;
}

/**
 * Stratify nodes for hierarchical layout
 */
function stratifyNodes(nodes) {
  // Arrange nodes into hierarchical layout with financial metrics at top
  const stratified = [];

  // Sort nodes by type and impact
  const byType = {
    financial_metric: nodes.filter(n => n.type === 'financial_metric').sort((a, b) => b.impact - a.impact),
    rate: nodes.filter(n => n.type === 'rate').sort((a, b) => b.impact - a.impact),
    monetary: nodes.filter(n => n.type === 'monetary').sort((a, b) => b.impact - a.impact),
    quantity: nodes.filter(n => n.type === 'quantity').sort((a, b) => b.impact - a.impact),
    time: nodes.filter(n => n.type === 'time').sort((a, b) => b.impact - a.impact),
    other: nodes.filter(n => !['financial_metric', 'rate', 'monetary', 'quantity', 'time'].includes(n.type))
                .sort((a, b) => b.impact - a.impact)
  };

  // Combine in the order we want to display
  return [
    ...byType.financial_metric, // Financial metrics at top
    ...byType.rate,             // Rates next
    ...byType.monetary,         // Monetary parameters
    ...byType.quantity,         // Quantity parameters
    ...byType.time,             // Time parameters
    ...byType.other             // Other parameters at bottom
  ];
}

/**
 * Draw hierarchical influence graph
 */
function drawHierarchicalInfluenceGraph(svg, nodes, links, options) {
  const {
    width,
    height,
    showLabels,
    interactive,
    colorScale
  } = options;

  // Create force simulation for the graph
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("y", d3.forceY().y(d => {
      // Position nodes by type
      if (d.type === 'financial_metric') return height * 0.2;
      if (d.type === 'rate') return height * 0.4;
      if (d.type === 'monetary') return height * 0.6;
      return height * 0.8;
    }))
    .force("x", d3.forceX().x(width / 2))
    .force("collision", d3.forceCollide().radius(d => Math.sqrt(d.impact) * 2 + 10));

  // Create links
  const link = svg.append("g")
    .attr("class", "influence-links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", d => Math.sqrt(d.value));

  // Create nodes
  const node = svg.append("g")
    .attr("class", "influence-nodes")
    .selectAll("g")
    .data(nodes)
    .enter().append("g")
    .attr("class", d => `node ${d.type}`)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  // Add circles to nodes
  node.append("circle")
    .attr("r", d => Math.sqrt(d.impact) * 2 + 5)
    .attr("fill", d => colorScale(d.type))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  // Add labels if enabled
  if (showLabels) {
    node.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .text(d => d.name)
      .attr("font-family", "Arial")
      .attr("font-size", "10px")
      .attr("fill", "#333");
  }

  // Add tooltips
  const tooltip = d3.select(options.container || svg.node().parentNode)
    .append("div")
    .attr("class", "influence-tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("padding", "8px")
    .style("pointer-events", "none");

  node.on("mouseover", function(event, d) {
    tooltip.transition()
      .duration(200)
      .style("opacity", .9);

    tooltip.html(createTooltipContent(d))
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");

    // Highlight connected nodes
    if (interactive) {
      highlightConnections(d, node, link);
    }
  })
  .on("mouseout", function() {
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);

    // Reset highlights
    if (interactive) {
      resetHighlights(node, link);
    }
  });

  // Add click behavior
  if (interactive) {
    node.on("click", function(event, d) {
      if (options.onNodeClick) {
        options.onNodeClick(d);
      }
    });
  }

  // Update positions on simulation tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("transform", d => `translate(${d.x},${d.y})`);
  });

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", zoomed);

  svg.call(zoom);

  function zoomed(event) {
    svg.selectAll("g").attr("transform", event.transform);
  }

  // Drag event handlers
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Create tooltip content
  function createTooltipContent(d) {
    let content = `<div style="font-weight: bold;">${d.name}</div>`;
    content += `<div>Type: ${d.type}</div>`;
    content += `<div>Impact: ${d.impact.toFixed(2)}</div>`;
    content += `<div>Incoming: ${d.inDegree}</div>`;
    content += `<div>Outgoing: ${d.outDegree}</div>`;
    if (d.value !== undefined) {
      content += `<div>Value: ${d.value}</div>`;
    }
    return content;
  }

  // Highlight connected nodes and links
  function highlightConnections(d, allNodes, allLinks) {
    // Dim all nodes and links
    allNodes.select("circle")
      .attr("opacity", 0.3);
    allLinks
      .attr("stroke-opacity", 0.1);

    // Highlight the selected node
    allNodes.filter(n => n.id === d.id)
      .select("circle")
      .attr("opacity", 1)
      .attr("stroke", "#000")
      .attr("stroke-width", 2);

    // Highlight directly connected nodes and links
    allLinks.each(function(l) {
      if (l.source.id === d.id || l.target.id === d.id) {
        d3.select(this)
          .attr("stroke-opacity", 0.8)
          .attr("stroke", l.source.id === d.id ? "#f00" : "#00f");

        // Highlight connected nodes
        allNodes.filter(n => n.id === (l.source.id === d.id ? l.target.id : l.source.id))
          .select("circle")
          .attr("opacity", 1);
      }
    });
  }

  // Reset highlights
  function resetHighlights(allNodes, allLinks) {
    allNodes.select("circle")
      .attr("opacity", 1)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);
    allLinks
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);
  }

  return simulation;
}

/**
 * Add legends to the graph
 */
function addLegends(svg, data) {
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(20,20)");

  // Create legend items for node types
  const types = [
    { type: 'financial_metric', label: 'Financial Metric', color: '#e41a1c' },
    { type: 'rate', label: 'Rate Parameter', color: '#377eb8' },
    { type: 'monetary', label: 'Monetary Parameter', color: '#4daf4a' },
    { type: 'quantity', label: 'Quantity Parameter', color: '#984ea3' },
    { type: 'time', label: 'Time Parameter', color: '#ff7f00' }
  ];

  const legendItems = legend.selectAll(".legend-item")
    .data(types)
    .enter().append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  legendItems.append("circle")
    .attr("r", 6)
    .attr("fill", d => d.color);

  legendItems.append("text")
    .attr("x", 15)
    .attr("y", 4)
    .text(d => d.label)
    .attr("font-family", "Arial")
    .attr("font-size", "12px")
    .attr("fill", "#333");

  // Add legend for impact size
  const impactLegend = svg.append("g")
    .attr("class", "impact-legend")
    .attr("transform", `translate(${svg.attr("width") - 150},20)`);

  impactLegend.append("text")
    .attr("y", -5)
    .text("Impact Size")
    .attr("font-family", "Arial")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("fill", "#333");

  const impactSizes = [1, 5, 10];
  const impactItems = impactLegend.selectAll(".impact-item")
    .data(impactSizes)
    .enter().append("g")
    .attr("class", "impact-item")
    .attr("transform", (d, i) => `translate(0,${i * 25 + 10})`);

  impactItems.append("circle")
    .attr("r", d => Math.sqrt(d) * 2 + 5)
    .attr("fill", "#ccc")
    .attr("stroke", "#fff");

  impactItems.append("text")
    .attr("x", 20)
    .attr("y", 4)
    .text(d => `Impact: ${d}`)
    .attr("font-family", "Arial")
    .attr("font-size", "12px")
    .attr("fill", "#333");
}

/**
 * Add interactive parameter controls
 */
function addParameterControls(container, nodes, data) {
  // Create a control panel for adjusting parameter values
  const controlPanel = d3.select(container)
    .append("div")
    .attr("class", "parameter-controls")
    .style("margin-top", "20px");

  // Add title
  controlPanel.append("h3")
    .text("Parameter Adjustment")
    .style("margin-bottom", "10px");

  // Filter for parameters that can be adjusted
  const adjustableParams = nodes.filter(n => 
    n.type !== 'financial_metric' && 
    n.value !== undefined
  );

  // Create slider controls for each parameter
  const paramControls = controlPanel.selectAll(".param-control")
    .data(adjustableParams)
    .enter().append("div")
    .attr("class", "param-control")
    .style("margin-bottom", "10px");

  // Add label
  paramControls.append("label")
    .text(d => d.name)
    .style("display", "block")
    .style("margin-bottom", "5px");

  // Add slider and value display
  const sliderContainers = paramControls.append("div")
    .style("display", "flex")
    .style("align-items", "center");

  // Add slider
  sliderContainers.append("input")
    .attr("type", "range")
    .attr("min", d => getMinValue(d))
    .attr("max", d => getMaxValue(d))
    .attr("step", d => getStepValue(d))
    .attr("value", d => d.value)
    .style("width", "200px")
    .style("margin-right", "10px")
    .on("input", function(event, d) {
      // Update value display
      d3.select(this.parentNode).select(".value-display")
        .text(event.target.value);
      
      // Update parameter value
      d.value = parseFloat(event.target.value);
      
      // Trigger update callback if provided
      if (data.onParameterChange) {
        data.onParameterChange(d.name, d.value);
      }
    });

  // Add value display
  sliderContainers.append("span")
    .attr("class", "value-display")
    .text(d => d.value);

  // Helper functions for slider ranges
  function getMinValue(param) {
    if (param.type === 'rate') return 0;
    if (param.type === 'monetary') return 0;
    if (param.type === 'quantity') return 0;
    if (param.type === 'time') return 0;
    return param.value * 0.5; // Default to 50% of current value
  }

  function getMaxValue(param) {
    if (param.type === 'rate') return 1;
    if (param.type === 'monetary') return param.value * 2;
    if (param.type === 'quantity') return param.value * 2;
    if (param.type === 'time') return param.value * 2;
    return param.value * 1.5; // Default to 150% of current value
  }

  function getStepValue(param) {
    if (param.type === 'rate') return 0.01;
    if (param.type === 'monetary') return Math.max(1, param.value * 0.01);
    if (param.type === 'quantity') return 1;
    if (param.type === 'time') return 1;
    return param.value * 0.01; // Default to 1% of current value
  }
}

/**
 * Update the influence graph with new data
 */
function updateHierarchicalInfluenceGraph(svg, nodes, links) {
  // Update the visualization with new data
  // This would be implemented to update the graph when data changes
  // For now, this is a placeholder
}