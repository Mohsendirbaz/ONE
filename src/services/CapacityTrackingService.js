/**
 * CapacityTrackingService.js
 * 
 * Service for tracking capacity utilization across different components of the application.
 * This service allows setting capacity limits for various features and calculating
 * what percentage of the theoretical capacity is being utilized.
 */

class CapacityTrackingService {
  constructor() {
    // Default capacity limits for different components
    this.capacityLimits = {
      // SensitivityMonitor: Maximum number of sensitivity variables that can be configured
      sensitivityVariables: 6,

      // ScalingGroups: Maximum number of scaling groups
      scalingGroups: 5,

      // ConfigurableVersions: Maximum number of configurable versions
      configurableVersions: 20,

      // PlantLifetime: Maximum number of years in plant lifetime
      plantLifetime: 20,

      // Other components can be added here as needed
    };

    // Store for current usage counts
    this.currentUsage = {
      sensitivityVariables: 0,
      scalingGroups: 0,
      configurableVersions: 0,
      plantLifetime: 0,
    };
  }

  /**
   * Set a capacity limit for a specific component
   * @param {string} componentKey - The component identifier
   * @param {number} limit - The maximum capacity value
   */
  setCapacityLimit(componentKey, limit) {
    if (typeof limit !== 'number' || limit <= 0) {
      throw new Error('Capacity limit must be a positive number');
    }

    this.capacityLimits[componentKey] = limit;
    return this.capacityLimits[componentKey];
  }

  /**
   * Get the current capacity limit for a component
   * @param {string} componentKey - The component identifier
   * @returns {number} The current capacity limit
   */
  getCapacityLimit(componentKey) {
    return this.capacityLimits[componentKey] || 0;
  }

  /**
   * Update the current usage count for a component
   * @param {string} componentKey - The component identifier
   * @param {number} count - The current usage count
   */
  updateUsageCount(componentKey, count) {
    if (typeof count !== 'number' || count < 0) {
      throw new Error('Usage count must be a non-negative number');
    }

    this.currentUsage[componentKey] = count;
    return this.currentUsage[componentKey];
  }

  /**
   * Get the current usage count for a component
   * @param {string} componentKey - The component identifier
   * @returns {number} The current usage count
   */
  getUsageCount(componentKey) {
    return this.currentUsage[componentKey] || 0;
  }

  /**
   * Calculate the usage percentage for a component
   * @param {string} componentKey - The component identifier
   * @returns {number} The usage percentage (0-100)
   */
  getUsagePercentage(componentKey) {
    const limit = this.getCapacityLimit(componentKey);
    const usage = this.getUsageCount(componentKey);

    if (limit <= 0) return 0;

    const percentage = (usage / limit) * 100;
    return Math.min(Math.round(percentage * 10) / 10, 100); // Round to 1 decimal place, cap at 100%
  }

  /**
   * Get usage statistics for all tracked components
   * @returns {Object} Object containing usage statistics for all components
   */
  getAllUsageStats() {
    const stats = {};

    for (const componentKey in this.capacityLimits) {
      stats[componentKey] = {
        limit: this.getCapacityLimit(componentKey),
        usage: this.getUsageCount(componentKey),
        percentage: this.getUsagePercentage(componentKey)
      };
    }

    return stats;
  }

  /**
   * Calculate the usage percentage for sensitivity variables
   * Counts how many sensitivity variables (S10-S84) are enabled
   * @param {Object} sensitivityState - The S state object from SensitivityMonitor
   * @returns {number} The usage percentage
   */
  updateSensitivityUsage(sensitivityState) {
    if (!sensitivityState) return 0;

    // Count enabled sensitivity variables
    const enabledCount = Object.values(sensitivityState)
      .filter(value => value.enabled)
      .length;

    this.updateUsageCount('sensitivityVariables', enabledCount);
    return this.getUsagePercentage('sensitivityVariables');
  }

  /**
   * Calculate the usage percentage for scaling groups
   * @param {Array} scalingGroups - The scaling groups array
   * @returns {number} The usage percentage
   */
  updateScalingGroupsUsage(scalingGroups) {
    if (!Array.isArray(scalingGroups)) return 0;

    this.updateUsageCount('scalingGroups', scalingGroups.length);
    return this.getUsagePercentage('scalingGroups');
  }

  /**
   * Calculate the usage percentage for configurable versions
   * @param {number} versionsCount - The number of configurable versions in use
   * @returns {number} The usage percentage
   */
  updateConfigurableVersionsUsage(versionsCount) {
    if (typeof versionsCount !== 'number' || versionsCount < 0) return 0;

    this.updateUsageCount('configurableVersions', versionsCount);
    return this.getUsagePercentage('configurableVersions');
  }

  /**
   * Calculate the usage percentage for plant lifetime
   * @param {number} lifetime - The current plant lifetime in years
   * @returns {number} The usage percentage
   */
  updatePlantLifetimeUsage(lifetime) {
    if (typeof lifetime !== 'number' || lifetime < 0) return 0;

    this.updateUsageCount('plantLifetime', lifetime);
    return this.getUsagePercentage('plantLifetime');
  }

  /**
   * Check if a parameter has multiple values for the same time unit
   * This enforces the degree of freedom constraint: one value per parameter per time unit
   * 
   * @param {string} paramId - The parameter identifier
   * @param {number} year - The year to check
   * @param {Array} efficacyPeriods - Array of efficacy periods for the parameter
   * @returns {boolean} True if there's a conflict, false otherwise
   */
  checkDegreeOfFreedomConflict(paramId, year, efficacyPeriods) {
    if (!efficacyPeriods || !Array.isArray(efficacyPeriods)) return false;

    // Count how many efficacy periods include this year
    const periodsForYear = efficacyPeriods.filter(period => {
      return year >= period.start && year <= period.end;
    });

    // If more than one period includes this year, there's a conflict
    return periodsForYear.length > 1;
  }

  /**
   * Find all degree of freedom conflicts for a parameter across all years
   * 
   * @param {string} paramId - The parameter identifier
   * @param {Array} efficacyPeriods - Array of efficacy periods for the parameter
   * @param {number} maxYear - The maximum year to check (typically plant lifetime)
   * @returns {Array} Array of years with conflicts
   */
  findDegreeOfFreedomConflicts(paramId, efficacyPeriods, maxYear = 20) {
    if (!efficacyPeriods || !Array.isArray(efficacyPeriods)) return [];

    const conflicts = [];

    for (let year = 1; year <= maxYear; year++) {
      if (this.checkDegreeOfFreedomConflict(paramId, year, efficacyPeriods)) {
        conflicts.push(year);
      }
    }

    return conflicts;
  }
}

// Create a singleton instance
const capacityTracker = new CapacityTrackingService();

export default capacityTracker;
