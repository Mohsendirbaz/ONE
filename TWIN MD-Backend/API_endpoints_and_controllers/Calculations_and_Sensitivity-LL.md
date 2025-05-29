# Calculations_and_Sensitivity-LL.py - Comprehensive Sensitivity Analysis Pipeline

## Architectural Overview

The `Calculations_and_Sensitivity-LL.py` module is an extensive, highly sophisticated sensitivity analysis orchestration service that manages:
- Multi-threaded pipeline execution with event synchronization
- Comprehensive file management with atomic operations
- Integrated visualization generation and organization
- Complex configuration parameter variations
- Real-time status tracking and error handling

### Multi-Level Architecture

#### Level 1: High-Level System Components
```
┌─────────────────────────────────────────────────────────────────┐
│                 Sensitivity Analysis Pipeline                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Pipeline   │  │    File      │  │   Visualization       │  │
│  │   Control    │  │  Management  │  │   Generation          │  │
│  └─────────────┘  └──────────────┘  └───────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │Configuration │  │ Calculation  │  │     Results           │  │
│  │  Variation   │  │  Execution   │  │   Processing          │  │
│  └─────────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Level 2: Core Functionality Components

1. **Pipeline Management System**
   - Event-driven execution control (PAYLOAD_REGISTERED, BASELINE_COMPLETED, CONFIG_COMPLETED, RUNS_COMPLETED)
   - Thread-safe operation with global locks
   - Timeout management and automatic cleanup
   - Pipeline state validation

2. **Sensitivity File Manager**
   - Atomic file operations with filelock
   - Standardized path generation
   - Thread-safe result storage/retrieval
   - Datapoints management for visualization

3. **Configuration Variation Engine**
   - Dynamic parameter modification
   - Multiple variation modes (percentage, directvalue, absolutedeparture, symmetrical, multipoint)
   - Batch configuration processing
   - Economic metrics handling

4. **Visualization System**
   - HTML album organization
   - PNG plot generation
   - Metadata creation
   - Album indexing

#### Level 3: Implementation Architecture

### Core Features and Functionality

#### 1. **Pipeline Execution Control**
```python
# Event flags for sequential execution
PAYLOAD_REGISTERED = threading.Event()
BASELINE_COMPLETED = threading.Event()
CONFIG_COMPLETED = threading.Event()
RUNS_COMPLETED = threading.Event()
PIPELINE_ACTIVE = threading.Event()

# Global locks for synchronization
GLOBAL_CONFIG_LOCK = threading.Lock()
GLOBAL_RUN_LOCK = threading.Lock()
GLOBAL_PRICE_LOCK = threading.Lock()
GLOBAL_VISUALIZE_LOCK = threading.Lock()
GLOBAL_PAYLOAD_LOCK = threading.Lock()
GLOBAL_BASELINE_LOCK = threading.Lock()
```

#### 2. **Sensitivity Analysis Modes**
- **Percentage**: Apply percentage changes to base values
- **Direct Value**: Use specified values directly
- **Absolute Departure**: Add/subtract fixed amounts
- **Symmetrical**: Apply both positive and negative variations
- **Multipoint**: Multiple discrete value points

#### 3. **File Management System**
- Atomic operations with file locking
- Standardized directory structure
- Thread-safe JSON operations
- Automatic backup and recovery

### Key Classes and Components

#### SensitivityFileManager
Comprehensive file management for sensitivity analysis results:

```python
class SensitivityFileManager:
    def __init__(self, base_dir)
    def _get_paths_for_parameter(self, version, param_id, mode, compare_to_key)
    def store_calculation_result(self, version, param_id, result_data, mode, compare_to_key)
    def retrieve_calculation_result(self, version, param_id, mode, compare_to_key)
    def store_datapoints(self, version, datapoints_data)
```

**Key Features**:
- Standardized path generation with mode mapping
- Atomic file operations with 60-second timeout
- Comprehensive error handling and logging
- Thread-safe result storage and retrieval

### Component Props and Data Structures

#### Sensitivity Parameters Structure
```javascript
{
  "S13": {
    "enabled": true,
    "mode": "percentage",
    "values": [10, -10],
    "compareToKey": "S15",
    "comparisonType": "difference",
    "waterfall": true,
    "bar": false,
    "point": true
  },
  "S35": {
    "enabled": true,
    "mode": "multipoint",
    "values": [100, 200, 300, 400],
    "compareToKey": "S13",
    "comparisonType": "primary (x axis)"
  }
}
```

#### Pipeline Status Response
```javascript
{
  "status": "active",
  "stages": {
    "payload_registered": true,
    "baseline_completed": true,
    "config_completed": false,
    "runs_completed": false
  },
  "current_stage": "configuration",
  "message": "Processing sensitivity configurations"
}
```

#### Visualization Metadata Structure
```javascript
{
  "album_id": "HTML_v1_2_3_Revenue",
  "version": "1",
  "versions": [1, 2, 3],
  "plot_type": "Revenue",
  "metric_name": "Revenue",
  "display_name": "Revenue for versions [1, 2, 3]",
  "html_files": ["plot1.html", "plot2.html"],
  "category": "financial_analysis",
  "created": true
}
```

### API Endpoints

#### Pipeline Control Endpoints

##### GET `/status`
Get current pipeline execution status.

**Response**: JSON with pipeline state information

##### POST `/register_payload`
Initialize pipeline with payload data.

**Request Body**: Complete sensitivity analysis configuration

##### POST `/reset_pipeline`
Reset pipeline to initial state.

##### GET `/health`
Always accessible health check endpoint.

#### Calculation Endpoints

##### POST `/baseline_calculation`
Execute baseline calculations without variations.

**Requires**: PAYLOAD_REGISTERED event

##### POST `/sensitivity/configure`
Generate sensitivity configurations.

**Requires**: BASELINE_COMPLETED event

##### POST `/runs`
Execute sensitivity calculations.

**Requires**: CONFIG_COMPLETED event

##### POST `/calculate-sensitivity`
Execute specific sensitivity calculations using CFA-b.py.

**Requires**: RUNS_COMPLETED event

#### Visualization Endpoints

##### POST `/api/sensitivity/visualize`
Generate visualization data for sensitivity analysis.

**Request Body**:
```json
{
  "version": 1,
  "param_id": "S10",
  "mode": "percentage",
  "compareToKey": "S13",
  "plotTypes": ["waterfall", "bar", "point"]
}
```

##### GET `/api/sensitivity/parameters`
Get all available sensitivity parameters.

#### Utility Endpoints

##### POST `/run-all-sensitivity`
Execute full sensitivity pipeline sequentially.

##### POST `/run-script-econ`
Extract economic metrics from CSV files.

##### POST `/run-generate-plots`
Generate sensitivity plots.

##### POST `/run-html-album-organizer`
Organize HTML plots into albums.

##### POST `/run-album-organizer`
Organize PNG plots into albums.

### Usage Patterns and Integration Points

#### 1. **Standard Pipeline Flow**
```
1. /register_payload → PAYLOAD_REGISTERED
2. /baseline_calculation → BASELINE_COMPLETED
3. /sensitivity/configure → CONFIG_COMPLETED
4. /runs → RUNS_COMPLETED
5. /calculate-sensitivity → Analysis Complete
```

#### 2. **Unified Execution Flow**
```
/run-all-sensitivity → Executes all steps sequentially
```

#### 3. **File Organization Flow**
```
Calculation Results → /run-generate-plots → 
/run-html-album-organizer + /run-album-organizer → 
Organized Albums
```

### Threading and Synchronization

#### 1. **Event-Based Control**
- Sequential execution enforcement
- Prerequisite validation
- Automatic event setting on success

#### 2. **Lock Management**
- File-based locks for cross-process synchronization
- Memory locks for thread synchronization
- Timeout handling (180 seconds default)

#### 3. **Decorators for Safety**
```python
@with_file_lock(lock_file_path, operation_name)
@with_memory_lock(lock_obj, operation_name)
@with_pipeline_check(required_event, next_event, operation_name)
```

### Directory Structure

```
Original/
├── Batch({version})/
│   ├── Results({version})/
│   │   ├── Sensitivity/
│   │   │   ├── {Mode}/
│   │   │   │   └── {param_id}_vs_{compare_key}_{mode}_results.json
│   │   │   ├── {param_id}/
│   │   │   │   └── {mode}/
│   │   │   │       └── {variation}/
│   │   │   │           ├── {version}_config_module_{n}.json
│   │   │   │           └── Configuration_Matrix({version}).csv
│   │   │   └── Reports/
│   │   │       ├── calsen_paths.json
│   │   │       └── {param_id}_config.json
│   │   ├── SensitivityPlotDatapoints_{version}.json
│   │   └── HTML_v{versions}_{plot_type}/
│   │       ├── album_metadata.json
│   │       └── *.html
│   └── ConfigurationPlotSpec({version})/
│       └── configurations({version}).py
```

### Best Practices and Considerations

#### 1. **Thread Safety**
- Always use appropriate locks for shared resources
- Implement timeout handling for all locks
- Use atomic file operations for critical data

#### 2. **Error Handling**
- Comprehensive logging at all levels
- Graceful degradation on failures
- Detailed error messages with context

#### 3. **Performance Optimization**
- Batch processing for configuration modules
- Parallel execution where possible
- Efficient file I/O with buffering

#### 4. **Data Integrity**
- Validate all input parameters
- Verify file existence before operations
- Maintain consistent state across failures

### Integration with Other Components

1. **CalSen Service**: Path resolution and configuration discovery
2. **CFA-b.py**: Core sensitivity calculation engine
3. **Front_Subtab_HTML.py**: HTML album serving
4. **Front_Subtab_Plot.py**: PNG album serving
5. **External Visualization Tools**: Plot generation scripts

### Security and Validation

- Input validation for all endpoints
- Path traversal prevention
- Safe file operations with controlled access
- No direct execution of user-provided code
- Comprehensive request logging for audit trails

### Logging Architecture

The module implements multi-level logging:
1. **Main Logger**: General application flow
2. **Sensitivity Logger**: Sensitivity-specific operations
3. **File Manager Logger**: File operation tracking

All logs are stored in:
- `Logs/CALCULATIONS_SENSITIVITY.log`
- `Logs/SENSITIVITY.log`

### Advanced Features

1. **Automatic Pipeline Timeout**: 30-minute default with automatic reset
2. **Dynamic Parameter Discovery**: Automatic detection of S-parameters
3. **Economic Metrics Support**: Special handling for S80-S90
4. **Multi-Version Processing**: Batch operations across versions
5. **Album Indexing**: Automatic creation of searchable indices