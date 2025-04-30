# ModEcon Matrix System Implementation

This document provides an overview of the ModEcon Matrix System implementation using the three recommended frameworks:

1. **PostgreSQL** - Primary persistence layer
2. **React with Jotai** - UI components and state management
3. **ClickHouse** - Analytical engine

## System Architecture

The ModEcon Matrix System is built around a multi-dimensional approach to parameter management across versions, zones, and time periods. This architecture enables sophisticated financial modeling by treating all parameters as elements within a unified matrix structure.

### Key Components

- **Matrix State Management System**: The architectural foundation providing a multi-dimensional approach to parameter management
- **Form Values Matrix**: Stores parameter values for each version-zone combination
- **Efficacy System**: Manages time-based activation of parameters
- **Scaling System**: Applies modifications to base values with cumulative effects
- **History Tracking**: Records all state changes for undo/redo functionality
- **CalSen Integration**: Synchronizes state with backend calculation services

## Framework Integration

### 1. PostgreSQL

PostgreSQL serves as the primary persistence layer, providing a solid foundation for storing the complex matrix data structures while maintaining data integrity.

**Key Benefits:**
- Support for multi-dimensional data structures through JSON/JSONB types
- Efficient storage and retrieval of time-series data for the Efficacy System
- Complex queries and aggregations for the Calculation Integration module
- Transactional integrity for History Tracking system

**Implementation Files:**
- `backend/database/postgresql_config.py` - Configuration and utility functions
- `backend/database/initialize_databases.py` - Database initialization script

### 2. React with Jotai

React with Jotai provides the UI components and state management for the ModEcon Matrix System, enabling a reactive and efficient user interface.

**Key Benefits:**
- Jotai's atomic state management approach directly aligns with the matrix-based state system
- Fine-grained reactivity ideal for the matrix-based state system
- Derived state for complex calculations while minimizing re-renders
- Support for the component architecture described in the documentation

**Implementation Files:**
- `src/state/MatrixStateAtoms.js` - Jotai atoms for matrix state management

### 3. ClickHouse

ClickHouse serves as the analytical engine, providing high-performance data processing for simulations and visualizations.

**Key Benefits:**
- Exceptional performance for analytical queries across large datasets
- Columnar storage optimized for time-series data vital for the Efficacy System
- Real-time analysis of scaling impacts and parameter sensitivity
- High-performance for the "Configuration Matrix Generation" requirements

**Implementation Files:**
- `backend/database/clickhouse_config.py` - Configuration and utility functions
- `backend/database/initialize_databases.py` - Database initialization script

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- PostgreSQL (v13 or higher)
- ClickHouse (v21 or higher)

### Automated Installation (Windows)

For Windows users, an installation script is provided to simplify the setup process:

1. Run the installation script:
   ```
   install_packages.bat
   ```

This script will automatically install all required packages for both the backend and frontend, and then verify that the installation was successful.

2. Verify installation manually (optional):
   ```
   python test_installation.py
   ```

3. Initialize databases:
   ```
   cd backend\database
   python initialize_databases.py --with-sample-data
   ```

4. Start the development server:
   ```
   npm start
   ```

### Manual Installation

If you prefer to install packages manually, follow these steps:

#### Backend Setup

1. Install Python dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. Set up environment variables (or use defaults in `.env`):
   ```
   POSTGRES_DB=modecon_matrix
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432

   CLICKHOUSE_HOST=localhost
   CLICKHOUSE_PORT=9000
   CLICKHOUSE_USER=default
   CLICKHOUSE_PASSWORD=
   CLICKHOUSE_DB=modecon_analytics
   ```

3. Initialize databases:
   ```
   cd backend/database
   python initialize_databases.py --with-sample-data
   ```

#### Frontend Setup

1. Install Node.js dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

## Usage

### Matrix State Management

The Matrix State Management System is accessed through Jotai atoms defined in `src/state/MatrixStateAtoms.js`. These atoms provide a reactive interface to the matrix data structure.

Example usage in a React component:

```jsx
import { useAtom } from 'jotai';
import { 
  versionsAtom, 
  activeVersionAtom,
  zonesAtom,
  activeZoneAtom,
  getMatrixValueAtom,
  calculatedValuesAtom
} from '../state/MatrixStateAtoms';

function MatrixEditor() {
  const [versions] = useAtom(versionsAtom);
  const [activeVersion, setActiveVersion] = useAtom(activeVersionAtom);
  const [zones] = useAtom(zonesAtom);
  const [activeZone, setActiveZone] = useAtom(activeZoneAtom);
  const [calculatedValues] = useAtom(calculatedValuesAtom);

  // Example: Get a specific matrix value
  const [growthRateValue, setGrowthRateValue] = useAtom(
    getMatrixValueAtom(activeVersion, activeZone, 'p1')
  );

  // Component implementation...
}
```

### Database Access

The database access functions are defined in `backend/database/postgresql_config.py` and `backend/database/clickhouse_config.py`. These functions provide a clean interface to the databases.

Example usage in a Python backend route:

```python
from database.postgresql_config import get_matrix_value, set_matrix_value
from database.clickhouse_config import get_parameter_sensitivity

# Get a matrix value
value = get_matrix_value('v1', 'z1', 'p1')

# Set a matrix value
set_matrix_value('v1', 'z1', 'p1', {'value': 0.06}, 
                 [{'start': '2025-01-01', 'end': '2030-12-31'}])

# Get sensitivity analysis results
sensitivity = get_parameter_sensitivity('p1', 'npv', 'v1', 'z1')
```

## Data Flow

1. Frontend components interact with Jotai atoms to manage state
2. State changes trigger synchronization with the backend via API calls
3. Backend stores data in PostgreSQL for persistence and ClickHouse for analytics
4. Analytical queries are performed on ClickHouse for visualizations and reports
5. Results are returned to the frontend for display

## Extending the System

When extending the ModEcon Matrix System, developers should:

1. Add new Jotai atoms for new state components in `src/state/MatrixStateAtoms.js`
2. Add new database tables and functions in the database configuration files
3. Update the synchronization functions to include the new state components
4. Add new UI components that use the Jotai atoms
5. Add new API endpoints for the new functionality

## Conclusion

This implementation of the ModEcon Matrix System leverages the strengths of PostgreSQL, React with Jotai, and ClickHouse to create a decent financial modeling platform. The multi-dimensional matrix approach enables sophisticated financial modeling across versions, zones, and time periods, while the chosen frameworks provide the necessary performance, flexibility, and developer experience.
