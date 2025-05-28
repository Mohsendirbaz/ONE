@echo off
echo Creating junie-intellij-plugin directory structure...

cd junie-intellij-plugin

REM Create claude directory and its files
mkdir src\main\java\com\junie\plugin\claude
echo // Claude API Client > src\main\java\com\junie\plugin\claude\ClaudeApiClient.java
echo // Claude API Service > src\main\java\com\junie\plugin\claude\ClaudeApiService.java
echo // Claude Models > src\main\java\com\junie\plugin\claude\ClaudeModels.java
echo // Claude Settings > src\main\java\com\junie\plugin\claude\ClaudeSettings.java

REM Create claude/terminal directory and its files
mkdir src\main\java\com\junie\plugin\claude\terminal
echo // Claude Command Handler > src\main\java\com\junie\plugin\claude\terminal\ClaudeCommandHandler.java
echo // Claude Command Provider > src\main\java\com\junie\plugin\claude\terminal\ClaudeCommandProvider.java
echo // Claude Completion Provider > src\main\java\com\junie\plugin\claude\terminal\ClaudeCompletionProvider.java
echo // Terminal Output Printer > src\main\java\com\junie\plugin\claude\terminal\TerminalOutputPrinter.java

REM Create ai/multiagent/conditions directory and its files
mkdir src\main\java\com\junie\plugin\ai\multiagent\conditions
echo // Access Condition > src\main\java\com\junie\plugin\ai\multiagent\conditions\AccessCondition.java
echo // Condition Registry > src\main\java\com\junie\plugin\ai\multiagent\conditions\ConditionRegistry.java
echo // Configurable Condition > src\main\java\com\junie\plugin\ai\multiagent\conditions\ConfigurableCondition.java
echo // Time Based Condition > src\main\java\com\junie\plugin\ai\multiagent\conditions\TimeBasedCondition.java
echo // Agent Based Condition > src\main\java\com\junie\plugin\ai\multiagent\conditions\AgentBasedCondition.java
echo // Status Based Condition > src\main\java\com\junie\plugin\ai\multiagent\conditions\StatusBasedCondition.java
echo // Dependency Condition > src\main\java\com\junie\plugin\ai\multiagent\conditions\DependencyCondition.java
echo // Scripted Condition > src\main\java\com\junie\plugin\ai\multiagent\conditions\ScriptedCondition.java

REM Create ai/multiagent/access directory and its files
mkdir src\main\java\com\junie\plugin\ai\multiagent\access
echo // Conditional Access Manager > src\main\java\com\junie\plugin\ai\multiagent\access\ConditionalAccessManager.java

REM Create ai/multiagent/agent directory and its files
mkdir src\main\java\com\junie\plugin\ai\multiagent\agent
echo // Base Agent > src\main\java\com\junie\plugin\ai\multiagent\agent\BaseAgent.java

REM Create ai/multiagent/services directory and its files
mkdir src\main\java\com\junie\plugin\ai\multiagent\services
echo // Agent Coordinator Service > src\main\java\com\junie\plugin\ai\multiagent\services\AgentCoordinatorService.java

REM Create web directory and its files
mkdir src\main\java\com\junie\plugin\web

REM Create web/components directory and its files
mkdir src\main\java\com\junie\plugin\web\components
echo // Station Manager > src\main\java\com\junie\plugin\web\components\StationManager.js
echo /* Station Manager CSS */ > src\main\java\com\junie\plugin\web\components\StationManager.css

REM Create web/components/monitoring directory and its files
mkdir src\main\java\com\junie\plugin\web\components\monitoring
echo // Monitoring Panel > src\main\java\com\junie\plugin\web\components\monitoring\MonitoringPanel.js
echo // Station Status Monitor > src\main\java\com\junie\plugin\web\components\monitoring\StationStatusMonitor.js
echo // Agent Activity Log > src\main\java\com\junie\plugin\web\components\monitoring\AgentActivityLog.js
echo // Prompt Channel > src\main\java\com\junie\plugin\web\components\monitoring\PromptChannel.js
echo // Task Controls > src\main\java\com\junie\plugin\web\components\monitoring\TaskControls.js

REM Create web/logic directory and its files
mkdir src\main\java\com\junie\plugin\web\logic
echo // Reporting Logic > src\main\java\com\junie\plugin\web\logic\reportingLogic.js

REM Create web root files
echo // Task Scheduler App > src\main\java\com\junie\plugin\web\TaskSchedulerApp.js
echo // Task Scheduler Views > src\main\java\com\junie\plugin\web\TaskSchedulerViews.js
echo // Task Scheduler API > src\main\java\com\junie\plugin\web\taskSchedulerApi.js
echo /* Monitoring Panel CSS */ > src\main\java\com\junie\plugin\web\MonitoringPanel.css

echo Directory structure created successfully!
cd ..