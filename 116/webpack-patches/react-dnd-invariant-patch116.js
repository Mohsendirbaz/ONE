# react-dnd-invariant-patch.js

**Purpose**: Data Processing

**Description**: * Patched version of @react-dnd/invariant that doesn't rely on the 'module' obje...

**Functions**: invariant

## File Info

- **Size**: 1.0 KB
- **Lines**: 37
- **Complexity**: 6

## Additional Details

### Content Samples

Beginning:
```
/**
 * Patched version of @react-dnd/invariant that doesn't rely on the 'module' object
 */

functio
```

Middle:
```
 );
      } else {
        let argIndex = 0;
        error = new Error(
          format.replace(/%s
```

End:
```
riant;
  exports.__esModule = true;
  module.exports = exports.default;
}

export default invariant;
```

