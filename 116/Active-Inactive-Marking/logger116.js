# logger.js

**Purpose**: Ui Component

**Description**: * Logger module for active-files-analysis
 * Provides logging functionality that...

**Functions**: getLogFilename, formatMessage, writeToLog

## File Info

- **Size**: 3.1 KB
- **Lines**: 107
- **Complexity**: 4

## Additional Details

### Content Samples

Beginning:
```
/**
 * Logger module for active-files-analysis
 * Provides logging functionality that writes to both
```

Middle:
```
ppendFileSync(logFile, message + '\n', 'utf8');
  } catch (error) {
    console.error(`Failed to wri
```

End:
```
t);
    }
  },

  // Get the log file path
  getLogFile: () => logFile
};

module.exports = logger;

```

