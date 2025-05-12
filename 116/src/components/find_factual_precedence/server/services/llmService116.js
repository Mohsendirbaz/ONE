# llmService.js

**Purpose**: Data Processing

**Functions**: getLLMFactualPrecedence, getLLMFilteredFactualPrecedence

**Dependencies**: axios, ../utils/promptGenerator

**Keywords**: const, error, this, return, async, response, content

## File Info

- **Size**: 6.2 KB
- **Lines**: 174
- **Complexity**: 8

## Additional Details

### Content Samples

Beginning:
```
const axios = require('axios');
const { getPromptForField } = require('../utils/promptGenerator');


```

Middle:
```
ceuticals': 'Pharmaceuticals',
            'renewables': 'Renewable Energy',
            'convention
```

End:
```
e');
    }
  });
};

module.exports = { getLLMFactualPrecedence, getLLMFilteredFactualPrecedence };

```

