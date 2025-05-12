# ErrorBoundary.js

**Purpose**: Database

**Classes**: ErrorBoundary

## File Info

- **Size**: 2.4 KB
- **Lines**: 77
- **Complexity**: 8

## Additional Details

### Line Statistics

- Average line length: 30.0 characters
- Longest line: 100 characters
- Number of blank lines: 7

### Content Samples

Beginning:
```
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
   
```

Middle:
```
      <div style={{ marginTop: '10px' }}>
              <p style={{ color: 'var(--model-color-error,
```

End:
```
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

```

