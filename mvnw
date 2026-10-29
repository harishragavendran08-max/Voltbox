#!/bin/sh
# Maven Wrapper script — downloads Maven if needed and runs it.
# You don't need Maven installed globally; just run ./mvnw instead of mvn.

set -e

WRAPPER_JAR=".mvn/wrapper/maven-wrapper.jar"
WRAPPER_PROPERTIES=".mvn/wrapper/maven-wrapper.properties"

# figure out where we are
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# read the distribution URL from the properties file
if [ -f "$WRAPPER_PROPERTIES" ]; then
  DIST_URL=$(grep "distributionUrl" "$WRAPPER_PROPERTIES" | cut -d'=' -f2-)
fi

MAVEN_HOME="$HOME/.m2/wrapper/dists/apache-maven-3.9.8"
MVN_CMD="$MAVEN_HOME/bin/mvn"

# download maven if we don't have it yet
if [ ! -f "$MVN_CMD" ]; then
  echo "Downloading Maven 3.9.8..."
  mkdir -p "$MAVEN_HOME"
  TMP_ZIP="/tmp/maven-3.9.8.zip"
  curl -sL "$DIST_URL" -o "$TMP_ZIP"
  unzip -qo "$TMP_ZIP" -d "$HOME/.m2/wrapper/dists/"
  # the zip extracts with a nested folder, move contents up
  if [ -d "$HOME/.m2/wrapper/dists/apache-maven-3.9.8" ]; then
    true  # already in the right place
  else
    mv "$HOME/.m2/wrapper/dists/apache-maven-3.9.8"* "$MAVEN_HOME" 2>/dev/null || true
  fi
  rm -f "$TMP_ZIP"
  echo "Maven ready."
fi

exec "$MVN_CMD" "$@"
