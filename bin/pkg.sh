#!/bin/bash -e

arch=$1
os=$2
ver=$3

DIST=./dist
FILE=leetcode-cli.node$ver.$os.$arch.tar.gz

mkdir -p $DIST
rm -rf $DIST/*
rm -rf $FILE

plugins="company cookie.chrome cookie.firefox cpp.lint cpp.run github leetcode.cn lintcode solution.discuss"

for plugin in $plugins; do
  echo "[$plugin]"
  ./bin/leetcode ext -i $plugin
done

find node_modules -name "*.node" -exec cp {} $DIST \;
npm run pkg -- node$ver-$os-$arch

tar zcvf $FILE $DIST
ls -al $FILE
exit 0