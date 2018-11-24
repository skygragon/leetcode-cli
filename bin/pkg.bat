@echo off
set arch=%1
set os=%2
set ver=%3

set dist=dist\
set file=leetcode-cli.node%ver%.%os%.%arch%.zip

mkdir %dist%
del /q %dist%\*
del /q *.zip

for %%x in (company cookie.chrome cookie.firefox cpp.lint cpp.run github leetcode.cn lintcode solution.discuss) do (
    echo [%%x]
    node bin\leetcode ext -i %%x
    if %ERRORLEVEL% gtr 0 exit /b 1
)

for /r . %%x in (*.node) do copy %%x %dist%
call npm run pkg -- node%ver%-%os%-%arch%
if %ERRORLEVEL% gtr 0 exit /b 1

7z a %file% %dist%
if %ERRORLEVEL% gtr 0 exit /b 1
exit 0