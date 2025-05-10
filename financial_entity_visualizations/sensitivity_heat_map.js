

/**
 * Renders a heat map visualization for sensitivity analysis
 * Shows how different parameters affect financial outcomes
 */
function renderSensitivityHeatMap(container, data, options = {}) {
  const {
    width = 900,
    height = 600,
    margin = { top: 50, right: 50, bottom: 100, left: 150 },
    colorRange = ["#fff5f0", "#fb6a4a", "#a50f15"],
    showLabels = true,
    interactive = true
  } = options;

  // Clear any existing content
  d3.select(container).html("");

  // Create SVG container
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("class", "sensitivity-heat-map");

  // Process the data for the heat map
  const { parameters, metrics, sensitivityMatrix } = processSensitivityData(data);

  // Set up scales
  const xScale = d3.scaleBand()
    .domain(parameters.map(p => p.name))
    .range([margin.left, width - margin.right])
    .padding(0.05);

  const yScale = d3.scaleBand()
    .domain(metrics.map(m => m.name))
    .range([margin.top, height - margin.bottom])
    .padding(0.05);

  // Color scale for sensitivity values
  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRgb(colorRange[0], colorRange[colorRange.length - 1]))
    .domain([0, d3.max(sensitivityMatrix, d => d.sensitivity)]);

  // Add X axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("font-size", "12px");

  // Add Y axis
  svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .attr("font-size", "12px");

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Parameter Sensitivity Analysis");

  // Create tooltip
  const tooltip = d3.select(container)
    .append("div")
    .attr("class", "sensitivity-tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("padding", "8px")
    .style("pointer-events", "none");

  // Add heat map cells
  const cells = svg.selectAll(".cell")
    .data(sensitivityMatrix)
    .enter().append("rect")
    .attr("class", "cell")
    .attr("x", d => xScale(d.parameter))
    .attr("y", d => yScale(d.metric))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", d => colorScale(d.sensitivity))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

  // Add sensitivity values as text if showLabels is true
  if (showLabels) {
    svg.selectAll(".cell-text")
      .data(sensitivityMatrix)
      .enter().append("text")
      .attr("class", "cell-text")
      .attr("x", d => xScale(d.parameter) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.metric) + yScale.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "10px")
      .attr("fill", d => d.sensitivity > d3.max(sensitivityMatrix, d => d.sensitivity) / 2 ? "#fff" : "#000")
      .text(d => d.sensitivity.toFixed(2));
  }

  // Add interactivity
  if (interactive) {
    cells.on("mouseover", function(event, d) {
      // Highlight cell
      d3.select(this)
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

      // Show tooltip
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);

      tooltip.html(createTooltipContent(d))
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      // Reset cell highlight
      d3.select(this)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);

      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .on("click", function(event, d) {
      if (options.onCellClick) {
        options.onCellClick(d);
      }
    });
  }

  // Add color legend
  const legendWidth = 20;
  const legendHeight = height - margin.top - margin.bottom;
  
  const legendScale = d3.scaleSequential()
    .interpolator(d3.interpolateRgb(colorRange[0], colorRange[colorRange.length - 1]))
    .domain([0, 1]);

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

  // Create gradient for legend
  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "sensitivity-gradient")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%");

  // Add color stops
  linearGradient.selectAll("stop")
    .data(d3.range(0, 1.1, 0.1))
    .enter().append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => legendScale(d));

  // Add gradient rectangle
  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#sensitivity-gradient)");

  // Add legend axis
  const legendAxis = d3.axisRight()
    .scale(d3.scaleLinear().domain([0, d3.max(sensitivityMatrix, d => d.sensitivity)]).range([legendHeight, 0]))
    .ticks(5);

  legend.append("g")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);

  // Add legend title
  legend.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .attr("text-anchor", "start")
    .attr("font-size", "12px")
    .text("Sensitivity");

  // Create tooltip content
  function createTooltipContent(d) {
    const parameter = parameters.find(p => p.name === d.parameter);
    const metric = metrics.find(m => m.name === d.metric);
    
    let content = `<div style="font-weight: bold;">Parameter: ${d.parameter}</div>`;
    content += `<div>Metric: ${d.metric}</div>`;
    content += `<div>Sensitivity: ${d.sensitivity.toFixed(4)}</div>`;
    
    if (parameter && parameter.type) {
      content += `<div>Parameter Type: ${parameter.type}</div>`;
    }
    
    if (d.description) {
      content += `<div>Description: ${d.description}</div>`;
    }
    
    return content;
  }

  // Return methods for updating the heat map
  return {
    update: (newData) => {
      // Process the new data
      const { parameters: newParams, metrics: newMetrics, sensitivityMatrix: newMatrix } = 
        processSensitivityData(newData);
      
      // Update scales
      xScale.domain(newParams.map(p => p.name));
      yScale.domain(newMetrics.map(m => m.name));
      colorScale.domain([0, d3.max(newMatrix, d => d.sensitivity)]);
      
      // Update axes
      svg.select(".x-axis")
        .transition()
        .duration(500)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em");
      
      svg.select(".y-axis")
        .transition()
        .duration(500)
        .call(d3.axisLeft(yScale));
      
      // Update cells
      const updatedCells = svg.selectAll(".cell")
        .data(newMatrix);
      
      updatedCells.exit().remove();
      
      updatedCells.enter().append("rect")
        .attr("class", "cell")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .merge(updatedCells)
        .transition()
        .duration(500)
        .attr("x", d => xScale(d.parameter))
        .attr("y", d => yScale(d.metric))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.sensitivity));
      
      // Update cell text if labels are shown
      if (showLabels) {
        const updatedText = svg.selectAll(".cell-text")
          .data(newMatrix);
        
        updatedText.exit().remove();
        
        updatedText.enter().append("text")
          .attr("class", "cell-text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "10px")
          .merge(updatedText)
          .transition()
          .duration(500)
          .attr("x", d => xScale(d.parameter) + xScale.bandwidth() / 2)
          .attr("y", d => yScale(d.metric) + yScale.bandwidth() / 2)
          .attr("fill", d => d.sensitivity > d3.max(newMatrix, d => d.sensitivity) / 2 ? "#fff" : "#000")
          .text(d => d.sensitivity.toFixed(2));
      }
      
      // Update legend
      legendAxis.scale(d3.scaleLinear().domain([0, d3.max(newMatrix, d => d.sensitivity)]).range([legendHeight, 0]));
      
      legend.select("g")
        .transition()
        .duration(500)
        .call(legendAxis);
    }
  };
}

/**
 * Process sensitivity data for the heat map
 */
function processSensitivityData(data) {
  const parameters = [];
  const metrics = [];
  const sensitivityMatrix = [];

  // Extract parameters
  if (data.parameters) {
    data.parameters.forEach(param => {
      parameters.push({
        name: param.name,
        type: param.type,
        description: param.description
      });
    });
  }

  // Extract metrics
  if (data.metrics) {
    data.metrics.forEach(metric => {
      metrics.push({
        name: metric.name,
        description: metric.description
      });
    });
  }

  // Create sensitivity matrix
  if (data.sensitivities) {
    data.sensitivities.forEach(sensitivity => {
      sensitivityMatrix.push({
        parameter: sensitivity.parameter,
        metric: sensitivity.metric,
        sensitivity: sensitivity.value,
        description: sensitivity.description
      });
    });
  } else {
    // If no sensitivities provided, create a matrix with default values
    parameters.forEach(param => {
      metrics.forEach(metric => {
        sensitivityMatrix.push({
          parameter: param.name,
          metric: metric.name,
          sensitivity: Math.random(), // Default to random values for demonstration
          description: `Sensitivity of ${metric.name} to changes in ${param.name}`
        });
      });
    });
  }

  return { parameters, metrics, sensitivityMatrix };
}

/**
 * Create a sensitivity analysis dataset from parameter variations
 * This can be used to generate sensitivity data from model runs
 */
function calculateSensitivityMatrix(baselineValues, variations, metricFunctions) {
  const parameters = Object.keys(baselineValues);
  const metrics = Object.keys(metricFunctions);
  const sensitivities = [];

  // Calculate baseline metrics
  const baselineMetrics = {};
  for (const metric of metrics) {
    baselineMetrics[metric] = metricFunctions[metric](baselineValues);
  }

  // Calculate sensitivity for each parameter and metric
  for (const param of parameters) {
    // Get the variation for this parameter
    const variation = variations[param] || 0.01; // Default to 1% variation
    
    // Create parameter set with this parameter varied
    const variedValues = { ...baselineValues };
    variedValues[param] = baselineValues[param] * (1 + variation);
    
    // Calculate metrics with varied parameter
    for (const metric of metrics) {
      const variedMetric = metricFunctions[metric](variedValues);
      
      // Calculate sensitivity as percent change in metric / percent change in parameter
      const metricChange = (variedMetric - baselineMetrics[metric]) / baselineMetrics[metric];
      const paramChange = variation;
      
      const sensitivity = metricChange / paramChange;
      
      sensitivities.push({
        parameter: param,
        metric: metric,
        value: Math.abs(sensitivity), // Use absolute value for heat map
        description: `Elasticity of ${metric} with respect to ${param}`
      });
    }
  }

  return {
    parameters: parameters.map(p => ({ name: p })),
    metrics: metrics.map(m => ({ name: m })),
    sensitivities
  };
}