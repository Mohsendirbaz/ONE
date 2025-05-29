# sensitivity_api.py - Sensitivity Analysis Sequential API

## Overview
Comprehensive Flask Blueprint providing sequential event-driven sensitivity analysis with state management and orchestration capabilities.

## Key Functionality

### API Endpoints

1. **GET /sensitivity/status**: Current process status
2. **POST /sensitivity/configure**: Initialize sensitivity configuration
3. **POST /sensitivity/copy-configs**: Copy configuration modules
4. **POST /sensitivity/run-baseline**: Execute baseline calculations
5. **POST /sensitivity/run-variations**: Process parameter variations
6. **POST /sensitivity/generate-results**: Generate result files
7. **POST /sensitivity/create-visualizations**: Create plots
8. **POST /sensitivity/complete**: Finalize process
9. **POST /sensitivity/reset**: Reset to idle state
10. **POST /sensitivity/run-all**: Execute complete workflow

### State Machine

```
IDLE → CONFIGURED → CONFIG_COPIED → BASELINE_COMPLETED → 
VARIATIONS_PROCESSED → RESULTS_GENERATED → 
VISUALIZATIONS_CREATED → COMPLETED

(Any state can transition to FAILED on error)
```

### Core Components

1. **Orchestrator Management**
   - Global orchestrator instance
   - State transition validation
   - Error state handling

2. **Background Processing**
   - Asynchronous task execution
   - Progress tracking
   - Error propagation

3. **Handler Functions**
   - configure_handler: Directory creation and file saving
   - copy_config_handler: Configuration module copying
   - baseline_handler: Baseline calculation execution
   - variations_handler: Parameter variation processing
   - results_handler: Result file generation
   - visualizations_handler: Plot creation

## Request/Response Examples

### Configure Request
```json
{
  "selectedVersions": [4],
  "SenParameters": {
    "S35": {
      "enabled": true,
      "mode": "percentage",
      "values": [10, -10],
      "compareToKey": "S13",
      "waterfall": true,
      "bar": true
    }
  },
  "calculationOption": "calculateForPrice",
  "targetRow": 20
}
```

### Status Response
```json
{
  "state": "VARIATIONS_PROCESSED",
  "run_id": "20240115_143022",
  "version": 4,
  "start_time": 1705337422.5,
  "message": "Processing variations",
  "progress": {
    "total": 10,
    "completed": 8
  }
}
```

## Process Workflow

1. **Configuration Phase**
   - Create sensitivity directories
   - Save configuration files
   - Initialize run parameters

2. **Copy Phase**
   - Trigger configuration module copying
   - Wait for file creation
   - Verify configuration existence

3. **Baseline Phase**
   - Execute common Python scripts
   - Run baseline calculation
   - Store baseline results

4. **Variations Phase**
   - Process each enabled parameter
   - Execute CFA-b.py for each variation
   - Extract economic summaries

5. **Results Phase**
   - Aggregate variation results
   - Create structured JSON files
   - Organize by mode and comparison

6. **Visualization Phase**
   - Generate individual parameter plots
   - Create unified visualizations
   - Extract economic data for plotting

## Integration Points

- **SensitivityOrchestrator**: State management
- **CFA-b.py**: Core calculation engine
- **SensitivityFileManager**: Result storage
- **Plot Generation**: Visualization creation
- **Economic Summaries**: Metric extraction

## Error Handling

- State validation before transitions
- Comprehensive error logging
- Failed state with error messages
- Timeout handling for long operations

## Threading Model

- Main thread handles API requests
- Background threads for processing
- Daemon threads for cleanup
- Thread-safe state updates