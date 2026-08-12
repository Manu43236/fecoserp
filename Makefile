.PHONY: api web all

api:
	mvn spring-boot:run -f fecos-api/pom.xml

web:
	npm run dev --prefix fecos-web

all:
	mvn spring-boot:run -f fecos-api/pom.xml & npm run dev --prefix fecos-web
