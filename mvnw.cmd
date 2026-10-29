@echo off
REM Standard Maven Wrapper command for Windows (trimmed)
SETLOCAL ENABLEDELAYEDEXPANSION
set MAVEN_WRAPPER_DIR=.mvn\wrapper
if not exist "%MAVEN_WRAPPER_DIR%\maven-wrapper.jar" (
  echo Maven wrapper JAR not found: %MAVEN_WRAPPER_DIR%\maven-wrapper.jar
  exit /b 1
)
java -cp "%MAVEN_WRAPPER_DIR%\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain %*
exit /b %ERRORLEVEL%
