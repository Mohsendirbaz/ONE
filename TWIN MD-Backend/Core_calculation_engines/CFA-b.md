# CFA-b.py - Cash Flow Analysis Engine

## Architectural Overview

The CFA-b (Cash Flow Analysis - version b) module is the core financial calculation engine that performs comprehensive economic analysis for process economics. It integrates revenue calculations, expense modeling, tax computations, and Net Present Value (NPV) optimization to determine optimal pricing strategies.

### Key Components
- **Logging Infrastructure**: Dual-logger system for price optimization and CFA processes
- **Sensitivity Analysis Integration**: Connects with CalSen service for parameter sensitivity calculations
- **Revenue & Expense Calculators**: Modular functions for financial projections
- **Tax Calculation Engine**: State and federal tax computation
- **NPV Optimization Loop**: Iterative price adjustment to achieve target NPV
- **Visualization Generator**: Creates operational cost breakdown charts

## Core Calculation Algorithms

### 1. Revenue Calculation Algorithm
```python
def calculate_annual_revenue(numberOfUnitsAmount12, initialSellingPriceAmount13, generalInflationRateAmount23, years, construction_years)
```
- Calculates annual revenue considering:
  - Number of units sold
  - Initial selling price (or optimized price)
  - General inflation rate
  - Construction period (zero revenue)
  - Operational years

### 2. Operating Expense Calculation
```python
def calculate_annual_operating_expenses(...)
```
- Supports two calculation modes:
  - **Direct Method**: Uses total operating cost percentage
  - **Indirect Method**: Aggregates variable and fixed costs
- Filters costs based on user selections (selected_v, selected_f)
- Applies inflation adjustments

### 3. Tax Calculation Algorithms
- **State Tax**: `max(taxable_income, 0) * stateTaxRateAmount32`
- **Federal Tax**: `max(taxable_income, 0) * federalTaxRateAmount33`
- Taxable Income = Revenue - Operating Expenses - Depreciation

### 4. Depreciation Algorithm
- Uses "Fraction of TOC" method
- Calculates potentially taxable income for each year
- Determines depreciation period when cumulative fraction exceeds 1.0
- Distributes Total Overnight Cost (TOC) proportionally

### 5. NPV Optimization Algorithm
```python
TOLERANCE_LOWER = -1000
TOLERANCE_UPPER = 1000

while npv < TOLERANCE_LOWER or npv > TOLERANCE_UPPER:
    if npv < 0:
        price *= 1.02  # Increment by 2%
    elif npv > 0:
        price *= 0.985  # Decrement by 1.5%
```

## Data Flow and Processing

### Input Flow
1. **Configuration Loading**
   - Reads configuration modules from JSON files
   - Loads main configuration from Python module
   - Processes configuration matrix (time periods)

2. **Parameter Processing**
   - Extracts sensitivity parameters from command line
   - Integrates with CalSen service for path resolution
   - Handles version-specific configurations

### Processing Pipeline
1. **Initialization Phase**
   - Set up logging infrastructure
   - Load configurations and matrices
   - Initialize CFA matrix structure

2. **Calculation Phase**
   - Iterate through configuration matrix periods
   - Calculate revenue and expenses for each period
   - Apply construction year adjustments
   - Compute depreciation schedule
   - Calculate taxes and cash flows

3. **Optimization Phase**
   - Evaluate NPV at target row
   - Adjust price based on NPV deviation
   - Iterate until convergence

4. **Output Generation**
   - Save CFA matrix
   - Generate OPEX tables
   - Create economic summary
   - Produce visualization charts

## Integration with Configuration System

### Configuration Sources
1. **Main Configuration File** (`configurations({version}).py`)
   - Plant lifetime
   - Construction years
   - Tax rates
   - IRR (Internal Rate of Return)
   - Initial selling price

2. **Configuration Matrix** (`General_Configuration_Matrix({version}).csv`)
   - Time period definitions
   - Start/end years for each configuration

3. **Module Configuration Files** (`{version}_config_module_{period}.json`)
   - Period-specific parameters
   - Variable/fixed costs
   - Inflation rates
   - Production units

### CalSen Service Integration
- Requests path information for sensitivity analysis
- Handles parameter variations
- Supports multiple sensitivity modes:
  - Percentage
  - Direct value
  - Absolute departure
  - Monte Carlo

## Key Functions and Classes

### Main Functions

1. **`main(version, selected_v, selected_f, target_row)`**
   - Entry point for calculations
   - Handles path resolution
   - Manages optimization loop

2. **`calculate_revenue_and_expenses_from_modules(...)`**
   - Core calculation orchestrator
   - Processes all financial components
   - Generates output files

3. **`get_paths_from_calsen(...)`**
   - Interfaces with CalSen service
   - Resolves sensitivity analysis paths
   - Handles service unavailability

### Helper Functions

- **`remove_existing_file(file_path)`**: File management utility
- **`pad_or_trim(costs, target_length)`**: Data normalization
- **`save_opex_tables(...)`**: OPEX table generation
- **`generate_*_opex_table(...)`**: Specific table generators

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Configuration modules loaded on-demand
2. **Vectorized Operations**: NumPy arrays for calculations
3. **Caching**: Results stored for reuse within iterations
4. **Early Termination**: Convergence checks in optimization loop

### Memory Management
- Incremental file writing
- Removal of existing files before writing
- Efficient data structures (pandas DataFrames)

### Scalability Features
- Modular calculation components
- Parallel-ready architecture (per-period calculations)
- Service-based sensitivity analysis
- Configurable tolerance levels

### Error Handling
- Comprehensive logging at multiple levels
- Graceful degradation for CalSen service
- Division-by-zero protection
- File existence validation

## Calculation Modes

### 1. Price Optimization Mode (`calculateForPrice`)
- Iteratively adjusts price to achieve target NPV
- Uses convergence tolerances
- Generates optimized economic summary

### 2. Free Flow NPV Mode (`freeFlowNPV`)
- Single-pass calculation
- No price optimization
- Direct NPV evaluation

### 3. Sensitivity Analysis Mode
- Integrates with CalSen service
- Processes parameter variations
- Generates sensitivity-specific outputs

## Output Products

1. **CFA Matrix** (`CFA({version}).csv`)
   - Complete cash flow analysis
   - Year-by-year financial projections

2. **OPEX Tables**
   - Fixed costs table
   - Variable costs table
   - Cumulative OPEX table

3. **Economic Summary** (`Economic_Summary({version}).csv`)
   - Key financial metrics
   - Average values
   - NPV results

4. **Distance Matrix** (`Distance_From_Paying_Taxes({version}).csv`)
   - Depreciation analysis
   - Tax impact calculations

5. **Visualization Charts**
   - Operational cost breakdown pie chart
   - PNG format with high DPI