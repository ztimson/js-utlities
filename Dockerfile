# Build application
FROM node:alpine as build

RUN mkdir /app
WORKDIR /app
COPY . .
RUN if [ ! -d "docs" ]; then npm install && npm run docs; fi

# Use Nginx to serve
FROM nginx:1.23-alpine

COPY --from=build /app/docs /usr/share/nginx/html
