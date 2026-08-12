.PHONY: api web all kill

kill:
	-lsof -ti :8080 | xargs kill -9 2>/dev/null
	-lsof -ti :5173 | xargs kill -9 2>/dev/null

api: kill
	mvn spring-boot:run -f fecos-api/pom.xml

web: kill
	npm run dev --prefix fecos-web

all: kill
	mvn spring-boot:run -f fecos-api/pom.xml & npm run dev --prefix fecos-web
