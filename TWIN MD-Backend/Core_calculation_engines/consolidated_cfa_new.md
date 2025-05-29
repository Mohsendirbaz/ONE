# consolidated_cfa_new.py - Consolidated Cash Flow Analysis Engine

## Architectural Overview

The consolidated_cfa_new module represents an advanced, modularized version of the CFA engine that separates concerns into specialized operation modules. It introduces a keyword-based architecture to ensure consistency and maintainability while adding support for revenue component analysis alongside expense analysis.

### Architecture Principles
- **Separation of Concerns**: Operations split into dedicated modules
- **Keyword Consistency**: Centralized keyword management via `keyword_constants`
- **Factory Pattern**: Generic functions for repetitive operations
- **Extended Analysis**: Parallel revenue and expense component tracking

### Module Dependencies
```
consolidated_cfa_new.py
├── keyword_constants.py
├── CFA_operations/
│   ├── utility.py
│   ├── revenue_operations.py
│   ├── expense_operations.py
│   ├── tax_operations.py
│   ├── config_operations.py
│   └── visualization_operations.py
```

## Core Calculation Algorithms

### 1. Enhanced Revenue Calculation
The module extends basic revenue calculation with component-based analysis:
```python
calculate_annual_revenue_extended(...)
```
- Supports both direct and indirect revenue calculation methods
- Tracks variable revenue components (R1-R10)
- Tracks fixed revenue components (RF1-RF5)
- Applies selective filtering based on user choices

### 2. Parallel Component Tracking
- **Cost Components**: Feedstock, Labor, Utility, Maintenance, Insurance
- **Revenue Components**: Mirror structure of cost components
- Enables comprehensive profitability analysis per component

### 3. Factory-Based Processing
```python
def create_empty_dicts(names):
    return {name: {} for name in names}

def update_operational_dict(component_dict, values, idx, multiplier):
    # Generic updater for operational dictionaries
```

### 4. Dynamic Dictionary Management
- Automated creation of result dictionaries
- Keyword-based naming conventions
- Reduced code duplication

## Data Flow and Processing

### Enhanced Data Pipeline

1. **Initialization Phase**
   - Create dictionaries for both CFA and operational results
   - Initialize component-specific tracking dictionaries
   - Set up revenue and expense parallel structures

2. **Configuration Processing**
   - Read configuration matrix with extended parameters
   - Process both expense and revenue configurations
   - Handle `selected_r` and `selected_rf` for revenue filtering

3. **Calculation Loop**
   - Process each time period in configuration matrix
   - Calculate both standard and extended metrics
   - Update operational dictionaries using factory functions
   - Track cumulative metrics

4. **Output Generation**
   - Generate OPEX tables (existing)
   - Generate Revenue tables (new)
   - Create dual pie charts (costs and revenues)
   - Produce comprehensive economic summary

### Data Structure Evolution
```python
# Result dictionaries (6 types)
- revenue_results
- expenses_results  
- fixed_costs_results
- variable_costs_results
- fixed_rev_results (NEW)
- variable_rev_results (NEW)

# Operational dictionaries (6 types + components)
- revenue_operational
- expenses_operational
- fixed_costs_operational
- variable_costs_operational
- fixed_rev_operational (NEW)
- variable_rev_operational (NEW)
+ 10 component-specific dictionaries
```

## Integration with Configuration System

### Extended Configuration Support
1. **Revenue Parameters** (New)
   - `use_direct_operating_expensesAmount19`
   - `variable_RevAmount6` (array[10])
   - `amounts_per_unitRevAmount7` (array[10])
   - `MaterialInventory_Rev`, `Labor_Rev`, etc.

2. **Selection Parameters** (Extended)
   - `selected_v`: Variable cost selections (V1-V10)
   - `selected_f`: Fixed cost selections (F1-F5)
   - `selected_r`: Variable revenue selections (R1-R10) [NEW]
   - `selected_rf`: Fixed revenue selections (RF1-RF5) [NEW]

### Keyword Management System
```python
KEYWORDS = {
    'r': 'revenue',
    'e': 'expenses',
    'f': 'fixed',
    'v': 'variable',
    'fs': 'feedstock',
    'l': 'labor',
    'm': 'maintenance',
    'u': 'utility',
    'i': 'insurance',
    'c': 'cost',
    'rv': 'rev'
}
```

## Key Functions and Classes

### Main Calculation Function
```python
def calculate_revenue_and_expenses_from_modules(
    config_received, config_matrix_df, results_folder, version,
    selected_v, selected_f, selected_r, selected_rf, 
    price, target_row, iteration
)
```
- Extended parameter list for revenue selections
- Parallel processing of revenue and expense components
- Enhanced output generation

### Helper Functions (via keyword_constants)
- `get_keyword(key)`: Retrieve base keyword
- `capitalize_keyword(key)`: Get capitalized version
- `get_component_names()`: List of component types
- `get_column_names()`: CFA matrix column definitions
- `get_result_dict_names()`: Result dictionary identifiers
- `get_operational_dict_names()`: Operational dictionary identifiers

### Factory Functions
1. **`create_empty_dicts(names)`**: Bulk dictionary creation
2. **`update_operational_dict(...)`**: Generic operational data updater
3. **`calculate_averages(...)`**: Component average calculator
4. **`store_results(...)`**: Bulk result storage

## Performance Considerations

### Optimization Enhancements
1. **Reduced Code Duplication**: Factory patterns minimize repeated code
2. **Efficient Dictionary Access**: Keyword-based lookups
3. **Batch Operations**: Group similar operations together
4. **Memory Efficiency**: Reuse of data structures

### Scalability Improvements
- Component-based architecture allows easy extension
- Modular operation files enable parallel development
- Standardized interfaces between modules
- Consistent naming conventions reduce errors

### Maintainability Features
- Centralized keyword management
- Clear separation of operation types
- Self-documenting code structure
- Reduced magic strings/numbers

## New Capabilities

### 1. Revenue Component Analysis
- Track revenue sources by component
- Identify profit centers
- Enable revenue optimization strategies

### 2. Dual Visualization
- Cost breakdown pie chart (existing)
- Revenue breakdown pie chart (new)
- Side-by-side comparison capability

### 3. Extended Tables
- Fixed Revenue Table
- Variable Revenue Table  
- Cumulative Revenue Table
- Complete symmetry with OPEX tables

### 4. Enhanced Economic Summary
- Revenue component averages
- Cost-revenue comparisons
- Component-level profitability

## Calculation Flow Enhancements

### Parallel Processing Structure
```
For each configuration period:
    1. Calculate standard revenue
    2. Calculate extended revenue (NEW)
    3. Calculate operating expenses
    4. Update component dictionaries (costs)
    5. Update component dictionaries (revenues) (NEW)
    6. Store results in 6 dictionary types
```

### Average Calculation Enhancement
- Calculate average costs per component (existing)
- Calculate average revenues per component (new)
- Enable margin analysis per component

## Output Products (Extended)

1. **Standard Outputs** (maintained)
   - CFA Matrix
   - OPEX Tables (3 types)
   - Economic Summary
   - Distance Matrix

2. **New Revenue Tables**
   - `Fixed_Revenue_Table_({version}).csv`
   - `Variable_Revenue_Table_({version}).csv`
   - `Cumulative_Revenue_Table_({version}).csv`

3. **Enhanced Visualizations**
   - Operational Cost Breakdown (existing)
   - Operational Revenue Breakdown (new)
   - Both saved in `{version}_PieStaticPlots` directory

## Error Handling and Validation

### Enhanced Validation
- Check for dictionary type before processing
- Convert non-dict selections to default dictionaries
- Validate revenue parameters existence
- Handle missing configuration keys gracefully

### Logging Enhancements
- Component-level logging for debugging
- Revenue calculation logging
- Selection validation logging
- Factory operation tracking