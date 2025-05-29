# Subplot_metadata.py - Subplot Metadata API

## Overview
Flask API service providing metadata about available financial metrics and visualization options for subplot generation.

## Key Functionality

### Endpoint
- **GET /subplotMetadata**: Returns comprehensive metadata for all available subplot metrics

### Available Metrics

1. **Annual Cash Flows (ACF)**
   - Yearly cash flows after taxes
   - Default active in visualizations

2. **Annual Revenues (ARV)**
   - Yearly revenue before expenses
   - Default active in visualizations

3. **Annual Operating Expenses (AOE)**
   - Yearly operating costs
   - Optional visualization

4. **Loan Repayment Terms (LRT)**
   - Yearly loan payment schedules
   - Optional visualization

5. **Depreciation Schedules (DSC)**
   - Annual asset depreciation tracking
   - Optional visualization

6. **State Taxes (STX)**
   - Yearly state tax obligations
   - Optional visualization

7. **Federal Taxes (FTX)**
   - Yearly federal tax payments
   - Optional visualization

8. **Cumulative Cash Flows (CCF)**
   - Running total of cash flows
   - Optional visualization

## Response Structure

```json
{
  "Annual_Cash_Flows": {
    "title": "Annual Cash Flows",
    "description": "Yearly cash flows after taxes",
    "abbreviation": "ACF",
    "yAxisLabel": "Cash Flow ($)",
    "defaultActive": true
  },
  // ... additional metrics
}
```

## Integration Points

- **Frontend Visualization**: Provides metadata for dynamic subplot configuration
- **Plot Generation**: Defines axis labels and metric descriptions
- **User Interface**: Determines default active states for metrics

## Logging Configuration
- File handler: `subplot_metadata.log`
- Console output enabled
- Comprehensive error tracking

## Port Configuration
- Default port: 5011 (configurable via PORT environment variable)
- Debug mode enabled