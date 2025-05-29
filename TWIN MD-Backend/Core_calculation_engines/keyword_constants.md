# keyword_constants.py - Centralized Keyword Management

## Architectural Overview

The keyword_constants module serves as the single source of truth for all keywords and naming conventions used throughout the CFA calculation system. It implements a centralized keyword management pattern to ensure consistency, prevent duplication, and enable easy maintenance of naming conventions across the entire codebase.

### Design Philosophy
- **DRY Principle**: Each keyword defined exactly once
- **Consistency**: Uniform naming across all modules
- **Abstraction**: Hide implementation details of naming
- **Flexibility**: Easy to modify naming conventions

## Core Data Structure

### Keywords Dictionary
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

### Key Categories
1. **Financial Types**: revenue (r), expenses (e)
2. **Cost Categories**: fixed (f), variable (v)
3. **Component Types**: feedstock (fs), labor (l), maintenance (m), utility (u), insurance (i)
4. **Descriptors**: cost (c), rev (rv)

## Key Functions and Their Purpose

### Basic Keyword Access

#### `get_keyword(key)`
- **Purpose**: Retrieve the full keyword for a given abbreviation
- **Usage**: `get_keyword('r')` returns `'revenue'`
- **Benefit**: Centralizes keyword definitions

#### `capitalize_keyword(key)`
- **Purpose**: Get capitalized version of a keyword
- **Usage**: `capitalize_keyword('r')` returns `'Revenue'`
- **Benefit**: Consistent capitalization for display

### Component Management

#### `get_component_names()`
- **Purpose**: Return list of all component types
- **Returns**: `['feedstock', 'labor', 'utility', 'maintenance', 'insurance']`
- **Usage**: Iteration over all components in calculations

### Column Name Generation

#### `get_column_names()`
Returns a dictionary of standardized column names for the CFA matrix:
```python
{
    'year': 'Year',
    'revenue': 'Revenue',
    'expenses': 'Operating Expenses',
    'loan': 'Loan',
    'depreciation': 'Depreciation',
    'state_taxes': 'State Taxes',
    'federal_taxes': 'Federal Taxes',
    'after_tax_cash_flow': 'After-Tax Cash Flow',
    'discounted_cash_flow': 'Discounted Cash Flow',
    'cumulative_cash_flow': 'Cumulative Cash Flow'
}
```

### Dictionary Name Generation

#### `get_result_dict_names()`
Generates names for result storage dictionaries:
- `revenue_results`
- `expenses_results`
- `fixed_costs_results`
- `variable_costs_results`
- `fixed_rev_results`
- `variable_rev_results`

#### `get_operational_dict_names()`
Generates names for operational data dictionaries:
- `revenue_operational`
- `expenses_operational`
- `fixed_costs_operational`
- `variable_costs_operational`
- `fixed_rev_operational`
- `variable_rev_operational`

### Component-Specific Key Generation

#### `get_component_cost_keys()`
Creates mapping for component cost tracking:
```python
{
    'feedstock_cost_operational': 'feedstock_cost_operational',
    'labor_cost_operational': 'labor_cost_operational',
    'utility_cost_operational': 'utility_cost_operational',
    'maintenance_cost_operational': 'maintenance_cost_operational',
    'insurance_cost_operational': 'insurance_cost_operational'
}
```

#### `get_component_rev_keys()`
Creates mapping for component revenue tracking:
```python
{
    'feedstock_rev_operational': 'feedstock_rev_operational',
    'labor_rev_operational': 'labor_rev_operational',
    'utility_rev_operational': 'utility_rev_operational',
    'maintenance_rev_operational': 'maintenance_rev_operational',
    'insurance_rev_operational': 'insurance_rev_operational'
}
```

### Label Generation for Visualizations

#### `get_operational_labels()`
Generates human-readable labels for cost components:
- `Feedstock Cost`
- `Labor Cost`
- `Utility Cost`
- `Maintenance Cost`
- `Insurance Cost`

#### `get_revenue_labels()`
Generates human-readable labels for revenue components:
- `Feedstock Revenue`
- `Labor Revenue`
- `Utility Revenue`
- `Maintenance Revenue`
- `Insurance Revenue`

## Integration Patterns

### Usage in Main Modules
```python
from keyword_constants import get_keyword, get_column_names

# Get column names for DataFrame
columns = get_column_names()
REVENUE_COL = columns['revenue']
EXPENSES_COL = columns['expenses']

# Create dynamic variable names
revenue_key = f"{get_keyword('r')}_results"
```

### Dynamic Key Construction
```python
# Build component-specific keys
for component in get_component_names():
    cost_key = f"{component}_{get_keyword('c')}_operational"
    rev_key = f"{component}_{get_keyword('rv')}_operational"
```

### Consistent Labeling
```python
# Generate labels for UI/reports
operational_labels = get_operational_labels()
revenue_labels = get_revenue_labels()
```

## Benefits and Impact

### Code Maintainability
1. **Single Point of Change**: Modify keywords in one location
2. **Reduced Errors**: No typos from repeated string literals
3. **Clear Dependencies**: Easy to track keyword usage

### Scalability
1. **Easy Extension**: Add new keywords without code changes
2. **Component Addition**: New components automatically integrated
3. **Language Support**: Could easily add multi-language support

### Performance Considerations
1. **Import Once**: Keywords loaded at module import
2. **Dictionary Lookups**: O(1) access time
3. **No Runtime Construction**: All strings pre-built

## Usage Guidelines

### Best Practices
1. **Always use functions**: Never hardcode keywords
2. **Maintain consistency**: Use the same access pattern everywhere
3. **Document new keywords**: Add comments for new additions

### Adding New Keywords
```python
# 1. Add to KEYWORDS dictionary
KEYWORDS = {
    ...,
    'new_key': 'new_value'
}

# 2. Create accessor function if needed
def get_new_category_names():
    return [get_keyword(k) for k in ['new_key1', 'new_key2']]

# 3. Update dependent functions
```

### Common Patterns
```python
# Pattern 1: Building dynamic keys
f"{get_keyword('f')}_{get_keyword('c')}s_results"

# Pattern 2: Creating display labels
f"{capitalize_keyword('fs')} {capitalize_keyword('c')}"

# Pattern 3: Iterating components
for component in get_component_names():
    process_component(component)
```

## Future Enhancements

### Potential Extensions
1. **Validation Functions**: Ensure keys exist before use
2. **Type Hints**: Add type annotations for better IDE support
3. **Configuration Loading**: Read keywords from config file
4. **Namespace Support**: Group related keywords
5. **Deprecation Handling**: Manage keyword transitions

### Internationalization Ready
Structure supports easy addition of language mappings:
```python
KEYWORDS_EN = {...}
KEYWORDS_ES = {...}
KEYWORDS_FR = {...}
```