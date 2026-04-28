#!/bin/bash

# Script to bump extension version
# Usage: ./bump-version.sh [major|minor|patch]

set -e

# Default to patch if no argument provided
VERSION_TYPE=${1:-patch}

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo "Current version: $CURRENT_VERSION"

# Parse version components
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Bump version based on type
case $VERSION_TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "Invalid version type. Use: major, minor, or patch"
    exit 1
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "New version: $NEW_VERSION"

# Update package.json
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
else
  # Linux
  sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
fi

echo "✅ Version bumped to $NEW_VERSION"
echo ""
echo "Next steps:"
echo "1. Review and commit the changes"
echo "2. Push to trigger the release workflow"
echo ""
echo "Suggested commit message:"
echo "chore(extension): bump version to v$NEW_VERSION"