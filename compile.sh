#!/bin/bash

# Paths
SRC_DIR="."
TEST_DIR="tests"
LIB_DIR="lib"
BIN_DIR="bin"

JUNIT_JAR="$LIB_DIR/junit-4.13.2.jar"
HAMCREST_JAR="$LIB_DIR/hamcrest-core-1.3.jar"
CLASSPATH="$SRC_DIR:$JUNIT_JAR:$HAMCREST_JAR"

# Create bin folder if not exists
mkdir -p $BIN_DIR

echo "🔧 Compiling project sources..."
find . -name "*.java" -not -path "./$LIB_DIR/*" > sources.txt
javac -cp "$CLASSPATH" -d $BIN_DIR @sources.txt

if [ $? -eq 0 ]; then
  echo "✅ Compilation successful."

  echo "🧪 Running tests..."
  java -cp "$BIN_DIR:$CLASSPATH" org.junit.runner.JUnitCore tests.UsageDefinitionTest

  # Add more test classes below if needed:
  # java -cp "$BIN_DIR:$CLASSPATH" org.junit.runner.JUnitCore tests.ByteSizeTest
else
  echo "❌ Compilation failed."
fi

# Cleanup
rm -f sources.txt
#!/bin/bash

# Paths
SRC_DIR="."
TEST_DIR="tests"
LIB_DIR="lib"
BIN_DIR="bin"

JUNIT_JAR="$LIB_DIR/junit-4.13.2.jar"
HAMCREST_JAR="$LIB_DIR/hamcrest-core-1.3.jar"
CLASSPATH="$SRC_DIR:$JUNIT_JAR:$HAMCREST_JAR"

# Create bin folder if not exists
mkdir -p $BIN_DIR

echo "🔧 Compiling project sources..."
find . -name "*.java" -not -path "./$LIB_DIR/*" > sources.txt
javac -cp "$CLASSPATH" -d $BIN_DIR @sources.txt

if [ $? -eq 0 ]; then
  echo "✅ Compilation successful."

  echo "🧪 Running tests..."
  java -cp "$BIN_DIR:$CLASSPATH" org.junit.runner.JUnitCore tests.UsageDefinitionTest

  # Add more test classes below if needed:
  # java -cp "$BIN_DIR:$CLASSPATH" org.junit.runner.JUnitCore tests.ByteSizeTest
else
  echo "❌ Compilation failed."
fi

# Cleanup
rm -f sources.txt
