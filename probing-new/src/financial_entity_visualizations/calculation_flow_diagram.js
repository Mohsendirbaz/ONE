

/**
 * Renders an interactive diagram of financial calculation workflows
 * Shows how calculations flow from inputs to financial metrics
 */
function renderCalculationFlowDiagram(container, data, options = {}) {
  const { 
    width = 900, 
    height = 600,
    nodeRadius = 8,
    linkDistance = 100,
    financialMetricColor = '#e41a1c',
    inputParameterColor = '#377eb8',
    calculationNodeColor = '#4daf4a',
    optimizationLoopColor = '#ff7f00'
  } = options;

  // Clear any existing content
  d3.select(container).html("");

  // Create SVG container
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("class", "calculation-flow-diagram");

  // Create tooltip
  const tooltip = d3.select(container)
    .append("div")
    .attr("class", "diagram-tooltip")
    .style("opacity", 0);

  // Process data into nodes and links
  const { nodes, links } = processCalculationData(data);

  // Create force simulation
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(linkDistance))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(nodeRadius * 1.5));

  // Add links
  const link = svg.append("g")
    .attr("class", "calculation-links")
    .selectAll("path")
    .data(links)
    .enter().append("path")
    .attr("class", d => `link ${d.type}`)
    .attr("marker-end", d => `url(#arrow-${d.type})`)
    .attr("stroke", getLinkColor)
    .attr("stroke-width", d => d.value || 1);

  // Add arrow markers
  const markerTypes = ['default', 'financial', 'optimization'];

  svg.append("defs").selectAll("marker")
    .data(markerTypes)
    .enter().append("marker")
    .attr("id", d => `arrow-${d}`)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 20)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", d => {
      if (d === 'financial') return financialMetricColor;
      if (d === 'optimization') return optimizationLoopColor;
      return '#999';
    });

  // Add nodes
  const node = svg.append("g")
    .attr("class", "calculation-nodes")
    .selectAll(".node")
    .data(nodes)
    .enter().append("g")
    .attr("class", d => `node ${d.type}`)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  // Add circles to nodes
  node.append("circle")
    .attr("r", d => {
      // Make financial metric nodes larger
      if (d.type === 'financial_metric') return nodeRadius * 1.5;
      // Make optimization nodes larger
      if (d.type === 'optimization') return nodeRadius * 1.3;
      return nodeRadius;
    })
    .attr("fill", d => {
      // Color based on node type
      if (d.type === 'financial_metric') return financialMetricColor;
      if (d.type === 'input_parameter') return inputParameterColor;
      if (d.type === 'calculation') return calculationNodeColor;
      if (d.type === 'optimization') return optimizationLoopColor;
      return '#999';
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  // Add labels to nodes
  node.append("text")
    .attr("dy", -10)
    .attr("text-anchor", "middle")
    .text(d => d.name)
    .attr("font-family", "Arial")
    .attr("font-size", "10px")
    .attr("fill", "#333");

  // Add tooltips
  node.on("mouseover", function(event, d) {
    tooltip.transition()
      .duration(200)
      .style("opacity", .9);

    tooltip.html(createTooltipContent(d))
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", function() {
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);
  });

  // Handle node click to highlight connected nodes
  node.on("click", function(event, d) {
    highlightConnectedNodes(d, node, link);

    // Show additional information in a panel
    if (options.onNodeClick) {
      options.onNodeClick(d);
    }
  });

  // Update positions on each simulation tick
  simulation.on("tick", () => {
    // Update link paths
    link.attr("d", d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy);

      // Draw straight lines for most connections
      // But curved lines for self-references (optimization loops)
      if (d.source === d.target) {
        // Self loop
        return `M${d.source.x},${d.source.y} A40,40 0 1,1 ${d.target.x},${d.target.y}`;
      } else {
        // Regular connection
        return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
      }
    });

    // Update node positions
    node.attr("transform", d => `translate(${d.x},${d.y})`);
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

  // Determine link color based on type
  function getLinkColor(d) {
    if (d.type === 'financial') return financialMetricColor;
    if (d.type === 'optimization') return optimizationLoopColor;
    return '#999';
  }

  // Create tooltip content
  function createTooltipContent(d) {
    let content = `<div class="tooltip-title">${d.name}</div>`;

    if (d.description) {
      content += `<div class="tooltip-description">${d.description}</div>`;
    }

    if (d.formula) {
      content += `<div class="tooltip-formula">${d.formula}</div>`;
    }

    if (d.type === 'financial_metric') {
      content += `<div class="tooltip-metric">Financial Metric</div>`;
    } else if (d.type === 'input_parameter') {
      content += `<div class="tooltip-parameter">Input Parameter</div>`;
    } else if (d.type === 'optimization') {
      content += `<div class="tooltip-optimization">Optimization Loop</div>`;
    }

    return content;
  }

  // Highlight nodes connected to the selected node
  function highlightConnectedNodes(selectedNode, allNodes, allLinks) {
    // Reset all nodes and links to default styles
    allNodes.select("circle")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    allLinks
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => d.value || 1);

    // Highlight selected node
    d3.select(this).select("circle")
      .attr("stroke", "#000")
      .attr("stroke-width", 2.5);

    // Find connected nodes
    const connectedNodes = new Set();
    connectedNodes.add(selectedNode.id);

    // Add all nodes directly connected to the selected node
    allLinks.each(function(d) {
      if (d.source.id === selectedNode.id) {
        connectedNodes.add(d.target.id);
      }
      if (d.target.id === selectedNode.id) {
        connectedNodes.add(d.source.id);
      }
    });

    // Highlight connected nodes
    allNodes.filter(d => connectedNodes.has(d.id))
      .select("circle")
      .attr("stroke", "#000")
      .attr("stroke-width", 2.5);

    // Highlight connected links
    allLinks.filter(d => 
      connectedNodes.has(d.source.id) && connectedNodes.has(d.target.id)
    )
      .attr("stroke-opacity", 1)
      .attr("stroke-width", d => (d.value || 1) * 2);
  }

  // Process calculation data into nodes and links
  function processCalculationData(data) {
    const nodes = [];
    const links = [];

    // Process each calculation block
    for (const blockType in data.calculationBlocks) {
      const block = data.calculationBlocks[blockType];

      // Convert calculation nodes into graph nodes
      block.forEach(calculation => {
        // Add the calculation node
        nodes.push({
          id: calculation.id,
          name: calculation.name,
          description: calculation.description,
          formula: calculation.formula,
          type: calculation.type || 'calculation'
        });

        // Add links from inputs to this calculation
        calculation.inputs.forEach(input => {
          links.push({
            source: input,
            target: calculation.id,
            type: 'default',
            value: 1
          });
        });

        // Add links from this calculation to outputs
        calculation.outputs.forEach(output => {
          links.push({
            source: calculation.id,
            target: output,
            type: output.includes('npv') || output.includes('irr') ? 'financial' : 'default',
            value: 1
          });
        });
      });
    }

    // Add optimization loops
    data.iterativeProcesses.forEach(process => {
      // Add optimization node
      nodes.push({
        id: process.id,
        name: process.name,
        description: `Optimizes ${process.target} based on ${process.metric}`,
        type: 'optimization'
      });

      // Add links for the optimization process
      links.push({
        source: process.metric,
        target: process.id,
        type: 'optimization',
        value: 2
      });

      links.push({
        source: process.id,
        target: process.target,
        type: 'optimization',
        value: 2
      });
    });

    return { nodes, links };
  }

  return {
    svg,
    simulation,
    update: (newData) => {
      // Function to update the diagram with new data
      const { nodes: newNodes, links: newLinks } = processCalculationData(newData);

      // Update the simulation
      simulation.nodes(newNodes);
      simulation.force("link").links(newLinks);
      simulation.alpha(1).restart();

      // Update the diagram elements
      // Update links
      const updatedLink = svg.select(".calculation-links")
        .selectAll("path")
        .data(newLinks);

      updatedLink.exit().remove();
      
      updatedLink.enter().append("path")
        .attr("class", d => `link ${d.type}`)
        .attr("marker-end", d => `url(#arrow-${d.type})`)
        .attr("stroke", getLinkColor)
        .attr("stroke-width", d => d.value || 1);

      // Update nodes
      const updatedNode = svg.select(".calculation-nodes")
        .selectAll(".node")
        .data(newNodes);

      updatedNode.exit().remove();
      
      const newNode = updatedNode.enter().append("g")
        .attr("class", d => `node ${d.type}`)
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      newNode.append("circle")
        .attr("r", d => {
          if (d.type === 'financial_metric') return nodeRadius * 1.5;
          if (d.type === 'optimization') return nodeRadius * 1.3;
          return nodeRadius;
        })
        .attr("fill", d => {
          if (d.type === 'financial_metric') return financialMetricColor;
          if (d.type === 'input_parameter') return inputParameterColor;
          if (d.type === 'calculation') return calculationNodeColor;
          if (d.type === 'optimization') return optimizationLoopColor;
          return '#999';
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

      newNode.append("text")
        .attr("dy", -10)
        .attr("text-anchor", "middle")
        .text(d => d.name)
        .attr("font-family", "Arial")
        .attr("font-size", "10px")
        .attr("fill", "#333");

      // Add tooltips to new nodes
      newNode.on("mouseover", function(event, d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);

        tooltip.html(createTooltipContent(d))
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

      // Handle node click for new nodes
      newNode.on("click", function(event, d) {
        highlightConnectedNodes(d, updatedNode.merge(newNode), updatedLink.merge(newLink));

        if (options.onNodeClick) {
          options.onNodeClick(d);
        }
      });
    }
  };
}