import * as d3 from 'd3';

/**
 * Renders a visualization of optimization convergence paths
 * Shows how financial optimizations converge to target values
 */
export function renderOptimizationConvergencePlot(container, data, options = {}) {
  const {
    width = 900,
    height = 600,
    margin = { top: 50, right: 150, bottom: 70, left: 80 },
    colors = d3.schemeCategory10,
    showLegend = true,
    interactive = true,
    animateConvergence = true
  } = options;

  // Clear any existing content
  d3.select(container).html("");

  // Create SVG container
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("class", "optimization-convergence-plot");

  // Process the data for the convergence plot
  const { optimizationPaths, metrics } = processOptimizationData(data);

  // Set up scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(optimizationPaths, d => d.steps.length - 1)])
    .range([margin.left, width - margin.right]);

  // Find min and max values across all metrics for y-scale
  const allValues = optimizationPaths.flatMap(path => 
    path.steps.map(step => step.metricValue)
  );
  
  const yScale = d3.scaleLinear()
    .domain([
      d3.min(allValues) * 0.9, // Add 10% padding
      d3.max(allValues) * 1.1
    ])
    .range([height - margin.bottom, margin.top]);

  // Color scale for different optimization paths
  const colorScale = d3.scaleOrdinal()
    .domain(optimizationPaths.map(d => d.id))
    .range(colors);

  // Add X axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(10))
    .append("text")
    .attr("x", width - margin.right)
    .attr("y", 35)
    .attr("fill", "#000")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .text("Iteration");

  // Add Y axis
  svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -margin.top)
    .attr("y", -40)
    .attr("fill", "#000")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("text-anchor", "end")
    .text("Metric Value");

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Optimization Convergence Paths");

  // Create tooltip
  const tooltip = d3.select(container)
    .append("div")
    .attr("class", "convergence-tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("padding", "8px")
    .style("pointer-events", "none");

  // Create line generator
  const line = d3.line()
    .x((d, i) => xScale(i))
    .y(d => yScale(d.metricValue))
    .curve(d3.curveMonotoneX);

  // Add convergence paths
  const paths = svg.append("g")
    .attr("class", "convergence-paths")
    .selectAll(".path")
    .data(optimizationPaths)
    .enter().append("path")
    .attr("class", d => `path path-${d.id}`)
    .attr("fill", "none")
    .attr("stroke", d => colorScale(d.id))
    .attr("stroke-width", 2)
    .attr("d", d => line(d.steps));

  // Add points for each step
  const points = svg.append("g")
    .attr("class", "convergence-points")
    .selectAll("g")
    .data(optimizationPaths)
    .enter().append("g")
    .attr("class", d => `points points-${d.id}`);

  points.selectAll("circle")
    .data(d => d.steps.map((step, i) => ({ ...step, pathId: d.id, index: i })))
    .enter().append("circle")
    .attr("class", "point")
    .attr("cx", (d, i) => xScale(i))
    .attr("cy", d => yScale(d.metricValue))
    .attr("r", 4)
    .attr("fill", d => colorScale(d.pathId))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

  // Add target lines if available
  if (metrics.some(m => m.targetValue !== undefined)) {
    metrics.forEach(metric => {
      if (metric.targetValue !== undefined) {
        // Add target line
        svg.append("line")
          .attr("class", "target-line")
          .attr("x1", margin.left)
          .attr("y1", yScale(metric.targetValue))
          .attr("x2", width - margin.right)
          .attr("y2", yScale(metric.targetValue))
          .attr("stroke", "#999")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "5,5");

        // Add target label
        svg.append("text")
          .attr("class", "target-label")
          .attr("x", width - margin.right + 5)
          .attr("y", yScale(metric.targetValue))
          .attr("dy", "0.35em")
          .attr("font-size", "10px")
          .attr("fill", "#666")
          .text(`Target: ${metric.targetValue}`);
      }
    });
  }

  // Add legend if enabled
  if (showLegend) {
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    // Add legend title
    legend.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text("Optimization Paths");

    // Add legend items
    const legendItems = legend.selectAll(".legend-item")
      .data(optimizationPaths)
      .enter().append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legendItems.append("line")
      .attr("x1", 0)
      .attr("y1", 7)
      .attr("x2", 20)
      .attr("y2", 7)
      .attr("stroke", d => colorScale(d.id))
      .attr("stroke-width", 2);

    legendItems.append("text")
      .attr("x", 25)
      .attr("y", 10)
      .attr("font-size", "12px")
      .text(d => d.name);
  }

  // Add interactivity
  if (interactive) {
    // Add hover effects for paths
    paths.on("mouseover", function(event, d) {
      // Highlight path
      d3.select(this)
        .attr("stroke-width", 4);

      // Show tooltip with path info
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);

      tooltip.html(createPathTooltip(d))
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      // Reset path highlight
      d3.select(this)
        .attr("stroke-width", 2);

      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

    // Add hover effects for points
    svg.selectAll("circle.point")
      .on("mouseover", function(event, d) {
        // Highlight point
        d3.select(this)
          .attr("r", 6)
          .attr("stroke-width", 2);

        // Show tooltip with step info
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);

        tooltip.html(createStepTooltip(d))
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        // Reset point highlight
        d3.select(this)
          .attr("r", 4)
          .attr("stroke-width", 1);

        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .on("click", function(event, d) {
        if (options.onPointClick) {
          options.onPointClick(d);
        }
      });
  }

  // Animate convergence if enabled
  if (animateConvergence) {
    // Hide all points initially
    svg.selectAll("circle.point")
      .attr("opacity", 0);

    // Set initial path lengths to 0
    paths.attr("stroke-dasharray", function() {
      const totalLength = this.getTotalLength();
      return `${totalLength} ${totalLength}`;
    })
    .attr("stroke-dashoffset", function() {
      return this.getTotalLength();
    });

    // Animate paths
    paths.transition()
      .duration(2000)
      .attr("stroke-dashoffset", 0)
      .on("end", function(d, i) {
        // After path animation, show points with staggered delay
        svg.selectAll(`.points-${d.id} circle`)
          .transition()
          .delay((d, i) => i * 100)
          .duration(300)
          .attr("opacity", 1);
      });
  }

  // Create tooltip content for path
  function createPathTooltip(d) {
    let content = `<div style="font-weight: bold;">${d.name}</div>`;
    content += `<div>Target: ${d.targetMetric}</div>`;
    content += `<div>Parameter: ${d.targetParameter}</div>`;
    content += `<div>Steps: ${d.steps.length}</div>`;
    
    // Add convergence info if available
    if (d.converged) {
      content += `<div>Converged: Yes</div>`;
      content += `<div>Final Value: ${d.steps[d.steps.length - 1].metricValue.toFixed(4)}</div>`;
    } else {
      content += `<div>Converged: No</div>`;
    }
    
    return content;
  }

  // Create tooltip content for step
  function createStepTooltip(d) {
    let content = `<div style="font-weight: bold;">Iteration ${d.index}</div>`;
    content += `<div>Metric: ${d.metricValue.toFixed(4)}</div>`;
    content += `<div>Parameter: ${d.parameterValue.toFixed(4)}</div>`;
    
    if (d.delta) {
      content += `<div>Change: ${d.delta > 0 ? '+' : ''}${d.delta.toFixed(4)}</div>`;
    }
    
    return content;
  }

  // Return methods for updating the plot
  return {
    update: (newData) => {
      // Process the new data
      const { optimizationPaths: newPaths, metrics: newMetrics } = 
        processOptimizationData(newData);
      
      // Update scales
      xScale.domain([0, d3.max(newPaths, d => d.steps.length - 1)]);
      
      const newAllValues = newPaths.flatMap(path => 
        path.steps.map(step => step.metricValue)
      );
      
      yScale.domain([
        d3.min(newAllValues) * 0.9,
        d3.max(newAllValues) * 1.1
      ]);
      
      // Update axes
      svg.select(".x-axis")
        .transition()
        .duration(500)
        .call(d3.axisBottom(xScale).ticks(10));
      
      svg.select(".y-axis")
        .transition()
        .duration(500)
        .call(d3.axisLeft(yScale));
      
      // Update color scale
      colorScale.domain(newPaths.map(d => d.id));
      
      // Update paths
      const updatedPaths = svg.select(".convergence-paths")
        .selectAll(".path")
        .data(newPaths);
      
      updatedPaths.exit().remove();
      
      updatedPaths.enter().append("path")
        .attr("class", d => `path path-${d.id}`)
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d.id))
        .attr("stroke-width", 2)
        .merge(updatedPaths)
        .transition()
        .duration(500)
        .attr("d", d => line(d.steps));
      
      // Update points
      const updatedPointGroups = svg.select(".convergence-points")
        .selectAll("g")
        .data(newPaths);
      
      updatedPointGroups.exit().remove();
      
      const newPointGroups = updatedPointGroups.enter().append("g")
        .attr("class", d => `points points-${d.id}`);
      
      updatedPointGroups.merge(newPointGroups).each(function(pathData) {
        const pointGroup = d3.select(this);
        
        const points = pointGroup.selectAll("circle")
          .data(pathData.steps.map((step, i) => ({ ...step, pathId: pathData.id, index: i })));
        
        points.exit().remove();
        
        points.enter().append("circle")
          .attr("class", "point")
          .attr("r", 4)
          .attr("fill", d => colorScale(d.pathId))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .merge(points)
          .transition()
          .duration(500)
          .attr("cx", (d, i) => xScale(i))
          .attr("cy", d => yScale(d.metricValue));
      });
      
      // Update target lines
      svg.selectAll(".target-line, .target-label").remove();
      
      if (newMetrics.some(m => m.targetValue !== undefined)) {
        newMetrics.forEach(metric => {
          if (metric.targetValue !== undefined) {
            // Add target line
            svg.append("line")
              .attr("class", "target-line")
              .attr("x1", margin.left)
              .attr("y1", yScale(metric.targetValue))
              .attr("x2", width - margin.right)
              .attr("y2", yScale(metric.targetValue))
              .attr("stroke", "#999")
              .attr("stroke-width", 1)
              .attr("stroke-dasharray", "5,5");

            // Add target label
            svg.append("text")
              .attr("class", "target-label")
              .attr("x", width - margin.right + 5)
              .attr("y", yScale(metric.targetValue))
              .attr("dy", "0.35em")
              .attr("font-size", "10px")
              .attr("fill", "#666")
              .text(`Target: ${metric.targetValue}`);
          }
        });
      }
      
      // Update legend
      if (showLegend) {
        svg.select(".legend").remove();
        
        const legend = svg.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

        // Add legend title
        legend.append("text")
          .attr("x", 0)
          .attr("y", -10)
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .text("Optimization Paths");

        // Add legend items
        const legendItems = legend.selectAll(".legend-item")
          .data(newPaths)
          .enter().append("g")
          .attr("class", "legend-item")
          .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems.append("line")
          .attr("x1", 0)
          .attr("y1", 7)
          .attr("x2", 20)
          .attr("y2", 7)
          .attr("stroke", d => colorScale(d.id))
          .attr("stroke-width", 2);

        legendItems.append("text")
          .attr("x", 25)
          .attr("y", 10)
          .attr("font-size", "12px")
          .text(d => d.name);
      }
    }
  };
}

/**
 * Process optimization data for the convergence plot
 */
function processOptimizationData(data) {
  const optimizationPaths = [];
  const metrics = [];

  // Extract optimization paths
  if (data.optimizationPaths) {
    data.optimizationPaths.forEach(path => {
      optimizationPaths.push({
        id: path.id,
        name: path.name || `Path ${path.id}`,
        targetMetric: path.targetMetric,
        targetParameter: path.targetParameter,
        converged: path.converged,
        steps: path.steps.map((step, index) => ({
          metricValue: step.metricValue,
          parameterValue: step.parameterValue,
          delta: index > 0 ? step.metricValue - path.steps[index - 1].metricValue : 0
        }))
      });
    });
  }

  // Extract metrics
  if (data.metrics) {
    data.metrics.forEach(metric => {
      metrics.push({
        name: metric.name,
        targetValue: metric.targetValue,
        description: metric.description
      });
    });
  }

  return { optimizationPaths, metrics };
}

/**
 * Create a sample optimization path dataset
 * This can be used to generate sample data for demonstration
 */
export function createSampleOptimizationData(numPaths = 3, stepsPerPath = 20) {
  const optimizationPaths = [];
  const metrics = [
    { name: 'NPV', targetValue: 0, description: 'Net Present Value' },
    { name: 'IRR', targetValue: 0.15, description: 'Internal Rate of Return' }
  ];

  // Create sample paths
  for (let i = 0; i < numPaths; i++) {
    const pathId = `path_${i + 1}`;
    const targetMetric = metrics[i % metrics.length].name;
    const targetParameter = `parameter_${i + 1}`;
    
    // Create convergence pattern
    const steps = [];
    let currentMetricValue;
    let currentParameterValue;
    
    if (i === 0) {
      // First path: converges from above
      currentMetricValue = 0.5;
      currentParameterValue = 0.8;
      
      for (let j = 0; j < stepsPerPath; j++) {
        steps.push({
          metricValue: currentMetricValue,
          parameterValue: currentParameterValue
        });
        
        // Exponential convergence
        currentMetricValue = 0 + (currentMetricValue - 0) * 0.85;
        currentParameterValue = 0.5 + (currentParameterValue - 0.5) * 0.9;
      }
    } else if (i === 1) {
      // Second path: converges from below
      currentMetricValue = -0.3;
      currentParameterValue = 0.2;
      
      for (let j = 0; j < stepsPerPath; j++) {
        steps.push({
          metricValue: currentMetricValue,
          parameterValue: currentParameterValue
        });
        
        // Exponential convergence
        currentMetricValue = 0 + (currentMetricValue - 0) * 0.8;
        currentParameterValue = 0.5 + (currentParameterValue - 0.5) * 0.85;
      }
    } else {
      // Other paths: oscillating convergence
      currentMetricValue = 0.4;
      currentParameterValue = 0.6;
      let direction = -1;
      
      for (let j = 0; j < stepsPerPath; j++) {
        steps.push({
          metricValue: currentMetricValue,
          parameterValue: currentParameterValue
        });
        
        // Oscillating convergence
        direction *= -0.8;
        currentMetricValue = 0 + direction * 0.4 * Math.pow(0.85, j);
        currentParameterValue = 0.5 + direction * 0.3 * Math.pow(0.9, j);
      }
    }
    
    optimizationPaths.push({
      id: pathId,
      name: `Optimization ${i + 1}`,
      targetMetric,
      targetParameter,
      converged: true,
      steps
    });
  }

  return { optimizationPaths, metrics };
}