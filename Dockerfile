# Build application
FROM node:alpine as build

RUN mkdir /app
WORKDIR /app
COPY . .
RUN if [ ! -d "node_modules" ]; then npm i; fi && \
    if [ ! -d "dist" ]; then npm run docs; fi

# Use Nginx to serve
FROM nginx:1.23-alpine

RUN npm i fast-xml-parser

COPY --from=build /app/docs /usr/share/nginx/html
