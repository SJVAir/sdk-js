#!/usr/bin/env bash

# Compare local and published versions before building and publishing
package_name=$(node -p -e "require('./package.json').name")
local_version=$(npm pkg -w $package_name get version | head -n 1 | tr -d '"')
published_version=$(npm view $package_name version)

if [[ "$local_version" == "$published_version" ]]; then
  echo "Skipping $package_name as version has not been updated"
  echo -e "local: $local_version\npublished: $published_version"
else
  echo "New version of $package_name found, publishing..."
  npm run build -w $package_name
  npm publish -w $package_name --access public
fi
