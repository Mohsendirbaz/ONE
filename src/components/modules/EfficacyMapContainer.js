import React, { useState, useEffect, useCallback } from 'react';
import TimeParameterMatrix from './TimeParameterMatrix';
import ConflictResolutionPanel from './ConflictResolutionPanel';
import capacityTracker from '../../services/CapacityTrackingService';
import '../../styles/HomePage.CSS/EfficacyMapContainer.css';

/**
 * EfficacyMapContainer component
 * 
 * Main container for the efficacy time and degree of freedom visualization
 * Integrates the TimeParameterMatrix and ConflictResolutionPanel components
 * 
 * @param {Object} props
 * @param {Object} props.parameters - Object containing parameters with efficacy periods
 * @param {number} props.plantLifetime - The plant lifetime in years (default: 20)
 * @param {number} props.configurableVersions - The number of configurable versions (default: 20)
 * @param {number} props.scalingGroups - The number of scaling groups (default: 5)
 * @param {Function} props.onParameterUpdate - Function to call when parameters are updated
 */
const EfficacyMapContainer = ({
  parameters = {},
  plantLifetime = 20,
  configurableVersions = 20,
  scalingGroups = 5,
  onParameterUpdate
}) => {
  const [showConflictPanel, setShowConflictPanel] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [conflictingPeriods, setConflictingPeriods] = useState([]);
  const [usageStats, setUsageStats] = useState({});

  // Update capacity limits and usage
  useEffect(() => {
    // Set capacity limits
    capacityTracker.setCapacityLimit('plantLifetime', plantLifetime);
    capacityTracker.setCapacityLimit('configurableVersions', configurableVersions);
    capacityTracker.setCapacityLimit('scalingGroups', scalingGroups);

    // Update usage
    capacityTracker.updatePlantLifetimeUsage(plantLifetime);
    capacityTracker.updateConfigurableVersionsUsage(configurableVersions);
    capacityTracker.updateScalingGroupsUsage(scalingGroups);

    // Get all usage stats
    setUsageStats(capacityTracker.getAllUsageStats());
  }, [plantLifetime, configurableVersions, scalingGroups]);

  // Handle conflict click in the matrix
  const handleConflictClick = useCallback((paramId, year) => {
    // Find the conflicting periods for this parameter and year
    const param = parameters[paramId];
    if (!param || !param.efficacyPeriods) return;

    const periods = param.efficacyPeriods.filter(period => 
      year >= period.start && year <= period.end
    );

    if (periods.length > 1) {
      setSelectedConflict({ paramId, year });
      setConflictingPeriods(periods);
      setShowConflictPanel(true);
    }
  }, [parameters]);

  // Handle conflict resolution
  const handleResolveConflict = useCallback((resolution) => {
    if (!resolution || !selectedConflict || !onParameterUpdate) return;

    const { paramId, year } = selectedConflict;
    const param = parameters[paramId];
    if (!param || !param.efficacyPeriods) return;

    let updatedPeriods = [...param.efficacyPeriods];

    // Apply resolution based on type
    if (resolution.type === 'select') {
      // Keep only the selected period
      updatedPeriods = [param.efficacyPeriods[resolution.keepPeriodIndex]];
    } 
    else if (resolution.type === 'adjust') {
      // Apply adjustments to each period
      updatedPeriods = resolution.adjustments.map(adjustment => {
        if (adjustment.split) {
          // Split the period into two
          const { split, ...periodData } = adjustment;
          return [
            { ...periodData, end: split - 1 },
            { ...periodData, start: split + 1 }
          ];
        }
        return adjustment;
      }).flat();
    } 
    else if (resolution.type === 'custom') {
      // Replace all conflicting periods with a custom one
      const conflictingIndices = param.efficacyPeriods.map((period, index) => 
        year >= period.start && year <= period.end ? index : -1
      ).filter(index => index !== -1);

      // Remove conflicting periods
      updatedPeriods = param.efficacyPeriods.filter((_, index) => 
        !conflictingIndices.includes(index)
      );

      // Add custom period
      updatedPeriods.push({
        start: resolution.customStart,
        end: resolution.customEnd,
        value: param.efficacyPeriods[0].value // Use value from first period
      });
    }

    // Update the parameter
    const updatedParam = {
      ...param,
      efficacyPeriods: updatedPeriods
    };

    // Call the update function
    onParameterUpdate(paramId, updatedParam);

    // Close the panel
    setShowConflictPanel(false);
    setSelectedConflict(null);
    setConflictingPeriods([]);
  }, [selectedConflict, parameters, onParameterUpdate]);

  // Handle cancel conflict resolution
  const handleCancelResolution = useCallback(() => {
    setShowConflictPanel(false);
    setSelectedConflict(null);
    setConflictingPeriods([]);
  }, []);

  return (
    <div className="efficacy-map-container">
      <div className="map-header">
        <h2>Efficacy Time and Degree of Freedom Map</h2>
        <p className="map-description">
          This map visualizes parameter efficacy periods across the plant lifetime.
          The degree of freedom constraint allows only one value per parameter per time unit (year).
        </p>

        <div className="capacity-summary">
          <h3>Capacity Settings</h3>
          <div className="capacity-items">
            <div className="capacity-item">
              <div className="capacity-label">Plant Lifetime:</div>
              <div className="capacity-value">{plantLifetime} years</div>
              <div className="capacity-bar">
                <div 
                  className="capacity-fill" 
                  style={{ 
                    width: `${usageStats.plantLifetime?.percentage || 0}%`,
                    backgroundColor: getColorForPercentage(usageStats.plantLifetime?.percentage || 0)
                  }}
                ></div>
              </div>
            </div>

            <div className="capacity-item">
              <div className="capacity-label">Configurable Versions:</div>
              <div className="capacity-value">{configurableVersions}</div>
              <div className="capacity-bar">
                <div 
                  className="capacity-fill" 
                  style={{ 
                    width: `${usageStats.configurableVersions?.percentage || 0}%`,
                    backgroundColor: getColorForPercentage(usageStats.configurableVersions?.percentage || 0)
                  }}
                ></div>
              </div>
            </div>

            <div className="capacity-item">
              <div className="capacity-label">Scaling Groups:</div>
              <div className="capacity-value">{scalingGroups}</div>
              <div className="capacity-bar">
                <div 
                  className="capacity-fill" 
                  style={{ 
                    width: `${usageStats.scalingGroups?.percentage || 0}%`,
                    backgroundColor: getColorForPercentage(usageStats.scalingGroups?.percentage || 0)
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="exclusion-note">
          <h4>Exclusions from Combinatorial Calculations</h4>
          <p>
            The following elements are excluded from combinatorial calculations to maintain focus on the core parameters:
          </p>
          <ul>
            <li><strong>Number of plots</strong> - These are considered trivial multipliers and are excluded from capacity calculations</li>
            <li><strong>Interchangeable x and y axes</strong> - These are treated as a single configuration option</li>
            <li><strong>Zones</strong> - Currently only one area is considered for calculations</li>
          </ul>
          <p>
            These exclusions help maintain a clear focus on the degree of freedom constraint: one value per parameter per time unit (year).
          </p>
        </div>
      </div>

      <div className="map-content">
        <TimeParameterMatrix 
          parameters={parameters}
          plantLifetime={plantLifetime}
          onConflictClick={handleConflictClick}
        />
      </div>

      {showConflictPanel && (
        <div className="conflict-panel-overlay">
          <ConflictResolutionPanel 
            paramId={selectedConflict?.paramId}
            year={selectedConflict?.year}
            conflictingPeriods={conflictingPeriods}
            onResolve={handleResolveConflict}
            onCancel={handleCancelResolution}
          />
        </div>
      )}
    </div>
  );
};

// Helper function to get color based on percentage
const getColorForPercentage = (percentage) => {
  if (percentage > 90) return '#ff4d4d'; // Red
  if (percentage > 70) return '#ffaa33'; // Orange
  return '#4caf50'; // Green
};

export default EfficacyMapContainer;
