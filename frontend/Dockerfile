# Build React
FROM node:20 as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve avec Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf