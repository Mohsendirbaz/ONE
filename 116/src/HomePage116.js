# HomePage.js

**Purpose**: Config

**Functions**: based, to, HomePageContent, renderVersionControl, handleActiveGroupChange and 46 more

**Classes**: const, document.documentElement.classList.add(themeMap[season]);

**Dependencies**: react-tabs/style/react-tabs.css, ./styles/HomePage.CSS/HCSS.css, ./styles/Themes/dark-theme.css, ./styles/Themes/light-theme.css, ./styles/Themes/creative-theme.css and 15 more

**Keywords**: import, from, useeffect, usestate, tab, tablist, tabpanel

## Key Code Sections

### Imports

```
import { useEffect, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { VersionStateProvider, useVersionState } from './contexts/VersionStateContext';
import CustomizableImage from './components/modules/CustomizableImage';
# ...and 42 more imports
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

- **Size**: 117.4 KB
- **Lines**: 2722
- **Complexity**: 18

## Additional Details

### Line Statistics

- Average line length: 42.2 characters
- Longest line: 168 characters
- Number of blank lines: 252

### Content Samples

Beginning:
```
import { useEffect, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tab
```

Middle:
```
ltaneous calls for the same version
            if (isHtmlFetchInProgress) {
                console
```

End:
```
ovider>
        <HomePageContent />
    </VersionStateProvider>
    );
};

export default HomePage;

```


================================================================================
End of file summary
================================================================================
