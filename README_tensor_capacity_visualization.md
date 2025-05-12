# Tensor-Based 3D Capacity Space Visualization

This document describes the implementation of the Tensor-Based 3D Capacity Space Visualization in the project.

## Overview

The Tensor-Based 3D Capacity Space Visualization is a multidimensional approach to visualizing parameter capacity data. It represents the data as a multidimensional grid with interactive slicing and exploration capabilities.

## Implementation

The implementation consists of two main components:

1. **HTML/JavaScript Visualization**: A web-based visualization that displays the capacity data as a 3D tensor.
2. **Integration with Visualization Runner**: Updates to the visualization_runner.py script to include the new visualization in the visualization index.

### Files Created/Modified

- `capacity_visualizations/tensor_capacity_visualization.html`: The HTML file containing the visualization.
- `visualization_runner.py`: Modified to include the new visualization in the visualization index.

### Visualization Features

The tensor-based visualization represents the capacity space with 5 dimensions:
- Parameters (75 values: S10-S84)
- Scaling Groups (5 per parameter)
- Sensitivity Variations (6 per parameter-scaling group)
- Years (20 plant lifetime years)
- Versions (20 configuration variants)

The theoretical maximum capacity is 75 × 5 × 6 × 20 × 20 = 450,000 combinations.

The visualization allows users to:
- Rotate the 3D cube to view from different angles
- Select which 3 dimensions to display on X, Y, Z axes
- Set specific slices for other dimensions
- Hover over cells to see details
- Click cells to get detailed information

### Key Benefits

1. **Complete Space Representation**: Shows the full combinatorial capacity space.
2. **Simultaneous Dimension View**: Allows viewing three dimensions at once.
3. **Customizable Perspective**: Users can select which dimensions to focus on.
4. **Visual Impact**: Creates a powerful visual understanding of the capacity space.
5. **Unified Context**: Maintains relationships between dimensions.

## Running the Visualization

To run the visualization:

1. Execute the visualization_runner.py script:
   ```
   python visualization_runner.py
   ```

2. The script will generate the visualization and open it in a web browser.

3. The visualization will be included in the visualization index along with other visualizations.

## Future Enhancements

Potential future enhancements for the visualization include:

1. **Real-time Data Integration**: Connect the visualization to live data sources.
2. **Additional Interaction Modes**: Add more ways to interact with the visualization.
3. **Performance Optimizations**: Improve rendering performance for large datasets.
4. **Export Capabilities**: Allow exporting visualizations or data subsets.
5. **Comparative Views**: Enable comparing different capacity configurations.