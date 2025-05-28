# logging_utils.py

**Purpose**: Config

**Description**: Logging utilities for the file association tracking system.

This module provide...

**Functions**: configure_logging, get_logger, debug, info, warning and 3 more

## File Info

- **Size**: 3.5 KB
- **Lines**: 123
- **Complexity**: 8

## Additional Details

### Content Samples

Beginning:
```
"""
Logging utilities for the file association tracking system.

This module provides a centralized 
```

Middle:
```
 # Add console handler
    console_handler = logging.StreamHandler(stream or sys.stdout)
    console
```

End:
```
 None:
    """Log an exception message with traceback."""
    logger.exception(msg, *args, **kwargs)
```

