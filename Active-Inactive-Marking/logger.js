/**
 * Logger module for active-files-analysis
 * Provides logging functionality that writes to both console and a log file
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir);
  } catch (error) {
    console.error(`Failed to create logs directory: ${error.message}`);
  }
}

// Generate log filename with timestamp
const getLogFilename = () => {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  return path.join(logsDir, `active-files-analysis_${timestamp}.log`);
};

// Create log file
const logFile = getLogFilename();

// Initialize log file with header
try {
  fs.writeFileSync(logFile, `=== Active Files Analysis Log ===\nStarted at: ${new Date().toISOString()}\n\n`, 'utf8');
  console.log(`Log file created at: ${logFile}`);
} catch (error) {
  console.error(`Failed to initialize log file: ${error.message}`);
}

// Format message with timestamp
const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

// Write to log file
const writeToLog = (message) => {
  try {
    fs.appendFileSync(logFile, message + '\n', 'utf8');
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
};

// Logger functions
const logger = {
  // Log info message
  info: (message) => {
    const formattedMessage = formatMessage('INFO', message);
    console.log(message);
    writeToLog(formattedMessage);
  },

  // Log warning message
  warn: (message) => {
    const formattedMessage = formatMessage('WARN', message);
    console.warn(message);
    writeToLog(formattedMessage);
  },

  // Log error message
  error: (message) => {
    const formattedMessage = formatMessage('ERROR', message);
    console.error(message);
    writeToLog(formattedMessage);
  },

  // Log verbose message (only if verbose option is enabled)
  verbose: (message, isVerbose) => {
    if (isVerbose) {
      const formattedMessage = formatMessage('VERBOSE', message);
      console.log(`[VERBOSE] ${message}`);
      writeToLog(formattedMessage);
    }
  },

  // Log a command execution
  command: (command, output, isError = false) => {
    const formattedMessage = formatMessage('COMMAND', `Executing: ${command}`);
    console.log(`Executing: ${command}`);
    writeToLog(formattedMessage);

    if (output) {
      const outputLevel = isError ? 'ERROR' : 'OUTPUT';
      const formattedOutput = formatMessage(outputLevel, output);
      if (isError) {
        console.error(output);
      } else {
        console.log(output);
      }
      writeToLog(formattedOutput);
    }
  },

  // Get the log file path
  getLogFile: () => logFile
};

module.exports = logger;
