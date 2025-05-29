# Calculations.py - API Endpoints and Controller

## Architectural Overview

The `Calculations.py` module serves as a central calculation orchestration service that manages:
- Multi-version calculation execution pipelines
- Real-time price optimization streaming via Server-Sent Events (SSE)
- State-based parameter configuration management
- Thread-safe client monitoring system

### Multi-Level Architecture

#### Level 1: High-Level Components
```
┌─────────────────────────────────────────────────────────┐
│                    Flask Application                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Endpoints  │  │   Streaming   │  │  Processing   │  │
│  │   (/run)     │  │  (/stream_*)  │  │   Engine      │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Level 2: Core Functionality Map
- **Script Execution Pipeline**: Sequential execution of configuration and calculation scripts
- **Price Optimization Monitor**: Real-time file watching and SSE event emission
- **State Management System**: Comprehensive V/F/R/RF state configuration handling
- **Logging Infrastructure**: Structured, tabulated logging with detailed parameter tracking

#### Level 3: Implementation Details

### Core Features and Functionality

#### 1. **State Parameter Management**
The system manages multiple state configurations:
- **V States**: V1-V10 (on/off toggles)
- **F States**: F1-F5 (on/off toggles)
- **R States**: R1-R10 (on/off toggles)
- **RF States**: RF1-RF5 (on/off toggles)

#### 2. **Calculation Options**
- `calculateForPrice`: Price optimization workflow with tolerance bounds and adjustment rates

#### 3. **Optimization Parameters**
```python
DEFAULT_TOLERANCE_LOWER = -1000
DEFAULT_TOLERANCE_UPPER = 1000
DEFAULT_INCREASE_RATE = 1.02
DEFAULT_DECREASE_RATE = 0.985
```

### Component Props and Data Structures

#### Request Payload Structure (`/run` endpoint)
```javascript
{
  "selectedVersions": [1, 2, 3],
  "selectedV": {"V1": "on", "V2": "off", ...},
  "selectedF": {"F1": "on", "F2": "off", ...},
  "selectedR": {"R1": "on", "R2": "off", ...},
  "selectedRF": {"RF1": "on", "RF2": "off", ...},
  "selectedCalculationOption": "calculateForPrice",
  "targetRow": 20,
  "SenParameters": {
    "S13": {
      "enabled": true,
      "mode": "percentage",
      "compareToKey": "S15",
      "comparisonType": "difference",
      "waterfall": true,
      "bar": false,
      "point": true
    }
  },
  "optimizationParams": {
    "global": {
      "toleranceLower": -1000,
      "toleranceUpper": 1000,
      "increaseRate": 1.02,
      "decreaseRate": 0.985
    },
    "1": {  // Version-specific overrides
      "toleranceLower": -500,
      "toleranceUpper": 500
    }
  },
  "formValues": {
    "Amount10_key": {"value": 10}  // Year columns configuration
  }
}
```

#### SSE Event Structure (`/stream_price/<version>`)
```javascript
{
  "version": "1",
  "price": 150.25,
  "npv": 25000000,
  "iteration": 15,
  "complete": false,
  "success": true,
  "error": null,
  "timestamp": "2024-01-15T10:30:00",
  "calculationStep": "Optimizing price",
  "calculationDetails": {
    "convergence": 0.95,
    "direction": "increasing"
  },
  "payloadDetails": {
    "enabledV": ["V1", "V3"],
    "enabledF": ["F2"]
  },
  "progressPercentage": 75
}
```

### Key Classes

#### PriceOptimizationMonitor
Thread-safe monitoring class for price optimization status files:

```python
class PriceOptimizationMonitor:
    def __init__(self, version)
    def add_client(self, client_queue)
    def remove_client(self, client_queue)
    def start()
    def stop()
    def _monitor_loop()
```

**Key Features**:
- File change detection with modification time tracking
- Thread-safe client queue management
- Automatic cleanup on completion
- Fallback to optimal price file if status file missing
- Heartbeat mechanism for connection keep-alive

### Usage Patterns and Integration Points

#### 1. **Standard Calculation Flow**
```
Client Request → /run endpoint → Parameter Validation → 
Script Execution Pipeline → Response
```

#### 2. **Real-time Monitoring Flow**
```
Client SSE Connection → /stream_price/<version> → 
PriceOptimizationMonitor → File Watching → 
Event Emission → Client Updates
```

#### 3. **Script Execution Pipeline**
1. Common configuration scripts (formatter, module1, config_modules, Table)
2. Calculation-specific script (CFA.py for price optimization)
3. Optional R script execution with 1-second delay

### API Endpoints

#### POST `/run`
Main calculation execution endpoint.

**Request Headers**: `Content-Type: application/json`

**Response Codes**:
- `200`: Success with JSON response (for calculateForPrice)
- `204`: Success with no content (for other calculation types)
- `400`: Invalid request data
- `500`: Processing error

#### GET `/stream_price/<version>`
Real-time SSE stream for price optimization progress.

**Response**: `text/event-stream` with JSON-formatted events

**Event Types**:
- Connection confirmation
- Progress updates
- Completion notification
- Heartbeat signals
- Error messages

#### GET `/price/<version>`
Retrieve final optimized price results.

**Response**: JSON with price and NPV data

### Logging Architecture

The module implements comprehensive structured logging:

1. **File-based Logging**: `/Logs/CFA_CALC.log`
2. **Tabulated Parameter Display**: Using `tabulate` for sensitivity parameters
3. **Detailed State Logging**: All V/F/R/RF states with enabled/disabled status
4. **Execution Tracking**: Script success/failure with timestamps

### Best Practices and Considerations

#### 1. **Thread Safety**
- Use of Queue for client communication
- Thread-safe monitor instance management
- Proper cleanup on client disconnection

#### 2. **Error Handling**
- Graceful degradation with fallback files
- Consecutive error tracking with automatic shutdown
- Comprehensive exception logging

#### 3. **Performance Optimization**
- 0.5-second file check interval
- 30-second client timeout with heartbeat
- Daemon threads for monitoring

#### 4. **State Management**
- Default states for all parameters
- Version-specific parameter overrides
- Comprehensive validation before execution

### Integration with Other Components

1. **Configuration Management Scripts**:
   - `formatter.py`
   - `module1.py`
   - `config_modules.py`
   - `Table.py`

2. **Calculation Engines**:
   - `CFA.py` (price optimization)

3. **File System Dependencies**:
   - Status files: `price_optimization_status_{version}.json`
   - Result files: `optimal_price_{version}.json`
   - Directory structure: `Original/Batch({version})/Results({version})/`

### Security Considerations

- CORS enabled for cross-origin requests
- Input validation for all parameters
- Safe subprocess execution with controlled arguments
- No direct file path exposure in API responses