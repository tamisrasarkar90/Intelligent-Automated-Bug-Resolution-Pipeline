@echo off

set JIRA_API_TOKEN=%JIRA_API_TOKEN%

cd /d "C:\Users\tsarkar\source\repos\ONBASEAgentWorkSpace"


"C:\Users\tsarkar\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\python.exe" "C:\Users\tsarkar\source\repos\ONBASEAgentWorkSpace\email_reporter.py" >> "C:\Users\tsarkar\source\repos\ONBASEAgentWorkSpace\logs\email_report.log" 2>&1

