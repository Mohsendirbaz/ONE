# run-active-files-workflow.js

**Purpose**: Data Processing

## File Info

- **Size**: 2.8 KB
- **Lines**: 79
- **Complexity**: 2

## Additional Details

### Line Statistics

- Average line length: 34.6 characters
- Longest line: 93 characters
- Number of blank lines: 16

### Content Samples

Beginning:
```
#!/usr/bin/env node
/**
 * Workflow script to run the active files analysis, marking, and import upd
```

Middle:
```
;
if (options.dryRun) cmdArgs.push('--dry-run');

try {
  // Step 1: Run the active files analysis
 
```

End:
```
r) {
  console.error('\nError running Active Files Workflow:', error.message);
  process.exit(1);
}

```

