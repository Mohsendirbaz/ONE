# ThemeConfigurator.js

**Purpose**: Data Processing

**Functions**: ThemeConfigurator, loadThemeColors, handleColorChange, handleGradientChange, generateGradientString and 6 more

**Dependencies**: ../../styles/HomePage.CSS/HCSS.css

**Keywords**: const, usestate, import, themegenerator, useref, from, react

## Key Code Sections

### Imports

```
import React, { useState, useEffect, useRef } from 'react';
import ThemeGenerator from './ThemeGenerator';
import '../../styles/HomePage.CSS/HCSS.css';
```

### Function: ThemeConfigurator

```
const ThemeConfigurator = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('colors');
  const [colors, setColors] = useState({
    primary: '',
    secondary: '',
    # ... more lines ...
```

### Function: loadThemeColors

```
const loadThemeColors = () => {
    const themeColors = themeGenerator.current.loadCurrentThemeColors();
    setColors({
    primary: themeColors['--primary-color'],
    secondary: themeColors['--secondary-color'],
    # ... more lines ...
```

## File Info

- **Size**: 34.2 KB
- **Lines**: 976
- **Complexity**: 13

## Additional Details

### Line Statistics

- Average line length: 33.9 characters
- Longest line: 112 characters
- Number of blank lines: 74

### Content Samples

Beginning:
```
import React, { useState, useEffect, useRef } from 'react';
import ThemeGenerator from './ThemeGener
```

Middle:
```
.value)}
                  className="color-text-input"
                />
                {colorsCh
```

End:
```
 {saveStatus.message}
        </div>
      )}
    </div>
  );
};

export default ThemeConfigurator;

```


================================================================================
End of file summary
================================================================================
