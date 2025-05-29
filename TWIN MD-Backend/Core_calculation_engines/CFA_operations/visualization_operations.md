# visualization_operations.py - Financial Visualization Module

## Architectural Overview

The visualization_operations module generates high-quality financial visualizations for the CFA system, focusing on operational cost and revenue breakdowns. It creates publication-ready pie charts with sophisticated styling and annotation features, supporting the visual analysis of financial components.

### Core Capabilities
- Operational cost pie chart generation
- Operational revenue pie chart generation
- Economic summary table creation
- Intelligent label filtering and formatting
- Professional chart styling and annotation

## Visualization Functions

### `create_operational_cost_pie_chart()`

Generates a pie chart visualizing the breakdown of operational costs by component.

#### Key Features

1. **Dynamic Filtering**:
   ```python
   filtered_labels = [
       label for i, label in enumerate(operational_labels) 
       if selected_f.get(f'F{i+1}') == 'on'
   ]
   ```
   - Only shows enabled cost components
   - Maintains label-value correspondence
   - Adapts to user selections

2. **Smart Percentage Display**:
   ```python
   def autopct_filter(pct):
       """Show percentage only if >= 3%."""
       return f'{pct:.1f}%' if pct >= 3 else ''
   ```
   - Reduces clutter for small segments
   - Improves readability
   - Maintains visual balance

3. **Professional Styling**:
   - Georgia font family for consistency
   - 300 DPI for print quality
   - Grey edge lines for definition
   - Light background (#f7f7f7)

4. **Advanced Annotations**:
   ```python
   ax.annotate(
       f'{label}\n${filtered_sizes[i]:,.0f}',
       xy=(x * 0.7, y * 0.7),
       xytext=(x * 1.2, y * 1.2),
       arrowprops=dict(facecolor='black', arrowstyle='->', lw=0.7),
       fontsize=10, ha='center', fontname=chosen_label_font
   )
   ```
   - Arrow-pointed labels outside pie
   - Dollar formatting with commas
   - Two-line format (label + value)

### `create_operational_revenue_pie_chart()`

Generates a pie chart for revenue component analysis, mirroring the cost visualization.

#### Distinctive Features

1. **Revenue-Specific Filtering**:
   ```python
   filtered_rev_labels = [
       label for i, label in enumerate(revenue_labels) 
       if selected_rf.get(f'RF{i+1}') == 'on'
   ]
   ```
   - Uses RF1-RF5 selection keys
   - Separate from cost selections
   - Enables independent analysis

2. **Conditional Generation**:
   ```python
   if any(filtered_rev_sizes):
       # Generate chart only if there's data
   ```
   - Prevents empty charts
   - Saves processing time
   - Cleaner output directory

3. **Consistent Styling**:
   - Matches cost chart appearance
   - Same font selections
   - Identical layout parameters
   - Enables side-by-side comparison

### `create_economic_summary()`

Generates a comprehensive economic summary table in CSV format.

#### Summary Components

1. **Financial Metrics**:
   - Internal Rate of Return (IRR)
   - Average Selling Price
   - Total Overnight Cost (TOC)
   - Average annual financial figures

2. **Calculated Averages**:
   ```python
   average_annual_revenue = total_revenue / operational_years
   average_annual_operating_expenses = total_operating_expenses / operational_years
   # ... etc for all metrics
   ```

3. **Formatted Output**:
   ```python
   'Value': [
       f"{config_received.iRRAmount30:.2%}",        # Percentage
       f"${average_selling_price:,.2f}",            # Currency with cents
       f"${toc:,.0f}",                              # Currency no cents
       # ...
   ]
   ```

4. **Calculation Mode Tracking**:
   ```python
   f"{os.sys.argv[5] if len(os.sys.argv) > 5 else 'default'}"
   ```
   - Records calculation method used
   - Enables reproducibility
   - Supports audit trails

## Chart Design Principles

### Visual Hierarchy

1. **Size and Positioning**:
   - 8x8 inch figure size
   - 0.7 radius for pie (leaving annotation space)
   - 45-degree start angle for balance
   - 0.02 explosion for segment separation

2. **Color Scheme**:
   - Default matplotlib color cycle
   - Grey edges for definition
   - Light grey background
   - Black arrows for contrast

3. **Typography**:
   - Georgia for all text elements
   - 14pt title size
   - 10pt labels and percentages
   - Consistent font family throughout

### Annotation Strategy

1. **Label Positioning**:
   ```python
   angle = (wedge.theta2 - wedge.theta1) / 2 + wedge.theta1
   x, y = np.cos(np.deg2rad(angle)), np.sin(np.deg2rad(angle))
   ```
   - Calculates optimal label position
   - Centers on wedge angle
   - Scales for chart size

2. **Arrow Properties**:
   - Thin black arrows (0.7 linewidth)
   - Standard arrow style
   - Points from pie edge to label
   - Professional appearance

## Data Processing and Formatting

### Number Formatting

1. **Currency Display**:
   ```python
   f'${filtered_sizes[i]:,.0f}'  # $1,234,567
   ```
   - Dollar sign prefix
   - Comma thousands separator
   - No decimal places for cleaner look

2. **Percentage Display**:
   ```python
   f'{pct:.1f}%'  # 12.3%
   ```
   - One decimal place
   - Percentage sign suffix
   - Conditional display (≥3%)

### File Management

1. **Directory Creation**:
   ```python
   static_plot = os.path.join(results_folder, f'{version}_PieStaticPlots')
   os.makedirs(static_plot, exist_ok=True)
   ```

2. **File Naming Convention**:
   - Cost: `Operational_Cost_Breakdown_Pie_Chart({version}).png`
   - Revenue: `Operational_Revenue_Breakdown_Pie_Chart({version}).png`
   - Summary: `Economic_Summary({version}).csv`

## Integration with CFA System

### Input Requirements

1. **For Pie Charts**:
   - Component labels array
   - Component values array
   - Selection dictionary (on/off states)
   - Output directory path
   - Version identifier

2. **For Economic Summary**:
   - Configuration object
   - Calculated totals
   - Operational parameters
   - Output specifications

### Output Products

1. **PNG Charts**:
   - 300 DPI resolution
   - Transparent background capable
   - Print-ready quality
   - Optimized file size

2. **CSV Summary**:
   - Two-column format (Metric, Value)
   - Pre-formatted values
   - Human-readable output
   - Import-ready structure

## Performance Considerations

### Optimization Strategies

1. **Conditional Processing**:
   - Skip revenue chart if no data
   - Filter before plotting
   - Minimal matplotlib operations

2. **Memory Management**:
   - Close plots after saving
   - Reuse figure objects
   - Clear matplotlib cache

3. **File I/O Efficiency**:
   - Direct save operations
   - No intermediate files
   - Efficient CSV writing

## Error Handling and Edge Cases

### Current Handling

1. **Empty Data Sets**:
   - Revenue chart skipped if no values
   - Cost chart always generated (if called)

2. **File Operations**:
   - Existing files removed before save
   - Directory created if missing

### Potential Improvements

```python
def create_chart_with_validation(labels, sizes, selected, output_path):
    """Enhanced chart creation with validation"""
    
    # Validate inputs
    if not labels or not sizes:
        logging.warning("No data for chart generation")
        return False
    
    # Check for all-zero values
    if not any(sizes):
        logging.warning("All values are zero")
        return False
    
    # Proceed with chart generation...
```

## Styling Customization

### Font Selection System

```python
available_fonts = ['Arial', 'Verdana', 'Helvetica', 
                   'Times New Roman', 'Courier New', 'Georgia']
chosen_title_font = 'Georgia'
chosen_label_font = 'Georgia'
chosen_numbers_font = 'Georgia'
```

**Customization Options**:
1. Different fonts for different elements
2. Font size adjustments
3. Color scheme modifications
4. Layout parameter tuning

### Future Enhancement Ideas

1. **Interactive Charts**:
   ```python
   def create_interactive_plotly_chart(data, config):
       """Generate interactive HTML charts"""
   ```

2. **Multiple Chart Types**:
   ```python
   def create_bar_chart(data, config):
       """Alternative visualization as bar chart"""
   ```

3. **Comparative Visualizations**:
   ```python
   def create_cost_revenue_comparison(cost_data, revenue_data):
       """Side-by-side or overlay comparisons"""
   ```

## Best Practices and Usage

### Typical Integration

```python
# Prepare data
operational_labels = get_operational_labels()
operational_sizes = [avg_feedstock, avg_labor, avg_utility, 
                    avg_maintenance, avg_insurance]

# Create output directory
static_plot = os.path.join(results_folder, f'{version}_PieStaticPlots')
os.makedirs(static_plot, exist_ok=True)

# Generate charts
create_operational_cost_pie_chart(
    operational_labels, operational_sizes, 
    selected_f, static_plot, version
)

create_operational_revenue_pie_chart(
    revenue_labels, revenue_sizes,
    selected_rf, static_plot, version
)
```

### Quality Assurance

1. **Visual Inspection**: Review generated charts
2. **Value Verification**: Check calculations in summary
3. **Format Validation**: Ensure consistent output
4. **Cross-Reference**: Compare charts to tables

## Conclusion

The visualization_operations module provides sophisticated financial visualization capabilities that transform raw calculation results into professional, publication-ready charts and summaries. Its flexible filtering, intelligent formatting, and high-quality output make it an essential component of the financial analysis workflow.