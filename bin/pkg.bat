@echo off
set arch=%1
set os=%2
set ver=%3

for %%x in (company cookie.chrome cookie.firefox cpp.lint cpp.run github leetcode.cn lintcode solution.discuss) do (
    echo [%%x]
    node bin\leetcode ext -i %%x
)

set dist=dist\
mkdir %dist%
del /q %dist%\*

for /r . %%x in (*.node) do copy %%x %dist%
npm run pkg -- node%ver%-%os%-%arch%

set file=leetcode-cli.node%ver%.%os%.%arch%.zip
7z a %file% %dist%