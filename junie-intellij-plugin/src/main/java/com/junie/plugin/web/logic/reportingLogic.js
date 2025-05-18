/**
 * Agent Reporting Logic
 *
 * This file defines the required reporting information for agents
 * and the logic for updating station status.
 */

// Reporting Categories
export const REPORTING_CATEGORIES = {
  // Basic status information
  BASIC: {
    status: true,        // Current operational status (active, maintenance, offline, etc.)
    currentLoad: true,   // Current load percentage
    lastUpdated: true    // Last status update timestamp
  },

  // Resource metrics
  RESOURCES: {
    cpuUsage: true,      // CPU usage percentage
    memoryUsage: true,   // Memory usage percentage
    diskSpace: true,     // Available disk space
    networkLatency: true // Network latency in ms
  },

  // Operational metrics
  OPERATIONS: {
    throughput: true,      // Tasks processed per minute
    queueLength: true,     // Number of waiting tasks
    processingTime: true,  // Average processing time
    errorRate: true        // Error rate percentage
  },

  // Security information
  SECURITY: {
    lastScan: true,        // Last security scan timestamp
    vulnerabilities: true, // Number of detected vulnerabilities
    patchStatus: true      // Patch status (up-to-date, outdated, etc.)
  },

  // Agent-specific information
  AGENT_SPECIFIC: {
    agentType: true,       // Type of agent (Architect, Observer, etc.)
    activeTasks: true,     // Currently active tasks
    completedTasks: true,  // Tasks completed in current session
    failedTasks: true      // Failed tasks in current session
  }
};

// Station Status Determination Logic
export function determineStationStatus(metrics) {
  // No metrics available
  if (!metrics || Object.keys(metrics).length === 0) {
    return {
      status: 'unknown',
      reason: 'No metrics available'
    };
  }

  // Check for critical errors
  if (metrics.errorRate > 25) {
    return {
      status: 'error',
      reason: 'High error rate detected',
      details: `Error rate: ${metrics.errorRate}%`
    };
  }

  // Check for warning conditions
  if (metrics.cpuUsage > 80 || metrics.memoryUsage > 80 || metrics.diskSpace < 10) {
    return {
      status: 'warning',
      reason: 'Resource constraints detected',
      details: createResourceWarningDetails(metrics)
    };
  }

  // Check for maintenance mode
  if (metrics.maintenanceMode === true) {
    return {
      status: 'maintenance',
      reason: 'Maintenance mode enabled',
      details: metrics.maintenanceReason || 'Scheduled maintenance'
    };
  }

  // Check if offline
  if (metrics.online === false) {
    return {
      status: 'offline',
      reason: 'Station is offline',
      details: metrics.offlineReason || 'Unknown reason'
    };
  }

  // Default to active if all checks pass
  return {
    status: 'active',
    reason: 'All systems operational',
    details: createActiveStatusDetails(metrics)
  };
}

// Helper function to create resource warning details
function createResourceWarningDetails(metrics) {
  const details = [];

  if (metrics.cpuUsage > 80) {
    details.push(`High CPU usage: ${metrics.cpuUsage}%`);
  }

  if (metrics.memoryUsage > 80) {
    details.push(`High memory usage: ${metrics.memoryUsage}%`);
  }

  if (metrics.diskSpace < 10) {
    details.push(`Low disk space: ${metrics.diskSpace}%`);
  }

  return details.join(', ');
}

// Helper function to create active status details
function createActiveStatusDetails(metrics) {
  return `Load: ${metrics.currentLoad}%, Tasks: ${metrics.activeTasks || 0} active, ${metrics.queueLength || 0} queued`;
}

// Update station with agent reporting data
export function updateStationStatus(station, agentReportData) {
  const metrics = {
    currentLoad: agentReportData.currentLoad || 0,
    cpuUsage: agentReportData.cpuUsage || 0,
    memoryUsage: agentReportData.memoryUsage || 0,
    diskSpace: agentReportData.diskSpace || 100,
    errorRate: agentReportData.errorRate || 0,
    maintenanceMode: agentReportData.maintenanceMode || false,
    maintenanceReason: agentReportData.maintenanceReason,
    online: agentReportData.online !== false, // Default to true if not specified
    offlineReason: agentReportData.offlineReason,
    activeTasks: agentReportData.activeTasks || 0,
    queueLength: agentReportData.queueLength || 0,
    throughput: agentReportData.throughput || 0
  };

  // Determine station status based on metrics
  const statusInfo = determineStationStatus(metrics);

  // Update station object
  const updatedStation = {
    ...station,
    status: statusInfo.status,
    statusReason: statusInfo.reason,
    statusDetails: statusInfo.details,
    lastUpdated: new Date().toISOString(),
    currentLoad: metrics.currentLoad,
    metrics: {
      ...station.metrics,
      ...metrics
    },
    // Mark station as having unreviewed updates
    hasUnreviewedUpdates: true
  };

  return updatedStation;
}

// Format agent task for reporting
export function formatAgentTask(task, agent) {
  return {
    id: task.id,
    title: task.title,
    agent: agent.type,
    status: task.status,
    progress: calculateTaskProgress(task),
    startTime: task.startTime,
    estimatedCompletionTime: calculateEstimatedCompletion(task),
    currentActivity: getCurrentActivity(task),
    promptHistory: task.promptHistory || []
  };
}

// Helper function to calculate task progress
function calculateTaskProgress(task) {
  if (task.progress !== undefined) {
    return task.progress;
  }

  if (task.completedSteps !== undefined && task.totalSteps !== undefined && task.totalSteps > 0) {
    return Math.round((task.completedSteps / task.totalSteps) * 100);
  }

  // Fallback: estimate based on elapsed time vs estimated time
  if (task.startTime && task.estimatedDuration) {
    const elapsed = Date.now() - new Date(task.startTime).getTime();
    const progress = Math.min(100, Math.round((elapsed / task.estimatedDuration) * 100));
    return progress;
  }

  return 0;
}

// Helper function to calculate estimated completion time
function calculateEstimatedCompletion(task) {
  if (task.estimatedCompletionTime) {
    return task.estimatedCompletionTime;
  }

  if (task.startTime && task.estimatedDuration) {
    const startTime = new Date(task.startTime).getTime();
    return new Date(startTime + task.estimatedDuration).toISOString();
  }

  return null;
}

// Helper function to get current activity description
function getCurrentActivity(task) {
  if (task.currentActivity) {
    return task.currentActivity;
  }

  if (task.currentStep && task.steps && task.steps[task.currentStep]) {
    return task.steps[task.currentStep].description;
  }

  return task.status === 'paused'
    ? 'Task is paused'
    : 'Processing task';
}