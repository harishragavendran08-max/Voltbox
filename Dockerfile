FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

COPY target/voltbox-1.0.0.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
