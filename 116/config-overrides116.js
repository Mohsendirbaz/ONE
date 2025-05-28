# config-overrides.js

**Purpose**: Config

**Functions**: override, setupMiddlewares:

## File Info

- **Size**: 3.5 KB
- **Lines**: 96
- **Complexity**: 4

## Additional Details

### Line Statistics

- Average line length: 35.3 characters
- Longest line: 86 characters
- Number of blank lines: 10

### Content Samples

Beginning:
```
module.exports = function override(config, env) {
  // Disable critical dependency warnings for dyna
```

Middle:
```
se,
    "tls": false,
    "os": false,
    "assert": require.resolve("assert/"),
    "util": require
```

End:
```
/,
      require.resolve('./webpack-patches/express-view-patch.js')
    )
  );

  return config;
};

```

