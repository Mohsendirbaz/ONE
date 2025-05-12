# Front_Subtab_Table.py

**Purpose**: Data Processing

**Description**: Flask service (port:8007) - Processes CSV files from batch results using pandas

**Functions**: get_versions, get_csv_files

## File Info

- **Size**: 1.9 KB
- **Lines**: 50
- **Complexity**: 12

## Additional Details

### Content Samples

Beginning:
```
"""Flask service (port:8007) - Processes CSV files from batch results using pandas"""
from flask imp
```

Middle:
```
s_path = os.path.join(BASE_PATH, f"Batch({version})", f"Results({version})")
    csv_files: List[Dic
```

End:
```
sv_files)

if __name__ == '__main__':
    versions = get_versions(BASE_PATH)
    app.run(port=8007)

```

