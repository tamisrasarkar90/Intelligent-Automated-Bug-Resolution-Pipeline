@echo off

set JIRA_API_TOKEN=ATATT3xFfGF0DWAzSjLzVH-UXQPc8h5e8jTt3C7bYwOljVa8GSXjdsmWRMD7GJLmt9Q-dIGS1-ERKK_ewDY631iFW9-BRAqt4IJ1BqTZHtaGo0h09qMnYD8DyL-iQxIjiW7ndyMhPZy9m8H4wyXSwEdvMn6fu8PyPEJa2VPCsBjTcf20YdNWrUg=6A0E8F0E
set JIRA_USER=tamisra.sarkar@hyland.com

cd /d "C:\Users\tsarkar\source\repos\ONBASEAgentWorkSpace"


"C:\Users\tsarkar\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\python.exe" "C:\Users\tsarkar\source\repos\ONBASEAgentWorkSpace\pipeline.py" >> "C:\Users\tsarkar\source\repos\ONBASEAgentWorkSpace\logs\scheduler.log" 2>&1

