# UsageIndicator.js

**Purpose**: Utility

**Description**: * Renders a usage indicator component that displays the number of times a config...

**Functions**: UsageIndicator, getUsageLevel

## File Info

- **Size**: 2.0 KB
- **Lines**: 66
- **Complexity**: 5

## Additional Details

### Content Samples

Beginning:
```
/**
 * Renders a usage indicator component that displays the number of times a configuration has bee
```

Middle:
```
'very-high';
    if (count >= 50) return 'high';
    if (count >= 20) return 'medium';
    if (count
```

End:
```
">{count}</span>
      <Tooltip id={tooltipId} />
    </div>
  );
};

export default UsageIndicator;
```

