# ONE1 API Documentation

This repository contains a comprehensive Postman collection for testing all API endpoints in the ONE1 project. The collection is organized by file and includes all endpoints with example requests and responses.

## API Endpoints

The API includes multiple categories of endpoints:

1. **File Association Analysis API**
   - `POST /analyze-project`: Analyzes a project for file associations
   - `POST /generate-insights`: Generates insights from file association analysis data

2. **Calculation and Sensitivity API**
   - `GET /status`: Gets the status of the calculation service
   - `POST /register_payload`: Registers a payload for calculation
   - `POST /baseline_calculation`: Runs a baseline calculation
   - `POST /sensitivity/configure`: Configures sensitivity analysis
   - `POST /calculate-sensitivity`: Runs sensitivity analysis
   - And many more...

3. **PNG and Visualization API**
   - `POST /generate_png_plots`: Generates PNG plots
   - `GET /api/plots/<version>`: Gets plots for a specific version
   - `GET /api/sensitivity-plots/<version>`: Gets sensitivity plots for a specific version

4. **Configuration Management API**
   - `POST /load_configuration`: Loads a configuration
   - `POST /create_new_batch`: Creates a new batch
   - `POST /Remove_batch`: Removes a batch

## How to Import the Collection into Postman

1. Download and install [Postman](https://www.postman.com/downloads/) if you haven't already.
2. Open Postman.
3. Click on the "Import" button in the top left corner.
4. Select the "File" tab and choose the `postman_collection.json` file from this repository.
5. Click "Import" to add the collection to your Postman workspace.

## Generating the Postman Collection

The Postman collection is generated automatically by analyzing the API endpoints in the project. To generate or update the collection:

1. Run the following command:
   ```
   python c_backend_directory_structure.py --analyze_api
   ```

2. This will create or update the `postman_collection.json` file with all API endpoints found in the project.

## Using the Collection

### Prerequisites

Before using the collection, make sure:

1. The ONE1 server is running on `http://localhost:15000`
2. You have the necessary permissions and credentials

### Example: Using the File Association Analysis API

#### Analyze Project

1. In Postman, expand the "ONE1 API" collection.
2. Navigate to the "server.py" folder.
3. Select the "POST /analyze-project" request.
4. In the request body, update the `projectPath` value to point to your project directory.
5. Click the "Send" button to execute the request.
6. The response will contain paths to the generated files.

Example request body:
```json
{
    "projectPath": "C:\\Users\\YourUsername\\YourProject"
}
```

Example response:
```json
{
    "success": true,
    "output": "Analyzing direct imports...\nDirect imports analysis complete. Output saved to file_associations/output/direct_imports_20250429_145846.json\nAnalyzing common ports...\nCommon ports analysis complete. Output saved to file_associations/output/common_ports_20250429_145846.json\nAnalyzing other file associations...\nFile associations analysis complete. Output saved to file_associations/output/file_associations_20250429_145846.json\nSummary report created at file_associations/output/file_associations_summary_20250429_145846.json\n\nGenerating file-level code insights...\nInteractive file-level HTML report generated at file_associations/output/code_insights_20250429_145846.html\n\nGenerating code entity insights...\nEntity insights saved to file_associations/output/entity_insights_20250429_145846.json\nInteractive entity relationship report generated at file_associations/output/entity_insights_20250429_145846.html",
    "files": {
        "summaryFile": "file_associations/output/file_associations_summary_20250429_145846.json",
        "directImportsFile": "file_associations/output/direct_imports_20250429_145846.json",
        "commonPortsFile": "file_associations/output/common_ports_20250429_145846.json",
        "fileAssociationsFile": "file_associations/output/file_associations_20250429_145846.json"
    }
}
```

#### Generate Insights

1. First, run the "Analyze Project" request to generate the necessary files.
2. Select the "POST /generate-insights" request.
3. In the request body, update the `summaryFile` value to match the path returned from the "Analyze Project" response.
4. Click the "Send" button to execute the request.
5. The response will contain paths to the generated HTML reports.

Example request body:
```json
{
    "summaryFile": "file_associations/output/file_associations_summary_20250429_145846.json"
}
```

Example response:
```json
{
    "success": true,
    "output": "Insights generated successfully. HTML file saved to file_associations/output/code_insights_20250429_150112.html\nOpening the HTML file in the default browser...\n",
    "reports": {
        "codeInsightsFile": "file_associations/output/code_insights_20250429_150112.html",
        "entityInsightsFile": "file_associations/output/entity_insights_20250429_150112.html"
    }
}
```

### Example: Using the Calculation and Sensitivity API

#### Get Status

1. Navigate to the "Calculations_and_Sensitivity-LL.py" folder.
2. Select the "GET /status" request.
3. Click the "Send" button to execute the request.
4. The response will contain the status of the calculation service.

#### Run Baseline Calculation

1. Select the "POST /baseline_calculation" request.
2. In the request body, provide the necessary parameters for the calculation.
3. Click the "Send" button to execute the request.
4. The response will contain the results of the calculation.

Example request body:
```json
{
    "version": "v1",
    "parameters": {
        "param1": "value1",
        "param2": "value2"
    }
}
```

## Error Handling

The API returns appropriate error responses in the following cases:

- Invalid request format (not JSON)
- Invalid method (not POST)
- Invalid parameters
- File not found
- Server errors

Example error response:

```json
{
    "success": false,
    "error": "Error generating insights: [Errno 2] No such file or directory: 'invalid/path/to/summary.json'"
}
```

## Troubleshooting

If you encounter issues:

1. Ensure the server is running on port 15000
2. Check that the paths in your requests are valid and accessible
3. Verify that any required files exist before making requests that depend on them
4. Check the server logs for more detailed error information