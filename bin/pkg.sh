#!/bin/bash -e

arch=$1
os=$2
ver=$3

plugins="company cookie.chrome cookie.firefox cpp.lint cpp.run github leetcode.cn lintcode solution.discuss"

for plugin in $plugins; do
  echo "[$plugin]"
  ./bin/leetcode ext -i $plugin
done

DIST=./dist
mkdir -p $DIST
rm -rf $DIST/*

find node_modules -name "*.node" -exec cp {} $DIST \;
npm run pkg -- node$ver-$os-$arch

FILE=leetcode-cli.node$ver.$os.$arch.tar.gz
tar zcvf $FILE  $DIST
ls -al $FILE
