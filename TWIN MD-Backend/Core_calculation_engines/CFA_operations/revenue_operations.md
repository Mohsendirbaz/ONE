# revenue_operations.py - Revenue Calculation and Analysis Module

## Architectural Overview

The revenue_operations module provides comprehensive revenue calculation functionality, mirroring the expense_operations structure while adding revenue-specific analysis capabilities. It supports both simple and component-based revenue calculations, enabling detailed revenue stream analysis and optimization.

### Core Capabilities
- Standard revenue calculation with inflation
- Extended component-based revenue analysis
- Revenue stream filtering and selection
- Multi-format revenue table generation
- Parallel structure to expense operations

## Core Calculation Algorithms

### `calculate_annual_revenue()`

Basic revenue calculation function for standard analysis:

```python
revenue = [0] * construction_years + [
    int(numberOfUnitsAmount12 * initialSellingPriceAmount13 * 
        (1 + generalInflationRateAmount23))
    for year in range(construction_years, years)
]
```

**Key Features**:
- Zero revenue during construction period
- Inflation adjustment applied annually
- Integer rounding for financial precision
- Simple unit × price calculation

### `calculate_annual_revenue_extended()`

Advanced revenue calculation with component analysis:

#### Direct Revenue Method
When `use_direct_operating_expensesAmount19` is True:
```python
revenues = [0] * construction_years + [
    int(numberOfUnitsAmount12 * initialSellingPriceAmount13 * 
        (1 + generalInflationRateAmount23))
    for year in range(construction_years, years)
]
```

#### Indirect Revenue Method
Component-based revenue aggregation:
```python
annual_variable_revenue = np.sum([
    rev * amount for rev, amount in 
    zip(variable_rev_filtered, amounts_per_unit_filtered)
])
revenues = [0] * construction_years + [
    int((annual_variable_revenue + total_fixed_revenue))
    for year in range(construction_years, years)
]
```

### Revenue Component Filtering

#### Variable Revenue Filtering (R1-R10)
```python
variable_rev_filtered = [
    round(rev * (1 + generalInflationRateAmount23)) 
    if selected_r.get(f'R{i+1}') == 'on' else 0
    for i, rev in enumerate(variable_RevAmount6)
]
```

#### Fixed Revenue Filtering (RF1-RF5)
```python
fixed_rev_filtered = [
    round(rev * (1 + generalInflationRateAmount23)) 
    if selected_rf.get(f'RF{i+1}') == 'on' else 0
    for i, rev in enumerate(fixed_revenue)
]
```

### Intelligent Default Handling

The module includes robust handling for missing or malformed selection parameters:

```python
if not isinstance(selected_r, dict):
    logging.warning(f"selected_r is not a dictionary, it is a {type(selected_r)}. 
                     Converting to dictionary with all values 'on'.")
    selected_r = {f'R{i+1}': 'on' for i in range(10)}
```

This ensures backward compatibility and graceful degradation.

## Revenue Table Generation Functions

### `generate_fixed_revenue_table()`

Creates a table showing fixed revenue components over plant lifetime:

**Table Structure**:
| Year | RF1 | RF2 | RF3 | RF4 | RF5 |
|------|-----|-----|-----|-----|-----|
| 1    | Feedstock Rev | Labor Rev | Utility Rev | Maint. Rev | Insurance Rev |

**Features**:
- Maps revenue components to operational years
- Handles period transitions seamlessly
- Maintains component relationships

### `generate_variable_revenue_table()`

Creates a table for variable revenue components:

**Table Structure**:
| Year | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 |
|------|----|----|----|----|----|----|----|----|----|-----|
| 1    | Variable revenue components... |

**Implementation**:
- Supports up to 10 variable revenue streams
- Period-aware assignment
- Automatic padding/trimming

### `generate_cumulative_revenue_table()`

Comprehensive revenue view combining all components:

**Table Structure**:
| Year | RF1-RF5 | R1-R10 | Revenue |
|------|---------|---------|---------|
| 1    | Fixed Rev | Variable Rev | Total |

**Integration**:
- Merges fixed and variable revenue data
- Adds total revenue column
- Provides complete revenue analysis

### `save_revenue_tables()`

Orchestrates table generation and file management:

```python
def save_revenue_tables(fixed_rev_results, variable_rev_results, 
                       revenue_results, plant_lifetime, results_folder, version):
    # Generate all three table types
    # Clean up existing files
    # Save new CSV files
```

**Output Files**:
- `Fixed_Revenue_Table_({version}).csv`
- `Variable_Revenue_Table_({version}).csv`
- `Cumulative_Revenue_Table_({version}).csv`

## Data Flow and Processing

### Input Data Structure

```python
# Revenue component lists
fixed_revenue = [
    MaterialInventory_Rev,
    Labor_Rev,
    utility_Rev,
    maintenance_amount_Rev,
    insurance_amount_Rev
]

# Selection dictionaries
selected_r = {'R1': 'on', 'R2': 'off', ...}  # Variable selections
selected_rf = {'RF1': 'on', 'RF2': 'on', ...}  # Fixed selections
```

### Processing Pipeline

1. **Parameter Validation**
   - Type checking for selection dictionaries
   - Default dictionary creation if needed
   - Warning logging for corrections

2. **Component Filtering**
   - Apply user selections
   - Zero out disabled components
   - Maintain array structure

3. **Inflation Application**
   - Apply general inflation rate
   - Round to integers
   - Preserve calculation precision

4. **Revenue Aggregation**
   - Sum enabled components
   - Calculate total revenue streams
   - Generate period totals

5. **Table Population**
   - Map periods to operational years
   - Assign revenues to correct cells
   - Handle year boundaries

## Integration with Configuration System

### Extended Configuration Parameters

The module expects these additional parameters in config modules:

```python
# Direct calculation flag (mirrors expense side)
'use_direct_operating_expensesAmount19': bool

# Variable revenue components
'variable_RevAmount6': [10 values]
'amounts_per_unitRevAmount7': [10 values]

# Fixed revenue components
'MaterialInventory_Rev': float
'Labor_Rev': float
'utility_Rev': float
'maintenance_amount_Rev': float
'insurance_amount_Rev': float
```

### Selection Parameters
- `selected_r`: Variable revenue selections (R1-R10)
- `selected_rf`: Fixed revenue selections (RF1-RF5)

## Performance Considerations

### Optimization Strategies

1. **Efficient Array Operations**
   - NumPy for mathematical operations
   - List comprehensions for filtering
   - Minimal iteration overhead

2. **Memory Management**
   - Reuse of data structures
   - In-place modifications where possible
   - Efficient CSV generation

3. **Calculation Efficiency**
   - Single-pass filtering
   - Vectorized operations
   - Optimized summations

### Scalability Features
- Component count extensibility
- Period-independent processing
- Linear time complexity
- Parallel processing ready

## Component Mapping and Business Logic

### Fixed Revenue Components (RF1-RF5)
1. **RF1**: Feedstock-related revenue
2. **RF2**: Labor-related revenue
3. **RF3**: Utility-related revenue
4. **RF4**: Maintenance-related revenue
5. **RF5**: Insurance-related revenue

### Variable Revenue Components (R1-R10)
- User-defined revenue streams
- Product-specific revenues
- Service revenues
- By-product revenues
- Other operational revenues

## Error Handling and Validation

### Type Safety
```python
# Automatic type correction with logging
if not isinstance(selected_r, dict):
    # Convert to dictionary with defaults
    # Log the conversion
```

### Data Validation
- Array length verification
- Numeric value validation
- Selection key existence checks
- Graceful handling of missing data

## Usage Patterns and Best Practices

### Typical Integration
```python
# Standard revenue calculation
annual_revenue = calculate_annual_revenue(
    units, price, inflation, years, construction_years
)

# Extended revenue calculation
revenue_extended, var_rev, fixed_rev = calculate_annual_revenue_extended(
    use_direct, units, price, var_rev_array, amounts_array,
    # ... component parameters
    selected_r, selected_rf
)

# Store results by period
revenue_results[(start, end)] = revenue_extended
variable_rev_results[(start, end)] = var_rev
fixed_rev_results[(start, end)] = fixed_rev

# Generate tables after processing
save_revenue_tables(
    fixed_rev_results, variable_rev_results,
    revenue_results, plant_lifetime, results_folder, version
)
```

### Revenue Analysis Capabilities

1. **Component Profitability**: Match revenue components to cost components
2. **Revenue Stream Optimization**: Identify high-value streams
3. **Sensitivity Analysis**: Test revenue component impacts
4. **Period Comparison**: Analyze revenue evolution

## Logging and Debugging

### Key Log Points
```python
logging.info(f"Filtered variable revenue: {variable_rev_filtered}")
logging.info(f"Total fixed revenue: {total_fixed_revenue}")
logging.info(f"Revenue (direct method): {revenues}")
logging.info("Using indirect calculation for revenue.")
```

### Debug Information
- Component-level revenue details
- Filtering decisions
- Calculation method selection
- Final revenue arrays