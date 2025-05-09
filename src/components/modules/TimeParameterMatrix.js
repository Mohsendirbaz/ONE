import React, { useState, useEffect, useMemo } from 'react';
import capacityTracker from '../../services/CapacityTrackingService';
import '../../styles/HomePage.CSS/TimeParameterMatrix.css';

/**
 * TimeParameterMatrix component
 * 
 * Visualizes parameters and their efficacy periods across time units (years)
 * Highlights conflicts where the degree of freedom constraint is violated
 * 
 * @param {Object} props
 * @param {Object} props.parameters - Object containing parameters with efficacy periods
 * @param {number} props.plantLifetime - The plant lifetime in years
 * @param {Function} props.onConflictClick - Function to call when a conflict is clicked
 */
const TimeParameterMatrix = ({ parameters, plantLifetime = 20, onConflictClick }) => {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedParam, setSelectedParam] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Generate years array from 1 to plantLifetime
  const years = useMemo(() => {
    return Array.from({ length: plantLifetime }, (_, i) => i + 1);
  }, [plantLifetime]);

  // Find all conflicts across parameters and years
  useEffect(() => {
    if (!parameters) return;

    const allConflicts = [];

    Object.entries(parameters).forEach(([paramId, param]) => {
      if (!param.efficacyPeriods || !Array.isArray(param.efficacyPeriods)) return;

      const paramConflicts = capacityTracker.findDegreeOfFreedomConflicts(
        paramId, 
        param.efficacyPeriods, 
        plantLifetime
      );

      paramConflicts.forEach(year => {
        allConflicts.push({ paramId, year });
      });
    });

    setConflicts(allConflicts);
    
    // Update plant lifetime usage
    capacityTracker.updatePlantLifetimeUsage(plantLifetime);
  }, [parameters, plantLifetime]);

  // Check if a cell has a conflict
  const hasConflict = (paramId, year) => {
    return conflicts.some(conflict => 
      conflict.paramId === paramId && conflict.year === year
    );
  };

  // Check if a parameter is active for a specific year
  const isParameterActive = (paramId, year) => {
    const param = parameters[paramId];
    if (!param || !param.efficacyPeriods || !Array.isArray(param.efficacyPeriods)) {
      return false;
    }

    return param.efficacyPeriods.some(period => 
      year >= period.start && year <= period.end
    );
  };

  // Get cell class based on its state
  const getCellClass = (paramId, year) => {
    if (hasConflict(paramId, year)) {
      return 'cell conflict';
    }
    
    if (isParameterActive(paramId, year)) {
      return 'cell active';
    }
    
    return 'cell inactive';
  };

  // Handle cell click
  const handleCellClick = (paramId, year) => {
    setSelectedParam(paramId);
    setSelectedYear(year);
    
    if (hasConflict(paramId, year) && onConflictClick) {
      onConflictClick(paramId, year);
    }
  };

  // Get tooltip content for a cell
  const getTooltipContent = (paramId, year) => {
    const param = parameters[paramId];
    if (!param) return '';

    const isActive = isParameterActive(paramId, year);
    const hasConflictHere = hasConflict(paramId, year);

    let content = `Parameter: ${paramId}\nYear: ${year}\n`;
    
    if (isActive) {
      content += 'Status: Active\n';
      
      // Find which efficacy periods include this year
      const relevantPeriods = param.efficacyPeriods.filter(period => 
        year >= period.start && year <= period.end
      );
      
      if (relevantPeriods.length > 0) {
        content += `Efficacy Periods:\n`;
        relevantPeriods.forEach((period, index) => {
          content += `  ${index + 1}. Years ${period.start}-${period.end}`;
          if (period.value !== undefined) {
            content += ` (Value: ${period.value})`;
          }
          content += '\n';
        });
      }
    } else {
      content += 'Status: Inactive\n';
    }
    
    if (hasConflictHere) {
      content += '\nCONFLICT: Multiple values for this year\n';
      content += 'Click to resolve';
    }
    
    return content;
  };

  // Render the matrix
  return (
    <div className="time-parameter-matrix">
      <h3>Parameter-Time Matrix</h3>
      <div className="matrix-description">
        This matrix shows when parameters are active across the plant lifetime.
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color inactive"></div>
            <span>Inactive</span>
          </div>
          <div className="legend-item">
            <div className="legend-color active"></div>
            <span>Active</span>
          </div>
          <div className="legend-item">
            <div className="legend-color conflict"></div>
            <span>Conflict</span>
          </div>
        </div>
      </div>
      
      <div className="matrix-container">
        <div className="matrix-header">
          <div className="corner-cell"></div>
          {years.map(year => (
            <div key={`year-${year}`} className="year-header">
              {year}
            </div>
          ))}
        </div>
        
        <div className="matrix-body">
          {Object.entries(parameters).map(([paramId, param]) => (
            <div key={`row-${paramId}`} className="matrix-row">
              <div className="param-label">{paramId}</div>
              {years.map(year => {
                const cellId = `${paramId}-${year}`;
                const isHovered = hoveredCell === cellId;
                
                return (
                  <div
                    key={cellId}
                    id={cellId}
                    className={`${getCellClass(paramId, year)} ${isHovered ? 'hovered' : ''}`}
                    onClick={() => handleCellClick(paramId, year)}
                    onMouseEnter={() => setHoveredCell(cellId)}
                    onMouseLeave={() => setHoveredCell(null)}
                    title={getTooltipContent(paramId, year)}
                  >
                    {isHovered && (
                      <div className="cell-tooltip">
                        {getTooltipContent(paramId, year)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {conflicts.length > 0 && (
        <div className="conflicts-summary">
          <h4>Conflicts Detected</h4>
          <p>There are {conflicts.length} conflicts where parameters have multiple values for the same year.</p>
          <p>Click on red cells to resolve conflicts.</p>
        </div>
      )}
    </div>
  );
};

export default TimeParameterMatrix;