FROM node:20 as node
WORKDIR /app
COPY . .
RUN npm ci
RUN npm install -g @angular/cli@18
RUN npm run build

FROM nginx:alpine
COPY --from=node /app/www /usr/share/nginx/html