FROM node:24 AS node
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM nginx:alpine
COPY --from=node /app/www /usr/share/nginx/html
