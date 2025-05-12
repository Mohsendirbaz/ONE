# tab_system_integration.js

**Purpose**: Data Processing

**Functions**: FinancialEntityAnalysisTab, fetchFileContent, fetchPythonFiles, analyzeFiles, combineAnalysisResults and 7 more

**Keywords**: import, from, usestate, const, null, react, useeffect

## Key Code Sections

### Imports

```
import React, { useState, useEffect } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { CalculationFlowAnalyzer } from '../core/calculation_flow_analyzer';
import { ParameterDependencyTracker } from '../core/parameter_dependency_tracker';
import { SensitivityModelAnalyzer } from '../core/sensitivity_model_analyzer';
# ...and 11 more imports
```

### Function: FinancialEntityAnalysisTab

```
const FinancialEntityAnalysisTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('calculationFlow');
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);
    # ... more lines ...
```

## File Info

- **Size**: 29.4 KB
- **Lines**: 799
- **Complexity**: 22

## Additional Details

### Line Statistics

- Average line length: 35.6 characters
- Longest line: 130 characters
- Number of blank lines: 97

### Content Samples

Beginning:
```
import React, { useState, useEffect } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 're
```

Middle:
```
timizationCode = (version) => {
    return `
# Optimization Module v${version}
import numpy as np
fr
```

End:
```
             )}
            </div>
          </TabPanel>
        </Tabs>
      )}
    </div>
  );
};
```


================================================================================
End of file summary
================================================================================
