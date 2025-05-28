# run-active-files-analysis.js

**Purpose**: Config

**Functions**: const, to, to, to, to and 5 more

**Dependencies**: eslint, path, fs, child_process, util and 1 more

## Key Code Sections

### Function: const

```
function
const execAsync = util.promisify(exec);

```

### Function: to

```
function to log verbose messages
```

## File Info

- **Size**: 25.4 KB
- **Lines**: 644
- **Complexity**: 7

## Additional Details

### Line Statistics

- Average line length: 38.4 characters
- Longest line: 135 characters
- Number of blank lines: 84

### Content Samples

Beginning:
```
#!/usr/bin/env node
/**
 * Script to run the active-files-tracker ESLint rule
 * This will analyze t
```

Middle:
```
       }

        if (!ruleApplied) {
          logger.warn('WARNING: The active-files-tracker rule 
```

End:
```
Files Tracker - Script Failed');
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

```


================================================================================
End of file summary
================================================================================
