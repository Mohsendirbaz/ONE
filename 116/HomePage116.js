# HomePage.js

**Purpose**: Config

**Functions**: based, to, HomePageContent, handleVersionChange, renderVersionControl and 46 more

**Classes**: const, document.documentElement.classList.add(themeMap[season]);

**Dependencies**: react-tabs/style/react-tabs.css, ./styles/HomePage.CSS/HomePage1.css, ./styles/HomePage.CSS/HomePage2.css, ./styles/HomePage.CSS/HomePage3.css, ./styles/HomePage.CSS/HomePage5.css and 13 more

**Keywords**: import, from, const, usestate, activetab, contentloadingstate, false

## Key Code Sections

### Imports

```
import { useEffect, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import CustomizableImage from './components/modules/CustomizableImage';
import CustomizableTable from './components/modules/CustomizableTable';
# ...and 36 more imports
```

### Function: based

```
function based on runMode
        if (runMode === 'cfa') {
            handleRun();
        } else if (runMode === 'sensitivity') {
            handleRuns();
    # ... more lines ...
```

### Function: to

```
function to satisfy prop requirement
                    />
                )}
                <div className="calculation-options">
                    <div className="calculation-row">
    # ... more lines ...
```

### Class: const

```
class
        const themeMap = {
            'dark': 'dark-theme',
            'light': 'light-theme',
            'creative': 'creative-theme'
        }
```

## File Info

- **Size**: 107.4 KB
- **Lines**: 2496
- **Complexity**: 18

## Additional Details

### Line Statistics

- Average line length: 42.0 characters
- Longest line: 151 characters
- Number of blank lines: 226

### Content Samples

Beginning:
```
import { useEffect, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tab
```

Middle:
```
lly {
            setAnalysisRunning(false);
        }
    };

    const handleSubmitCompleteSet = a
```

End:
```
v>
    );
};

const HomePage = () => {
    return <HomePageContent />;
};

export default HomePage;

```


================================================================================
End of file summary
================================================================================
