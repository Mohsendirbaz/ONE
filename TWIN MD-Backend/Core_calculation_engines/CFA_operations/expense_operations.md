# expense_operations.py - Operating Expense Calculation Module

## Architectural Overview

The expense_operations module handles all operating expense calculations and OPEX table generation for the CFA system. It provides flexible expense calculation methods, component filtering based on user selections, and comprehensive table generation for expense analysis.

### Core Capabilities
- Dual calculation methods (direct and indirect)
- Component-based expense filtering
- Variable and fixed cost segregation
- Multi-format OPEX table generation
- Inflation adjustment application

## Core Calculation Algorithms

### `calculate_annual_operating_expenses()`

The main expense calculation function supporting two distinct methodologies:

#### Direct Method
When `use_direct_operating_expensesAmount18` is True:
```python
expenses = [0] * construction_years + [
    int(totalOperatingCostPercentageAmount14 * revenue) 
    for revenue in annual_revenue[construction_years:]
]
```
- Uses a percentage of revenue as operating expenses
- Simpler calculation for high-level estimates
- Appropriate for preliminary analysis

#### Indirect Method
When direct method is disabled:
```python
annual_variable_cost = np.sum([
    cost * amount for cost, amount in 
    zip(variable_costs_filtered, amounts_per_unit_filtered)
])
expenses = [0] * construction_years + [
    int((annual_variable_cost + total_fixed_cost))
    for year in range(construction_years, years)
]
```
- Aggregates individual cost components
- More detailed and accurate
- Suitable for detailed financial analysis

### Component Filtering Logic

#### Variable Cost Filtering
```python
variable_costs_filtered = [
    round(cost * (1 + generalInflationRateAmount23)) 
    if selected_v.get(f'V{i+1}') == 'on' else 0
    for i, cost in enumerate(variable_costsAmount4)
]
```
- Applies inflation adjustment
- Respects user selection (on/off)
- Maintains positional mapping (V1-V10)

#### Fixed Cost Filtering
```python
fixed_costs_filtered = [
    round(cost * (1 + generalInflationRateAmount23)) 
    if selected_f.get(f'F{i+1}') == 'on' else 0
    for i, cost in enumerate(fixed_costs)
]
```
- Similar logic for fixed costs (F1-F5)
- Maps to: Material Inventory, Labor, Utility, Maintenance, Insurance

## OPEX Table Generation Functions

### Table Structure Overview

The module generates three types of OPEX tables:
1. **Fixed OPEX Table**: Fixed costs by component
2. **Variable OPEX Table**: Variable costs by component
3. **Cumulative OPEX Table**: Combined view with totals

### `generate_fixed_opex_table()`

Creates a table showing fixed costs over the plant lifetime:

**Table Structure**:
| Year | F1 | F2 | F3 | F4 | F5 |
|------|----|----|----|----|-----|
| 1    | Material | Labor | Utility | Maint. | Insurance |
| ...  | ... | ... | ... | ... | ... |

**Implementation Features**:
- Handles period transitions from configuration matrix
- Pads/trims cost arrays to match component count
- Maps costs to operational years (excluding construction)

### `generate_variable_opex_table()`

Creates a table showing variable costs over the plant lifetime:

**Table Structure**:
| Year | V1 | V2 | V3 | V4 | V5 | V6 | V7 | V8 | V9 | V10 |
|------|----|----|----|----|----|----|----|----|----|-----|
| 1    | Variable costs by component... |
| ...  | ... |

**Key Features**:
- Supports up to 10 variable cost components
- Period-aware cost assignment
- Automatic array size management

### `generate_cumulative_opex_table()`

Combines fixed and variable costs with total operating expenses:

**Table Structure**:
| Year | F1-F5 | V1-V10 | Operating Expenses |
|------|-------|---------|-------------------|
| 1    | Fixed | Variable | Total |

**Integration Points**:
- Merges data from both fixed and variable results
- Adds total operating expenses column
- Provides comprehensive cost view

### `save_opex_tables()`

Orchestrates the generation and saving of all OPEX tables:

```python
def save_opex_tables(fixed_costs_results, variable_costs_results, 
                     expenses_results, plant_lifetime, results_folder, version):
    # Generate all three tables
    # Remove existing files
    # Save new CSV files
```

**Output Files**:
- `Fixed_Opex_Table_({version}).csv`
- `Variable_Opex_Table_({version}).csv`
- `Cumulative_Opex_Table_({version}).csv`

## Data Flow and Processing

### Input Data Structure

```python
# Period-keyed dictionaries
fixed_costs_results = {
    (start_year, end_year): [F1, F2, F3, F4, F5],
    ...
}

variable_costs_results = {
    (start_year, end_year): [V1, V2, ..., V10],
    ...
}

expenses_results = {
    (start_year, end_year): [expense_year1, expense_year2, ...],
    ...
}
```

### Processing Pipeline

1. **Input Validation**
   - Check selection dictionaries
   - Validate array lengths
   - Handle missing data

2. **Inflation Adjustment**
   - Apply general inflation rate
   - Round to nearest integer
   - Maintain precision for further calculations

3. **Filtering Application**
   - Zero out deselected components
   - Preserve array structure
   - Maintain component indexing

4. **Aggregation**
   - Sum filtered components
   - Calculate period totals
   - Generate annual expenses

5. **Table Generation**
   - Map periods to years
   - Assign costs to correct cells
   - Handle period boundaries

## Integration with Configuration System

### Required Configuration Parameters

From JSON modules:
- `use_direct_operating_expensesAmount18`: Calculation method flag
- `totalOperatingCostPercentageAmount14`: Direct method percentage
- `variable_costsAmount4`: Array of variable costs
- `amounts_per_unitAmount5`: Per-unit multipliers
- `rawmaterialAmount34`: Fixed cost component
- `laborAmount35`: Fixed cost component
- `utilityAmount36`: Fixed cost component
- `maintenanceAmount37`: Fixed cost component
- `insuranceAmount38`: Fixed cost component
- `generalInflationRateAmount23`: Inflation rate

### Selection Parameters
- `selected_v`: Dictionary with V1-V10 keys ('on'/'off')
- `selected_f`: Dictionary with F1-F5 keys ('on'/'off')

## Performance Considerations

### Optimization Strategies

1. **Vectorized Operations**
   - Uses NumPy for array operations
   - Efficient sum calculations
   - Minimizes Python loops

2. **Memory Efficiency**
   - In-place filtering operations
   - Reuses data structures
   - Cleans up intermediate results

3. **I/O Optimization**
   - Removes files before writing
   - Single write operation per table
   - Uses pandas efficient CSV writing

### Scalability Features

- Component count easily extendable
- Period-agnostic processing
- Batch table generation
- Linear time complexity

## Utility Functions

### `pad_or_trim(costs, target_length)`

Ensures cost arrays match expected component count:
```python
if len(costs) < target_length:
    return costs + [0] * (target_length - len(costs))
return costs[:target_length]
```

**Use Cases**:
- Handling varying cost array sizes
- Ensuring table consistency
- Preventing index errors

### `remove_existing_file(file_path)`

File management utility inherited from utility module:
- Checks file existence
- Removes if present
- Logs operation

## Error Handling and Logging

### Logging Levels
- **INFO**: Major operations and results
- **DEBUG**: Detailed calculation steps
- **WARNING**: Potential issues (handled gracefully)

### Common Log Messages
```python
logging.info(f"Filtered variable costs: {variable_costs_filtered}")
logging.info(f"Total fixed costs: {total_fixed_cost}")
logging.info(f"Operating expenses (direct method): {expenses}")
logging.info("Using indirect calculation for operating expenses.")
```

## Best Practices and Usage Guidelines

### Typical Usage Pattern
```python
# Calculate expenses for a period
expenses, var_costs, fixed_costs = calculate_annual_operating_expenses(
    config_module['use_direct_operating_expensesAmount18'],
    config_module['totalOperatingCostPercentageAmount14'],
    # ... other parameters
)

# Store results by period
expenses_results[(start_year, end_year)] = expenses
variable_costs_results[(start_year, end_year)] = var_costs
fixed_costs_results[(start_year, end_year)] = fixed_costs

# Generate tables after all periods processed
save_opex_tables(
    fixed_costs_results,
    variable_costs_results,
    expenses_results,
    plant_lifetime,
    results_folder,
    version
)
```

### Component Mapping
- F1: Material/Feedstock costs
- F2: Labor costs
- F3: Utility costs
- F4: Maintenance costs
- F5: Insurance costs
- V1-V10: User-defined variable costs