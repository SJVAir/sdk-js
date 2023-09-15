#!/usr/bin/env bash

# Ensures provided package name is built

for pkg in "$@"
do
  pkg_dir=$(npm ls -p $pkg)
  if [ ! -d "$pkg_dir/dist" ]
  then
    npm run -w $pkg build
  fi
done
