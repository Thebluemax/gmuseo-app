FROM node:16 as node
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
FROM nginx:alpine
COPY --from=node /app/www /usr/share/nginx/html