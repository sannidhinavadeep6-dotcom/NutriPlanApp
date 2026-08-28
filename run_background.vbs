Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Run python start.py --no-browser in completely hidden mode (window style 0)
WshShell.CurrentDirectory = currentDir
WshShell.Run "python start.py --no-browser", 0, False
Set WshShell = Nothing
Set fso = Nothing
