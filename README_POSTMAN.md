# File Association Analysis API - Postman Collection

This repository contains a Postman collection for testing the File Association Analysis API. The collection includes all the API endpoints with example requests and responses.

## API Endpoints

The API has two main endpoints:

1. **Analyze Project** (`POST /analyze-project`)
   - Analyzes a project for file associations
   - Returns paths to the generated files

2. **Generate Insights** (`POST /generate-insights`)
   - Generates insights from the file association analysis data
   - Returns paths to the generated HTML reports

## How to Import the Collection into Postman

1. Download and install [Postman](https://www.postman.com/downloads/) if you haven't already.
2. Open Postman.
3. Click on the "Import" button in the top left corner.
4. Select the "File" tab and choose the `postman_collection.json` file from this repository.
5. Click "Import" to add the collection to your Postman workspace.

## Using the Collection

### Prerequisites

Before using the collection, make sure:

1. The File Association Analysis server is running on `http://localhost:15000`
2. You have the necessary project files and directories set up

### Testing the Analyze Project Endpoint

1. In Postman, expand the "File Association Analysis API" collection.
2. Select the "Analyze Project" request.
3. In the request body, update the `projectPath` value to point to your project directory.
4. Click the "Send" button to execute the request.
5. The response will contain paths to the generated files.

Example request body:
```json
{
    "projectPath": "C:\\Users\\YourUsername\\YourProject"
}
```

### Testing the Generate Insights Endpoint

1. First, run the "Analyze Project" request to generate the necessary files.
2. Select the "Generate Insights" request.
3. In the request body, update the `summaryFile` value to match the path returned from the "Analyze Project" response.
4. Click the "Send" button to execute the request.
5. The response will contain paths to the generated HTML reports.

Example request body:
```json
{
    "summaryFile": "file_associations/output/file_associations_summary_20250429_145846.json"
}
```

## Response Examples

### Successful Analyze Project Response

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

### Successful Generate Insights Response

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
2. Check that the project paths in your requests are valid and accessible
3. Verify that the summary file exists before running the Generate Insights request
4. Check the server logs for more detailed error information