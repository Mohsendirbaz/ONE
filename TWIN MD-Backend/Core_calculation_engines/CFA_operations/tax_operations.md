# tax_operations.py - Tax Calculation Module

## Architectural Overview

The tax_operations module provides streamlined tax calculation functionality for the CFA system. It implements both state and federal tax calculations based on standard corporate tax principles, with built-in protection against negative tax scenarios.

### Core Principles
- Simple, transparent tax calculations
- Protection against negative taxes
- Consistent interface for both tax types
- Integration with depreciation calculations

## Core Tax Calculation Algorithms

### `calculate_state_tax()`

Calculates state corporate income tax based on taxable income:

```python
def calculate_state_tax(revenue, stateTaxRateAmount32, operating_expenses, depreciation):
    taxable_income = revenue - operating_expenses - depreciation
    tax = max(taxable_income, 0) * stateTaxRateAmount32
    return tax
```

**Algorithm Components**:
1. **Taxable Income Calculation**: Revenue minus deductible expenses
2. **Non-Negative Constraint**: `max(taxable_income, 0)` ensures no negative tax
3. **Rate Application**: Simple multiplication by state rate

### `calculate_federal_tax()`

Calculates federal corporate income tax with identical logic:

```python
def calculate_federal_tax(revenue, federalTaxRateAmount33, operating_expenses, depreciation):
    taxable_income = revenue - operating_expenses - depreciation
    tax = max(taxable_income, 0) * federalTaxRateAmount33
    return tax
```

**Design Decision**: Separate functions maintain flexibility for future tax code differences.

## Tax Calculation Components

### Taxable Income Formula
```
Taxable Income = Revenue - Operating Expenses - Depreciation
```

**Components**:
- **Revenue**: Total income from operations
- **Operating Expenses**: All deductible operating costs
- **Depreciation**: Non-cash expense for asset value reduction

### Tax Liability Determination
```
Tax Liability = max(Taxable Income, 0) × Tax Rate
```

**Key Features**:
- No tax on losses (negative income)
- Linear tax rate application
- No tax brackets or progressive rates

## Integration with CFA System

### Usage in Main Calculation Loop

```python
for year in range(construction_years, plant_lifetime + construction_years):
    revenue = CFA_matrix.at[year, 'Revenue']
    operating_expenses = CFA_matrix.at[year, 'Operating Expenses']
    depreciation = CFA_matrix.at[year, 'Depreciation']
    
    state_tax = calculate_state_tax(
        revenue, 
        config_received.stateTaxRateAmount32, 
        operating_expenses, 
        depreciation
    )
    
    federal_tax = calculate_federal_tax(
        revenue, 
        config_received.federalTaxRateAmount33, 
        operating_expenses, 
        depreciation
    )
    
    CFA_matrix.at[year, 'State Taxes'] = state_tax
    CFA_matrix.at[year, 'Federal Taxes'] = federal_tax
```

### Configuration Parameters

Required from configuration module:
- `stateTaxRateAmount32`: State tax rate (decimal)
- `federalTaxRateAmount33`: Federal tax rate (decimal)

## Tax Calculation Scenarios

### Scenario 1: Profitable Year
```
Revenue: $1,000,000
Operating Expenses: $600,000
Depreciation: $100,000
Taxable Income: $300,000
State Tax (5%): $15,000
Federal Tax (21%): $63,000
```

### Scenario 2: Loss Year
```
Revenue: $500,000
Operating Expenses: $700,000
Depreciation: $100,000
Taxable Income: -$300,000
State Tax: $0 (no negative tax)
Federal Tax: $0 (no negative tax)
```

### Scenario 3: Break-Even
```
Revenue: $800,000
Operating Expenses: $700,000
Depreciation: $100,000
Taxable Income: $0
State Tax: $0
Federal Tax: $0
```

## Performance Considerations

### Computational Efficiency
- O(1) time complexity per calculation
- No loops or iterations
- Direct mathematical operations
- Minimal memory footprint

### Optimization Features
- No intermediate variables
- Direct return of results
- Efficient max() operation
- No unnecessary type conversions

## Business Logic and Assumptions

### Current Implementation Assumptions
1. **Flat Tax Rates**: No progressive brackets
2. **No Carryforwards**: Losses don't offset future taxes
3. **Simple Depreciation**: Straight deduction from taxable income
4. **No Tax Credits**: Only deductions considered
5. **Cash Basis**: Taxes calculated on current period only

### Tax Timing
- Taxes calculated annually
- No quarterly estimates
- No prepayments or deferrals
- Immediate expense recognition

## Integration Points

### Dependencies
- Requires accurate revenue calculations
- Depends on expense calculations
- Uses depreciation from CFA matrix
- Integrates with cash flow analysis

### Impact on Cash Flow
```python
after_tax_cash_flow = revenue - operating_expenses - state_tax - federal_tax
```

The calculated taxes directly reduce cash flow, affecting:
- NPV calculations
- IRR determinations
- Project viability assessments

## Potential Enhancements

### Advanced Tax Features
```python
def calculate_state_tax_advanced(revenue, expenses, depreciation, 
                                state_rate, carryforward_losses=0,
                                tax_credits=0, minimum_tax=0):
    """Enhanced state tax with additional features"""
    
def calculate_federal_tax_tiered(taxable_income, tax_brackets):
    """Federal tax with progressive brackets"""
    
def calculate_alternative_minimum_tax(revenue, expenses, amt_rate):
    """AMT calculation for complex scenarios"""
```

### International Tax Support
```python
def calculate_international_tax(revenue, expenses, country_rates,
                               tax_treaties, transfer_pricing):
    """Multi-jurisdictional tax calculations"""
```

## Error Handling and Edge Cases

### Current Handling
- **Negative Income**: Automatically handled by max() function
- **Zero Revenue**: Produces zero or negative taxable income
- **Missing Parameters**: Would raise AttributeError (caught by caller)

### Recommended Validations
```python
def calculate_state_tax_validated(revenue, stateTaxRate, expenses, depreciation):
    # Validate inputs
    if stateTaxRate < 0 or stateTaxRate > 1:
        raise ValueError("Tax rate must be between 0 and 1")
    
    if revenue < 0:
        logging.warning("Negative revenue provided")
    
    # Existing calculation...
```

## Testing Considerations

### Unit Test Scenarios
1. **Normal Operation**: Positive taxable income
2. **Loss Scenario**: Negative taxable income
3. **Edge Cases**: Zero values, maximum values
4. **Rate Validation**: Invalid tax rates
5. **Type Safety**: Non-numeric inputs

### Integration Tests
- Verify correct CFA matrix updates
- Validate cash flow impact
- Check multi-year calculations
- Ensure consistency between state/federal

## Documentation and Maintenance

### Function Signatures
Both functions follow identical patterns:
- First parameter: Revenue
- Second parameter: Tax rate
- Third parameter: Operating expenses
- Fourth parameter: Depreciation

### Maintenance Notes
- Keep functions synchronized
- Update both for any tax law changes
- Consider consolidating if logic diverges
- Document any jurisdiction-specific rules

## Conclusion

The tax_operations module provides a clean, efficient implementation of basic corporate tax calculations. Its simplicity ensures reliability while maintaining flexibility for future enhancements. The separation of state and federal calculations allows for jurisdiction-specific modifications without affecting the overall system architecture.